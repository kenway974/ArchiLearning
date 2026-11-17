import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { KeyboardEvent } from 'react';
import type { NodeType } from '../../content/graph';
import { Icon } from '../../shared/Icon';

export type Badge = { id: string; title: string; color: string };

export type MapNodeData = {
  label: string;
  type: NodeType;
  childCount: number;
  /** Texte sous le libellé (ex. « 5 familles »). */
  meta: string | null;
  /** Principes appliqués par un concept : une pastille de couleur chacun. */
  badges: Badge[];
  read: boolean;
  next: boolean;
  dimmed: boolean;
  focused: boolean;
  /** Mode focus mobile : nœud étranger qui tomberait sur le voisinage, masqué. */
  hidden: boolean;
  selected: boolean;
  onActivate: (id: string) => void;
  onHover: (id: string | null) => void;
};

export type MapFlowNode = Node<MapNodeData, 'map'>;

function accessibleName(d: MapNodeData): string {
  switch (d.type) {
    case 'root':
      return `${d.label}, racine`;
    case 'branch':
      return `${d.label}, branche, ${d.meta ?? ''}`;
    case 'family':
      return `${d.label}, famille, ${d.childCount} concepts`;
    case 'principles':
      return `${d.label}, groupe de ${d.childCount} principes`;
    case 'principle':
      return `${d.label}, principe, ${d.childCount} concepts`;
    default: {
      const kind = d.type === 'concept' ? 'concept' : 'secteur';
      const principles = d.badges.length ? `, principes : ${d.badges.map((b) => b.title).join(', ')}` : '';
      return `${d.label}, ${kind}, ${d.read ? 'lu' : 'non lu'}${d.next ? ', suivant conseillé' : ''}${principles}`;
    }
  }
}

export function MapNode({ id, data }: NodeProps<MapFlowNode>) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      data.onActivate(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={accessibleName(data)}
      aria-current={data.selected ? 'true' : undefined}
      data-node-id={id}
      data-type={data.type}
      data-dimmed={String(data.dimmed)}
      data-read={String(data.read)}
      data-next={String(data.next)}
      data-focused={String(data.focused)}
      data-hidden={String(data.hidden)}
      className="map-node"
      onClick={() => data.onActivate(id)}
      onKeyDown={onKeyDown}
      onMouseEnter={() => data.onHover(id)}
      onMouseLeave={() => data.onHover(null)}
    >
      <Handle type="target" position={Position.Top} className="map-handle" isConnectable={false} />
      <span className="map-node-label">{data.label}</span>
      {data.meta && <span className="map-node-meta">{data.meta}</span>}
      {data.type === 'principle' && data.badges[0] && (
        <span className="map-node-color" style={{ background: data.badges[0].color }} aria-hidden="true" />
      )}
      {data.type === 'concept' && data.badges.length > 0 && (
        <span className="map-node-badges" aria-hidden="true">
          {data.badges.map((b) => (
            <span key={b.id} className="map-badge" data-badge={b.id} title={b.title} style={{ background: b.color }} />
          ))}
        </span>
      )}
      {data.read && (
        <span className="map-node-check" data-testid="read-check" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      )}
      {data.next && (
        <span className="map-node-next" aria-hidden="true">
          Suivant
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="map-handle" isConnectable={false} />
    </div>
  );
}
