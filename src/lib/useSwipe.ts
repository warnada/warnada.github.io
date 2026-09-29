import { useRef } from 'react';
import type { PointerEvent, MouseEvent } from 'react';
import { swipeAction, type SwipeAction } from './gesture';

/** Handler gestur geser untuk sentuhan/pen (mouse diabaikan). Klik setelah geser ditahan agar tidak ikut membuka tautan. */
export function useSwipe(allowed: readonly SwipeAction[], onAction: (a: SwipeAction) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  return {
    onPointerDown: (e: PointerEvent) => {
      swiped.current = false;
      start.current = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const action = swipeAction(e.clientX - s.x, e.clientY - s.y);
      if (action && allowed.includes(action)) { swiped.current = true; onAction(action); }
    },
    onPointerCancel: () => { start.current = null; },
    onClickCapture: (e: MouseEvent) => { if (swiped.current) { e.preventDefault(); e.stopPropagation(); swiped.current = false; } }
  };
}
