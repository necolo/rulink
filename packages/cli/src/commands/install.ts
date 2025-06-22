import { promises as fs } from 'fs';
import { join } from 'path';
import colors from 'picocolors';
import { sourceManager } from '../sources/source-manager';
import { createSpinner, isNetworkSource } from '../utils/loading';
import { getProjectRoot } from '../utils/project-detector';
import { ensureRulesDirectory } from '../utils/rules-utils';
import { formatSourceDestination, getSourceDisplayInfo } from '../utils/source-display';
import { NAME } from '../variables';

import type { CAC } from 'cac';
import type { InstallOptions } from '../types';
export function registerInstallCommand(cli: CAC) {
  cli
    .command('install [...rulePaths]', 'Install cursor rules by file path (e.g., style.mdc or typescript/style.mdc), folder name (e.g., typescript), or install all rules if no paths specified')
    .option('--to <path>', 'Target path to install rules')
    .option('--source <name>', 'Use specific source instead of active source')
    .option('--dry-run', 'Show what would be installed without making changes')
    .option('--verbose', 'Verbose output')
    .action(async (rulePaths: string[], options) => {
      await installCommand(rulePaths, options);
    });
}

export async function installCommand(rulePaths: string[], options: InstallOptions & { source?: string; to?: string } = {}): Promise<void> {
  // Add spinner cleanup on process exit
  const cleanup = () => {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('exit');
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    // Find project root or use --to option
    let projectRoot: string;
    
    if (options.targetPath || options.to) {
      // Use user-specified path
      projectRoot = options.targetPath || options.to!;
    } else {
      // Try to find git root, fallback to current directory
      projectRoot = await getProjectRoot();
    }

    // Get source configuration for display
    const sourceConfig = options.source 
      ? (await sourceManager.listSources())[options.source]
      : await sourceManager.getActiveSource();

    if (!sourceConfig) {
      if (options.source) {
        console.error(colors.red(`Source '${options.source}' not found`));
        process.exit(1);
      } else {
        console.error(colors.red(`No active source configured. Use "${NAME} source --add" to add a source.`));
        process.exit(1);
      }
    }

    // Display friendly source/destination logging
    const sourceDisplayInfo = getSourceDisplayInfo(sourceConfig);
    console.log(colors.cyan(formatSourceDestination(sourceDisplayInfo, sourceConfig.name, projectRoot)));
    
    if (options.verbose) {
      console.log(colors.blue(`Installing rules to: ${projectRoot}`));
    }
    
    // If no rule paths provided, install all available rules
    if (rulePaths.length === 0) {
      let listSpinner;
      try {
        if (isNetworkSource(sourceConfig) && !options.dryRun) {
          listSpinner = createSpinner({
            text: `Fetching available rules from ${sourceDisplayInfo.description}...`,
            successText: `Found rules from ${sourceConfig.name}`,
            failText: `Failed to fetch rules from ${sourceConfig.name}`
          });
          listSpinner.start();
        }

        const availableRules = await sourceManager.listRules(options.source);
        
        if (listSpinner) {
          listSpinner.succeed(`Found ${availableRules.length} rules from ${sourceConfig.name}`);
        }

        rulePaths = availableRules.map(rule => {
          // Construct rule path from category and name
          if (rule.category === 'default') {
            return `${rule.name}.mdc`;
          } else {
            return `${rule.category}/${rule.name}.mdc`;
          }
        });
        
        if (rulePaths.length === 0) {
          console.log(colors.yellow('No rules found in the source.'));
          return;
        }
        
        if (options.verbose) {
          console.log(colors.blue(`No specific rules provided. Installing all ${rulePaths.length} available rules.`));
        }
      } catch (error) {
        if (listSpinner) {
          listSpinner.fail();
        }
        console.error(colors.red(`Error listing available rules: ${error}`));
        process.exit(1);
      }
    }
    
    // Expand rule paths (folders to individual files)
    const expandedRulePaths: string[] = [];
    for (const rulePath of rulePaths) {
      try {
        const expanded = await sourceManager.expandRulePath(rulePath, options.source);
        expandedRulePaths.push(...expanded);
      } catch (error) {
        console.error(colors.red(`Error expanding rule path '${rulePath}': ${error}`));
        continue;
      }
    }
    
    // Use expanded rule paths for processing
    const finalRulePaths = expandedRulePaths;
    
    // Ensure .cursor/rules directory exists
    const rulesPath = await ensureRulesDirectory(projectRoot);
    
    if (options.dryRun) {
      console.log(colors.yellow('Dry run mode - no files will be modified'));
      
      for (const rulePath of finalRulePaths) {
        const validation = await sourceManager.validateRulePath(rulePath);
        if (!validation.valid) {
          console.error(colors.red(`Invalid rule path: ${rulePath} - ${validation.error}`));
          continue;
        }
        
                let contentSpinner;
        try {
          if (isNetworkSource(sourceConfig)) {
            contentSpinner = createSpinner({
              text: `Fetching rule: ${rulePath}...`,
              successText: `Fetched ${rulePath}`,
              failText: `Failed to fetch ${rulePath}`
            });
            contentSpinner.start();
          }

          const content = await sourceManager.getRuleContent(rulePath, options.source);
          
          if (contentSpinner) {
            contentSpinner.succeed();
          }
          
          console.log(colors.green(`Would install: ${rulePath} (${content.length} bytes)`));
        } catch (error) {
          if (contentSpinner) {
            contentSpinner.fail();
          }
          console.error(colors.red(`Error accessing rule ${rulePath}: ${error}`));
        }
      }
      return;
    }
    
    // Install rules
    const installedRules: string[] = [];
    
    for (const rulePath of finalRulePaths) {
      const validation = await sourceManager.validateRulePath(rulePath);
      if (!validation.valid) {
        console.error(colors.red(`Skipping invalid rule path: ${rulePath} - ${validation.error}`));
        continue;
      }
      
      let installSpinner;
      try {
        if (isNetworkSource(sourceConfig)) {
          installSpinner = createSpinner({
            text: `Installing rule: ${rulePath}...`,
            successText: `Installed ${rulePath}`,
            failText: `Failed to install ${rulePath}`
          });
          installSpinner.start();
        }

        const content = await sourceManager.getRuleContent(rulePath, options.source);
        
        // Extract filename for writing
        const filename = rulePath.includes('/') ? rulePath.split('/').pop()! : rulePath;
        const targetPath = join(rulesPath, filename);
        
        await fs.writeFile(targetPath, content, 'utf8');
        installedRules.push(rulePath);
        
        if (installSpinner) {
          installSpinner.succeed();
        }
        
        if (options.verbose) {
          console.log(colors.dim(`Installed: ${rulePath} → ${filename}`));
        }
      } catch (error) {
        if (installSpinner) {
          installSpinner.fail();
        }
        console.error(colors.red(`Failed to install rule ${rulePath}: ${error}`));
      }
    }
    
    // Display success message with source context
    if (installedRules.length > 0) {
      console.log(colors.green(`Successfully installed ${installedRules.length} rule(s) from ${sourceConfig.name} (${sourceDisplayInfo.description}):`));
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