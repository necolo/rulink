import colors from 'picocolors';
import { getProvider } from '../sources/provider-detect';
import { sourceManager } from '../sources/source-manager';

import type { CAC } from 'cac';
export function registerAddCommand(cli: CAC) {
  cli
    .command('add <path|url|package>', 'Add a rule source, can be a local path, npm package, or github repository')
    .option('--verbose', 'Verbose output')
    .action(async (input: string, options) => {
      await addCommand(input, options);
    });
}

async function addCommand(
  input: string, 
  options: { verbose?: boolean; }
): Promise<void> {
  const provider = getProvider(input);
  try {
    if (options.verbose) {
      console.log(colors.blue(`Adding source: ${input}`));
      if (provider === 'github') console.log(colors.dim('Type: GitHub'));
      else if (provider === 'npm') console.log(colors.dim('Type: NPM'));
      else console.log(colors.dim('Type: Local'))
    }

    const result = await sourceManager.addSource(input, provider);
    
    console.log(colors.green(`✓ Successfully added source: ${result.name}`));
    console.log(colors.dim(`  Type: ${result.config.type}`));
    
    switch (result.config.type) {
      case 'local':
        console.log(colors.dim(`  Path: ${result.config.path}`));
        break;
      case 'github':
        console.log(colors.dim(`  URL: ${result.config.url}`));
        break;
      case 'npm':
        console.log(colors.dim(`  Package: ${result.config.package}`));
        break;
    }

    // Check if this is the first source and set it as active
    const sources = await sourceManager.listSources();
    if (Object.keys(sources).length === 1) {
      await sourceManager.setActiveSource(result.name);
      console.log(colors.cyan(`✓ Set as active source (first source added).`));
    }

  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}
