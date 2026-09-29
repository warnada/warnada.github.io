import { NavLink } from 'react-router-dom';
import { Fragment, type ReactNode } from 'react';
import type { Genre, Track } from '@/lib/types';
import { GENRES, GENRE_LABEL } from '@/lib/types';
import { formatTime } from '@/lib/format';
import { splitHighlight } from '@/lib/search';
import { canPlay, playTrack, usePlayer } from '@/audio/engine';
import { useLibrary } from '@/store/library';
import { useOnline } from '@/audio/hooks';
import { useSettings } from '@/store/settings';
import { useSession } from '@/store/session';
import { Icon } from './Icon';

export const Art = ({ genre, src, className = '' }: { genre: Genre; src?: string; className?: string }) => (
  <div className={`wd-art ${className}`} data-genre={genre} aria-hidden="true">
    {src && <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onLoad={(e) => e.currentTarget.classList.add('is-loaded')} onError={(e) => e.currentTarget.remove()} />}
  </div>
);

export function Switch({ on, onChange, labelId }: { on: boolean; onChange: (v: boolean) => void; labelId: string }) {
  return <button type="button" className="wd-switch" aria-pressed={on} aria-labelledby={labelId} onClick={() => onChange(!on)} />;
}

export function Chip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className="wd-chip" aria-pressed={active} onClick={onClick}>{children}</button>;
}

export function FavoriteButton({ id, title, className = '' }: { id: string; title: string; className?: string }) {
  const on = useSession((s) => s.favorites.includes(id));
  const toggle = useSession((s) => s.toggleFavorite);
  return (
    <button type="button" className={`icon-btn fav ${on ? 'is-on' : ''} ${className}`} aria-pressed={on} aria-label={on ? `Hapus ${title} dari Disukai` : `Sukai ${title}`} onClick={() => toggle(id)}>
      <Icon name={on ? 'heartfill' : 'heart'} />
    </button>
  );
}

const HIGHLIGHT_MIN = 2;

/** Teks dengan bagian yang cocok dengan kata cari disorot (<mark>). */
export function Highlight({ text, term }: { text: string; term?: string }) {
  if (!term || term.trim().length < HIGHLIGHT_MIN) return <>{text}</>; // satu huruf disorot di mana-mana = berisik
  return <>{splitHighlight(text, term).map((s, i) => (s.hit ? <mark key={i}>{s.text}</mark> : <Fragment key={i}>{s.text}</Fragment>))}</>;
}

export function SongRow({ track, queue, showAlbum, highlight }: { track: Track; queue: string[]; showAlbum?: boolean; highlight?: string }) {
  const downloaded = useLibrary((s) => s.downloaded.has(track.id));
  const current = usePlayer((s) => s.currentId === track.id);
  useOnline(); useSettings((s) => s.offlineMode); useLibrary((s) => s.downloaded); // re-render saat status berubah
  const playable = canPlay(track);
  return (
    <div className="row-wrap">
      <button type="button" className="wd-row" disabled={!playable} aria-current={current} onClick={() => playTrack(track.id, queue)}>
        <Art genre={track.genre} src={track.artwork} className="wd-row__art" />
        <span className="wd-row__text">
          <span className="wd-row__title"><Highlight text={track.title} term={highlight} /></span>
          <span className="wd-row__meta"><Highlight text={track.artist} term={highlight} /> · {!playable ? 'Belum diunduh' : showAlbum ? track.album : formatTime(track.duration)}</span>
        </span>
        <span className="wd-row__end">{downloaded && <Icon name="check" aria-label="Tersedia offline" role="img" />}</span>
      </button>
      <FavoriteButton id={track.id} title={track.title} />
    </div>
  );
}

export function GenreSwatches({ value, onPick }: { value: Genre; onPick: (g: Genre) => void }) {
  return (
    <div className="sheet__genres" role="group" aria-label="Genre">
      {GENRES.map((g) => (
        <button key={g} type="button" className="wd-swatch" data-genre={g} aria-pressed={value === g} onClick={() => onPick(g)}>
          <span className="wd-swatch__dot" />{GENRE_LABEL[g]}
        </button>
      ))}
    </div>
  );
}

const NAV = [
  { to: '/', label: 'Beranda', icon: 'home' as const },
  { to: '/cari', label: 'Cari', icon: 'search' as const },
  { to: '/pustaka', label: 'Pustaka', icon: 'library' as const },
  { to: '/unduhan', label: 'Unduhan', icon: 'download' as const }
];
export function Nav() {
  return (
    <nav className="shell__nav" aria-label="Utama">
      <div className="brand-full"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />warnada</div>
      <div className="wd-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}>
            <span><Icon name={n.icon} width={22} height={22} /></span>{n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
