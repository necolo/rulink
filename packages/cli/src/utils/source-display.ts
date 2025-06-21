import type { AnySourceConfig } from '../config/types';

export interface SourceDisplayInfo {
  icon: string;
  description: string;
  location: string;
}

export function getSourceDisplayInfo(sourceConfig: AnySourceConfig): SourceDisplayInfo {
  switch (sourceConfig.type) {
    case 'github':
      return {
        icon: '🔗',
        description: 'GitHub',
        location: sourceConfig.url.replace(/^https?:\/\//, '').replace(/^github\.com\//, '')
      };
    case 'npm':
      return {
        icon: '📦',
        description: 'NPM',
        location: sourceConfig.package
      };
    case 'local':
      return {
        icon: '📁',
        description: 'Local',
        location: sourceConfig.path
      };
    default:
      return {
        icon: '❓',
        description: 'Unknown',
        location: 'unknown'
      };
  }
}

export function formatSourceDestination(sourceDisplayInfo: SourceDisplayInfo, sourceName: string, destination: string): string {
  return `${sourceDisplayInfo.icon} Installing rules from ${sourceName} (${sourceDisplayInfo.description}: ${sourceDisplayInfo.location}) → ${destination}`;
} 