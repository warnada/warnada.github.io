export const GENRES = ['lofi', 'pop', 'rock', 'jazz', 'edm', 'dangdut', 'akustik', 'klasik'] as const;
export type Genre = (typeof GENRES)[number];
export const GENRE_LABEL: Record<Genre, string> = { lofi: 'Lo-fi', pop: 'Pop', rock: 'Rock', jazz: 'Jazz', edm: 'EDM', dangdut: 'Dangdut', akustik: 'Akustik', klasik: 'Klasik' };
export type ThemeMode = 'dark' | 'light';

export interface License { label: string; url: string }

export interface Track {
  id: string; title: string; artist: string; album: string; genre: Genre;
  duration: number;
  /** path relatif (lagu demo) atau URL https tepercaya (Jamendo) */
  audio: string;
  /** path berkas .lrc tersinkron; null bila tidak tersedia */
  lyrics: string | null;
  size: number;
  source: 'demo' | 'jamendo';
  license?: License;
  artwork?: string;
  /** false bila penyedia melarang penyimpanan offline */
  downloadable?: boolean;
}
