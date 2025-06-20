import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { promises as fs } from 'fs';
import type { SourceProvider } from '../types.js';
import type { RuleMetadata } from '../../types.js';
import type { ValidationResult, NpmSourceConfig } from '../../config/types.js';

const execAsync = promisify(exec);

export class NpmSourceProvider implements SourceProvider {
  constructor(private config: NpmSourceConfig) {}

  async validateSource(): Promise<ValidationResult> {
    try {
      // Check if package exists on npm registry
      const packageInfo = await this.fetchPackageInfo();
      
      if (!packageInfo) {
        return {
          valid: false,
          error: 'Package not found on npm registry',
          suggestions: ['Check if the package name is correct', 'Ensure the package is published']
        };
      }

      // Try to install package temporarily to validate structure
      const hasValidStructure = await this.validatePackageStructure();
      
      if (!hasValidStructure) {
        return {
          valid: false,
          error: 'Package does not contain .mdc files',
          suggestions: ['Ensure the package contains .mdc files in the root or subdirectories']
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to validate npm package: ${error}`,
        suggestions: ['Check your internet connection', 'Verify the package name is correct']
      };
    }
  }

  private async fetchPackageInfo(): Promise<any> {
    const registryUrl = `https://registry.npmjs.org/${this.config.package}`;
    
    try {
      const response = await fetch(registryUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Registry error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch package info: ${error}`);
    }
  }

  private async validatePackageStructure(): Promise<boolean> {
    const tempDir = `/tmp/cursor-rules-npm-${Date.now()}`;
    
    try {
      // Install package to temporary directory
      await execAsync(`mkdir -p ${tempDir}`);
      await execAsync(`cd ${tempDir} && npm init -y`);
      await execAsync(`cd ${tempDir} && npm install ${this.config.package} --no-save`);
      
      // Check the installed package for .mdc files
      const packagePath = join(tempDir, 'node_modules', this.config.package);
      const hasValidStructure = await this.hasValidRuleStructure(packagePath);
      
      // Clean up
      await execAsync(`rm -rf ${tempDir}`);
      
      return hasValidStructure;
    } catch (error) {
      // Clean up on error
      try {
        await execAsync(`rm -rf ${tempDir}`);
      } catch {}
      throw new Error(`Failed to validate package structure: ${error}`);
    }
  }

  private async hasValidRuleStructure(dirPath: string, depth = 0): Promise<boolean> {
    if (depth > 1) return false; // Max 2 levels deep
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Check for .mdc files at current level
      const hasMdcFiles = entries.some(entry => 
        entry.isFile() && entry.name.endsWith('.mdc')
      );
      
      if (hasMdcFiles) return true;
      
      // Check subdirectories if at depth 0
      if (depth === 0) {
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const hasNestedMdc = await this.hasValidRuleStructure(
              join(dirPath, entry.name), 
              depth + 1
            );
            if (hasNestedMdc) return true;
          }
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  async listRules(): Promise<RuleMetadata[]> {
    const tempDir = `/tmp/cursor-rules-npm-${Date.now()}`;
    
    try {
      // Install package to temporary directory
      await execAsync(`mkdir -p ${tempDir}`);
      await execAsync(`cd ${tempDir} && npm init -y`);
      await execAsync(`cd ${tempDir} && npm install ${this.config.package} --no-save`);
      
      // Scan the installed package for rules
      const packagePath = join(tempDir, 'node_modules', this.config.package);
      const rules = await this.scanDirectoryForRules(packagePath);
      
      // Clean up
      await execAsync(`rm -rf ${tempDir}`);
      
      return rules;
    } catch (error) {
      // Clean up on error
      try {
        await execAsync(`rm -rf ${tempDir}`);
      } catch {}
      throw new Error(`Failed to list rules: ${error}`);
    }
  }

  private async scanDirectoryForRules(dirPath: string, category?: string, depth = 0): Promise<RuleMetadata[]> {
    if (depth > 1) return []; // Max 2 levels deep
    
    const rules: RuleMetadata[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.mdc')) {
          const ruleName = entry.name.replace('.mdc', '');
          rules.push({
            category: category || 'default',
            name: ruleName,
            description: undefined,
            globs: undefined,
            alwaysApply: undefined
          });
        } else if (entry.isDirectory() && depth === 0) {
          const subdirRules = await this.scanDirectoryForRules(
            join(dirPath, entry.name), 
            entry.name, 
            depth + 1
          );
          rules.push(...subdirRules);
        }
      }
    } catch (error) {
      // Ignore errors for individual directories
    }
    
    return rules;
  }

  async getRuleContent(rulePath: string): Promise<string> {
    const tempDir = `/tmp/cursor-rules-npm-${Date.now()}`;
    
    try {
      // Install package to temporary directory
      await execAsync(`mkdir -p ${tempDir}`);
      await execAsync(`cd ${tempDir} && npm init -y`);
      await execAsync(`cd ${tempDir} && npm install ${this.config.package} --no-save`);
      
      // Find and read the rule file
      const packagePath = join(tempDir, 'node_modules', this.config.package);
      let fullRulePath: string;
      
      if (rulePath.includes('/')) {
        const [category, filename] = rulePath.split('/');
        fullRulePath = join(packagePath, category, filename);
      } else {
        fullRulePath = join(packagePath, rulePath);
      }
      
      const content = await fs.readFile(fullRulePath, 'utf8');
      
      // Clean up
      await execAsync(`rm -rf ${tempDir}`);
      
      return content;
    } catch (error) {
      // Clean up on error
      try {
        await execAsync(`rm -rf ${tempDir}`);
      } catch {}
      throw new Error(`Failed to get rule content: ${error}`);
    }
  }
} 