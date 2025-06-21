import type { RuleMetadata } from '../types';
import type { ValidationResult } from '../config/types';

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