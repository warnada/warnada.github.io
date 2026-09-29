import type { SVGProps } from 'react';

const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  library: 'M4 4v16M9 4v16M14.5 5.5l4 14M14 4l5-1',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM5 11a7 7 0 0 0 14 0M12 18v3',
  queue: 'M3 6h13M3 12h13M3 18h9M18 15v6m-3-3h6',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6',
  wifioff: 'M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M15 10.4a10 10 0 0 1 4 2.5M12 20h.01',
  install: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 7v7m0 0-3-3m3 3 3-3M11 19h2',
  chevdown: 'M6 9l6 6 6-6',
  palette: 'M12 22a10 10 0 1 1 10-10c0 3-2 4-4 4h-2a2 2 0 0 0-1 3.7c.6.8.2 2.3-3 2.3zM7.5 11.5h.01M10.5 7.5h.01M15.5 8h.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  close: 'M6 6l12 12M18 6 6 18',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'
};
const FILLED: Record<string, string> = {
  heartfill: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  prev: 'M6 5h2.5v14H6zM20 5.6v12.8a.8.8 0 0 1-1.2.7l-9.5-6.4a.8.8 0 0 1 0-1.4l9.5-6.4a.8.8 0 0 1 1.2.7z',
  next: 'M15.5 5H18v14h-2.5zM4 5.6v12.8a.8.8 0 0 0 1.2.7l9.5-6.4a.8.8 0 0 0 0-1.4L5.2 4.9A.8.8 0 0 0 4 5.6z'
};

export type IconName = keyof typeof P | keyof typeof FILLED;
export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const filled = name in FILLED;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d={filled ? FILLED[name] : P[name]} />
    </svg>
  );
}
