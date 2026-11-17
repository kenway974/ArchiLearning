import { z } from 'zod';
import { emptyProgress, type Progress } from './progress';

/** Clé versionnée : un changement de format passera par une migration ou une nouvelle clé. */
export const STORAGE_KEY = 'archi-map:progress:v1';

const scoreSchema = z.object({ correct: z.number().int().nonnegative(), total: z.number().int().nonnegative() });

const progressSchema = z.object({
  read: z.array(z.string()),
  bestScores: z.record(scoreSchema),
  activePath: z.object({ target: z.string(), steps: z.array(z.string()) }).nullable(),
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
});

type GetStorage = () => Storage | null | undefined;

/** Ne lève jamais : stockage absent, interdit ou corrompu → progression vide. */
export function loadProgress(getStorage: GetStorage): Progress {
  try {
    const raw = getStorage()?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = progressSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** Ne lève jamais : renvoie false si l'écriture est impossible (mode privé, quota…). */
export function saveProgress(getStorage: GetStorage, progress: Progress): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
