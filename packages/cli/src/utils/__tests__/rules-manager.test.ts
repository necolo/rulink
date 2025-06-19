import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { getRulesPackagePath, listAvailableRules, copyRules } from '../rules-manager.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn()
  }
}));

// Mock import.meta.url for testing
vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/test/path/rules-manager.js')
}));

vi.mock('path', () => ({
  join: vi.fn((...args: string[]) => args.join('/')),
  dirname: vi.fn((path: string) => path.replace(/\/[^/]*$/, ''))
}));

const mockedFs = vi.mocked(fs);

describe('rules-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getRulesPackagePath', () => {
    it('should return the correct rules package path', async () => {
      const result = await getRulesPackagePath();
      expect(result).toContain('rules');
    });
  });

  describe('listAvailableRules', () => {
    it('should list all available rules correctly', async () => {
      const mockCategories = [
        { name: 'typescript', isDirectory: () => true },
        { name: 'react', isDirectory: () => true }
      ];
      const mockFiles = ['strict-types.mdc', 'components.mdc'];

      mockedFs.readdir
        .mockResolvedValueOnce(mockCategories as any)
        .mockResolvedValueOnce(mockFiles as any)
        .mockResolvedValueOnce(mockFiles as any);

      const result = await listAvailableRules();

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        category: 'typescript',
        name: 'strict-types',
        description: undefined,
        globs: undefined,
        alwaysApply: undefined
      });
    });

    it('should handle errors when listing rules', async () => {
      mockedFs.readdir.mockRejectedValueOnce(new Error('Access denied'));

      await expect(listAvailableRules()).rejects.toThrow('Failed to list available rules: Error: Access denied');
    });
  });

  describe('copyRules', () => {
    it('should copy rules successfully', async () => {
      const categories = ['typescript'];
      const targetPath = '/target/path';
      const mockFiles = ['strict-types.mdc'];
      const mockContent = 'rule content';

      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedFs.readFile.mockResolvedValueOnce(mockContent as any);
      mockedFs.writeFile.mockResolvedValueOnce(undefined as any);

      await copyRules(categories, targetPath);

      expect(mockedFs.readFile).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should handle errors when copying rules', async () => {
      const categories = ['typescript'];
      const targetPath = '/target/path';

      mockedFs.readdir.mockRejectedValueOnce(new Error('Category not found'));

      await expect(copyRules(categories, targetPath)).rejects.toThrow('Failed to copy rules from category typescript: Error: Category not found');
    });
  });
}); 