import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export async function findGitRoot(startPath: string): Promise<string | null> {
  let currentPath = startPath;
  const homeDir = homedir();
  
  while (currentPath !== dirname(currentPath) && currentPath !== homeDir) {
    try {
      const gitPath = join(currentPath, '.git');
      await fs.access(gitPath);
      return currentPath;
    } catch {
      // Continue searching
    }
    
    currentPath = dirname(currentPath);
  }
  
  return null;
}

export async function getProjectRoot(startPath?: string): Promise<string> {
  const gitRoot = await findGitRoot(startPath || process.cwd());
  return gitRoot || startPath || process.cwd();
}

 