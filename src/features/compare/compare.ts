import type { Link, Sheet } from '../../content/schema';

export type CompareRow = { criterion: string; left: string | string[]; right: string | string[] };
export type CompareResult = { ok: true; rows: CompareRow[] } | { ok: false; reason: 'mixed-kinds' | 'same-sheet' };

type Criterion<S> = [label: string, pick: (s: S) => string | string[]];

const conceptCriteria: Criterion<Extract<Sheet, { kind: 'concept' }>>[] = [
  ['Idée', (s) => s.summary],
  ['Problème résolu', (s) => s.problem],
  ['Quand l’utiliser', (s) => s.whenToUse],
  ['Quand l’éviter', (s) => s.whenToAvoid],
  ['Taille d’équipe et d’entreprise', (s) => s.teamSize],
  ['Pièges', (s) => s.pitfalls],
];

const sectorCriteria: Criterion<Extract<Sheet, { kind: 'sector' }>>[] = [
  ['Contraintes', (s) => s.constraints],
  ['Petite entreprise', (s) => `${s.bySize.small.architecture} — ${s.bySize.small.why}`],
  ['Entreprise moyenne', (s) => `${s.bySize.medium.architecture} — ${s.bySize.medium.why}`],
  ['Grande entreprise', (s) => `${s.bySize.large.architecture} — ${s.bySize.large.why}`],
  ['Langage et framework', (s) => `${s.stack.framework} (${s.stack.language}) — ${s.stack.why}`],
  ['Pièges', (s) => s.pitfalls],
];

export function compareSheets(a: Sheet, b: Sheet): CompareResult {
  if (a.id === b.id) return { ok: false, reason: 'same-sheet' };
  if (a.kind === 'concept' && b.kind === 'concept') {
    return { ok: true, rows: conceptCriteria.map(([criterion, pick]) => ({ criterion, left: pick(a), right: pick(b) })) };
  }
  if (a.kind === 'sector' && b.kind === 'sector') {
    return { ok: true, rows: sectorCriteria.map(([criterion, pick]) => ({ criterion, left: pick(a), right: pick(b) })) };
  }
  return { ok: false, reason: 'mixed-kinds' };
}

export const findLink = (links: Link[], a: string, b: string): Link | undefined =>
  links.find((l) => (l.source === a && l.target === b) || (l.source === b && l.target === a));
