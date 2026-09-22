import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ToolTile } from '../../components/ToolTile';
import type { ToolMeta } from '../../types';
import './PinnedToolsGrid.css';

const DRAG_START_THRESHOLD = 8;

interface PinnedToolsGridProps {
  tools: ToolMeta[];
  editing: boolean;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (nextIds: string[]) => void;
}

/** Grid of pinned tool tiles that can be drag-reordered while `editing` is true. */
export function PinnedToolsGrid({ tools, editing, onOpen, onRemove, onReorder }: PinnedToolsGridProps) {
  const [order, setOrder] = useState(() => tools.map((t) => t.id));
  const orderRef = useRef(order);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const activeIdRef = useRef<string | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  // The dragged tile's translate(dx, dy) is relative to wherever it's naturally laid out right
  // now — which moves whenever a swap re-slots it in the grid. startRef is rebased to the
  // pointer's current position on every swap so dx/dy (and the CSS transform) restart from
  // zero there instead of jumping by the tile's whole new-slot offset.
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  // Window-level listeners, not setPointerCapture + per-element onPointerMove: some Android
  // WebView versions don't reliably route pointermove back to the origin element once the
  // finger leaves its bounds (or setPointerCapture itself throws), which silently breaks the
  // whole drag with no error visible anywhere. Listening on window sidesteps that entirely -
  // it's what every mainstream drag library (dnd-kit, sortablejs, etc.) actually does.
  const cleanupRef = useRef<(() => void) | null>(null);

  // Stay in sync when the pinned set changes from outside (unpin, add, external update).
  useEffect(() => {
    const ids = tools.map((t) => t.id);
    setOrder((prev) => {
      const stillValid = prev.filter((id) => ids.includes(id));
      const missing = ids.filter((id) => !stillValid.includes(id));
      const next = [...stillValid, ...missing];
      orderRef.current = next;
      return next;
    });
  }, [tools]);

  // If edit mode is turned off mid-drag (e.g. tapping "Done"), stop cleanly instead of leaving
  // dangling window listeners or a tile stuck mid-drag.
  useEffect(() => {
    if (!editing) endDrag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useEffect(() => () => cleanupRef.current?.(), []);

  function setOrderAndPersist(next: string[]) {
    orderRef.current = next;
    setOrder(next);
  }

  function handleMove(clientX: number, clientY: number) {
    const id = activeIdRef.current;
    if (!id) return;

    const dx = clientX - startRef.current.x;
    const dy = clientY - startRef.current.y;

    if (!movedRef.current) {
      if (Math.abs(dx) < DRAG_START_THRESHOLD && Math.abs(dy) < DRAG_START_THRESHOLD) return;
      movedRef.current = true;
      setDraggingId(id);
    }
    setDragOffset({ x: dx, y: dy });

    // Hit-test using the pointer's actual position, not the dragged tile's computed center —
    // that avoids ever needing the dragged tile's own (transform-affected) rect at all.
    for (const [otherId, el] of itemRefs.current) {
      if (otherId === id) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        const from = orderRef.current.indexOf(id);
        const to = orderRef.current.indexOf(otherId);
        if (from === -1 || to === -1) break;
        const next = [...orderRef.current];
        next.splice(from, 1);
        next.splice(to, 0, id);
        setOrderAndPersist(next);
        // Rebase: the tile just got re-slotted to a new natural position, so restart the
        // translate offset from here instead of jumping by the whole slot distance.
        startRef.current = { x: clientX, y: clientY };
        setDragOffset({ x: 0, y: 0 });
        break;
      }
    }
  }

  function endDrag() {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (movedRef.current && activeIdRef.current) onReorder(orderRef.current);
    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
    movedRef.current = false;
    activeIdRef.current = null;
    activePointerIdRef.current = null;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>, id: string) {
    if (!editing) return;
    e.preventDefault();
    cleanupRef.current?.();

    activeIdRef.current = id;
    activePointerIdRef.current = e.pointerId;
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;

    const onWindowMove = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerIdRef.current) return;
      handleMove(ev.clientX, ev.clientY);
    };
    const onWindowUp = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerIdRef.current) return;
      endDrag();
    };
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };
  }

  const toolMap = new Map(tools.map((t) => [t.id, t]));
  const orderedTools = order.map((id) => toolMap.get(id)).filter((t): t is ToolMeta => !!t);

  return (
    <div className="home__grid">
      {orderedTools.map((tool) => (
        <div
          key={tool.id}
          ref={(el) => {
            if (el) itemRefs.current.set(tool.id, el);
            else itemRefs.current.delete(tool.id);
          }}
          className={`pinned-tile${editing ? ' pinned-tile--editable' : ''}${draggingId === tool.id ? ' pinned-tile--dragging' : ''}`}
          style={
            draggingId === tool.id
              ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }
              : undefined
          }
          onPointerDown={(e) => handlePointerDown(e, tool.id)}
        >
          <ToolTile
            tool={tool}
            onClick={() => (editing ? undefined : onOpen(tool.id))}
            onRemove={editing ? () => onRemove(tool.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
