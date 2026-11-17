import type { ConceptSheet } from '../schema';

export const hexagonale: ConceptSheet = {
  id: 'hexagonale',
  kind: 'concept',
  title: 'Architecture hexagonale',
  summary: 'Le métier est au centre et définit des ports (interfaces) ; la base, l’API HTTP ou la messagerie sont des adaptateurs branchés dessus.',
  problem:
    'Rendre le métier indépendant de la technique : on teste les règles sans base ni serveur, et on change de base ou de fournisseur sans réécrire le cœur. Formalisée par Alistair Cockburn sous le nom « Ports and Adapters » (2005).',
  whenToUse: [
    'Métier riche et durable, qui survivra à plusieurs frameworks.',
    'Nombreuses dépendances externes (paiement, e-mail, API partenaires) à isoler ou simuler en test.',
    'Quand on veut des tests rapides du métier, sans infrastructure.',
  ],
  whenToAvoid: [
    'CRUD sans règle : les ports et adaptateurs ajoutent des fichiers sans rien protéger.',
    'Site statique ou application sans base ni fournisseur (comme Archi Map elle-même).',
    'Équipe qui découvre le sujet sous pression de délai : la structure se dégrade vite si elle est mal comprise.',
  ],
  teamSize: 'De 3 à 30 développeurs par application ; fréquent dans les banques, assurances et SaaS au métier riche.',
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code TypeScript, rangé du centre (domaine) vers l’extérieur (adaptateurs).',
      children: [
        {
          name: 'domain',
          kind: 'dir',
          role: 'Le centre : règles métier pures, aucune dépendance vers un framework.',
          children: [
            { name: 'Virement.ts', kind: 'file', role: 'Entité Virement et ses règles (plafond, compte bloqué).' },
            { name: 'ports.ts', kind: 'file', role: 'Interfaces dont le domaine a besoin : ComptesPort, NotificationPort.' },
          ],
        },
        {
          name: 'application',
          kind: 'dir',
          role: 'Cas d’usage : orchestrent le domaine à travers les ports.',
          children: [{ name: 'EffectuerVirement.ts', kind: 'file', role: 'Cas d’usage « effectuer un virement ».' }],
        },
        {
          name: 'adapters',
          kind: 'dir',
          role: 'L’extérieur : implémentations techniques des ports.',
          children: [
            { name: 'http/virementRoutes.ts', kind: 'file', role: 'Adaptateur entrant : transforme une requête HTTP en appel du cas d’usage.' },
            { name: 'postgres/PostgresComptes.ts', kind: 'file', role: 'Adaptateur sortant : implémente ComptesPort avec PostgreSQL.' },
            { name: 'memory/InMemoryComptes.ts', kind: 'file', role: 'Adaptateur de test : ComptesPort en mémoire, pour des tests rapides.' },
          ],
        },
        { name: 'main.ts', kind: 'file', role: 'Composition : choisit quels adaptateurs brancher sur quels ports.' },
      ],
    },
    { name: 'package.json', kind: 'file', role: 'Manifeste Node : dépendances (Fastify, pg) et scripts de test.' },
    { name: 'tsconfig.json', kind: 'file', role: 'Options du compilateur TypeScript (mode strict).' },
  ],
  code: {
    language: 'typescript',
    filename: 'src/application/EffectuerVirement.ts',
    source: `// Port défini PAR le domaine : il dit ce dont il a besoin, pas comment.
export interface ComptesPort {
  trouver(id: string): Promise<Compte>;
  enregistrer(compte: Compte): Promise<void>;
}

// Cas d'usage : ne connaît que des ports, jamais PostgreSQL ni Fastify.
export class EffectuerVirement {
  constructor(private readonly comptes: ComptesPort) {}

  async executer(depuis: string, vers: string, montantCentimes: number) {
    const source = await this.comptes.trouver(depuis);
    const cible = await this.comptes.trouver(vers);

    source.debiter(montantCentimes); // la règle (solde, plafond) vit dans l'entité
    cible.crediter(montantCentimes);

    await this.comptes.enregistrer(source);
    await this.comptes.enregistrer(cible);
  }
}

// main.ts : on branche l'adaptateur voulu
// new EffectuerVirement(new PostgresComptes(pool))   en production
// new EffectuerVirement(new InMemoryComptes())       dans les tests`,
  },
  pitfalls: [
    'Des ports qui fuient la technique (un port qui renvoie une entité ORM ou un objet de requête HTTP).',
    'Un port par table : on recrée la couche d’accès aux données avec plus de fichiers.',
    'Oublier la transaction : la garantir à travers les ports demande un choix explicite (unité de travail).',
    'L’appliquer partout, y compris aux modules CRUD qui n’en ont pas besoin.',
  ],
  neighbors: ['architecture-en-couches', 'clean-onion', 'ddd'],
  prerequisites: [
    { id: 'architecture-en-couches', reason: 'L’hexagonale se comprend comme une correction des couches : il faut voir le problème qu’elle règle.' },
  ],
  nextSteps: [
    { id: 'clean-onion', reason: 'Clean et Onion reprennent la même règle de dépendance avec un découpage plus détaillé.' },
    { id: 'ddd', reason: 'Le DDD remplit le centre de l’hexagone avec un vrai modèle métier.' },
    { id: 'banque-fintech', reason: 'La banque est un secteur où isoler le métier des systèmes externes paie le plus.' },
  ],
  quiz: [
    {
      question: 'Qui définit l’interface d’un port sortant (ex. accès aux comptes) ?',
      choices: ['L’adaptateur PostgreSQL', 'Le domaine ou l’application', 'Le framework HTTP', 'La base de données'],
      answer: 1,
      explanation: 'Le centre dit ce dont il a besoin ; l’extérieur s’y conforme. C’est l’inversion de dépendance.',
    },
    {
      question: 'Quel est le principal bénéfice concret au quotidien ?',
      choices: [
        'Moins de fichiers',
        'Tester les règles métier sans base ni serveur',
        'Des requêtes SQL plus rapides',
        'Un déploiement en microservices',
      ],
      answer: 1,
      explanation: 'On branche un adaptateur en mémoire : les tests du métier tournent en millisecondes.',
    },
    {
      question: 'Un contrôleur HTTP est :',
      choices: ['Un port sortant', 'Un adaptateur entrant', 'Une entité du domaine', 'Un cas d’usage'],
      answer: 1,
      explanation: 'Il traduit une requête HTTP en appel d’un cas d’usage : c’est un adaptateur côté entrée.',
    },
    {
      question: 'Quand l’hexagonale est-elle surdimensionnée ?',
      choices: ['Pour un cœur bancaire', 'Pour un CRUD sans règle métier', 'Pour un SaaS avec 10 intégrations', 'Pour un moteur de tarification'],
      answer: 1,
      explanation: 'Sans règle à protéger, les ports et adaptateurs ne sont que de la cérémonie.',
    },
    {
      question: 'Où se fait le choix « PostgreSQL en production, mémoire en test » ?',
      choices: ['Dans le domaine', 'Dans le point de composition (main)', 'Dans chaque cas d’usage', 'Dans l’entité'],
      answer: 1,
      explanation: 'La composition branche les adaptateurs ; le reste du code ne sait pas lequel est utilisé.',
    },
  ],
  linkedinPost:
    'J’ai volontairement choisi de NE PAS faire d’architecture hexagonale sur mon dernier projet. Pas de base, pas de fournisseur, pas de règle métier à protéger : des ports n’auraient protégé… rien. L’hexagonale est un investissement, pas un label qualité. Elle paie quand le métier vaut plus que la technique autour.',
};
