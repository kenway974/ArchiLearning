import type { Content } from './schema';

export const ROOT_ID = 'root';
export const CONCEPTS_ID = 'concepts';
export const SECTORS_ID = 'sectors';
/** Groupe des principes partagés : un en-tête de colonne, pas relié par une arête. */
export const PRINCIPLES_ID = 'principles';

export type NodeType = 'root' | 'branch' | 'family' | 'concept' | 'sector' | 'principles' | 'principle';

export type GraphNode = { id: string; label: string; type: NodeType; parentId: string | null };
export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  /** tree : parent → enfant ; link : lien transverse ; principle : principe → concept qui l'applique */
  type: 'tree' | 'link' | 'principle';
  label?: string;
};
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Construit la mindmap à partir du contenu : rien n'est saisi deux fois. */
export function buildGraph(content: Content): Graph {
  const familyOf = new Map(content.families.flatMap((f) => f.concepts.map((c) => [c, f.id] as const)));

  const nodes: GraphNode[] = [
    { id: ROOT_ID, label: 'Architectures logicielles', type: 'root', parentId: null },
    { id: CONCEPTS_ID, label: 'Concepts', type: 'branch', parentId: ROOT_ID },
    { id: SECTORS_ID, label: 'Secteurs', type: 'branch', parentId: ROOT_ID },
    { id: PRINCIPLES_ID, label: 'Principes partagés', type: 'principles', parentId: ROOT_ID },
    ...content.families.map((f) => ({ id: f.id, label: f.title, type: 'family' as const, parentId: CONCEPTS_ID })),
    ...content.concepts.map((c) => ({
      id: c.id,
      label: c.title,
      type: 'concept' as const,
      parentId: familyOf.get(c.id) ?? CONCEPTS_ID,
    })),
    ...content.sectors.map((s) => ({ id: s.id, label: s.title, type: 'sector' as const, parentId: SECTORS_ID })),
    ...content.principles.map((p) => ({ id: p.id, label: p.title, type: 'principle' as const, parentId: PRINCIPLES_ID })),
  ];

  // Les principes ne sont pas reliés à leur groupe par une arête : elle traverserait la carte.
  const drawnTree = (n: GraphNode) => n.parentId !== null && n.type !== 'principles' && n.type !== 'principle';

  const edges: GraphEdge[] = [
    ...nodes
      .filter(drawnTree)
      .map((n) => ({ id: `tree:${n.parentId}->${n.id}`, source: n.parentId!, target: n.id, type: 'tree' as const })),
    ...content.links.map((l) => ({ id: l.id, source: l.source, target: l.target, type: 'link' as const, label: l.title })),
    ...content.principles.flatMap((p) =>
      p.applications.map((a) => ({
        id: `principle:${p.id}->${a.concept}`,
        source: p.id,
        target: a.concept,
        type: 'principle' as const,
      })),
    ),
  ];

  return { nodes, edges };
}

export type Neighborhood = { parent: string | null; children: string[]; related: string[] };

export function getNeighborhood(graph: Graph, id: string): Neighborhood {
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Nœud inconnu : ${id}`);
  const related = graph.edges
    .filter((e) => e.type !== 'tree' && (e.source === id || e.target === id))
    .map((e) => (e.source === id ? e.target : e.source))
    .sort();
  return {
    parent: node.parentId,
    children: graph.nodes.filter((n) => n.parentId === id).map((n) => n.id),
    related,
  };
}

export function getBreadcrumb(graph: Graph, id: string): { id: string; label: string }[] {
  const trail: { id: string; label: string }[] = [];
  let current = graph.nodes.find((n) => n.id === id);
  while (current) {
    trail.unshift({ id: current.id, label: current.label });
    const parentId = current.parentId;
    current = parentId === null ? undefined : graph.nodes.find((n) => n.id === parentId);
  }
  return trail;
}
