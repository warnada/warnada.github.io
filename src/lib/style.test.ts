import { describe, expect, it } from 'vitest';
import { GENRE_STYLE, resolveAccent } from './style';
import { ACCENTS, GENRES, MOTIFS, TONES } from './types';

describe('GENRE_STYLE', () => {
  it('mencakup semua genre dengan nilai yang valid', () => {
    expect(Object.keys(GENRE_STYLE).sort()).toEqual([...GENRES].sort());
    for (const g of GENRES) {
      const s = GENRE_STYLE[g];
      expect(TONES).toContain(s.tone);
      expect(MOTIFS).toContain(s.motif);
      expect(ACCENTS).toContain(s.accent);
    }
  });
  it('aksen tidak sama dengan nada sampul yang bertabrakan secara tak sengaja: setiap aksen dipakai minimal satu genre', () => {
    const used = new Set(GENRES.map((g) => GENRE_STYLE[g].accent));
    for (const a of ACCENTS) expect(used.has(a)).toBe(true);
  });
});

describe('resolveAccent', () => {
  it('mengikuti genre lagu bila diaktifkan dan ada lagu yang diputar', () => {
    expect(resolveAccent({ follow: true, trackGenre: 'jazz', chosen: 'sage' })).toBe(GENRE_STYLE.jazz.accent);
  });
  it('memakai pilihan pengguna bila tidak mengikuti atau tidak ada lagu', () => {
    expect(resolveAccent({ follow: false, trackGenre: 'jazz', chosen: 'sky' })).toBe('sky');
    expect(resolveAccent({ follow: true, trackGenre: undefined, chosen: 'rose' })).toBe('rose');
  });
});
