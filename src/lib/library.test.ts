import { describe, expect, it } from 'vitest';
import { mergeTracks } from './library';
import type { Track } from './types';

const t = (id: string, source: Track['source'] = 'demo'): Track => ({ id, title: id, artist: 'a', album: 'b', genre: 'pop', duration: 1, audio: 'audio/x.mp3', lyrics: null, size: 1, source });

describe('mergeTracks', () => {
  it('menambah yang baru, mempertahankan urutan, dan membuang duplikat id', () => {
    const out = mergeTracks([t('a'), t('b')], [t('b', 'jamendo'), t('c', 'jamendo')]);
    expect(out.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(out[1].source).toBe('demo');
  });
  it('mengembalikan array yang sama bila tidak ada yang baru (hindari render ulang)', () => {
    const base = [t('a')];
    expect(mergeTracks(base, [t('a')])).toBe(base);
  });
});
