import ora, { type Ora } from 'ora';
import type { AnySourceConfig } from '../config/types';

export interface LoadingOptions {
  text: string;
  successText?: string;
  failText?: string;
}

export interface LoadingSpinner {
  start(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}

export function createSpinner(options: LoadingOptions): LoadingSpinner {
  const spinner = ora(options.text);
  
  return {
    start(): void {
      spinner.start();
    },
    succeed(text?: string): void {
      spinner.succeed(text || options.successText);
    },
    fail(text?: string): void {
      spinner.fail(text || options.failText);
    },
    stop(): void {
      spinner.stop();
    }
  };
}

export function isNetworkSource(sourceConfig: AnySourceConfig): boolean {
  return sourceConfig.type === 'github' || sourceConfig.type === 'npm';
} 