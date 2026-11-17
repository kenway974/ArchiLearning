import { buildPath, getStep, getStepReason } from './buildPath';
import { makeConcept, makeContent } from '../../../tests/fixtures/content';

const content = makeContent();
const sheets = [...content.concepts, ...content.sectors];
const none = new Set<string>();

describe('calcul du parcours d’un sujet', () => {
  test('C38 — sans prérequis, le parcours ne contient que le sujet', () => {
    expect(buildPath(sheets, 'couches', none)).toEqual(['couches']);
  });

  test('C38 — les prérequis des prérequis viennent d’abord, dans l’ordre de lecture', () => {
    expect(buildPath(sheets, 'event-sourcing', none)).toEqual(['couches', 'ddd', 'cqrs', 'event-sourcing']);
  });

  test('C38 — les prérequis déjà lus sont retirés', () => {
    expect(buildPath(sheets, 'event-sourcing', new Set(['couches', 'ddd']))).toEqual(['cqrs', 'event-sourcing']);
  });

  test('C38 — un prérequis lu n’arrête pas la remontée de ses propres prérequis non lus', () => {
    // cqrs est lu, mais ddd et couches ne le sont pas : ils restent nécessaires.
    expect(buildPath(sheets, 'event-sourcing', new Set(['cqrs']))).toEqual(['couches', 'ddd', 'event-sourcing']);
  });

  test('C38 — un prérequis partagé n’apparaît qu’une fois', () => {
    // banque → event-sourcing (→ cqrs → ddd → couches) et banque → couches
    const path = buildPath(sheets, 'banque', none);
    expect(path).toEqual(['couches', 'ddd', 'cqrs', 'event-sourcing', 'banque']);
    expect(new Set(path).size).toBe(path.length);
  });

  test('C38 — l’ordre des prérequis déclarés est respecté entre frères', () => {
    const a = makeConcept({ id: 'a' });
    const b = makeConcept({ id: 'b' });
    const c = makeConcept({
      id: 'c',
      prerequisites: [
        { id: 'b', reason: 'R.' },
        { id: 'a', reason: 'R.' },
      ],
    });
    expect(buildPath([a, b, c], 'c', none)).toEqual(['b', 'a', 'c']);
  });

  test('C38 — le sujet reste dans son parcours même s’il est déjà lu', () => {
    expect(buildPath(sheets, 'cqrs', new Set(['cqrs', 'ddd', 'couches']))).toEqual(['cqrs']);
  });

  test('C38 — un sujet inconnu lève une erreur explicite', () => {
    expect(() => buildPath(sheets, 'fantome', none)).toThrow(/fantome/);
  });
});

describe('position dans le parcours', () => {
  const path = ['couches', 'ddd', 'cqrs'];

  test('C41 — étape courante, total et étape suivante', () => {
    expect(getStep(path, 'ddd')).toEqual({ index: 2, total: 3, next: 'cqrs' });
  });

  test('C44 — à la dernière étape, il n’y a pas d’étape suivante', () => {
    expect(getStep(path, 'cqrs')).toEqual({ index: 3, total: 3, next: null });
  });

  test('C41 — une fiche hors du parcours renvoie null', () => {
    expect(getStep(path, 'banque')).toBeNull();
  });
});

describe('phrase qui explique l’étape suivante', () => {
  test('C41 — l’étape suivante a l’étape courante pour prérequis : on reprend cette explication', () => {
    const path = buildPath(sheets, 'event-sourcing', none); // couches, ddd, cqrs, event-sourcing
    expect(getStepReason(sheets, path, 'couches')).toBe('Le DDD suppose de savoir séparer les couches.');
    expect(getStepReason(sheets, path, 'cqrs')).toBe('L’Event Sourcing s’appuie presque toujours sur CQRS.');
  });

  test('C41 — sinon, on reprend l’explication de la fiche du parcours qui a besoin de l’étape suivante', () => {
    const a = makeConcept({ id: 'a' });
    const b = makeConcept({ id: 'b' });
    const c = makeConcept({
      id: 'c',
      prerequisites: [
        { id: 'b', reason: 'C a besoin de B.' },
        { id: 'a', reason: 'C a besoin de A.' },
      ],
    });
    const all = [a, b, c];
    const path = buildPath(all, 'c', none); // b, a, c
    expect(getStepReason(all, path, 'b')).toBe('C a besoin de A.');
    expect(getStepReason(all, path, 'a')).toBe('C a besoin de A.');
  });

  test('C44 — à la dernière étape, il n’y a pas de phrase', () => {
    expect(getStepReason(sheets, ['couches'], 'couches')).toBeNull();
  });
});
