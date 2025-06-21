import colors from 'picocolors';
import type { CAC } from 'cac';
import { sourceManager } from '../sources/source-manager';
import { getProvider } from '../sources/provider-detect';
import { NAME } from '../variables';

export function registerSourceCommands(cli: CAC) {
  cli
    .command('source [input]', 'List all configured sources')
    .option('-a, --add', 'Add a new rule source')
    .option('--remove', 'Remove a source')
    .option('--use', 'Set active source')
    .option('--verbose', 'Verbose output')
    .example(`${NAME} source -a ./rules                       Add local rules`)
    .example(`${NAME} source -a cursor-rules-data             Add npm package`)
    .example(`${NAME} source -a github:user/repo              Add GitHub package`)
    .action(async (input: string, options = {}) => {
      if (options.add) {
        await sourceAddCommand(input, options);
      } else if (options.remove) {
        await sourceRemoveCommand(input);
      } else if (options.use) {
        await sourceUseCommand(input);
      } else {
        await sourceListCommand();
      }
    })
}

export async function sourceAddCommand(
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

    const result = await sourceManager.addSource(input, {});
    
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

    // Check if this is the first source
    const sources = await sourceManager.listSources();
    if (Object.keys(sources).length === 1) {
      console.log(colors.cyan(`This is now your active source.`));
    }

  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}

export async function sourceListCommand(): Promise<void> {
  try {
    const sources = await sourceManager.listSources();
    const activeSource = await sourceManager.getActiveSource();
    
    if (Object.keys(sources).length === 0) {
      console.log(colors.yellow('No sources configured.'));
      console.log(colors.dim(`Use "${NAME} source --add <path|url|package>" to add a source.`));
      return;
    }

    console.log(colors.blue('Configured Sources:'));
    console.log();

    for (const [name, config] of Object.entries(sources)) {
      const isActive = activeSource?.name === name;
      const prefix = isActive ? colors.green('● ') : colors.dim('○ ');
      
      console.log(`${prefix}${colors.bold(name)} ${isActive ? colors.green('(active)') : ''}`);
      console.log(`  ${colors.dim('Type:')} ${config.type}`);
      
      switch (config.type) {
        case 'local':
          console.log(`  ${colors.dim('Path:')} ${config.path}`);
          break;
        case 'github':
          console.log(`  ${colors.dim('URL:')} ${config.url}`);
          break;
        case 'npm':
          console.log(`  ${colors.dim('Package:')} ${config.package}`);
          break;
      }
      console.log();
    }

  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}

export async function sourceUseCommand(sourceName: string): Promise<void> {
  try {
    await sourceManager.setActiveSource(sourceName);
    console.log(colors.green(`✓ Active source set to: ${sourceName}`));
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}

export async function sourceRemoveCommand(sourceName: string): Promise<void> {
  try {
    await sourceManager.removeSource(sourceName);
    console.log(colors.green(`✓ Removed source: ${sourceName}`));
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 