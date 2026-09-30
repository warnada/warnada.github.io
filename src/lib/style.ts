import type { AccentName, Genre, MotifName, ToneName } from './types';

export interface GenreStyle { tone: ToneName; motif: MotifName; accent: AccentName }

/** Tampilan tiap genre: nada + motif sampul, dan aksen halus yang dipakai bila aplikasi mengikuti genre lagu. */
export const GENRE_STYLE: Record<Genre, GenreStyle> = {
  lofi: { tone: 'lilac', motif: 'moon', accent: 'lilac' },
  pop: { tone: 'rose', motif: 'star', accent: 'rose' },
  rock: { tone: 'peach', motif: 'sun', accent: 'peach' },
  jazz: { tone: 'butter', motif: 'note', accent: 'butter' },
  edm: { tone: 'sky', motif: 'wave', accent: 'sky' },
  dangdut: { tone: 'rose', motif: 'note', accent: 'rose' },
  akustik: { tone: 'mint', motif: 'leaf', accent: 'sage' },
  klasik: { tone: 'sky', motif: 'moon', accent: 'sky' }
};

/** Aksen aktif: mengikuti genre lagu yang diputar bila diminta, selain itu pilihan pengguna. */
export function resolveAccent(o: { follow: boolean; trackGenre: Genre | undefined; chosen: AccentName }): AccentName {
  return o.follow && o.trackGenre ? GENRE_STYLE[o.trackGenre].accent : o.chosen;
}
