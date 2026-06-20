import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatShortDate,
  formatISODate,
  formatNumber,
  formatCompactNumber,
  formatDuration,
  formatPace,
  truncate,
  slugify,
  capitalize,
  decodeHtmlEntities,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  extractYouTubeId,
  groupBy,
  sortByDate,
  filterBySearch,
  isValidEmail,
  isValidUrl,
  sleep,
  generateId,
  randomItem,
  shuffle,
  debounce,
  throttle,
} from '@/lib/utils';

describe('cn - Class Name Utility', () => {
  it('merges class names', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('handles conditional classes', () => {
    const result = cn('base-class', false && 'conditional-class', 'another-class');
    expect(result).toContain('base-class');
    expect(result).toContain('another-class');
    expect(result).not.toContain('conditional-class');
  });

  it('handles tailwind-merge for duplicate classes', () => {
    const result = cn('px-2 px-4');
    expect(result).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2024-05-15', 'MMMM d, yyyy');
    expect(result).toBe('May 15, 2024');
  });

  it('formats Date object', () => {
    const date = new Date('2024-05-15');
    const result = formatDate(date, 'MMMM d, yyyy');
    expect(result).toBe('May 15, 2024');
  });

  it('uses default format', () => {
    const result = formatDate('2024-05-15');
    expect(result).toBe('May 15, 2024');
  });
});

describe('formatRelativeTime', () => {
  it('formats relative time', () => {
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    const result = formatRelativeTime(pastDate);
    expect(result).toContain('ago');
  });
});

describe('formatShortDate', () => {
  it('formats short date', () => {
    const result = formatShortDate('2024-05-15');
    expect(result).toBe('May 15');
  });
});

describe('formatISODate', () => {
  it('formats ISO date', () => {
    const date = new Date('2024-05-15T12:00:00Z');
    const result = formatISODate(date);
    expect(result).toBe('2024-05-15T12:00:00.000Z');
  });
});

describe('formatNumber', () => {
  it('formats number with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });
});

describe('formatCompactNumber', () => {
  it('formats compact number', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(1500000)).toBe('1.5M');
  });
});

describe('formatDuration', () => {
  it('formats seconds to HH:MM:SS', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('formats seconds to MM:SS when under an hour', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('formatPace', () => {
  it('formats pace correctly', () => {
    expect(formatPace(330)).toBe('5:30');
    expect(formatPace(360)).toBe('6:00');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    const result = truncate('This is a very long string', 10);
    expect(result).toBe('This is...');
    expect(result.length).toBe(10);
  });

  it('does not truncate short strings', () => {
    const result = truncate('Hi', 10);
    expect(result).toBe('Hi');
  });

  it('uses custom suffix', () => {
    const result = truncate('This is a very long string', 13, '>>');
    // slice(0, 13 - 2) = slice(0, 11) = "This is a v" + ">>" = "This is a v>>"
    expect(result).toBe('This is a v>>');
  });
});

describe('slugify', () => {
  it('converts string to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    expect(slugify('Special!@#Characters')).toBe('specialcharacters');
  });

  it('handles mixed case', () => {
    expect(slugify('CaMeLCaSe TeXt')).toBe('camelcase-text');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('  leading and trailing  ')).toBe('leading-and-trailing');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('WORLD')).toBe('WORLD');
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes HTML entities', () => {
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&gt;')).toBe('>');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
    expect(decodeHtmlEntities('&#39;')).toBe("'");
    expect(decodeHtmlEntities('&nbsp;')).toBe(' ');
  });

  it('handles complex strings', () => {
    expect(decodeHtmlEntities('Hello &amp; World')).toBe('Hello & World');
  });
});

describe('getYouTubeThumbnail', () => {
  it('generates thumbnail URL', () => {
    const result = getYouTubeThumbnail('dQw4w9WgXcQ');
    expect(result).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('handles different quality options', () => {
    expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'default')).toContain('default');
    expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'medium')).toContain('mqdefault');
    expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'high')).toContain('hqdefault');
    expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'maxres')).toContain('maxresdefault');
  });
});

describe('getYouTubeEmbedUrl', () => {
  it('generates embed URL', () => {
    const result = getYouTubeEmbedUrl('dQw4w9WgXcQ');
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
});

describe('extractYouTubeId', () => {
  it('extracts video ID from watch URL', () => {
    const result = extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from youtu.be URL', () => {
    const result = extractYouTubeId('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from embed URL', () => {
    const result = extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toBe('dQw4w9WgXcQ');
  });

  it('returns video ID if already ID format', () => {
    const result = extractYouTubeId('dQw4w9WgXcQ');
    expect(result).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid URL', () => {
    const result = extractYouTubeId('invalid');
    expect(result).toBeNull();
  });
});

describe('groupBy', () => {
  it('groups array by key', () => {
    const items = [
      { name: 'Alice', category: 'A' },
      { name: 'Bob', category: 'B' },
      { name: 'Charlie', category: 'A' },
    ];
    const result = groupBy(items, 'category');
    expect(result.A).toHaveLength(2);
    expect(result.B).toHaveLength(1);
  });

  it('handles empty arrays', () => {
    const result = groupBy([], 'category');
    expect(result).toEqual({});
  });
});

describe('sortByDate', () => {
  it('sorts by date descending', () => {
    const items = [
      { title: 'First', date: '2024-01-01' },
      { title: 'Second', date: '2024-03-01' },
      { title: 'Third', date: '2024-02-01' },
    ];
    const result = sortByDate(items, 'date');
    expect(result[0].title).toBe('Second');
    expect(result[1].title).toBe('Third');
    expect(result[2].title).toBe('First');
  });

  it('sorts by date ascending', () => {
    const items = [
      { title: 'First', date: '2024-01-01' },
      { title: 'Second', date: '2024-03-01' },
    ];
    const result = sortByDate(items, 'date', 'asc');
    expect(result[0].title).toBe('First');
  });
});

describe('filterBySearch', () => {
  const items = [
    { name: 'Alice', role: 'developer' },
    { name: 'Bob', role: 'designer' },
    { name: 'Charlie', role: 'developer' },
  ];

  it('filters by search term', () => {
    const result = filterBySearch(items, 'alice', ['name']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('filters across multiple fields', () => {
    const result = filterBySearch(items, 'developer', ['role']);
    expect(result).toHaveLength(2);
  });

  it('returns all items for empty search', () => {
    const result = filterBySearch(items, '', ['name']);
    expect(result).toHaveLength(3);
  });

  it('is case insensitive', () => {
    const result = filterBySearch(items, 'ALICE', ['name']);
    expect(result).toHaveLength(1);
  });
});

describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('validates correct URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://test.org/path')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('just text')).toBe(false);
  });
});

describe('sleep', () => {
  it('delays execution', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('generates string IDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });
});

describe('randomItem', () => {
  it('returns an item from array', () => {
    const arr = ['a', 'b', 'c'];
    const result = randomItem(arr);
    expect(arr).toContain(result);
  });

  it('handles single item array', () => {
    const arr = ['only'];
    const result = randomItem(arr);
    expect(result).toBe('only');
  });
});

describe('shuffle', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(5);
  });

  it('contains all original items', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    arr.forEach((item) => {
      expect(result).toContain(item);
    });
  });

  it('does not mutate original array', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });
});

describe('debounce', () => {
  it('delays function execution', async () => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 50);

    fn();
    expect(callCount).toBe(0);

    await sleep(100);
    expect(callCount).toBe(1);
  });

  it('only calls once for rapid calls', async () => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 50);

    fn();
    fn();
    fn();

    await sleep(100);
    expect(callCount).toBe(1);
  });
});

describe('throttle', () => {
  it('limits function calls', () => {
    let callCount = 0;
    const fn = throttle(() => callCount++, 50);

    fn();
    fn();
    fn();

    expect(callCount).toBe(1);
  });

  it('allows subsequent calls after delay', async () => {
    let callCount = 0;
    const fn = throttle(() => callCount++, 50);

    fn();
    expect(callCount).toBe(1);

    await sleep(60);
    fn();
    expect(callCount).toBe(2);
  });
});