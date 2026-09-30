export type SwipeAction = 'next' | 'prev';
export type Axis = 'x' | 'y';

const MIN_DISTANCE = 60;
const DOMINANCE = 1.5; // sumbu utama harus jauh lebih besar dari sumbu lain agar bukan diagonal ambigu

/** Terjemahkan perpindahan jari (px) menjadi geser kiri/kanan (mini player). null = bukan gestur. */
export function swipeAction(dx: number, dy: number): SwipeAction | null {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax >= MIN_DISTANCE && ax > ay * DOMINANCE) return dx < 0 ? 'next' : 'prev';
  return null;
}

/** Jarak (px) sebelum arah seretan ditentukan; juga dikurangkan dari seretan agar konten tidak melompat saat mulai mengikuti jari. */
export const DRAG_SLOP = 10;
const AXIS_DOMINANCE = 1.2;
const GIVE_UP = DRAG_SLOP * 4;

/** Kunci sumbu setelah jari bergerak cukup jauh. 'x'/'y' = sumbu dominan, 'none' = diagonal yang tak kunjung jelas (lepaskan), null = tunggu. */
export function axisLock(dx: number, dy: number): Axis | 'none' | null {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < DRAG_SLOP) return null;
  if (ax > ay * AXIS_DOMINANCE) return 'x';
  if (ay > ax * AXIS_DOMINANCE) return 'y';
  return Math.max(ax, ay) > GIVE_UP ? 'none' : null;
}

/** Seretan setelah dikurangi ambang awal, searah geraknya. */
export function afterSlop(raw: number): number {
  const a = Math.abs(raw);
  return a <= DRAG_SLOP ? 0 : Math.sign(raw) * (a - DRAG_SLOP);
}

const COMMIT_FRACTION = 0.28; // jarak seret ≥ 28% ukuran = jadi
const FLICK_MIN_DISTANCE = 32;
const FLICK_SPEED = 0.45; // px/ms
const BACKTRACK_SPEED = 0.3;

/** Apakah lepasan jari menjadi perpindahan. Sentakan cepat cukup dengan jarak pendek; sentakan balik membatalkan. */
export function shouldCommit(delta: number, velocity: number, size: number): boolean {
  const d = Math.abs(delta);
  if (Math.abs(velocity) >= BACKTRACK_SPEED && Math.sign(velocity) !== Math.sign(delta)) return false;
  return d >= size * COMMIT_FRACTION || (d >= FLICK_MIN_DISTANCE && Math.abs(velocity) >= FLICK_SPEED);
}

/** Kecepatan (px/ms) dari sampel [waktu, posisi] terbaru. */
export function velocityOf(samples: ReadonlyArray<readonly [number, number]>): number {
  if (samples.length < 2) return 0;
  const [t0, p0] = samples[0], [t1, p1] = samples[samples.length - 1];
  return t1 > t0 ? (p1 - p0) / (t1 - t0) : 0;
}
