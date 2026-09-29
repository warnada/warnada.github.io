import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { activeLine, type LyricLine } from '@/lib/lrc';
import { loadLyrics } from '@/lib/catalog';
import { formatTime } from '@/lib/format';
import { cycleRepeat, currentTrack, next, prev, seek, toggle, toggleShuffle, usePlayer } from '@/audio/engine';
import { useTime } from '@/audio/hooks';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { Art } from './parts';
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

export function Transport({ big = false }: { big?: boolean }) {
  const { playing, shuffle, repeat, buffering } = usePlayer();
  return (
    <div className="wd-transport" role="group" aria-label="Kontrol pemutar">
      {big && <button type="button" className={shuffle ? 'on' : 'is-muted'} aria-label="Acak" aria-pressed={shuffle} onClick={toggleShuffle}><Icon name="shuffle" /></button>}
      <button type="button" className="fill" aria-label="Sebelumnya" onClick={prev}><Icon name="prev" /></button>
      <button type="button" className="wd-play" aria-label={playing ? 'Jeda' : 'Putar'} onClick={toggle}>{buffering && !playing ? <span className="ring" /> : <Icon name={playing ? 'pause' : 'play'} />}</button>
      <button type="button" className="fill" aria-label="Berikutnya" onClick={next}><Icon name="next" /></button>
      {big && <button type="button" className={repeat !== 'off' ? 'on' : 'is-muted'} aria-label={`Ulangi: ${repeat === 'off' ? 'mati' : repeat === 'all' ? 'semua' : 'satu lagu'}`} onClick={cycleRepeat}><Icon name="repeat" />{repeat === 'one' && <small style={{ position: 'absolute', fontSize: 9, fontWeight: 800 }}>1</small>}</button>}
    </div>
  );
}

export function Lyrics({ className = '' }: { className?: string }) {
  const track = useCurrent();
  const [data, setData] = useState<{ id: string; lines: LyricLine[] } | null>(null);
  const lines = data && data.id === track?.id ? data.lines : null;
  const t = useTime(true);
  const box = useRef<HTMLDivElement>(null);
  const idx = lines ? activeLine(lines, t) : -1;

  useEffect(() => {
    if (!track) return;
    let ok = true;
    loadLyrics(track).then((l) => ok && setData({ id: track.id, lines: l })).catch(() => ok && setData({ id: track.id, lines: [] }));
    return () => { ok = false; };
  }, [track]);

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
          : !lines.length ? <p className="none">Lirik belum tersedia untuk lagu ini.</p>
          : lines.map((l, i) => (
            <p key={i} aria-current={i === idx ? 'true' : undefined} className={i < idx ? 'is-sung' : undefined} onClick={() => seek(l.time)}>{l.text || '♪'}</p>
          ))}
      </div>
    </div>
  );
}

export function MiniPlayer() {
  const track = useCurrent();
  const playing = usePlayer((s) => s.playing);
  const t = useTime();
  const duration = usePlayer((s) => s.duration) || track?.duration || 0;
  if (!track) return null;
  return (
    <div className="mini wd-glass wd-glass--raised">
      <Link to="/putar" className="mini__open" aria-label={`Buka pemutar: ${track.title}`}>
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
        <button type="button" className={`icon-btn ${panel ? 'on' : ''}`} style={panel ? { color: 'var(--accent)' } : undefined} aria-label="Lirik" aria-pressed={wide ? panel : undefined}
          onClick={() => (matchMedia('(min-width:1101px)').matches ? useUi.setState({ lyricsPanel: !panel }) : navigate('/putar'))}><Icon name="mic" /></button>
      </div>
    </div>
  );
}

export function LyricPanel() {
  const track = useCurrent();
  const open = useUi((s) => s.lyricsPanel);
  if (!track || !open) return null;
  return (
    <aside className="lyricpanel wd-glass" aria-label="Lirik lagu">
      <div className="full__head" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Art genre={track.genre} src={track.artwork} className="wd-row__art" />
        <div><strong>{track.title}</strong><div className="caption">{track.artist}</div></div>
      </div>
      <Lyrics />
    </aside>
  );
}
