import { cn } from '../../lib/utils';

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('combines class names correctly', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('handles false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('handles empty strings', () => {
      const result = cn('base-class', '', 'valid-class');
      expect(result).toBe('base-class valid-class');
    });
  });

  describe('Date formatting', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      expect(formatted).toMatch(/December 25, 2023/);
    });
  });

  describe('String utilities', () => {
    it('capitalizes first letter', () => {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('truncates long strings', () => {
      const truncate = (str, length) => str.length > length ? str.slice(0, length) + '...' : str;
      expect(truncate('This is a very long string', 10)).toBe('This is a ...');
      expect(truncate('Short', 10)).toBe('Short');
    });
  });
});
