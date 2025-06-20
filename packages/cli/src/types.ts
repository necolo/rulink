export interface RuleMetadata {
  category: string;
  name: string;
  description?: string;
  globs?: string[];
  alwaysApply?: boolean;
  absolutePath?: string;
}

export interface InstallOptions {
  targetPath?: string;
  dryRun?: boolean;
  verbose?: boolean;
  source?: string;
}

export interface ProjectInfo {
  rootPath: string;
  rulesPath: string;
  hasGit: boolean;
} 