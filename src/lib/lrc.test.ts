import { describe, expect, it } from 'vitest';
import { activeLine, parseLrc } from './lrc';

const src = '[ti:Judul]\n[00:05.50]Satu\n[00:10.00][00:30.25]Dua\n[01:02]\n';

describe('parseLrc', () => {
  it('mengabaikan tag meta, mengurutkan, dan mendukung banyak stempel', () => {
    const l = parseLrc(src);
    expect(l.map((x) => x.time)).toEqual([5.5, 10, 30.25, 62]);
    expect(l[2].text).toBe('Dua');
  });
});

describe('activeLine', () => {
  const l = parseLrc(src);
  it('-1 sebelum baris pertama', () => expect(activeLine(l, 1)).toBe(-1));
  it('memilih baris terakhir yang sudah mulai', () => {
    expect(activeLine(l, 5.5)).toBe(0);
    expect(activeLine(l, 29)).toBe(1);
    expect(activeLine(l, 999)).toBe(3);
  });
  it('daftar kosong', () => expect(activeLine([], 3)).toBe(-1));
});
