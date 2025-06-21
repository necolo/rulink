import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installCommand } from '../install';
import type { InstallOptions } from '../../types';
import { promises as fs } from 'fs';

// Mock modules
vi.mock('../../utils/project-detector.js', () => ({
  getProjectRoot: vi.fn()
}));

vi.mock('../../utils/rules-utils.js', () => ({
  ensureRulesDirectory: vi.fn()
}));

vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn(),
    access: vi.fn(),
  }
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/Users/testuser')
}));

vi.mock('../../sources/source-manager.js', () => ({
  sourceManager: {
    validateRulePath: vi.fn(),
    getRuleContent: vi.fn(),
    listRules: vi.fn(),
    expandRulePath: vi.fn(),
    getRulesByCategory: vi.fn(),
  }
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
vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

import { getProjectRoot } from '../../utils/project-detector';
import { ensureRulesDirectory } from '../../utils/rules-utils';
import { sourceManager } from '../../sources/source-manager';

const mockGetProjectRoot = vi.mocked(getProjectRoot);
const mockEnsureRulesDirectory = vi.mocked(ensureRulesDirectory);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockFsAccess = vi.mocked(fs.access);
const mockExit = vi.mocked(process.exit);
const mockConsoleLog = vi.mocked(console.log);
const mockConsoleError = vi.mocked(console.error);
const mockSourceManager = vi.mocked(sourceManager);


describe('install command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should install rules successfully', async () => {
    const rulePaths = ['typescript/style.mdc', 'react/ts-react.mdc'];
    const options: InstallOptions = {};
    const projectRoot = process.cwd(); // Will use current directory since no git root found
    const rulesPath = `${projectRoot}/.cursor/rules`;

    // Mock that no .git folder is found, so it uses current directory
    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => [rulePath]);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);
    mockWriteFile.mockResolvedValue(undefined);

    await installCommand(rulePaths, options);

    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(projectRoot);
    
    expect(mockSourceManager.validateRulePath).toHaveBeenCalledWith('typescript/style.mdc');
    expect(mockSourceManager.getRuleContent).toHaveBeenCalledWith('typescript/style.mdc', undefined);
    expect(mockWriteFile).toHaveBeenCalledWith(`${rulesPath}/style.mdc`, 'content for typescript/style.mdc', 'utf8');

    expect(mockSourceManager.validateRulePath).toHaveBeenCalledWith('react/ts-react.mdc');
    expect(mockSourceManager.getRuleContent).toHaveBeenCalledWith('react/ts-react.mdc', undefined);
    expect(mockWriteFile).toHaveBeenCalledWith(`${rulesPath}/ts-react.mdc`, 'content for react/ts-react.mdc', 'utf8');

    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully installed 2 rule(s):');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - typescript/style.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - react/ts-react.mdc');
  });

  it('should use target path when provided', async () => {
    const rulePaths = ['typescript/style.mdc'];
    const targetPath = '/custom/path';
    const options: InstallOptions = { targetPath };

    mockEnsureRulesDirectory.mockResolvedValue(`${targetPath}/.cursor/rules`);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockResolvedValue('content');

    await installCommand(rulePaths, options);

    // Should not try to access .git when targetPath is provided
    expect(mockFsAccess).not.toHaveBeenCalled();
    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(targetPath);
  });

  it('should use current directory when no git root found', async () => {
    const rulePaths = ['typescript/style.mdc'];
    const options: InstallOptions = {};
    const currentDir = process.cwd();

    // Mock that no .git folder is found, so it uses current directory
    mockFsAccess.mockRejectedValue(new Error('No .git folder'));
    mockEnsureRulesDirectory.mockResolvedValue(`${currentDir}/.cursor/rules`);
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => [rulePath]);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockResolvedValue('content');

    await installCommand(rulePaths, options);

    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(currentDir);
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should use git root when found', async () => {
    const rulePaths = ['typescript/style.mdc'];
    const options: InstallOptions = {};
    const gitRoot = '/home/user/project';
    
    // Mock that .git folder is found at a specific path
    mockFsAccess.mockResolvedValueOnce(undefined); // .git found
    mockEnsureRulesDirectory.mockResolvedValue(`${gitRoot}/.cursor/rules`);
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => [rulePath]);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockResolvedValue('content');

    await installCommand(rulePaths, options);

    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(expect.stringMatching(/.*$/));
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle dry run mode', async () => {
    const rulePaths = ['typescript/style.mdc', 'react/ts-react.mdc'];
    const options: InstallOptions = { dryRun: true };
    const projectRoot = process.cwd();

    // Mock that no .git folder is found, so it uses current directory
    mockFsAccess.mockRejectedValue(new Error('No .git folder'));
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => [rulePath]);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => {
        if (rulePath === 'typescript/style.mdc') return 'content for typescript/style.mdc';
        if (rulePath === 'react/ts-react.mdc') return 'content for react/ts-react.mdc';
        return '';
    });

    await installCommand(rulePaths, options);

    expect(mockConsoleLog).toHaveBeenCalledWith('Dry run mode - no files will be modified');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Would install: typescript/style.mdc'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Would install: react/ts-react.mdc'));
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should handle verbose mode', async () => {
    const rulePaths = ['typescript/style.mdc'];
    const options: InstallOptions = { verbose: true };
    const projectRoot = process.cwd();

    // Mock that no .git folder is found, so it uses current directory
    mockFsAccess.mockRejectedValue(new Error('No .git folder'));
    mockEnsureRulesDirectory.mockResolvedValue(`${projectRoot}/.cursor/rules`);
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => [rulePath]);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockResolvedValue('content');
    
    await installCommand(rulePaths, options);

    expect(mockConsoleLog).toHaveBeenCalledWith(`Installing rules to: ${projectRoot}`);
    expect(mockConsoleLog).toHaveBeenCalledWith('Installed: typescript/style.mdc → style.mdc');
  });

  it('should handle errors gracefully', async () => {
    const rulePaths = ['typescript/style.mdc'];
    const options: InstallOptions = {};
    const error = new Error('Permission denied');

    // Mock fs.access to fail with an error during git root search
    mockFsAccess.mockRejectedValue(error);
    mockEnsureRulesDirectory.mockRejectedValue(error);

    await installCommand(rulePaths, options);

    expect(mockConsoleError).toHaveBeenCalledWith(`Error: ${error}`);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should install all rules from a folder when folder name provided', async () => {
    const rulePaths = ['typescript'];
    const options: InstallOptions = {};
    const projectRoot = process.cwd();
    const rulesPath = `${projectRoot}/.cursor/rules`;

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockSourceManager.expandRulePath.mockResolvedValue(['typescript/style.mdc', 'typescript/types.mdc']);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);
    mockWriteFile.mockResolvedValue(undefined);

    await installCommand(rulePaths, options);

    expect(mockSourceManager.expandRulePath).toHaveBeenCalledWith('typescript', undefined);
    expect(mockSourceManager.validateRulePath).toHaveBeenCalledWith('typescript/style.mdc');
    expect(mockSourceManager.validateRulePath).toHaveBeenCalledWith('typescript/types.mdc');
    expect(mockWriteFile).toHaveBeenCalledWith(`${rulesPath}/style.mdc`, 'content for typescript/style.mdc', 'utf8');
    expect(mockWriteFile).toHaveBeenCalledWith(`${rulesPath}/types.mdc`, 'content for typescript/types.mdc', 'utf8');
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully installed 2 rule(s):');
  });

  it('should install mixed folder and file paths', async () => {
    const rulePaths = ['typescript', 'general/basic.mdc'];
    const options: InstallOptions = {};
    const projectRoot = process.cwd();
    const rulesPath = `${projectRoot}/.cursor/rules`;

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => {
      if (rulePath === 'typescript') return ['typescript/style.mdc', 'typescript/types.mdc'];
      if (rulePath === 'general/basic.mdc') return ['general/basic.mdc'];
      return [];
    });
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);
    mockWriteFile.mockResolvedValue(undefined);

    await installCommand(rulePaths, options);

    expect(mockSourceManager.expandRulePath).toHaveBeenCalledWith('typescript', undefined);
    expect(mockSourceManager.expandRulePath).toHaveBeenCalledWith('general/basic.mdc', undefined);
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully installed 3 rule(s):');
  });

  it('should install rules from multiple folders', async () => {
    const rulePaths = ['typescript', 'general'];
    const options: InstallOptions = {};
    const projectRoot = process.cwd();
    const rulesPath = `${projectRoot}/.cursor/rules`;

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockSourceManager.expandRulePath.mockImplementation(async (rulePath) => {
      if (rulePath === 'typescript') return ['typescript/style.mdc', 'typescript/types.mdc'];
      if (rulePath === 'general') return ['general/basic.mdc'];
      return [];
    });
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);
    mockWriteFile.mockResolvedValue(undefined);

    await installCommand(rulePaths, options);

    expect(mockSourceManager.expandRulePath).toHaveBeenCalledWith('typescript', undefined);
    expect(mockSourceManager.expandRulePath).toHaveBeenCalledWith('general', undefined);
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully installed 3 rule(s):');
  });

  it('should handle folder-based installation in dry-run mode', async () => {
    const rulePaths = ['typescript'];
    const options: InstallOptions = { dryRun: true };
    const projectRoot = process.cwd();

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockSourceManager.expandRulePath.mockResolvedValue(['typescript/style.mdc', 'typescript/types.mdc']);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);

    await installCommand(rulePaths, options);

    expect(mockConsoleLog).toHaveBeenCalledWith('Dry run mode - no files will be modified');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Would install: typescript/style.mdc'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Would install: typescript/types.mdc'));
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should handle folder-based installation in verbose mode', async () => {
    const rulePaths = ['typescript'];
    const options: InstallOptions = { verbose: true };
    const projectRoot = process.cwd();
    const rulesPath = `${projectRoot}/.cursor/rules`;

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockSourceManager.expandRulePath.mockResolvedValue(['typescript/style.mdc', 'typescript/types.mdc']);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);
    mockWriteFile.mockResolvedValue(undefined);

    await installCommand(rulePaths, options);

    expect(mockConsoleLog).toHaveBeenCalledWith(`Installing rules to: ${projectRoot}`);
    expect(mockConsoleLog).toHaveBeenCalledWith('Installed: typescript/style.mdc → style.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('Installed: typescript/types.mdc → types.mdc');
  });

  it('should handle invalid folder names gracefully', async () => {
    const rulePaths = ['invalidfolder'];
    const options: InstallOptions = {};
    const projectRoot = process.cwd();

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockSourceManager.expandRulePath.mockRejectedValue(new Error("No rules found in category 'invalidfolder'"));

    await installCommand(rulePaths, options);

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Error expanding rule path 'invalidfolder'"));
    expect(mockConsoleLog).toHaveBeenCalledWith('No rules were installed.');
  });

  it('should handle empty folder scenarios', async () => {
    const rulePaths = ['emptyfolder'];
    const options: InstallOptions = {};
    const projectRoot = process.cwd();

    mockGetProjectRoot.mockResolvedValue(projectRoot);
    mockSourceManager.expandRulePath.mockRejectedValue(new Error("No rules found in category 'emptyfolder'"));

    await installCommand(rulePaths, options);

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Error expanding rule path 'emptyfolder'"));
    expect(mockConsoleLog).toHaveBeenCalledWith('No rules were installed.');
  });
}); 