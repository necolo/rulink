import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SourceManager } from '../source-manager';
import { ConfigManager } from '../../config/config-manager';
import { LocalSourceProvider } from '../providers/local-provider';
import { GitHubSourceProvider } from '../providers/github-provider';
import { NpmSourceProvider } from '../providers/npm-provider';
import type { GlobalConfig, AnySourceConfig } from '../../config/types';

// Mock the providers
vi.mock('../providers/local-provider.js');
vi.mock('../providers/github-provider.js');
vi.mock('../providers/npm-provider.js');
vi.mock('../../config/config-manager.js');

describe('SourceManager', () => {
  let sourceManager: SourceManager;
  const mockConfigManager = ConfigManager as any;
  const mockLocalProvider = LocalSourceProvider as any;
  const mockGitHubProvider = GitHubSourceProvider as any;
  const mockNpmProvider = NpmSourceProvider as any;

  let configManagerInstance: any;

  beforeEach(() => {
    configManagerInstance = {
      loadConfig: vi.fn(),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      setActiveSource: vi.fn(),
      generateUniqueName: vi.fn(),
      listSources: vi.fn(),
      getActiveSource: vi.fn()
    };
    mockConfigManager.mockImplementation(() => configManagerInstance);

    sourceManager = new SourceManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('addSource', () => {
    it('should detect and add local source', async () => {
      const mockValidation = { valid: true };
      const mockProviderInstance = {
        validateSource: vi.fn().mockResolvedValue(mockValidation)
      };
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      configManagerInstance.listSources.mockResolvedValue({});
      configManagerInstance.generateUniqueName.mockReturnValue('my-rules');

      const result = await sourceManager.addSource('/path/to/rules', {});

      expect(mockLocalProvider).toHaveBeenCalledWith(expect.objectContaining({
        type: 'local',
        name: 'my-rules',
        path: '/path/to/rules'
      }));
      expect(result.name).toBe('my-rules');
    });

    it('should detect and add GitHub source with --github flag', async () => {
      const mockValidation = { valid: true };
      const mockProviderInstance = {
        validateSource: vi.fn().mockResolvedValue(mockValidation)
      };
      mockGitHubProvider.mockImplementation(() => mockProviderInstance);

      configManagerInstance.listSources.mockResolvedValue({});
      configManagerInstance.generateUniqueName.mockReturnValue('user-repo');

      const result = await sourceManager.addSource('github.com/user/repo', {
        github: true
      });

      expect(mockGitHubProvider).toHaveBeenCalledWith(expect.objectContaining({
        type: 'github',
        name: 'user-repo'
      }));
      expect(result.name).toBe('user-repo');
    });

    it('should detect and add NPM source with --npm flag', async () => {
      const mockValidation = { valid: true };
      const mockProviderInstance = {
        validateSource: vi.fn().mockResolvedValue(mockValidation)
      };
      mockNpmProvider.mockImplementation(() => mockProviderInstance);

      configManagerInstance.listSources.mockResolvedValue({});
      configManagerInstance.generateUniqueName.mockReturnValue('cursor-rules');

      const result = await sourceManager.addSource('@company/cursor-rules', {
        npm: true
      });

      expect(mockNpmProvider).toHaveBeenCalledWith(expect.objectContaining({
        type: 'npm',
        name: 'cursor-rules',
        package: '@company/cursor-rules'
      }));
      expect(result.name).toBe('cursor-rules');
    });

    it('should handle validation failures', async () => {
      const mockValidation = {
        valid: false,
        error: 'Directory not found',
        suggestions: ['Check the path']
      };
      const mockProviderInstance = {
        validateSource: vi.fn().mockResolvedValue(mockValidation)
      };
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      configManagerInstance.listSources.mockResolvedValue({});

      await expect(sourceManager.addSource('/invalid/path', {})).rejects.toThrow(
        'Source validation failed: Directory not found'
      );
    });
  });

  describe('listSources', () => {
    it('should return all configured sources', async () => {
      const mockSources = {
        'local-rules': {
          type: 'local',
          name: 'local-rules',
          path: '/path/to/rules'
        },
        'github-rules': {
          type: 'github',
          name: 'github-rules',
          url: 'github.com/user/repo'
        }
      };

      configManagerInstance.listSources.mockResolvedValue(mockSources);

      const result = await sourceManager.listSources();

      expect(result).toEqual(mockSources);
    });
  });

  describe('setActiveSource', () => {
    it('should set active source', async () => {
      await sourceManager.setActiveSource('test-source');

      expect(configManagerInstance.setActiveSource).toHaveBeenCalledWith('test-source');
    });
  });

  describe('removeSource', () => {
    it('should remove source', async () => {
      await sourceManager.removeSource('test-source');

      expect(configManagerInstance.removeSource).toHaveBeenCalledWith('test-source');
    });
  });

  describe('listRules', () => {
    it('should list rules from active source', async () => {
      const mockSource = {
        type: 'local',
        name: 'local-rules',
        path: '/path/to/rules'
      };
      
      const mockRules = [
        { category: 'default', name: 'style' },
        { category: 'typescript', name: 'best-practices' }
      ];

      const mockProviderInstance = {
        listRules: vi.fn().mockResolvedValue(mockRules)
      };

      configManagerInstance.getActiveSource.mockResolvedValue(mockSource);
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      const result = await sourceManager.listRules();

      expect(result).toEqual(mockRules);
      expect(mockProviderInstance.listRules).toHaveBeenCalled();
    });

    it('should throw error when no active source', async () => {
      configManagerInstance.getActiveSource.mockResolvedValue(null);

      await expect(sourceManager.listRules()).rejects.toThrow(
        'No active source configured'
      );
    });
  });

  describe('getRuleContent', () => {
    it('should get rule content from active source', async () => {
      const mockSource = {
        type: 'local',
        name: 'local-rules',
        path: '/path/to/rules'
      };
      
      const mockContent = '# Test Rule\n\nThis is a test rule.';

      const mockProviderInstance = {
        getRuleContent: vi.fn().mockResolvedValue(mockContent)
      };

      configManagerInstance.getActiveSource.mockResolvedValue(mockSource);
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      const result = await sourceManager.getRuleContent('style.mdc');

      expect(result).toBe(mockContent);
      expect(mockProviderInstance.getRuleContent).toHaveBeenCalledWith('style.mdc');
    });

    it('should validate rule path format', async () => {
      await expect(sourceManager.getRuleContent('invalid-path')).rejects.toThrow(
        'Rule path must end with .mdc: invalid-path'
      );
    });
  });

  describe('getRulesByCategory', () => {
    it('should return rules for specified category', async () => {
      const mockSource = {
        type: 'local',
        name: 'local-rules',
        path: '/path/to/rules'
      };
      
      const mockRules = [
        { category: 'typescript', name: 'style' },
        { category: 'typescript', name: 'types' },
        { category: 'general', name: 'basic' }
      ];

      const mockProviderInstance = {
        listRules: vi.fn().mockResolvedValue(mockRules)
      };

      configManagerInstance.getActiveSource.mockResolvedValue(mockSource);
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      const result = await sourceManager.getRulesByCategory('typescript');

      expect(result).toEqual(['typescript/style.mdc', 'typescript/types.mdc']);
    });

    it('should return rules for default category', async () => {
      const mockSource = {
        type: 'local',
        name: 'local-rules',
        path: '/path/to/rules'
      };
      
      const mockRules = [
        { category: 'default', name: 'basic' },
        { category: 'typescript', name: 'style' }
      ];

      const mockProviderInstance = {
        listRules: vi.fn().mockResolvedValue(mockRules)
      };

      configManagerInstance.getActiveSource.mockResolvedValue(mockSource);
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      const result = await sourceManager.getRulesByCategory('default');

      expect(result).toEqual(['basic.mdc']);
    });
  });

  describe('expandRulePath', () => {
    it('should return single path for .mdc files', async () => {
      const result = await sourceManager.expandRulePath('typescript/style.mdc');

      expect(result).toEqual(['typescript/style.mdc']);
    });

    it('should expand folder names to all files in category', async () => {
      const mockSource = {
        type: 'local',
        name: 'local-rules',
        path: '/path/to/rules'
      };
      
      const mockRules = [
        { category: 'typescript', name: 'style' },
        { category: 'typescript', name: 'types' }
      ];

      const mockProviderInstance = {
        listRules: vi.fn().mockResolvedValue(mockRules)
      };

      configManagerInstance.getActiveSource.mockResolvedValue(mockSource);
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      const result = await sourceManager.expandRulePath('typescript');

      expect(result).toEqual(['typescript/style.mdc', 'typescript/types.mdc']);
    });

    it('should throw error for empty categories', async () => {
      const mockSource = {
        type: 'local',
        name: 'local-rules',
        path: '/path/to/rules'
      };
      
      const mockRules: any[] = [];

      const mockProviderInstance = {
        listRules: vi.fn().mockResolvedValue(mockRules)
      };

      configManagerInstance.getActiveSource.mockResolvedValue(mockSource);
      mockLocalProvider.mockImplementation(() => mockProviderInstance);

      await expect(sourceManager.expandRulePath('nonexistent')).rejects.toThrow(
        "No rules found in category 'nonexistent'"
      );
    });
  });

  describe('validateRulePath', () => {
    it('should validate .mdc file paths', async () => {
      const result = await sourceManager.validateRulePath('typescript/style.mdc');

      expect(result.valid).toBe(true);
    });

    it('should validate folder names', async () => {
      const result = await sourceManager.validateRulePath('typescript');

      expect(result.valid).toBe(true);
    });

    it('should reject folder names with slashes', async () => {
      const result = await sourceManager.validateRulePath('typescript/folder');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Folder name cannot contain slashes: typescript/folder');
    });

    it('should reject empty folder names', async () => {
      const result = await sourceManager.validateRulePath('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Folder name cannot be empty');
    });

    it('should reject paths more than 2 levels deep for .mdc files', async () => {
      const result = await sourceManager.validateRulePath('a/b/c.mdc');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Rule path cannot be more than 2 levels deep: a/b/c.mdc');
    });
  });
}); 