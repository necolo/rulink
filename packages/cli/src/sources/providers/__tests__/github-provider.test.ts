import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exec } from 'child_process';
import { GitHubSourceProvider } from '../github-provider';
import * as auth from '../../../utils/auth';
import type { GitHubSourceConfig } from '../../../config/types';

// Mock child_process module
vi.mock('child_process', () => ({
    exec: vi.fn((command, callback) => callback(null, 'stdout', 'stderr')),
}));

// Mock fetch
global.fetch = vi.fn();

describe('GitHubSourceProvider', () => {
    let provider: GitHubSourceProvider;
    const mockExec = vi.mocked(exec);
    const mockFetch = global.fetch as any;
    const mockConfig: GitHubSourceConfig = {
        type: 'github',
        name: 'test-github',
        url: 'https://github.com/user/repo/tree/main/rules',
    };

    beforeEach(() => {
        provider = new GitHubSourceProvider(mockConfig);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('parseGitHubUrl', () => {
        it('should parse short GitHub URL', () => {
            const config = {
                type: 'github' as const,
                name: 'test-github-short',
                url: 'github.com/user/repo',
            };
            const shortProvider = new GitHubSourceProvider(config);
            const result = (shortProvider as any).parseGitHubUrl(config.url);
            expect(result).toEqual({
                owner: 'user',
                repo: 'repo',
                branch: 'main',
                path: '',
            });
        });
        // Other parse tests from original file...
        it('should parse https GitHub URL with branch and path', () => {
            const config = {
                type: 'github' as const,
                name: 'test-github-https',
                url: 'https://github.com/user/repo/tree/develop/src/rules',
            };
            const httpsProvider = new GitHubSourceProvider(config);
            const result = (httpsProvider as any).parseGitHubUrl(config.url);
            expect(result).toEqual({
                owner: 'user',
                repo: 'repo',
                branch: 'develop',
                path: 'src/rules'
            });
        });
        it('should handle missing branch and path', () => {
            const config = {
                type: 'github' as const,
                name: 'test',
                url: 'github.com/user/repo'
            };
            const noBranchProvider = new GitHubSourceProvider(config);
            const result = (noBranchProvider as any).parseGitHubUrl(config.url);
            expect(result.branch).toBe('main');
            expect(result.path).toBe('');
        });
        it('should parse GitHub URL with tree path', () => {
            const config = {
                type: 'github' as const,
                name: 'test-tree',
                url: 'https://github.com/user/repo/tree/feature-branch/src/rules'
            };
            const treeProvider = new GitHubSourceProvider(config);
            const result = (treeProvider as any).parseGitHubUrl(config.url);
            expect(result).toEqual({
                owner: 'user',
                repo: 'repo',
                branch: 'feature-branch',
                path: 'src/rules'
            });
        });
        it('should parse GitHub URL with blob path', () => {
            const config = {
                type: 'github' as const,
                name: 'test-blob',
                url: 'https://github.com/user/repo/blob/main/README.md'
            };
            const blobProvider = new GitHubSourceProvider(config);
            const result = (blobProvider as any).parseGitHubUrl(config.url);
            expect(result).toEqual({
                owner: 'user',
                repo: 'repo',
                branch: 'main',
                path: 'README.md'
            });
        });
    });

    describe('validateSource', () => {
        it('should validate source via GitHub API', async () => {
            vi.spyOn(auth, 'getGitCredentials').mockResolvedValue({ token: 'test-token' });
            const authHeadersSpy = vi.spyOn(auth, 'createAuthHeaders').mockReturnValue({ Authorization: 'token test-token' });
            
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ type: 'file', name: 'style.mdc' }]),
            });

            const result = await provider.validateSource();

            expect(result.valid).toBe(true);
            expect(authHeadersSpy).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/user/repo/contents/rules?ref=main',
                expect.objectContaining({
                    headers: { Authorization: 'token test-token' },
                })
            );
        });

        it('should fallback to git clone when other methods fail', async () => {
            // API call fails
            mockFetch.mockResolvedValue({ ok: false, status: 500 });

            mockExec.mockImplementation((command, callback) => {
                callback(null, 'stdout', 'stderr');
            });

            const result = await provider.validateSource();

            expect(result.valid).toBe(true);
            expect(mockExec).toHaveBeenCalled();
        });
    });

    describe('listRules', () => {
        it('should handle API failures and fallback to git clone', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 500 });
            
            // Mock local provider dependency for git clone path
            vi.doMock('../local-provider.js', () => ({
                LocalSourceProvider: vi.fn(() => ({
                    listRules: () => Promise.resolve([{ name: 'cloned-rule', category: 'cloned' }])
                }))
            }));

            mockExec.mockImplementation((command, callback) => {
                callback(null, 'stdout', 'stderr');
            });

            const result = await provider.listRules();
            
            expect(result).toEqual([{ name: 'cloned-rule', category: 'cloned' }]);
            expect(mockExec).toHaveBeenCalled();
        });
    });

    describe('getRuleContent', () => {
        it('should fallback to git clone when raw access fails', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 500 });

            // Mock local provider dependency for git clone path
             vi.doMock('../local-provider.js', () => ({
                LocalSourceProvider: vi.fn(() => ({
                    getRuleContent: () => Promise.resolve('# cloned content')
                }))
            }));
            
            mockExec.mockImplementation((command, callback) => {
                callback(null, 'stdout', 'stderr');
            });

            const result = await provider.getRuleContent('some-rule.mdc');

            expect(result).toBe('# cloned content');
            expect(mockExec).toHaveBeenCalled();
        });
    });
});
