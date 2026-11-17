import type { Family } from './schema';

/** Familles de concepts : l'ordre est celui de la carte, de haut en bas. */
export const families: Family[] = [
  {
    id: 'organiser-le-code',
    title: 'Organiser le code',
    concepts: ['transaction-script', 'architecture-en-couches', 'mvc', 'vertical-slice'],
  },
  {
    id: 'proteger-le-metier',
    title: 'Protéger le métier',
    concepts: ['hexagonale', 'clean-onion', 'ddd'],
  },
  {
    id: 'lecture-et-historique',
    title: 'Lecture et historique',
    concepts: ['cqrs', 'event-sourcing'],
  },
  {
    id: 'decouper-et-deployer',
    title: 'Découper et déployer',
    concepts: ['monolithe', 'monolithe-modulaire', 'microservices', 'serverless'],
  },
  {
    id: 'circuler-et-etendre',
    title: 'Circuler et étendre',
    concepts: ['architecture-evenementielle', 'pipes-and-filters', 'microkernel'],
  },
];
