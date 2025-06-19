import { join } from 'path';
import { promises as fs } from 'fs';
import colors from 'picocolors';
import { findProjectRoot } from '../utils/project-detector.js';
import { listAvailableRules } from '../utils/rules-manager.js';

export async function statusCommand(): Promise<void> {
  try {
    // Find project root
    const projectRoot = await findProjectRoot(process.cwd());
    
    if (!projectRoot) {
      console.error(colors.red('Error: Could not find project root.'));
      process.exit(1);
    }
    
    const rulesPath = join(projectRoot, '.cursor', 'rules');
    
    // Check if rules directory exists
    let installedRules: string[] = [];
    try {
      const files = await fs.readdir(rulesPath);
      installedRules = files.filter(file => file.endsWith('.mdc')).map(file => file.replace('.mdc', ''));
    } catch {
      console.log(colors.yellow('No rules directory found in this project.'));
      return;
    }
    
    // Show which rules are installed in current project
    console.log(colors.blue(`Cursor Rules Status for: ${projectRoot}`));
    console.log();
    
    if (installedRules.length === 0) {
      console.log(colors.yellow('No rules installed.'));
      return;
    }
    
    console.log(colors.green('Installed rules:'));
    for (const rule of installedRules) {
      console.log(`  ✓ ${rule}`);
    }
    console.log();
    
    // Compare with available rules
    const availableRules = await listAvailableRules();
    const availableRuleNames = availableRules.map(rule => rule.name);
    const notInstalled = availableRuleNames.filter(rule => !installedRules.includes(rule));
    
    if (notInstalled.length > 0) {
      console.log(colors.dim('Available but not installed:'));
      for (const rule of notInstalled) {
        console.log(colors.dim(`  - ${rule}`));
      }
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 