import { describe, expect, it } from 'vitest';
import { HISTORY_MAX, pushHistory, sanitizeSession } from './history';

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
    expect(sanitizeSession({ history: ['a', 'b'], last: { id: 'a', position: 12.5 } })).toEqual({ history: ['a', 'b'], last: { id: 'a', position: 12.5 } });
  });
  it('membuang data rusak dari localStorage', () => {
    expect(sanitizeSession(null)).toEqual({ history: [], last: null });
    expect(sanitizeSession({ history: ['a', 5, '', 'a', {}], last: { id: 7, position: 'x' } })).toEqual({ history: ['a'], last: null });
    expect(sanitizeSession({ history: [], last: { id: 'a', position: -3 } }).last).toEqual({ id: 'a', position: 0 });
    expect(sanitizeSession({ history: [], last: { id: 'a', position: Infinity } }).last).toEqual({ id: 'a', position: 0 });
  });
});
