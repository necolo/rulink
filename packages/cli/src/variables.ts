import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

export const VERSION = packageJson.version as string;
export const NAME = packageJson.name as string;