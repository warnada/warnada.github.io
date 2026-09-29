const TITLES: Record<string, string> = { '/pustaka': 'Pustaka', '/unduhan': 'Unduhan', '/cari': 'Cari', '/jelajah': 'Jelajah' };
const HOME_TITLE = 'Warnada · Musik dengan lirik tersinkron';

export interface NowPlaying { title: string; artist: string; playing: boolean }

export function pageTitle(pathname: string, now: NowPlaying | null): string {
  if (now?.playing) return `▶ ${now.title} · ${now.artist}`;
  if (pathname === '/') return HOME_TITLE;
  if (pathname === '/putar') return 'Pemutar · Warnada';
  const t = TITLES[pathname];
  return t ? `${t} · Warnada` : 'Halaman tidak ditemukan · Warnada';
}
