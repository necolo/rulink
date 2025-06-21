import { promises as fs } from 'fs';
import { join, basename, dirname } from 'path';
import type { SourceProvider } from '../types';
import type { RuleMetadata } from '../../types';
import type { ValidationResult, LocalSourceConfig } from '../../config/types';

export class LocalSourceProvider implements SourceProvider {
  constructor(private config: LocalSourceConfig) {}

  async validateSource(): Promise<ValidationResult> {
    try {
      const stats = await fs.stat(this.config.path);
      
      if (!stats.isDirectory()) {
        return {
          valid: false,
          error: 'Path is not a directory',
          suggestions: ['Ensure the path points to a directory containing .mdc files']
        };
      }

      // Check if directory contains .mdc files or subdirectories with .mdc files
      const hasValidStructure = await this.hasValidRuleStructure(this.config.path);
      
      if (!hasValidStructure) {
        return {
          valid: false,
          error: 'No .mdc files found in directory',
          suggestions: [
            'Ensure the directory contains .mdc files',
            'Check if .mdc files are in subdirectories (max 2 levels deep)'
          ]
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Cannot access path: ${error}`,
        suggestions: ['Check if the path exists and is readable']
      };
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
    const rules: RuleMetadata[] = [];
    await this.scanDirectory(this.config.path, rules);
    return rules;
  }

  private async scanDirectory(dirPath: string, rules: RuleMetadata[], category?: string, depth = 0): Promise<void> {
    if (depth > 1) return; // Max 2 levels deep
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.mdc')) {
          const ruleName = entry.name.replace('.mdc', '');
          const absolutePath = join(dirPath, entry.name);
          rules.push({
            category: category || 'default',
            name: ruleName,
            description: undefined,
            globs: undefined,
            alwaysApply: undefined,
            absolutePath
          });
        } else if (entry.isDirectory() && depth === 0) {
          await this.scanDirectory(
            join(dirPath, entry.name), 
            rules, 
            entry.name, 
            depth + 1
          );
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan directory ${dirPath}: ${error}`);
    }
  }

  async getRuleContent(rulePath: string): Promise<string> {
    let fullPath: string;
    
    // Handle both "file.mdc" and "category/file.mdc" formats
    if (rulePath.includes('/')) {
      const [category, filename] = rulePath.split('/');
      if (!filename.endsWith('.mdc')) {
        throw new Error(`Rule path must end with .mdc: ${rulePath}`);
      }
      fullPath = join(this.config.path, category, filename);
    } else {
      if (!rulePath.endsWith('.mdc')) {
        throw new Error(`Rule path must end with .mdc: ${rulePath}`);
      }
      fullPath = join(this.config.path, rulePath);
    }
    
    try {
      return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read rule file ${fullPath}: ${error}`);
    }
  }
} 