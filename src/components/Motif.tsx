import type { ReactNode } from 'react';
import type { MotifName } from '@/lib/types';

const FILL = { fill: '#fff', fillOpacity: 0.92 } as const;
const STROKE = { fill: 'none', stroke: '#fff', strokeOpacity: 0.92, strokeLinecap: 'round' } as const;

const SHAPES: Record<MotifName, ReactNode> = {
  moon: <path d="M60 12 A40 40 0 1 0 88 62 A31 31 0 1 1 60 12Z" {...FILL} />,
  star: <polygon points="50,12 60,38 88,39 66,56 74,84 50,68 26,84 34,56 12,39 40,38" {...FILL} stroke="#fff" strokeOpacity={0.92} strokeWidth={7} strokeLinejoin="round" />,
  wave: <><path d="M8 44 Q29 18 50 44 T92 44" {...STROKE} strokeWidth={12} /><path d="M8 72 Q29 46 50 72 T92 72" {...STROKE} strokeWidth={12} strokeOpacity={0.6} /></>,
  note: <><circle cx="34" cy="72" r="15" {...FILL} /><rect x="43" y="16" width="11" height="58" rx="5.5" {...FILL} /><path d="M49 20 Q78 26 80 50" {...STROKE} strokeWidth={11} /></>,
  sun: <><circle cx="50" cy="50" r="21" {...FILL} /><path d="M50 8V20M50 80V92M8 50H20M80 50H92M20 20L28 28M72 72L80 80M80 20L72 28M20 80L28 72" {...STROKE} strokeWidth={8} /></>,
  leaf: <><path d="M16 80 C14 38 46 14 86 16 C88 54 64 86 16 80Z" {...FILL} /><path d="M22 76 C40 58 56 44 74 30" fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" /></>
};

/** Motif putih sederhana di atas sampul datar. */
export function Motif({ name, className }: { name: MotifName; className?: string }) {
  return <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">{SHAPES[name]}</svg>;
}
