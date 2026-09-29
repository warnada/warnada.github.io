import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentTrack, next, prev, usePlayer } from '@/audio/engine';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { Art, FavoriteButton } from '@/components/parts';
import { Icon } from '@/components/Icon';
import { Lyrics, Progress, Transport } from '@/components/Player';
import { GENRE_LABEL } from '@/lib/types';
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
  return (
    <section className={`full wd-stage ${lyricsView ? 'full--lyrics' : ''}`} data-genre={track.genre} aria-label="Pemutar">
      <div className="full__top" {...swipe}>
        <button type="button" className="icon-btn" aria-label="Tutup pemutar" onClick={back}><Icon name="chevdown" /></button>
        <span className="overline">{GENRE_LABEL[track.genre]}{downloaded ? ' · Offline' : ''}</span>
        <div className="full__actions">
          {downloaded
            ? <span className="icon-btn" role="img" aria-label="Tersedia offline" style={{ color: 'var(--accent)' }}><Icon name="check" /></span>
            : <button type="button" className="icon-btn" disabled={busy || !online || !canDownload(track)} aria-label={canDownload(track) ? `Unduh ${track.title} untuk offline` : 'Lagu ini tidak boleh diunduh'} onClick={() => void useLibrary.getState().download(track)}>{busy ? <span className="ring" /> : <Icon name="download" />}</button>}
          <button type="button" className="icon-btn" aria-label="Antrean" onClick={() => useUi.setState({ queueSheet: true })}><Icon name="queue" /></button>
          <button type="button" className="icon-btn full__lyric-toggle" aria-label={lyricsView ? 'Tampilkan sampul' : 'Tampilkan lirik penuh'} aria-pressed={lyricsView} style={lyricsView ? { color: 'var(--accent)' } : undefined} onClick={() => setLyricsView((v) => !v)}><Icon name="mic" /></button>
        </div>
      </div>
      <div className="full__body">
        <div className="full__main">
          <div className="full__head" {...swipe}>
            <Art genre={track.genre} src={track.artwork} className={`full__art ${playing ? '' : 'is-paused'}`} />
            <div className="full__meta">
              <div><h1>{track.title}</h1><p className="muted">{track.artist} · {track.album}</p></div>
              <FavoriteButton id={track.id} title={track.title} />
            </div>
          </div>
          {track.license && (
            <p className="caption attribution">
              {track.source === 'jamendo' ? 'Musik via Jamendo · ' : ''}
              <a href={track.license.url} target="_blank" rel="noopener noreferrer">{track.license.label}</a>
            </p>
          )}
          <Progress />
          <div className="full__controls"><Transport big /></div>
        </div>
        <div className="full__side">{lyricsView ? <Lyrics /> : <LyricsPreview />}</div>
      </div>
    </section>
  );
}

// Di layar sampul, lirik tetap terlihat sebagai kartu kaca ringkas.
function LyricsPreview() {
  return <div className="wd-glass full__lyriccard"><Lyrics /></div>;
}
