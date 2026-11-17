import { scoreQuiz } from './quiz';
import { makeQuiz } from '../../../tests/fixtures/content';

// makeQuiz(n) : la bonne réponse de la question i est i % 3.
const quiz = makeQuiz(4); // bonnes réponses : 0, 1, 2, 0

describe('score du quiz', () => {
  test('C51 — toutes les réponses justes', () => {
    expect(scoreQuiz(quiz, [0, 1, 2, 0])).toEqual({ correct: 4, total: 4, complete: true });
  });

  test('C51 — réponses en partie fausses', () => {
    expect(scoreQuiz(quiz, [0, 0, 2, 1])).toEqual({ correct: 2, total: 4, complete: true });
  });

  test('C51 — tant qu’une question n’a pas de réponse, le quiz n’est pas terminé', () => {
    expect(scoreQuiz(quiz, [0, null, 2, 0])).toEqual({ correct: 3, total: 4, complete: false });
  });

  test('C51 — aucune réponse', () => {
    expect(scoreQuiz(quiz, [])).toEqual({ correct: 0, total: 4, complete: false });
  });

  test('C51 — plus de réponses que de questions : erreur explicite', () => {
    expect(() => scoreQuiz(quiz, [0, 1, 2, 0, 1])).toThrow();
  });
});
