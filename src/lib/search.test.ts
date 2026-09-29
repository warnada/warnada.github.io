import { describe, expect, it } from 'vitest';
import { matchTrack } from './search';
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
