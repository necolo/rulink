import { describe, it, expect, vi } from 'vitest';

// Mock child_process with exec function
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

// Mock util 
vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn)
}));

import { getGitCredentials, createAuthHeaders } from '../auth';

describe('Auth utilities', () => {
  describe('getGitCredentials', () => {
    it('should be a function', () => {
      // This is a basic test since the actual implementation requires system integration
      expect(typeof getGitCredentials).toBe('function');
    });
  });

  describe('createAuthHeaders', () => {
    it('should create auth headers with token', () => {
      const result = createAuthHeaders({ token: 'test-token' });
      expect(result).toEqual({
        'User-Agent': 'rulink',
        'Authorization': 'token test-token'
      });
    });

    it('should return basic headers for no token', () => {
      const result = createAuthHeaders({});
      expect(result).toEqual({
        'User-Agent': 'rulink'
      });
    });
  });
}); 