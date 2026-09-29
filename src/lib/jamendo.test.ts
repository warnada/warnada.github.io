import { describe, expect, it } from 'vitest';
import { GENRE_TAGS, buildTracksUrl, isCommercialLicense, isTrustedMediaUrl, parseJamendoTracks, parseLicensePolicy } from './jamendo';

// Fixture mengikuti skema publik Jamendo API v3.0 (results[].audio, license_ccurl, dst.).
// CATATAN: belum diverifikasi terhadap respons langsung; jalankan `npm run check:jamendo` dengan koneksi internet.
const item = (over: Record<string, unknown> = {}) => ({
  id: '1234', name: 'Lagu A', duration: 201, artist_name: 'Artis A', album_name: 'Album A',
  audio: 'https://prod-1.storage.jamendo.com/?trackid=1234&format=mp32', audiodownload_allowed: true,
  image: 'https://usercontent.jamendo.com/?type=album&id=1&width=300', shareurl: 'https://www.jamendo.com/track/1234',
  license_ccurl: 'https://creativecommons.org/licenses/by/3.0/', ...over
});
const ok = (results: unknown[]) => ({ headers: { status: 'success', code: 0 }, results });

describe('isCommercialLicense', () => {
  it('menolak NC dan menerima BY / BY-SA', () => {
    expect(isCommercialLicense('https://creativecommons.org/licenses/by/3.0/')).toBe(true);
    expect(isCommercialLicense('http://creativecommons.org/licenses/by-sa/4.0/')).toBe(true);
    expect(isCommercialLicense('https://creativecommons.org/licenses/by-nc-sa/3.0/')).toBe(false);
    expect(isCommercialLicense('https://creativecommons.org/licenses/by-nc-nd/3.0/')).toBe(false);
  });
  it('lisensi kosong/aneh dianggap tidak aman', () => {
    expect(isCommercialLicense('')).toBe(false);
    expect(isCommercialLicense(undefined)).toBe(false);
    expect(isCommercialLicense('https://evil.test/licenses/by/')).toBe(false);
  });
});

describe('isTrustedMediaUrl', () => {
  it('hanya https ke domain Jamendo', () => {
    expect(isTrustedMediaUrl('https://prod-1.storage.jamendo.com/x')).toBe(true);
    expect(isTrustedMediaUrl('http://prod-1.storage.jamendo.com/x')).toBe(false);
    expect(isTrustedMediaUrl('https://jamendo.com.evil.test/x')).toBe(false);
    expect(isTrustedMediaUrl('https://evil.test/jamendo.com')).toBe(false);
    expect(isTrustedMediaUrl('javascript:alert(1)')).toBe(false);
    expect(isTrustedMediaUrl('not a url')).toBe(false);
  });
});

describe('parseJamendoTracks', () => {
  it('memetakan bidang ke Track dengan id berprefiks dan atribusi', () => {
    const [t] = parseJamendoTracks(ok([item()]), { genre: 'jazz', policy: 'commercial' });
    expect(t).toMatchObject({ id: 'jm-1234', title: 'Lagu A', artist: 'Artis A', album: 'Album A', genre: 'jazz', duration: 201, source: 'jamendo', lyrics: null });
    expect(t.license).toEqual({ label: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/' });
    expect(t.audio).toMatch(/^https:\/\/prod-1\.storage\.jamendo\.com/);
  });
  it('policy commercial membuang lagu NC; policy all mempertahankannya', () => {
    const nc = item({ id: '9', license_ccurl: 'https://creativecommons.org/licenses/by-nc-nd/3.0/' });
    expect(parseJamendoTracks(ok([nc]), { genre: 'pop', policy: 'commercial' })).toHaveLength(0);
    expect(parseJamendoTracks(ok([nc]), { genre: 'pop', policy: 'all' })).toHaveLength(1);
  });
  it('melewati entri rusak/berbahaya tanpa gagal total', () => {
    const results = [item(), item({ id: '2', audio: 'https://evil.test/a.mp3' }), item({ id: '3', duration: 'x' }), null, item({ id: '4', image: 'javascript:1' }), item({ id: '5', name: '' })];
    const out = parseJamendoTracks(ok(results), { genre: 'pop', policy: 'all' });
    expect(out.map((t) => t.id)).toEqual(['jm-1234', 'jm-4']);
    expect(out[1].artwork).toBeUndefined();
  });
  it('melempar untuk respons gagal atau bentuk salah', () => {
    expect(() => parseJamendoTracks({ headers: { status: 'failed', error_message: 'x' }, results: [] }, { genre: 'pop', policy: 'all' })).toThrow();
    expect(() => parseJamendoTracks('x', { genre: 'pop', policy: 'all' })).toThrow();
  });
  it('audiodownload_allowed=false menandai lagu tidak boleh diunduh', () => {
    const [t] = parseJamendoTracks(ok([item({ audiodownload_allowed: false })]), { genre: 'pop', policy: 'all' });
    expect(t.downloadable).toBe(false);
  });
});

describe('buildTracksUrl', () => {
  it('meng-encode parameter dan menyertakan client_id', () => {
    const u = new URL(buildTracksUrl('abc123', { tags: 'lofi', search: 'a&b=c #x', limit: 10, offset: 20 }));
    expect(u.origin + u.pathname).toBe('https://api.jamendo.com/v3.0/tracks/');
    expect(u.searchParams.get('client_id')).toBe('abc123');
    expect(u.searchParams.get('search')).toBe('a&b=c #x');
    expect(u.searchParams.get('tags')).toBe('lofi');
    expect(u.searchParams.get('limit')).toBe('10');
    expect(u.searchParams.get('audioformat')).toBe('mp32');
    expect(u.searchParams.get('format')).toBe('json');
  });
  it('membatasi limit', () => expect(new URL(buildTracksUrl('x', { limit: 9999 })).searchParams.get('limit')).toBe('50'));
});

describe('GENRE_TAGS', () => it('mencakup semua genre aplikasi', () => {
  expect(Object.keys(GENRE_TAGS).sort()).toEqual(['akustik', 'dangdut', 'edm', 'jazz', 'klasik', 'lofi', 'pop', 'rock']);
}));

describe('parseLicensePolicy', () => {
  it('bawaan all (Warnada non-komersial); commercial hanya bila diminta eksplisit', () => {
    expect(parseLicensePolicy(undefined)).toBe('all');
    expect(parseLicensePolicy('')).toBe('all');
    expect(parseLicensePolicy('ngawur')).toBe('all');
    expect(parseLicensePolicy('all')).toBe('all');
    expect(parseLicensePolicy('commercial')).toBe('commercial');
  });
});
