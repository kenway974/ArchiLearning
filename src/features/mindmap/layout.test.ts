import { layoutGraph, NODE_SIZE } from './layout';
import { buildGraph, ROOT_ID } from '../../content/graph';
import { content } from '../../content';
import { makeContent } from '../../../tests/fixtures/content';

type Box = { x: number; y: number };
const overlap = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) < NODE_SIZE.width && Math.abs(a.y - b.y) < NODE_SIZE.height;

describe('disposition de la carte', () => {
  test('C16 — chaque nœud reçoit une position finie', () => {
    const graph = buildGraph(makeContent());
    const positions = layoutGraph(graph);
    for (const node of graph.nodes) {
      const p = positions[node.id];
      expect(p, node.id).toBeDefined();
      expect(Number.isFinite(p!.x) && Number.isFinite(p!.y)).toBe(true);
    }
  });

  test('C16 — même contenu, même disposition (déterministe)', () => {
    expect(layoutGraph(buildGraph(makeContent()))).toEqual(layoutGraph(buildGraph(makeContent())));
  });

  test('C16 — la racine est au centre (0, 0)', () => {
    expect(layoutGraph(buildGraph(makeContent()))[ROOT_ID]).toEqual({ x: 0, y: 0 });
  });

  test('C16 — aucun nœud ne chevauche un autre, sur le contenu réel', () => {
    const positions: [string, Box][] = Object.entries(layoutGraph(buildGraph(content)));
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const [idA, a] = positions[i]!;
        const [idB, b] = positions[j]!;
        expect(overlap(a, b), `${idA} chevauche ${idB}`).toBe(false);
      }
    }
  });

  test('C16 — les concepts et les secteurs occupent deux côtés distincts de la racine', () => {
    const graph = buildGraph(content);
    const positions = layoutGraph(graph);
    const side = (type: string) =>
      graph.nodes.filter((n) => n.type === type).map((n) => Math.sign(positions[n.id]!.x));
    expect(new Set(side('concept'))).toEqual(new Set([-1]));
    expect(new Set(side('sector'))).toEqual(new Set([1]));
  });
});
