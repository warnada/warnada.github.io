import type { AccentName, Genre } from './types';

export interface GenreStyle { accent: AccentName }

/** Aksen halus tiap genre, dipakai bila aplikasi mengikuti genre lagu. Sampul dan langit ada di sky.ts. */
export const GENRE_STYLE: Record<Genre, GenreStyle> = {
  lofi: { accent: 'lilac' },
  pop: { accent: 'rose' },
  rock: { accent: 'peach' },
  jazz: { accent: 'butter' },
  edm: { accent: 'sky' },
  dangdut: { accent: 'rose' },
  akustik: { accent: 'sage' },
  klasik: { accent: 'sky' }
};

/** Aksen aktif: mengikuti genre lagu yang diputar bila diminta, selain itu pilihan pengguna. */
export function resolveAccent(o: { follow: boolean; trackGenre: Genre | undefined; chosen: AccentName }): AccentName {
  return o.follow && o.trackGenre ? GENRE_STYLE[o.trackGenre].accent : o.chosen;
}
