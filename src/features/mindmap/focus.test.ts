import { buildGraph, CONCEPTS_ID, PRINCIPLES_ID, ROOT_ID, SECTORS_ID } from '../../content/graph';
import { makeContent } from '../../../tests/fixtures/content';
import { content } from '../../content/index';
import { focusLayout, focusSet, focusZoom, FOCUS_GRID, FOCUS_MAX_ZOOM, FOCUS_MIN_ZOOM } from './focus';
import { layoutGraph, NODE_SIZE } from './layout';

const graph = buildGraph(makeContent());
const positions = layoutGraph(graph);

describe('mode focus mobile', () => {
  test('C25 — le voisinage net contient le nœud, son parent, ses enfants et ses nœuds reliés', () => {
    expect([...focusSet(graph, 'event-sourcing')].sort()).toEqual(['banque', 'cqrs', 'donnees', 'event-sourcing', 'lecture-ecriture']);
    expect([...focusSet(graph, ROOT_ID)].sort()).toEqual([CONCEPTS_ID, PRINCIPLES_ID, ROOT_ID, SECTORS_ID]);
  });

  test('C29 — le zoom du focus ne descend jamais sous le minimum qui garde 44 px', () => {
    const ids = focusSet(graph, ROOT_ID);
    expect(focusZoom(ids, positions, { width: 390, height: 700 }, positions[ROOT_ID]!)).toBe(FOCUS_MIN_ZOOM);
  });

  test('C25 — un voisinage petit est affiché sans dépasser le zoom maximal', () => {
    expect(focusZoom(['cqrs'], positions, { width: 1000, height: 1000 }, positions.cqrs!)).toBe(FOCUS_MAX_ZOOM);
  });
});

describe('disposition du mode focus mobile', () => {
  test('C25 — le nœud garde sa place, son parent passe au-dessus, ses enfants en grille de deux colonnes en dessous', () => {
    const { positions } = focusLayout(graph, layoutGraph(graph), CONCEPTS_ID);
    const f = positions[CONCEPTS_ID]!;
    expect(f).toEqual(layoutGraph(graph)[CONCEPTS_ID]);
    expect(positions[ROOT_ID]!.x).toBe(f.x);
    expect(positions[ROOT_ID]!.y).toBeLessThan(f.y);
    const kids = ['organiser', 'metier', 'donnees'].map((id) => positions[id]!);
    expect(new Set(kids.map((k) => k.x - f.x))).toEqual(new Set([-FOCUS_GRID.column, FOCUS_GRID.column]));
    expect(kids.every((k) => k.y > f.y)).toBe(true);
  });

  test('C25 — les nœuds reliés (principes, liens) se rangent sous les enfants', () => {
    const { positions } = focusLayout(graph, layoutGraph(graph), 'event-sourcing');
    const f = positions['event-sourcing']!;
    for (const id of ['banque', 'cqrs', 'lecture-ecriture']) {
      expect(positions[id]!.y).toBeGreaterThan(f.y);
      expect(Math.abs(positions[id]!.x - f.x)).toBe(FOCUS_GRID.column);
    }
  });

  test.each([
    ['contenu de test', graph],
    ['contenu réel', buildGraph(content)],
  ])('C25 — %s : aucun nœud visible ne se chevauche en mode focus, quel que soit le nœud choisi', (_label, g) => {
    const base = layoutGraph(g);
    for (const focus of g.nodes.map((n) => n.id)) {
      const { positions, hidden } = focusLayout(g, base, focus);
      const visible = Object.entries(positions).filter(([id]) => !hidden.has(id));
      for (let i = 0; i < visible.length; i++) {
        for (let j = i + 1; j < visible.length; j++) {
          const [a, pa] = visible[i]!;
          const [b, pb] = visible[j]!;
          const overlap = Math.abs(pa.x - pb.x) < NODE_SIZE.width && Math.abs(pa.y - pb.y) < NODE_SIZE.height;
          expect(overlap, `${focus} : ${a} chevauche ${b}`).toBe(false);
        }
      }
    }
  });
});
