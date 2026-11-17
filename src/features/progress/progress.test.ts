import {
  emptyProgress,
  markRead,
  markUnread,
  recordQuizResult,
  resetProgress,
  setTheme,
  startPath,
  stopPath,
  summarize,
} from './progress';
import { makeContent } from '../../../tests/fixtures/content';

describe('fiches lues', () => {
  test('C46 — « Marquer comme lue » ajoute la fiche, une seule fois', () => {
    const p = markRead(markRead(emptyProgress(), 'cqrs'), 'cqrs');
    expect(p.read).toEqual(['cqrs']);
  });

  test('C46 — « Marquer comme non lue » retire la fiche', () => {
    expect(markUnread(markRead(emptyProgress(), 'cqrs'), 'cqrs').read).toEqual([]);
  });

  test('C46 — terminer un quiz marque la fiche comme lue, même avec un score de 0', () => {
    const p = recordQuizResult(emptyProgress(), 'cqrs', { correct: 0, total: 4 });
    expect(p.read).toEqual(['cqrs']);
  });

  test('C46 — les fonctions ne modifient pas l’objet reçu (immutabilité)', () => {
    const before = emptyProgress();
    markRead(before, 'cqrs');
    recordQuizResult(before, 'ddd', { correct: 1, total: 3 });
    expect(before).toEqual(emptyProgress());
  });
});

describe('meilleurs scores', () => {
  test('C52 — le premier résultat devient le meilleur score', () => {
    const p = recordQuizResult(emptyProgress(), 'cqrs', { correct: 2, total: 4 });
    expect(p.bestScores.cqrs).toEqual({ correct: 2, total: 4 });
  });

  test('C52 — un meilleur résultat remplace l’ancien', () => {
    let p = recordQuizResult(emptyProgress(), 'cqrs', { correct: 2, total: 4 });
    p = recordQuizResult(p, 'cqrs', { correct: 4, total: 4 });
    expect(p.bestScores.cqrs).toEqual({ correct: 4, total: 4 });
  });

  test('C52 — un moins bon résultat ne remplace pas l’ancien', () => {
    let p = recordQuizResult(emptyProgress(), 'cqrs', { correct: 3, total: 4 });
    p = recordQuizResult(p, 'cqrs', { correct: 1, total: 4 });
    expect(p.bestScores.cqrs).toEqual({ correct: 3, total: 4 });
  });

  test('C52 — si le nombre de questions a changé, on compare les proportions', () => {
    let p = recordQuizResult(emptyProgress(), 'cqrs', { correct: 3, total: 4 }); // 75 %
    p = recordQuizResult(p, 'cqrs', { correct: 4, total: 5 }); // 80 %
    expect(p.bestScores.cqrs).toEqual({ correct: 4, total: 5 });
  });
});

describe('parcours en cours', () => {
  test('C40 — démarrer un parcours mémorise le sujet et les étapes', () => {
    const p = startPath(emptyProgress(), 'cqrs', ['couches', 'ddd', 'cqrs']);
    expect(p.activePath).toEqual({ target: 'cqrs', steps: ['couches', 'ddd', 'cqrs'] });
  });

  test('C40 — démarrer un autre parcours remplace le précédent', () => {
    let p = startPath(emptyProgress(), 'cqrs', ['ddd', 'cqrs']);
    p = startPath(p, 'banque', ['banque']);
    expect(p.activePath?.target).toBe('banque');
  });

  test('C44 — lire la fiche cible clôt le parcours (bouton ou quiz)', () => {
    const p = startPath(emptyProgress(), 'cqrs', ['ddd', 'cqrs']);
    expect(markRead(p, 'ddd').activePath).not.toBeNull();
    expect(markRead(p, 'cqrs').activePath).toBeNull();
    expect(recordQuizResult(p, 'cqrs', { correct: 1, total: 3 }).activePath).toBeNull();
  });

  test('C44 — arrêter le parcours le retire', () => {
    expect(stopPath(startPath(emptyProgress(), 'cqrs', ['cqrs'])).activePath).toBeNull();
  });
});

describe('thème', () => {
  test('C58 — le thème vaut « system » par défaut et peut être forcé', () => {
    expect(emptyProgress().theme).toBe('system');
    expect(setTheme(emptyProgress(), 'dark').theme).toBe('dark');
  });
});

describe('résumé de la progression', () => {
  test('C11 — compte les fiches lues, au total et par type', () => {
    let p = markRead(emptyProgress(), 'cqrs');
    p = markRead(p, 'ddd');
    p = markRead(p, 'banque');
    expect(summarize(p, makeContent())).toEqual({
      read: 3,
      total: 6,
      concepts: { read: 2, total: 4 },
      sectors: { read: 1, total: 2 },
    });
  });

  test('C11 — une fiche lue qui n’existe plus dans le contenu n’est pas comptée', () => {
    const p = markRead(emptyProgress(), 'fiche-supprimee');
    expect(summarize(p, makeContent()).read).toBe(0);
  });
});

describe('réinitialisation', () => {
  test('C13 — efface fiches lues, scores et parcours, mais garde le thème choisi', () => {
    let p = setTheme(emptyProgress(), 'dark');
    p = markRead(p, 'cqrs');
    p = recordQuizResult(p, 'ddd', { correct: 1, total: 3 });
    p = startPath(p, 'cqrs', ['cqrs']);
    expect(resetProgress(p)).toEqual({ ...emptyProgress(), theme: 'dark' });
  });
});
