import type { Genre } from './types';

/** Cuaca "Langit Wada": tiap suasana (genre) punya satu langit. */
export const WEATHERS = ['rain', 'sunny', 'sunset', 'dusk', 'aurora', 'meadow'] as const;
export type Weather = (typeof WEATHERS)[number];

export interface SkyPalette {
  label: string; title: string;
  top: string; bottom: string; sun: string; cloud: string; cloud2: string;
  hills: readonly [string, string, string];
  /** teks di atas langit (gelap untuk langit terang, terang untuk aurora) */
  ink: string;
  night: boolean;
  particle: 'rain' | 'petal' | 'stars' | 'none';
}

export const SKY: Record<Weather, SkyPalette> = {
  rain: { label: 'Hujan', title: 'Hujan senja', top: '#AEB9E3', bottom: '#E9DFF1', sun: '#FFF1CF', cloud: '#F4EFFC', cloud2: '#CBC7EA', hills: ['#A8ABD8', '#8E92C6', '#767CB2'], ink: '#2E2A55', night: false, particle: 'rain' },
  sunny: { label: 'Cerah', title: 'Cerah ceria', top: '#A9DCFA', bottom: '#FFF2D2', sun: '#FFCF5C', cloud: '#FFFFFF', cloud2: '#EAF6FF', hills: ['#B4E2B2', '#93D19E', '#72BD88'], ink: '#26485E', night: false, particle: 'none' },
  sunset: { label: 'Senja', title: 'Senja membara', top: '#FFA995', bottom: '#FFE3B5', sun: '#FF7F5E', cloud: '#FFD0BC', cloud2: '#FFF1DE', hills: ['#E8907F', '#CB6F6F', '#A85770'], ink: '#5A2A38', night: false, particle: 'none' },
  dusk: { label: 'Remang', title: 'Remang ungu', top: '#B99AD6', bottom: '#F8D7B4', sun: '#FFC985', cloud: '#E9D3EE', cloud2: '#FBEBDD', hills: ['#A585B4', '#876AA0', '#6C5688'], ink: '#3F2A57', night: false, particle: 'stars' },
  aurora: { label: 'Aurora', title: 'Langit aurora', top: '#262B5E', bottom: '#4E5498', sun: '#F6F3FF', cloud: '#5C63A8', cloud2: '#454C8C', hills: ['#38427A', '#2C3568', '#212956'], ink: '#F3F0FF', night: true, particle: 'stars' },
  meadow: { label: 'Padang', title: 'Padang pagi', top: '#C8ECD6', bottom: '#FFF3CE', sun: '#FFE07A', cloud: '#FFFFFF', cloud2: '#F0FAE9', hills: ['#BFE3A8', '#9CD08D', '#7BBB78'], ink: '#2D4A33', night: false, particle: 'petal' }
};

const GENRE_WEATHER: Record<Genre, Weather> = {
  lofi: 'rain', pop: 'sunny', rock: 'sunset', jazz: 'dusk', edm: 'aurora', dangdut: 'sunset', akustik: 'meadow', klasik: 'dusk'
};
export const weatherFor = (g: Genre): Weather => GENRE_WEATHER[g];

/** Geometri busur matahari dalam satuan viewBox (lebar 400). */
export const ARC = { cx: 200, radius: 150 } as const;

export interface Point { x: number; y: number }
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Posisi matahari untuk t (0 = awal lagu di kiri, 1 = akhir di kanan) pada busur berpangkal di `baseY`. */
export function sunPoint(t: number, baseY: number): Point {
  const a = Math.PI * clamp01(t);
  return { x: ARC.cx - ARC.radius * Math.cos(a), y: baseY - ARC.radius * Math.sin(a) };
}

/** Kebalikan sunPoint: dari posisi x (satuan viewBox) ke t. Di luar busur dijepit ke ujung. */
export function timeFromX(x: number): number {
  const c = Math.max(-1, Math.min(1, (ARC.cx - x) / ARC.radius));
  return Math.acos(c) / Math.PI;
}

/** t dari posisi waktu; aman untuk durasi 0. */
export const fraction = (time: number, duration: number): number => (duration > 0 ? clamp01(time / duration) : 0);
