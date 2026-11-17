import { getNeighborhood, type Graph } from '../../content/graph';
import { NODE_SIZE, type Position } from './layout';

/** Zoom minimal du mode focus : un nœud de 72 unités reste au-dessus de 44 px à l'écran. */
export const FOCUS_MIN_ZOOM = 0.7;
/** Zoom du mode focus mobile : deux colonnes de nœuds tiennent dans 390 px. */
export const FOCUS_ZOOM = 0.74;
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

/** Mode focus mobile : pas vertical de la grille et écarts. */
export const FOCUS_GRID = {
  parentGap: 170,
  firstRow: 150,
  row: 96,
  /** Rangée plus haute pour les nœuds reliés : leur étiquette de lien se place au-dessus. */
  relatedRow: 140,
  column: 120,
  sectionGap: 40,
} as const;

export type FocusLayout = {
  positions: Record<string, Position>;
  /** Nœuds hors du voisinage qui tomberaient dans la zone du focus : masqués. */
  hidden: Set<string>;
};

/**
 * Mode focus mobile : le nœud garde sa place, son parent passe au-dessus, ses enfants puis ses
 * nœuds reliés se rangent en grille de deux colonnes en dessous. Les autres nœuds gardent leur
 * place (estompés) ; ceux qui tomberaient dans la zone du focus sont masqués.
 */
export function focusLayout(graph: Graph, base: Record<string, Position>, focusId: string): FocusLayout {
  const f = base[focusId];
  if (!f) return { positions: base, hidden: new Set() };
  const n = getNeighborhood(graph, focusId);
  const positions: Record<string, Position> = { ...base, [focusId]: { ...f } };
  if (n.parent) positions[n.parent] = { x: f.x, y: f.y - FOCUS_GRID.parentGap };

  const g = FOCUS_GRID;
  const children = n.children;
  const related = n.related.filter((id) => id !== n.parent && !children.includes(id));
  children.forEach((id, i) => {
    positions[id] = { x: f.x + (i % 2 === 0 ? -g.column : g.column), y: f.y + g.firstRow + Math.floor(i / 2) * g.row };
  });
  const relatedStart =
    f.y + (children.length ? g.firstRow + Math.ceil(children.length / 2) * g.row + g.sectionGap : g.firstRow) + (g.relatedRow - g.row);
  related.forEach((id, i) => {
    positions[id] = { x: f.x + (i % 2 === 0 ? -g.column : g.column), y: relatedStart + Math.floor(i / 2) * g.relatedRow };
  });

  const inFocus = new Set([focusId, ...(n.parent ? [n.parent] : []), ...children, ...related]);
  const ys = [...inFocus].map((id) => positions[id]!.y);
  const box = {
    left: f.x - g.column - NODE_SIZE.width,
    right: f.x + g.column + NODE_SIZE.width,
    top: Math.min(...ys) - NODE_SIZE.height,
    bottom: Math.max(...ys) + NODE_SIZE.height,
  };
  const hidden = new Set(
    Object.entries(base)
      .filter(([id, p]) => !inFocus.has(id) && p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom)
      .map(([id]) => id),
  );
  return { positions, hidden };
}

/** Centre de la vue en mode focus : le nœud à l'horizontale, l'ensemble du voisinage à la verticale. */
export function focusCenter(layout: FocusLayout, ids: Iterable<string>, focusId: string): Position {
  const f = layout.positions[focusId]!;
  const ys = [...ids].map((id) => layout.positions[id]?.y).filter((v): v is number => v !== undefined);
  const top = Math.min(f.y, ...ys);
  const bottom = Math.max(f.y, ...ys);
  // Le nœud reste dans le tiers supérieur au plus : on borne le décalage vers le bas
  return { x: f.x, y: Math.min((top + bottom) / 2, f.y + 220) };
}
