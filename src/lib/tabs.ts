/** Menu utama dalam urutan geser kiri → kanan. */
export const TAB_PATHS = ['/', '/cari', '/pustaka', '/unduhan'] as const;
export type Dir = 'next' | 'prev';

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

/** Indeks menu untuk sebuah path; -1 bila bukan halaman menu (mis. 404). */
export const tabIndex = (pathname: string): number => TAB_PATHS.indexOf(norm(pathname) as (typeof TAB_PATHS)[number]);

/** Path menu tetangga; null di ujung atau di luar menu (tidak melingkar, supaya arah geser tetap masuk akal). */
export function neighborTab(pathname: string, dir: Dir): string | null {
  const i = tabIndex(pathname);
  if (i < 0) return null;
  return TAB_PATHS[i + (dir === 'next' ? 1 : -1)] ?? null;
}

/** Posisi horizontal (px) panel ke-i saat panel aktif digeser sejauh dx; step = lebar panel + jarak antarpanel. */
export const paneX = (i: number, active: number, dx: number, step: number): number => (i - active) * step + dx;

/** Durasi animasi lanjutan setelah jari dilepas: cepat bila sentakan cepat, tidak pernah terlalu lambat atau terlalu kilat. */
export function settleMs(remainingPx: number, velocity: number): number {
  const speed = Math.max(Math.abs(velocity), 1.1); // px/ms
  return Math.round(Math.min(320, Math.max(170, (Math.abs(remainingPx) / speed) * 1.6)));
}
