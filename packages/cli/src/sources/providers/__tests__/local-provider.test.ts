import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { LocalSourceProvider } from '../local-provider';
import type { LocalSourceConfig } from '../../../config/types';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    stat: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
  }
}));

describe('LocalSourceProvider', () => {
  let provider: LocalSourceProvider;
  const mockFs = fs as any;
  const mockConfig: LocalSourceConfig = {
    type: 'local',
    name: 'test-local',
    path: '/test/path'
  };

  beforeEach(() => {
    provider = new LocalSourceProvider(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateSource', () => {
    it('should validate a directory with .mdc files', async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true });
      mockFs.readdir.mockResolvedValue([
        { isFile: () => true, isDirectory: () => false, name: 'test.mdc' },
        { isFile: () => true, isDirectory: () => false, name: 'other.txt' }
      ]);

      const result = await provider.validateSource();

      expect(result.valid).toBe(true);
      expect(mockFs.stat).toHaveBeenCalledWith('/test/path');
    });

    it('should validate a directory with .mdc files in subdirectories', async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true });
      // First call - root directory without .mdc files
      mockFs.readdir.mockResolvedValueOnce([
        { isFile: () => false, isDirectory: () => true, name: 'typescript' },
        { isFile: () => true, isDirectory: () => false, name: 'readme.txt' }
      ]);
      // Second call - subdirectory with .mdc files
      mockFs.readdir.mockResolvedValueOnce([
        { isFile: () => true, isDirectory: () => false, name: 'style.mdc' }
      ]);

      const result = await provider.validateSource();

      expect(result.valid).toBe(true);
    });

    it('should reject non-directory paths', async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => false });

      const result = await provider.validateSource();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path is not a directory');
      expect(result.suggestions).toContain('Ensure the path points to a directory containing .mdc files');
    });

    it('should reject directories without .mdc files', async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true });
      mockFs.readdir.mockResolvedValue([
        { isFile: () => true, isDirectory: () => false, name: 'test.txt' },
        { isFile: () => false, isDirectory: () => true, name: 'subfolder' }
      ]);
      // Subdirectory also has no .mdc files
      mockFs.readdir.mockResolvedValueOnce([
        { isFile: () => true, isDirectory: () => false, name: 'other.txt' }
      ]);

      const result = await provider.validateSource();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No .mdc files found in directory');
    });

    it('should handle file system errors', async () => {
      mockFs.stat.mockRejectedValue(new Error('Permission denied'));

      const result = await provider.validateSource();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot access path: Error: Permission denied');
      expect(result.suggestions).toContain('Check if the path exists and is readable');
    });
  });

  describe('listRules', () => {
    it('should list rules from flat directory structure', async () => {
      mockFs.readdir.mockResolvedValue([
        { isFile: () => true, isDirectory: () => false, name: 'style.mdc' },
        { isFile: () => true, isDirectory: () => false, name: 'docs.mdc' },
        { isFile: () => true, isDirectory: () => false, name: 'readme.txt' }
      ]);

      const result = await provider.listRules();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        category: 'default',
        name: 'style',
        description: undefined,
        globs: undefined,
        alwaysApply: undefined,
        absolutePath: '/test/path/style.mdc'
      });
      expect(result[1]).toEqual({
        category: 'default',
        name: 'docs',
        description: undefined,
        globs: undefined,
        alwaysApply: undefined,
        absolutePath: '/test/path/docs.mdc'
      });
    });

    it('should list rules from categorized directory structure', async () => {
      // Root directory
      mockFs.readdir.mockResolvedValueOnce([
        { isFile: () => true, isDirectory: () => false, name: 'general.mdc' },
        { isFile: () => false, isDirectory: () => true, name: 'typescript' }
      ]);
      // Typescript subdirectory
      mockFs.readdir.mockResolvedValueOnce([
        { isFile: () => true, isDirectory: () => false, name: 'style.mdc' },
        { isFile: () => true, isDirectory: () => false, name: 'best-practices.mdc' }
      ]);

      const result = await provider.listRules();

      expect(result).toHaveLength(3);
      expect(result.find(r => r.name === 'general')?.category).toBe('default');
      expect(result.find(r => r.name === 'style')?.category).toBe('typescript');
      expect(result.find(r => r.name === 'best-practices')?.category).toBe('typescript');
    });

    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(provider.listRules()).rejects.toThrow('Failed to scan directory /test/path: Error: Permission denied');
    });
  });

  describe('getRuleContent', () => {
    it('should read rule content from flat structure', async () => {
      const mockContent = '# Test Rule\n\nThis is a test rule.';
      mockFs.readFile.mockResolvedValue(mockContent);

      const result = await provider.getRuleContent('style.mdc');

      expect(mockFs.readFile).toHaveBeenCalledWith('/test/path/style.mdc', 'utf8');
      expect(result).toBe(mockContent);
    });

    it('should read rule content from categorized structure', async () => {
      const mockContent = '# TypeScript Style\n\nTypeScript coding guidelines.';
      mockFs.readFile.mockResolvedValue(mockContent);

      const result = await provider.getRuleContent('typescript/style.mdc');

      expect(mockFs.readFile).toHaveBeenCalledWith('/test/path/typescript/style.mdc', 'utf8');
      expect(result).toBe(mockContent);
    });

    it('should reject rule paths without .mdc extension', async () => {
      await expect(provider.getRuleContent('style')).rejects.toThrow('Rule path must end with .mdc: style');
    });

    it('should reject rule paths without .mdc extension in categorized structure', async () => {
      await expect(provider.getRuleContent('typescript/style')).rejects.toThrow('Rule path must end with .mdc: typescript/style');
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(provider.getRuleContent('nonexistent.mdc')).rejects.toThrow('Failed to read rule file /test/path/nonexistent.mdc: Error: File not found');
    });
  });
}); 