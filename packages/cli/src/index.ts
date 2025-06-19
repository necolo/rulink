#!/usr/bin/env node

import { cac } from 'cac';
import colors from 'picocolors';
import { installCommand } from './commands/install.js';
import { removeCommand } from './commands/remove.js';
import { updateCommand } from './commands/update.js';
import { listCommand } from './commands/list.js';
import { statusCommand } from './commands/status.js';

const cli = cac('cursor-rules');

cli
  .command('install [...categories]', 'Install cursor rules for specified categories')
  .option('--to <path>', 'Target path to install rules')
  .option('--dry-run', 'Show what would be installed without making changes')
  .option('--verbose', 'Verbose output')
  .action(async (categories: string[], options) => {
    await installCommand(categories, options);
  });

cli
  .command('remove [...categories]', 'Remove cursor rules for specified categories')
  .action(async (categories: string[]) => {
    await removeCommand(categories);
  });

cli
  .command('update', 'Update all installed rules to latest version')
  .action(async () => {
    await updateCommand();
  });

cli
  .command('list', 'List all available cursor rules')
  .action(async () => {
    await listCommand();
  });

cli
  .command('status', 'Show status of installed rules in current project')
  .action(async () => {
    await statusCommand();
  });

cli.help();
cli.version('0.1.0');

export default function main() {
  cli.parse();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 