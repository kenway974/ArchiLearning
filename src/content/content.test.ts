import { readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { content } from './index';
import { validateContent } from './validate';

const here = dirname(fileURLToPath(import.meta.url));
const sheetFiles = (dir: string) =>
  readdirSync(join(here, dir))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
    .map((f) => basename(f, '.ts'))
    .sort();

const V1_CONCEPTS = [
  'transaction-script',
  'architecture-en-couches',
  'mvc',
  'hexagonale',
  'clean-onion',
  'ddd',
  'cqrs',
  'event-sourcing',
  'vertical-slice',
  'monolithe',
  'monolithe-modulaire',
  'microservices',
  'architecture-evenementielle',
  'serverless',
  'microkernel',
  'pipes-and-filters',
] as const;

const V1_SECTORS = ['site-vitrine', 'e-commerce', 'saas-b2b', 'banque-fintech'] as const;

describe('contenu réel de la V1', () => {
  test('C68 — les 16 fiches concepts de la V1 existent', () => {
    expect(content.concepts.map((c) => c.id).sort()).toEqual([...V1_CONCEPTS].sort());
  });

  test('C68 — les 4 fiches secteurs de la V1 existent', () => {
    expect(content.sectors.map((s) => s.id).sort()).toEqual([...V1_SECTORS].sort());
  });

  test('C69 — le contenu réel passe toutes les règles de validation', () => {
    expect(validateContent(content)).toEqual([]);
  });

  test('C67 — chaque fichier de fiche porte le nom de son identifiant et est exporté', () => {
    expect(sheetFiles('concepts')).toEqual(content.concepts.map((c) => c.id).sort());
    expect(sheetFiles('sectors')).toEqual(content.sectors.map((s) => s.id).sort());
  });

  test('C72 — les cinq familles de concepts de la V1', () => {
    expect(content.families.map((f) => f.title)).toEqual([
      'Organiser le code',
      'Protéger le métier',
      'Lecture et historique',
      'Découper et déployer',
      'Circuler et étendre',
    ]);
  });

  test('C73 — les neuf principes partagés de la V1', () => {
    expect(content.principles.map((p) => p.id)).toEqual([
      'separation-des-responsabilites',
      'inversion-des-dependances',
      'decoupage-par-domaine',
      'decoupage-par-cas-dusage',
      'separer-lecture-ecriture',
      'communication-par-evenements',
      'composition-dunites',
      'coherence-a-terme',
      'un-seul-deploiement',
    ]);
  });

  test('C65 — le lien Banque → Event Sourcing cité dans le cahier des charges existe', () => {
    expect(content.links.map((l) => l.id)).toContain('banque-fintech--event-sourcing');
  });
});
