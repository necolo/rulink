import { describe, it, expect, beforeEach, vi } from 'vitest';
import { removeCommand } from '../remove.js';
import { promises as fs } from 'fs';

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

vi.mock('picocolors', () => ({
  default: {
    red: (text: string) => text,
    green: (text: string) => text,
    yellow: (text: string) => text,
  }
}));

// Mock process and console
vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

import { findProjectRoot } from '../../utils/project-detector.js';

const mockAccess = vi.mocked(fs.access);
const mockUnlink = vi.mocked(fs.unlink);
const mockFindProjectRoot = vi.mocked(findProjectRoot);
const mockExit = vi.mocked(process.exit);
const mockConsoleLog = vi.mocked(console.log);
const mockConsoleError = vi.mocked(console.error);


describe('remove command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove rules successfully', async () => {
    const ruleFiles = ['typescript/style.mdc', 'react.mdc'];
    const projectRoot = '/home/user/project';
    const rulesPath = `${projectRoot}/.cursor/rules`;

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);

    await removeCommand(ruleFiles);

    expect(mockFindProjectRoot).toHaveBeenCalledWith(process.cwd());
    expect(mockAccess).toHaveBeenCalledWith(rulesPath);
    expect(mockUnlink).toHaveBeenCalledTimes(2);
    expect(mockUnlink).toHaveBeenCalledWith(`${rulesPath}/style.mdc`);
    expect(mockUnlink).toHaveBeenCalledWith(`${rulesPath}/react.mdc`);
    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: style.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: react.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully removed 2 rule(s).');
  });

  it('should handle project root not found', async () => {
    const ruleFiles = ['typescript/style.mdc'];
    mockFindProjectRoot.mockResolvedValue(null);
    await removeCommand(ruleFiles);
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Could not find project root.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle rules directory not found', async () => {
    const ruleFiles = ['typescript/style.mdc'];
    const projectRoot = '/home/user/project';
    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockRejectedValue(new Error('ENOENT'));
    await removeCommand(ruleFiles);
    expect(mockConsoleError).toHaveBeenCalledWith('Error: No rules directory found in this project.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle files not found gracefully', async () => {
    const ruleFiles = ['style.mdc'];
    const projectRoot = '/home/user/project';
    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockResolvedValue(undefined);
    mockUnlink.mockRejectedValue(new Error('ENOENT'));

    await removeCommand(ruleFiles);

    expect(mockConsoleLog).toHaveBeenCalledWith('File not found: style.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('No rules were removed.');
  });

  it('should handle mixed success and failure', async () => {
    const ruleFiles = ['style.mdc', 'react.mdc'];
    const projectRoot = '/home/user/project';
    const rulesPath = `${projectRoot}/.cursor/rules`;
    
    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockAccess.mockResolvedValue(undefined);
    mockUnlink
      .mockResolvedValueOnce(undefined) // first file succeeds
      .mockRejectedValueOnce(new Error('ENOENT')); // second file fails

    await removeCommand(ruleFiles);

    expect(mockUnlink).toHaveBeenCalledWith(`${rulesPath}/style.mdc`);
    expect(mockUnlink).toHaveBeenCalledWith(`${rulesPath}/react.mdc`);
    expect(mockConsoleLog).toHaveBeenCalledWith('Removed: style.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('File not found: react.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully removed 1 rule(s).');
  });

  it('should handle errors gracefully', async () => {
    const ruleFiles = ['style.mdc'];
    const error = new Error('Permission denied');
    mockFindProjectRoot.mockRejectedValue(error);
    await removeCommand(ruleFiles);
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 