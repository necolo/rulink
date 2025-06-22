import colors from 'picocolors';
import type { CAC } from 'cac';
import { sourceManager } from '../sources/source-manager';
import { getProvider } from '../sources/provider-detect';
import { NAME } from '../variables';
import { AnySourceConfig } from '../config/types';

export function registerSourceCommands(cli: CAC) {
  cli
    .command('source [sourceName]', 'Show source details, default is active source')
    .option('-l, --list, --all', 'List all configured sources')
    .option('-A, --add <path|url|package>', 'Add a new rule source, can be a local path, npm package, or github repository')
    .option('--remove <sourceName>', 'Remove a source')
    .option('--remove-all', 'Remove all sources')
    .option('--use <sourceName>', 'Set active source')
    .option('--rename, -m, -M <newName>', 'Rename a source')
    .option('--verbose', 'Verbose output')
    .example(`${NAME} source -A ./rules                       Add local rules`)
    .example(`${NAME} source -A @necolo/cursor-rules          Add npm package`)
    .example(`${NAME} source -A github:user/repo              Add GitHub package`)
    .example(`${NAME} source --rename old-name new-name       Rename a source`)
    .action(async (input: string, options = {}) => {
      if (options.add) {
        await sourceAddCommand(options.add, options);
      } else if (options.remove) {
        await sourceRemoveCommand(options);
      } else if (options.use) {
        await sourceUseCommand(options.use);
      } else if (options.rename) {
        await sourceRenameCommand(input, options.rename);
      } else if (options.list || options.all) {
        await sourceListCommand();
      } else if (options.removeAll) {
        await sourceRemoveAllCommand();
      } else {
        await sourceCommand(input);
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
      logSourceDetail(name, config, isActive);
    }

  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}

export async function sourceCommand(sourceName: string = ''): Promise<void> {
  try {
    const activeSource = await sourceManager.getActiveSource();
    const sources = await sourceManager.listSources();

    if (!sourceName && activeSource?.name) {
      logSourceDetail(activeSource?.name, sources[activeSource?.name], true);
      return;
    }

    const targetSource = sources[sourceName];
    if (!targetSource) {
      console.log(colors.yellow(`Can't find source ${sourceName}`));
      console.log(colors.dim(`Use "${NAME} source --add <path|url|package>" to add a source.`));
      return; 
    }

    logSourceDetail(sourceName, targetSource, sourceName === activeSource?.name);

  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}

function logSourceDetail(name: string, config: AnySourceConfig, isActive: boolean) {
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

export async function sourceRenameCommand(oldName: string, newName: string | undefined): Promise<void> {
  try {
    // Validate both parameters are provided
    if (!oldName || !newName) {
      console.error(colors.red('Error: Both old name and new name are required'));
      console.error(colors.dim(`Usage: ${NAME} source --rename <old-name> <new-name>`));
      process.exit(1);
    }
    
    await sourceManager.renameSource(oldName, newName);
    console.log(colors.green(`✓ Renamed source: ${oldName} to ${newName}`));
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 