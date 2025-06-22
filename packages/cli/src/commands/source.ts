import colors from 'picocolors';
import { AnySourceConfig } from '../config/types';
import { sourceManager } from '../sources/source-manager';
import { NAME } from '../variables';

import type { CAC } from 'cac';
export function registerSourceCommands(cli: CAC) {
  cli
    .command('source [sourceName]', 'Show source details, default is active source')
    .option('-l, --list, --all', 'List all configured sources')
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
      if (options.remove) {
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
      logSourceDetail(config, isActive);
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

    const activeSourceName = activeSource?.name;
    if (!sourceName && activeSourceName) {
      logSourceDetail(sources[activeSourceName], true);
      return;
    }

    const targetSource = sources[sourceName];
    if (!targetSource) {
      console.log(colors.yellow(`Can't find source ${sourceName}`));
      console.log(colors.dim(`Use "${NAME} source --add <path|url|package>" to add a source.`));
      return; 
    }

    logSourceDetail(targetSource, sourceName === activeSource?.name);

  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
}

function logSourceDetail(config: AnySourceConfig, isActive: boolean) {
  const name = config.name;
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

export async function sourceRemoveAllCommand(): Promise<void> {
  try {
    const sources = await sourceManager.listSources();
    const sourceNames = Object.keys(sources);
    
    if (sourceNames.length === 0) {
      console.log(colors.yellow('No sources to remove.'));
      return;
    }

    console.log(colors.blue(`Removing ${sourceNames.length} source(s)...`));
    
    // Remove all sources
    for (const sourceName of sourceNames) {
      await sourceManager.removeSource(sourceName);
      console.log(colors.dim(`  ✓ Removed: ${sourceName}`));
    }
    
    console.log(colors.green(`✓ Successfully removed all ${sourceNames.length} source(s)`));
  } catch (error) {
    console.error(colors.red(`Error: ${error}`));
    process.exit(1);
  }
} 