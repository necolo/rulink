import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { RuleMetadata } from '../types.js';

export async function getRulesPackagePath(): Promise<string> {
  let __dirname: string;
  
  if (import.meta.url) {
    const __filename = fileURLToPath(import.meta.url);
    __dirname = dirname(__filename);
  } else {
    // Fallback for test environments where import.meta.url is undefined
    __dirname = process.cwd();
  }
  
  // Navigate to the rules package
  const rulesPackagePath = join(__dirname, '..', '..', '..', 'rules');
  return rulesPackagePath;
}

export async function listAvailableRules(): Promise<RuleMetadata[]> {
  const rulesPath = await getRulesPackagePath();
  const rules: RuleMetadata[] = [];
  
  try {
    const categories = await fs.readdir(rulesPath, { withFileTypes: true });
    
    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = join(rulesPath, category.name);
        const ruleFiles = await fs.readdir(categoryPath);
        
        for (const ruleFile of ruleFiles) {
          if (ruleFile.endsWith('.mdc')) {
            const ruleName = ruleFile.replace('.mdc', '');
            rules.push({
              category: category.name,
              name: ruleName,
              description: undefined,
              globs: undefined,
              alwaysApply: undefined
            });
          }
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to list available rules: ${error}`);
  }
  
  return rules;
}

export async function copyRules(categories: string[], targetPath: string): Promise<void> {
  const rulesPath = await getRulesPackagePath();
  
  for (const category of categories) {
    const categoryPath = join(rulesPath, category);
    
    try {
      const ruleFiles = await fs.readdir(categoryPath);
      
      for (const ruleFile of ruleFiles) {
        if (ruleFile.endsWith('.mdc')) {
          const sourcePath = join(categoryPath, ruleFile);
          const targetFilePath = join(targetPath, ruleFile);
          
          const content = await fs.readFile(sourcePath, 'utf8');
          await fs.writeFile(targetFilePath, content, 'utf8');
        }
      }
    } catch (error) {
      throw new Error(`Failed to copy rules from category ${category}: ${error}`);
    }
  }
} 