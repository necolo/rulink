import { promises as fs } from 'fs';
import colors from 'picocolors';
import type { CAC } from 'cac';
import { findActiveRulesDirectory } from '../utils/rules-utils';
import { sourceManager } from '../sources/source-manager';

export function registerStatusCommand(cli: CAC) {
  cli
    .command('status', 'Show status of installed rules in current project')
    .action(async () => {
      await statusCommand();
    });
}

export async function statusCommand(): Promise<void> {
  try {
    // Find active rules directory (current dir first, then project root)
    const rulesInfo = await findActiveRulesDirectory();
    
    const rulesPath = rulesInfo.path;
    
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
    console.log(colors.blue(`Cursor Rules Status for: ${rulesInfo.projectRoot} (${rulesInfo.source === 'local' ? 'local rules' : 'project rules'})`));
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
    
    // Compare with available rules from active source
    let availableRules: string[] = [];
    try {
      const rules = await sourceManager.listRules();
      availableRules = rules.map(rule => rule.name);
    } catch {
      // If no active source, just show installed rules
    }
    const notInstalled = availableRules.filter(rule => !installedRules.includes(rule));
    
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