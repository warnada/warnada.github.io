import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '@/store/settings';
import { useLibrary } from '@/store/library';
import { toast, useUi } from '@/store/ui';
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
const TAB_SLIDE_MS = 320;
const TAB_EASE = 'cubic-bezier(.22,.8,.26,1)';
const TAB_SAFETY_MS = 1500;
const TAB_TRAVEL = 0.22; // jarak geser (fraksi lebar) selama transisi blur
const TAB_BLUR_PX = 4;
const TAB_BLUR_SHARE = 0.4; // blur hanya di 40% awal durasi: layer besar tidak di-blur sepanjang transisi
const TAB_SLOW_FRAME_MS = 32; // frame selama transisi yang dianggap patah
const TAB_VERY_SLOW_MS = 100;
const TAB_LATE_COMMIT_MS = 160; // halaman baru baru terpasang selama ini setelah jari dilepas = render terlalu berat untuk blur
const TAB_SLOW_LIMIT = 2; // sebanyak ini frame patah = turunkan ke mode tanpa blur

/**
 * Blur pada layer selebar layar mahal untuk GPU ponsel lemah. Dipakai bila pengguna mengizinkannya (Tampilan → Transisi blur),
 * perangkat terlihat mampu, dan tidak ada preferensi transparansi dikurangi; selain itu cukup geser + pudar (murah).
 */
function blurAllowed(): boolean {
  if (!useSettings.getState().blurTransition) return false;
  if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory ?? 8) > 3 && (navigator.hardwareConcurrency ?? 8) > 4;
}
function demoteBlur() {
  useSettings.getState().set({ blurTransition: false });
  toast('Transisi blur dimatikan otomatis agar tetap mulus. Bisa dinyalakan lagi di menu Tampilan.');
}

/** Pantau frame selama animasi; bila ada frame patah berulang di mode blur, turunkan ke mode murah untuk seterusnya. */
function watchFrames(anims: Animation[], blur: boolean) {
  if (!blur) return;
  let last: number | null = null, slow = 0, skip = 2, stop = false; // 2 frame pertama = biaya memasang halaman baru
  const tick = (now: number) => {
    if (stop) return;
    const dt = last === null ? 0 : now - last;
    if (dt > TAB_VERY_SLOW_MS) slow += TAB_SLOW_LIMIT; // satu frame sangat lambat sudah cukup (perangkat jelas tidak kuat)
    else if (skip > 0) skip--;
    else if (dt > TAB_SLOW_FRAME_MS) slow++;
    last = now;
    if (slow >= TAB_SLOW_LIMIT) { demoteBlur(); stop = true; return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  void Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => { stop = true; });
}

/** Manipulasi DOM untuk animasi geser antarmenu. Sengaja di luar komponen: ini gaya sementara per-frame, bukan state React. */
const tabDom = {
  /** data-busy menjeda animasi dekoratif (hujan, awan) selama geser supaya main thread dan compositor longgar. */
  drag(el: HTMLElement, x: number) {
    el.dataset.busy = 'true'; el.dataset.swiping = 'true'; delete el.dataset.settle;
    el.style.setProperty('--tx', `${x.toFixed(1)}px`);
  },
  settle(el: HTMLElement) {
    el.dataset.settle = 'true';
    el.style.setProperty('--tx', '0px');
  },
  clear(el: HTMLElement) {
    delete el.dataset.swiping; delete el.dataset.settle;
    el.style.removeProperty('--tx');
  },
  idle(el: HTMLElement) { tabDom.clear(el); delete el.dataset.busy; },
  page: (el: HTMLElement) => el.querySelector<HTMLElement>(':scope > .page:not(.page--ghost)'),
  /**
   * Salinan statis halaman lama tepat di posisi yang terlihat. Dibungkus kotak seukuran layar (terpotong) agar filter blur
   * hanya memproses area yang terlihat, bukan seluruh tinggi halaman. Kotak inilah yang dianimasikan.
   */
  ghost(el: HTMLElement): HTMLElement | null {
    const page = tabDom.page(el);
    if (!page) return null;
    const inner = page.cloneNode(true) as HTMLElement;
    inner.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    inner.removeAttribute('id');
    inner.classList.add('page--ghost');
    Object.assign(inner.style, { position: 'absolute', left: `${page.offsetLeft}px`, top: `${page.offsetTop - el.scrollTop}px`, width: `${page.offsetWidth}px`, margin: '0' });
    const wrap = document.createElement('div');
    wrap.className = 'page--ghost page-ghostwrap';
    wrap.setAttribute('aria-hidden', 'true'); wrap.inert = true;
    Object.assign(wrap.style, { position: 'absolute', left: '0', top: `${el.scrollTop}px`, width: `${el.clientWidth}px`, height: `${el.clientHeight}px`, overflow: 'hidden', pointerEvents: 'none' });
    wrap.appendChild(inner);
    el.appendChild(wrap);
    return wrap;
  },
  timing(): KeyframeAnimationOptions {
    return { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : TAB_SLIDE_MS, easing: TAB_EASE, fill: 'both' };
  },
  /** Halaman lama keluar SEGERA (compositor, tidak menunggu render halaman baru): bergeser sedikit, memudar, dan memburam. */
  out(ghost: HTMLElement, dir: Dir, fromX: number, width: number, blur: boolean): Animation {
    const sign = dir === 'next' ? 1 : -1;
    return ghost.animate([
      { transform: `translate3d(${fromX}px,0,0)`, opacity: 1, ...(blur && { filter: 'blur(0px)' }) },
      ...(blur ? [{ offset: TAB_BLUR_SHARE, opacity: 0.6, filter: `blur(${TAB_BLUR_PX}px)` }] : []),
      { transform: `translate3d(${fromX - sign * width * TAB_TRAVEL}px,0,0)`, opacity: 0, ...(blur && { filter: `blur(${TAB_BLUR_PX}px)` }) }
    ], tabDom.timing());
  },
  /** Halaman baru masuk dari sisi lawan: mulai buram dan transparan lalu menajam. Diselaraskan dengan waktu berjalan animasi keluar (jam dinding). */
  enter(page: HTMLElement, elapsedMs: number, dir: Dir, fromX: number, width: number, blur: boolean): Animation {
    const sign = dir === 'next' ? 1 : -1;
    const a = page.animate([
      { transform: `translate3d(${sign * width * TAB_TRAVEL + fromX}px,0,0)`, opacity: 0, ...(blur && { filter: `blur(${TAB_BLUR_PX}px)` }) },
      ...(blur ? [{ offset: TAB_BLUR_SHARE, opacity: 0.7, filter: 'blur(0px)' }] : []),
      { transform: 'translate3d(0,0,0)', opacity: 1, ...(blur && { filter: 'blur(0px)' }) }
    ], tabDom.timing());
    a.currentTime = elapsedMs;
    return a;
  }
};
const timerIds = new Set<number>();
function schedule(fn: () => void, ms: number) {
  const id = window.setTimeout(() => { timerIds.delete(id); fn(); }, ms);
  timerIds.add(id);
}
function cancelScheduled() { timerIds.forEach(clearTimeout); timerIds.clear(); }

interface PendingSlide { dir: Dir; fromX: number; ghost: HTMLElement | null; out: Animation | null; width: number; startedAt: number; blur: boolean }

/**
 * Geser kiri/kanan berpindah antarmenu (Beranda, Cari, Pustaka, Unduhan). Halaman mengikuti jari lewat CSS variable
 * (tanpa render ulang React). Saat dilepas, halaman lama disalin (ghost) dan langsung meluncur keluar di compositor,
 * tanpa menunggu halaman baru dirender; halaman baru masuk begitu terpasang, disinkronkan ke garis waktu yang sama.
 * Animasi dekoratif dijeda selama geser agar mulus di perangkat yang lebih lemah.
 */
function useTabSwipe(getMain: () => HTMLElement | null) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const busy = useRef(false);
  const pending = useRef<PendingSlide | null>(null);
  useEffect(() => cancelScheduled, []);

  const finish = (el: HTMLElement, ghost: HTMLElement | null, anims: Animation[]) => {
    ghost?.remove(); anims.forEach((a) => a.cancel());
    tabDom.idle(el); busy.current = false;
  };

  // halaman baru sudah terpasang (sebelum paint): masukkan, selaras dengan animasi keluar
  useLayoutEffect(() => {
    const el = getMain();
    const p = pending.current;
    if (!el || !p) return;
    pending.current = null;
    const fresh = tabDom.page(el);
    el.scrollTop = 0; // halaman baru selalu mulai dari atas; ghost sudah membawa posisi gulir lama
    if (p.ghost) p.ghost.style.top = '0px'; // ghost tetap di layar walau isi gulir kembali ke atas
    const anims = [p.out, fresh ? tabDom.enter(fresh, performance.now() - p.startedAt, p.dir, p.fromX, p.width, p.blur) : null].filter((a): a is Animation => !!a);
    if (!anims.length) { finish(el, p.ghost, []); return; }
    if (p.blur && performance.now() - p.startedAt > TAB_LATE_COMMIT_MS) demoteBlur();
    else watchFrames(anims, p.blur);
    void Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => finish(el, p.ghost, anims));
  }, [pathname, getMain]);

  return useAxisDrag({
    axis: 'x',
    accepts: (t) => !busy.current && tabIndex(pathname) >= 0 && !t.closest(TAB_SWIPE_BLOCKED) && !useUi.getState().queueSheet && !useUi.getState().themeSheet,
    size: () => getMain()?.clientWidth ?? 360,
    onDrag: (d) => {
      const el = getMain();
      if (!el) return;
      const has = neighborTab(pathname, d < 0 ? 'next' : 'prev') !== null;
      tabDom.drag(el, has ? d : d * 0.25); // di ujung menu: tertahan seperti karet
    },
    onEnd: (d, committed) => {
      const el = getMain();
      if (!el) return;
      const dir: Dir = d < 0 ? 'next' : 'prev';
      const target = neighborTab(pathname, dir);
      if (!committed || !target) { // kembali ke posisi
        tabDom.settle(el);
        schedule(() => tabDom.idle(el), 260);
        return;
      }
      busy.current = true;
      const width = el.clientWidth;
      const fromX = parseFloat(el.style.getPropertyValue('--tx')) || 0;
      const ghost = tabDom.ghost(el);
      tabDom.clear(el);
      const blur = blurAllowed();
      const out = ghost ? tabDom.out(ghost, dir, fromX, width, blur) : null;
      pending.current = { dir, fromX, ghost, out, width, startedAt: performance.now(), blur };
      navigate(target, { state: { swipe: true } });
      schedule(() => { // pengaman: navigasi tidak terjadi
        const p = pending.current;
        if (p) { pending.current = null; finish(el, p.ghost, p.out ? [p.out] : []); }
      }, TAB_SAFETY_MS);
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
