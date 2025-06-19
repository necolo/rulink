import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updateCommand } from '../update.js';

// Mock modules
vi.mock('../../utils/npm-client.js', () => ({
  getLatestVersion: vi.fn(),
  getCurrentVersion: vi.fn()
}));

vi.mock('../install.js', () => ({
  installCommand: vi.fn()
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

import { getLatestVersion, getCurrentVersion } from '../../utils/npm-client.js';
import { installCommand } from '../install.js';
import { listAvailableRules } from '../../utils/rules-manager.js';

const mockGetLatestVersion = vi.mocked(getLatestVersion);
const mockGetCurrentVersion = vi.mocked(getCurrentVersion);
const mockInstallCommand = vi.mocked(installCommand);
const mockListAvailableRules = vi.mocked(listAvailableRules);

describe('update command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should update rules when new version is available', async () => {
    const currentVersion = '1.0.0';
    const latestVersion = '1.1.0';
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'react', name: 'component-standards', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'general', name: 'code-style', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockGetCurrentVersion.mockResolvedValue(currentVersion);
    mockGetLatestVersion.mockResolvedValue(latestVersion);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockInstallCommand.mockResolvedValue(undefined);

    await updateCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Checking for updates...');
    expect(mockConsoleLog).toHaveBeenCalledWith(`Updating from ${currentVersion} to ${latestVersion}`);
    expect(mockInstallCommand).toHaveBeenCalledWith(['typescript', 'react', 'general']);
    expect(mockConsoleLog).toHaveBeenCalledWith('Rules updated successfully.');
  });

  it('should not update when already up to date', async () => {
    const version = '1.0.0';

    mockGetCurrentVersion.mockResolvedValue(version);
    mockGetLatestVersion.mockResolvedValue(version);

    await updateCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Checking for updates...');
    expect(mockConsoleLog).toHaveBeenCalledWith('Rules are already up to date.');
    expect(mockInstallCommand).not.toHaveBeenCalled();
  });

  it('should handle unique categories correctly', async () => {
    const currentVersion = '1.0.0';
    const latestVersion = '1.1.0';
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'typescript', name: 'react-components', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'react', name: 'component-standards', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockGetCurrentVersion.mockResolvedValue(currentVersion);
    mockGetLatestVersion.mockResolvedValue(latestVersion);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockInstallCommand.mockResolvedValue(undefined);

    await updateCommand();

    // Should only install unique categories
    expect(mockInstallCommand).toHaveBeenCalledWith(['typescript', 'react']);
  });

  it('should handle version check errors', async () => {
    const error = new Error('Network error');
    mockGetCurrentVersion.mockRejectedValue(error);

    await updateCommand();

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Network error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle install command errors', async () => {
    const currentVersion = '1.0.0';
    const latestVersion = '1.1.0';
    const availableRules = [
      { category: 'typescript', name: 'strict-types', description: undefined, globs: undefined, alwaysApply: undefined }
    ];
    const installError = new Error('Install failed');

    mockGetCurrentVersion.mockResolvedValue(currentVersion);
    mockGetLatestVersion.mockResolvedValue(latestVersion);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockInstallCommand.mockRejectedValue(installError);

    await updateCommand();

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Install failed');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle empty rules list', async () => {
    const currentVersion = '1.0.0';
    const latestVersion = '1.1.0';
    const availableRules: any[] = [];

    mockGetCurrentVersion.mockResolvedValue(currentVersion);
    mockGetLatestVersion.mockResolvedValue(latestVersion);
    mockListAvailableRules.mockResolvedValue(availableRules);
    mockInstallCommand.mockResolvedValue(undefined);

    await updateCommand();

    expect(mockInstallCommand).toHaveBeenCalledWith([]);
    expect(mockConsoleLog).toHaveBeenCalledWith('Rules updated successfully.');
  });
}); 