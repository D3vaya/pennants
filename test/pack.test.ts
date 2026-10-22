import { describe, expect, it } from 'vitest';
import { checkPackBudget, formatMB, parsePackJson, UNPACKED_BUDGET } from '../scripts/lib/pack.ts';

const pack = { size: 3_000_000, unpackedSize: 9_500_000, entryCount: 2000 };

describe('parsePackJson', () => {
  it('reads sizes from npm pack --json', () => {
    expect(parsePackJson(JSON.stringify([{ ...pack, name: 'pennants', files: [] }]))).toEqual(pack);
  });

  it.each(['[]', '[{"size":1}]', '[{"size":1,"unpackedSize":"2","entryCount":3}]'])(
    'rejects unexpected output %s',
    (json) => {
      expect(() => parsePackJson(json)).toThrow('Unexpected');
    },
  );
});

describe('checkPackBudget', () => {
  it('passes within the 10 MB budget', () => {
    expect(UNPACKED_BUDGET).toBe(10_000_000);
    expect(checkPackBudget(pack)).toEqual({
      ok: true,
      message: 'package 3.00 MB, unpacked 9.50 MB (2000 files), budget 10.00 MB',
    });
  });

  it('fails over budget', () => {
    const result = checkPackBudget(pack, 9_000_000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/OVER BUDGET$/);
  });

  it('formats decimal megabytes like npm', () => {
    expect(formatMB(14_812_345)).toBe('14.81 MB');
  });
});
