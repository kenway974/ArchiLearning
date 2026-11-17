import type { Content } from './schema';

export const ROOT_ID = 'root';
export const CONCEPTS_ID = 'concepts';
export const SECTORS_ID = 'sectors';

export type NodeType = 'root' | 'branch' | 'concept' | 'sector';

export type GraphNode = { id: string; label: string; type: NodeType; parentId: string | null };
export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: 'tree' | 'link';
  label?: string;
};
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Construit la mindmap à partir des fiches et des liens : rien n'est saisi à la main. */
export function buildGraph(content: Content): Graph {
  const nodes: GraphNode[] = [
    { id: ROOT_ID, label: 'Architectures logicielles', type: 'root', parentId: null },
    { id: CONCEPTS_ID, label: 'Concepts', type: 'branch', parentId: ROOT_ID },
    { id: SECTORS_ID, label: 'Secteurs', type: 'branch', parentId: ROOT_ID },
    ...content.concepts.map((c) => ({ id: c.id, label: c.title, type: 'concept' as const, parentId: CONCEPTS_ID })),
    ...content.sectors.map((s) => ({ id: s.id, label: s.title, type: 'sector' as const, parentId: SECTORS_ID })),
  ];

  const edges: GraphEdge[] = [
    ...nodes
      .filter((n) => n.parentId !== null)
      .map((n) => ({ id: `tree:${n.parentId}->${n.id}`, source: n.parentId!, target: n.id, type: 'tree' as const })),
    ...content.links.map((l) => ({ id: l.id, source: l.source, target: l.target, type: 'link' as const, label: l.title })),
  ];

  return { nodes, edges };
}

export type Neighborhood = { parent: string | null; children: string[]; related: string[] };

export function getNeighborhood(graph: Graph, id: string): Neighborhood {
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Nœud inconnu : ${id}`);
  const related = graph.edges
    .filter((e) => e.type === 'link' && (e.source === id || e.target === id))
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
