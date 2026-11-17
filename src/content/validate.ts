import type { z } from 'zod';
import {
  conceptSheetSchema,
  linkSchema,
  sectorSheetSchema,
  type Content,
  type Language,
  type Sheet,
  type TreeNode,
} from './schema';

export type ContentError = {
  /** Fichier source fautif, ex. src/content/concepts/cqrs.ts */
  file: string;
  /** Champ fautif, ex. quiz.2.answer */
  path: string;
  message: string;
};

export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Identifiants des nœuds de structure de la carte. */
export const RESERVED_IDS = ['root', 'concepts', 'sectors'];
const LINKS_FILE = 'src/content/links.ts';

/** Fichiers de projet propres à chaque écosystème : l'arborescence d'un secteur doit en contenir un. */
const MANIFESTS: Record<Language, { label: string; match: (name: string) => boolean }> = {
  java: { label: 'pom.xml ou build.gradle(.kts)', match: (n) => ['pom.xml', 'build.gradle', 'build.gradle.kts'].includes(n) },
  kotlin: { label: 'build.gradle(.kts)', match: (n) => ['build.gradle', 'build.gradle.kts'].includes(n) },
  php: { label: 'composer.json', match: (n) => n === 'composer.json' },
  typescript: { label: 'package.json', match: (n) => n === 'package.json' },
  javascript: { label: 'package.json', match: (n) => n === 'package.json' },
  go: { label: 'go.mod', match: (n) => n === 'go.mod' },
  csharp: { label: 'un fichier .csproj', match: (n) => n.endsWith('.csproj') },
  swift: { label: 'Package.swift', match: (n) => n === 'Package.swift' },
  python: { label: 'pyproject.toml', match: (n) => n === 'pyproject.toml' },
};

export const sheetFile = (sheet: Pick<Sheet, 'kind' | 'id'>) =>
  `src/content/${sheet.kind === 'concept' ? 'concepts' : 'sectors'}/${sheet.id || '(sans identifiant)'}.ts`;

const flatten = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);

function schemaErrors(file: string, result: z.SafeParseReturnType<unknown, unknown>): ContentError[] {
  if (result.success) return [];
  return result.error.issues.map((issue) => ({ file, path: issue.path.join('.') || '(racine)', message: issue.message }));
}

export function validateContent(content: Content): ContentError[] {
  const errors: ContentError[] = [];
  const sheets: Sheet[] = [...content.concepts, ...content.sectors];
  const ids = new Set(sheets.map((s) => s.id));
  const conceptIds = new Set(content.concepts.map((c) => c.id));

  // Schémas
  for (const c of content.concepts) errors.push(...schemaErrors(sheetFile(c), conceptSheetSchema.safeParse(c)));
  for (const s of content.sectors) errors.push(...schemaErrors(sheetFile(s), sectorSheetSchema.safeParse(s)));
  content.links.forEach((l, i) =>
    errors.push(...schemaErrors(LINKS_FILE, linkSchema.safeParse(l)).map((e) => ({ ...e, path: `${i}.${e.path}` }))),
  );

  // Identifiants
  const seen = new Set<string>();
  for (const s of sheets) {
    const file = sheetFile(s);
    if (!ID_PATTERN.test(s.id)) {
      errors.push({ file, path: 'id', message: `identifiant « ${s.id} » invalide : minuscules, chiffres et tirets seulement` });
    }
    if (RESERVED_IDS.includes(s.id)) {
      errors.push({ file, path: 'id', message: `identifiant « ${s.id} » réservé à la structure de la carte` });
    }
    if (seen.has(s.id)) errors.push({ file, path: 'id', message: `identifiant « ${s.id} » en double` });
    seen.add(s.id);
  }

  // Manifeste propre au langage
  for (const s of content.sectors) {
    const manifest = MANIFESTS[s.stack.language];
    if (manifest && !flatten(s.tree).some((n) => n.kind === 'file' && manifest.match(n.name))) {
      errors.push({
        file: sheetFile(s),
        path: 'tree',
        message: `l’arborescence d’un projet ${s.stack.language} doit contenir ${manifest.label}`,
      });
    }
  }

  // Liens
  const pairs = new Set<string>();
  const linkIds = new Set<string>();
  content.links.forEach((l, i) => {
    for (const end of ['source', 'target'] as const) {
      if (!ids.has(l[end])) errors.push({ file: LINKS_FILE, path: `${i}.${end}`, message: `nœud inexistant : ${l[end]}` });
    }
    if (l.source === l.target) errors.push({ file: LINKS_FILE, path: `${i}`, message: `lien de ${l.source} vers lui-même` });
    const pair = [l.source, l.target].sort().join('|');
    if (pairs.has(pair)) errors.push({ file: LINKS_FILE, path: `${i}`, message: `lien en double entre ${l.source} et ${l.target}` });
    pairs.add(pair);
    if (linkIds.has(l.id)) errors.push({ file: LINKS_FILE, path: `${i}.id`, message: `identifiant de lien en double : ${l.id}` });
    linkIds.add(l.id);
  });

  // Architectures voisines
  for (const c of content.concepts) {
    c.neighbors.forEach((n, i) => {
      if (!conceptIds.has(n)) {
        errors.push({ file: sheetFile(c), path: `neighbors.${i}`, message: `concept voisin inexistant : ${n}` });
      } else if (!pairs.has([c.id, n].sort().join('|'))) {
        errors.push({ file: sheetFile(c), path: `neighbors.${i}`, message: `aucun lien n’explique la relation avec ${n}` });
      }
    });
  }

  // Prérequis et suites
  for (const s of sheets) {
    for (const field of ['prerequisites', 'nextSteps'] as const) {
      s[field].forEach((ref, i) => {
        if (!ids.has(ref.id)) {
          errors.push({ file: sheetFile(s), path: `${field}.${i}`, message: `fiche inexistante : ${ref.id}` });
        } else if (ref.id === s.id) {
          errors.push({ file: sheetFile(s), path: `${field}.${i}`, message: 'une fiche ne peut pas pointer vers elle-même' });
        }
      });
    }
  }
  const cycle = findPrerequisiteCycle(sheets);
  if (cycle) {
    const first = sheets.find((s) => s.id === cycle[0])!;
    errors.push({ file: sheetFile(first), path: 'prerequisites', message: `boucle de prérequis : ${cycle.join(' → ')}` });
  }

  return errors;
}

/** Renvoie une boucle de prérequis (ex. [a, b, a]) ou null. */
function findPrerequisiteCycle(sheets: Sheet[]): string[] | null {
  const byId = new Map(sheets.map((s) => [s.id, s]));
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    if (state.get(id) === 'done') return null;
    if (state.get(id) === 'visiting') return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 'visiting');
    stack.push(id);
    for (const ref of byId.get(id)?.prerequisites ?? []) {
      if (ref.id === id || !byId.has(ref.id)) continue; // déjà signalé ailleurs
      const found = visit(ref.id);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  };

  for (const s of sheets) {
    const found = visit(s.id);
    if (found) return found;
  }
  return null;
}

export function formatContentErrors(errors: ContentError[]): string {
  return [
    `Contenu invalide : ${errors.length} erreur(s)`,
    ...errors.map((e) => `  ${e.file} › ${e.path} : ${e.message}`),
  ].join('\n');
}

export function checkContent(content: Content): { ok: boolean; message: string } {
  const errors = validateContent(content);
  return errors.length === 0
    ? { ok: true, message: 'Contenu valide.' }
    : { ok: false, message: formatContentErrors(errors) };
}
