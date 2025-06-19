import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { removeCommand } from '../remove.js';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    unlink: vi.fn()
  }
}));

vi.mock('../../utils/project-detector.js', () => ({
  findProjectRoot: vi.fn()
}));

vi.mock('../../utils/rules-manager.js', () => ({
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

import { promises as fs } from 'fs';
import { findProjectRoot } from '../../utils/project-detector.js';
import { listAvailableRules } from '../../utils/rules-manager.js';

const mockAccess = vi.mocked(fs.access);
const mockUnlink = vi.mocked(fs.unlink);
const mockFindProjectRoot = vi.mocked(findProjectRoot);
const mockListAvailableRules = vi.mocked(listAvailableRules);

describe('remove command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should remove rules successfully', async () => {
    const categories = ['typescript', 'react'];
    const projectRoot = '/home/user/project';
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'typescript', name: 'react-components', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'react', name: 'component-standards', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockResolvedValue(undefined);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockUnlink.mockResolvedValue(undefined);

    await removeCommand(categories);

    expect(mockFindProjectRoot).toHaveBeenCalledWith(process.cwd());
    expect(mockAccess).toHaveBeenCalledWith('/home/user/project/.cursor/rules');
    expect(mockUnlink).toHaveBeenCalledTimes(3);
    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: typescript/strict-types');
    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: typescript/react-components');
    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: react/component-standards');
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully removed 3 rule(s).');
  });

  it('should handle project root not found', async () => {
    const categories = ['typescript'];

    mockFindProjectRoot.mockResolvedValue(null);

    await removeCommand(categories);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Could not find project root.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle rules directory not found', async () => {
    const categories = ['typescript'];
    const projectRoot = '/home/user/project';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await removeCommand(categories);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: No rules directory found in this project.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle files not found gracefully', async () => {
    const categories = ['typescript'];
    const projectRoot = '/home/user/project';
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockResolvedValue(undefined);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockUnlink.mockRejectedValue(new Error('ENOENT'));

    await removeCommand(categories);

    expect(mockConsoleLog).toHaveBeenCalledWith('File not found: typescript/strict-types');
    expect(mockConsoleLog).toHaveBeenCalledWith('No rules were removed.');
  });

  it('should handle mixed success and failure', async () => {
    const categories = ['typescript'];
    const projectRoot = '/home/user/project';
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'typescript', name: 'react-components', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockResolvedValue(undefined);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockUnlink
      .mockResolvedValueOnce(undefined) // first file succeeds
      .mockRejectedValueOnce(new Error('ENOENT')); // second file fails

    await removeCommand(categories);

    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: typescript/strict-types');
    expect(mockConsoleLog).toHaveBeenCalledWith('File not found: typescript/react-components');
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully removed 1 rule(s).');
  });

  it('should handle errors gracefully', async () => {
    const categories = ['typescript'];
    const error = new Error('Permission denied');

    mockFindProjectRoot.mockRejectedValue(error);

    await removeCommand(categories);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 