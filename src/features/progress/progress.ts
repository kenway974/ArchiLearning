import type { Content } from '../../content/schema';

export type Theme = 'system' | 'light' | 'dark';
export type Score = { correct: number; total: number };
export type ActivePath = { target: string; steps: string[] };

export type Progress = {
  read: string[];
  bestScores: Record<string, Score>;
  activePath: ActivePath | null;
  theme: Theme;
};

export const emptyProgress = (): Progress => ({ read: [], bestScores: {}, activePath: null, theme: 'system' });

/** Lire la fiche cible clôt le parcours en cours. */
const closePathIfTarget = (p: Progress, id: string): Progress =>
  p.activePath?.target === id ? { ...p, activePath: null } : p;

export function markRead(p: Progress, id: string): Progress {
  const read = p.read.includes(id) ? p.read : [...p.read, id];
  return closePathIfTarget({ ...p, read }, id);
}

export function markUnread(p: Progress, id: string): Progress {
  return { ...p, read: p.read.filter((r) => r !== id) };
}

const ratio = (s: Score) => (s.total === 0 ? 0 : s.correct / s.total);

/** Terminer un quiz marque la fiche comme lue et garde le meilleur score (en proportion). */
export function recordQuizResult(p: Progress, id: string, score: Score): Progress {
  const previous = p.bestScores[id];
  const best = previous && ratio(previous) >= ratio(score) ? previous : score;
  return markRead({ ...p, bestScores: { ...p.bestScores, [id]: best } }, id);
}

export const startPath = (p: Progress, target: string, steps: string[]): Progress => ({
  ...p,
  activePath: { target, steps },
});

export const stopPath = (p: Progress): Progress => ({ ...p, activePath: null });

export const setTheme = (p: Progress, theme: Theme): Progress => ({ ...p, theme });

/** Efface la progression mais garde le thème choisi. */
export const resetProgress = (p: Progress): Progress => ({ ...emptyProgress(), theme: p.theme });

export type ProgressSummary = {
  read: number;
  total: number;
  concepts: { read: number; total: number };
  sectors: { read: number; total: number };
};

export function summarize(p: Progress, content: Content): ProgressSummary {
  const read = new Set(p.read);
  const count = (xs: { id: string }[]) => ({ read: xs.filter((x) => read.has(x.id)).length, total: xs.length });
  const concepts = count(content.concepts);
  const sectors = count(content.sectors);
  return { read: concepts.read + sectors.read, total: concepts.total + sectors.total, concepts, sectors };
}
