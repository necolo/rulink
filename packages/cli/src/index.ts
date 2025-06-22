#!/usr/bin/env node

import { cac } from 'cac';
import { registerAddCommand } from './commands/add';
import { registerInstallCommand } from './commands/install';
import { registerListCommand } from './commands/list';
import { registerRemoveCommand } from './commands/remove';
import { registerSourceCommands } from './commands/source';
import { registerStatusCommand } from './commands/status';
import { registerUpdateCommand } from './commands/update';
import { NAME, VERSION } from './variables';

const cli = cac(NAME);

registerInstallCommand(cli);
registerRemoveCommand(cli);
registerUpdateCommand(cli);
registerListCommand(cli);
registerStatusCommand(cli);
registerSourceCommands(cli);
registerAddCommand(cli);

cli.help();
cli.version(VERSION);

export default function main() {
  cli.parse();
}

main();