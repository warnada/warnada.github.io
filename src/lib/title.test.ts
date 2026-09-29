import { describe, expect, it } from 'vitest';
import { pageTitle } from './title';

describe('pageTitle', () => {
  it('judul per halaman', () => {
    expect(pageTitle('/', null)).toBe('Warnada · Musik dengan lirik tersinkron');
    expect(pageTitle('/pustaka', null)).toBe('Pustaka · Warnada');
    expect(pageTitle('/unduhan', null)).toBe('Unduhan · Warnada');
    expect(pageTitle('/cari', null)).toBe('Cari · Warnada');
    expect(pageTitle('/ngawur', null)).toBe('Halaman tidak ditemukan · Warnada');
  });
  it('saat memutar, judul tab menampilkan lagu', () => {
    expect(pageTitle('/pustaka', { title: 'Rinai Senja', artist: 'Sore Pelan', playing: true })).toBe('▶ Rinai Senja · Sore Pelan');
    expect(pageTitle('/pustaka', { title: 'Rinai Senja', artist: 'Sore Pelan', playing: false })).toBe('Pustaka · Warnada');
  });
});
