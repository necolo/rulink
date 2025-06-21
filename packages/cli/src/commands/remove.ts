import { join } from 'path';
import { promises as fs } from 'fs';
import colors from 'picocolors';
import type { CAC } from 'cac';
import { findActiveRulesDirectory, validateRulesDirectoryPath } from '../utils/rules-utils';

export function registerRemoveCommand(cli: CAC) {
  cli
    .command('remove [...ruleFiles]', 'Remove cursor rules by filename (e.g., style.mdc)')
    .action(async (ruleFiles: string[]) => {
      await removeCommand(ruleFiles);
    });
}

export async function removeCommand(ruleFiles: string[]): Promise<void> {
  try {
    // Find active rules directory (current dir first, then project root)
    const rulesInfo = await findActiveRulesDirectory();
    
    const rulesPath = rulesInfo.path;
    
    // Check if rules directory exists
    const rulesDirectoryExists = await validateRulesDirectoryPath(rulesInfo.path);
    if (!rulesDirectoryExists) {
      console.error(colors.red('Error: No rules directory found in this project.'));
      process.exit(1);
    }
    
    let removedCount = 0;
    
    for (const ruleFile of ruleFiles) {
      // Extract filename from path (e.g., "typescript/style.mdc" -> "style.mdc")
      const filename = ruleFile.includes('/') ? ruleFile.split('/').pop()! : ruleFile;
      
      // Ensure .mdc extension
      const mdcFilename = filename.endsWith('.mdc') ? filename : `${filename}.mdc`;
      const ruleFilePath = join(rulesPath, mdcFilename);
      
      try {
        await fs.unlink(ruleFilePath);
        console.log(colors.green(`Removed: ${mdcFilename}`));
        removedCount++;
      } catch (error) {
        console.log(colors.yellow(`File not found: ${mdcFilename}`));
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