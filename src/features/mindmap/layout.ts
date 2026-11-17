import { CONCEPTS_ID, ROOT_ID, SECTORS_ID, type Graph } from '../../content/graph';

/** Taille d'un nœud en unités de la carte (assez grand pour rester touchable à 70 % de zoom). */
export const NODE_SIZE = { width: 200, height: 72 } as const;

export type Position = { x: number; y: number };

/** Distance horizontale entre la racine et chaque branche. */
const BRANCH_OFFSET = 345;
/** Distance horizontale entre une branche et ses colonnes d'enfants. */
const COLUMN_OFFSET = 115;
const ROW_STEP = 88;

/**
 * Lignes occupées autour de la branche : la moitié au-dessus, la moitié en dessous,
 * en laissant libre la ligne de la branche elle-même.
 */
function rowOffsets(rows: number): number[] {
  const above = Math.ceil(rows / 2);
  const below = rows - above;
  return [
    ...Array.from({ length: above }, (_, i) => -(above - i) * ROW_STEP),
    ...Array.from({ length: below }, (_, i) => (i + 1) * ROW_STEP),
  ];
}

/**
 * Disposition déterministe : racine au centre, Concepts à gauche, Secteurs à droite.
 * Les fiches d'une branche sont sur deux colonnes qui encadrent la branche, ce qui garde
 * une branche et toutes ses fiches dans un petit rectangle (utile pour le mode focus mobile).
 */
export function layoutGraph(graph: Graph): Record<string, Position> {
  const positions: Record<string, Position> = { [ROOT_ID]: { x: 0, y: 0 } };

  const placeBranch = (branchId: string, side: -1 | 1) => {
    const bx = side * BRANCH_OFFSET;
    positions[branchId] = { x: bx, y: 0 };
    const children = graph.nodes.filter((n) => n.parentId === branchId);
    const rows = rowOffsets(Math.ceil(children.length / 2));
    children.forEach((child, i) => {
      const inner = i % 2 === 0; // colonne la plus proche de la racine
      const x = bx + (inner ? -side : side) * COLUMN_OFFSET;
      positions[child.id] = { x, y: rows[Math.floor(i / 2)]! };
    });
  };

  placeBranch(CONCEPTS_ID, -1);
  placeBranch(SECTORS_ID, 1);
  return positions;
}
