import type { ConceptSheet } from '../schema';

export const microkernel: ConceptSheet = {
  id: 'microkernel',
  kind: 'concept',
  title: 'Microkernel (plugins)',
  summary: 'Un noyau minimal fournit les services de base et un contrat d’extension ; les fonctionnalités sont ajoutées par des plugins indépendants.',
  problem:
    'Permettre d’ajouter des fonctionnalités, y compris écrites par des tiers, sans modifier ni redéployer le cœur. C’est le modèle des éditeurs de code (extensions VS Code, plugins Eclipse), des navigateurs, de WordPress ou des outils de build.',
  whenToUse: [
    'Produit extensible par des clients, des partenaires ou une communauté.',
    'Variantes par client (connecteurs, règles spécifiques) qu’on ne veut pas mélanger au cœur.',
    'Outils dont les fonctionnalités sont naturellement indépendantes (formats, langages, intégrations).',
  ],
  whenToAvoid: [
    'Application sans besoin d’extension : le contrat de plugin est un coût de conception permanent.',
    'Quand les fonctionnalités dépendent fortement les unes des autres.',
  ],
  teamSize: 'Toutes tailles ; surtout pour les éditeurs de logiciels et de plateformes qui ouvrent leur produit à des tiers.',
  tree: [
    {
      name: 'packages',
      kind: 'dir',
      role: 'Monorepo : le noyau et chaque plugin sont des paquets séparés.',
      children: [
        {
          name: 'core',
          kind: 'dir',
          role: 'Le noyau : chargement des plugins et services communs.',
          children: [
            { name: 'src/plugin.ts', kind: 'file', role: 'Contrat qu’un plugin doit respecter (nom, version, activate).' },
            { name: 'src/registry.ts', kind: 'file', role: 'Registre : découvre, active et isole les plugins.' },
            { name: 'package.json', kind: 'file', role: 'Paquet du noyau, publié et versionné séparément.' },
          ],
        },
        {
          name: 'plugin-export-csv',
          kind: 'dir',
          role: 'Un plugin : ajoute l’export CSV sans toucher au noyau.',
          children: [
            { name: 'src/index.ts', kind: 'file', role: 'Implémente le contrat et enregistre la commande d’export.' },
            { name: 'package.json', kind: 'file', role: 'Déclare la version du noyau compatible (peerDependencies).' },
          ],
        },
      ],
    },
    { name: 'package.json', kind: 'file', role: 'Racine du monorepo : espaces de travail npm.' },
  ],
  code: {
    language: 'typescript',
    filename: 'packages/core/src/plugin.ts',
    source: `// Le contrat : la seule chose qu'un plugin a le droit de connaître du noyau.
export interface Plugin {
  name: string;
  /** Version du contrat attendue, pour refuser un plugin incompatible. */
  apiVersion: 1;
  activate(api: CoreApi): void | Promise<void>;
}

// Ce que le noyau expose aux plugins : volontairement étroit.
export interface CoreApi {
  registerCommand(id: string, run: () => Promise<void>): void;
  registerExporter(format: string, exporter: (rows: unknown[]) => string): void;
  log(message: string): void;
}

// registry.ts : le noyau active chaque plugin et isole ses erreurs.
export async function activateAll(plugins: Plugin[], api: CoreApi) {
  for (const plugin of plugins) {
    if (plugin.apiVersion !== 1) {
      api.log(\`\${plugin.name} ignoré : contrat incompatible\`);
      continue;
    }
    try {
      await plugin.activate(api);
    } catch (e) {
      api.log(\`\${plugin.name} n'a pas démarré : \${String(e)}\`); // un plugin ne fait pas tomber le noyau
    }
  }
}`,
  },
  pitfalls: [
    'Un contrat trop large : chaque détail interne exposé devient impossible à changer.',
    'Pas de versionnement du contrat : une mise à jour du noyau casse tous les plugins.',
    'Un plugin défaillant qui fait tomber l’application entière faute d’isolation.',
  ],
  neighbors: ['pipes-and-filters'],
  prerequisites: [
    { id: 'architecture-en-couches', reason: 'Il faut savoir séparer des responsabilités avant de définir un noyau et un contrat d’extension.' },
  ],
  nextSteps: [
    { id: 'pipes-and-filters', reason: 'Pipes and filters est une autre façon d’assembler des composants indépendants.' },
    { id: 'saas-b2b', reason: 'Les intégrations et extensions d’un SaaS B2B suivent souvent ce modèle.' },
  ],
  quiz: [
    {
      question: 'Que contient le noyau d’une architecture microkernel ?',
      choices: [
        'Toutes les fonctionnalités',
        'Le minimum : services de base et contrat d’extension',
        'Uniquement l’interface graphique',
        'La base de données',
      ],
      answer: 1,
      explanation: 'Le reste arrive par les plugins.',
    },
    {
      question: 'Pourquoi versionner le contrat de plugin ?',
      choices: [
        'Pour le marketing',
        'Pour qu’une évolution du noyau ne casse pas silencieusement les plugins existants',
        'Pour compiler plus vite',
        'C’est imposé par npm',
      ],
      answer: 1,
      explanation: 'Le noyau peut refuser proprement un plugin incompatible.',
    },
    {
      question: 'Lequel de ces logiciels suit ce modèle ?',
      choices: ['Un éditeur de code avec des extensions', 'Une calculatrice', 'Un script cron', 'Une page statique'],
      answer: 0,
      explanation: 'Les éditeurs de code sont l’exemple classique de noyau + extensions.',
    },
  ],
  linkedinPost:
    'Pourquoi votre éditeur de code supporte-t-il des centaines de langages alors que son cœur n’en connaît presque aucun ? Architecture microkernel : un noyau minimal, un contrat d’extension, et tout le reste en plugins. Le secret n’est pas le noyau, c’est la stabilité du contrat.',
};
