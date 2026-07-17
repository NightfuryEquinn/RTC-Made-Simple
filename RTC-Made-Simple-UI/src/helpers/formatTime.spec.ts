import { formatTime } from '../helpers/formatTime';

describe('formatTime', () => {
  it('formats seconds into mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3600)).toBe('01:00:00');
  });
});
