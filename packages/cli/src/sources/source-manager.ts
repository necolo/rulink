import { basename, resolve } from 'path';
import type { SourceProvider } from './types';
import type { RuleMetadata } from '../types';
import type { AnySourceConfig, SourceType } from '../config/types';
import { ConfigManager } from '../config/config-manager';
import { LocalSourceProvider } from './providers/local-provider';
import { GitHubSourceProvider } from './providers/github-provider';
import { NpmSourceProvider } from './providers/npm-provider';

export class SourceManager {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  private createProvider(config: AnySourceConfig): SourceProvider {
    switch (config.type) {
      case 'local':
        return new LocalSourceProvider(config);
      case 'github':
        return new GitHubSourceProvider(config);
      case 'npm':
        return new NpmSourceProvider(config);
      default:
        throw new Error(`Unknown source type: ${(config as any).type}`);
    }
  }

  private _createSourceConfig(input: string, type: SourceType, existingSources: Record<string, AnySourceConfig>): AnySourceConfig {
    let config: AnySourceConfig;
    let suggestedName: string;

    if (type === 'npm') {
      // NPM package
      suggestedName = input.split('/').pop() || input;
      config = {
        type: 'npm',
        package: input,
        name: this.configManager.generateUniqueName(suggestedName, existingSources)
      };
    } else if (type === 'github' || input.startsWith('https://') || input.includes('github.com')) {
      // GitHub repository
      const cleanUrl = input.replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
      const parts = cleanUrl.split('/');
      suggestedName = parts[1] || parts[0] || 'github-source';
      
      config = {
        type: 'github',
        url: input.startsWith('http') ? input : `https://github.com/${cleanUrl}`,
        name: this.configManager.generateUniqueName(suggestedName, existingSources)
      };
    } else {
      // Local path - convert to absolute path
      const absolutePath = resolve(input);
      suggestedName = basename(input);
      config = {
        type: 'local',
        path: absolutePath,
        name: this.configManager.generateUniqueName(suggestedName, existingSources)
      };
    }
    return config;
  }

  async addSource(input: string, type: SourceType): Promise<{ name: string; config: AnySourceConfig }> {
    const existingSources = await this.configManager.listSources();
    const config = this._createSourceConfig(input, type, existingSources);

    // Validate the source
    const provider = this.createProvider(config);
    const validation = await provider.validateSource();
    
    if (!validation.valid) {
      throw new Error(`Source validation failed: ${validation.error}${validation.suggestions ? `\nSuggestions: ${validation.suggestions.join(', ')}` : ''}`);
    }

    // Add to configuration
    await this.configManager.addSource(config);

    return { name: config.name, config };
  }

  async removeSource(sourceName: string): Promise<void> {
    await this.configManager.removeSource(sourceName);
  }

  async listSources(): Promise<Record<string, AnySourceConfig>> {
    return await this.configManager.listSources();
  }

  async setActiveSource(sourceName: string): Promise<void> {
    await this.configManager.setActiveSource(sourceName);
  }

  async getActiveSource(): Promise<AnySourceConfig | null> {
    return await this.configManager.getActiveSource();
  }

  private async _getSourceConfig(sourceName?: string): Promise<AnySourceConfig> {
    const sourceConfig = sourceName 
      ? (await this.configManager.listSources())[sourceName]
      : await this.configManager.getActiveSource();

    if (!sourceConfig) {
      if (sourceName) {
        throw new Error(`Source '${sourceName}' not found`);
      } else {
        throw new Error('No active source configured. Use "cursor-rules source add" to add a source.');
      }
    }
    return sourceConfig;
  }

  isNetworkSource(sourceConfig: AnySourceConfig): boolean {
    return sourceConfig.type === 'github' || sourceConfig.type === 'npm';
  }

  async listRules(sourceName?: string): Promise<RuleMetadata[]> {
    const sourceConfig = await this._getSourceConfig(sourceName);
    const provider = this.createProvider(sourceConfig);
    return await provider.listRules();
  }

  async getRuleContent(rulePath: string, sourceName?: string): Promise<string> {
    // Validate rule path format
    if (!rulePath.endsWith('.mdc')) {
      throw new Error(`Rule path must end with .mdc: ${rulePath}`);
    }

    // Check for category-only paths (not allowed)
    if (!rulePath.includes('/') && rulePath === rulePath.replace('.mdc', '')) {
      // This check is for cases like "typescript" without .mdc
      // But we already validated it ends with .mdc above, so this is for additional validation
    }
    
    if (rulePath.endsWith('/')) {
      throw new Error(`Cannot install category without specific rule file: ${rulePath}`);
    }

    const sourceConfig = await this._getSourceConfig(sourceName);
    const provider = this.createProvider(sourceConfig);
    return await provider.getRuleContent(rulePath);
  }

  async validateRulePath(rulePath: string): Promise<{ valid: boolean; error?: string }> {
    // If ends with .mdc, use existing validation logic
    if (rulePath.endsWith('.mdc')) {
      // Cannot be just a category name
      const pathParts = rulePath.split('/');
      if (pathParts.length > 2) {
        return {
          valid: false,
          error: `Rule path cannot be more than 2 levels deep: ${rulePath}`
        };
      }

      // If it's a category/file.mdc format, category cannot be empty
      if (pathParts.length === 2 && !pathParts[0]) {
        return {
          valid: false,
          error: `Category name cannot be empty: ${rulePath}`
        };
      }

      return { valid: true };
    } else {
      // Folder name validation
      if (rulePath.includes('/')) {
        return { valid: false, error: `Folder name cannot contain slashes: ${rulePath}` };
      }
      if (!rulePath.trim()) {
        return { valid: false, error: 'Folder name cannot be empty' };
      }
      return { valid: true };
    }
  }

  async getRulesByCategory(categoryName: string, sourceName?: string): Promise<string[]> {
    const allRules = await this.listRules(sourceName);
    const categoryRules = allRules.filter(rule => rule.category === categoryName);
    return categoryRules.map(rule => 
      rule.category === 'default' ? `${rule.name}.mdc` : `${rule.category}/${rule.name}.mdc`
    );
  }

  async expandRulePath(rulePath: string, sourceName?: string): Promise<string[]> {
    if (rulePath.endsWith('.mdc')) {
      // Specific file path - validate and return as-is
      const validation = await this.validateRulePath(rulePath);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      return [rulePath];
    } else {
      // Folder name - expand to all files in folder
      const folderRules = await this.getRulesByCategory(rulePath, sourceName);
      if (folderRules.length === 0) {
        throw new Error(`No rules found in category '${rulePath}'`);
      }
      return folderRules;
    }
  }

  async renameSource(oldName: string, newName: string): Promise<void> {
    await this.configManager.renameSource(oldName, newName);
  }
}

export const sourceManager = new SourceManager(); 