import { useEffect, useRef } from 'react';

type BackHandler = () => void;

const stack: BackHandler[] = [];

/** Called by the app-level hardware back button listener before falling back to router nav. */
export function runTopBackHandler(): boolean {
  const handler = stack[stack.length - 1];
  if (handler) {
    handler();
    return true;
  }
  return false;
}

/**
 * Registers a handler for the hardware back button while `active`, taking priority over the
 * app's default router-based back navigation. Used by screens that show a sub-view (an editor,
 * a confirm dialog) as local component state rather than a real route, so the hardware back
 * button closes that sub-view instead of jumping past it to wherever router history points.
 */
export function useBackHandler(handler: BackHandler, active: boolean) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    const wrapped = () => handlerRef.current();
    stack.push(wrapped);
    return () => {
      const idx = stack.lastIndexOf(wrapped);
      if (idx !== -1) stack.splice(idx, 1);
    };
  }, [active]);
}
