import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentTrack, next, prev, usePlayer } from '@/audio/engine';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { FavoriteButton } from '@/components/parts';
import { TimedSky } from '@/components/Sky';
import { SKY, weatherFor } from '@/lib/sky';
import { Wada } from '@/components/Wada';
import { Icon } from '@/components/Icon';
import { CloudLyrics, Lyrics, Transport } from '@/components/Player';
import { canDownload } from '@/lib/offline';
import { useOnline } from '@/audio/hooks';
import { useSwipe } from '@/lib/useSwipe';

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
  const swipe = useSwipe(['close', 'next', 'prev'], (a) => { if (a === 'close') back(); else if (a === 'next') next(); else prev(); });
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
    <section className={`full lw ${lyricsView ? 'lw--lyrics' : ''}`} data-genre={track.genre} data-weather={weather} aria-label="Pemutar" style={{ '--sk-ink': SKY[weather].ink } as React.CSSProperties}>
      <div className="full__top lw__top" {...swipe}>
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
        <div className="lw__clouds" {...swipe}><CloudLyrics /></div>
        <Wada className="lw__wada" size={96} mood={playing ? 'sing' : 'sleep'} bounce={playing} />
      </div>
      {lyricsView && <div className="lw__full"><Lyrics /></div>}
      <div className="lw__sheet">
        <div className="full__meta" {...swipe}>
          <div><h1>{track.title}</h1><p className="muted">{track.artist} · {track.album}</p></div>
          <FavoriteButton id={track.id} title={track.title} />
        </div>
        {track.license && (
          <p className="caption attribution">
            {track.source === 'jamendo' ? 'Musik via Jamendo · ' : ''}
            <a href={track.license.url} target="_blank" rel="noopener noreferrer">{track.license.label}</a>
          </p>
        )}
        <div className="full__controls"><Transport big /></div>
        <p className="caption lw__hint">Geser matahari untuk melompat ke bagian lain lagu.</p>
      </div>
    </section>
  );
}
