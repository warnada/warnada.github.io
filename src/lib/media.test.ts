import { describe, expect, it } from 'vitest';
import { isAbsoluteUrl } from './media';

describe('isAbsoluteUrl', () => {
  it('membedakan URL absolut dan path relatif', () => {
    expect(isAbsoluteUrl('https://a.b/c.mp3')).toBe(true);
    expect(isAbsoluteUrl('audio/x.mp3')).toBe(false);
  });
});
