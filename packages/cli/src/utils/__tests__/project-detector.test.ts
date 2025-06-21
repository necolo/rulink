import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { findGitRoot, getProjectRoot } from '../project-detector';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
  }
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/Users/testuser')
}));

const mockedFs = vi.mocked(fs);

describe('project-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findGitRoot', () => {
    it('should find git root with .git directory', async () => {
      const testPath = '/home/user/project/subfolder';
      
      // Mock fs.access to succeed for .git at project level
      mockedFs.access
        .mockRejectedValueOnce(new Error('ENOENT')) // subfolder/.git fails
        .mockResolvedValueOnce(undefined); // project/.git succeeds

      const result = await findGitRoot(testPath);
      
      expect(result).toBe('/home/user/project');
      expect(mockedFs.access).toHaveBeenCalledWith(join('/home/user/project', '.git'));
    });

    it('should return null when no .git directory found', async () => {
      const testPath = '/home/user/project';
      
      // Mock fs.access to always fail
      mockedFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await findGitRoot(testPath);
      
      expect(result).toBeNull();
    });
  });

  describe('getProjectRoot', () => {
    it('should return git root when found', async () => {
      const testPath = '/home/user/project/subfolder';
      
      // Mock fs.access to succeed for .git at project level
      mockedFs.access
        .mockRejectedValueOnce(new Error('ENOENT')) // subfolder/.git fails
        .mockResolvedValueOnce(undefined); // project/.git succeeds

      const result = await getProjectRoot(testPath);
      
      expect(result).toBe('/home/user/project');
    });

    it('should return start path when no git root found', async () => {
      const testPath = '/home/user/project';
      
      // Mock fs.access to always fail
      mockedFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await getProjectRoot(testPath);
      
      expect(result).toBe(testPath);
    });
  });
}); 