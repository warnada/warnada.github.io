import { describe, expect, it } from 'vitest';
import { pickNext, removeFromQueue } from './queue';

const base = { queue: ['a', 'b', 'c'], currentId: 'b', shuffle: false, repeat: 'off' as const, auto: false, isPlayable: () => true, random: () => 0 };

describe('pickNext', () => {
  it('maju dan mundur secara melingkar', () => {
    expect(pickNext({ ...base }, 1)).toEqual({ type: 'play', id: 'c' });
    expect(pickNext({ ...base, currentId: 'c' }, 1)).toEqual({ type: 'play', id: 'a' });
    expect(pickNext({ ...base, currentId: 'a' }, -1)).toEqual({ type: 'play', id: 'c' });
  });
  it('melewati lagu yang tidak bisa diputar (mode offline)', () => {
    expect(pickNext({ ...base, isPlayable: (id) => id !== 'c' }, 1)).toEqual({ type: 'play', id: 'a' });
  });
  it('berhenti bila tidak ada yang bisa diputar atau antrean kosong', () => {
    expect(pickNext({ ...base, isPlayable: () => false }, 1)).toEqual({ type: 'stop' });
    expect(pickNext({ ...base, queue: [] }, 1)).toEqual({ type: 'stop' });
  });
  it('lagu selesai: repeat one mengulang, repeat off berhenti di akhir, repeat all kembali ke awal', () => {
    expect(pickNext({ ...base, auto: true, repeat: 'one' }, 1)).toEqual({ type: 'restart' });
    expect(pickNext({ ...base, auto: true, currentId: 'c' }, 1)).toEqual({ type: 'stop' });
    expect(pickNext({ ...base, auto: true, currentId: 'c', repeat: 'all' }, 1)).toEqual({ type: 'play', id: 'a' });
  });
  it('acak tidak memilih lagu yang sedang diputar', () => {
    for (const r of [0, 0.4, 0.99]) {
      const res = pickNext({ ...base, shuffle: true, random: () => r }, 1);
      expect(res).toMatchObject({ type: 'play' });
      expect((res as { id: string }).id).not.toBe('b');
    }
  });
});

describe('removeFromQueue', () => {
  it('menghapus item selain lagu yang sedang diputar', () => {
    expect(removeFromQueue(['a', 'b', 'c'], 'b', 'c')).toEqual(['a', 'b']);
  });
  it('lagu yang sedang diputar tidak bisa dihapus', () => {
    const q = ['a', 'b'];
    expect(removeFromQueue(q, 'a', 'a')).toBe(q);
  });
  it('id yang tidak ada mengembalikan array yang sama', () => {
    const q = ['a'];
    expect(removeFromQueue(q, 'a', 'zzz')).toBe(q);
  });
});
