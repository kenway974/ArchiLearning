import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  markRead,
  markUnread,
  recordQuizResult,
  resetProgress,
  setTheme,
  startPath,
  type Progress,
  type Score,
  type Theme,
} from './progress';
import { loadProgress, saveProgress } from './storage';

/** Accès protégé : lire `window.localStorage` peut lever une exception (mode privé, sécurité). */
const browserStorage = () => window.localStorage;

type ProgressApi = {
  progress: Progress;
  read: ReadonlySet<string>;
  toggleRead: (id: string) => void;
  markRead: (id: string) => void;
  recordQuiz: (id: string, score: Score) => void;
  startPath: (target: string, steps: string[]) => void;
  setTheme: (theme: Theme) => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  // Si le stockage est indisponible, la progression vit en mémoire pendant la visite.
  const [progress, setProgress] = useState<Progress>(() => loadProgress(browserStorage));

  useEffect(() => {
    saveProgress(browserStorage, progress);
  }, [progress]);

  const toggleRead = useCallback(
    (id: string) => setProgress((p) => (p.read.includes(id) ? markUnread(p, id) : markRead(p, id))),
    [],
  );

  const api = useMemo<ProgressApi>(
    () => ({
      progress,
      read: new Set(progress.read),
      toggleRead,
      markRead: (id) => setProgress((p) => markRead(p, id)),
      recordQuiz: (id, score) => setProgress((p) => recordQuizResult(p, id, score)),
      startPath: (target, steps) => setProgress((p) => startPath(p, target, steps)),
      setTheme: (theme) => setProgress((p) => setTheme(p, theme)),
      reset: () => setProgress((p) => resetProgress(p)),
    }),
    [progress, toggleRead],
  );

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext);
  if (!api) throw new Error('useProgress doit être utilisé dans <ProgressProvider>');
  return api;
}
