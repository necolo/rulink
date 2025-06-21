import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { removeCommand } from '../remove';
import { promises as fs } from 'fs';
import { findActiveRulesDirectory, validateRulesDirectoryPath } from '../../utils/rules-utils';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    unlink: vi.fn(),
  },
  readFileSync: vi.fn(() => '{"version": "0.2.2"}')
}));

vi.mock('../../utils/rules-utils.js', () => ({
  findActiveRulesDirectory: vi.fn(),
  validateRulesDirectoryPath: vi.fn(),
}));

vi.mock('picocolors', () => ({
    default: {
        red: (text: string) => text,
        blue: (text: string) => text,
        green: (text: string) => text,
        yellow: (text: string) => text,
        dim: (text: string) => text,
    },
}));

describe('remove command', () => {
    let mockExit: any;
    let mockConsoleLog: any;
    let mockConsoleError: any;

    const mockUnlink = vi.mocked(fs.unlink);
    const mockFindActiveRulesDirectory = vi.mocked(findActiveRulesDirectory);
    const mockValidateRulesDirectoryPath = vi.mocked(validateRulesDirectoryPath);

    beforeEach(() => {
        vi.clearAllMocks();
        mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should remove rules successfully', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockUnlink.mockResolvedValue(undefined);

        await removeCommand(['style.mdc', 'component-standards']);

        expect(mockUnlink).toHaveBeenCalledWith('/test/project/.cursor/rules/style.mdc');
        expect(mockUnlink).toHaveBeenCalledWith('/test/project/.cursor/rules/component-standards.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: style.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: component-standards.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Successfully removed 2 rule(s).');
    });

    it('should handle rules directory not found', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(false);

        await removeCommand(['style.mdc']);

        expect(mockConsoleError).toHaveBeenCalledWith('Error: No rules directory found in this project.');
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle file not found', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockUnlink.mockRejectedValue(new Error('ENOENT'));

        await removeCommand(['nonexistent.mdc']);

        expect(mockConsoleLog).toHaveBeenCalledWith('File not found: nonexistent.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('No rules were removed.');
    });

    it('should handle mixed results', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockUnlink
            .mockResolvedValueOnce(undefined)  // First file succeeds
            .mockRejectedValueOnce(new Error('ENOENT'));  // Second file fails

        await removeCommand(['existing.mdc', 'nonexistent.mdc']);

        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: existing.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('File not found: nonexistent.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Successfully removed 1 rule(s).');
    });

    it('should handle rule paths with directories', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockUnlink.mockResolvedValue(undefined);

        await removeCommand(['typescript/style.mdc', 'react/component-standards.mdc']);

        expect(mockUnlink).toHaveBeenCalledWith('/test/project/.cursor/rules/style.mdc');
        expect(mockUnlink).toHaveBeenCalledWith('/test/project/.cursor/rules/component-standards.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: style.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: component-standards.mdc');
    });

    it('should handle rules without .mdc extension', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockValidateRulesDirectoryPath.mockResolvedValue(true);
        mockUnlink.mockResolvedValue(undefined);

        await removeCommand(['style', 'component-standards']);

        expect(mockUnlink).toHaveBeenCalledWith('/test/project/.cursor/rules/style.mdc');
        expect(mockUnlink).toHaveBeenCalledWith('/test/project/.cursor/rules/component-standards.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: style.mdc');
        expect(mockConsoleLog).toHaveBeenCalledWith('Removed: component-standards.mdc');
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('Permission denied');
        
        mockFindActiveRulesDirectory.mockRejectedValue(error);

        await removeCommand(['style.mdc']);

        expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
        expect(mockExit).toHaveBeenCalledWith(1);
    });
}); 