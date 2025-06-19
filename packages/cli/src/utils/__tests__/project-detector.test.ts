import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { findProjectRoot, ensureRulesDirectory } from '../project-detector.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn()
  }
}));

const mockedFs = vi.mocked(fs);

describe('project-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findProjectRoot', () => {
    it('should find project root with .git directory', async () => {
      const testPath = '/home/user/project/subfolder';
      
      // Mock fs.access to succeed for .git at project level
      mockedFs.access
        .mockRejectedValueOnce(new Error('ENOENT')) // subfolder/.git fails
        .mockRejectedValueOnce(new Error('ENOENT')) // subfolder/package.json fails
        .mockResolvedValueOnce(undefined); // project/.git succeeds

      const result = await findProjectRoot(testPath);
      
      expect(result).toBe('/home/user/project');
      expect(mockedFs.access).toHaveBeenCalledWith(join('/home/user/project', '.git'));
    });

    it('should find project root with package.json', async () => {
      const testPath = '/home/user/project/subfolder';
      
      // Mock fs.access to succeed for package.json at project level
      mockedFs.access
        .mockRejectedValueOnce(new Error('ENOENT')) // subfolder/.git fails
        .mockResolvedValueOnce(undefined); // subfolder/package.json succeeds

      const result = await findProjectRoot(testPath);
      
      expect(result).toBe(testPath);
      expect(mockedFs.access).toHaveBeenCalledWith(join(testPath, 'package.json'));
    });

    it('should return null when no project root found', async () => {
      const testPath = '/home';
      
      // Mock fs.access to always fail
      mockedFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await findProjectRoot(testPath);
      
      expect(result).toBeNull();
    });
  });

  describe('ensureRulesDirectory', () => {
    it('should create rules directory successfully', async () => {
      const projectPath = '/home/user/project';
      const expectedRulesPath = join(projectPath, '.cursor', 'rules');
      
      mockedFs.mkdir.mockResolvedValueOnce(undefined);

      const result = await ensureRulesDirectory(projectPath);
      
      expect(result).toBe(expectedRulesPath);
      expect(mockedFs.mkdir).toHaveBeenCalledWith(expectedRulesPath, { recursive: true });
    });

    it('should throw error when directory creation fails', async () => {
      const projectPath = '/home/user/project';
      const error = new Error('Permission denied');
      
      mockedFs.mkdir.mockRejectedValueOnce(error);

      await expect(ensureRulesDirectory(projectPath)).rejects.toThrow('Failed to create rules directory: Error: Permission denied');
    });
  });
}); 