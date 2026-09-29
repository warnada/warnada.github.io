import { describe, expect, it } from 'vitest';
import { shortcutFor, type KeyInfo } from './shortcuts';

const k = (key: string, over: Partial<KeyInfo> = {}): KeyInfo => ({ key, tag: 'BODY', inputType: '', editable: false, ctrl: false, meta: false, alt: false, ...over });

describe('shortcutFor', () => {
  it('memetakan tombol ke aksi pemutar', () => {
    expect(shortcutFor(k(' '))).toBe('toggle');
    expect(shortcutFor(k('ArrowRight'))).toBe('seek-forward');
    expect(shortcutFor(k('ArrowLeft'))).toBe('seek-back');
    expect(shortcutFor(k('n'))).toBe('next');
    expect(shortcutFor(k('P'))).toBe('prev');
    expect(shortcutFor(k('x'))).toBeNull();
  });
  it('tidak mencuri ketikan di kolom input', () => {
    expect(shortcutFor(k(' ', { tag: 'INPUT', inputType: 'search' }))).toBeNull();
    expect(shortcutFor(k('n', { tag: 'TEXTAREA' }))).toBeNull();
    expect(shortcutFor(k('n', { editable: true }))).toBeNull();
  });
  it('spasi pada tombol/tautan dibiarkan untuk aktivasi bawaan', () => {
    expect(shortcutFor(k(' ', { tag: 'BUTTON' }))).toBeNull();
    expect(shortcutFor(k(' ', { tag: 'A' }))).toBeNull();
  });
  it('panah pada slider dibiarkan untuk slider itu sendiri', () => {
    expect(shortcutFor(k('ArrowRight', { tag: 'INPUT', inputType: 'range' }))).toBeNull();
  });
  it('mengabaikan kombinasi dengan Ctrl/Meta/Alt', () => {
    expect(shortcutFor(k('n', { ctrl: true }))).toBeNull();
    expect(shortcutFor(k('ArrowLeft', { alt: true }))).toBeNull();
    expect(shortcutFor(k(' ', { meta: true }))).toBeNull();
  });
});
