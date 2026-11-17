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
import { getLink, getSheet } from '../../content/lookup';
import { NotFoundPage } from '../../app/NotFoundPage';
import { Icon } from '../../shared/Icon';
import { useIsMobile } from '../../shared/useMediaQuery';
import { useProgress } from '../progress/ProgressContext';
import { LinkView } from '../sheet/LinkView';
import { SheetView } from '../sheet/SheetView';
import { focusSet, focusZoom } from './focus';
import { layoutGraph, NODE_SIZE } from './layout';
import { LinkEdge, TreeEdge, type LinkFlowEdge, type TreeFlowEdge } from './MapEdges';
import { MapNode, type MapFlowNode } from './MapNode';
import { BottomSheet, SidePanel, type Snap } from './Panels';

const nodeTypes = { map: MapNode };
const edgeTypes = { tree: TreeEdge, link: LinkEdge };
const FIT_OPTIONS = { padding: 0.08 };
const ANIMATION_MS = 450;

const isSheetNode = (n: GraphNode) => n.type === 'concept' || n.type === 'sector';

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
  const positions = useMemo(() => layoutGraph(graph), [graph]);
  const graphNodes = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  const sheet = getSheet(id);
  const link = getLink(linkId);
  const panelOpen = Boolean(sheet || link);

  const [focusId, setFocusId] = useState<string>(sheet?.id ?? link?.target ?? ROOT_ID);
  const [hovered, setHovered] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [snap, setSnap] = useState<Snap>('half');

  // L'URL décide du nœud au centre : une fiche ouverte, ou la cible d'un lien ouvert.
  useEffect(() => {
    if (sheet) setFocusId(sheet.id);
    else if (link) setFocusId(link.target);
  }, [sheet, link]);
  useEffect(() => {
    if (!panelOpen) setSnap('half');
  }, [panelOpen]);
  useEffect(() => {
    document.title = sheet ? `${sheet.title} · Mindmap` : link ? `${link.title} · Mindmap` : 'Mindmap · Archi Map';
  }, [sheet, link]);

  // Étape suivante conseillée du parcours en cours
  const nextId = progress.activePath?.steps.find((s) => !read.has(s)) ?? null;

  const highlightFrom = isMobile ? focusId : hovered;
  const highlight = useMemo(
    () => (highlightFrom && graphNodes.has(highlightFrom) ? focusSet(graph, highlightFrom) : null),
    [graph, graphNodes, highlightFrom],
  );

  const activate = useCallback(
    (nodeId: string) => {
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (isSheetNode(node)) {
        if (nodeId !== sheet?.id) navigate(`/carte/${nodeId}`);
        else setFocusId(nodeId);
        return;
      }
      if (isMobile) {
        setFocusId(nodeId);
        if (panelOpen) navigate('/carte');
      }
    },
    [graphNodes, isMobile, navigate, panelOpen, sheet?.id],
  );
  const activateLink = useCallback((lid: string) => navigate(`/carte/liens/${lid}`), [navigate]);

  const isVisible = useCallback(
    (nodeId: string) => {
      const parent = graphNodes.get(nodeId)?.parentId;
      return !(parent && collapsed.has(parent));
    },
    [collapsed, graphNodes],
  );

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
              childCount: graph.nodes.filter((c) => c.parentId === n.id).length,
              read: read.has(n.id),
              next: n.id === nextId,
              dimmed: highlight ? !highlight.has(n.id) : false,
              focused: isMobile && n.id === focusId,
              selected: n.id === sheet?.id,
              onActivate: activate,
              onHover: setHovered,
            },
          };
        }),
    [graph, positions, isVisible, read, nextId, highlight, isMobile, focusId, sheet?.id, activate],
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
            title: e.label ?? '',
            labelAt,
            onActivate: activateLink,
          },
        } satisfies LinkFlowEdge;
      });
  }, [graph, positions, isVisible, highlight, highlightFrom, graphNodes, activateLink, isMobile]);

  // --- Vue : ordinateur ----------------------------------------------------------------------
  // La carte entière tient dans la zone visible, y compris quand le panneau réduit la largeur.
  useEffect(() => {
    if (isMobile || !initialized || viewWidth === 0) return;
    void rf.fitView(FIT_OPTIONS);
  }, [isMobile, initialized, viewWidth, viewHeight, rf]);

  // « Suivant » et « Voir sur la mindmap » font glisser la carte jusqu'au nœud.
  const glide = (location.state as { glide?: boolean } | null)?.glide === true;
  useEffect(() => {
    if (isMobile || !initialized || !glide || !sheet) return;
    const p = positions[sheet.id]!;
    void rf.setCenter(p.x, p.y, { zoom: rf.getZoom(), duration: ANIMATION_MS });
  }, [location.key, glide, sheet, isMobile, initialized, positions, rf]);

  // --- Vue : mobile (mode focus) -------------------------------------------------------------
  const centeredOnce = useRef(false);
  useEffect(() => {
    if (!isMobile || !initialized || viewWidth === 0 || !graphNodes.has(focusId)) return;
    const p = positions[focusId]!;
    const zoom = focusZoom(focusSet(graph, focusId), positions, { width: viewWidth, height: viewHeight * 0.8 }, p);
    // Panneau à mi-hauteur ouvert : le nœud remonte dans la moitié haute de l'écran.
    const offsetY = panelOpen && snap === 'half' ? (viewHeight * 0.22) / zoom : 0;
    void rf.setCenter(p.x, p.y + offsetY, { zoom, duration: centeredOnce.current ? ANIMATION_MS : 0 });
    centeredOnce.current = true;
  }, [isMobile, initialized, viewWidth, viewHeight, focusId, panelOpen, snap, graph, graphNodes, positions, rf]);

  const recenter = () => {
    if (!isMobile) {
      void rf.fitView({ ...FIT_OPTIONS, duration: ANIMATION_MS });
      return;
    }
    const p = positions[focusId]!;
    const zoom = focusZoom(focusSet(graph, focusId), positions, { width: viewWidth, height: viewHeight * 0.8 }, p);
    void rf.setCenter(p.x, p.y, { zoom, duration: ANIMATION_MS });
  };

  // --- Panneau ------------------------------------------------------------------------------
  const lastSelected = useRef<string | null>(null);
  const close = useCallback(() => navigate('/carte'), [navigate]);

  useEffect(() => {
    if (sheet) lastSelected.current = sheet.id;
    if (!panelOpen && lastSelected.current) {
      // Le focus revient sur le nœud dont la fiche était ouverte
      const nodeId = lastSelected.current;
      lastSelected.current = null;
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)?.focus({ preventScroll: true }));
    }
  }, [sheet, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen, close]);

  if ((id && !sheet) || (linkId && !link)) return <NotFoundPage />;

  const panelContent = sheet ? (
    <SheetView key={sheet.id} sheet={sheet} ctx="map" titleId={titleId} />
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
    <div className={panelOpen ? 'map-page with-panel' : 'map-page'}>
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
                    if (panelOpen && crumb.id !== sheet?.id) navigate('/carte');
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
