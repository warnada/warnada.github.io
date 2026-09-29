import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRES, GENRE_LABEL, type Genre, type Track } from '@/lib/types';
import { formatSize } from '@/lib/format';
import { loadLyrics } from '@/lib/catalog';
import { cacheSupported, canDownload, storageEstimate } from '@/lib/offline';
import { canPlay, playTrack, usePlayer } from '@/audio/engine';
import { useOnline } from '@/audio/hooks';
import { jamendo, useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { Art, Chip, SongRow, Switch } from '@/components/parts';
import { Icon } from '@/components/Icon';
import { InstallBanner } from '@/components/Overlays';

const CAROUSEL_MAX = 12;
const SEARCH_DEBOUNCE_MS = 400;
const ids = (t: Track[]) => t.map((x) => x.id);

function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="empty"><h2>{title}</h2><p>{children}</p></div>;
}
function useTracks() {
  const tracks = useLibrary((s) => s.tracks); const status = useLibrary((s) => s.status);
  return { tracks, status };
}
function Loading({ status }: { status: string }) {
  if (status === 'error') return <Empty title="Katalog belum bisa dimuat">Cek koneksimu lalu muat ulang halaman.</Empty>;
  if (status !== 'ready') return <div className="empty" role="status"><span className="ring" />Memuat…</div>;
  return null;
}

export function Home() {
  const { tracks, status } = useTracks();
  const navigate = useNavigate();
  const current = usePlayer((s) => s.currentId);
  const loadingRemote = useLibrary((s) => s.loadingRemote);
  useOnline(); useSettings((s) => s.offlineMode); useLibrary((s) => s.downloaded);
  const featured = tracks.find((t) => t.id === current) ?? tracks[0];
  return (
    <div className="page">
      <h1>Mau dengar apa?</h1>
      <InstallBanner />
      <Loading status={status} />
      {loadingRemote && <p className="caption" role="status">Memuat lagu dari Jamendo…</p>}
      {featured && (
        <div className="hero" data-genre={featured.genre}>
          <span className="overline">Mix harian · {tracks.length} lagu</span>
          <h2>{featured.title}</h2>
          <p>{featured.artist}</p>
          <div className="hero__actions">
            <button type="button" className="wd-btn wd-btn--accent" onClick={() => playTrack(featured.id, ids(tracks))}><Icon name="play" />Putar</button>
            <button type="button" className="wd-btn wd-btn--ghost" onClick={() => navigate('/unduhan')}><Icon name="download" />Unduh</button>
          </div>
        </div>
      )}
      {!!tracks.length && <>
        <section className="section"><h2>Lanjutkan mendengarkan</h2>
          <div className="hscroll">{tracks.slice(0, CAROUSEL_MAX).map((t) => (
            <button key={t.id} type="button" className="card" disabled={!canPlay(t)} onClick={() => playTrack(t.id, ids(tracks))}>
              <Art genre={t.genre} src={t.artwork} /><span className="wd-row__title" style={{ font: '700 15px var(--font-sans)' }}>{t.title}</span><span className="caption">{t.artist}</span>
            </button>))}</div></section>
        <section className="section"><h2>Semua lagu</h2><div className="list">{tracks.map((t) => <SongRow key={t.id} track={t} queue={ids(tracks)} />)}</div></section>
      </>}
    </div>
  );
}

export function Explore() {
  const { tracks, status } = useTracks();
  const [genre, setGenre] = useState<Genre | null>(null);
  const list = useMemo(() => (genre ? tracks.filter((t) => t.genre === genre) : []), [tracks, genre]);
  return (
    <div className="page">
      <h1>Jelajah</h1>
      <p className="muted">Pilih suasana, dan seluruh warna aplikasi ikut berubah.</p>
      <Loading status={status} />
      <div className="genre-grid">{GENRES.map((g) => {
        const n = tracks.filter((t) => t.genre === g).length;
        return <button key={g} type="button" className="tile" data-genre={g} aria-pressed={genre === g} onClick={() => { setGenre(g); useSettings.getState().set({ genre: g, followGenre: false }); }}>
          <span>{GENRE_LABEL[g]}<small>{n} lagu</small></span></button>;
      })}</div>
      {genre && <section className="section"><h2>{GENRE_LABEL[genre]}</h2>
        {list.length ? <div className="list">{list.map((t) => <SongRow key={t.id} track={t} queue={ids(list)} />)}</div> : <Empty title="Belum ada lagu">Genre ini belum punya lagu.</Empty>}</section>}
    </div>
  );
}

type Filter = 'semua' | 'offline' | Genre;
export function Library() {
  const { tracks, status } = useTracks();
  const downloaded = useLibrary((s) => s.downloaded);
  const [f, setF] = useState<Filter>('semua');
  const list = tracks.filter((t) => f === 'semua' || (f === 'offline' ? downloaded.has(t.id) : t.genre === f));
  return (
    <div className="page">
      <h1>Pustaka</h1>
      <div className="chips" role="group" aria-label="Filter">
        <Chip active={f === 'semua'} onClick={() => setF('semua')}>Semua</Chip>
        <Chip active={f === 'offline'} onClick={() => setF('offline')}>Offline</Chip>
        {GENRES.map((g) => <Chip key={g} active={f === g} onClick={() => setF(g)}>{GENRE_LABEL[g]}</Chip>)}
      </div>
      <Loading status={status} />
      {status === 'ready' && (list.length ? <div className="list">{list.map((t) => <SongRow key={t.id} track={t} queue={ids(list)} showAlbum />)}</div>
        : <Empty title="Belum ada lagu di sini">{f === 'offline' ? 'Unduh lagu supaya bisa didengar tanpa internet.' : 'Coba filter lain.'}</Empty>)}
    </div>
  );
}

export function Downloads() {
  const { tracks, status } = useTracks();
  const { downloaded, busy, download, remove } = useLibrary();
  const { offlineMode, set } = useSettings();
  const online = useOnline();
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  useEffect(() => { void storageEstimate().then(setEst); }, [downloaded]);
  const mine = tracks.filter((t) => downloaded.has(t.id));
  const rest = tracks.filter((t) => !downloaded.has(t.id));
  const used = mine.reduce((n, t) => n + t.size, 0);
  return (
    <div className="page">
      <h1>Unduhan</h1>
      <div className="setting wd-glass">
        <Icon name="wifioff" width={26} height={26} />
        <div className="setting__text"><strong id="off">Mode offline</strong><span className="caption">Hanya memutar lagu yang sudah diunduh. Hemat kuota.{!online && ' Kamu sedang tanpa internet.'}</span></div>
        <Switch on={offlineMode} onChange={(v) => set({ offlineMode: v })} labelId="off" />
      </div>
      <div className="wd-glass" style={{ padding: 16, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Penyimpanan</strong><span className="caption">{mine.length} lagu · {formatSize(used)}</span></div>
        <div className="bar" role="img" aria-label="Pemakaian penyimpanan"><i style={{ width: `${est?.quota ? Math.max(1, (used / est.quota) * 100) : 0}%` }} /></div>
        {est && <span className="caption">Perangkat mengizinkan sekitar {formatSize(est.quota)} untuk aplikasi ini.</span>}
      </div>
      <Loading status={status} />
      {!cacheSupported() && <Empty title="Peramban belum mendukung unduhan">Coba Chrome, Edge, Safari, atau Firefox terbaru.</Empty>}
      {status === 'ready' && <>
        <section className="section"><h2>Di perangkat</h2>
          {mine.length ? <div className="list">{mine.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, minWidth: 0 }}><SongRow track={t} queue={ids(mine)} /></div>
              <button type="button" className="icon-btn" aria-label={`Hapus unduhan ${t.title}`} onClick={() => void remove(t)}><Icon name="trash" /></button></div>))}</div>
            : <Empty title="Belum ada unduhan">Unduh lagu di bawah supaya bisa diputar tanpa internet.</Empty>}</section>
        {!!rest.length && <section className="section"><h2>Bisa diunduh</h2><div className="list">{rest.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, minWidth: 0 }}><SongRow track={t} queue={ids(tracks)} /></div>
            <button type="button" className="icon-btn" disabled={busy.has(t.id) || !online || !canDownload(t)} aria-label={canDownload(t) ? `Unduh ${t.title} (${formatSize(t.size)})` : `${t.title} tidak boleh diunduh`} onClick={() => void download(t)}>{busy.has(t.id) ? <span className="ring" /> : <Icon name="download" />}</button></div>))}</div></section>}
      </>}
    </div>
  );
}

export function Search() {
  const { tracks, status } = useTracks();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<{ term: string; ids: Set<string> }>({ term: '', ids: new Set() });
  const [lyr, setLyr] = useState<Record<string, string[]>>({});
  useEffect(() => { // muat lirik sekali untuk pencarian berbasis lirik
    if (!tracks.length) return;
    void Promise.all(tracks.map((t) => loadLyrics(t).then((l) => [t.id, l.map((x) => x.text)] as const).catch(() => [t.id, []] as const)))
      .then((e) => setLyr(Object.fromEntries(e)));
  }, [tracks]);
  const term = q.trim().toLowerCase();
  const [remote, setRemote] = useState<'idle' | 'loading' | 'error'>('idle');
  const addTracks = useLibrary((s) => s.addTracks);
  useEffect(() => { // pencarian katalog Jamendo (debounce + batal saat mengetik lagi)
    const source = jamendo;
    if (!source || term.length < 2) return;
    const ctl = new AbortController();
    const timer = window.setTimeout(() => {
      setRemote('loading');
      source.search(q.trim(), ctl.signal)
        .then((list) => { addTracks(list); setRemote('idle'); setFound({ term, ids: new Set(list.map((t) => t.id)) }); })
        .catch((e) => { if (!ctl.signal.aborted) { setRemote('error'); console.debug(e); } });
    }, SEARCH_DEBOUNCE_MS);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [term, q, addTracks]);
  const results = useMemo(() => !term ? [] : tracks.flatMap((t) => {
    const meta = `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(term);
    const line = (lyr[t.id] ?? []).find((l) => l.toLowerCase().includes(term));
    return meta || line || (t.source === 'jamendo' && found.term === term && found.ids.has(t.id)) ? [{ t, line: meta ? undefined : line }] : [];
  }), [term, tracks, lyr, found]);
  return (
    <div className="page">
      <h1>Cari</h1>
      <label className="wd-search"><Icon name="search" width={20} height={20} />
        <input type="search" autoFocus aria-label="Cari lagu, artis, atau lirik" placeholder="Lagu, artis, atau potongan lirik" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <Loading status={status} />
      {!term && status === 'ready' && <Empty title="Ingat liriknya, lupa judulnya?">Ketik potongan liriknya, nanti kami carikan.</Empty>}
      {remote === 'loading' && <p className="caption" role="status">Mencari di Jamendo…</p>}
      {remote === 'error' && <p className="caption" role="status">Pencarian Jamendo gagal. Hasil lokal tetap ditampilkan.</p>}
      {!!term && !results.length && remote !== 'loading' && <Empty title="Tidak ketemu">Tidak ada hasil untuk “{q}”.</Empty>}
      <div className="list">{results.map(({ t, line }) => (
        <div key={t.id}><SongRow track={t} queue={ids(results.map((r) => r.t))} />{line && <p className="snippet" style={{ padding: '0 12px 8px 72px' }}>“{line}”</p>}</div>))}</div>
    </div>
  );
}
