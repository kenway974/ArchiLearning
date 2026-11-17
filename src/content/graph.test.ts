import { buildGraph, getBreadcrumb, getNeighborhood, CONCEPTS_ID, ROOT_ID, SECTORS_ID } from './graph';
import { makeContent } from '../../tests/fixtures/content';

const graph = () => buildGraph(makeContent());
const ids = (xs: { id: string }[]) => xs.map((x) => x.id).sort();

describe('construction du graphe', () => {
  test('C14 — une racine « Architectures logicielles » et deux branches « Concepts » et « Secteurs »', () => {
    const g = graph();
    expect(g.nodes.find((n) => n.id === ROOT_ID)).toMatchObject({
      type: 'root',
      label: 'Architectures logicielles',
      parentId: null,
    });
    expect(g.nodes.find((n) => n.id === CONCEPTS_ID)).toMatchObject({ type: 'branch', label: 'Concepts', parentId: ROOT_ID });
    expect(g.nodes.find((n) => n.id === SECTORS_ID)).toMatchObject({ type: 'branch', label: 'Secteurs', parentId: ROOT_ID });
  });

  test('C14 — un nœud par fiche, rattaché à sa branche, avec le titre de la fiche', () => {
    const g = graph();
    const concepts = g.nodes.filter((n) => n.type === 'concept');
    const sectors = g.nodes.filter((n) => n.type === 'sector');
    expect(ids(concepts)).toEqual(['couches', 'cqrs', 'ddd', 'event-sourcing']);
    expect(ids(sectors)).toEqual(['banque', 'vitrine']);
    expect(concepts.every((n) => n.parentId === CONCEPTS_ID)).toBe(true);
    expect(sectors.every((n) => n.parentId === SECTORS_ID)).toBe(true);
    expect(g.nodes.find((n) => n.id === 'cqrs')?.label).toBe('CQRS');
    expect(g.nodes).toHaveLength(3 + 4 + 2);
  });

  test('C14 — une arête d’arbre relie chaque nœud à son parent', () => {
    const tree = graph().edges.filter((e) => e.type === 'tree');
    expect(tree).toHaveLength(2 + 4 + 2);
    expect(tree).toContainEqual(expect.objectContaining({ source: CONCEPTS_ID, target: 'cqrs' }));
    expect(tree).toContainEqual(expect.objectContaining({ source: ROOT_ID, target: SECTORS_ID }));
  });

  test('C15 — chaque lien transverse devient une arête étiquetée par son titre', () => {
    const links = graph().edges.filter((e) => e.type === 'link');
    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'banque--event-sourcing',
          source: 'banque',
          target: 'event-sourcing',
          label: 'banque → event-sourcing',
        }),
        expect.objectContaining({ id: 'cqrs--event-sourcing', label: 'cqrs → event-sourcing' }),
      ]),
    );
    expect(links).toHaveLength(2);
  });

  test('C15 — les identifiants d’arêtes sont uniques', () => {
    const edgeIds = graph().edges.map((e) => e.id);
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
  });
});

describe('voisinage d’un nœud', () => {
  test('C17 — parent, enfants et nœuds reliés d’une fiche', () => {
    expect(getNeighborhood(graph(), 'event-sourcing')).toEqual({
      parent: CONCEPTS_ID,
      children: [],
      related: ['banque', 'cqrs'],
    });
  });

  test('C17 — voisinage d’une branche : la racine et ses fiches', () => {
    const n = getNeighborhood(graph(), CONCEPTS_ID);
    expect(n.parent).toBe(ROOT_ID);
    expect([...n.children].sort()).toEqual(['couches', 'cqrs', 'ddd', 'event-sourcing']);
    expect(n.related).toEqual([]);
  });

  test('C17 — voisinage de la racine : pas de parent, les deux branches', () => {
    expect(getNeighborhood(graph(), ROOT_ID)).toEqual({
      parent: null,
      children: [CONCEPTS_ID, SECTORS_ID],
      related: [],
    });
  });

  test('C17 — un identifiant inconnu lève une erreur explicite', () => {
    expect(() => getNeighborhood(graph(), 'fantome')).toThrow(/fantome/);
  });
});

describe('fil d’Ariane', () => {
  test('C26 — le fil d’Ariane d’une fiche part de la racine', () => {
    expect(getBreadcrumb(graph(), 'cqrs')).toEqual([
      { id: ROOT_ID, label: 'Architectures logicielles' },
      { id: CONCEPTS_ID, label: 'Concepts' },
      { id: 'cqrs', label: 'CQRS' },
    ]);
  });

  test('C26 — le fil d’Ariane de la racine ne contient qu’elle', () => {
    expect(getBreadcrumb(graph(), ROOT_ID)).toEqual([{ id: ROOT_ID, label: 'Architectures logicielles' }]);
  });
});
