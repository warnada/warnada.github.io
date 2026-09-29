import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useSettings } from '@/store/settings';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { currentTrack, usePlayer } from '@/audio/engine';
import { useOnline } from '@/audio/hooks';
import { LyricPanel, MiniPlayer, PlayerBar } from '@/components/Player';
import { Nav } from '@/components/parts';
import { Icon } from '@/components/Icon';
import { ThemeSheet, Toast, useInstall } from '@/components/Overlays';
import { Downloads, Explore, Home, Library, Search } from '@/pages/pages';

const PlayerPage = lazy(() => import('@/pages/PlayerPage'));

function useApplyTheme() {
  const { genre, theme, followGenre } = useSettings();
  const id = usePlayer((s) => s.currentId);
  useLibrary((s) => s.tracks);
  const active = followGenre && id ? currentTrack()?.genre ?? genre : genre;
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.genre = active; el.dataset.theme = theme;
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

function TopBar({ scrolled }: { scrolled: boolean }) {
  const { theme, set } = useSettings();
  const { canPrompt, install } = useInstall();
  const online = useOnline();
  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <Link to="/" className="topbar__brand"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />warnada</Link>
      {!online && <span className="overline" role="status"><Icon name="wifioff" width={16} height={16} style={{ verticalAlign: '-3px' }} /> Offline</span>}
      {canPrompt && <button type="button" className="wd-btn wd-btn--solid" onClick={install}><Icon name="install" />Pasang</button>}
      <Link to="/cari" className="wd-btn wd-btn--icon" aria-label="Cari"><Icon name="search" /></Link>
      <button type="button" className="wd-btn wd-btn--icon" aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'} onClick={() => set({ theme: theme === 'dark' ? 'light' : 'dark' })}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
      <button type="button" className="wd-btn wd-btn--icon" aria-label="Pilih suasana" onClick={() => useUi.setState({ themeSheet: true })}><Icon name="palette" /></button>
    </header>
  );
}

function Shell() {
  const hasTrack = usePlayer((s) => !!s.currentId);
  const { pathname } = useLocation();
  const sentinel = useRef<HTMLDivElement>(null);
  const scrolled = useScrolled(sentinel);
  useEffect(() => { document.querySelector('.shell__main')?.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="shell wd-stage">
      <Nav />
      <main className={`shell__main ${hasTrack ? '' : 'shell__main--nomini'}`}>
        <div ref={sentinel} className="topbar-sentinel" aria-hidden="true" />
        <TopBar scrolled={scrolled} />
        <Routes>
          <Route index element={<Home />} />
          <Route path="jelajah" element={<Explore />} />
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
  const load = useLibrary((s) => s.load);
  useEffect(() => { void load(); }, [load]);
  return (
    <>
      <Routes>
        <Route path="/putar" element={<Suspense fallback={null}><PlayerPage /></Suspense>} />
        <Route path="*" element={<Shell />} />
      </Routes>
      <ThemeSheet />
      <Toast />
    </>
  );
}
