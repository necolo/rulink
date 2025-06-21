import { join } from 'path';
import { promises as fs } from 'fs';
import { getProjectRoot } from './project-detector';

export function getRulesPath(projectRoot: string): string {
  return join(projectRoot, '.cursor', 'rules');
}

export async function ensureRulesDirectory(projectRoot: string): Promise<string> {
  const rulesPath = join(projectRoot, '.cursor', 'rules');
  
  try {
    await fs.mkdir(rulesPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create rules directory: ${error}`);
  }
  
  return rulesPath;
}

export async function validateRulesDirectory(projectRoot: string): Promise<boolean> {
  const rulesPath = join(projectRoot, '.cursor', 'rules');
  
  try {
    await fs.access(rulesPath);
    return true;
  } catch {
    return false;
  }
}

export async function findActiveRulesDirectory(startPath?: string): Promise<{
  path: string;
  source: 'local' | 'project';
  projectRoot: string;
}> {
  const currentDir = startPath || process.cwd();
  const localRulesPath = join(currentDir, '.cursor', 'rules');
  
  // Check if local rules directory exists
  try {
    await fs.access(localRulesPath);
    const projectRoot = await getProjectRoot(startPath);
    return {
      path: localRulesPath,
      source: 'local',
      projectRoot
    };
  } catch {
    // Fall back to project root
    const projectRoot = await getProjectRoot(startPath);
    const projectRulesPath = join(projectRoot, '.cursor', 'rules');
    return {
      path: projectRulesPath,
      source: 'project',
      projectRoot
    };
  }
}

export async function validateRulesDirectoryPath(rulesPath: string): Promise<boolean> {
  try {
    await fs.access(rulesPath);
    return true;
  } catch {
    return false;
  }
} 