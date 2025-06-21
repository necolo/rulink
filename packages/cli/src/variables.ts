import { readFileSync } from 'fs';
import { join } from 'path';

let packageJson: any;
try {
  const packagePath = join(__dirname, '../package.json');
  const packageContent = readFileSync(packagePath, 'utf-8');
  packageJson = JSON.parse(packageContent);
} catch (error) {
  // Fallback for test environment or when package.json is not found
  packageJson = { version: '0.0.0', name: 'rulink' };
}

export const VERSION = packageJson.version as string;
export const NAME = packageJson.name as string;