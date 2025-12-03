import { describe, it, expect } from 'vitest';
import { placeholder } from './index';

describe('placeholder', () => {
  it('should equal hello world', () => {
    expect(placeholder).toBe('hello world');
  });
});
