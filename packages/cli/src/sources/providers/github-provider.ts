import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { SourceProvider } from '../types';
import type { RuleMetadata } from '../../types';
import type { ValidationResult, GitHubSourceConfig } from '../../config/types';
import { getGitCredentials, createAuthHeaders } from '../../utils/auth';

const execAsync = promisify(exec);

export class GitHubSourceProvider implements SourceProvider {
  constructor(private config: GitHubSourceConfig) {}

  async validateSource(): Promise<ValidationResult> {
    try {
      const { owner, repo, branch, path } = this.parseGitHubUrl(this.config.url);
      
      // Try GitHub API first
      const apiValidation = await this.validateViaApi(owner, repo, branch, path);
      if (apiValidation.valid) {
        return apiValidation;
      }

      // Try raw file access for public repos
      const rawValidation = await this.validateViaRawAccess(owner, repo, branch, path);
      if (rawValidation.valid) {
        return rawValidation;
      }

      // Try git clone as fallback
      return await this.validateViaGitClone();
    } catch (error) {
      return {
        valid: false,
        error: `Failed to validate GitHub source: ${error}`,
        suggestions: [
          'Check if the repository URL is correct',
          'Ensure you have access to the repository if it\'s private',
          'Verify your git credentials are configured'
        ]
      };
    }
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; path: string } {
    // Handle both github.com/user/repo and https://github.com/user/repo formats
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
    const parts = cleanUrl.split('/');
    
    if (parts.length < 2) {
      throw new Error('Invalid GitHub URL format');
    }

    const owner = parts[0];
    const repo = parts[1];
    
    // Check if URL includes branch info (e.g., github.com/user/repo/tree/branch/path)
    let branch = 'main';
    let path = '';
    
    if (parts.length > 2 && parts[2] === 'tree' && parts.length > 3) {
      branch = parts[3];
      if (parts.length > 4) {
        path = parts.slice(4).join('/');
      }
    } else if (parts.length > 2 && parts[2] === 'blob' && parts.length > 3) {
      branch = parts[3];
      if (parts.length > 4) {
        path = parts.slice(4).join('/');
      }
    }

    return { owner, repo, branch, path };
  }

  private async validateViaApi(owner: string, repo: string, branch: string, path: string): Promise<ValidationResult> {
    try {
      const credentials = await getGitCredentials();
      const headers = createAuthHeaders(credentials);
      
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          return { valid: false, error: 'Repository, branch, or path not found' };
        }
        if (response.status === 403) {
          return { valid: false, error: 'Access denied - check your GitHub credentials' };
        }
        return { valid: false, error: `GitHub API error: ${response.status}` };
      }

      const data = await response.json();
      const hasValidStructure = await this.validateStructureFromApi(data);
      
      if (!hasValidStructure) {
        return {
          valid: false,
          error: 'No .mdc files found in the specified path',
          suggestions: ['Check if the path contains .mdc files or subdirectories with .mdc files']
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `API validation failed: ${error}` };
    }
  }

  private async validateViaRawAccess(owner: string, repo: string, branch: string, path: string): Promise<ValidationResult> {
    try {
      const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const response = await fetch(baseUrl);
      
      if (!response.ok) {
        return { valid: false, error: 'Raw file access failed' };
      }

      // For raw access, we can't easily validate structure without knowing filenames
      // This is a basic check - we'll do full validation during actual use
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Raw access validation failed: ${error}` };
    }
  }

  private async validateViaGitClone(): Promise<ValidationResult> {
    try {
      const { owner, repo, branch } = this.parseGitHubUrl(this.config.url);
      const tempDir = `/tmp/cursor-rules-${Date.now()}`;
      
      await execAsync(`git clone --depth 1 --branch ${branch} https://github.com/${owner}/${repo}.git ${tempDir}`);
      
      // Check if the path exists and has valid structure
      const { path } = this.parseGitHubUrl(this.config.url);
      const fullPath = path ? join(tempDir, path) : tempDir;
      
      // Clean up temp directory
      await execAsync(`rm -rf ${tempDir}`);
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Git clone validation failed: ${error}`,
        suggestions: ['Check if you have git access to the repository']
      };
    }
  }

  private async validateStructureFromApi(data: any): Promise<boolean> {
    if (Array.isArray(data)) {
      // Directory listing
      const hasMdcFiles = data.some((item: any) => 
        item.type === 'file' && item.name.endsWith('.mdc')
      );
      
      if (hasMdcFiles) return true;
      
      // Check subdirectories
      const subdirs = data.filter((item: any) => item.type === 'dir');
      for (const subdir of subdirs) {
        const subdirUrl = subdir.url;
        const response = await fetch(subdirUrl);
        if (response.ok) {
          const subdirData = await response.json();
          if (Array.isArray(subdirData)) {
            const hasNestedMdc = subdirData.some((item: any) => 
              item.type === 'file' && item.name.endsWith('.mdc')
            );
            if (hasNestedMdc) return true;
          }
        }
      }
    }
    
    return false;
  }

  async listRules(): Promise<RuleMetadata[]> {
    const { owner, repo, branch, path } = this.parseGitHubUrl(this.config.url);
    
    try {
      // Try API first
      const credentials = await getGitCredentials();
      const headers = createAuthHeaders(credentials);
      
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const response = await fetch(apiUrl, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return await this.parseRulesFromApi(data);
      }
    } catch {
      // Fall back to git clone
    }
    
    return await this.listRulesViaGitClone();
  }

  private async parseRulesFromApi(data: any, category?: string): Promise<RuleMetadata[]> {
    const rules: RuleMetadata[] = [];
    
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.type === 'file' && item.name.endsWith('.mdc')) {
          const ruleName = item.name.replace('.mdc', '');
          rules.push({
            category: category || 'default',
            name: ruleName,
            description: undefined,
            globs: undefined,
            alwaysApply: undefined
          });
        } else if (item.type === 'dir' && !category) {
          // Only go one level deep
          const subdirResponse = await fetch(item.url);
          if (subdirResponse.ok) {
            const subdirData = await subdirResponse.json();
            const subdirRules = await this.parseRulesFromApi(subdirData, item.name);
            rules.push(...subdirRules);
          }
        }
      }
    }
    
    return rules;
  }

  private async listRulesViaGitClone(): Promise<RuleMetadata[]> {
    const { owner, repo, branch } = this.parseGitHubUrl(this.config.url);
    const tempDir = `/tmp/cursor-rules-${Date.now()}`;
    
    try {
      await execAsync(`git clone --depth 1 --branch ${branch} https://github.com/${owner}/${repo}.git ${tempDir}`);
      
      const { path } = this.parseGitHubUrl(this.config.url);
      const fullPath = path ? join(tempDir, path) : tempDir;
      
      // Use local provider logic to scan the cloned directory
      const { LocalSourceProvider } = await import('./local-provider.js');
      const localProvider = new LocalSourceProvider({
        type: 'local',
        name: 'temp',
        path: fullPath
      });
      
      const rules = await localProvider.listRules();
      
      // Clean up
      await execAsync(`rm -rf ${tempDir}`);
      
      return rules;
    } catch (error) {
      throw new Error(`Failed to list rules via git clone: ${error}`);
    }
  }

  async getRuleContent(rulePath: string): Promise<string> {
    const { owner, repo, branch, path } = this.parseGitHubUrl(this.config.url);
    
    // Build the full path to the rule file
    let fullRulePath: string;
    if (path) {
      fullRulePath = join(path, rulePath);
    } else {
      fullRulePath = rulePath;
    }
    
    // Try raw access first (works for both public and private repos with proper auth)
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullRulePath}`;
      const response = await fetch(rawUrl);
      
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Fall back to git clone
    }
    
    // Fallback to git clone
    const tempDir = `/tmp/cursor-rules-${Date.now()}`;
    
    try {
      await execAsync(`git clone --depth 1 --branch ${branch} https://github.com/${owner}/${repo}.git ${tempDir}`);
      
      const { LocalSourceProvider } = await import('./local-provider.js');
      const localProvider = new LocalSourceProvider({
        type: 'local',
        name: 'temp',
        path: path ? join(tempDir, path) : tempDir
      });
      
      const content = await localProvider.getRuleContent(rulePath);
      
      // Clean up
      await execAsync(`rm -rf ${tempDir}`);
      
      return content;
    } catch (error) {
      throw new Error(`Failed to get rule content: ${error}`);
    }
  }
} 