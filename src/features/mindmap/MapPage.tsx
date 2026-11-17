import {
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  useStore,
  type Edge,
} from '@xyflow/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { content } from '../../content/index';
import { buildGraph, getBreadcrumb, ROOT_ID, type GraphNode } from '../../content/graph';
import { getLink, getPrinciple, getSheet, principlesOf } from '../../content/lookup';
import { NotFoundPage } from '../../app/NotFoundPage';
import { Icon } from '../../shared/Icon';
import { useIsMobile } from '../../shared/useMediaQuery';
import { useProgress } from '../progress/ProgressContext';
import { LinkView } from '../sheet/LinkView';
import { PrincipleView } from '../sheet/PrincipleView';
import { SheetView } from '../sheet/SheetView';
import { FOCUS_ZOOM, focusCenter, focusLayout, focusSet } from './focus';
import { layoutGraph, NODE_SIZE } from './layout';
import { LinkEdge, PrincipleEdge, TreeEdge, type LinkFlowEdge, type PrincipleFlowEdge, type TreeFlowEdge } from './MapEdges';
import { MapNode, type MapFlowNode } from './MapNode';
import { BottomSheet, SidePanel, type Snap } from './Panels';

const nodeTypes = { map: MapNode };
const edgeTypes = { tree: TreeEdge, link: LinkEdge, principle: PrincipleEdge };
const FIT_OPTIONS = { padding: 0.06 };
/** Mode focus mobile : l'étiquette d'un lien se place juste au-dessus du nœud relié. */
const labelAbove = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - NODE_SIZE.height / 2 - 26 });
const ANIMATION_MS = 450;

/** Nœuds qui ont une fiche à ouvrir dans le panneau. */
const hasPanel = (n: GraphNode) => n.type === 'concept' || n.type === 'sector' || n.type === 'principle';

export function MapPage() {
  return (
    <ReactFlowProvider>
      <MapScreen />
    </ReactFlowProvider>
  );
}

function MapScreen() {
  const { id, linkId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { read, progress } = useProgress();
  const rf = useReactFlow();
  const initialized = useNodesInitialized();
  const viewWidth = useStore((s) => s.width);
  const viewHeight = useStore((s) => s.height);
  const titleId = useId();

  const graph = useMemo(() => buildGraph(content), []);
  const basePositions = useMemo(() => layoutGraph(graph), [graph]);
  const graphNodes = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  const sheet = getSheet(id);
  const principle = sheet ? undefined : getPrinciple(id);
  const link = getLink(linkId);
  /** Nœud dont la fiche est ouverte (fiche ou principe). */
  const openId = sheet?.id ?? principle?.id ?? null;
  const panelOpen = Boolean(openId || link);

  const [focusId, setFocusId] = useState<string>(openId ?? link?.target ?? ROOT_ID);
  const [hovered, setHovered] = useState<string | null>(null);
  // Survol « collant » : on garde la mise en évidence le temps d'aller cliquer une étiquette de lien.
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepHover = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);
  const releaseHover = useCallback(() => {
    keepHover();
    hoverTimer.current = setTimeout(() => setHovered(null), 350);
  }, [keepHover]);
  const onNodeHover = useCallback(
    (nodeId: string | null) => {
      if (nodeId) {
        keepHover();
        setHovered(nodeId);
      } else releaseHover();
    },
    [keepHover, releaseHover],
  );
  const onLabelHover = useCallback((inside: boolean) => (inside ? keepHover() : releaseHover()), [keepHover, releaseHover]);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [snap, setSnap] = useState<Snap>('half');

  // Mobile : disposition du mode focus ; ordinateur : la carte entière.
  const layout = useMemo(
    () => (isMobile && graph.nodes.some((n) => n.id === focusId) ? focusLayout(graph, basePositions, focusId) : null),
    [isMobile, graph, basePositions, focusId],
  );
  const positions = layout?.positions ?? basePositions;
  const hiddenNodes = layout?.hidden;

  // L'URL décide du nœud au centre : une fiche ouverte, ou la cible d'un lien ouvert.
  useEffect(() => {
    if (openId) setFocusId(openId);
    else if (link) setFocusId(link.target);
  }, [openId, link]);
  useEffect(() => {
    if (!panelOpen) setSnap('half');
  }, [panelOpen]);
  useEffect(() => {
    const title = sheet?.title ?? principle?.title ?? link?.title;
    document.title = title ? `${title} · Mindmap` : 'Mindmap · Archi Map';
  }, [sheet, principle, link]);

  // Étape suivante conseillée du parcours en cours
  const nextId = progress.activePath?.steps.find((s) => !read.has(s)) ?? null;

  // Ordinateur : le nœud survolé, sinon celui dont la fiche est ouverte. Mobile : le nœud au centre.
  const highlightFrom = isMobile ? focusId : (hovered ?? openId);
  const highlight = useMemo(
    () => (highlightFrom && graphNodes.has(highlightFrom) ? focusSet(graph, highlightFrom) : null),
    [graph, graphNodes, highlightFrom],
  );

  const activate = useCallback(
    (nodeId: string) => {
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (hasPanel(node)) {
        if (nodeId !== openId) navigate(`/carte/${nodeId}`);
        else setFocusId(nodeId);
        return;
      }
      if (isMobile) {
        setFocusId(nodeId);
        if (panelOpen) navigate('/carte');
      }
    },
    [graphNodes, isMobile, navigate, panelOpen, openId],
  );
  const activateLink = useCallback((lid: string) => navigate(`/carte/liens/${lid}`), [navigate]);

  // Un nœud est caché si l'un de ses ancêtres est replié
  const isVisible = useCallback(
    (nodeId: string) => {
      let parent = graphNodes.get(nodeId)?.parentId ?? null;
      while (parent) {
        if (collapsed.has(parent)) return false;
        parent = graphNodes.get(parent)?.parentId ?? null;
      }
      return true;
    },
    [collapsed, graphNodes],
  );
  const principleById = useMemo(() => new Map(content.principles.map((p) => [p.id, p])), []);
  const childCount = useCallback((nodeId: string) => graph.nodes.filter((c) => c.parentId === nodeId).length, [graph]);

  const nodes = useMemo<MapFlowNode[]>(
    () =>
      graph.nodes
        .filter((n) => isVisible(n.id))
        .map((n) => {
          const p = positions[n.id]!;
          return {
            id: n.id,
            type: 'map',
            position: { x: p.x - NODE_SIZE.width / 2, y: p.y - NODE_SIZE.height / 2 },
            width: NODE_SIZE.width,
            height: NODE_SIZE.height,
            style: { width: NODE_SIZE.width, height: NODE_SIZE.height },
            draggable: false,
            selectable: false,
            focusable: false,
            data: {
              label: n.label,
              type: n.type,
              childCount:
                n.type === 'principle' ? (principleById.get(n.id)?.applications.length ?? 0) : childCount(n.id),
              meta:
                n.id === 'concepts'
                  ? `${childCount(n.id)} familles`
                  : n.type === 'branch'
                    ? `${childCount(n.id)} fiches`
                    : n.type === 'family'
                      ? `${childCount(n.id)} concepts`
                      : null,
              badges:
                n.type === 'concept'
                  ? principlesOf(n.id).map((p) => ({ id: p.id, title: p.title, color: p.color }))
                  : n.type === 'principle'
                    ? [{ id: n.id, title: n.label, color: principleById.get(n.id)?.color ?? '#888' }]
                    : [],
              read: read.has(n.id),
              next: n.id === nextId,
              dimmed: highlight ? !highlight.has(n.id) : false,
              focused: isMobile && n.id === focusId,
              hidden: hiddenNodes?.has(n.id) ?? false,
              selected: n.id === openId,
              onActivate: activate,
              onHover: onNodeHover,
            },
          };
        }),
    [graph, positions, isVisible, read, nextId, highlight, isMobile, focusId, openId, activate, childCount, principleById, onNodeHover, hiddenNodes],
  );

  const edges = useMemo<Edge[]>(() => {
    const touches = (e: { source: string; target: string }) =>
      highlightFrom !== null && (e.source === highlightFrom || e.target === highlightFrom);
    return graph.edges
      .filter((e) => isVisible(e.source) && isVisible(e.target))
      .map((e) => {
        const from = positions[e.source]!;
        const to = positions[e.target]!;
        const dimmed = highlight ? !touches(e) : false;
        if (e.type === 'tree') {
          return { id: e.id, source: e.source, target: e.target, type: 'tree', focusable: false, data: { from, to, dimmed } } satisfies TreeFlowEdge;
        }
        if (e.type === 'principle') {
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'principle',
            focusable: false,
            data: { from, to, dimmed, highlighted: highlight ? touches(e) : false, color: principleById.get(e.source)?.color ?? '#888' },
          } satisfies PrincipleFlowEdge;
        }
        const sourceType = graphNodes.get(e.source)?.type;
        const targetType = graphNodes.get(e.target)?.type;
        // Lien concept ↔ secteur : étiquette près du concept, pour la garder visible en mode focus
        const labelAt = sourceType === targetType ? 0.5 : sourceType === 'concept' ? 0.25 : 0.75;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'link',
          focusable: false,
          zIndex: 1,
          data: {
            from,
            to,
            dimmed,
            highlighted: highlight ? touches(e) : false,
            labelHidden: isMobile && !touches(e),
            // Étiquette visible seulement pour les liens du nœud survolé ou ouvert (et, sur mobile, panneau fermé)
            labelConcealed: !touches(e) || (isMobile && panelOpen),
            labelPos: isMobile && touches(e) ? labelAbove(e.source === highlightFrom ? to : from) : null,
            onLabelHover,
            title: e.label ?? '',
            labelAt,
            onActivate: activateLink,
          },
        } satisfies LinkFlowEdge;
      });
  }, [graph, positions, isVisible, highlight, highlightFrom, graphNodes, activateLink, isMobile, panelOpen, principleById, onLabelHover]);

  // --- Vue : ordinateur ----------------------------------------------------------------------
  // La carte entière tient dans la zone visible, y compris quand le panneau réduit la largeur.
  useEffect(() => {
    if (isMobile || !initialized || viewWidth === 0) return;
    void rf.fitView(FIT_OPTIONS);
  }, [isMobile, initialized, viewWidth, viewHeight, rf]);

  // « Suivant » et « Voir sur la mindmap » font glisser la carte jusqu'au nœud.
  const glide = (location.state as { glide?: boolean } | null)?.glide === true;
  useEffect(() => {
    if (isMobile || !initialized || !glide || !openId) return;
    const p = positions[openId]!;
    void rf.setCenter(p.x, p.y, { zoom: rf.getZoom(), duration: ANIMATION_MS });
  }, [location.key, glide, openId, isMobile, initialized, positions, rf]);

  // --- Vue : mobile (mode focus) -------------------------------------------------------------
  const centeredOnce = useRef(false);
  const focusView = useCallback(() => {
    if (!layout) return null;
    const c = focusCenter(layout, focusSet(graph, focusId), focusId);
    // Panneau à mi-hauteur ouvert : le nœud remonte dans la moitié haute de l'écran.
    const p = layout.positions[focusId]!;
    return panelOpen && snap === 'half' ? { x: p.x, y: p.y + (viewHeight * 0.22) / FOCUS_ZOOM } : c;
  }, [layout, graph, focusId, panelOpen, snap, viewHeight]);
  useEffect(() => {
    if (!isMobile || !initialized || viewWidth === 0) return;
    const c = focusView();
    if (!c) return;
    void rf.setCenter(c.x, c.y, { zoom: FOCUS_ZOOM, duration: centeredOnce.current ? ANIMATION_MS : 0 });
    centeredOnce.current = true;
  }, [isMobile, initialized, viewWidth, focusView, rf]);

  const recenter = () => {
    if (!isMobile) {
      void rf.fitView({ ...FIT_OPTIONS, duration: ANIMATION_MS });
      return;
    }
    const c = focusView();
    if (c) void rf.setCenter(c.x, c.y, { zoom: FOCUS_ZOOM, duration: ANIMATION_MS });
  };

  // --- Panneau ------------------------------------------------------------------------------
  const lastSelected = useRef<string | null>(null);
  const close = useCallback(() => navigate('/carte'), [navigate]);

  useEffect(() => {
    if (openId) lastSelected.current = openId;
    if (!panelOpen && lastSelected.current) {
      // Le focus revient sur le nœud dont la fiche était ouverte
      const nodeId = lastSelected.current;
      lastSelected.current = null;
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)?.focus({ preventScroll: true }));
    }
  }, [openId, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen, close]);

  if ((id && !sheet && !principle) || (linkId && !link)) return <NotFoundPage />;

  const panelContent = sheet ? (
    <SheetView key={sheet.id} sheet={sheet} ctx="map" titleId={titleId} />
  ) : principle ? (
    <PrincipleView key={principle.id} principle={principle} ctx="map" titleId={titleId} />
  ) : link ? (
    <LinkView key={link.id} link={link} ctx="map" titleId={titleId} />
  ) : null;

  const toggleBranch = (branchId: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });

  return (
    <div className={`map-page${panelOpen ? ' with-panel' : ''}${isMobile ? ' map-mobile' : ''}`}>
      <h1 className="sr-only">Mindmap des architectures logicielles</h1>
      {isMobile && (
        <nav className="breadcrumb" aria-label="Fil d’Ariane">
          <ol>
            {getBreadcrumb(graph, focusId).map((crumb, i, all) => (
              <li key={crumb.id}>
                <button
                  type="button"
                  aria-current={i === all.length - 1 ? 'location' : undefined}
                  onClick={() => {
                    setFocusId(crumb.id);
                    if (panelOpen && crumb.id !== openId) navigate('/carte');
                  }}
                >
                  {crumb.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={!isMobile}
          fitViewOptions={FIT_OPTIONS}
          minZoom={0.2}
          maxZoom={2.5}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          aria-label="Carte des architectures"
        />
        <div className="map-toolbar" role="toolbar" aria-label="Contrôles de la carte">
          <button type="button" className="icon-btn" aria-label="Zoom avant" onClick={() => void rf.zoomIn({ duration: 200 })}>
            <Icon name="plus" />
          </button>
          <button type="button" className="icon-btn" aria-label="Zoom arrière" onClick={() => void rf.zoomOut({ duration: 200 })}>
            <Icon name="minus" />
          </button>
          <button type="button" className="icon-btn" aria-label="Recentrer" onClick={recenter}>
            <Icon name="fit" />
          </button>
          {!isMobile &&
            (['concepts', 'sectors'] as const).map((branchId) => {
              const label = graphNodes.get(branchId)!.label;
              const open = !collapsed.has(branchId);
              return (
                <button
                  key={branchId}
                  type="button"
                  className="btn btn-small"
                  aria-expanded={open}
                  onClick={() => toggleBranch(branchId)}
                >
                  {open ? `Replier ${label}` : `Déplier ${label}`}
                </button>
              );
            })}
        </div>
      </div>
      {panelContent &&
        (isMobile ? (
          <BottomSheet titleId={titleId} onClose={close} snap={snap} onSnap={setSnap}>
            {panelContent}
          </BottomSheet>
        ) : (
          <SidePanel titleId={titleId} onClose={close}>
            {panelContent}
          </SidePanel>
        ))}
    </div>
  );
}
