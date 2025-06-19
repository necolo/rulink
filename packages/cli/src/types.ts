export interface RuleMetadata {
  category: string;
  name: string;
  description?: string;
  globs?: string[];
  alwaysApply?: boolean;
}

export interface InstallOptions {
  targetPath?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface ProjectInfo {
  rootPath: string;
  rulesPath: string;
  hasGit: boolean;
} 