import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listCommand } from '../list.js';

// Mock modules
vi.mock('../../sources/source-manager.js', () => ({
  sourceManager: {
    getActiveSource: vi.fn(),
    listRules: vi.fn(),
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

import { sourceManager } from '../../sources/source-manager.js';

const mockExit = vi.mocked(process.exit);
const mockConsoleLog = vi.mocked(console.log);
const mockConsoleError = vi.mocked(console.error);
const mockSourceManager = vi.mocked(sourceManager);

describe('list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list available rules grouped by category', async () => {
    const mockRules = [
      { category: 'typescript', name: 'strict-types', description: 'TypeScript strict typing' },
      { category: 'typescript', name: 'react-components', description: undefined },
      { category: 'react', name: 'component-standards', description: 'React component best practices' },
      { category: 'general', name: 'code-style', description: undefined },
      { category: 'default', name: 'default-rule', description: undefined },
    ];

    mockSourceManager.getActiveSource.mockResolvedValue({ name: 'test-source', path: '/path', type: 'local' });
    mockSourceManager.listRules.mockResolvedValue(mockRules);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Available Rules from test-source:');
    expect(mockConsoleLog).toHaveBeenCalledWith('typescript/');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - strict-types.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - react-components.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('react/');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - component-standards.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('general/');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - code-style.mdc');
    expect(mockConsoleLog).toHaveBeenCalledWith('default-rule.mdc');
  });

  it('should display rule descriptions when available', async () => {
    const mockRules = [
      { category: 'typescript', name: 'strict-types', description: 'TypeScript strict typing rules' }
    ];

    mockSourceManager.getActiveSource.mockResolvedValue({ name: 'test-source', path: '/path', type: 'local' });
    mockSourceManager.listRules.mockResolvedValue(mockRules);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('    TypeScript strict typing rules');
  });

  it('should handle empty rules list', async () => {
    mockSourceManager.getActiveSource.mockResolvedValue({ name: 'test-source', path: '/path', type: 'local' });
    mockSourceManager.listRules.mockResolvedValue([]);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Available Rules from test-source:');
    expect(mockConsoleLog).toHaveBeenCalledWith('No rules found in this source.');
  });

  it('should handle no active source', async () => {
    mockSourceManager.getActiveSource.mockResolvedValue(null);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('No active source configured.');
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to read rules');
    mockSourceManager.getActiveSource.mockRejectedValue(error);

    await listCommand();

    expect(mockConsoleError).toHaveBeenCalledWith(`Error: ${error}`);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 