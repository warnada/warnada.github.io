import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GENRES, GENRE_LABEL, type Genre, type Track } from '@/lib/types';
import { formatSize } from '@/lib/format';
import { loadLyrics } from '@/lib/catalog';
import { cacheSupported, canDownload, storageEstimate } from '@/lib/offline';
import { canPlay, playTrack, toggle, usePlayer } from '@/audio/engine';
import { useOnline } from '@/audio/hooks';
import { jamendo, useLibrary } from '@/store/library';
import { useSession } from '@/store/session';
import { FOCUS_SEARCH_EVENT, matchTrack, readGenre, shouldAutofocus } from '@/lib/search';
import { greetingFor, quickPicks } from '@/lib/home';
import { useSettings } from '@/store/settings';
import { Art, Chip, Highlight, SongRow, Switch } from '@/components/parts';
import { Wada } from '@/components/Wada';
import { PageSky, SkyMini, TimedSky } from '@/components/Sky';
import { SKY, weatherFor } from '@/lib/sky';
import { Icon } from '@/components/Icon';
import { InstallBanner } from '@/components/Overlays';

const CAROUSEL_MAX = 12;
const RECENT_ROWS_MAX = 3;
const SEARCH_DEBOUNCE_MS = 400;
const URL_SYNC_MS = 500;
const ids = (t: Track[]) => t.map((x) => x.id);

function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="empty"><Wada size={72} mood="sleep" /><h2>{title}</h2><p>{children}</p></div>;
}
function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="list" role="status" aria-label="Memuat">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row" aria-hidden="true"><span className="skeleton" /><span className="skeleton-text"><span className="skeleton" /><span className="skeleton" /></span></div>
      ))}
    </div>
  );
}
/** Muncul saat offline / Mode offline aktif, supaya lagu yang nonaktif tidak terlihat rusak. */
function OfflineNotice() {
  const online = useOnline();
  const offlineMode = useSettings((s) => s.offlineMode);
  if (online && !offlineMode) return null;
  return (
    <div className="banner wd-glass wd-glass--raised" role="status">
      <Icon name="wifioff" width={24} height={24} />
      <p>{online ? 'Mode offline aktif.' : 'Kamu sedang offline.'} Hanya lagu yang sudah diunduh yang bisa diputar.</p>
      <Link to="/unduhan" className="wd-btn wd-btn--ghost">Unduhan</Link>
    </div>
  );
}
function useTracks() {
  const tracks = useLibrary((s) => s.tracks); const status = useLibrary((s) => s.status);
  return { tracks, status };
}
function Loading({ status }: { status: string }) {
  if (status === 'error') return (
    <div className="empty" role="alert"><h2>Katalog belum bisa dimuat</h2><p>Cek koneksimu, lalu coba lagi.</p>
      <button type="button" className="wd-btn wd-btn--accent" onClick={() => void useLibrary.getState().retry()}>Coba lagi</button></div>
  );
  if (status !== 'ready') return <Skeleton />;
  return null;
}

export function Home() {
  const { tracks, status } = useTracks();
  const currentId = usePlayer((s) => s.currentId);
  const playing = usePlayer((s) => s.playing);
  const loadingRemote = useLibrary((s) => s.loadingRemote);
  const { history, favorites, last } = useSession();
  useOnline(); useSettings((s) => s.offlineMode); useLibrary((s) => s.downloaded);

  const byId = (list: string[]) => list.flatMap((id) => tracks.find((t) => t.id === id) ?? []);
  const recent = byId(history).slice(0, RECENT_ROWS_MAX);
  const liked = byId(favorites).slice(0, CAROUSEL_MAX);
  const shelf = quickPicks(tracks, favorites, history, CAROUSEL_MAX);
  const hero = tracks.find((t) => t.id === currentId) ?? tracks.find((t) => t.id === last?.id) ?? shelf[0];
  const isCurrent = !!hero && hero.id === currentId;
  const resumed = !!hero && last?.id === hero.id && last.position > 1;
  const progress = hero && last?.id === hero.id && hero.duration ? Math.min(100, (last.position / hero.duration) * 100) : 0;
  const heroAction = () => { if (!hero) return; if (isCurrent) toggle(); else playTrack(hero.id, ids(tracks)); };
  const running = isCurrent && playing;

  return (
    <div className="page home">
      <OfflineNotice />
      <InstallBanner />
      <Loading status={status} />
      {status === 'ready' && !hero && <Empty title="Belum ada lagu">Katalog masih kosong.</Empty>}
      {!hero && status !== 'ready' && (
        <header className="home__hello">
          <Wada size={64} mood="happy" />
          <div><p className="hello__greet">{greetingFor(new Date().getHours())}</p><h1>Mau dengar apa?</h1></div>
        </header>
      )}
      {hero && (
        <section className="lhero" data-genre={hero.genre} aria-label="Langit hari ini">
          <TimedSky className="lhero__sky" weather={weatherFor(hero.genre)} vbH={500} baseFrac={0.7} trackId={hero.id} duration={hero.duration} fallbackT={progress / 100}>
            <div className="lhero__text">
              <p className="hello__greet">{greetingFor(new Date().getHours())}</p>
              <h1>{SKY[weatherFor(hero.genre)].title}</h1>
              <p className="lhero__sub">Langit ini memutar {GENRE_LABEL[hero.genre]}</p>
            </div>
            <Wada className="lhero__wada" size={80} mood={running ? 'sing' : 'happy'} bounce={running} />
          </TimedSky>
          <div className="lhero__sheet">
            <div className="lhero__now">
              <button type="button" className="continue__play" aria-label={running ? 'Jeda' : resumed || isCurrent ? 'Lanjutkan' : 'Putar'} onClick={heroAction}><Icon name={running ? 'pause' : 'play'} /></button>
              <Link to="/putar" className="continue__open" aria-label={`Buka pemutar: ${hero.title}`}>
                <span className="continue__text">
                  <span className="overline">{isCurrent ? 'Sedang mengudara' : resumed ? 'Terakhir diputar' : `Mix harian · ${tracks.length} lagu`}</span>
                  <span className="continue__title" style={{ display: 'block' }}>{hero.title}</span>
                  <span className="caption" style={{ display: 'block' }}>{hero.artist}</span>
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}
      {loadingRemote && <p className="caption" role="status">Memuat lagu dari Jamendo…</p>}
      {!!tracks.length && <>
        <section className="section" aria-labelledby="mood-h"><div className="section__head"><h2 id="mood-h">Suasana</h2><Link to="/cari" className="section__more">Jelajahi</Link></div>
          <div className="chips">{GENRES.map((g) => <Link key={g} to={`/cari?genre=${g}`} className="wd-chip wd-chip--dot"><i style={{ background: SKY[weatherFor(g)].sun }} aria-hidden="true" />{GENRE_LABEL[g]}</Link>)}</div></section>
        <Shelf title="Untukmu" tracks={shelf} all={tracks} />
        {!!recent.length && <section className="section"><div className="section__head"><h2>Baru diputar</h2><Link to="/pustaka" className="section__more">Pustaka</Link></div>
          <div className="list list--grid">{recent.map((t) => <SongRow key={t.id} track={t} queue={ids(tracks)} />)}</div></section>}
        {!!liked.length && <Shelf title="Disukai" tracks={liked} all={tracks} more={{ to: '/pustaka', label: 'Lihat semua' }} />}
      </>}
    </div>
  );
}

function Shelf({ title, tracks, all, more }: { title: string; tracks: Track[]; all: Track[]; more?: { to: string; label: string } }) {
  return (
    <section className="section">
      <div className="section__head"><h2>{title}</h2>{more && <Link to={more.to} className="section__more">{more.label}</Link>}</div>
      <div className="hscroll">{tracks.map((t) => (
        <button key={t.id} type="button" className="card" disabled={!canPlay(t)} onClick={() => playTrack(t.id, ids(all))}>
          <Art genre={t.genre} src={t.artwork} /><span className="card__title">{t.title}</span><span className="caption">{t.artist}</span>
        </button>))}</div>
    </section>
  );
}

type Filter = 'semua' | 'disukai' | 'offline' | Genre;
export function Library() {
  const { tracks, status } = useTracks();
  const downloaded = useLibrary((s) => s.downloaded);
  const [f, setF] = useState<Filter>('semua');
  const favorites = useSession((s) => s.favorites);
  const list = tracks.filter((t) => f === 'semua' || (f === 'disukai' ? favorites.includes(t.id) : f === 'offline' ? downloaded.has(t.id) : t.genre === f));
  return (
    <div className="page">
      <PageSky weather={f !== 'semua' && f !== 'disukai' && f !== 'offline' ? weatherFor(f) : 'dusk'} title="Pustaka" sub={status === 'ready' ? `${list.length} lagu` : undefined} />
      <div className="chips" role="group" aria-label="Filter">
        <Chip active={f === 'semua'} onClick={() => setF('semua')}>Semua</Chip>
        <Chip active={f === 'disukai'} onClick={() => setF('disukai')}>Disukai</Chip>
        <Chip active={f === 'offline'} onClick={() => setF('offline')}>Offline</Chip>
        {GENRES.map((g) => <Chip key={g} active={f === g} onClick={() => setF(g)}>{GENRE_LABEL[g]}</Chip>)}
      </div>
      <OfflineNotice />
      <Loading status={status} />
      {status === 'ready' && (list.length ? <div className="list list--grid">{list.map((t) => <SongRow key={t.id} track={t} queue={ids(list)} showAlbum />)}</div>
        : <Empty title="Belum ada lagu di sini">{f === 'offline' ? 'Unduh lagu supaya bisa didengar tanpa internet.' : f === 'disukai' ? 'Ketuk ikon hati di sebelah lagu untuk menyimpannya di sini.' : 'Coba filter lain.'}</Empty>)}
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
      <PageSky weather="meadow" title="Unduhan" sub={status === 'ready' ? `${mine.length} lagu di perangkat · ${formatSize(used)}` : undefined} />
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

/**
 * Cari + Jelajah dalam satu halaman. Keadaan (kata + genre) disimpan di URL:
 * /cari?q=hujan&genre=jazz, sehingga tombol Back dan tautan dari Beranda bekerja.
 */
export function Search() {
  const { tracks, status } = useTracks();
  const [params, setParams] = useSearchParams();
  const genre = readGenre(params.get('genre'));
  const [q, setQ] = useState(params.get('q') ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useSession((s) => s.recentSearches);
  const { addRecentSearch, removeRecentSearch, clearRecentSearches } = useSession.getState();
  const addTracks = useLibrary((s) => s.addTracks);
  const term = q.trim().toLowerCase();
  const key = `${term}|${genre ?? ''}`;

  const setGenre = (g: Genre | null) => {
    const next = new URLSearchParams(params);
    if (g) next.set('genre', g); else next.delete('genre');
    setParams(next, { replace: true });
  };
  useEffect(() => { // tulis kata ke URL setelah jeda (Safari membatasi jumlah replaceState per detik)
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (q.trim()) next.set('q', q.trim()); else next.delete('q');
      if (next.toString() !== window.location.search.replace(/^\?/, '')) setParams(next, { replace: true });
    }, URL_SYNC_MS);
    return () => clearTimeout(timer);
  }, [q, setParams]);

  const [lyr, setLyr] = useState<Record<string, string[]>>({});
  useEffect(() => { // muat lirik sekali untuk pencarian berbasis lirik
    if (!tracks.length) return;
    void Promise.all(tracks.map((t) => loadLyrics(t).then((l) => [t.id, l.map((x) => x.text)] as const).catch(() => [t.id, []] as const)))
      .then((e) => setLyr(Object.fromEntries(e)));
  }, [tracks]);

  const [remote, setRemote] = useState<'idle' | 'loading' | 'error'>('idle');
  const [found, setFound] = useState<{ key: string; ids: Set<string> }>({ key: '', ids: new Set() });
  useEffect(() => { // pencarian katalog Jamendo (debounce + batal saat mengetik lagi)
    const source = jamendo;
    if (!source || term.length < 2) return;
    const ctl = new AbortController();
    const timer = window.setTimeout(() => {
      setRemote('loading');
      source.search(q.trim(), ctl.signal, genre ?? undefined)
        .then((list) => { addTracks(list); setRemote('idle'); setFound({ key, ids: new Set(list.map((t) => t.id)) }); })
        .catch((e) => { if (!ctl.signal.aborted) { setRemote('error'); console.debug(e); } });
    }, SEARCH_DEBOUNCE_MS);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [term, q, genre, key, addTracks]);

  const inGenre = useMemo(() => (genre ? tracks.filter((t) => t.genre === genre) : tracks), [tracks, genre]);
  const results = useMemo(() => !term ? [] : inGenre.flatMap((t) => {
    const m = matchTrack(t, term, lyr[t.id] ?? []);
    if (m) return [{ t, line: m.kind === 'lyric' ? m.line : undefined }];
    return t.source === 'jamendo' && found.key === key && found.ids.has(t.id) ? [{ t, line: undefined }] : [];
  }), [term, inGenre, lyr, found, key]);

  const skyWeather = weatherFor(genre ?? results[0]?.t.genre ?? 'lofi');
  const submit = (e: React.FormEvent) => { e.preventDefault(); addRecentSearch(q); inputRef.current?.blur(); };
  const onKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { if (q) setQ(''); else inputRef.current?.blur(); } };
  const pickRecent = (t: string) => { setQ(t); inputRef.current?.focus(); };
  const counts = useMemo(() => Object.fromEntries(GENRES.map((g) => [g, tracks.filter((t) => t.genre === g).length])) as Record<Genre, number>, [tracks]);
  useEffect(() => { // dibuka dari menu = langsung siap mengetik; tujuan lain (genre/kata di URL) tidak dipaksa
    if (shouldAutofocus(new URLSearchParams(window.location.search))) inputRef.current?.focus();
  }, []);
  useEffect(() => { // klik menu Cari saat sudah di halaman ini
    const focus = () => inputRef.current?.focus();
    addEventListener(FOCUS_SEARCH_EVENT, focus);
    return () => removeEventListener(FOCUS_SEARCH_EVENT, focus);
  }, []);

  return (
    <div className="page search">
      <PageSky weather={skyWeather} title="Cari di langit" sub="Judul, artis, atau potongan lirik" />
      <div className="searchhead">
        <form role="search" onSubmit={submit}>
          <label className="wd-search"><Icon name="search" width={20} height={20} />
            <input ref={inputRef} type="search" enterKeyHint="search" autoComplete="off" aria-label="Cari lagu, artis, atau lirik" placeholder="Lagu, artis, atau potongan lirik" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} />
            {q && <button type="button" className="icon-btn search-clear" aria-label="Hapus pencarian" onClick={() => { setQ(''); inputRef.current?.focus(); }}><Icon name="close" width={18} height={18} /></button>}</label>
        </form>
        <div className="chips" role="group" aria-label="Filter genre">
          <Chip active={!genre} onClick={() => setGenre(null)}>Semua</Chip>
          {GENRES.map((g) => <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? null : g)}>{GENRE_LABEL[g]}</Chip>)}
        </div>
      </div>
      <OfflineNotice />
      <Loading status={status} />

      {status === 'ready' && !term && !genre && (
        <>
          {!!recent.length && (
            <section className="section" aria-labelledby="recent-h">
              <div className="section__head"><h2 id="recent-h">Pencarian terakhir</h2><button type="button" className="section__more" onClick={clearRecentSearches}>Hapus semua</button></div>
              <ul className="recent">{recent.map((t) => (
                <li key={t}><button type="button" className="recent__term" onClick={() => pickRecent(t)}><Icon name="search" width={16} height={16} />{t}</button>
                  <button type="button" className="recent__x" aria-label={`Hapus “${t}” dari pencarian terakhir`} onClick={() => removeRecentSearch(t)}><Icon name="close" width={14} height={14} /></button></li>))}</ul>
            </section>
          )}
          <section className="section" aria-labelledby="genre-h">
            <h2 id="genre-h">Jelajahi genre</h2>
            <div className="genre-grid">{GENRES.map((g) => (
              <button key={g} type="button" className="tile" data-genre={g} onClick={() => setGenre(g)}><SkyMini weather={weatherFor(g)} /><span className="tile__label" style={{ color: SKY[weatherFor(g)].ink }}>{GENRE_LABEL[g]}<small>{SKY[weatherFor(g)].title} · {counts[g]} lagu</small></span></button>))}</div>
          </section>
          <p className="search__hint"><Wada size={44} mood="sing" />Ingat liriknya, lupa judulnya? Ketik potongan liriknya di kolom atas.</p>
        </>
      )}

      {status === 'ready' && !term && genre && (
        <section className="section" aria-labelledby="browse-h">
          <div className="section__head">
            <h2 id="browse-h">{GENRE_LABEL[genre]} · {inGenre.length} lagu</h2>
            {!!inGenre.length && <button type="button" className="wd-btn wd-btn--accent search__playall" onClick={() => playTrack(inGenre[0].id, ids(inGenre))}><Icon name="play" />Putar semua</button>}
          </div>
          {inGenre.length ? <div className="list list--grid">{inGenre.map((t) => <SongRow key={t.id} track={t} queue={ids(inGenre)} />)}</div>
            : <Empty title="Belum ada lagu">Genre ini belum punya lagu.</Empty>}
        </section>
      )}

      {status === 'ready' && !!term && (
        <section className="section" aria-label="Hasil pencarian">
          <p className="caption" role="status" aria-live="polite">
            {remote === 'loading' && !results.length ? 'Mencari…' : `${results.length} hasil untuk “${q.trim()}”${genre ? ` di ${GENRE_LABEL[genre]}` : ''}`}
            {remote === 'loading' && !!results.length && ' · mencari di Jamendo…'}
            {remote === 'error' && ' · pencarian Jamendo gagal, hasil lokal tetap ditampilkan'}
          </p>
          {!!results.length && (
            <div className="list list--grid" onClickCapture={() => addRecentSearch(q)}>{results.map(({ t, line }) => (
              <div key={t.id}><SongRow track={t} queue={ids(results.map((r) => r.t))} highlight={q} />
                {line && <p className="snippet"><Icon name="mic" width={14} height={14} />“<Highlight text={line} term={q} />”</p>}</div>))}</div>
          )}
          {!results.length && remote !== 'loading' && (
            <div className="empty">
              <h2>Tidak ketemu</h2>
              <p>Tidak ada hasil untuk “{q.trim()}”{genre ? ` di ${GENRE_LABEL[genre]}` : ''}. Coba kata lain atau ejaan yang lebih pendek.</p>
              <div className="btn-row">
                {genre && <button type="button" className="wd-btn wd-btn--ghost" onClick={() => setGenre(null)}>Cari di semua genre</button>}
                <button type="button" className="wd-btn wd-btn--ghost" onClick={() => setQ('')}>Hapus pencarian</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
