export type SourceType = 'local' | 'github' | 'npm';

export interface SourceConfig {
  type: SourceType;
  name: string;
}

export interface LocalSourceConfig extends SourceConfig {
  type: 'local';
  path: string;
}

export interface GitHubSourceConfig extends SourceConfig {
  type: 'github';
  url: string;
}

export interface NpmSourceConfig extends SourceConfig {
  type: 'npm';
  package: string;
}

export type AnySourceConfig = LocalSourceConfig | GitHubSourceConfig | NpmSourceConfig;

export interface GlobalConfig {
  version: string;
  sources: Record<string, AnySourceConfig>;
  activeSource?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
} 