import { join } from 'path';
import { promises as fs } from 'fs';
import colors from 'picocolors';
import type { CAC } from 'cac';
import { findProjectRoot } from '../utils/project-detector.js';
import { installCommand } from './install.js';

export function registerUpdateCommand(cli: CAC) {
  cli
    .command('update', 'Update all installed rules to latest version')
    .action(async () => {
      await updateCommand();
    });
}

export async function updateCommand(): Promise<void> {
  try {
    console.log(colors.blue('Updating installed rules...'));
    
    // Find target project
    const projectRoot = await findProjectRoot(process.cwd());
    
    if (!projectRoot) {
      console.error(colors.red('Error: Could not find project root.'));
      process.exit(1);
    }
    
    const rulesPath = join(projectRoot, '.cursor', 'rules');
    
    // Check if rules directory exists
    try {
      await fs.access(rulesPath);
    } catch {
      console.log(colors.yellow('No rules directory found. Nothing to update.'));
      return;
    }
    
    // Get list of currently installed rules
    const installedFiles = await fs.readdir(rulesPath);
    const installedRules = installedFiles
      .filter(file => file.endsWith('.mdc'))
      .map(file => file); // Keep the .mdc extension for reinstallation
    
    if (installedRules.length === 0) {
      console.log(colors.yellow('No rules installed. Nothing to update.'));
      return;
    }
    
    console.log(colors.blue(`Found ${installedRules.length} installed rule(s). Reinstalling...`));
    
    // Reinstall all current rules to get latest versions
    await installCommand(installedRules);
    
    console.log(colors.green('Rules updated successfully.'));
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 