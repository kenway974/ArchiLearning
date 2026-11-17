import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { KeyboardEvent } from 'react';
import type { NodeType } from '../../content/graph';
import { Icon } from '../../shared/Icon';

export type MapNodeData = {
  label: string;
  type: NodeType;
  childCount: number;
  read: boolean;
  next: boolean;
  dimmed: boolean;
  focused: boolean;
  selected: boolean;
  onActivate: (id: string) => void;
  onHover: (id: string | null) => void;
};

export type MapFlowNode = Node<MapNodeData, 'map'>;

const TYPE_LABELS: Record<NodeType, string> = {
  root: 'racine',
  branch: 'branche',
  concept: 'concept',
  sector: 'secteur',
};

function accessibleName(d: MapNodeData): string {
  if (d.type === 'root') return `${d.label}, racine`;
  if (d.type === 'branch') return `${d.label}, branche, ${d.childCount} fiches`;
  return `${d.label}, ${TYPE_LABELS[d.type]}, ${d.read ? 'lu' : 'non lu'}${d.next ? ', suivant conseillé' : ''}`;
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
      className="map-node"
      onClick={() => data.onActivate(id)}
      onKeyDown={onKeyDown}
      onMouseEnter={() => data.onHover(id)}
      onMouseLeave={() => data.onHover(null)}
    >
      <Handle type="target" position={Position.Top} className="map-handle" isConnectable={false} />
      <span className="map-node-label">{data.label}</span>
      {data.type === 'branch' && <span className="map-node-meta">{data.childCount} fiches</span>}
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
