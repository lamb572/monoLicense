#!/usr/bin/env node
/**
 * @monolicense/cli
 *
 * CLI for scanning pnpm monorepos for license compliance.
 */

import { Command } from 'commander';
import { createScanCommand } from './commands/scan.js';

const program = new Command()
  .name('monolicense')
  .description('Monorepo-friendly license and dependency compliance tool')
  .version('0.0.1');

program.addCommand(createScanCommand());

program.parse();
