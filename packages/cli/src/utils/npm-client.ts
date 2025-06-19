import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getLatestVersion(packageName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to get latest version for ${packageName}: ${error}`);
  }
}

export async function getCurrentVersion(packageName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`npm list ${packageName} --json`);
    const packageInfo = JSON.parse(stdout);
    return packageInfo.dependencies[packageName]?.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
} 