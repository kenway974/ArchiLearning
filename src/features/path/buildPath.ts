import type { Sheet } from '../../content/schema';

/**
 * Parcours d'un sujet : ses prérequis non lus, précédés de leurs propres prérequis non lus
 * (ordre de lecture), puis le sujet lui-même. Un prérequis lu n'apparaît pas, mais on
 * remonte quand même ses prérequis à lui.
 */
export function buildPath(sheets: Sheet[], targetId: string, read: ReadonlySet<string>): string[] {
  const byId = new Map(sheets.map((s) => [s.id, s]));
  if (!byId.has(targetId)) throw new Error(`Fiche inconnue : ${targetId}`);

  const path: string[] = [];
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const ref of byId.get(id)?.prerequisites ?? []) visit(ref.id);
    if (id === targetId || !read.has(id)) path.push(id);
  };

  visit(targetId);
  return path;
}

export function getStep(path: string[], currentId: string): { index: number; total: number; next: string | null } | null {
  const i = path.indexOf(currentId);
  if (i === -1) return null;
  return { index: i + 1, total: path.length, next: path[i + 1] ?? null };
}

/**
 * Phrase qui explique pourquoi l'étape suivante vient maintenant : la raison du prérequis
 * qui relie l'étape suivante à l'étape courante, sinon celle de la première fiche du parcours
 * qui a besoin de l'étape suivante.
 */
export function getStepReason(sheets: Sheet[], path: string[], currentId: string): string | null {
  const step = getStep(path, currentId);
  if (!step?.next) return null;
  const next = step.next;
  const byId = new Map(sheets.map((s) => [s.id, s]));

  const direct = byId.get(next)?.prerequisites.find((r) => r.id === currentId);
  if (direct) return direct.reason;

  for (const id of path.slice(step.index)) {
    const ref = byId.get(id)?.prerequisites.find((r) => r.id === next);
    if (ref) return ref.reason;
  }
  return null;
}
