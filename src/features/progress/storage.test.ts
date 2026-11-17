import { loadProgress, saveProgress, STORAGE_KEY } from './storage';
import { emptyProgress, markRead, recordQuizResult, setTheme, startPath } from './progress';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const throwing = (): Storage => {
  throw new DOMException('Accès refusé', 'SecurityError');
};

describe('enregistrement de la progression', () => {
  test('C48 — ce qui est enregistré est relu à l’identique', () => {
    const storage = new MemoryStorage();
    let p = markRead(emptyProgress(), 'cqrs');
    p = recordQuizResult(p, 'ddd', { correct: 2, total: 3 });
    p = startPath(p, 'cqrs', ['ddd', 'cqrs']);
    p = setTheme(p, 'light');
    expect(saveProgress(() => storage, p)).toBe(true);
    expect(loadProgress(() => storage)).toEqual(p);
  });

  test('C48 — rien d’enregistré → progression vide', () => {
    expect(loadProgress(() => new MemoryStorage())).toEqual(emptyProgress());
  });

  test('C48 — la clé est versionnée pour permettre une migration future', () => {
    expect(STORAGE_KEY).toMatch(/v\d+$/);
  });
});

describe('localStorage indisponible ou corrompu', () => {
  test('C49 — accéder au stockage lève une exception → progression vide, pas d’erreur', () => {
    expect(loadProgress(throwing)).toEqual(emptyProgress());
  });

  test('C49 — stockage absent (null) → progression vide', () => {
    expect(loadProgress(() => null)).toEqual(emptyProgress());
  });

  test('C49 — getItem lève une exception → progression vide', () => {
    const storage = new MemoryStorage();
    storage.getItem = () => {
      throw new Error('boom');
    };
    expect(loadProgress(() => storage)).toEqual(emptyProgress());
  });

  test('C49 — écriture impossible (quota, mode privé) → renvoie false sans lever', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new DOMException('Quota dépassé', 'QuotaExceededError');
    };
    expect(saveProgress(() => storage, emptyProgress())).toBe(false);
    expect(saveProgress(throwing, emptyProgress())).toBe(false);
  });

  test.each([
    ['du texte qui n’est pas du JSON', 'pas du json {'],
    ['un tableau', '[]'],
    ['null', 'null'],
    ['un objet au mauvais format', JSON.stringify({ read: 'cqrs', bestScores: 3 })],
  ])('C49 — contenu corrompu (%s) → progression vide', (_label, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    expect(loadProgress(() => storage)).toEqual(emptyProgress());
  });

  test('C49 — un thème inconnu est remplacé par « system » sans perdre le reste', () => {
    const storage = new MemoryStorage();
    const saved = { ...markRead(emptyProgress(), 'cqrs'), theme: 'fluo' };
    storage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const p = loadProgress(() => storage);
    expect(p.read).toEqual(['cqrs']);
    expect(p.theme).toBe('system');
  });
});
