import { CONCEPTS_ID, PRINCIPLES_ID, ROOT_ID, SECTORS_ID, type Graph } from '../../content/graph';

/** Taille d'un nœud en unités de la carte (assez grand pour rester touchable à 70 % de zoom). */
export const NODE_SIZE = { width: 220, height: 76 } as const;

export type Position = { x: number; y: number };

/** Colonnes, de la droite vers la gauche (x négatif) et vers la droite pour les secteurs. */
const X = {
  sectorsBranch: 330,
  sectors: 640,
  conceptsBranch: -330,
  families: -640,
  concepts: -950,
  principles: -1290,
} as const;
/** Pas vertical entre deux nœuds d'une même colonne. */
const ROW = 96;
/** Espace supplémentaire entre deux familles. */
const FAMILY_GAP = 36;
/** Écart vertical minimal entre deux principes. */
const PRINCIPLE_GAP = 92;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Disposition déterministe en arbre horizontal :
 * - racine au centre, secteurs à droite ;
 * - à gauche : branche Concepts → familles → concepts → principes ;
 * - chaque parent est centré sur ses enfants ; chaque principe est placé à la hauteur
 *   moyenne des concepts qui le partagent, puis écarté de ses voisins pour ne pas les chevaucher.
 */
export function layoutGraph(graph: Graph): Record<string, Position> {
  const positions: Record<string, Position> = { [ROOT_ID]: { x: 0, y: 0 } };
  const childrenOf = (id: string) => graph.nodes.filter((n) => n.parentId === id);

  // Concepts, rangés famille par famille
  const families = childrenOf(CONCEPTS_ID);
  let y = 0;
  const conceptYs: Record<string, number> = {};
  families.forEach((family, fi) => {
    if (fi > 0) y += FAMILY_GAP;
    for (const concept of childrenOf(family.id)) {
      conceptYs[concept.id] = y;
      y += ROW;
    }
  });
  // Concepts sans famille (ne devrait pas arriver : la validation l'interdit)
  for (const concept of childrenOf(CONCEPTS_ID).filter((n) => n.type === 'concept')) {
    conceptYs[concept.id] = y;
    y += ROW;
  }
  const height = y - ROW;
  for (const [id, cy] of Object.entries(conceptYs)) positions[id] = { x: X.concepts, y: cy - height / 2 };
  for (const family of families) {
    const ys = childrenOf(family.id).map((c) => positions[c.id]!.y);
    positions[family.id] = { x: X.families, y: ys.length ? mean(ys) : 0 };
  }
  positions[CONCEPTS_ID] = { x: X.conceptsBranch, y: 0 };

  // Secteurs
  const sectors = childrenOf(SECTORS_ID);
  sectors.forEach((s, i) => {
    positions[s.id] = { x: X.sectors, y: (i - (sectors.length - 1) / 2) * ROW };
  });
  positions[SECTORS_ID] = { x: X.sectorsBranch, y: 0 };

  // Principes : hauteur moyenne de leurs concepts, puis écartés de haut en bas
  const principles = childrenOf(PRINCIPLES_ID)
    .map((p) => {
      const ys = graph.edges
        .filter((e) => e.type === 'principle' && e.source === p.id)
        .map((e) => positions[e.target]?.y)
        .filter((v): v is number => v !== undefined);
      return { id: p.id, target: ys.length ? mean(ys) : 0 };
    })
    .sort((a, b) => a.target - b.target || a.id.localeCompare(b.id));
  const placed: number[] = [];
  principles.forEach((p, i) => placed.push(i === 0 ? p.target : Math.max(p.target, placed[i - 1]! + PRINCIPLE_GAP)));
  // Recentre le bloc pour que l'écartement ne le pousse pas seulement vers le bas
  const drift = mean(placed) - mean(principles.map((p) => p.target));
  principles.forEach((p, i) => {
    positions[p.id] = { x: X.principles, y: placed[i]! - (Number.isFinite(drift) ? drift : 0) };
  });
  const top = principles.length ? Math.min(...principles.map((p) => positions[p.id]!.y)) : 0;
  positions[PRINCIPLES_ID] = { x: X.principles, y: top - ROW };

  return positions;
}
