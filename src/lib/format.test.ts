import { describe, expect, it } from 'vitest';
import { formatSize, formatTime } from './format';

describe('format', () => {
  it('formatTime', () => {
    expect(formatTime(238)).toBe('3:58');
    expect(formatTime(5.9)).toBe('0:05');
    expect(formatTime(NaN)).toBe('0:00');
  });
  it('formatSize', () => {
    expect(formatSize(300 * 1024)).toBe('300 KB');
    expect(formatSize(3.5 * 1024 * 1024)).toBe('3,5 MB');
    expect(formatSize(24 * 1024 * 1024)).toBe('24 MB');
  });
});
