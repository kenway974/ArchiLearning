import {
  buildGraph,
  getBreadcrumb,
  getNeighborhood,
  CONCEPTS_ID,
  PRINCIPLES_ID,
  ROOT_ID,
  SECTORS_ID,
} from './graph';
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

  test('C14 — un nœud par fiche, avec le titre de la fiche ; les secteurs sont rattachés à leur branche', () => {
    const g = graph();
    expect(ids(g.nodes.filter((n) => n.type === 'concept'))).toEqual(['couches', 'cqrs', 'ddd', 'event-sourcing']);
    expect(ids(g.nodes.filter((n) => n.type === 'sector'))).toEqual(['banque', 'vitrine']);
    expect(g.nodes.filter((n) => n.type === 'sector').every((n) => n.parentId === SECTORS_ID)).toBe(true);
    expect(g.nodes.find((n) => n.id === 'cqrs')?.label).toBe('CQRS');
  });

  test('C72 — chaque concept est rattaché à sa famille, chaque famille à la branche Concepts', () => {
    const g = graph();
    const families = g.nodes.filter((n) => n.type === 'family');
    expect(ids(families)).toEqual(['donnees', 'metier', 'organiser']);
    expect(families.every((f) => f.parentId === CONCEPTS_ID)).toBe(true);
    expect(g.nodes.find((n) => n.id === 'cqrs')?.parentId).toBe('donnees');
    expect(g.nodes.find((n) => n.id === 'donnees')?.label).toBe('Famille donnees');
  });

  test('C14 — une arête d’arbre relie chaque nœud de l’arbre à son parent', () => {
    const tree = graph().edges.filter((e) => e.type === 'tree');
    expect(tree).toContainEqual(expect.objectContaining({ source: 'donnees', target: 'cqrs' }));
    expect(tree).toContainEqual(expect.objectContaining({ source: CONCEPTS_ID, target: 'donnees' }));
    expect(tree).toContainEqual(expect.objectContaining({ source: ROOT_ID, target: SECTORS_ID }));
    // racine → 2 branches, Concepts → 3 familles, familles → 4 concepts, Secteurs → 2 secteurs
    expect(tree).toHaveLength(2 + 3 + 4 + 2);
  });

  test('C73 — les principes sont des nœuds d’un groupe « Principes partagés », reliés à chaque concept qui les applique', () => {
    const g = graph();
    expect(g.nodes.find((n) => n.id === PRINCIPLES_ID)).toMatchObject({ type: 'principles', label: 'Principes partagés' });
    expect(g.nodes.filter((n) => n.type === 'principle').map((n) => [n.id, n.parentId])).toEqual([
      ['separation', PRINCIPLES_ID],
      ['lecture-ecriture', PRINCIPLES_ID],
    ]);
    const edges = g.edges.filter((e) => e.type === 'principle');
    expect(edges.map((e) => `${e.source}->${e.target}`).sort()).toEqual([
      'lecture-ecriture->cqrs',
      'lecture-ecriture->event-sourcing',
      'separation->couches',
      'separation->ddd',
    ]);
    // le groupe des principes n'est pas relié par une arête qui traverserait la carte
    expect(g.edges.some((e) => e.target === PRINCIPLES_ID || e.source === PRINCIPLES_ID)).toBe(false);
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
  test('C17 — parent, enfants et nœuds reliés d’un concept (liens et principes)', () => {
    expect(getNeighborhood(graph(), 'event-sourcing')).toEqual({
      parent: 'donnees',
      children: [],
      related: ['banque', 'cqrs', 'lecture-ecriture'],
    });
  });

  test('C17 — voisinage d’un principe : les concepts qui l’appliquent', () => {
    expect(getNeighborhood(graph(), 'lecture-ecriture')).toEqual({
      parent: PRINCIPLES_ID,
      children: [],
      related: ['cqrs', 'event-sourcing'],
    });
  });

  test('C17 — voisinage d’une branche : la racine et ses familles', () => {
    const n = getNeighborhood(graph(), CONCEPTS_ID);
    expect(n.parent).toBe(ROOT_ID);
    expect([...n.children].sort()).toEqual(['donnees', 'metier', 'organiser']);
    expect(n.related).toEqual([]);
  });

  test('C17 — voisinage de la racine : pas de parent, les branches', () => {
    expect(getNeighborhood(graph(), ROOT_ID)).toEqual({
      parent: null,
      children: [CONCEPTS_ID, SECTORS_ID, PRINCIPLES_ID],
      related: [],
    });
  });

  test('C17 — un identifiant inconnu lève une erreur explicite', () => {
    expect(() => getNeighborhood(graph(), 'fantome')).toThrow(/fantome/);
  });
});

describe('fil d’Ariane', () => {
  test('C26 — le fil d’Ariane d’un concept passe par sa famille', () => {
    expect(getBreadcrumb(graph(), 'cqrs')).toEqual([
      { id: ROOT_ID, label: 'Architectures logicielles' },
      { id: CONCEPTS_ID, label: 'Concepts' },
      { id: 'donnees', label: 'Famille donnees' },
      { id: 'cqrs', label: 'CQRS' },
    ]);
  });

  test('C26 — le fil d’Ariane d’un principe', () => {
    expect(getBreadcrumb(graph(), 'separation').map((c) => c.id)).toEqual([ROOT_ID, PRINCIPLES_ID, 'separation']);
  });

  test('C26 — le fil d’Ariane de la racine ne contient qu’elle', () => {
    expect(getBreadcrumb(graph(), ROOT_ID)).toEqual([{ id: ROOT_ID, label: 'Architectures logicielles' }]);
  });
});
