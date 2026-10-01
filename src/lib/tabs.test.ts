import { describe, expect, it } from 'vitest';
import { neighborTab, tabIndex } from './tabs';

describe('tabs', () => {
  it('mengenali menu, termasuk garis miring penutup', () => {
    expect(tabIndex('/')).toBe(0);
    expect(tabIndex('/pustaka/')).toBe(2);
    expect(tabIndex('/putar')).toBe(-1);
  });
  it('tetangga sesuai urutan menu', () => {
    expect(neighborTab('/', 'next')).toBe('/cari');
    expect(neighborTab('/cari', 'prev')).toBe('/');
    expect(neighborTab('/pustaka', 'next')).toBe('/unduhan');
  });
  it('tidak melingkar di ujung dan null di luar menu', () => {
    expect(neighborTab('/', 'prev')).toBeNull();
    expect(neighborTab('/unduhan', 'next')).toBeNull();
    expect(neighborTab('/tidak-ada', 'next')).toBeNull();
  });
});

import { paneX, settleMs } from './tabs';

describe('paneX', () => {
  it('panel aktif di 0, tetangga satu langkah di kiri/kanan, semua ikut seretan', () => {
    expect(paneX(1, 1, 0, 430)).toBe(0);
    expect(paneX(2, 1, 0, 430)).toBe(430);
    expect(paneX(0, 1, -50, 430)).toBe(-480);
    expect(paneX(2, 1, -50, 430)).toBe(380);
  });
});

describe('settleMs', () => {
  it('dibatasi 170–320 ms', () => {
    expect(settleMs(400, 0)).toBe(320);
    expect(settleMs(20, 5)).toBe(170);
  });
  it('sentakan lebih cepat = lebih singkat', () => {
    expect(settleMs(300, 3)).toBeLessThan(settleMs(300, 0.5));
  });
});
