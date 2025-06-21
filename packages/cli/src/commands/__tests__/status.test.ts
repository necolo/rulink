import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { statusCommand } from '../status';
import { SourceManager } from '../../sources/source-manager';
import { RuleMetadata } from '../../types';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
  },
  readFileSync: vi.fn(() => '{"version": "0.2.2"}')
}));

vi.mock('../../utils/rules-utils.js', () => ({
  findActiveRulesDirectory: vi.fn(),
}));

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

import { promises as fs } from 'fs';
import { findActiveRulesDirectory } from '../../utils/rules-utils';

describe('status command', () => {
    let mockExit: any;
    let mockConsoleLog: any;
    let mockConsoleError: any;

    const mockReaddir = vi.mocked(fs.readdir);
    const mockFindActiveRulesDirectory = vi.mocked(findActiveRulesDirectory);

    beforeEach(() => {
        vi.clearAllMocks();
        mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should show status of installed rules with local rules', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/current/.cursor/rules';
        const installedFiles = ['strict-types.mdc', 'component-standards.mdc', 'other-file.txt'];
        const availableRules: RuleMetadata[] = [
            { name: 'strict-types', description: 'Enforces strict TypeScript settings', category: 'typescript' },
            { name: 'component-standards', description: 'React component standards', category: 'react' },
            { name: 'code-style', description: 'General code style rules', category: 'general' },
        ];

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'local',
            projectRoot
        });
        mockReaddir.mockResolvedValue(installedFiles as any);
        vi.mocked(SourceManager.prototype.listRules).mockResolvedValue(availableRules);

        await statusCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith(`Cursor Rules Status for: ${projectRoot} (local rules)`);
        expect(mockConsoleLog).toHaveBeenCalledWith('Installed rules:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ strict-types');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ component-standards');
        expect(mockConsoleLog).toHaveBeenCalledWith('Available but not installed:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  - code-style');
    });

    it('should show status of installed rules with project rules', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        const installedFiles = ['strict-types.mdc'];
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockReaddir.mockResolvedValue(installedFiles as any);
        vi.mocked(SourceManager.prototype.listRules).mockResolvedValue([]);

        await statusCommand();

        expect(mockConsoleLog).toHaveBeenCalledWith(`Cursor Rules Status for: ${projectRoot} (project rules)`);
        expect(mockConsoleLog).toHaveBeenCalledWith('Installed rules:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ strict-types');
    });

    it('should handle no rules directory', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockReaddir.mockRejectedValue(new Error('ENOENT'));
        
        await statusCommand();
        expect(mockConsoleLog).toHaveBeenCalledWith('No rules directory found in this project.');
    });

    it('should handle no installed rules', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        
        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
        mockReaddir.mockResolvedValue([]);
        
        await statusCommand();
        expect(mockConsoleLog).toHaveBeenCalledWith('No rules installed.');
    });

    it('should handle all rules installed', async () => {
        const projectRoot = '/test/project';
        const rulesPath = '/test/project/.cursor/rules';
        const installedFiles = ['strict-types.mdc', 'code-style.mdc'];
        const availableRules: RuleMetadata[] = [
            { name: 'strict-types', description: 'Enforces strict TypeScript settings', category: 'typescript' },
            { name: 'code-style', description: 'General code style rules', category: 'general' },
        ];

        mockFindActiveRulesDirectory.mockResolvedValue({
            path: rulesPath,
            source: 'project',
            projectRoot
        });
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
        
        mockFindActiveRulesDirectory.mockRejectedValue(error);
        
        await statusCommand();
        
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Permission denied');
        expect(mockExit).toHaveBeenCalledWith(1);
    });
}); 