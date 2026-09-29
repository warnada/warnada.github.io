export type SwipeAction = 'close' | 'next' | 'prev';

const MIN_DISTANCE = 60;
const CLOSE_DISTANCE = 90;
const DOMINANCE = 1.5; // sumbu utama harus jauh lebih besar dari sumbu lain agar bukan diagonal ambigu

/** Terjemahkan perpindahan jari (px) menjadi aksi. null = bukan gestur. */
export function swipeAction(dx: number, dy: number): SwipeAction | null {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (dy > CLOSE_DISTANCE && ay > ax * DOMINANCE) return 'close';
  if (ax >= MIN_DISTANCE && ax > ay * DOMINANCE) return dx < 0 ? 'next' : 'prev';
  return null;
}
