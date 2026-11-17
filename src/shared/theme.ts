import { useEffect } from 'react';
import { useProgress } from '../features/progress/ProgressContext';
import { useMediaQuery } from './useMediaQuery';

/** Thème réellement affiché : le choix de l'utilisateur, sinon celui de l'appareil. */
export function useResolvedTheme(): 'light' | 'dark' {
  const { progress } = useProgress();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (progress.theme === 'system') return systemDark ? 'dark' : 'light';
  return progress.theme;
}

export function useApplyTheme() {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return theme;
}
