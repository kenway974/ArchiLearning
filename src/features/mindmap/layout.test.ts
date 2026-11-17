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

  test('C74 — secteurs à droite ; à gauche, de la racine vers l’extérieur : Concepts, familles, concepts, principes', () => {
    const graph = buildGraph(content);
    const positions = layoutGraph(graph);
    const xs = (type: string) => graph.nodes.filter((n) => n.type === type).map((n) => positions[n.id]!.x);
    const max = (v: number[]) => Math.max(...v);
    const min = (v: number[]) => Math.min(...v);
    expect(min(xs('sector'))).toBeGreaterThan(0);
    expect(positions.concepts!.x).toBeLessThan(0);
    expect(max(xs('family'))).toBeLessThan(positions.concepts!.x);
    expect(max(xs('concept'))).toBeLessThan(min(xs('family')));
    expect(max(xs('principle'))).toBeLessThan(min(xs('concept')));
  });

  test('C74 — les concepts d’une même famille sont regroupés, la famille est centrée sur eux', () => {
    const graph = buildGraph(content);
    const positions = layoutGraph(graph);
    for (const family of content.families) {
      const ys = family.concepts.map((c) => positions[c]!.y);
      const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
      expect(positions[family.id]!.y).toBeCloseTo(mean, 5);
      // aucun concept d'une autre famille entre le premier et le dernier de celle-ci
      const others = content.concepts.filter((c) => !family.concepts.includes(c.id));
      for (const o of others) {
        const y = positions[o.id]!.y;
        expect(y < Math.min(...ys) || y > Math.max(...ys), `${o.id} au milieu de ${family.id}`).toBe(true);
      }
    }
  });

  test('C74 — chaque principe est à la hauteur moyenne de ses concepts, à un écart près pour éviter les chevauchements', () => {
    const graph = buildGraph(makeContent());
    const positions = layoutGraph(graph);
    for (const p of makeContent().principles) {
      const ys = p.applications.map((a) => positions[a.concept]!.y);
      const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
      expect(Math.abs(positions[p.id]!.y - mean)).toBeLessThan(NODE_SIZE.height * 1.5);
    }
  });
});
