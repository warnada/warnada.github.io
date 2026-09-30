import { describe, expect, it } from 'vitest';
import { CatalogError, parseCatalog, sanitizeSettings } from './validate';

const ok = { id: 'x', title: 'T', artist: 'A', album: 'B', genre: 'pop', duration: 10, audio: 'audio/x.mp3', lyrics: 'lyrics/x.lrc', size: 100 };

describe('parseCatalog', () => {
  it('menerima katalog valid', () => expect(parseCatalog({ tracks: [ok] })).toEqual([{ ...ok, source: 'demo' }]));
  it('menolak bentuk yang salah', () => {
    expect(() => parseCatalog(null)).toThrow(CatalogError);
    expect(() => parseCatalog({ tracks: 'x' })).toThrow(CatalogError);
    expect(() => parseCatalog({ tracks: [{ ...ok, genre: 'metal' }] })).toThrow(CatalogError);
    expect(() => parseCatalog({ tracks: [{ ...ok, duration: -1 }] })).toThrow(CatalogError);
  });
  it('menolak path yang keluar dari origin atau berskema', () => {
    for (const bad of ['https://evil.test/a.mp3', '//evil.test/a.mp3', '../a.mp3', '/abs.mp3', 'javascript:1', 'audio\\x.mp3'])
      expect(() => parseCatalog({ tracks: [{ ...ok, audio: bad }] })).toThrow(CatalogError);
  });
  it('menolak id ganda', () => expect(() => parseCatalog({ tracks: [ok, ok] })).toThrow(CatalogError));
});

describe('sanitizeSettings', () => {
  const def = { accent: 'lilac', theme: 'dark', followGenre: true, offlineMode: false, bannerDismissed: false } as const;
  it('membuang nilai tak valid dan mempertahankan yang valid', () => {
    expect(sanitizeSettings({ accent: '"><script>', theme: 'neon', followGenre: 'ya', offlineMode: true }, def)).toEqual({ ...def, offlineMode: true });
    expect(sanitizeSettings({ accent: 'sage', theme: 'light' }, def)).toEqual({ ...def, accent: 'sage', theme: 'light' });
  });
  it('tahan terhadap input bukan objek', () => expect(sanitizeSettings(42, def)).toEqual(def));
});

describe('sanitizeSettings: data lama', () => {
  const def = { accent: 'lilac', theme: 'dark', followGenre: true, offlineMode: false, bannerDismissed: false } as const;
  it('mengabaikan field genre lama tanpa merusak pengaturan lain', () => {
    expect(sanitizeSettings({ genre: 'jazz', theme: 'light', offlineMode: true }, def)).toEqual({ ...def, theme: 'light', offlineMode: true });
  });
});
