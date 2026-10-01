import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { afterSlop, axisLock, shouldCommit, velocityOf, type Axis } from './gesture';

export interface AxisDragOptions {
  axis: Axis;
  /** false = abaikan gestur yang dimulai di elemen ini (mis. area yang punya geser sendiri) */
  accepts?: (target: Element) => boolean;
  /** panjang sumbu untuk menghitung ambang jadi */
  size: () => number;
  /** posisi seretan (px). Dipanggil paling banyak sekali per frame, tanpa render ulang React. */
  onDrag: (delta: number) => void;
  /** delta px, jadi atau tidak, dan kecepatan lepas (px/ms, bertanda) untuk menyesuaikan durasi animasi lanjutan */
  onEnd: (delta: number, committed: boolean, velocity: number) => void;
}

type Phase = 'idle' | 'pending' | 'drag' | 'ignored';
const SAMPLE_WINDOW_MS = 100;

/**
 * Seretan satu sumbu untuk sentuhan/pen (mouse diabaikan). Halaman mengikuti jari lewat callback (isi dengan CSS variable, bukan state),
 * sumbu dikunci setelah beberapa piksel supaya scroll vertikal/horizontal biasa tidak terganggu, dan klik setelah seretan ditahan.
 */
export function useAxisDrag(options: AxisDragOptions) {
  const latest = useRef(options);
  useEffect(() => { latest.current = options; });
  const s = useRef({ phase: 'idle' as Phase, x0: 0, y0: 0, delta: 0, samples: [] as [number, number][], raf: 0, swallow: false });

  const finish = (committedAllowed: boolean) => {
    const st = s.current;
    if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; }
    const wasDrag = st.phase === 'drag';
    st.phase = 'idle';
    if (!wasDrag) return;
    st.swallow = true;
    const o = latest.current;
    const v = velocityOf(st.samples);
    o.onEnd(st.delta, committedAllowed && shouldCommit(st.delta, v, o.size()), v);
  };

  return {
    onPointerDown: (e: PointerEvent) => {
      const st = s.current;
      st.swallow = false;
      st.phase = 'idle';
      if (e.pointerType === 'mouse' || !e.isPrimary) return;
      const accepts = latest.current.accepts;
      if (accepts && !accepts(e.target as Element)) return;
      st.phase = 'pending'; st.x0 = e.clientX; st.y0 = e.clientY; st.delta = 0; st.samples = [];
    },
    onPointerMove: (e: PointerEvent) => {
      const st = s.current;
      if (st.phase !== 'pending' && st.phase !== 'drag') return;
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (st.phase === 'pending') {
        const lock = axisLock(dx, dy);
        if (lock === null) return;
        if (lock !== latest.current.axis) { st.phase = 'ignored'; return; }
        st.phase = 'drag';
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer sudah dilepas */ }
      }
      const raw = latest.current.axis === 'x' ? dx : dy;
      st.delta = afterSlop(raw);
      const now = performance.now();
      st.samples.push([now, raw]);
      while (st.samples.length > 2 && now - st.samples[0][0] > SAMPLE_WINDOW_MS) st.samples.shift();
      if (!st.raf) st.raf = requestAnimationFrame(() => { st.raf = 0; latest.current.onDrag(st.delta); });
    },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
    onClickCapture: (e: MouseEvent) => { if (s.current.swallow) { e.preventDefault(); e.stopPropagation(); s.current.swallow = false; } }
  };
}
