import { useEffect, useId, useRef, useState } from 'react';
import type { QuizQuestion } from '../../content/schema';
import { Icon } from '../../shared/Icon';
import { useProgress } from '../progress/ProgressContext';
import { scoreQuiz } from './quiz';

export function Quiz({ sheetId, questions }: { sheetId: string; questions: QuizQuestion[] }) {
  const { progress, recordQuiz } = useProgress();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [attempt, setAttempt] = useState(0);
  const recorded = useRef(false);
  const score = scoreQuiz(questions, answers);
  const best = progress.bestScores[sheetId];
  const baseId = useId();

  // Enregistre le résultat une seule fois par tentative, quand toutes les réponses sont données.
  useEffect(() => {
    if (score.complete && !recorded.current) {
      recorded.current = true;
      recordQuiz(sheetId, { correct: score.correct, total: score.total });
    }
  }, [score.complete, score.correct, score.total, sheetId, recordQuiz]);

  const restart = () => {
    recorded.current = false;
    setAnswers(questions.map(() => null));
    setAttempt((a) => a + 1);
  };

  return (
    <div className="quiz" key={attempt}>
      {best && (
        <p className="quiz-best">
          <Icon name="star" size={16} /> Meilleur score : {best.correct} / {best.total}
        </p>
      )}
      {questions.map((q, qi) => {
        const answer = answers[qi] ?? null;
        const answered = answer !== null;
        return (
          <fieldset key={qi} className="quiz-question">
            <legend>
              Question {qi + 1} : {q.question}
            </legend>
            <div className="quiz-choices">
              {q.choices.map((choice, ci) => {
                const isRight = ci === q.answer;
                const isChosen = ci === answer;
                const result = !answered ? undefined : isRight ? 'correct' : isChosen ? 'wrong' : 'other';
                const labelId = `${baseId}-${qi}-${ci}`;
                return (
                  <button
                    key={ci}
                    type="button"
                    className="quiz-choice"
                    aria-labelledby={labelId}
                    disabled={answered}
                    data-result={result}
                    onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? ci : v)))}
                  >
                    <span id={labelId}>{choice}</span>
                    {answered && isRight && <Icon name="check" size={18} label="Bonne réponse" className="quiz-mark" />}
                    {answered && isChosen && !isRight && <Icon name="cross" size={18} label="Ta réponse" className="quiz-mark" />}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className={answer === q.answer ? 'quiz-feedback ok' : 'quiz-feedback ko'} role="status">
                <strong>{answer === q.answer ? 'Bonne réponse' : 'Mauvaise réponse'}</strong>
                <p>{q.explanation}</p>
              </div>
            )}
          </fieldset>
        );
      })}
      {score.complete && (
        <div className="quiz-end">
          <p data-testid="quiz-score" className="quiz-score">
            Score : {score.correct} / {score.total}
          </p>
          <button type="button" className="btn" onClick={restart}>
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
