import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updateCommand } from '../update';
import { promises as fs } from 'fs';
import { createInterface } from 'readline';
import { findActiveRulesDirectory, validateRulesDirectoryPath } from '../../utils/rules-utils';
import { sourceManager } from '../../sources/source-manager';
import { installCommand } from '../install';
import type { RuleMetadata } from '../../types';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    readdir: vi.fn(),
  },
  readFileSync: vi.fn(() => '{"version": "0.2.2", "name": "rulink"}')
}));
vi.mock('readline', () => ({
  createInterface: vi.fn()
}));
vi.mock('../../utils/rules-utils', () => ({
  findActiveRulesDirectory: vi.fn(),
  validateRulesDirectoryPath: vi.fn()
}));
vi.mock('../../sources/source-manager', () => ({
  sourceManager: {
    listRules: vi.fn()
  }
}));
vi.mock('../install');

vi.mock('picocolors', () => ({
    default: {
        red: (text: string) => text,
        blue: (text: string) => text,
        green: (text: string) => text,
        yellow: (text: string) => text,
        dim: (text: string) => text,
    },
}));

describe('update command', () => {
    let mockExit: any;
    let mockConsoleLog: any;
    let mockConsoleError: any;

    const mockAccess = vi.mocked(fs.access);
    const mockReaddir = vi.mocked(fs.readdir);
    const mockCreateInterface = vi.mocked(createInterface);
    const mockFindActiveRulesDirectory = vi.mocked(findActiveRulesDirectory);
    const mockValidateRulesDirectoryPath = vi.mocked(validateRulesDirectoryPath);
    const mockSourceManagerListRules = vi.mocked(sourceManager.listRules);
    const mockInstallCommand = vi.mocked(installCommand);

    beforeEach(() => {
        vi.clearAllMocks();
        mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should update rules with exact matches', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        const installedFiles = ['style.mdc', 'basic-principles.mdc'];
        const availableRules: RuleMetadata[] = [
            { name: 'style', category: 'typescript', description: 'TypeScript style rules' },
            { name: 'basic-principles', category: 'general', description: 'Basic principles' },
        ];

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockSourceManagerListRules.mockResolvedValue(availableRules);
        mockInstallCommand.mockResolvedValue(undefined);

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('Updating installed rules...');
        expect(mockConsoleLog).toHaveBeenCalledWith(`Found 2 installed rule(s) in ${projectRoot} (project rules)`);
        expect(mockInstallCommand).toHaveBeenCalledWith(['typescript/style.mdc', 'general/basic-principles.mdc']);
        expect(mockConsoleLog).toHaveBeenCalledWith('Rules updated successfully.');
    });

    it('should handle rules with conflicts and mock user input', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        const installedFiles = ['style.mdc'];
        const availableRules: RuleMetadata[] = [
            { name: 'style', category: 'typescript', description: 'TypeScript style rules' },
            { name: 'style', category: 'react', description: 'React style rules' },
        ];

        // Mock readline interface
        const mockRl = {
            question: vi.fn(),
            close: vi.fn()
        };
        mockCreateInterface.mockReturnValue(mockRl as any);

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockSourceManagerListRules.mockResolvedValue(availableRules);
        mockInstallCommand.mockResolvedValue(undefined);

        // Mock user selecting first option
        mockRl.question.mockImplementation((prompt: string, callback: (answer: string) => void) => {
            callback('1');
        });

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('\nMultiple rules found for style.mdc:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  1. typescript/style.mdc - TypeScript style rules');
        expect(mockConsoleLog).toHaveBeenCalledWith('  2. react/style.mdc - React style rules');
        expect(mockInstallCommand).toHaveBeenCalledWith(['typescript/style.mdc']);
    });

    it('should handle user skipping conflicted rules', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        const installedFiles = ['style.mdc'];
        const availableRules: RuleMetadata[] = [
            { name: 'style', category: 'typescript', description: 'TypeScript style rules' },
            { name: 'style', category: 'react', description: 'React style rules' },
        ];

        // Mock readline interface
        const mockRl = {
            question: vi.fn(),
            close: vi.fn()
        };
        mockCreateInterface.mockReturnValue(mockRl as any);

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockSourceManagerListRules.mockResolvedValue(availableRules);
        mockInstallCommand.mockResolvedValue(undefined);

        // Mock user selecting skip option
        mockRl.question.mockImplementation((prompt: string, callback: (answer: string) => void) => {
            callback('3'); // Skip option
        });

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('⚠ Skipped style.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('No rules were updated.');
        expect(mockInstallCommand).not.toHaveBeenCalled();
    });

    it('should handle rules not found in source', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        const installedFiles = ['old-rule.mdc', 'style.mdc'];
        const availableRules: RuleMetadata[] = [
            { name: 'style', category: 'typescript', description: 'TypeScript style rules' },
        ];

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockSourceManagerListRules.mockResolvedValue(availableRules);
        mockInstallCommand.mockResolvedValue(undefined);

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('\nRules not found in source (may have been removed):');
        expect(mockConsoleLog).toHaveBeenCalledWith('  - old-rule.mdc');
        expect(mockInstallCommand).toHaveBeenCalledWith(['typescript/style.mdc']);
        expect(mockConsoleLog).toHaveBeenCalledWith('\nSummary: 1 updated, 1 not found');
    });

    it('should handle no rules directory', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(false);

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('No rules directory found in this project. Nothing to update.');
        expect(mockInstallCommand).not.toHaveBeenCalled();
    });

    it('should handle no installed rules', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockReaddir.mockResolvedValue([]);

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('No rules installed. Nothing to update.');
        expect(mockInstallCommand).not.toHaveBeenCalled();
    });

    it('should handle errors during source listing', async () => {
        const projectRoot = '/home/user/project';
        const rulesPath = `${projectRoot}/.cursor/rules`;
        const installedFiles = ['style.mdc'];
        const listError = new Error('Failed to list rules');

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockSourceManagerListRules.mockRejectedValue(listError);

        await updateCommand();

        expect(mockConsoleError).toHaveBeenCalledWith(`Error listing available rules: ${listError}`);
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle errors during directory search', async () => {
        const error = new Error('Permission denied');
        
        mockFindActiveRulesDirectory.mockRejectedValue(error);

        await updateCommand();

        expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
        expect(mockExit).toHaveBeenCalledWith(1);
    });
}); 