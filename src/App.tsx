import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '@/store/settings';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { currentTrack, next, prev, restoreLast, seekBy, toggle, usePlayer } from '@/audio/engine';
import { keyInfo, SEEK_STEP_SECONDS, shortcutFor } from '@/lib/shortcuts';
import { pageTitle } from '@/lib/title';
import { useOnline } from '@/audio/hooks';
import { LyricPanel, MiniPlayer, PlayerBar } from '@/components/Player';
import { Nav } from '@/components/parts';
import { Icon } from '@/components/Icon';
import { QueueSheet, ThemeSheet, Toast, useInstall } from '@/components/Overlays';
import { Downloads, Home, Library, Search } from '@/pages/pages';
import { readGenre } from '@/lib/search';
import { resolveAccent } from '@/lib/style';
import { neighborTab, tabIndex, type Dir } from '@/lib/tabs';
import { useAxisDrag } from '@/lib/useAxisDrag';

const PlayerPage = lazy(() => import('@/pages/PlayerPage'));

/** Jelajah digabung ke Cari. Tautan lama (/jelajah, /jelajah?g=jazz) tetap bekerja. */
function JelajahRedirect() {
  const [params] = useSearchParams();
  const genre = readGenre(params.get('g'));
  return <Navigate replace to={genre ? `/cari?genre=${genre}` : '/cari'} />;
}

function useApplyTheme() {
  const { accent, theme, followGenre } = useSettings();
  const id = usePlayer((s) => s.currentId);
  useLibrary((s) => s.tracks);
  const active = resolveAccent({ follow: followGenre, trackGenre: id ? currentTrack()?.genre : undefined, chosen: accent });
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.accent = active; el.dataset.theme = theme;
    const surface = getComputedStyle(el).getPropertyValue('--surface-base').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
  }, [active, theme]);
}

function useScrolled(sentinel: React.RefObject<HTMLElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinel]);
  return scrolled;
}

/** Pintasan keyboard global untuk pemutar (spasi, panah, N/P). */
function usePlayerShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = shortcutFor(keyInfo(e));
      if (!action || !usePlayer.getState().currentId) return;
      e.preventDefault();
      if (action === 'toggle') toggle();
      else if (action === 'next') next();
      else if (action === 'prev') prev();
      else seekBy(action === 'seek-forward' ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
}

/** Judul tab mengikuti halaman, dan lagu yang sedang diputar. */
function useDocumentTitle() {
  const { pathname } = useLocation();
  const id = usePlayer((s) => s.currentId);
  const playing = usePlayer((s) => s.playing);
  useLibrary((s) => s.tracks);
  const track = id ? currentTrack() : undefined;
  useEffect(() => {
    document.title = pageTitle(pathname, track ? { title: track.title, artist: track.artist, playing } : null);
  }, [pathname, track, playing]);
}

function TopBar({ scrolled }: { scrolled: boolean }) {
  const { theme, set } = useSettings();
  const { canPrompt, install } = useInstall();
  const online = useOnline();
  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <Link to="/" className="topbar__brand"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />warnada</Link>
      {!online && <span className="overline" role="status"><Icon name="wifioff" width={16} height={16} style={{ verticalAlign: '-3px' }} /> Offline</span>}
      {canPrompt && <button type="button" className="wd-btn wd-btn--solid" onClick={install}><Icon name="install" />Pasang</button>}
      <button type="button" className="wd-btn wd-btn--icon" aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'} onClick={() => set({ theme: theme === 'dark' ? 'light' : 'dark' })}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
      <button type="button" className="wd-btn wd-btn--icon" aria-label="Pilih warna aksen" onClick={() => useUi.setState({ themeSheet: true })}><Icon name="palette" /></button>
    </header>
  );
}

/** Area yang punya geser/gulir sendiri atau kontrol geser: geser antarmenu tidak dimulai dari sini. */
const TAB_SWIPE_BLOCKED = '.hscroll, .chips, .sky__slider, .full__lyrics, .sheet, .toast, input, textarea, select, [role="slider"]';
const TAB_OUT_MS = 190;
const TAB_ENTER_MS = 320;

/** Manipulasi DOM untuk animasi geser antarmenu. Sengaja di luar komponen: ini gaya sementara per-frame, bukan state React. */
const tabDom = {
  drag(el: HTMLElement, x: number, opacity: number) {
    el.dataset.swiping = 'true'; delete el.dataset.settle;
    el.style.setProperty('--tx', `${x.toFixed(1)}px`); el.style.setProperty('--to', opacity.toFixed(2));
  },
  settle(el: HTMLElement, x: number, opacity: number) {
    el.dataset.settle = 'true';
    el.style.setProperty('--tx', `${x.toFixed(1)}px`); el.style.setProperty('--to', opacity.toFixed(2));
  },
  clear(el: HTMLElement) {
    delete el.dataset.swiping; delete el.dataset.settle;
    el.style.removeProperty('--tx'); el.style.removeProperty('--to');
  },
  enter(el: HTMLElement, dir: Dir) { el.dataset.enter = dir; },
  leave(el: HTMLElement) { delete el.dataset.enter; }
};
const timerIds = new Set<number>();
function schedule(fn: () => void, ms: number) {
  const id = window.setTimeout(() => { timerIds.delete(id); fn(); }, ms);
  timerIds.add(id);
}
function cancelScheduled() { timerIds.forEach(clearTimeout); timerIds.clear(); }

/**
 * Geser kiri/kanan berpindah antarmenu (Beranda, Cari, Pustaka, Unduhan). Halaman mengikuti jari lewat CSS variable
 * (tanpa render ulang React), keluar ke sisi geser, lalu halaman baru masuk dari sisi lawan.
 */
function useTabSwipe(getMain: () => HTMLElement | null) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const busy = useRef(false);
  const pending = useRef<Dir | null>(null);
  useEffect(() => cancelScheduled, []);

  // halaman baru sudah terpasang (sebelum paint): buang keadaan seret dan mainkan animasi masuk
  useLayoutEffect(() => {
    const el = getMain();
    const dir = pending.current;
    if (!el || !dir) return;
    pending.current = null;
    tabDom.clear(el);
    tabDom.enter(el, dir);
    schedule(() => { tabDom.leave(el); busy.current = false; }, TAB_ENTER_MS);
  }, [pathname, getMain]);

  return useAxisDrag({
    axis: 'x',
    accepts: (t) => !busy.current && tabIndex(pathname) >= 0 && !t.closest(TAB_SWIPE_BLOCKED) && !useUi.getState().queueSheet && !useUi.getState().themeSheet,
    size: () => getMain()?.clientWidth ?? 360,
    onDrag: (d) => {
      const el = getMain();
      if (!el) return;
      const has = neighborTab(pathname, d < 0 ? 'next' : 'prev') !== null;
      const x = has ? d : d * 0.25; // di ujung menu: tertahan seperti karet
      tabDom.drag(el, x, has ? Math.max(0.4, 1 - Math.abs(x) / (el.clientWidth * 1.2)) : 1);
    },
    onEnd: (d, committed) => {
      const el = getMain();
      if (!el) return;
      const dir: Dir = d < 0 ? 'next' : 'prev';
      const target = neighborTab(pathname, dir);
      if (!committed || !target) { // kembali ke posisi
        tabDom.settle(el, 0, 1);
        schedule(() => { if (!pending.current) tabDom.clear(el); }, TAB_OUT_MS + 60);
        return;
      }
      busy.current = true;
      tabDom.settle(el, (dir === 'next' ? -1 : 1) * el.clientWidth, 0.2);
      schedule(() => { pending.current = dir; navigate(target, { state: { swipe: true } }); }, TAB_OUT_MS);
    }
  });
}

function Shell() {
  const hasTrack = usePlayer((s) => !!s.currentId);
  const { pathname } = useLocation();
  const sentinel = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const scrolled = useScrolled(sentinel);
  const getMain = useCallback(() => main.current, []);
  const swipe = useTabSwipe(getMain);
  useEffect(() => { document.querySelector('.shell__main')?.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="shell wd-stage">
      <a href="#konten" className="skip">Lewati ke konten</a>
      <Nav />
      <main ref={main} id="konten" tabIndex={-1} className={`shell__main ${hasTrack ? '' : 'shell__main--nomini'}`} {...swipe}>
        <div ref={sentinel} className="topbar-sentinel" aria-hidden="true" />
        <TopBar scrolled={scrolled} />
        <Routes>
          <Route index element={<Home />} />
          <Route path="jelajah" element={<JelajahRedirect />} />
          <Route path="pustaka" element={<Library />} />
          <Route path="unduhan" element={<Downloads />} />
          <Route path="cari" element={<Search />} />
          <Route path="*" element={<div className="page"><h1>Halaman tidak ditemukan</h1><Link to="/" className="wd-btn wd-btn--accent" style={{ alignSelf: 'flex-start' }}>Ke Beranda</Link></div>} />
        </Routes>
      </main>
      <LyricPanel />
      <PlayerBar />
      <MiniPlayer />
    </div>
  );
}

export default function App() {
  useApplyTheme();
  usePlayerShortcuts();
  useDocumentTitle();
  const load = useLibrary((s) => s.load);
  const tracks = useLibrary((s) => s.tracks);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { restoreLast(); }, [tracks]); // lanjutkan lagu terakhir begitu katalog tersedia
  return (
    <>
      <Routes>
        <Route path="/putar" element={<Suspense fallback={null}><PlayerPage /></Suspense>} />
        <Route path="*" element={<Shell />} />
      </Routes>
      <ThemeSheet />
      <QueueSheet />
      <Toast />
    </>
  );
}
