const { describe, it, expect } = require('vitest');
const crypto = require('crypto');

// Extract utility functions from index.js for testing
function bumpVersion(version) {
  const numeric = parseFloat(version);
  if (Number.isFinite(numeric)) {
    return (numeric + 0.1).toFixed(1);
  }
  return `${version || '1.0'}-manual-${Date.now()}`;
}

function hashText(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

function truncateForOutline(text, maxLen = 160) {
  if (!text) return '';
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, maxLen - 1)}…`;
}

describe('Utility Functions', () => {
  describe('bumpVersion', () => {
    it('should increment numeric versions by 0.1', () => {
      expect(bumpVersion('1.0')).toBe('1.1');
      expect(bumpVersion('2.5')).toBe('2.6');
      expect(bumpVersion('10.9')).toBe('11.0');
    });

    it('should handle float precision correctly', () => {
      expect(bumpVersion('1.9')).toBe('2.0');
      expect(bumpVersion('0.1')).toBe('0.2');
    });

    it('should create manual version for non-numeric versions', () => {
      const result = bumpVersion('v1.0.0-alpha');
      expect(result).toMatch(/^v1\.0\.0-alpha-manual-\d+$/);
    });

    it('should create manual version for undefined/null', () => {
      const result1 = bumpVersion(null);
      const result2 = bumpVersion(undefined);
      expect(result1).toMatch(/^1\.0-manual-\d+$/);
      expect(result2).toMatch(/^1\.0-manual-\d+$/);
    });

    it('should handle edge cases', () => {
      expect(bumpVersion('0.0')).toBe('0.1');
      expect(bumpVersion('99.9')).toBe('100.0');
    });
  });

  describe('hashText', () => {
    it('should generate consistent SHA256 hashes', () => {
      const text = 'Hello World';
      const hash1 = hashText(text);
      const hash2 = hashText(text);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 produces 64 hex characters
    });

    it('should generate different hashes for different texts', () => {
      const hash1 = hashText('Hello World');
      const hash2 = hashText('Hello World!');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const hash = hashText('');
      expect(hash).toHaveLength(64);
      expect(hash).toBeTruthy();
    });

    it('should handle null and undefined', () => {
      const hash1 = hashText(null);
      const hash2 = hashText(undefined);
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });

    it('should produce valid hexadecimal strings', () => {
      const hash = hashText('test');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle special characters and unicode', () => {
      const hash1 = hashText('Hello 👋 World 🌍');
      const hash2 = hashText('Special chars: !@#$%^&*()');
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });
  });

  describe('truncateForOutline', () => {
    it('should not truncate text shorter than maxLen', () => {
      const text = 'Short text';
      expect(truncateForOutline(text, 160)).toBe('Short text');
      expect(truncateForOutline(text, 20)).toBe('Short text');
    });

    it('should truncate text longer than maxLen', () => {
      const longText = 'This is a very long text that should be truncated to fit within the maximum length parameter that we have set for the outline display';
      const result = truncateForOutline(longText, 50);
      expect(result).toHaveLength(50);
      expect(result).toMatch(/…$/);
    });

    it('should replace multiple whitespace with single space', () => {
      const text = 'Text   with    multiple     spaces';
      const result = truncateForOutline(text, 160);
      expect(result).toBe('Text with multiple spaces');
    });

    it('should trim leading and trailing whitespace', () => {
      const text = '   Text with spaces   ';
      const result = truncateForOutline(text, 160);
      expect(result).toBe('Text with spaces');
    });

    it('should handle newlines and tabs', () => {
      const text = 'Line 1\nLine 2\tTabbed';
      const result = truncateForOutline(text, 160);
      expect(result).toBe('Line 1 Line 2 Tabbed');
    });

    it('should return empty string for null or undefined', () => {
      expect(truncateForOutline(null)).toBe('');
      expect(truncateForOutline(undefined)).toBe('');
      expect(truncateForOutline('')).toBe('');
    });

    it('should use default maxLen of 160 when not specified', () => {
      const longText = 'a'.repeat(200);
      const result = truncateForOutline(longText);
      expect(result).toHaveLength(160);
      expect(result.endsWith('…')).toBe(true);
    });

    it('should handle exact length edge case', () => {
      const text = 'a'.repeat(160);
      const result = truncateForOutline(text, 160);
      expect(result).toHaveLength(160);
      expect(result.endsWith('…')).toBe(false);
    });

    it('should handle text with one character over limit', () => {
      const text = 'a'.repeat(161);
      const result = truncateForOutline(text, 160);
      expect(result).toHaveLength(160);
      expect(result.endsWith('…')).toBe(true);
    });
  });
});

