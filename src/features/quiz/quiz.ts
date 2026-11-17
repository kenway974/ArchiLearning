import type { QuizQuestion } from '../../content/schema';

export type QuizScore = { correct: number; total: number; complete: boolean };

/** `answers[i]` = index du choix pour la question i, ou null si pas encore répondu. */
export function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[]): QuizScore {
  if (answers.length > questions.length) throw new Error('Plus de réponses que de questions');
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  const answered = questions.filter((_, i) => answers[i] !== null && answers[i] !== undefined).length;
  return { correct, total: questions.length, complete: answered === questions.length };
}
