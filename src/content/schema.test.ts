import { conceptSheetSchema, linkSchema, sectorSheetSchema } from './schema';
import { makeConcept, makeLink, makeQuiz, makeSector } from '../../tests/fixtures/content';

describe('schéma des fiches concept', () => {
  test('C62 — une fiche concept complète est acceptée', () => {
    expect(conceptSheetSchema.safeParse(makeConcept({ id: 'cqrs' })).success).toBe(true);
  });

  test.each([
    'title',
    'summary',
    'problem',
    'teamSize',
    'linkedinPost',
  ] as const)('C62 — une fiche concept sans « %s » est refusée', (field) => {
    const sheet = { ...makeConcept({ id: 'cqrs' }), [field]: '' };
    expect(conceptSheetSchema.safeParse(sheet).success).toBe(false);
  });

  test.each(['whenToUse', 'whenToAvoid', 'pitfalls', 'tree'] as const)(
    'C62 — une fiche concept avec « %s » vide est refusée',
    (field) => {
      const sheet = { ...makeConcept({ id: 'cqrs' }), [field]: [] };
      expect(conceptSheetSchema.safeParse(sheet).success).toBe(false);
    },
  );

  test('C62 — un extrait de code vide est refusé', () => {
    const base = makeConcept({ id: 'cqrs' });
    const sheet = { ...base, code: { ...base.code, source: '' } };
    expect(conceptSheetSchema.safeParse(sheet).success).toBe(false);
  });

  test('C62 — un champ obligatoire absent est refusé', () => {
    const { problem: _omitted, ...sheet } = makeConcept({ id: 'cqrs' });
    expect(conceptSheetSchema.safeParse(sheet).success).toBe(false);
  });
});

describe('schéma des fiches secteur', () => {
  test('C63 — une fiche secteur complète est acceptée', () => {
    expect(sectorSheetSchema.safeParse(makeSector({ id: 'banque' })).success).toBe(true);
  });

  test.each(['small', 'medium', 'large'] as const)(
    'C63 — une fiche secteur sans recommandation pour la taille « %s » est refusée',
    (size) => {
      const base = makeSector({ id: 'banque' });
      const sheet = { ...base, bySize: { ...base.bySize, [size]: undefined } };
      expect(sectorSheetSchema.safeParse(sheet).success).toBe(false);
    },
  );

  test('C63 — une fiche secteur sans justification du langage est refusée', () => {
    const base = makeSector({ id: 'banque' });
    const sheet = { ...base, stack: { ...base.stack, why: '' } };
    expect(sectorSheetSchema.safeParse(sheet).success).toBe(false);
  });

  test('C63 — un dossier de l’arborescence sans explication est refusé', () => {
    const sheet = makeSector({
      id: 'banque',
      tree: [{ name: 'src', kind: 'dir', role: '', children: [] }],
    });
    expect(sectorSheetSchema.safeParse(sheet).success).toBe(false);
  });

  test('C63 — un fichier imbriqué sans explication est refusé', () => {
    const sheet = makeSector({
      id: 'banque',
      tree: [
        {
          name: 'src',
          kind: 'dir',
          role: 'Code source.',
          children: [{ name: 'main.ts', kind: 'file', role: '' }],
        },
      ],
    });
    expect(sectorSheetSchema.safeParse(sheet).success).toBe(false);
  });

  test('C63 — la liste des entreprises peut être vide, mais une entreprise citée a un fait et une source', () => {
    expect(sectorSheetSchema.safeParse(makeSector({ id: 'banque', companies: [] })).success).toBe(true);
    const sansSource = makeSector({
      id: 'banque',
      companies: [{ name: 'Exemple', fact: 'Utilise Java.', source: '' }],
    });
    expect(sectorSheetSchema.safeParse(sansSource).success).toBe(false);
  });
});

describe('schéma des quiz', () => {
  test.each([3, 5, 8])('C64 — un quiz de %i questions est accepté', (count) => {
    const sheet = makeConcept({ id: 'cqrs', quiz: makeQuiz(count) });
    expect(conceptSheetSchema.safeParse(sheet).success).toBe(true);
  });

  test.each([0, 2, 9])('C64 — un quiz de %i questions est refusé', (count) => {
    const sheet = makeConcept({ id: 'cqrs', quiz: makeQuiz(count) });
    expect(conceptSheetSchema.safeParse(sheet).success).toBe(false);
  });

  test('C64 — une question dont l’index de bonne réponse sort des choix est refusée', () => {
    const quiz = makeQuiz(3);
    quiz[0] = { ...quiz[0]!, answer: 3 };
    expect(conceptSheetSchema.safeParse(makeConcept({ id: 'cqrs', quiz })).success).toBe(false);
  });

  test('C64 — une question sans explication est refusée', () => {
    const quiz = makeQuiz(3);
    quiz[1] = { ...quiz[1]!, explanation: '' };
    expect(conceptSheetSchema.safeParse(makeConcept({ id: 'cqrs', quiz })).success).toBe(false);
  });

  test('C64 — une question avec moins de deux choix est refusée', () => {
    const quiz = makeQuiz(3);
    quiz[2] = { ...quiz[2]!, choices: ['Seule réponse'], answer: 0 };
    expect(conceptSheetSchema.safeParse(makeConcept({ id: 'cqrs', quiz })).success).toBe(false);
  });

  test('C64 — deux choix identiques dans une question sont refusés (bonne réponse ambiguë)', () => {
    const quiz = makeQuiz(3);
    quiz[0] = { ...quiz[0]!, choices: ['A', 'A', 'B'], answer: 0 };
    expect(conceptSheetSchema.safeParse(makeConcept({ id: 'cqrs', quiz })).success).toBe(false);
  });
});

describe('schéma des liens', () => {
  test('C65 — un lien complet est accepté', () => {
    expect(linkSchema.safeParse(makeLink('banque', 'event-sourcing')).success).toBe(true);
  });

  test.each(['title', 'explanation', 'source', 'target'] as const)(
    'C65 — un lien sans « %s » est refusé',
    (field) => {
      const link = { ...makeLink('banque', 'event-sourcing'), [field]: '' };
      expect(linkSchema.safeParse(link).success).toBe(false);
    },
  );
});
