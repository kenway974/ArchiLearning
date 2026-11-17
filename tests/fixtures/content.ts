/**
 * Fabriques de contenu valide pour les tests unitaires.
 *
 * Elles décrivent le modèle de données attendu (le contrat que src/content/schema.ts
 * devra respecter). Chaque fabrique renvoie un objet valide ; un test qui veut un cas
 * invalide part d'un objet valide et casse UN seul champ.
 */
import type {
  ConceptSheet,
  Content,
  Link,
  QuizQuestion,
  SectorSheet,
  TreeNode,
} from '../../src/content/schema';

export function makeQuiz(count = 3): QuizQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    question: `Question ${i + 1} ?`,
    choices: ['Réponse A', 'Réponse B', 'Réponse C'],
    answer: i % 3,
    explanation: `Parce que la réponse ${i % 3} est la bonne.`,
  }));
}

export function makeTree(manifest = 'package.json'): TreeNode[] {
  return [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code source de l’application.',
      children: [{ name: 'main.ts', kind: 'file', role: 'Point d’entrée.' }],
    },
    { name: manifest, kind: 'file', role: 'Manifeste du projet : dépendances et scripts.' },
  ];
}

type ConceptOverrides = Partial<Omit<ConceptSheet, 'kind'>> & { id: string };

export function makeConcept(overrides: ConceptOverrides): ConceptSheet {
  return {
    kind: 'concept',
    title: overrides.id.toUpperCase(),
    summary: `Idée de ${overrides.id} en une phrase.`,
    problem: 'Le problème résolu.',
    whenToUse: ['Quand le domaine est riche.'],
    whenToAvoid: ['Pour un simple CRUD.'],
    teamSize: 'Équipe de 3 à 10 développeurs, PME.',
    tree: makeTree(),
    code: {
      language: 'typescript',
      filename: 'src/main.ts',
      source: '// Point d’entrée\nexport const main = () => 42;',
    },
    pitfalls: ['Piège courant.'],
    neighbors: [],
    prerequisites: [],
    nextSteps: [],
    quiz: makeQuiz(),
    linkedinPost: 'Idée de post LinkedIn.',
    ...overrides,
  };
}

type SectorOverrides = Partial<Omit<SectorSheet, 'kind'>> & { id: string };

export function makeSector(overrides: SectorOverrides): SectorSheet {
  return {
    kind: 'sector',
    title: overrides.id.toUpperCase(),
    summary: `Résumé du secteur ${overrides.id}.`,
    context: 'Contexte du secteur.',
    constraints: ['Disponibilité élevée.'],
    bySize: {
      small: { architecture: 'Monolithe', why: 'Une petite équipe, un seul déploiement.' },
      medium: { architecture: 'Monolithe modulaire', why: 'Des modules par domaine.' },
      large: { architecture: 'Microservices', why: 'Des équipes autonomes.' },
    },
    stack: {
      language: 'typescript',
      framework: 'NestJS',
      why: 'Écosystème dominant pour ce type de produit.',
    },
    tree: makeTree('package.json'),
    code: {
      language: 'typescript',
      filename: 'src/main.ts',
      source: '// Point d’entrée\nexport const main = () => 42;',
    },
    pitfalls: ['Piège courant.'],
    examples: [
      { name: 'Petite Co', size: 'small', profile: 'Startup de 5 personnes.', team: '2 développeurs.', practices: ['Un seul dépôt, un seul déploiement.'] },
      { name: 'Moyenne Co', size: 'medium', profile: 'PME de 80 personnes.', team: '3 équipes de 5 développeurs.', practices: ['Modules par domaine.'] },
      { name: 'Grande Co', size: 'large', profile: 'Groupe de 3 000 personnes.', team: '20 équipes produit.', practices: ['Services par domaine.'] },
    ],
    prerequisites: [],
    nextSteps: [],
    quiz: makeQuiz(),
    linkedinPost: 'Idée de post LinkedIn.',
    ...overrides,
  };
}

export function makeLink(source: string, target: string, overrides: Partial<Link> = {}): Link {
  return {
    id: `${source}--${target}`,
    source,
    target,
    title: `${source} → ${target}`,
    explanation: `Pourquoi ${source} et ${target} sont liés.`,
    ...overrides,
  };
}

/**
 * Petit contenu cohérent :
 *   couches ← ddd ← cqrs ← event-sourcing   (chaîne de prérequis)
 *   banque a pour prérequis event-sourcing et couches
 *   lien banque — event-sourcing, lien cqrs — event-sourcing
 */
export function makeContent(): Content {
  const couches = makeConcept({
    id: 'couches',
    title: 'Architecture en couches',
    nextSteps: [{ id: 'ddd', reason: 'Le DDD organise le métier à l’intérieur des couches.' }],
  });
  const ddd = makeConcept({
    id: 'ddd',
    title: 'DDD',
    prerequisites: [{ id: 'couches', reason: 'Le DDD suppose de savoir séparer les couches.' }],
  });
  const cqrs = makeConcept({
    id: 'cqrs',
    title: 'CQRS',
    summary: 'Séparer les écritures des lectures.',
    neighbors: ['event-sourcing'],
    prerequisites: [{ id: 'ddd', reason: 'Les commandes CQRS portent des intentions métier.' }],
  });
  const eventSourcing = makeConcept({
    id: 'event-sourcing',
    title: 'Event Sourcing',
    summary: 'Stocker les événements plutôt que l’état courant.',
    neighbors: ['cqrs'],
    prerequisites: [{ id: 'cqrs', reason: 'L’Event Sourcing s’appuie presque toujours sur CQRS.' }],
  });
  const banque = makeSector({
    id: 'banque',
    title: 'Banque / fintech',
    stack: { language: 'java', framework: 'Spring Boot', why: 'Standard du secteur bancaire.' },
    tree: makeTree('pom.xml'),
    prerequisites: [
      { id: 'event-sourcing', reason: 'Les banques ont besoin d’un historique inaltérable.' },
      { id: 'couches', reason: 'Base de toute application bancaire.' },
    ],
  });
  const vitrine = makeSector({ id: 'vitrine', title: 'Site vitrine', summary: 'Un site de présentation.' });

  return {
    concepts: [couches, ddd, cqrs, eventSourcing],
    sectors: [banque, vitrine],
    links: [makeLink('banque', 'event-sourcing'), makeLink('cqrs', 'event-sourcing')],
  };
}
