import { expect, test } from '@playwright/test';
import { IDS, answerQuiz, openSheetFromMap, press, seedProgress, sheet } from './helpers';

const s = sheet(IDS.concept);

test.describe('Quiz', () => {
  test('C50 — une réponse juste verrouille la question et affiche l’explication', async ({ page }, testInfo) => {
    await page.goto(`/cours/${s.id}`);
    const q = s.quiz[0]!;
    const question = page.getByRole('region', { name: 'Quiz' }).getByRole('group', { name: /^Question 1/ });
    await press(question.getByRole('button', { name: q.choices[q.answer]!, exact: true }), testInfo);

    await expect(question.getByText('Bonne réponse')).toBeVisible();
    await expect(question).toContainText(q.explanation);
    for (const choice of q.choices) {
      await expect(question.getByRole('button', { name: choice, exact: true })).toBeDisabled();
    }
  });

  test('C50 — une réponse fausse indique la bonne réponse, par une icône/un texte et pas seulement la couleur', async ({ page }, testInfo) => {
    await page.goto(`/cours/${s.id}`);
    const q = s.quiz[0]!;
    const wrong = (q.answer + 1) % q.choices.length;
    const question = page.getByRole('region', { name: 'Quiz' }).getByRole('group', { name: /^Question 1/ });
    await press(question.getByRole('button', { name: q.choices[wrong]!, exact: true }), testInfo);

    await expect(question.getByText('Mauvaise réponse')).toBeVisible();
    await expect(question).toContainText(q.explanation);
    const right = question.getByRole('button', { name: q.choices[q.answer]!, exact: true });
    await expect(right).toHaveAttribute('data-result', 'correct');
    await expect(right.getByRole('img', { name: 'Bonne réponse' })).toBeVisible();
    const chosen = question.getByRole('button', { name: q.choices[wrong]!, exact: true });
    await expect(chosen).toHaveAttribute('data-result', 'wrong');
    await expect(chosen.getByRole('img', { name: 'Ta réponse' })).toBeVisible();
  });

  test('C51 — le score s’affiche à la fin, « Recommencer » remet le quiz à zéro', async ({ page }, testInfo) => {
    await page.goto(`/cours/${s.id}`);
    const quiz = page.getByRole('region', { name: 'Quiz' });
    await expect(quiz.getByTestId('quiz-score')).toHaveCount(0);
    await answerQuiz(quiz, s, 2, testInfo);
    await expect(quiz.getByTestId('quiz-score')).toHaveText(`Score : 2 / ${s.quiz.length}`);

    await press(quiz.getByRole('button', { name: 'Recommencer' }), testInfo);
    await expect(quiz.getByTestId('quiz-score')).toHaveCount(0);
    const first = quiz.getByRole('group', { name: /^Question 1/ });
    await expect(first.getByRole('button', { name: s.quiz[0]!.choices[0]!, exact: true })).toBeEnabled();
  });

  test('C51 — le quiz fonctionne aussi dans le panneau de la carte', async ({ page }, testInfo) => {
    const panel = await openSheetFromMap(page, s.id, testInfo);
    const quiz = panel.getByRole('region', { name: 'Quiz' });
    await answerQuiz(quiz, s, s.quiz.length, testInfo);
    await expect(quiz.getByTestId('quiz-score')).toHaveText(`Score : ${s.quiz.length} / ${s.quiz.length}`);
  });

  test('C52 — le meilleur score est affiché et n’est pas écrasé par un moins bon', async ({ page }, testInfo) => {
    await seedProgress(page, { bestScores: { [s.id]: { correct: 2, total: s.quiz.length } } });
    await page.goto(`/cours/${s.id}`);
    const quiz = page.getByRole('region', { name: 'Quiz' });
    await expect(quiz).toContainText(`Meilleur score : 2 / ${s.quiz.length}`);

    await answerQuiz(quiz, s, 1, testInfo);
    await expect(quiz).toContainText(`Meilleur score : 2 / ${s.quiz.length}`);

    await press(quiz.getByRole('button', { name: 'Recommencer' }), testInfo);
    await answerQuiz(quiz, s, 3, testInfo);
    await expect(quiz).toContainText(`Meilleur score : 3 / ${s.quiz.length}`);
  });
});
