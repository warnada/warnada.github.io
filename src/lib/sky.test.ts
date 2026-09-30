import { describe, expect, it } from 'vitest';
import { ARC, fraction, sunPoint, timeFromX, WEATHERS, SKY, weatherFor } from './sky';
import { GENRES } from './types';

describe('sunPoint', () => {
  it('awal di kiri, tengah di puncak, akhir di kanan', () => {
    const a = sunPoint(0, 300), m = sunPoint(0.5, 300), z = sunPoint(1, 300);
    expect(a.x).toBeCloseTo(ARC.cx - ARC.radius); expect(a.y).toBeCloseTo(300);
    expect(m.x).toBeCloseTo(ARC.cx); expect(m.y).toBeCloseTo(300 - ARC.radius);
    expect(z.x).toBeCloseTo(ARC.cx + ARC.radius); expect(z.y).toBeCloseTo(300);
  });
  it('menjepit t di luar 0..1', () => {
    expect(sunPoint(-2, 100)).toEqual(sunPoint(0, 100));
    expect(sunPoint(9, 100)).toEqual(sunPoint(1, 100));
  });
});

describe('timeFromX', () => {
  it('membalik sunPoint', () => {
    for (const t of [0, 0.1, 0.37, 0.5, 0.92, 1]) expect(timeFromX(sunPoint(t, 0).x)).toBeCloseTo(t, 6);
  });
  it('menjepit di luar busur', () => {
    expect(timeFromX(-500)).toBe(0);
    expect(timeFromX(9999)).toBe(1);
  });
});

describe('fraction', () => {
  it('aman untuk durasi nol dan menjepit', () => {
    expect(fraction(5, 0)).toBe(0);
    expect(fraction(50, 100)).toBe(0.5);
    expect(fraction(500, 100)).toBe(1);
    expect(fraction(-1, 100)).toBe(0);
  });
});

describe('cuaca', () => {
  it('setiap genre punya cuaca yang terdaftar', () => {
    for (const g of GENRES) expect(WEATHERS).toContain(weatherFor(g));
    for (const w of WEATHERS) expect(SKY[w].hills).toHaveLength(3);
  });
});
