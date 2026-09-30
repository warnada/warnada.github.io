import { describe, expect, it } from 'vitest';
import { afterSlop, axisLock, DRAG_SLOP, shouldCommit, swipeAction, velocityOf } from './gesture';

describe('swipeAction (mini player)', () => {
  it('kiri = berikutnya, kanan = sebelumnya', () => {
    expect(swipeAction(-90, 8)).toBe('next');
    expect(swipeAction(90, -8)).toBe('prev');
  });
  it('gerakan pendek, ketukan, dan diagonal diabaikan', () => {
    expect(swipeAction(-40, 0)).toBeNull();
    expect(swipeAction(0, 0)).toBeNull();
    expect(swipeAction(-80, 100)).toBeNull();
  });
  it('geser vertikal bukan aksi mini player', () => {
    expect(swipeAction(0, 200)).toBeNull();
    expect(swipeAction(0, -200)).toBeNull();
  });
});

describe('axisLock', () => {
  it('menunggu sampai melewati ambang', () => expect(axisLock(4, 3)).toBeNull());
  it('mengunci sumbu dominan', () => {
    expect(axisLock(30, 6)).toBe('x');
    expect(axisLock(-4, -30)).toBe('y');
  });
  it('diagonal: menunggu lalu menyerah', () => {
    expect(axisLock(14, 13)).toBeNull();
    expect(axisLock(50, 48)).toBe('none');
  });
});

describe('afterSlop', () => {
  it('nol di dalam ambang, lalu mengikuti jari tanpa lompatan', () => {
    expect(afterSlop(DRAG_SLOP - 1)).toBe(0);
    expect(afterSlop(DRAG_SLOP + 5)).toBe(5);
    expect(afterSlop(-(DRAG_SLOP + 5))).toBe(-5);
  });
});

describe('shouldCommit', () => {
  it('cukup jauh = jadi', () => expect(shouldCommit(-120, 0, 390)).toBe(true));
  it('jarak kurang dari ambang dan lambat = batal', () => expect(shouldCommit(-60, -0.1, 390)).toBe(false));
  it('sentakan cepat berjarak pendek = jadi', () => expect(shouldCommit(-40, -0.8, 390)).toBe(true));
  it('sentakan terlalu pendek = batal', () => expect(shouldCommit(-15, -1.5, 390)).toBe(false));
  it('sentakan balik saat sudah jauh = batal', () => expect(shouldCommit(-200, 0.6, 390)).toBe(false));
});

describe('velocityOf', () => {
  it('menghitung px/ms dan aman untuk sampel sedikit', () => {
    expect(velocityOf([[0, 0], [50, 25]])).toBeCloseTo(0.5);
    expect(velocityOf([[0, 0]])).toBe(0);
    expect(velocityOf([[10, 5], [10, 9]])).toBe(0);
  });
});
