import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Downloads, Home, Library, Search } from '@/pages/pages';
import { paneX, settleMs, TAB_PATHS } from '@/lib/tabs';
import { useAxisDrag } from '@/lib/useAxisDrag';
import { useSettings } from '@/store/settings';
import { useUi } from '@/store/ui';

/** Area yang punya geser/gulir sendiri atau kontrol geser: geser antarmenu tidak dimulai dari sini. */
const SWIPE_BLOCKED = '.hscroll, .chips, .sky__slider, .full__lyrics, .sheet, .toast, input, textarea, select, [role="slider"]';
const EASE = 'cubic-bezier(.25,.9,.3,1)';
const RUBBER = 0.25; // di ujung menu, panel hanya ikut seperempat seretan
const BLUR_PX = 4;
const SAFETY_MS = 1500;

/** Blur opsional (Tampilan → Transisi blur), hanya di perangkat yang tampak mampu. Bawaan mati: geser biasa paling mulus di HP. */
function blurAllowed(): boolean {
  if (!useSettings.getState().blurTransition) return false;
  if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory ?? 8) > 3 && (navigator.hardwareConcurrency ?? 8) > 4;
}

interface Session {
  main: HTMLElement;
  /** posisi gulir saat geser dimulai: panel tetangga ditampilkan dari atas, tepat di bawah bilah atas */
  scrollTop: number;
  step: number;
  panes: (HTMLElement | null)[];
  x: number;
  blur: boolean;
  anims: Animation[];
}

/** Penulisan gaya sementara per frame (bukan state React): hanya transform/opacity/filter pada 2–3 panel. */
const paneDom = {
  place(el: HTMLElement, x: number, y: number) { el.style.transform = `translate3d(${x.toFixed(1)}px,${y}px,0)`; },
  show(el: HTMLElement) { el.style.opacity = '1'; },
  blur(el: HTMLElement, px: number) { el.style.filter = px > 0.05 ? `blur(${px.toFixed(2)}px)` : ''; },
  reset(el: HTMLElement) { el.style.transform = ''; el.style.opacity = ''; el.style.filter = ''; }
};

// memo: saat panel aktif berganti, halaman yang tidak terlibat tidak dirender ulang
const HomeTab = memo(Home);
const SearchTab = memo(Search);
const LibraryTab = memo(Library);
const DownloadsTab = memo(Downloads);

function renderTab(i: number, active: boolean): ReactNode {
  if (i === 0) return <HomeTab />;
  if (i === 1) return <SearchTab active={active} />;
  if (i === 2) return <LibraryTab />;
  return <DownloadsTab />;
}

/**
 * Menu utama sebagai carousel: keempat halaman tetap terpasang berdampingan, hanya yang aktif ikut alur dokumen.
 * Geser kiri/kanan hanya mengubah transform 2–3 panel yang sudah dirender (compositor), jadi tidak ada render React,
 * salinan halaman, atau layout selama jari bergerak maupun selama animasi. URL baru ditulis setelah animasi selesai,
 * saat layar diam, sehingga pekerjaan berat (pertukaran panel aktif) tidak pernah terjadi di tengah gerakan.
 */
export function TabPager({ index }: { index: number }) {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const panes = useRef<(HTMLDivElement | null)[]>([]);
  const session = useRef<Session | null>(null);
  const pending = useRef<number | null>(null);
  const busy = useRef(false);
  const [all, setAll] = useState(false);

  // halaman lain dipasang saat senggang supaya muatan awal tetap ringan
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setAll(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setAll(true), 600);
    return () => clearTimeout(t);
  }, []);

  // tinggi area terlihat untuk panel tetangga (dipotong setinggi layar agar tidak menambah panjang gulir)
  useEffect(() => {
    const el = root.current;
    const main = el?.closest<HTMLElement>('.shell__main');
    if (!el || !main) return;
    const ro = new ResizeObserver(() => el.style.setProperty('--pane-h', `${main.clientHeight}px`));
    ro.observe(main);
    return () => ro.disconnect();
  }, []);

  const end = () => {
    const ses = session.current;
    session.current = null;
    if (ses) { ses.anims.forEach((a) => a.cancel()); ses.panes.forEach((p) => p && paneDom.reset(p)); }
    busy.current = false;
  };

  // panel aktif sudah berganti (geser atau ketuk menu): buang gaya sementara pada frame yang sama, sebelum paint
  useLayoutEffect(() => {
    const ses = session.current;
    if (ses && pending.current === index) ses.main.scrollTop = 0;
    pending.current = null;
    end();
  }, [index]);
  useEffect(() => end, []);

  const begin = (): Session | null => {
    const el = root.current;
    const main = el?.closest<HTMLElement>('.shell__main');
    const cur = panes.current[index];
    if (!el || !main || !cur) return null;
    const pad = parseFloat(getComputedStyle(main).paddingLeft) || 0;
    const ses: Session = { main, scrollTop: main.scrollTop, step: cur.offsetWidth + pad * 2, panes: [...panes.current], x: 0, blur: blurAllowed(), anims: [] };
    for (const i of [index - 1, index + 1]) { const p = ses.panes[i]; if (p) paneDom.show(p); }
    return ses;
  };

  const lay = (ses: Session, x: number) => {
    ses.x = x;
    for (let i = index - 1; i <= index + 1; i++) {
      const p = ses.panes[i];
      if (!p) continue;
      paneDom.place(p, paneX(i, index, x, ses.step), i === index ? 0 : ses.scrollTop);
      if (ses.blur && i !== index) paneDom.blur(p, BLUR_PX * (1 - Math.min(1, Math.abs(x) / ses.step)));
    }
  };

  /** Lanjutkan dari posisi jari ke posisi akhir di compositor (WAAPI), lalu panggil done. */
  const settle = (ses: Session, toX: number, velocity: number, done: () => void) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timing: KeyframeAnimationOptions = { duration: reduce ? 1 : settleMs(toX - ses.x, velocity), easing: EASE, fill: 'forwards' };
    for (let i = index - 1; i <= index + 1; i++) {
      const p = ses.panes[i];
      if (!p) continue;
      const y = i === index ? 0 : ses.scrollTop;
      const from: Keyframe = { transform: `translate3d(${paneX(i, index, ses.x, ses.step)}px,${y}px,0)` };
      const to: Keyframe = { transform: `translate3d(${paneX(i, index, toX, ses.step)}px,${y}px,0)` };
      if (ses.blur && i !== index) {
        from.filter = `blur(${(BLUR_PX * (1 - Math.min(1, Math.abs(ses.x) / ses.step))).toFixed(2)}px)`;
        to.filter = `blur(${(BLUR_PX * (1 - Math.min(1, Math.abs(toX) / ses.step))).toFixed(2)}px)`;
      }
      ses.anims.push(p.animate([from, to], timing));
    }
    void Promise.all(ses.anims.map((a) => a.finished.catch(() => undefined))).then(done);
  };

  const drag = useAxisDrag({
        axis: 'x',
        accepts: (t) => !busy.current && !t.closest(SWIPE_BLOCKED) && !useUi.getState().queueSheet && !useUi.getState().themeSheet,
        size: () => root.current?.clientWidth ?? 360,
        onDrag: (d) => {
          const ses = session.current ?? (session.current = begin());
          if (!ses) return;
          const target = index + (d < 0 ? 1 : -1);
          lay(ses, ses.panes[target] ? d : d * RUBBER);
        },
        onEnd: (d, committed, velocity) => {
          const ses = session.current ?? (session.current = begin());
          if (!ses) return;
          const target = index + (d < 0 ? 1 : -1);
          busy.current = true;
          if (!committed || !ses.panes[target]) { settle(ses, 0, velocity, end); return; }
          settle(ses, (index - target) * ses.step, velocity, () => {
            pending.current = target;
            navigate(TAB_PATHS[target]);
            window.setTimeout(() => { if (pending.current === target) { pending.current = null; end(); } }, SAFETY_MS); // pengaman bila navigasi batal
          });
        }
  });

  return (
    <div ref={root} className="pager" {...drag}>
      {TAB_PATHS.map((path, i) => (all || i === index) && (
        <div key={path} ref={(n) => { panes.current[i] = n; }} className={`pane${i === index ? ' is-active' : ''}`} inert={i !== index} aria-hidden={i !== index || undefined}>
          {renderTab(i, i === index)}
        </div>
      ))}
    </div>
  );
}
