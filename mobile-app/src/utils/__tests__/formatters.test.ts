import { formatNumber, truncate, songCountLabel, timeAgo } from '@/utils';

describe('formatters', () => {
  it('formats numbers with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('truncates long strings', () => {
    expect(truncate('Hello world', 6)).toBe('Hello…');
  });

  it('builds song count label', () => {
    expect(songCountLabel(1)).toBe('1 song');
    expect(songCountLabel(3)).toBe('3 songs');
  });

  it('formats time ago values', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

    expect(timeAgo(new Date(now.getTime() - 30 * 1000))).toBe('just now');
    expect(timeAgo(new Date(now.getTime() - 2 * 60 * 1000))).toBe('2m ago');
    expect(timeAgo(new Date(now.getTime() - 3 * 60 * 60 * 1000))).toBe('3h ago');

    (Date.now as jest.Mock).mockRestore();
  });
});
