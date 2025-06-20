import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installCommand } from '../install.js';
import type { InstallOptions } from '../../types.js';
import { promises as fs } from 'fs';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn(),
  }
}));
vi.mock('../../utils/project-detector.js', () => ({
  findProjectRoot: vi.fn(),
  ensureRulesDirectory: vi.fn()
}));

vi.mock('../../sources/source-manager.js', () => ({
  sourceManager: {
    validateRulePath: vi.fn(),
    getRuleContent: vi.fn(),
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

import { findProjectRoot, ensureRulesDirectory } from '../../utils/project-detector.js';
import { sourceManager } from '../../sources/source-manager.js';

const mockFindProjectRoot = vi.mocked(findProjectRoot);
const mockEnsureRulesDirectory = vi.mocked(ensureRulesDirectory);
const mockWriteFile = vi.mocked(fs.writeFile);
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
    const projectRoot = '/home/user/project';
    const rulesPath = '/home/user/project/.cursor/rules';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(rulesPath);
    mockSourceManager.validateRulePath.mockResolvedValue({ valid: true });
    mockSourceManager.getRuleContent.mockImplementation(async (rulePath) => `content for ${rulePath}`);
    mockWriteFile.mockResolvedValue(undefined);

    await installCommand(rulePaths, options);

    expect(mockFindProjectRoot).toHaveBeenCalledWith(process.cwd());
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

    expect(mockFindProjectRoot).not.toHaveBeenCalled();
    expect(mockEnsureRulesDirectory).toHaveBeenCalledWith(targetPath);
  });

  it('should exit when no project root found', async () => {
    const rulePaths = ['typescript/style.mdc'];
    const options: InstallOptions = {};

    mockFindProjectRoot.mockResolvedValue(null);

    await installCommand(rulePaths, options);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Could not find project root. Use --to option to specify target path.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle dry run mode', async () => {
    const rulePaths = ['typescript/style.mdc', 'react/ts-react.mdc'];
    const options: InstallOptions = { dryRun: true };
    const projectRoot = '/home/user/project';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
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
    const projectRoot = '/home/user/project';

    mockFindProjectRoot.mockResolvedValue(projectRoot);
    mockEnsureRulesDirectory.mockResolvedValue(`${projectRoot}/.cursor/rules`);
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

    mockFindProjectRoot.mockRejectedValue(error);

    await installCommand(rulePaths, options);

    expect(mockConsoleError).toHaveBeenCalledWith(`Error: ${error}`);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 