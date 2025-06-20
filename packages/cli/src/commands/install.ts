import { join } from 'path';
import { promises as fs } from 'fs';
import colors from 'picocolors';
import type { CAC } from 'cac';
import { ensureRulesDirectory, findProjectRoot } from '../utils/project-detector.js';
import { sourceManager } from '../sources/source-manager.js';

import type { InstallOptions } from '../types.js';

export function registerInstallCommand(cli: CAC) {
  cli
    .command('install [...rulePaths]', 'Install cursor rules by file path (e.g., style.mdc or typescript/style.mdc)')
    .option('--to <path>', 'Target path to install rules')
    .option('--source <name>', 'Use specific source instead of active source')
    .option('--dry-run', 'Show what would be installed without making changes')
    .option('--verbose', 'Verbose output')
    .action(async (rulePaths: string[], options) => {
      await installCommand(rulePaths, options);
    });
}

export async function installCommand(rulePaths: string[], options: InstallOptions & { source?: string } = {}): Promise<void> {
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
      
      for (const rulePath of rulePaths) {
        const validation = await sourceManager.validateRulePath(rulePath);
        if (!validation.valid) {
          console.error(colors.red(`Invalid rule path: ${rulePath} - ${validation.error}`));
          continue;
        }
        
        try {
          const content = await sourceManager.getRuleContent(rulePath, options.source);
          console.log(colors.green(`Would install: ${rulePath} (${content.length} bytes)`));
        } catch (error) {
          console.error(colors.red(`Error accessing rule ${rulePath}: ${error}`));
        }
      }
      return;
    }
    
    // Install rules
    const installedRules: string[] = [];
    
    for (const rulePath of rulePaths) {
      const validation = await sourceManager.validateRulePath(rulePath);
      if (!validation.valid) {
        console.error(colors.red(`Skipping invalid rule path: ${rulePath} - ${validation.error}`));
        continue;
      }
      
      try {
        const content = await sourceManager.getRuleContent(rulePath, options.source);
        
        // Extract filename for writing
        const filename = rulePath.includes('/') ? rulePath.split('/').pop()! : rulePath;
        const targetPath = join(rulesPath, filename);
        
        await fs.writeFile(targetPath, content, 'utf8');
        installedRules.push(rulePath);
        
        if (options.verbose) {
          console.log(colors.dim(`Installed: ${rulePath} → ${filename}`));
        }
      } catch (error) {
        console.error(colors.red(`Failed to install rule ${rulePath}: ${error}`));
      }
    }
    
    // Display success message
    if (installedRules.length > 0) {
      console.log(colors.green(`Successfully installed ${installedRules.length} rule(s):`));
      for (const rule of installedRules) {
        console.log(`  - ${rule}`);
      }
      console.log(colors.dim(`Rules installed to: ${rulesPath}`));
    } else {
      console.log(colors.yellow('No rules were installed.'));
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 