import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Icon } from '../../shared/Icon';

type PanelProps = {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

/** Ordinateur : panneau latéral non modal ; la carte reste utilisable à côté. */
export function SidePanel({ titleId, onClose, children }: PanelProps) {
  const ref = useRef<HTMLElement>(null);

  // Le focus entre dans le panneau à l'ouverture et à chaque changement de fiche.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    ref.current?.scrollTo({ top: 0 });
  }, [titleId]);

  return (
    <aside ref={ref} role="dialog" aria-modal="false" aria-labelledby={titleId} className="side-panel" tabIndex={-1}>
      <div className="panel-bar">
        <button type="button" className="btn btn-small" onClick={onClose}>
          <Icon name="close" size={16} /> Fermer
        </button>
      </div>
      <div className="panel-body">{children}</div>
    </aside>
  );
}

export type Snap = 'half' | 'full';

/**
 * Mobile : panneau qui monte du bas. Mi-hauteur = résumé, plein écran = fiche complète.
 * On le déplace en glissant la poignée ; il se ferme s'il est glissé presque en bas.
 */
export function BottomSheet({
  titleId,
  onClose,
  children,
  snap,
  onSnap,
}: PanelProps & { snap: Snap; onSnap: (snap: Snap) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTop: number } | null>(null);
  const [dragTop, setDragTop] = useState<number | null>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [titleId]);

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !ref.current) return;
    drag.current = { startY: touch.clientY, startTop: ref.current.getBoundingClientRect().top };
  };
  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !drag.current) return;
    setDragTop(Math.max(0, drag.current.startTop + touch.clientY - drag.current.startY));
  };
  const onTouchEnd = () => {
    const top = dragTop;
    drag.current = null;
    setDragTop(null);
    if (top === null) return;
    const h = window.innerHeight;
    if (top > h * 0.8) onClose();
    else if (top < h * 0.3) onSnap('full');
    else onSnap('half');
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`bottom-sheet ${snap}${dragTop !== null ? ' dragging' : ''}`}
      data-snap={snap}
      style={dragTop !== null ? { top: `${dragTop}px` } : undefined}
    >
      <div
        className="sheet-handle"
        data-testid="sheet-handle"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <span className="sheet-grip" aria-hidden="true" />
      </div>
      <div className="panel-bar">
        {snap === 'half' ? (
          <button type="button" className="btn btn-small btn-primary" onClick={() => onSnap('full')}>
            Voir toute la fiche
          </button>
        ) : (
          <button type="button" className="btn btn-small" onClick={() => onSnap('half')}>
            Réduire
          </button>
        )}
        <button type="button" className="btn btn-small" onClick={onClose}>
          <Icon name="close" size={16} /> Fermer
        </button>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
