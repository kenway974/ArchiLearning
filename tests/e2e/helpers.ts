/**
 * Outils partagés par les tests de bout en bout.
 *
 * Contrat DOM attendu de l'application (à respecter par l'implémentation) :
 * - nœud de la carte : élément `[data-node-id="<id>"]`, rôle `button`, nom accessible
 *   « <titre>, concept|secteur, lu|non lu » ; attributs `data-dimmed`, `data-read`,
 *   `data-next` et `data-focused` valant "true" ou "false".
 * - étiquette de lien : bouton `[data-link-id="<id>"]`, nom « Lien : <titre> »,
 *   attributs `data-dimmed` et `data-highlighted`.
 * - fond de carte : `.react-flow__viewport` (sa transformation CSS donne zoom et déplacement).
 * - panneau de fiche (latéral ou du bas) : rôle `dialog` nommé par le titre de la fiche ;
 *   sur mobile, attribut `data-snap` = "half" | "full".
 * - barre de navigation : `nav` nommée « Navigation principale ».
 * - fil d'Ariane : `nav` nommée « Fil d’Ariane ».
 */
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { content } from '../../src/content/index';
import type { Sheet } from '../../src/content/schema';
import type { Progress } from '../../src/features/progress/progress';
import { STORAGE_KEY } from '../../src/features/progress/storage';

export const allSheets: Sheet[] = [...content.concepts, ...content.sectors];

export function sheet(id: string): Sheet {
  const found = allSheets.find((s) => s.id === id);
  if (!found) throw new Error(`Fiche inconnue dans le contenu : ${id}`);
  return found;
}

export function link(id: string) {
  const found = content.links.find((l) => l.id === id);
  if (!found) throw new Error(`Lien inconnu dans le contenu : ${id}`);
  return found;
}

export function familyOf(conceptId: string) {
  const found = content.families.find((f) => f.concepts.includes(conceptId));
  if (!found) throw new Error(`Concept sans famille : ${conceptId}`);
  return found;
}

export function principle(id: string) {
  const found = content.principles.find((p) => p.id === id);
  if (!found) throw new Error(`Principe inconnu : ${id}`);
  return found;
}

/** Fiches de référence utilisées par les tests. */
export const IDS = {
  concept: 'cqrs',
  conceptSansPrerequis: 'transaction-script',
  sector: 'banque-fintech',
  link: 'banque-fintech--event-sourcing',
  principle: 'separer-lecture-ecriture',
} as const;

export const isMobile = (testInfo: TestInfo) => testInfo.project.name === 'mobile';

export function emptyProgress(): Progress {
  return { read: [], bestScores: {}, activePath: null, theme: 'system' };
}

/** Écrit une progression dans localStorage avant le chargement de la page. */
export async function seedProgress(page: Page, progress: Partial<Progress>) {
  const value = JSON.stringify({ ...emptyProgress(), ...progress });
  await page.addInitScript(
    ([key, v]) => {
      if (!sessionStorage.getItem('__seeded')) {
        localStorage.setItem(key, v);
        sessionStorage.setItem('__seeded', '1');
      }
    },
    [STORAGE_KEY, value] as const,
  );
}

export async function readStoredProgress(page: Page): Promise<Progress | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Progress) : null;
}

export const mapNode = (page: Page, id: string): Locator => page.locator(`[data-node-id="${id}"]`);
export const linkLabel = (page: Page, id: string): Locator => page.locator(`[data-link-id="${id}"]`);
export const sheetPanel = (page: Page, title: string): Locator => page.getByRole('dialog', { name: title });
export const mainNav = (page: Page): Locator => page.getByRole('navigation', { name: 'Navigation principale' });

/** Ouvre la carte et attend qu'elle soit stable. */
export async function openMap(page: Page, path = '/carte') {
  await page.goto(path);
  await expect(page.locator('.react-flow__viewport')).toBeVisible();
  await waitForViewportStable(page);
}

/** Zoom et déplacement courants de la carte, lus dans la transformation CSS. */
export async function viewportTransform(page: Page) {
  return page.locator('.react-flow__viewport').evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { x: m.e, y: m.f, zoom: m.a };
  });
}

/** Attend la fin des animations de la carte (transformation identique sur deux mesures). */
export async function waitForViewportStable(page: Page) {
  let previous = '';
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await viewportTransform(page));
        const stable = now === previous;
        previous = now;
        return stable;
      },
      { intervals: [150], timeout: 5000 },
    )
    .toBe(true);
}

/** Centre d'un élément dans la fenêtre. */
export async function centerOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Élément non affiché');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Pincement à deux doigts (Chromium uniquement), scale > 1 pour zoomer. */
export async function pinch(page: Page, scaleFactor: number) {
  const size = page.viewportSize()!;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.synthesizePinchGesture', {
    x: size.width / 2,
    y: size.height / 2,
    scaleFactor,
    gestureSourceType: 'touch',
  });
}

/** Glissement d'un doigt d'un point à un autre (événements tactiles réels). */
export async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page);
  const steps = 10;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/** Clique (ordinateur) ou touche (mobile) un élément. */
export async function press(locator: Locator, testInfo: TestInfo) {
  if (isMobile(testInfo)) await locator.tap();
  else await locator.click();
}

/** Ouvre la fiche d'un nœud depuis la carte, sur ordinateur comme sur mobile. */
export async function openSheetFromMap(page: Page, id: string, testInfo: TestInfo) {
  await openMap(page, `/carte/${id}`);
  const panel = sheetPanel(page, sheet(id).title);
  await expect(panel).toBeVisible();
  if (isMobile(testInfo)) {
    await panel.getByRole('button', { name: 'Voir toute la fiche' }).tap();
    await expect(panel).toHaveAttribute('data-snap', 'full');
  }
  return panel;
}

/** Répond à toutes les questions du quiz d'une fiche. `correct` = nombre de bonnes réponses voulues. */
export async function answerQuiz(scope: Locator, s: Sheet, correct: number, testInfo: TestInfo) {
  const questions = scope.getByRole('group', { name: /^Question \d+/ });
  for (let i = 0; i < s.quiz.length; i++) {
    const q = s.quiz[i]!;
    const choiceIndex = i < correct ? q.answer : (q.answer + 1) % q.choices.length;
    await press(questions.nth(i).getByRole('button', { name: q.choices[choiceIndex]!, exact: true }), testInfo);
  }
}
