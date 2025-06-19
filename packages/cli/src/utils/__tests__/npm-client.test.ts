import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted to handle mock creation properly
const mockExecAsync = vi.hoisted(() => vi.fn());

// Mock child_process and util modules
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

vi.mock('util', () => ({
  promisify: () => mockExecAsync
}));

// Import after mocking
import { getLatestVersion, getCurrentVersion } from '../npm-client.js';

describe('npm-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getLatestVersion', () => {
    it('should return latest version for a package', async () => {
      const packageName = 'test-package';
      const expectedVersion = '1.2.3';
      
      mockExecAsync.mockResolvedValueOnce({
        stdout: `${expectedVersion}\n`,
        stderr: ''
      });

      const result = await getLatestVersion(packageName);

      expect(result).toBe(expectedVersion);
      expect(mockExecAsync).toHaveBeenCalledWith(`npm view ${packageName} version`);
    });

    it('should handle errors when getting latest version', async () => {
      const packageName = 'non-existent-package';
      const error = new Error('Package not found');
      
      mockExecAsync.mockRejectedValueOnce(error);

      await expect(getLatestVersion(packageName)).rejects.toThrow(`Failed to get latest version for ${packageName}: Error: Package not found`);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current version of installed package', async () => {
      const packageName = 'test-package';
      const mockResponse = {
        dependencies: {
          'test-package': {
            version: '1.0.0'
          }
        }
      };
      
      mockExecAsync.mockResolvedValueOnce({
        stdout: JSON.stringify(mockResponse),
        stderr: ''
      });

      const result = await getCurrentVersion(packageName);

      expect(result).toBe('1.0.0');
      expect(mockExecAsync).toHaveBeenCalledWith(`npm list ${packageName} --json`);
    });

    it('should return 0.0.0 when package not found', async () => {
      const packageName = 'non-existent-package';
      
      mockExecAsync.mockRejectedValueOnce(new Error('Package not found'));

      const result = await getCurrentVersion(packageName);

      expect(result).toBe('0.0.0');
    });

    it('should return 0.0.0 when package not in dependencies', async () => {
      const packageName = 'test-package';
      const mockResponse = {
        dependencies: {}
      };
      
      mockExecAsync.mockResolvedValueOnce({
        stdout: JSON.stringify(mockResponse),
        stderr: ''
      });

      const result = await getCurrentVersion(packageName);

      expect(result).toBe('0.0.0');
    });
  });
}); 