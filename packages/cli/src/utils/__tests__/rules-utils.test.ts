import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { findActiveRulesDirectory, validateRulesDirectoryPath } from '../rules-utils';
import { promises as fs } from 'fs';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
  },
}));

vi.mock('../project-detector.js', () => ({
  getProjectRoot: vi.fn(),
}));

import { getProjectRoot } from '../project-detector';

describe('rules-utils', () => {
  const mockFsAccess = vi.mocked(fs.access);
  const mockGetProjectRoot = vi.mocked(getProjectRoot);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findActiveRulesDirectory', () => {
    it('should return local rules when they exist in current directory', async () => {
      const currentDir = '/test/current';
      const projectRoot = '/test/project';
      
      // Mock local rules directory exists
      mockFsAccess.mockResolvedValueOnce(undefined);
      mockGetProjectRoot.mockResolvedValue(projectRoot);
      
      const result = await findActiveRulesDirectory(currentDir);
      
      expect(result).toEqual({
        path: join(currentDir, '.cursor', 'rules'),
        source: 'local',
        projectRoot
      });
      expect(mockFsAccess).toHaveBeenCalledWith(join(currentDir, '.cursor', 'rules'));
    });

    it('should fall back to project rules when local rules do not exist', async () => {
      const currentDir = '/test/current';
      const projectRoot = '/test/project';
      
      // Mock local rules directory does not exist
      mockFsAccess.mockRejectedValueOnce(new Error('ENOENT'));
      mockGetProjectRoot.mockResolvedValue(projectRoot);
      
      const result = await findActiveRulesDirectory(currentDir);
      
      expect(result).toEqual({
        path: join(projectRoot, '.cursor', 'rules'),
        source: 'project',
        projectRoot
      });
      expect(mockFsAccess).toHaveBeenCalledWith(join(currentDir, '.cursor', 'rules'));
    });

    it('should use process.cwd() when no start path provided', async () => {
      const currentDir = process.cwd();
      const projectRoot = '/test/project';
      
      // Mock local rules directory does not exist
      mockFsAccess.mockRejectedValueOnce(new Error('ENOENT'));
      mockGetProjectRoot.mockResolvedValue(projectRoot);
      
      const result = await findActiveRulesDirectory();
      
      expect(result).toEqual({
        path: join(projectRoot, '.cursor', 'rules'),
        source: 'project',
        projectRoot
      });
      expect(mockFsAccess).toHaveBeenCalledWith(join(currentDir, '.cursor', 'rules'));
    });

    it('should handle project root being same as current directory', async () => {
      const currentDir = '/test/project';
      const projectRoot = '/test/project';
      
      // Mock local rules directory exists
      mockFsAccess.mockResolvedValueOnce(undefined);
      mockGetProjectRoot.mockResolvedValue(projectRoot);
      
      const result = await findActiveRulesDirectory(currentDir);
      
      expect(result).toEqual({
        path: join(currentDir, '.cursor', 'rules'),
        source: 'local',
        projectRoot
      });
    });
  });

  describe('validateRulesDirectoryPath', () => {
    it('should return true when directory exists', async () => {
      const rulesPath = '/test/.cursor/rules';
      mockFsAccess.mockResolvedValueOnce(undefined);
      
      const result = await validateRulesDirectoryPath(rulesPath);
      
      expect(result).toBe(true);
      expect(mockFsAccess).toHaveBeenCalledWith(rulesPath);
    });

    it('should return false when directory does not exist', async () => {
      const rulesPath = '/test/.cursor/rules';
      mockFsAccess.mockRejectedValueOnce(new Error('ENOENT'));
      
      const result = await validateRulesDirectoryPath(rulesPath);
      
      expect(result).toBe(false);
      expect(mockFsAccess).toHaveBeenCalledWith(rulesPath);
    });
  });
}); 