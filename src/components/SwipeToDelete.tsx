import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Icon } from './Icon';
import './SwipeToDelete.css';

const REVEAL_WIDTH = 76;
const DRAG_START_THRESHOLD = 8;

interface SwipeToDeleteProps {
  id: string;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  onDelete: () => void;
  deleteLabel?: string;
  children: ReactNode;
}

/**
 * Wraps a list row so swiping it left reveals a delete action, matching the common mobile
 * "swipe to delete" pattern. Only one row is open at a time across a list — the parent owns
 * `openId`/`onOpenChange` so opening one row closes any other.
 */
export function SwipeToDelete({ id, openId, onOpenChange, onDelete, deleteLabel = 'Delete', children }: SwipeToDeleteProps) {
  const isOpen = openId === id;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const isDraggingRef = useRef(false);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!isOpen) setOffset(0);
    else setOffset(-REVEAL_WIDTH);
  }, [isOpen]);

  function onPointerDown(e: PointerEvent) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
    movedRef.current = false;
    isDraggingRef.current = false;
  }

  function onPointerMove(e: PointerEvent) {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!movedRef.current) {
      if (Math.abs(dx) < DRAG_START_THRESHOLD && Math.abs(dy) < DRAG_START_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) return; // vertical gesture — let the list scroll natively
      movedRef.current = true;
      isDraggingRef.current = true;
      setDragging(true);
    }

    if (!isDraggingRef.current) return;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, startOffset.current + dx));
    setOffset(next);
  }

  function endDrag() {
    if (isDraggingRef.current) {
      // A real drag happened - the browser still synthesizes a click on release, which must
      // not reach whatever's underneath (e.g. a card button that opens an editor).
      suppressClickRef.current = true;
      if (offset < -REVEAL_WIDTH / 2) {
        setOffset(-REVEAL_WIDTH);
        onOpenChange(id);
      } else {
        setOffset(0);
        onOpenChange(null);
      }
    } else if (offset !== 0) {
      // Tapping an already-revealed row closes it instead of triggering whatever's underneath.
      suppressClickRef.current = true;
      setOffset(0);
      onOpenChange(null);
    }
    isDraggingRef.current = false;
    movedRef.current = false;
    setDragging(false);
  }

  function onClickCapture(e: MouseEvent) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  function handleDeleteClick() {
    onOpenChange(null);
    onDelete();
  }

  return (
    <div className="swipe-row">
      <div className="swipe-row__delete" style={{ width: REVEAL_WIDTH }}>
        <button type="button" className="swipe-row__delete-btn" onClick={handleDeleteClick} aria-label={deleteLabel}>
          <span className="swipe-row__delete-icon">
            <Icon name="trash" size={18} />
          </span>
        </button>
      </div>
      <div
        className="swipe-row__content"
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
