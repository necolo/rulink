import colors from 'picocolors';
import { listAvailableRules } from '../utils/rules-manager.js';

export async function listCommand(): Promise<void> {
  try {
    console.log(colors.blue('Available Cursor Rules:'));
    console.log();
    
    const availableRules = await listAvailableRules();
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
      console.log(colors.green(`${category}/`));
      for (const rule of rules) {
        console.log(`  - ${rule}`);
        if (availableRules.find(r => r.name === rule && r.category === category)?.description) {
          console.log(colors.dim(`    ${availableRules.find(r => r.name === rule && r.category === category)?.description}`));
        }
      }
      console.log();
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 