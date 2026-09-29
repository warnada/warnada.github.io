export interface LyricLine { time: number; text: string }

const TAG = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** Parse LRC (mendukung banyak stempel waktu per baris dan pecahan detik). */
export function parseLrc(src: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of src.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(TAG)];
    if (!stamps.length) continue;
    const text = raw.replace(TAG, '').trim();
    for (const m of stamps) {
      const frac = m[3] ? Number(m[3].padEnd(3, '0').slice(0, 3)) / 1000 : 0;
      lines.push({ time: Number(m[1]) * 60 + Number(m[2]) + frac, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** Indeks baris aktif untuk waktu t (biner). -1 bila belum ada baris yang dimulai. */
export function activeLine(lines: LyricLine[], t: number): number {
  let lo = 0, hi = lines.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}
