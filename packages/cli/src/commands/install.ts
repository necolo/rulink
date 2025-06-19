import { join } from 'path';
import colors from 'picocolors';
import { ensureRulesDirectory, findProjectRoot } from '../utils/project-detector.js';
import { copyRules, listAvailableRules } from '../utils/rules-manager.js';

import type { InstallOptions } from '../types.js';
export async function installCommand(categories: string[], options: InstallOptions = {}): Promise<void> {
  try {
    // Find project root or use --to option
    const projectRoot = options.targetPath || await findProjectRoot(process.cwd());
    
    if (!projectRoot) {
      console.error(colors.red('Error: Could not find project root. Use --to option to specify target path.'));
      process.exit(1);
    }
    
    if (options.verbose) {
      console.log(colors.blue(`Installing rules to: ${projectRoot}`));
    }
    
    // Ensure .cursor/rules directory exists
    const rulesPath = await ensureRulesDirectory(projectRoot);
    
    if (options.dryRun) {
      console.log(colors.yellow('Dry run mode - no files will be modified'));
      const availableRules = await listAvailableRules();
      const matchingRules = availableRules.filter(rule => categories.includes(rule.category));
      
      console.log(colors.green(`Would install ${matchingRules.length} rules:`));
      for (const rule of matchingRules) {
        console.log(`  - ${rule.category}/${rule.name}`);
      }
      return;
    }
    
    // Copy matching rules
    await copyRules(categories, rulesPath);
    
    // Display success message
    console.log(colors.green(`Successfully installed rules for categories: ${categories.join(', ')}`));
    console.log(colors.dim(`Rules installed to: ${rulesPath}`));
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 