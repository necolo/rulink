import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listCommand } from '../list.js';

// Mock modules
vi.mock('../../utils/rules-manager.js', () => ({
  listAvailableRules: vi.fn()
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
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

import { listAvailableRules } from '../../utils/rules-manager.js';

const mockListAvailableRules = vi.mocked(listAvailableRules);

describe('list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should list available rules grouped by category', async () => {
    const mockRules = [
      { category: 'typescript', name: 'strict-types', description: 'TypeScript strict typing', globs: undefined, alwaysApply: undefined },
      { category: 'typescript', name: 'react-components', description: undefined, globs: undefined, alwaysApply: undefined },
      { category: 'react', name: 'component-standards', description: 'React component best practices', globs: undefined, alwaysApply: undefined },
      { category: 'general', name: 'code-style', description: undefined, globs: undefined, alwaysApply: undefined }
    ];

    mockListAvailableRules.mockResolvedValue(mockRules);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Available Cursor Rules:');
    expect(mockConsoleLog).toHaveBeenCalledWith();
    expect(mockConsoleLog).toHaveBeenCalledWith('typescript/');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - strict-types');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - react-components');
    expect(mockConsoleLog).toHaveBeenCalledWith('react/');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - component-standards');
    expect(mockConsoleLog).toHaveBeenCalledWith('general/');
    expect(mockConsoleLog).toHaveBeenCalledWith('  - code-style');
  });

  it('should display rule descriptions when available', async () => {
    const mockRules = [
      { category: 'typescript', name: 'strict-types', description: 'TypeScript strict typing rules', globs: undefined, alwaysApply: undefined }
    ];

    mockListAvailableRules.mockResolvedValue(mockRules);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('    TypeScript strict typing rules');
  });

  it('should handle empty rules list', async () => {
    mockListAvailableRules.mockResolvedValue([]);

    await listCommand();

    expect(mockConsoleLog).toHaveBeenCalledWith('Available Cursor Rules:');
    expect(mockConsoleLog).toHaveBeenCalledWith();
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to read rules');
    mockListAvailableRules.mockRejectedValue(error);

    await listCommand();

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Error: Failed to read rules');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 