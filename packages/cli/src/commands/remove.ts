import { join } from 'path';
import { promises as fs } from 'fs';
import colors from 'picocolors';
import { findProjectRoot } from '../utils/project-detector.js';
import { listAvailableRules } from '../utils/rules-manager.js';

export async function removeCommand(categories: string[]): Promise<void> {
  try {
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
      console.error(colors.red('Error: No rules directory found in this project.'));
      process.exit(1);
    }
    
    const availableRules = await listAvailableRules();
    const rulesToRemove = availableRules.filter(rule => categories.includes(rule.category));
    
    let removedCount = 0;
    
    for (const rule of rulesToRemove) {
      const ruleFilePath = join(rulesPath, `${rule.name}.mdc`);
      
      try {
        await fs.unlink(ruleFilePath);
        console.log(colors.green(`Removed: ${rule.category}/${rule.name}`));
        removedCount++;
      } catch (error) {
        console.log(colors.yellow(`File not found: ${rule.category}/${rule.name}`));
      }
    }
    
    if (removedCount === 0) {
      console.log(colors.yellow('No rules were removed.'));
    } else {
      console.log(colors.green(`Successfully removed ${removedCount} rule(s).`));
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 