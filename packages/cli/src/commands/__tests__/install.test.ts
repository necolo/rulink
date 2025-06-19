import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installCommand } from '../install.js';
import type { InstallOptions } from '../../types.js';

// Mock modules
vi.mock('../../utils/project-detector.js', () => ({
  findProjectRoot: vi.fn(),
  ensureRulesDirectory: vi.fn()
}));

vi.mock('../../utils/rules-manager.js', () => ({
  copyRules: vi.fn(),
  listAvailableRules: vi.fn()
}));

vi.mock('picocolors', () => ({
  default: {
    red: (text: string) => text,
    blue: (text: string) => text,
    green: (text: string) => text,
    yellow: (text: string) => text,
    dim: (text: string) => text
  }
}));

// Mock process and console
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

import { findProjectRoot, ensureRulesDirectory } from '../../utils/project-detector.js';
import { copyRules, listAvailableRules } from '../../utils/rules-manager.js';

const mockFindProjectRoot = vi.mocked(findProjectRoot);
const mockEnsureRulesDirectory = vi.mocked(ensureRulesDirectory);
const mockCopyRules = vi.mocked(copyRules);
const mockListAvailableRules = vi.mocked(listAvailableRules);

describe('install command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should install rules successfully', async () => {
    const categories = ['typescript', 'react'];
    const options: InstallOptions = {};
    const projectRoot = '/home/user/project';
    const rulesPath = '/home/user/project/.cursor/rules';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockCopyRules.mockResolvedValue(undefined);

    await installCommand(categories, options);

    expect(mockFindProjectRoot).toHaveBeenCalledWith(process.cwd());
    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(projectRoot);
    expect(mockCopyRules).toHaveBeenCalledWith(categories, rulesPath);
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully installed rules for categories: typescript, react');
  });

  it('should use target path when provided', async () => {
    const categories = ['typescript'];
    const targetPath = '/custom/path';
    const options: InstallOptions = { targetPath };
    const rulesPath = '/custom/path/.cursor/rules';

    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockCopyRules.mockResolvedValue(undefined);

    await installCommand(categories, options);

    expect(mockFindProjectRoot).not.toHaveBeenCalled();
    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(targetPath);
  });

  it('should exit when no project root found', async () => {
    const categories = ['typescript'];
    const options: InstallOptions = {};

    mockFindProjectRoot.mockResolvedValue(null);

    await installCommand(categories, options);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Could not find project root. Use --to option to specify target path.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle dry run mode', async () => {
    const categories = ['typescript'];
    const options: InstallOptions = { dryRun: true };
    const projectRoot = '/home/user/project';
    const rulesPath = '/home/user/project/.cursor/rules';
    const mockRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'typescript', name: 'react-components', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockListAvailableRules.mockResolvedValue(mockRules);

    await installCommand(categories, options);

    expect(mockConsoleLog).toHaveBeenCalledWith('Dry run mode - no files will be modified');
    expect(mockConsoleLog).toHaveBeenCalledWith('Would install 2 rules:');
    expect(mockCopyRules).not.toHaveBeenCalled();
  });

  it('should handle verbose mode', async () => {
    const categories = ['typescript'];
    const options: InstallOptions = { verbose: true };
    const projectRoot = '/home/user/project';
    const rulesPath = '/home/user/project/.cursor/rules';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockCopyRules.mockResolvedValue(undefined);

    await installCommand(categories, options);

    expect(mockConsoleLog).toHaveBeenCalledWith(`Installing rules to: ${projectRoot}`);
  });

  it('should handle errors gracefully', async () => {
    const categories = ['typescript'];
    const options: InstallOptions = {};
    const error = new Error('Permission denied');

    mockFindProjectRoot.mockRejectedValue(error);

    await installCommand(categories, options);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 