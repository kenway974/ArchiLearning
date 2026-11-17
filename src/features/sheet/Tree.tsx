import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { TreeNode } from '../../content/schema';
import { Icon } from '../../shared/Icon';

type Row = { key: string; node: TreeNode; level: number; parentKey: string | null; hasChildren: boolean };

function flatten(nodes: TreeNode[], level = 1, parentKey: string | null = null, prefix = ''): Row[] {
  return nodes.flatMap((node, i) => {
    const key = `${prefix}${i}`;
    const hasChildren = (node.children?.length ?? 0) > 0;
    return [
      { key, node, level, parentKey, hasChildren },
      ...flatten(node.children ?? [], level + 1, key, `${key}.`),
    ];
  });
}

/**
 * Arborescence cliquable (motif ARIA « tree », rendu à plat avec aria-level) :
 * dépliée par défaut ; un clic ou Entrée explique le rôle de l'élément.
 */
export function Tree({ nodes, label }: { nodes: TreeNode[]; label: string }) {
  const rows = useMemo(() => flatten(nodes), [nodes]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState<string>(rows[0]?.key ?? '');
  const refs = useRef(new Map<string, HTMLLIElement>());

  const isHidden = (row: Row): boolean => {
    let parent = row.parentKey;
    while (parent !== null) {
      if (collapsed.has(parent)) return true;
      parent = rows.find((r) => r.key === parent)?.parentKey ?? null;
    }
    return false;
  };
  const visible = rows.filter((r) => !isHidden(r));
  const selectedRow = rows.find((r) => r.key === selected);

  const focus = (key: string) => {
    setFocused(key);
    refs.current.get(key)?.focus();
  };
  const toggle = (key: string, open: boolean) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (open) next.delete(key);
      else next.add(key);
      return next;
    });

  const onKeyDown = (e: KeyboardEvent, row: Row) => {
    const index = visible.findIndex((r) => r.key === row.key);
    switch (e.key) {
      case 'Enter':
      case ' ':
        setSelected(row.key);
        break;
      case 'ArrowDown':
        if (visible[index + 1]) focus(visible[index + 1]!.key);
        break;
      case 'ArrowUp':
        if (visible[index - 1]) focus(visible[index - 1]!.key);
        break;
      case 'ArrowRight':
        if (row.hasChildren && collapsed.has(row.key)) toggle(row.key, true);
        else if (row.hasChildren && visible[index + 1]) focus(visible[index + 1]!.key);
        break;
      case 'ArrowLeft':
        if (row.hasChildren && !collapsed.has(row.key)) toggle(row.key, false);
        else if (row.parentKey) focus(row.parentKey);
        break;
      case 'Home':
        if (visible[0]) focus(visible[0].key);
        break;
      case 'End':
        if (visible.length) focus(visible[visible.length - 1]!.key);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div className="tree-wrap">
      <ul role="tree" aria-label={label} className="tree">
        {visible.map((row) => (
          <li
            key={row.key}
            ref={(el) => {
              if (el) refs.current.set(row.key, el);
              else refs.current.delete(row.key);
            }}
            role="treeitem"
            aria-level={row.level}
            aria-selected={selected === row.key}
            {...(row.hasChildren ? { 'aria-expanded': !collapsed.has(row.key) } : {})}
            tabIndex={focused === row.key ? 0 : -1}
            className="tree-item"
            style={{ paddingInlineStart: `${(row.level - 1) * 1.25 + 0.5}rem` }}
            onClick={() => {
              setSelected(row.key);
              setFocused(row.key);
            }}
            onKeyDown={(e) => onKeyDown(e, row)}
          >
            {row.hasChildren ? (
              <span
                className={collapsed.has(row.key) ? 'tree-twisty' : 'tree-twisty open'}
                aria-hidden="true"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(row.key, collapsed.has(row.key));
                }}
              >
                <Icon name="chevron" size={14} />
              </span>
            ) : (
              <span className="tree-twisty" aria-hidden="true" />
            )}
            <Icon name={row.node.kind === 'dir' ? 'folder' : 'file'} size={16} className={`tree-icon ${row.node.kind}`} />
            <span className="tree-name">{row.node.name}</span>
          </li>
        ))}
      </ul>
      <div className="tree-explain" aria-live="polite">
        {selectedRow ? (
          <section role="region" aria-label={`Rôle de ${selectedRow.node.name}`} className="tree-role">
            <p className="tree-role-name">
              <Icon name={selectedRow.node.kind === 'dir' ? 'folder' : 'file'} size={16} />
              <code>{selectedRow.node.name}</code>
            </p>
            <p>{selectedRow.node.role}</p>
          </section>
        ) : (
          <p className="muted">Clique sur un dossier ou un fichier pour voir son rôle.</p>
        )}
      </div>
    </div>
  );
}
