import { SourceType } from '../config/types';

function isLocalPath(input: string): boolean {
  // Check for absolute paths (starting with /)
  if (input.startsWith('/')) return true;
  
  // Check for relative paths (starting with ./ or ../)
  if (input.startsWith('./') || input.startsWith('../')) return true;
  
  // Check for Windows-style paths (starting with drive letter)
  if (/^[a-zA-Z]:[\\\/]/.test(input)) return true;
  
  return false;
}

function isGithubLink(input: string): boolean {
  return input.includes('github.com');
}

export function getProvider(input: string): SourceType {
  if (isLocalPath(input)) return 'local';
  if (isGithubLink(input)) return 'github';
  return 'npm';
}