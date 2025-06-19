import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { statusCommand } from '../status.js';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn()
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

const mockReaddir = vi.mocked(fs.readdir);
const mockFindProjectRoot = vi.mocked(findProjectRoot);
const mockListAvailableRules = vi.mocked(listAvailableRules);

describe('status command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show status of installed rules', async () => {
    const projectRoot = '/home/user/project';
    const installedFiles = ['strict-types.mdc', 'component-standards.mdc', 'other-file.txt'];
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'react', name: 'component-standards', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'general', name: 'code-style', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockReaddir.mockResolvedValue(installedFiles as any);
    mockListAvailableRules.mockResolvedValue(availableRules);

    await statusCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith(`Cursor Rules Status for: ${projectRoot}`);
    expect(mockConsoleLog).toHaveBeenCalledWith('Installed rules:');
    expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ strict-types');
    expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ component-standards');
    expect(mockConsoleLog).toHaveBeenCalledWith('Available but not installed:');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - code-style');
  });

  it('should handle no project root found', async () => {
    mockFindProjectRoot.mockResolvedValue(null);

    await statusCommand();

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Could not find project root.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle no rules directory', async () => {
    const projectRoot = '/home/user/project';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockReaddir.mockRejectedValue(new Error('ENOENT'));

    await statusCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('No rules directory found in this project.');
  });

  it('should handle no installed rules', async () => {
    const projectRoot = '/home/user/project';
    const installedFiles: string[] = [];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockReaddir.mockResolvedValue(installedFiles as any);

    await statusCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('No rules installed.');
  });

  it('should handle all rules installed', async () => {
    const projectRoot = '/home/user/project';
    const installedFiles = ['strict-types.mdc', 'code-style.mdc'];
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'general', name: 'code-style', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockReaddir.mockResolvedValue(installedFiles as any);
    mockListAvailableRules.mockResolvedValue(availableRules);

    await statusCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Installed rules:');
    expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ strict-types');
    expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ code-style');
    expect(mockConsoleLog).not.toHaveBeenCalledWith('Available but not installed:');
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Permission denied');
    mockFindProjectRoot.mockRejectedValue(error);

    await statusCommand();

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 