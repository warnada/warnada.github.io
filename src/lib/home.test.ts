import { describe, expect, it } from 'vitest';
import { greetingFor, quickPicks } from './home';
import type { Track } from './types';

const t = (id: string): Track => ({ id, title: id, artist: 'a', album: 'b', genre: 'pop', duration: 1, audio: 'x', lyrics: null, size: 1, source: 'demo' });
const all = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(t);

describe('greetingFor', () => {
  it('menyapa sesuai jam', () => {
    expect(greetingFor(5)).toBe('Selamat pagi');
    expect(greetingFor(10)).toBe('Selamat pagi');
    expect(greetingFor(12)).toBe('Selamat siang');
    expect(greetingFor(16)).toBe('Selamat sore');
    expect(greetingFor(19)).toBe('Selamat malam');
    expect(greetingFor(2)).toBe('Selamat malam');
    expect(greetingFor(0)).toBe('Selamat malam');
  });
});

describe('quickPicks', () => {
  it('mendahulukan favorit, lalu riwayat, lalu sisanya, tanpa duplikat', () => {
    expect(quickPicks(all, ['c'], ['b', 'c', 'a'], 4).map((x) => x.id)).toEqual(['c', 'b', 'a', 'd']);
  });
  it('mengabaikan id yang tidak ada di katalog', () => {
    expect(quickPicks(all, ['zzz'], ['yyy'], 2).map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('dibatasi n dan aman untuk katalog kosong', () => {
    expect(quickPicks(all, [], [], 3)).toHaveLength(3);
    expect(quickPicks([], ['a'], ['b'], 6)).toEqual([]);
  });
});
