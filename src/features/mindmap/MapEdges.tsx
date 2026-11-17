import { EdgeLabelRenderer, useStore, type Edge, type EdgeProps } from '@xyflow/react';

type Point = { x: number; y: number };

export type TreeEdgeData = { from: Point; to: Point; dimmed: boolean };
export type PrincipleEdgeData = TreeEdgeData & { color: string; highlighted: boolean };
export type LinkEdgeData = TreeEdgeData & {
  title: string;
  /** Position de l'étiquette le long du lien (0 = départ, 1 = arrivée). */
  labelAt: number;
  highlighted: boolean;
  /** Mode focus mobile : seules les étiquettes des liens du nœud au centre existent. */
  labelHidden: boolean;
  /** Étiquette invisible (mais atteignable au clavier) : liens du nœud survolé ou ouvert seulement. */
  labelConcealed: boolean;
  /** Position imposée de l'étiquette (mode focus mobile : juste au-dessus du nœud relié). */
  labelPos: Point | null;
  onLabelHover: (inside: boolean) => void;
  onActivate: (id: string) => void;
};

export type TreeFlowEdge = Edge<TreeEdgeData, 'tree'>;
export type LinkFlowEdge = Edge<LinkEdgeData, 'link'>;
export type PrincipleFlowEdge = Edge<PrincipleEdgeData, 'principle'>;

/** Ligne d'un principe vers un concept qui l'applique, de la couleur du principe. */
export function PrincipleEdge({ data }: EdgeProps<PrincipleFlowEdge>) {
  if (!data) return null;
  const { from, to } = data;
  const midX = (from.x + to.x) / 2;
  const state = data.highlighted ? 'highlighted' : data.dimmed ? 'dimmed' : '';
  return (
    <path
      className={`map-edge-principle ${state}`}
      d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
      fill="none"
      style={{ stroke: data.color }}
    />
  );
}

export function TreeEdge({ data }: EdgeProps<TreeFlowEdge>) {
  if (!data) return null;
  const { from, to } = data;
  const midX = (from.x + to.x) / 2;
  return (
    <path
      className={data.dimmed ? 'map-edge-tree dimmed' : 'map-edge-tree'}
      d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
      fill="none"
    />
  );
}

/** Point d'une courbe de Bézier quadratique. */
const quad = (a: Point, c: Point, b: Point, t: number): Point => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
});

export function LinkEdge({ id, data }: EdgeProps<LinkFlowEdge>) {
  // Les étiquettes gardent une taille constante à l'écran quand on dézoome (zones tactiles).
  const zoom = useStore((s) => s.transform[2]);
  if (!data) return null;
  const { from, to } = data;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Courbe légère pour ne pas traverser les nœuds alignés
  const control = { x: (from.x + to.x) / 2 - dy * 0.15, y: (from.y + to.y) / 2 + dx * 0.15 };
  const label = data.labelPos ?? quad(from, control, to, data.labelAt);
  const scale = Math.max(1, 1 / zoom);
  const state = [
    data.highlighted ? 'highlighted' : data.dimmed ? 'dimmed' : '',
    data.labelConcealed ? 'concealed' : '',
  ].join(' ');

  return (
    <>
      <path
        className={`map-edge-link ${state}`}
        d={`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`}
        fill="none"
      />
      {!data.labelHidden && (
      <EdgeLabelRenderer>
        <button
          type="button"
          className={`map-link-label nodrag nopan ${state}`}
          data-link-id={id}
          data-dimmed={String(data.dimmed)}
          data-highlighted={String(data.highlighted)}
          aria-label={`Lien : ${data.title}`}
          title={data.title}
          style={{ transform: `translate(-50%, -50%) translate(${label.x}px, ${label.y}px) scale(${scale})` }}
          onClick={() => data.onActivate(id)}
          onMouseEnter={() => data.onLabelHover(true)}
          onMouseLeave={() => data.onLabelHover(false)}
        >
          <span className="map-link-title">{data.title}</span>
        </button>
      </EdgeLabelRenderer>
      )}
    </>
  );
}
