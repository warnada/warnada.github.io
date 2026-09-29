import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentTrack, usePlayer } from '@/audio/engine';
import { useLibrary } from '@/store/library';
import { Art } from '@/components/parts';
import { Icon } from '@/components/Icon';
import { Lyrics, Progress, Transport } from '@/components/Player';
import { GENRE_LABEL } from '@/lib/types';

export default function PlayerPage() {
  const navigate = useNavigate();
  const id = usePlayer((s) => s.currentId);
  const playing = usePlayer((s) => s.playing);
  useLibrary((s) => s.tracks);
  const track = id ? currentTrack() : undefined;
  const [lyricsView, setLyricsView] = useState(false);
  const downloaded = useLibrary((s) => (id ? s.downloaded.has(id) : false));
  const back = () => (history.length > 1 ? navigate(-1) : navigate('/'));

  if (!track) return (
    <div className="full wd-stage" data-genre="lofi"><div className="full__top"><button className="icon-btn" aria-label="Tutup" onClick={back}><Icon name="chevdown" /></button></div>
      <div className="empty"><h2>Belum ada lagu</h2><p>Pilih satu lagu dari Beranda.</p></div></div>
  );
  return (
    <section className={`full wd-stage ${lyricsView ? 'full--lyrics' : ''}`} data-genre={track.genre} aria-label="Pemutar">
      <div className="full__top">
        <button type="button" className="icon-btn" aria-label="Tutup pemutar" onClick={back}><Icon name="chevdown" /></button>
        <span className="overline">{GENRE_LABEL[track.genre]}{downloaded ? ' · Offline' : ''}</span>
        <button type="button" className="icon-btn" aria-label={lyricsView ? 'Tampilkan sampul' : 'Tampilkan lirik penuh'} aria-pressed={lyricsView} style={lyricsView ? { color: 'var(--accent)' } : undefined} onClick={() => setLyricsView((v) => !v)}><Icon name="mic" /></button>
      </div>
      <div className="full__body">
        <div className="full__head">
          <Art genre={track.genre} src={track.artwork} className={`full__art ${playing ? '' : 'is-paused'}`} />
          <div className="full__meta"><div><h1>{track.title}</h1><p className="muted">{track.artist} · {track.album}</p></div></div>
        </div>
        {lyricsView ? <Lyrics /> : <div style={{ flex: 1, minHeight: 0, display: 'flex' }}><div style={{ flex: 1, minHeight: 0, display: 'flex' }}><LyricsPreview /></div></div>}
        {track.license && (
          <p className="caption attribution">
            {track.source === 'jamendo' ? 'Musik via Jamendo · ' : ''}
            <a href={track.license.url} target="_blank" rel="noopener noreferrer">{track.license.label}</a>
          </p>
        )}
        <Progress />
        <div className="full__controls"><Transport big /></div>
      </div>
    </section>
  );
}

// Di layar sampul, lirik tetap terlihat sebagai kartu kaca ringkas.
function LyricsPreview() {
  return <div className="wd-glass" style={{ flex: 1, minHeight: 0, display: 'flex', padding: '0 16px', overflow: 'hidden', margin: '8px 0' }}><Lyrics /></div>;
}
