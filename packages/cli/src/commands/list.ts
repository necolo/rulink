import colors from 'picocolors';
import { sourceManager } from '../sources/source-manager';
import { NAME } from '../variables';

import type { CAC } from 'cac';
export function registerListCommand(cli: CAC) {
  cli
    .command('list', 'List all available cursor rules from active source')
    .option('--source <name>', 'List rules from specific source')
    .action(async (options) => {
      await listCommand(options);
    });
}

export async function listCommand(options: { source?: string } = {}): Promise<void> {
  try {
    // Show active source info
    const activeSource = await sourceManager.getActiveSource();
    if (!activeSource) {
      console.log(colors.yellow('No active source configured.'));
      console.log(colors.dim(`Use "${NAME} source add <path|url|package>" to add a source.`));
      return
    }
    
    const sourceName = options.source || activeSource.name;
    console.log(colors.blue(`Available Rules from ${sourceName}:`));
    console.log();
    
    const availableRules = await sourceManager.listRules(options.source);
    const categorizedRules = new Map<string, string[]>();
    
    // Group rules by category
    for (const rule of availableRules) {
      if (!categorizedRules.has(rule.category)) {
        categorizedRules.set(rule.category, []);
      }
      categorizedRules.get(rule.category)!.push(rule.name);
    }
    
    // Display rule categories and files
    for (const [category, rules] of categorizedRules) {
      if (category === 'default') {
        // Show rules without category
        for (const rule of rules) {
          console.log(colors.green(`${rule}.mdc`));
          if (availableRules.find(r => r.name === rule && r.category === category)?.description) {
            console.log(colors.dim(`  ${availableRules.find(r => r.name === rule && r.category === category)?.description}`));
          }
        }
      } else {
        console.log(colors.green(`${category}/`));
        for (const rule of rules) {
          console.log(`  - ${rule}.mdc`);
          if (availableRules.find(r => r.name === rule && r.category === category)?.description) {
            console.log(colors.dim(`    ${availableRules.find(r => r.name === rule && r.category === category)?.description}`));
          }
        }
      }
      console.log();
    }
    
    if (availableRules.length === 0) {
      console.log(colors.yellow('No rules found in this source.'));
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 