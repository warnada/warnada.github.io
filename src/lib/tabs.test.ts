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
