import type { ConceptSheet } from '../schema';

export const eventSourcing: ConceptSheet = {
  id: 'event-sourcing',
  kind: 'concept',
  title: 'Event Sourcing',
  summary: 'On ne stocke pas l’état courant mais la suite des événements qui l’ont produit ; l’état se recalcule en les rejouant.',
  problem:
    'Une table « solde » dit combien il y a sur le compte, pas pourquoi. L’Event Sourcing garde chaque fait métier (dépôt, retrait, virement) dans un journal en ajout seul : historique complet par construction, audit, possibilité de reconstruire l’état à n’importe quelle date et de créer de nouvelles vues à partir du passé.',
  whenToUse: [
    'L’historique est une exigence métier ou réglementaire (comptes, contrats, dossiers médicaux).',
    'Besoin de savoir « quel était l’état au 31 mars » ou de rejouer pour corriger.',
    'Domaine naturellement fait d’événements (paiements, réservations, logistique).',
  ],
  whenToAvoid: [
    'CRUD ou contenu : un journal d’audit simple suffit.',
    'Équipe sans expérience et délai court : versionner des événements et gérer des projections demande de la maturité.',
    'Quand des données doivent pouvoir être effacées (droit à l’oubli) sans stratégie prévue (chiffrement par clé supprimable, par exemple).',
  ],
  teamSize: 'Plutôt des équipes expérimentées, de 4 à 20 développeurs sur le contexte concerné ; souvent limité aux parties du système qui en ont besoin.',
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code TypeScript du contexte « comptes ».',
      children: [
        {
          name: 'domain',
          kind: 'dir',
          role: 'Événements et agrégat : la source de vérité.',
          children: [
            { name: 'events.ts', kind: 'file', role: 'Types des événements (CompteOuvert, ArgentDepose, ArgentRetire).' },
            { name: 'Compte.ts', kind: 'file', role: 'Agrégat : décide quels événements produire et recalcule son état.' },
          ],
        },
        {
          name: 'infrastructure',
          kind: 'dir',
          role: 'Stockage des événements.',
          children: [{ name: 'EventStore.ts', kind: 'file', role: 'Ajoute et relit les événements d’un flux, avec contrôle de version.' }],
        },
        {
          name: 'projections',
          kind: 'dir',
          role: 'Vues de lecture construites en rejouant les événements (le côté lecture de CQRS).',
          children: [{ name: 'soldes.ts', kind: 'file', role: 'Projection : table des soldes, mise à jour à chaque événement.' }],
        },
      ],
    },
    { name: 'package.json', kind: 'file', role: 'Manifeste Node : dépendances et scripts de test.' },
  ],
  code: {
    language: 'typescript',
    filename: 'src/domain/Compte.ts',
    source: `// Les faits passés, immuables, nommés au passé
type Evenement =
  | { type: 'CompteOuvert'; compteId: string }
  | { type: 'ArgentDepose'; montant: number }
  | { type: 'ArgentRetire'; montant: number };

type EtatCompte = { solde: number; ouvert: boolean };

// L'état n'est pas stocké : on le recalcule en rejouant les événements
export const rejouer = (evenements: Evenement[]): EtatCompte =>
  evenements.reduce<EtatCompte>(
    (etat, e) => {
      switch (e.type) {
        case 'CompteOuvert': return { ...etat, ouvert: true };
        case 'ArgentDepose': return { ...etat, solde: etat.solde + e.montant };
        case 'ArgentRetire': return { ...etat, solde: etat.solde - e.montant };
      }
    },
    { solde: 0, ouvert: false },
  );

// Une décision : vérifier la règle sur l'état, puis produire de nouveaux événements
export function retirer(historique: Evenement[], montant: number): Evenement[] {
  const { solde, ouvert } = rejouer(historique);
  if (!ouvert) throw new Error('Compte fermé');
  if (montant > solde) throw new Error('Solde insuffisant');
  return [{ type: 'ArgentRetire', montant }]; // ajoutés au journal, jamais modifiés
}`,
  },
  pitfalls: [
    'Modifier ou supprimer un événement passé : le journal est en ajout seul, on corrige par un nouvel événement.',
    'Oublier le versionnement : la forme des événements évolue, il faut savoir lire les anciennes versions.',
    'Des flux qui s’allongent sans fin : prévoir des instantanés (snapshots) pour les agrégats très actifs.',
    'Confondre événement du domaine (interne) et message publié aux autres services (contrat public).',
    'L’appliquer à tout le système alors qu’une seule partie a besoin d’historique.',
  ],
  neighbors: ['cqrs', 'architecture-evenementielle'],
  prerequisites: [
    { id: 'cqrs', reason: 'L’Event Sourcing s’appuie presque toujours sur CQRS : on écrit des événements et on lit des projections.' },
  ],
  nextSteps: [
    { id: 'architecture-evenementielle', reason: 'Les événements stockés peuvent aussi être publiés à d’autres services : c’est l’architecture orientée événements.' },
    { id: 'banque-fintech', reason: 'La banque est le secteur où un historique inaltérable est une évidence métier.' },
  ],
  quiz: [
    {
      question: 'Que stocke-t-on en Event Sourcing ?',
      choices: ['L’état courant', 'La suite des événements', 'Uniquement les erreurs', 'Des captures d’écran de la base'],
      answer: 1,
      explanation: 'L’état est dérivé ; la source de vérité est le journal des événements.',
    },
    {
      question: 'Comment corriger un événement erroné ?',
      choices: [
        'Le modifier en base',
        'Le supprimer',
        'Ajouter un événement de correction',
        'Redémarrer le serveur',
      ],
      answer: 2,
      explanation: 'Le journal est en ajout seul, comme une écriture comptable de contre-passation.',
    },
    {
      question: 'À quoi servent les instantanés (snapshots) ?',
      choices: [
        'À remplacer les événements',
        'À éviter de rejouer un très long flux à chaque chargement',
        'À sauvegarder la base',
        'À publier sur Kafka',
      ],
      answer: 1,
      explanation: 'On repart d’un état enregistré puis on rejoue seulement les événements suivants.',
    },
    {
      question: 'Quel avantage est donné « gratuitement » ?',
      choices: ['Des requêtes SQL simples', 'L’historique et l’audit complets', 'Moins de code', 'Pas besoin de tests'],
      answer: 1,
      explanation: 'Chaque changement est un fait conservé : on sait qui, quoi, quand.',
    },
    {
      question: 'Quel point demande une stratégie dès le départ ?',
      choices: [
        'La couleur des logs',
        'Le droit à l’oubli sur des données personnelles',
        'Le choix de l’IDE',
        'Le nom du dépôt Git',
      ],
      answer: 1,
      explanation: 'Un journal immuable et l’effacement s’opposent : il faut prévoir, par exemple, des données chiffrées dont on supprime la clé.',
    },
  ],
  linkedinPost:
    'Votre base vous dit que le solde est de 120 €. Elle ne vous dit pas pourquoi. L’Event Sourcing stocke l’histoire au lieu de la photo : dépôt, retrait, virement. Le solde se recalcule. Puissant pour la banque ou l’assurance. Excessif pour un blog.',
};
