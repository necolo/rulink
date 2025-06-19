import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export async function findProjectRoot(startPath: string): Promise<string | null> {
  let currentPath = startPath;
  
  while (currentPath !== dirname(currentPath)) {
    try {
      const gitPath = join(currentPath, '.git');
      await fs.access(gitPath);
      return currentPath;
    } catch {
      // Continue searching
    }
    
    try {
      const packageJsonPath = join(currentPath, 'package.json');
      await fs.access(packageJsonPath);
      return currentPath;
    } catch {
      // Continue searching
    }
    
    currentPath = dirname(currentPath);
  }
  
  return null;
}

export async function ensureRulesDirectory(projectPath: string): Promise<string> {
  const rulesPath = join(projectPath, '.cursor', 'rules');
  
  try {
    await fs.mkdir(rulesPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create rules directory: ${error}`);
  }
  
  return rulesPath;
} 