import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { statusCommand } from '../status';
import { promises as fs } from 'fs';
import { findProjectRoot } from '../../utils/project-detector';
import { SourceManager } from '../../sources/source-manager';
import { RuleMetadata } from '../../types';

// Mock modules
vi.mock('fs');
vi.mock('../../utils/project-detector');
vi.mock('../../sources/source-manager');

vi.mock('picocolors', () => ({
    default: {
        red: (text: string) => text,
        blue: (text: string) => text,
        green: (text: string) => text,
        yellow: (text: string) => text,
        dim: (text: string) => text,
    },
}));

describe('status command', () => {
    let mockExit: any;
    let mockConsoleLog: any;
    let mockConsoleError: any;

    const mockReaddir = vi.mocked(fs.readdir);
    const mockFindProjectRoot = vi.mocked(findProjectRoot);

    beforeEach(() => {
        vi.clearAllMocks();
        mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should show status of installed rules', async () => {
        const projectRoot = '/home/user/project';
        const installedFiles = ['strict-types.mdc', 'component-standards.mdc', 'other-file.txt'];
        const availableRules: RuleMetadata[] = [
            { name: 'strict-types', description: 'Enforces strict TypeScript settings', category: 'typescript' },
            { name: 'component-standards', description: 'React component standards', category: 'react' },
            { name: 'code-style', description: 'General code style rules', category: 'general' },
        ];

        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockReaddir.mockResolvedValue(installedFiles as any);
        vi.mocked(SourceManager.prototype.listRules).mockResolvedValue(availableRules);

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
        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockReaddir.mockResolvedValue([]);
        await statusCommand();
        expect(mockConsoleLog).toHaveBeenCalledWith('No rules installed.');
    });

    it('should handle all rules installed', async () => {
        const projectRoot = '/home/user/project';
        const installedFiles = ['strict-types.mdc', 'code-style.mdc'];
        const availableRules: RuleMetadata[] = [
            { name: 'strict-types', description: 'Enforces strict TypeScript settings', category: 'typescript' },
            { name: 'code-style', description: 'General code style rules', category: 'general' },
        ];

        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockReaddir.mockResolvedValue(installedFiles as any);
        vi.mocked(SourceManager.prototype.listRules).mockResolvedValue(availableRules);

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
        expect(mockConsoleError).toHaveBeenCalledWith(`Error: ${error}`);
        expect(mockExit).toHaveBeenCalledWith(1);
    });
}); 