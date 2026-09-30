import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentTrack, next, prev, trackById, usePlayer } from '@/audio/engine';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { FavoriteButton } from '@/components/parts';
import { TimedSky } from '@/components/Sky';
import { SKY, weatherFor } from '@/lib/sky';
import { GENRE_LABEL } from '@/lib/types';
import { Wada } from '@/components/Wada';
import { Icon } from '@/components/Icon';
import { CloudLyrics, Lyrics, Transport } from '@/components/Player';
import { canDownload } from '@/lib/offline';
import { useOnline } from '@/audio/hooks';
import { useAxisDrag } from '@/lib/useAxisDrag';

/** Area yang punya geser/gulir sendiri: gestur atas/bawah tidak dimulai dari sini. */
const SWIPE_BLOCKED = '.sky__slider, .full__lyrics, input, textarea';
const SWAP_MS = 420;

export default function PlayerPage() {
  const navigate = useNavigate();
  const id = usePlayer((s) => s.currentId);
  const playing = usePlayer((s) => s.playing);
  useLibrary((s) => s.tracks);
  const track = id ? currentTrack() : undefined;
  const [lyricsView, setLyricsView] = useState(false);
  const downloaded = useLibrary((s) => (id ? s.downloaded.has(id) : false));
  const online = useOnline();
  const busy = useLibrary((s) => (id ? s.busy.has(id) : false));
  const back = useCallback(() => { if (history.length > 1) navigate(-1); else navigate('/'); }, [navigate]);
  const root = useRef<HTMLElement>(null);
  const swapTimer = useRef(0);
  // Geser atas = berikutnya, bawah = sebelumnya. Konten mengikuti jari (CSS variable, tanpa render ulang), lalu masuk dari arah lawan.
  const drag = useAxisDrag({
    axis: 'y',
    accepts: (t) => !t.closest(SWIPE_BLOCKED) && !useUi.getState().queueSheet && !useUi.getState().themeSheet,
    size: () => Math.min(root.current?.clientHeight ?? 320, 320), // ambang jadi ≈ 90px; tidak perlu menyeret sepanjang layar
    onDrag: (d) => {
      const el = root.current;
      if (!el) return;
      el.dataset.dragging = 'true';
      el.style.setProperty('--sw', `${(d * 0.45).toFixed(1)}px`);
      el.style.setProperty('--so', `${Math.max(0.35, 1 - Math.abs(d) / 320).toFixed(2)}`);
    },
    onEnd: (d, committed) => {
      const el = root.current;
      if (!el) return;
      delete el.dataset.dragging;
      el.style.setProperty('--sw', '0px'); el.style.setProperty('--so', '1');
      if (!committed) return;
      const before = usePlayer.getState().currentId;
      if (d < 0) next(); else prev();
      if (usePlayer.getState().currentId === before) return; // tidak pindah (ujung antrean / mulai ulang): cukup kembali ke posisi
      el.dataset.swap = d < 0 ? 'up' : 'down';
      window.clearTimeout(swapTimer.current);
      swapTimer.current = window.setTimeout(() => { delete el.dataset.swap; }, SWAP_MS);
    }
  });
  useEffect(() => () => window.clearTimeout(swapTimer.current), []);
  useEffect(() => { // Esc menutup pemutar, kecuali ada sheet terbuka (Esc itu milik sheet)
    const onKey = (e: KeyboardEvent) => {
      const { queueSheet, themeSheet } = useUi.getState();
      if (e.key === 'Escape' && !queueSheet && !themeSheet) back();
    };
    addEventListener('keydown', onKey, true); // capture: dibaca sebelum handler sheet menutup dirinya
    return () => removeEventListener('keydown', onKey, true);
  }, [back]);

  if (!track) return (
    <div className="full wd-stage" data-genre="lofi"><div className="full__top"><button className="icon-btn" aria-label="Tutup" onClick={back}><Icon name="chevdown" /></button></div>
      <div className="empty"><h2>Belum ada lagu</h2><p>Pilih satu lagu dari Beranda.</p></div></div>
  );
  const weather = weatherFor(track.genre);
  return (
    <section ref={root} className={`full lw ${lyricsView ? 'lw--lyrics' : ''}`} data-genre={track.genre} data-weather={weather} aria-label="Pemutar" style={{ '--sk-ink': SKY[weather].ink } as React.CSSProperties} {...drag}>
      <div className="full__top lw__top">
        <button type="button" className="icon-btn" aria-label="Tutup pemutar" onClick={back}><Icon name="chevdown" /></button>
        <span className="lw__weather"><small>Mengudara di</small>{SKY[weather].title}</span>
        <div className="full__actions">
          {downloaded
            ? <span className="icon-btn" role="img" aria-label="Tersedia offline" style={{ color: 'var(--accent-strong)' }}><Icon name="check" /></span>
            : <button type="button" className="icon-btn" disabled={busy || !online || !canDownload(track)} aria-label={canDownload(track) ? `Unduh ${track.title} untuk offline` : 'Lagu ini tidak boleh diunduh'} onClick={() => void useLibrary.getState().download(track)}>{busy ? <span className="ring" /> : <Icon name="download" />}</button>}
          <button type="button" className="icon-btn" aria-label="Antrean" onClick={() => useUi.setState({ queueSheet: true })}><Icon name="queue" /></button>
          <button type="button" className="icon-btn" aria-label={lyricsView ? 'Tampilkan langit' : 'Tampilkan lirik penuh'} aria-pressed={lyricsView} style={lyricsView ? { color: 'var(--accent-strong)' } : undefined} onClick={() => setLyricsView((v) => !v)}><Icon name="mic" /></button>
        </div>
      </div>
      <div className="lw__stage">
        <TimedSky className="lw__sky" weather={weather} vbH={600} baseFrac={0.52} trackId={track.id} duration={track.duration} interactive />
        <div className="lw__clouds"><CloudLyrics /></div>
        <Wada className="lw__wada" size={96} mood={playing ? 'sing' : 'sleep'} bounce={playing} />
      </div>
      {lyricsView && <div className="lw__full"><Lyrics /></div>}
      <div className="lw__sheet">
        <div className="full__meta">
          <div><h1>{track.title}</h1><p className="muted">{track.artist} · {GENRE_LABEL[track.genre]}</p></div>
          <FavoriteButton id={track.id} title={track.title} />
        </div>
        {track.license && (
          <p className="caption attribution">
            {track.source === 'jamendo' ? 'Musik via Jamendo · ' : ''}
            <a href={track.license.url} target="_blank" rel="noopener noreferrer">{track.license.label}</a>
          </p>
        )}
        <div className="full__controls"><Transport big /></div>
        <NextUp />
      </div>
    </section>
  );
}

/** Lagu berikutnya di antrean (bila urutan tidak diacak). Ketuk untuk membuka antrean. */
function NextUp() {
  const { queue, currentId, shuffle, repeat } = usePlayer();
  useLibrary((s) => s.tracks);
  const i = currentId ? queue.indexOf(currentId) : -1;
  const nextId = i < 0 || shuffle ? undefined : queue[i + 1] ?? (repeat === 'all' && queue.length > 1 ? queue[0] : undefined);
  const t = trackById(nextId ?? null);
  if (!t) return null;
  return (
    <button type="button" className="nextup" onClick={() => useUi.setState({ queueSheet: true })} aria-label={`Berikutnya: ${t.title}, ${t.artist}. Buka antrean`}>
      <strong>Berikutnya</strong><span>{t.title} · {t.artist}</span>
    </button>
  );
}
