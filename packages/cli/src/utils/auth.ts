import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitCredentials {
  token?: string;
  username?: string;
}

export async function getGitCredentials(): Promise<GitCredentials> {
  try {
    // Try to get GitHub token from git config
    const { stdout: token } = await execAsync('git config --global github.token');
    if (token.trim()) {
      return { token: token.trim() };
    }
  } catch {
    // Ignore error, try other methods
  }

  try {
    // Try to get username from git config
    const { stdout: username } = await execAsync('git config --global user.name');
    if (username.trim()) {
      return { username: username.trim() };
    }
  } catch {
    // Ignore error
  }

  return {};
}

export function createAuthHeaders(credentials: GitCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'rulink'
  };

  if (credentials.token) {
    headers['Authorization'] = `token ${credentials.token}`;
  }

  return headers;
} 