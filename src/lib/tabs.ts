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
