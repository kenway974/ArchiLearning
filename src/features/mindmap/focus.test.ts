import { buildGraph, CONCEPTS_ID, ROOT_ID, SECTORS_ID } from '../../content/graph';
import { makeContent } from '../../../tests/fixtures/content';
import { focusSet, focusZoom, FOCUS_MAX_ZOOM, FOCUS_MIN_ZOOM } from './focus';
import { layoutGraph } from './layout';

const graph = buildGraph(makeContent());
const positions = layoutGraph(graph);

describe('mode focus mobile', () => {
  test('C25 — le voisinage net contient le nœud, son parent, ses enfants et ses nœuds reliés', () => {
    expect([...focusSet(graph, 'event-sourcing')].sort()).toEqual(['banque', CONCEPTS_ID, 'cqrs', 'event-sourcing']);
    expect([...focusSet(graph, ROOT_ID)].sort()).toEqual([CONCEPTS_ID, ROOT_ID, SECTORS_ID]);
  });

  test('C29 — le zoom du focus ne descend jamais sous le minimum qui garde 44 px', () => {
    const ids = focusSet(graph, ROOT_ID);
    expect(focusZoom(ids, positions, { width: 390, height: 700 }, positions[ROOT_ID]!)).toBe(FOCUS_MIN_ZOOM);
  });

  test('C25 — un voisinage petit est affiché sans dépasser le zoom maximal', () => {
    expect(focusZoom(['cqrs'], positions, { width: 1000, height: 1000 }, positions.cqrs!)).toBe(FOCUS_MAX_ZOOM);
  });
});
