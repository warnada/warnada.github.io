import { describe, expect, it } from 'vitest';
import { swipeAction } from './gesture';

describe('swipeAction', () => {
  it('geser ke bawah jauh = tutup', () => expect(swipeAction(5, 140)).toBe('close'));
  it('geser kiri = berikutnya, kanan = sebelumnya', () => {
    expect(swipeAction(-90, 8)).toBe('next');
    expect(swipeAction(90, -8)).toBe('prev');
  });
  it('gerakan pendek atau ketukan diabaikan', () => {
    expect(swipeAction(10, 12)).toBeNull();
    expect(swipeAction(-40, 0)).toBeNull();
    expect(swipeAction(0, 0)).toBeNull();
  });
  it('gerakan diagonal ambigu diabaikan', () => {
    expect(swipeAction(-80, 100)).toBeNull();
    expect(swipeAction(100, 90)).toBeNull();
  });
  it('geser ke atas tidak menutup', () => expect(swipeAction(0, -200)).toBeNull());
});
