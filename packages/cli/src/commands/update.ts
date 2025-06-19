import colors from 'picocolors';
import { getLatestVersion, getCurrentVersion } from '../utils/npm-client.js';
import { installCommand } from './install.js';
import { listAvailableRules } from '../utils/rules-manager.js';

export async function updateCommand(): Promise<void> {
  try {
    console.log(colors.blue('Checking for updates...'));
    
    // Check latest version of @necolo/cursor-rules-data
    const currentVersion = await getCurrentVersion('@necolo/cursor-rules-data');
    const latestVersion = await getLatestVersion('@necolo/cursor-rules-data');
    
    if (currentVersion === latestVersion) {
      console.log(colors.green('Rules are already up to date.'));
      return;
    }
    
    console.log(colors.yellow(`Updating from ${currentVersion} to ${latestVersion}`));
    
    // Get all available rule categories
    const availableRules = await listAvailableRules();
    const categories = [...new Set(availableRules.map(rule => rule.category))];
    
    // Reinstall all rules from current project
    await installCommand(categories);
    
    console.log(colors.green('Rules updated successfully.'));
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 