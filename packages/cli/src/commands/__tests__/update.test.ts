import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updateCommand } from '../update';
import { promises as fs } from 'fs';
import { findProjectRoot } from '../../utils/project-detector';
import { installCommand } from '../install';

// Mock modules
vi.mock('fs');
vi.mock('../../utils/project-detector');
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
    const mockFindProjectRoot = vi.mocked(findProjectRoot);
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

    it('should reinstall all existing rules', async () => {
        const projectRoot = '/home/user/project';
        const installedFiles = ['rule1.mdc', 'rule2.mdc', 'not-a-rule.txt'];

        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockAccess.mockResolvedValue(undefined);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockInstallCommand.mockResolvedValue(undefined);

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('Updating installed rules...');
        expect(mockConsoleLog).toHaveBeenCalledWith('Found 2 installed rule(s). Reinstalling...');
        expect(mockInstallCommand).toHaveBeenCalledWith(['rule1.mdc', 'rule2.mdc']);
        expect(mockConsoleLog).toHaveBeenCalledWith('Rules updated successfully.');
    });

    it('should handle no project root', async () => {
        mockFindProjectRoot.mockResolvedValue(null);
        await updateCommand();
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Could not find project root.');
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle no rules directory', async () => {
        const projectRoot = '/home/user/project';
        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockAccess.mockRejectedValue(new Error('ENOENT'));

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('No rules directory found. Nothing to update.');
        expect(mockInstallCommand).not.toHaveBeenCalled();
    });

    it('should handle no installed rules', async () => {
        const projectRoot = '/home/user/project';
        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockAccess.mockResolvedValue(undefined);
        mockReaddir.mockResolvedValue([]);

        await updateCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith('No rules installed. Nothing to update.');
        expect(mockInstallCommand).not.toHaveBeenCalled();
    });

    it('should handle errors during reinstall', async () => {
        const projectRoot = '/home/user/project';
        const installedFiles = ['rule1.mdc'];
        const installError = new Error('Install failed');

        mockFindProjectRoot.mockResolvedValue(projectRoot);
        mockAccess.mockResolvedValue(undefined);
        mockReaddir.mockResolvedValue(installedFiles as any);
        mockInstallCommand.mockRejectedValue(installError);

        await updateCommand();

        expect(mockConsoleError).toHaveBeenCalledWith(`Error: ${installError}`);
        expect(mockExit).toHaveBeenCalledWith(1);
    });
}); 