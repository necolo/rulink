import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { NpmSourceProvider } from '../npm-provider';
import type { NpmSourceConfig } from '../../../config/types';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs', () => ({
    promises: {
        readdir: vi.fn(),
        readFile: vi.fn(),
    },
}));

global.fetch = vi.fn();

describe('NpmSourceProvider', () => {
    let provider: NpmSourceProvider;
    const mockExec = vi.mocked(exec);
    const mockFsReaddir = vi.mocked(fs.readdir);
    const mockFsReadFile = vi.mocked(fs.readFile);
    const mockFetch = global.fetch as any;
    const mockConfig: NpmSourceConfig = {
        type: 'npm',
        name: 'test-npm',
        package: '@test/cursor-rules',
    };

    beforeEach(() => {
        provider = new NpmSourceProvider(mockConfig);
        vi.clearAllMocks();
        // Default exec mock for success
        mockExec.mockImplementation((command: string, callback: any) => {
            callback(null, 'stdout', 'stderr');
            return {} as any;
        });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('validateSource', () => {
        it('should validate existing npm package', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ name: 'test' }) });
            mockFsReaddir.mockResolvedValue([{ isFile: () => true, name: 'style.mdc' }] as any);
            const result = await provider.validateSource();
            expect(result.valid).toBe(true);
        });

        it('should reject packages without .mdc files', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ name: 'test' }) });
            mockFsReaddir.mockResolvedValue([{ isFile: () => false, isDirectory: () => true, name: 'not-a-rule' }] as any);
            const result = await provider.validateSource();
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Package does not contain .mdc files');
        });
    });

    describe('listRules', () => {
        it('should list rules from npm package', async () => {
            mockFsReaddir
                .mockResolvedValueOnce([
                    { isFile: () => true, isDirectory: () => false, name: 'style.mdc' },
                    { isFile: () => false, isDirectory: () => true, name: 'typescript' },
                ] as any)
                .mockResolvedValueOnce([
                    { isFile: () => true, isDirectory: () => false, name: 'best-practices.mdc' },
                ] as any);

            const result = await provider.listRules();
            expect(result).toHaveLength(2);
        });

        it('should handle npm installation errors', async () => {
            const installError = new Error('npm install failed');
            mockExec.mockImplementation((command: string, callback: any) => {
                if (command.includes('npm install')) {
                    callback(installError, '', '');
                } else {
                    callback(null, '', '');
                }
                return {} as any;
            });
            const result = await provider.listRules();
            expect(result).toEqual([]);
        });
    });

    describe('getRuleContent', () => {
        it('should get rule content from npm package', async () => {
            mockFsReadFile.mockResolvedValue('# Test Rule');
            const result = await provider.getRuleContent('style.mdc');
            expect(result).toBe('# Test Rule');
        });

        it('should handle categorized rule paths', async () => {
            mockFsReadFile.mockResolvedValue('# Test Rule');
            await provider.getRuleContent('typescript/best-practices.mdc');
            expect(mockFsReadFile).toHaveBeenCalledWith(expect.stringContaining('typescript/best-practices.mdc'), 'utf8');
        });

        it('should handle file read errors', async () => {
            mockFsReadFile.mockRejectedValue(new Error('File not found'));
            await expect(provider.getRuleContent('non-existent.mdc')).rejects.toThrow(/Failed to get rule content/);
        });
    });
}); 