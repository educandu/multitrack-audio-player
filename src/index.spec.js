import { test } from './index.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('index', () => {
  let result;

  beforeEach(() => {
    result = test;
  });

  describe('when test is imported', () => {
    it('should be test', () => {
      expect(result).toBe('test');
    });
  });
});
