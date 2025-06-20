import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sourceAddCommand, sourceListCommand, sourceUseCommand, sourceRemoveCommand } from '../source';
import { AnySourceConfig as SourceConfig } from '../../config/types';

vi.mock('../../sources/source-manager.js', () => ({
    sourceManager: {
        addSource: vi.fn(),
        listSources: vi.fn(),
        getActiveSource: vi.fn(),
        setActiveSource: vi.fn(),
        removeSource: vi.fn(),
    }
}));

import { sourceManager } from '../../sources/source-manager.js';

const mockSourceManager = vi.mocked(sourceManager);

describe('source commands', () => {
    let consoleLogSpy: any;
    let processExitSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code): never => {
            throw new Error(`process.exit called with ${code}`);
        });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('sourceAddCommand', () => {
        it('should add a source and log success', async () => {
            mockSourceManager.addSource.mockResolvedValue({
                name: 'test-source',
                config: { name: 'test-source', type: 'local', path: '/test' },
            });
            mockSourceManager.listSources.mockResolvedValue({});

            await sourceAddCommand('/test', {});

            expect(mockSourceManager.addSource).toHaveBeenCalledWith('/test', {});
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Successfully added source: test-source'));
        });
    });

    describe('sourceListCommand', () => {
        it('should list sources if they exist', async () => {
            const sources: Record<string, SourceConfig> = {
                'source1': { name: 'source1', type: 'local', path: '/path1' },
                'source2': { name: 'source2', type: 'github', url: 'url2' }
            };
            mockSourceManager.listSources.mockResolvedValue(sources);
            mockSourceManager.getActiveSource.mockResolvedValue(sources['source1']);
            
            await sourceListCommand();

            expect(mockSourceManager.listSources).toHaveBeenCalled();
            expect(mockSourceManager.getActiveSource).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configured Sources:'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('source1 (active)'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('source2'));
        });

        it('should show a message when no sources are configured', async () => {
            mockSourceManager.listSources.mockResolvedValue({});
            mockSourceManager.getActiveSource.mockResolvedValue(null);

            await sourceListCommand();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No sources configured.'));
        });
    });

    describe('sourceUseCommand', () => {
        it('should set the active source', async () => {
            mockSourceManager.setActiveSource.mockResolvedValue(undefined);

            await sourceUseCommand('new-active-source');

            expect(mockSourceManager.setActiveSource).toHaveBeenCalledWith('new-active-source');
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Active source set to: new-active-source'));
        });
    });

    describe('sourceRemoveCommand', () => {
        it('should remove a source', async () => {
            mockSourceManager.removeSource.mockResolvedValue(undefined);

            await sourceRemoveCommand('source-to-remove');

            expect(mockSourceManager.removeSource).toHaveBeenCalledWith('source-to-remove');
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Removed source: source-to-remove'));
        });
    });
}); 