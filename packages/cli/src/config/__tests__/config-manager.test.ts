import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../config-manager';
import { AnySourceConfig } from '../types';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  }
}));

// Mock os module
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/test')
}));

import { promises as fs } from 'fs';

const mockFs = vi.mocked(fs);

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();
    configManager = new ConfigManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('renameSource', () => {
    const mockConfig = {
      version: '1.0',
      sources: {
        'source1': { name: 'source1', type: 'local', path: '/path1' } as AnySourceConfig,
        'source2': { name: 'source2', type: 'github', url: 'url2' } as AnySourceConfig
      },
      activeSource: 'source1'
    };

    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should successfully rename existing source', async () => {
      await configManager.renameSource('source1', 'renamed-source');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"renamed-source"'),
        'utf8'
      );
    });

    it('should throw error when old source does not exist', async () => {
      await expect(configManager.renameSource('non-existent', 'new-name'))
        .rejects.toThrow("Source 'non-existent' not found");
    });

    it('should throw error when new name already exists', async () => {
      await expect(configManager.renameSource('source1', 'source2'))
        .rejects.toThrow("Source 'source2' already exists");
    });

    it('should throw error when new name is empty', async () => {
      await expect(configManager.renameSource('source1', ''))
        .rejects.toThrow('New source name cannot be empty');

      await expect(configManager.renameSource('source1', '   '))
        .rejects.toThrow('New source name cannot be empty');
    });

    it('should update activeSource when renaming active source', async () => {
      await configManager.renameSource('source1', 'renamed-active');

      const writeCall = mockFs.writeFile.mock.calls[0];
      const savedConfig = JSON.parse(writeCall[1] as string);
      expect(savedConfig.activeSource).toBe('renamed-active');
    });

    it('should preserve activeSource when renaming non-active source', async () => {
      await configManager.renameSource('source2', 'renamed-source2');

      const writeCall = mockFs.writeFile.mock.calls[0];
      const savedConfig = JSON.parse(writeCall[1] as string);
      expect(savedConfig.activeSource).toBe('source1');
    });
  });
}); 