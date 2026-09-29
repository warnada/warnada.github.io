import { describe, expect, it } from 'vitest';
import { HISTORY_MAX, pushHistory, sanitizeSession, toggleId } from './history';

describe('pushHistory', () => {
  it('menaruh yang terbaru di depan dan membuang duplikat', () => {
    expect(pushHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    expect(pushHistory([], 'x')).toEqual(['x']);
  });
  it('dibatasi HISTORY_MAX', () => {
    const many = Array.from({ length: HISTORY_MAX + 5 }, (_, i) => `t${i}`);
    const out = pushHistory(many, 'baru');
    expect(out).toHaveLength(HISTORY_MAX);
    expect(out[0]).toBe('baru');
  });
  it('tidak mengubah array asli', () => {
    const src = ['a'];
    pushHistory(src, 'b');
    expect(src).toEqual(['a']);
  });
});

describe('sanitizeSession', () => {
  it('menerima data valid', () => {
    expect(sanitizeSession({ history: ['a', 'b'], last: { id: 'a', position: 12.5 } })).toEqual({ history: ['a', 'b'], favorites: [], last: { id: 'a', position: 12.5 } });
  });
  it('membuang data rusak dari localStorage', () => {
    expect(sanitizeSession(null)).toEqual({ history: [], favorites: [], last: null });
    expect(sanitizeSession({ history: ['a', 5, '', 'a', {}], last: { id: 7, position: 'x' } })).toEqual({ history: ['a'], favorites: [], last: null });
    expect(sanitizeSession({ history: [], last: { id: 'a', position: -3 } }).last).toEqual({ id: 'a', position: 0 });
    expect(sanitizeSession({ history: [], last: { id: 'a', position: Infinity } }).last).toEqual({ id: 'a', position: 0 });
  });
});

describe('toggleId (favorit)', () => {
  it('menambah ke depan bila belum ada, menghapus bila sudah ada', () => {
    expect(toggleId(['a'], 'b')).toEqual(['b', 'a']);
    expect(toggleId(['b', 'a'], 'b')).toEqual(['a']);
  });
  it('tidak mengubah array asli dan membatasi jumlah', () => {
    const src = ['a'];
    toggleId(src, 'b');
    expect(src).toEqual(['a']);
    expect(toggleId(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });
  it('sanitizeSession membersihkan favorit', () => {
    expect(sanitizeSession({ favorites: ['x', 'x', 3, 'y'] }).favorites).toEqual(['x', 'y']);
  });
});
