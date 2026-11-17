import { getNeighborhood, type Graph } from '../../content/graph';
import { NODE_SIZE, type Position } from './layout';

/** Zoom minimal du mode focus : un nœud de 72 unités reste au-dessus de 44 px à l'écran. */
export const FOCUS_MIN_ZOOM = 0.7;
export const FOCUS_MAX_ZOOM = 1.2;

/** Ensemble net en mode focus : le nœud, son parent, ses enfants et ses nœuds reliés. */
export function focusSet(graph: Graph, id: string): Set<string> {
  const n = getNeighborhood(graph, id);
  return new Set([id, ...(n.parent ? [n.parent] : []), ...n.children, ...n.related]);
}

/** Zoom qui fait tenir le voisinage dans la zone visible, borné pour rester lisible et touchable. */
export function focusZoom(
  ids: Iterable<string>,
  positions: Record<string, Position>,
  view: { width: number; height: number },
  center: Position,
): number {
  let halfW = NODE_SIZE.width / 2;
  let halfH = NODE_SIZE.height / 2;
  for (const id of ids) {
    const p = positions[id];
    if (!p) continue;
    halfW = Math.max(halfW, Math.abs(p.x - center.x) + NODE_SIZE.width / 2);
    halfH = Math.max(halfH, Math.abs(p.y - center.y) + NODE_SIZE.height / 2);
  }
  const zoom = Math.min(view.width / (2 * halfW), view.height / (2 * halfH));
  return Math.min(FOCUS_MAX_ZOOM, Math.max(FOCUS_MIN_ZOOM, zoom));
}
