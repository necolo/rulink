import { promises as fs } from 'fs';
import { createInterface } from 'readline';
import colors from 'picocolors';
import type { CAC } from 'cac';
import { findActiveRulesDirectory, validateRulesDirectoryPath } from '../utils/rules-utils';
import { sourceManager } from '../sources/source-manager';
import { installCommand } from './install';
import type { RuleMetadata } from '../types';

export function registerUpdateCommand(cli: CAC) {
  cli
    .command('update', 'Update all installed rules to latest version')
    .action(async () => {
      await updateCommand();
    });
}

interface RuleMatch {
  filename: string;
  matches: Array<{
    fullPath: string;
    category: string;
    description?: string;
  }>;
}

async function promptUserChoice(ruleMatch: RuleMatch): Promise<string | null> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(colors.yellow(`\nMultiple rules found for ${ruleMatch.filename}:`));
    ruleMatch.matches.forEach((match, index) => {
      const description = match.description ? ` - ${match.description}` : '';
      console.log(`  ${index + 1}. ${match.fullPath}${description}`);
    });
    console.log(`  ${ruleMatch.matches.length + 1}. Skip this rule`);

    rl.question('\nPlease select which rule to update (number): ', (answer) => {
      rl.close();
      
      const choice = parseInt(answer.trim());
      if (choice >= 1 && choice <= ruleMatch.matches.length) {
        resolve(ruleMatch.matches[choice - 1].fullPath);
      } else if (choice === ruleMatch.matches.length + 1) {
        resolve(null); // Skip
      } else {
        console.log(colors.red('Invalid choice. Skipping this rule.'));
        resolve(null);
      }
    });
  });
}

export async function updateCommand(): Promise<void> {
  try {
    console.log(colors.blue('Updating installed rules...'));
    
    // Find active rules directory (current dir first, then project root)
    const rulesInfo = await findActiveRulesDirectory();
    
    const rulesPath = rulesInfo.path;
    
    // Check if rules directory exists
    const rulesDirectoryExists = await validateRulesDirectoryPath(rulesInfo.path);
    if (!rulesDirectoryExists) {
      console.log(colors.yellow('No rules directory found in this project. Nothing to update.'));
      return;
    }
    
    // Get list of currently installed rules
    const installedFiles = await fs.readdir(rulesPath);
    const installedRuleFiles = installedFiles.filter(file => file.endsWith('.mdc'));
    
    if (installedRuleFiles.length === 0) {
      console.log(colors.yellow('No rules installed. Nothing to update.'));
      return;
    }
    
    console.log(colors.blue(`Found ${installedRuleFiles.length} installed rule(s) in ${rulesInfo.projectRoot} (${rulesInfo.source === 'local' ? 'local rules' : 'project rules'})`));
    
    // Get all available rules from the source
    let availableRules: RuleMetadata[];
    try {
      availableRules = await sourceManager.listRules();
    } catch (error) {
      console.error(colors.red(`Error listing available rules: ${error}`));
      process.exit(1);
    }
    
    // Build map of filename to available rules
    const rulesByFilename = new Map<string, RuleMatch>();
    
    for (const rule of availableRules) {
      const filename = `${rule.name}.mdc`;
      const fullPath = rule.category === 'default' ? filename : `${rule.category}/${filename}`;
      
      if (!rulesByFilename.has(filename)) {
        rulesByFilename.set(filename, {
          filename,
          matches: []
        });
      }
      
      rulesByFilename.get(filename)!.matches.push({
        fullPath,
        category: rule.category,
        description: rule.description
      });
    }
    
    // Process each installed rule
    const rulesToInstall: string[] = [];
    const skippedRules: string[] = [];
    const notFoundRules: string[] = [];
    
    for (const installedFile of installedRuleFiles) {
      const ruleMatch = rulesByFilename.get(installedFile);
      
      if (!ruleMatch) {
        // Rule not found in source
        notFoundRules.push(installedFile);
        continue;
      }
      
      if (ruleMatch.matches.length === 1) {
        // Exact match - use it
        rulesToInstall.push(ruleMatch.matches[0].fullPath);
        console.log(colors.dim(`✓ ${installedFile} → ${ruleMatch.matches[0].fullPath}`));
      } else {
        // Multiple matches - ask user to choose
        const choice = await promptUserChoice(ruleMatch);
        if (choice) {
          rulesToInstall.push(choice);
          console.log(colors.green(`✓ ${installedFile} → ${choice}`));
        } else {
          skippedRules.push(installedFile);
          console.log(colors.yellow(`⚠ Skipped ${installedFile}`));
        }
      }
    }
    
    // Report rules not found
    if (notFoundRules.length > 0) {
      console.log(colors.yellow(`\nRules not found in source (may have been removed):`));
      for (const rule of notFoundRules) {
        console.log(colors.dim(`  - ${rule}`));
      }
    }
    
    // Install the resolved rules
    if (rulesToInstall.length > 0) {
      console.log(colors.blue(`\nUpdating ${rulesToInstall.length} rule(s)...`));
      await installCommand(rulesToInstall);
      console.log(colors.green('Rules updated successfully.'));
    } else {
      console.log(colors.yellow('No rules were updated.'));
    }
    
    // Summary
    const summary = [];
    if (rulesToInstall.length > 0) summary.push(`${rulesToInstall.length} updated`);
    if (skippedRules.length > 0) summary.push(`${skippedRules.length} skipped`);
    if (notFoundRules.length > 0) summary.push(`${notFoundRules.length} not found`);
    
    if (summary.length > 0) {
      console.log(colors.dim(`\nSummary: ${summary.join(', ')}`));
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 