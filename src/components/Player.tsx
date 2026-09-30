import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type LyricLine } from '@/lib/lrc';
import { loadLyrics } from '@/lib/catalog';
import { formatTime } from '@/lib/format';
import { cycleRepeat, currentTrack, next, playTrack, prev, removeQueueItem, seek, toggle, toggleShuffle, usePlayer } from '@/audio/engine';
import { useLyricIndex, useTime } from '@/audio/hooks';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { useSwipe } from '@/lib/useSwipe';
import { Art, FavoriteButton } from './parts';
import { Icon } from './Icon';

function useCurrent() {
  const id = usePlayer((s) => s.currentId);
  useLibrary((s) => s.tracks);
  return id ? currentTrack() : undefined;
}

export function Progress({ compact = false }: { compact?: boolean }) {
  const cur = useCurrent();
  const duration = usePlayer((s) => s.duration) || cur?.duration || 0;
  const t = useTime();
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? t;
  const pct = duration ? Math.min(100, (shown / duration) * 100) : 0;
  return (
    <div style={{ width: '100%' }}>
      <div className="seek">
        <div className="wd-progress" aria-hidden="true"><div className="wd-progress__fill" style={{ width: `${pct}%` }} /><div className="wd-progress__knob" style={{ left: `${pct}%` }} /></div>
        <input type="range" aria-label="Posisi lagu" min={0} max={Math.max(1, Math.floor(duration))} step={1} value={Math.floor(shown)} aria-valuetext={`${formatTime(shown)} dari ${formatTime(duration)}`}
          onChange={(e) => setDrag(Number(e.target.value))} onPointerUp={() => { if (drag != null) seek(drag); setDrag(null); }} onKeyUp={() => { if (drag != null) seek(drag); setDrag(null); }} />
      </div>
      {!compact && <div className="times"><span>{formatTime(shown)}</span><span>{formatTime(duration)}</span></div>}
    </div>
  );
}

/** Tombol putar berbentuk piringan hitam + jarum: berputar saat memutar, jarum turun ke piringan; jeda = berhenti dan jarum terangkat. */
function VinylPlay() {
  const { playing, buffering } = usePlayer();
  return (
    <button type="button" className="vinyl" data-playing={playing} aria-label={playing ? 'Jeda' : 'Putar'} onClick={toggle}>
      <span className="vinyl__disc" aria-hidden="true"><span className="vinyl__shine" /><span className="vinyl__label" /><span className="vinyl__hole" /></span>
      <span className="vinyl__glyph" aria-hidden="true">{buffering && !playing ? <span className="ring" /> : <Icon name={playing ? 'pause' : 'play'} />}</span>
      <svg className="vinyl__arm" viewBox="0 0 40 100" aria-hidden="true" focusable="false">
        <circle cx="30" cy="10" r="8" fill="#E9E3F0" stroke="#3D3345" strokeOpacity=".4" strokeWidth="2" />
        <path d="M30 10 L30 62 L14 88" fill="none" stroke="#E9E3F0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 10 L30 62 L14 88" fill="none" stroke="#3D3345" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="84" width="14" height="10" rx="3" fill="#3D3345" transform="rotate(-28 13 89)" />
      </svg>
    </button>
  );
}

export function Transport({ big = false }: { big?: boolean }) {
  const { playing, shuffle, repeat, buffering } = usePlayer();
  return (
    <div className="wd-transport" role="group" aria-label="Kontrol pemutar">
      {big && <button type="button" className={shuffle ? 'on' : 'is-muted'} aria-label="Acak" aria-pressed={shuffle} onClick={toggleShuffle}><Icon name="shuffle" /></button>}
      <button type="button" className="fill" aria-label="Sebelumnya" onClick={prev}><Icon name="prev" /></button>
      {big ? <VinylPlay /> : <button type="button" className="wd-play" aria-label={playing ? 'Jeda' : 'Putar'} onClick={toggle}>{buffering && !playing ? <span className="ring" /> : <Icon name={playing ? 'pause' : 'play'} />}</button>}
      <button type="button" className="fill" aria-label="Berikutnya" onClick={next}><Icon name="next" /></button>
      {big && <button type="button" className={repeat !== 'off' ? 'on' : 'is-muted'} aria-label={`Ulangi: ${repeat === 'off' ? 'mati' : repeat === 'all' ? 'semua' : 'satu lagu'}`} onClick={cycleRepeat}><Icon name="repeat" />{repeat === 'one' && <small style={{ position: 'absolute', fontSize: 9, fontWeight: 800 }}>1</small>}</button>}
    </div>
  );
}

/** Lirik lagu yang sedang diputar: null = memuat, [] = tidak ada. */
function useLyricLines(): LyricLine[] | null {
  const track = useCurrent();
  const [data, setData] = useState<{ id: string; lines: LyricLine[] } | null>(null);
  useEffect(() => {
    if (!track) return;
    let ok = true;
    loadLyrics(track).then((l) => ok && setData({ id: track.id, lines: l })).catch(() => ok && setData({ id: track.id, lines: [] }));
    return () => { ok = false; };
  }, [track]);
  return data && data.id === track?.id ? data.lines : null;
}

export function Lyrics({ className = '' }: { className?: string }) {
  const lines = useLyricLines();
  const idx = useLyricIndex(lines);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const wrap = box.current;
    if (!el || !wrap) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    wrap.scrollTo({ top: el.offsetTop - wrap.clientHeight * 0.3, behavior: reduce ? 'auto' : 'smooth' });
  }, [idx, lines]);

  return (
    <div ref={box} className={`full__lyrics ${className}`} aria-label="Lirik" tabIndex={0}>
      <div className="wd-lyrics">
        {lines === null ? <p className="none">Memuat lirik…</p>
          : !lines.length ? <p className="none">Lagu ini belum punya lirik tersinkron.</p>
          : lines.map((l, i) => (
            <p key={i} aria-current={i === idx ? 'true' : undefined} className={i < idx ? 'is-sung' : undefined} onClick={() => seek(l.time)}>{l.text || '♪'}</p>
          ))}
      </div>
    </div>
  );
}

/** Lirik sebagai awan: baris yang sedang dinyanyikan berupa awan besar, baris sebelum dan sesudahnya awan kecil. Ketuk untuk lompat. */
export function CloudLyrics() {
  const lines = useLyricLines();
  const idx = useLyricIndex(lines);
  if (lines === null) return <p className="clouds__none">Memuat lirik…</p>;
  if (!lines.length) return <p className="clouds__none">Lagu ini belum punya lirik tersinkron.</p>;
  const cur = Math.max(0, idx);
  const first = Math.max(0, Math.min(cur - 1, lines.length - 3));
  const win = lines.slice(first, first + 3);
  return (
    <div className="clouds" aria-label="Lirik">
      {win.map((l, k) => {
        const i = first + k;
        return <button key={i} type="button" className={`cloud ${i === idx ? 'cloud--now' : ''}`} aria-current={i === idx ? 'true' : undefined} onClick={() => seek(l.time)}>{l.text || '♪'}</button>;
      })}
    </div>
  );
}

export function MiniPlayer() {
  const track = useCurrent();
  const playing = usePlayer((s) => s.playing);
  const t = useTime();
  const duration = usePlayer((s) => s.duration) || track?.duration || 0;
  const swipe = useSwipe(['next', 'prev'], (a) => (a === 'next' ? next() : prev()));
  if (!track) return null;
  return (
    <div className="mini wd-glass wd-glass--raised">
      <Link to="/putar" className="mini__open" aria-label={`Buka pemutar: ${track.title}`} {...swipe}>
        <Art genre={track.genre} src={track.artwork} />
        <span className="wd-row__text"><span className="wd-row__title">{track.title}</span><span className="wd-row__meta">{track.artist}</span></span>
      </Link>
      <button type="button" className="icon-btn" aria-label={playing ? 'Jeda' : 'Putar'} onClick={toggle}><Icon name={playing ? 'pause' : 'play'} /></button>
      <button type="button" className="icon-btn" aria-label="Berikutnya" onClick={next}><Icon name="next" /></button>
      <div className="mini__progress"><i style={{ width: `${duration ? (t / duration) * 100 : 0}%` }} /></div>
    </div>
  );
}

export function PlayerBar() {
  const track = useCurrent();
  const navigate = useNavigate();
  const panel = useUi((s) => s.lyricsPanel);
  const tab = useUi((s) => s.panelTab);
  if (!track) return <div className="playerbar wd-glass wd-glass--raised"><span className="muted">Pilih lagu untuk mulai memutar.</span></div>;
  const wide = matchMedia('(min-width:1101px)').matches;
  return (
    <div className="playerbar wd-glass wd-glass--raised">
      <button type="button" className="playerbar__now" onClick={() => navigate('/putar')} aria-label={`Buka pemutar: ${track.title}`}>
        <Art genre={track.genre} src={track.artwork} />
        <span className="wd-row__text"><span className="wd-row__title">{track.title}</span><span className="wd-row__meta">{track.artist}</span></span>
      </button>
      <div className="playerbar__mid"><Transport /><div className="playerbar__seek"><Progress compact /></div></div>
      <div className="playerbar__end">
        <FavoriteButton id={track.id} title={track.title} className="pb-extra" />
        <button type="button" className="icon-btn pb-extra" style={panel && tab === 'queue' ? { color: 'var(--accent)' } : undefined} aria-label="Antrean"
          onClick={() => { if (matchMedia('(min-width:1101px)').matches) useUi.setState({ lyricsPanel: true, panelTab: 'queue' }); else useUi.setState({ queueSheet: true }); }}><Icon name="queue" /></button>
        <button type="button" className={`icon-btn ${panel ? 'on' : ''}`} style={panel && tab === 'lyrics' ? { color: 'var(--accent)' } : undefined} aria-label="Lirik" aria-pressed={wide ? panel && tab === 'lyrics' : undefined}
          onClick={() => { if (!matchMedia('(min-width:1101px)').matches) navigate('/putar'); else useUi.setState(panel && tab === 'lyrics' ? { lyricsPanel: false } : { lyricsPanel: true, panelTab: 'lyrics' }); }}><Icon name="mic" /></button>
      </div>
    </div>
  );
}

export function LyricPanel() {
  const track = useCurrent();
  const open = useUi((s) => s.lyricsPanel);
  const tab = useUi((s) => s.panelTab);
  if (!track || !open) return null;
  return (
    <aside className="lyricpanel wd-glass" aria-label="Panel lirik dan antrean">
      <div className="seg" role="group" aria-label="Tampilan panel">
        <button type="button" aria-pressed={tab === 'lyrics'} onClick={() => useUi.setState({ panelTab: 'lyrics' })}>Lirik</button>
        <button type="button" aria-pressed={tab === 'queue'} onClick={() => useUi.setState({ panelTab: 'queue' })}>Antrean</button>
      </div>
      {tab === 'lyrics' ? (
        <>
          <div className="full__head" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Art genre={track.genre} src={track.artwork} className="wd-row__art" />
            <div><strong>{track.title}</strong><div className="caption">{track.artist}</div></div>
          </div>
          <Lyrics />
        </>
      ) : <div className="lyricpanel__queue"><QueueList /></div>}
    </aside>
  );
}

/** Daftar antrean: ketuk untuk memutar, × untuk menghapus (lagu yang sedang diputar tidak bisa dihapus). */
export function QueueList() {
  const queue = usePlayer((s) => s.queue);
  const currentId = usePlayer((s) => s.currentId);
  const playing = usePlayer((s) => s.playing);
  const tracks = useLibrary((s) => s.tracks);
  const items = queue.flatMap((id) => tracks.find((t) => t.id === id) ?? []);
  if (!items.length) return <div className="empty"><h2>Antrean kosong</h2><p>Putar lagu dari Beranda atau Pustaka, dan lagu berikutnya muncul di sini.</p></div>;
  return (
    <ol className="queue" aria-label="Antrean">
      {items.map((t) => {
        const isCurrent = t.id === currentId;
        return (
          <li key={t.id} className="row-wrap">
            <button type="button" className="wd-row" aria-current={isCurrent} onClick={() => playTrack(t.id)}>
              <Art genre={t.genre} src={t.artwork} className="wd-row__art" />
              <span className="wd-row__text"><span className="wd-row__title">{t.title}</span><span className="wd-row__meta">{isCurrent ? (playing ? 'Sedang diputar' : 'Dijeda') : t.artist}</span></span>
              {isCurrent && playing && <span className="eq" aria-hidden="true"><i /><i /><i /></span>}
            </button>
            {isCurrent ? <span className="icon-btn" aria-hidden="true" /> : <button type="button" className="icon-btn" aria-label={`Hapus ${t.title} dari antrean`} onClick={() => removeQueueItem(t.id)}><Icon name="close" width={18} height={18} /></button>}
          </li>
        );
      })}
    </ol>
  );
}
