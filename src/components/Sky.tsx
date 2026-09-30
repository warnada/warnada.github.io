import { memo, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { ARC, fraction, sunPoint, timeFromX, SKY, WEATHERS, type Weather } from '@/lib/sky';
import { formatTime } from '@/lib/format';
import { seek, usePlayer } from '@/audio/engine';
import { useTime } from '@/audio/hooks';

/** Warna langit sebagai variabel CSS; dibuat sekali per cuaca supaya objek gayanya stabil. */
const VARS = Object.fromEntries(WEATHERS.map((w) => {
  const p = SKY[w];
  return [w, { '--sk-top': p.top, '--sk-bot': p.bottom, '--sk-sun': p.sun, '--sk-cloud': p.cloud, '--sk-cloud2': p.cloud2, '--sk-h1': p.hills[0], '--sk-h2': p.hills[1], '--sk-h3': p.hills[2], '--sk-ink': p.ink } as CSSProperties];
})) as Record<Weather, CSSProperties>;

const Cloud = ({ x, y, s, cls }: { x: number; y: number; s: number; cls: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className={cls}>
    <circle cx="30" cy="34" r="16" /><circle cx="52" cy="24" r="22" /><circle cx="76" cy="32" r="17" /><rect x="18" y="32" width="72" height="20" rx="10" />
  </g>
);

/** Sampul lagu: langit mini statis (tanpa animasi, murah untuk daftar panjang). */
export const SkyMini = memo(function SkyMini({ weather }: { weather: Weather }) {
  return (
    <span className="sky-mini" style={VARS[weather]} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" focusable="false">
        <circle cx="70" cy="34" r="22" className="sk-sun" opacity=".3" />
        <circle cx="70" cy="34" r="13" className="sk-sun" />
        <Cloud x={4} y={14} s={0.55} cls="sk-cloud" />
        <Cloud x={46} y={36} s={0.4} cls="sk-cloud2" />
        <path d="M0 74 C22 62 40 84 62 72 S90 66 100 72 V100 H0Z" className="sk-h1" />
        <path d="M0 86 C26 76 44 94 70 84 S92 80 100 84 V100 H0Z" className="sk-h2" />
      </svg>
    </span>
  );
});

const VB_W = 400;
const HILL_Y = [0.76, 0.84, 0.92] as const;
const hillPath = (vbH: number, i: number) => {
  const y = vbH * HILL_Y[i], a = 16 + i * 3, ph = i * 0.13;
  return `M0 ${vbH} L0 ${y} C${VB_W * (0.2 + ph)} ${y - a} ${VB_W * (0.38 + ph)} ${y + a} ${VB_W * 0.6} ${y - a * 0.4} S${VB_W * 0.9} ${y + a * 0.6} ${VB_W} ${y - a * 0.3} L${VB_W} ${vbH} Z`;
};

const layerProps = (vbH: number) => ({ viewBox: `0 0 ${VB_W} ${vbH}`, preserveAspectRatio: 'xMidYMax slice', focusable: 'false' as const });
/** Lapisan busur selalu utuh (meet), berapa pun rasio layarnya: hanya bagian sekitar busur yang diambil dari viewBox. */
const ARC_PAD_TOP = 60, ARC_PAD_BOTTOM = 50;
const arcProps = (baseY: number) => ({ viewBox: `0 ${baseY - ARC.radius - ARC_PAD_TOP} ${VB_W} ${ARC.radius + ARC_PAD_TOP + ARC_PAD_BOTTOM}`, preserveAspectRatio: 'xMidYMin meet', focusable: 'false' as const });
const AURORA = ['#7CF0C6', '#F49AE0', '#8FC4FF'] as const;

/** Lapisan statis di belakang matahari: hanya pita aurora untuk langit malam. */
const BackLayer = memo(function BackLayer({ weather, vbH }: { weather: Weather; vbH: number }) {
  if (!SKY[weather].night) return null;
  const y0 = vbH * 0.2;
  return (
    <svg className="sky__layer" {...layerProps(vbH)} aria-hidden="true">
      {AURORA.map((c, i) => {
        const y = y0 + i * 34;
        return <path key={c} d={`M-20 ${y} C100 ${y - 40} 180 ${y + 46} 260 ${y - 6} S380 ${y - 30} 420 ${y + 10}`} fill="none" stroke={c} strokeWidth={26} strokeLinecap="round" opacity={0.3} />;
      })}
    </svg>
  );
});

/** Awan: satu elemen yang bergeser pelan (transformasi pada compositor, tanpa repaint). */
const CloudLayer = memo(function CloudLayer({ weather, vbH }: { weather: Weather; vbH: number }) {
  const rainy = weather === 'rain';
  return (
    <svg className="sky__layer sky__clouds" {...layerProps(vbH)} aria-hidden="true">
      <Cloud x={24} y={vbH * 0.1} s={1.25} cls="sk-cloud" />
      <Cloud x={250} y={vbH * 0.05} s={1} cls="sk-cloud2" />
      <Cloud x={292} y={vbH * 0.3} s={0.8} cls="sk-cloud" />
      <Cloud x={-14} y={vbH * 0.36} s={0.9} cls="sk-cloud2" />
      {rainy && <Cloud x={170} y={vbH * 0.44} s={0.7} cls="sk-cloud" />}
    </svg>
  );
});

const HillLayer = memo(function HillLayer({ vbH }: { vbH: number }) {
  return (
    <svg className="sky__layer" {...layerProps(vbH)} aria-hidden="true">
      <path d={hillPath(vbH, 0)} className="sk-h1" /><path d={hillPath(vbH, 1)} className="sk-h2" /><path d={hillPath(vbH, 2)} className="sk-h3" />
    </svg>
  );
});

interface Particle { x: number; y: number; d: number; dur: number; size: number }
const PARTICLES: Record<Weather, Particle[]> = Object.fromEntries(WEATHERS.map((w) => {
  const kind = SKY[w].particle;
  const n = kind === 'rain' ? 14 : kind === 'petal' ? 8 : kind === 'stars' ? (SKY[w].night ? 14 : 6) : 0;
  const list: Particle[] = Array.from({ length: n }, (_, i) => ({
    x: (i * 53 + 17) % 100, y: kind === 'stars' ? (i * 43 + 9) % (SKY[w].night ? 50 : 26) : (i * 29) % 60,
    d: -((i * 0.37) % 2.4), dur: kind === 'rain' ? 1.1 + (i % 5) * 0.12 : kind === 'petal' ? 5 + (i % 4) : 2.6 + (i % 3) * 0.5, size: kind === 'stars' ? (i % 3 ? 3 : 4) : kind === 'rain' ? 2 : 8
  }));
  return [w, list];
})) as Record<Weather, Particle[]>;

/** Hujan, kelopak, bintang: elemen HTML yang hanya beranimasi transform/opacity, jadi tidak memicu layout maupun paint. */
const Particles = memo(function Particles({ weather }: { weather: Weather }) {
  const kind = SKY[weather].particle;
  if (kind === 'none') return null;
  return (
    <div className={`sky__parts sky__parts--${kind}`} aria-hidden="true">
      {PARTICLES[weather].map((p, i) => <i key={i} style={{ '--x': `${p.x}%`, '--y': `${p.y}%`, '--d': `${p.d}s`, '--dur': `${p.dur}s`, '--s': `${p.size}px` } as CSSProperties} />)}
    </div>
  );
});

interface SunProps {
  weather: Weather; vbH: number; baseFrac: number; t: number; duration: number; arc: boolean;
  onScrub?: (seconds: number) => void;
}
const SEEK_STEP = 5;

/** Matahari (atau bulan) di busur langit. Bila onScrub ada, matahari bisa digeser (pointer) atau digerakkan dengan keyboard. */
const Sun = memo(function Sun({ weather, vbH, baseFrac, t, duration, arc, onScrub }: SunProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? t;
  const baseY = vbH * baseFrac;
  const p = sunPoint(shown, baseY);
  const night = SKY[weather].night;
  const arcD = `M${ARC.cx - ARC.radius} ${baseY} A${ARC.radius} ${ARC.radius} 0 0 1 ${ARC.cx + ARC.radius} ${baseY}`;
  const tFromEvent = (e: PointerEvent) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return shown;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return timeFromX(pt.x);
  };
  const down = (e: PointerEvent) => { if (!onScrub) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag(tFromEvent(e)); };
  const move = (e: PointerEvent) => { if (drag !== null) setDrag(tFromEvent(e)); };
  const up = (e: PointerEvent) => { if (drag === null) return; const v = tFromEvent(e); setDrag(null); onScrub?.(v * duration); };
  const key = (e: KeyboardEvent) => {
    if (!onScrub) return;
    const now = shown * duration;
    const to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? now + SEEK_STEP : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? now - SEEK_STEP : e.key === 'Home' ? 0 : e.key === 'End' ? duration : null;
    if (to === null) return;
    e.preventDefault(); e.stopPropagation();
    onScrub(Math.max(0, Math.min(duration, to)));
  };
  const label = `${formatTime(shown * duration)} dari ${formatTime(duration)}`;
  return (
    <svg ref={svg} className={`sky__layer ${arc ? 'sky__layer--arc' : ''} ${onScrub ? 'sky__layer--scrub' : ''}`} {...(arc ? arcProps(baseY) : layerProps(vbH))} aria-hidden={onScrub ? undefined : true}>
      {arc && <>
        <path d={arcD} className="sky__arc" pathLength={100} />
        <path d={arcD} className="sky__arc sky__arc--done" pathLength={100} style={{ strokeDasharray: `${(shown * 100).toFixed(2)} 100` }} />
        <circle cx={ARC.cx - ARC.radius} cy={baseY} r={6} className="sky__end" /><circle cx={ARC.cx + ARC.radius} cy={baseY} r={6} className="sky__end" />
        {duration > 0 && <text x={ARC.cx + ARC.radius} y={baseY + 28} textAnchor="middle" className="sky__endtext">{formatTime(duration)}</text>}
      </>}
      <g className="sky__slider" role={onScrub ? 'slider' : undefined} tabIndex={onScrub ? 0 : undefined} aria-label={onScrub ? 'Posisi lagu' : undefined}
        aria-valuemin={onScrub ? 0 : undefined} aria-valuemax={onScrub ? Math.round(duration) : undefined} aria-valuenow={onScrub ? Math.round(shown * duration) : undefined} aria-valuetext={onScrub ? label : undefined}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)} onKeyDown={key}>
        {onScrub && <path d={arcD} className="sky__hit" />}
        <g className="sky__sun" data-drag={drag !== null} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
          <circle r={52} className="sk-sun" opacity=".22" /><circle r={38} className="sk-sun" opacity=".35" /><circle r={26} className="sk-sun sky__body" />
          {night && <><circle cx={-8} cy={-6} r={5} fill="#DAD3F0" opacity=".7" /><circle cx={9} cy={8} r={3.5} fill="#DAD3F0" opacity=".7" /></>}
          {arc && duration > 0 && <g transform={`translate(${p.x > 260 ? -92 : 38} -13)`}><rect width="54" height="26" rx="13" className="sky__chip" /><text x="27" y="18" textAnchor="middle" className="sky__chiptext">{formatTime(shown * duration)}</text></g>}
        </g>
      </g>
    </svg>
  );
});

/** true selama elemen terlihat di layar; animasi dijeda saat tidak terlihat. */
function useOnScreen(ref: React.RefObject<Element | null>): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

export interface SkyProps {
  weather: Weather; vbH: number; baseFrac: number; t: number; duration: number;
  /** animasi berjalan (lagu diputar) */
  live: boolean; arc?: boolean; onScrub?: (seconds: number) => void; className?: string; children?: ReactNode;
}

/** Langit penuh: gradien, matahari + busur, awan, bukit, dan partikel cuaca. Hanya lapisan matahari yang diperbarui saat lagu berjalan. */
export function Sky({ weather, vbH, baseFrac, t, duration, live, arc = true, onScrub, className = '', children }: SkyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref);
  return (
    <div ref={ref} className={`sky ${className}`} style={VARS[weather]} data-weather={weather} data-live={live && visible}>
      <BackLayer weather={weather} vbH={vbH} />
      <Sun weather={weather} vbH={vbH} baseFrac={baseFrac} t={t} duration={duration} arc={arc} onScrub={onScrub} />
      <CloudLayer weather={weather} vbH={vbH} />
      <HillLayer vbH={vbH} />
      <Particles weather={weather} />
      {children}
    </div>
  );
}

/** Langit yang matahari-nya mengikuti lagu: posisi = waktu putar. Untuk lagu yang belum dimuat pemutar dipakai posisi cadangan. */
export function TimedSky({ trackId, duration, fallbackT = 0, interactive = false, ...rest }: Omit<SkyProps, 't' | 'live' | 'onScrub' | 'duration'> & { trackId: string; duration: number; fallbackT?: number; interactive?: boolean }) {
  const isCurrent = usePlayer((s) => s.currentId === trackId);
  const playing = usePlayer((s) => s.playing);
  const engineDuration = usePlayer((s) => s.duration);
  const time = useTime();
  const total = (isCurrent && engineDuration) || duration;
  const t = isCurrent ? fraction(time, total) : fallbackT;
  return <Sky {...rest} t={t} duration={total} live={isCurrent && playing} onScrub={interactive && isCurrent ? seek : undefined} />;
}
