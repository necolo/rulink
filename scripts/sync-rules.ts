import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function syncRules() {
  const sourceDir = join(__dirname, '..', 'rules');
  const targetDir = join(__dirname, '..', 'packages', 'rules');
  
  try {
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });
    
    // Copy all files from rules/ to packages/rules/
    await copyDirectory(sourceDir, targetDir);
    
    console.log('Rules synced successfully');
  } catch (error) {
    console.error('Error syncing rules:', error);
    process.exit(1);
  }
}

async function copyDirectory(source: string, target: string): Promise<void> {
  try {
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const targetPath = join(target, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(targetPath, { recursive: true });
        await copyDirectory(sourcePath, targetPath);
      } else {
        const content = await fs.readFile(sourcePath, 'utf8');
        await fs.writeFile(targetPath, content, 'utf8');
      }
    }
  } catch (error) {
    throw new Error(`Failed to copy directory from ${source} to ${target}: ${error}`);
  }
}

syncRules(); 