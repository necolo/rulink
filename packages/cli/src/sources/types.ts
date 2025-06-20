import type { RuleMetadata } from '../types.js';
import type { ValidationResult } from '../config/types.js';

export interface SourceProvider {
  validateSource(): Promise<ValidationResult>;
  listRules(): Promise<RuleMetadata[]>;
  getRuleContent(rulePath: string): Promise<string>;
}

export interface RuleFile {
  path: string;
  content: string;
  category?: string;
} 