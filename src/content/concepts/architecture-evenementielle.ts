import type { ConceptSheet } from '../schema';

export const architectureEvenementielle: ConceptSheet = {
  id: 'architecture-evenementielle',
  kind: 'concept',
  title: 'Architecture orientée événements',
  summary: 'Les composants publient des événements (« commande passée ») sans savoir qui les écoute ; les autres réagissent de leur côté.',
  problem:
    'Éviter que chaque composant appelle directement tous les autres : quand une commande est passée, le stock, la facturation et les e-mails doivent réagir, mais le module Commandes n’a pas à les connaître. Les événements découplent dans le temps (traitement asynchrone) et dans le code (ajouter un abonné ne touche pas l’émetteur).',
  whenToUse: [
    'Un fait métier déclenche plusieurs réactions indépendantes.',
    'Intégration entre services ou modules appartenant à des équipes différentes.',
    'Traitements qui peuvent être différés (e-mails, statistiques, indexation de recherche).',
  ],
  whenToAvoid: [
    'Quand l’appelant a besoin d’une réponse immédiate (vérifier un solde avant d’autoriser un paiement).',
    'Petite application où un appel de fonction suffit : on ajoute un broker et de l’asynchrone pour rien.',
    'Sans outillage pour suivre les messages : les flux deviennent impossibles à déboguer.',
  ],
  teamSize: 'Dès qu’il y a plusieurs modules ou équipes ; présente à petite échelle (événements internes d’un monolithe) comme à grande échelle (Kafka entre des centaines de services).',
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code TypeScript : émetteurs, contrats d’événements et abonnés.',
      children: [
        {
          name: 'events',
          kind: 'dir',
          role: 'Contrats des événements publiés : c’est l’API publique, à versionner.',
          children: [{ name: 'CommandePassee.v1.ts', kind: 'file', role: 'Schéma de l’événement CommandePassee, version 1.' }],
        },
        {
          name: 'commandes',
          kind: 'dir',
          role: 'Émetteur : publie un événement quand une commande est passée.',
          children: [
            { name: 'passerCommande.ts', kind: 'file', role: 'Enregistre la commande et l’événement dans la même transaction (outbox).' },
            { name: 'outboxRelay.ts', kind: 'file', role: 'Relaie les événements de la table outbox vers Kafka.' },
          ],
        },
        {
          name: 'abonnes',
          kind: 'dir',
          role: 'Consommateurs indépendants : chacun réagit à sa façon.',
          children: [
            { name: 'reserverStock.ts', kind: 'file', role: 'Réserve le stock à la réception de CommandePassee.' },
            { name: 'envoyerConfirmation.ts', kind: 'file', role: 'Envoie l’e-mail de confirmation.' },
          ],
        },
      ],
    },
    { name: 'docker-compose.yml', kind: 'file', role: 'Lance Kafka et PostgreSQL en local pour le développement.' },
    { name: 'package.json', kind: 'file', role: 'Manifeste Node : dépendances (kafkajs, pg).' },
  ],
  code: {
    language: 'typescript',
    filename: 'src/abonnes/reserverStock.ts',
    source: `import { Kafka } from 'kafkajs';
import type { CommandePasseeV1 } from '../events/CommandePassee.v1';

const kafka = new Kafka({ clientId: 'stock', brokers: ['localhost:9092'] });
// Un groupe de consommateurs par abonné : chaque abonné reçoit tous les événements
const consumer = kafka.consumer({ groupId: 'stock-reservation' });

export async function demarrer(reserver: (e: CommandePasseeV1) => Promise<void>) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'commandes.passees', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const evenement = JSON.parse(message.value!.toString()) as CommandePasseeV1;
      // Livraison « au moins une fois » : le même message peut arriver deux fois.
      // reserver() doit donc être idempotente (ex. clé unique sur commandeId).
      await reserver(evenement);
    },
  });
}

// L'émetteur (Commandes) ne sait pas que ce service existe :
// ajouter un nouvel abonné ne demande aucun changement chez lui.`,
  },
  pitfalls: [
    'Oublier l’idempotence : avec une livraison « au moins une fois », un traitement rejoué deux fois double le stock réservé.',
    'Publier l’événement après le commit sans garantie : si l’envoi échoue, l’événement est perdu (d’où le pattern outbox).',
    'Des événements qui exposent le modèle interne : les abonnés en dépendent et on ne peut plus rien changer.',
    'Des chaînes d’événements que personne ne sait plus suivre de bout en bout.',
  ],
  neighbors: ['microservices', 'event-sourcing', 'serverless', 'pipes-and-filters'],
  prerequisites: [
    { id: 'monolithe-modulaire', reason: 'Les événements servent d’abord à faire communiquer des modules sans qu’ils se connaissent.' },
  ],
  nextSteps: [
    { id: 'serverless', reason: 'Le serverless est souvent déclenché par des événements (fichier déposé, message reçu).' },
    { id: 'microservices', reason: 'Entre services, les événements limitent les appels synchrones en cascade.' },
    { id: 'event-sourcing', reason: 'L’Event Sourcing fait des événements la source de vérité, pas seulement un moyen de communiquer.' },
  ],
  quiz: [
    {
      question: 'Quel est l’intérêt principal des événements ?',
      choices: [
        'Accélérer les requêtes SQL',
        'L’émetteur n’a pas à connaître ceux qui réagissent',
        'Supprimer la base de données',
        'Remplacer les tests',
      ],
      answer: 1,
      explanation: 'Ajouter un abonné ne demande aucun changement chez l’émetteur.',
    },
    {
      question: 'Pourquoi un consommateur doit-il être idempotent ?',
      choices: [
        'Pour aller plus vite',
        'Parce qu’un même message peut être livré plusieurs fois',
        'Parce que Kafka l’impose syntaxiquement',
        'Pour réduire les logs',
      ],
      answer: 1,
      explanation: 'La plupart des brokers garantissent « au moins une fois » : le doublon doit être sans effet.',
    },
    {
      question: 'Quel problème résout le pattern outbox ?',
      choices: [
        'Le chiffrement des messages',
        'Garantir que l’écriture en base et la publication de l’événement réussissent ensemble',
        'La compression des messages',
        'Le choix du broker',
      ],
      answer: 1,
      explanation: 'L’événement est écrit dans une table de la même transaction, puis relayé au broker.',
    },
    {
      question: 'Quand préférer un appel synchrone ?',
      choices: [
        'Envoyer un e-mail de bienvenue',
        'Autoriser un paiement qui dépend d’une réponse immédiate',
        'Mettre à jour des statistiques',
        'Indexer un produit dans la recherche',
      ],
      answer: 1,
      explanation: 'Quand l’appelant ne peut pas continuer sans la réponse.',
    },
  ],
  linkedinPost:
    '« On publie un événement, ce sera découplé. » Oui, jusqu’au jour où le même message arrive deux fois et que le stock est réservé en double. Les événements découplent le code, pas les responsabilités : idempotence, outbox et contrats versionnés font partie du ticket d’entrée.',
};
