import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { NAME } from '../variables';

import type { GlobalConfig, AnySourceConfig } from './types';
export class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = join(homedir(), `.${NAME}`);
    this.configPath = join(this.configDir, 'config.json');
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.access(this.configDir);
    } catch {
      await fs.mkdir(this.configDir, { recursive: true });
    }
  }

  private getDefaultConfig(): GlobalConfig {
    return {
      version: '1.0',
      sources: {},
      activeSource: undefined,
    };
  }

  async loadConfig(): Promise<GlobalConfig> {
    await this.ensureConfigDir();
    
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(content) as GlobalConfig;
      return { ...this.getDefaultConfig(), ...config };
    } catch {
      const defaultConfig = this.getDefaultConfig();
      await this.saveConfig(defaultConfig);
      return defaultConfig;
    }
  }

  async saveConfig(config: GlobalConfig): Promise<void> {
    await this.ensureConfigDir();
    const jsonContent = JSON.stringify(config, null, 2);
    await fs.writeFile(this.configPath, jsonContent, 'utf8');
  }

  async addSource(sourceConfig: AnySourceConfig): Promise<void> {
    const config = await this.loadConfig();
    config.sources[sourceConfig.name] = sourceConfig;
    
    // Set as active source if no active source is set
    if (!config.activeSource) {
      config.activeSource = sourceConfig.name;
    }
    
    await this.saveConfig(config);
  }

  async removeSource(sourceName: string): Promise<void> {
    const config = await this.loadConfig();
    delete config.sources[sourceName];
    
    // Clear active source if it was the removed source
    if (config.activeSource === sourceName) {
      const remainingSources = Object.keys(config.sources);
      config.activeSource = remainingSources.length > 0 ? remainingSources[0] : undefined;
    }
    
    await this.saveConfig(config);
  }

  async setActiveSource(sourceName: string): Promise<void> {
    const config = await this.loadConfig();
    
    if (!config.sources[sourceName]) {
      throw new Error(`Source '${sourceName}' not found`);
    }
    
    config.activeSource = sourceName;
    await this.saveConfig(config);
  }

  async getActiveSource(): Promise<AnySourceConfig | null> {
    const config = await this.loadConfig();
    
    if (!config.activeSource) {
      return null;
    }
    
    return config.sources[config.activeSource] || null;
  }

  async listSources(): Promise<Record<string, AnySourceConfig>> {
    const config = await this.loadConfig();
    return config.sources;
  }

  async hasSource(sourceName: string): Promise<boolean> {
    const config = await this.loadConfig();
    return sourceName in config.sources;
  }

  generateUniqueName(baseName: string, existingSources: Record<string, AnySourceConfig>): string {
    let name = baseName;
    let counter = 1;
    
    while (name in existingSources) {
      name = `${baseName}-${counter}`;
      counter++;
    }
    
    return name;
  }

  async renameSource(oldName: string, newName: string): Promise<void> {
    const config = await this.loadConfig();
    
    // Validate oldName exists
    if (!config.sources[oldName]) {
      throw new Error(`Source '${oldName}' not found`);
    }
    
    // Validate newName doesn't already exist
    if (config.sources[newName]) {
      throw new Error(`Source '${newName}' already exists`);
    }
    
    // Validate newName is valid format
    if (!newName.trim()) {
      throw new Error('New source name cannot be empty');
    }
    
    // Create new source entry with same configuration but new name
    const sourceConfig = { ...config.sources[oldName] };
    sourceConfig.name = newName;
    config.sources[newName] = sourceConfig;
    
    // Update activeSource if it matches oldName
    if (config.activeSource === oldName) {
      config.activeSource = newName;
    }
    
    // Remove old source entry
    delete config.sources[oldName];
    
    // Save updated configuration
    await this.saveConfig(config);
  }
} 