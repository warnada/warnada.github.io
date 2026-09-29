import { describe, expect, it } from 'vitest';
import { RECENT_MAX, matchTrack, pushRecent, readGenre, splitHighlight } from './search';
import type { Track } from './types';

const track: Track = { id: 'a', title: 'Rinai Senja', artist: 'Sore Pelan', album: 'Hujan di Jendela', genre: 'jazz', duration: 1, audio: 'x', lyrics: null, size: 1, source: 'demo' };

describe('matchTrack', () => {
  it('cocok pada judul, artis, album (tanpa peduli huruf besar)', () => {
    expect(matchTrack(track, 'rinai', [])).toEqual({ kind: 'meta' });
    expect(matchTrack(track, 'PELAN', [])).toEqual({ kind: 'meta' });
    expect(matchTrack(track, 'hujan', [])).toEqual({ kind: 'meta' });
  });
  it('cocok pada nama genre', () => expect(matchTrack(track, 'jazz', [])).toEqual({ kind: 'meta' }));
  it('cocok pada lirik dan mengembalikan barisnya', () => {
    expect(matchTrack(track, 'kopi', ['Kopi hangat menemani'])).toEqual({ kind: 'lyric', line: 'Kopi hangat menemani' });
  });
  it('meta didahulukan dari lirik', () => expect(matchTrack(track, 'rinai', ['rinai turun'])).toEqual({ kind: 'meta' }));
  it('tidak cocok / kata kosong', () => {
    expect(matchTrack(track, 'zzz', ['abc'])).toBeNull();
    expect(matchTrack(track, '   ', [])).toBeNull();
  });
});

describe('pushRecent', () => {
  it('menaruh yang terbaru di depan dan membuang duplikat tanpa peduli huruf besar', () => {
    expect(pushRecent(['jazz', 'lofi'], 'Lofi')).toEqual(['Lofi', 'jazz']);
  });
  it('merapikan spasi dan mengabaikan kata terlalu pendek/panjang/kosong', () => {
    expect(pushRecent([], '  hujan   deras ')).toEqual(['hujan deras']);
    expect(pushRecent(['a1'], 'x')).toEqual(['a1']);
    expect(pushRecent(['a1'], '   ')).toEqual(['a1']);
    expect(pushRecent(['a1'], 'x'.repeat(61))).toEqual(['a1']);
  });
  it('dibatasi RECENT_MAX dan tidak mengubah array asli', () => {
    const many = Array.from({ length: RECENT_MAX + 3 }, (_, i) => `kata${i}`);
    const out = pushRecent(many, 'baru');
    expect(out).toHaveLength(RECENT_MAX);
    expect(out[0]).toBe('baru');
    expect(many).toHaveLength(RECENT_MAX + 3);
  });
});

describe('splitHighlight', () => {
  it('memecah teks menjadi bagian cocok dan tidak cocok (semua kemunculan, tanpa peduli huruf besar)', () => {
    expect(splitHighlight('Rinai turun, rinai reda', 'RINAI')).toEqual([
      { text: 'Rinai', hit: true }, { text: ' turun, ', hit: false }, { text: 'rinai', hit: true }, { text: ' reda', hit: false }
    ]);
  });
  it('kata kosong atau tidak ada = satu bagian tanpa sorotan', () => {
    expect(splitHighlight('abc', '')).toEqual([{ text: 'abc', hit: false }]);
    expect(splitHighlight('abc', 'zzz')).toEqual([{ text: 'abc', hit: false }]);
  });
  it('karakter khusus regex diperlakukan sebagai teks biasa', () => {
    expect(splitHighlight('a.b*c', '.b*')).toEqual([{ text: 'a', hit: false }, { text: '.b*', hit: true }, { text: 'c', hit: false }]);
  });
});

describe('readGenre', () => {
  it('hanya menerima genre yang dikenal', () => {
    expect(readGenre('jazz')).toBe('jazz');
    expect(readGenre('metal')).toBeNull();
    expect(readGenre('')).toBeNull();
    expect(readGenre(null)).toBeNull();
    expect(readGenre('<script>')).toBeNull();
  });
});
