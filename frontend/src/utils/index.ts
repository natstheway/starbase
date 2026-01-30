import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { Severity } from '../types';

// Format date for display
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

// Format relative time
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

// Get severity color class
export function getSeverityClass(severity?: Severity | string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'severity-critical';
    case 'high':
      return 'severity-high';
    case 'medium':
      return 'severity-medium';
    case 'low':
      return 'severity-low';
    default:
      return 'severity-info';
  }
}

// Get severity badge color for Tailwind
export function getSeverityBgColor(severity?: Severity | string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

// Get entity class icon
export function getEntityIcon(entityClass?: string): string {
  switch (entityClass?.toLowerCase()) {
    case 'account':
      return '🏢';
    case 'organization':
      return '🏛️';
    case 'domain':
      return '🌐';
    case 'host':
      return '💻';
    case 'ipaddress':
      return '📍';
    case 'port':
      return '🚪';
    case 'service':
      return '⚙️';
    case 'vulnerability':
      return '🔓';
    case 'finding':
      return '🔍';
    case 'certificate':
      return '📜';
    case 'assessment':
      return '📊';
    case 'threat':
      return '⚠️';
    case 'risk':
      return '⛔';
    default:
      return '📦';
  }
}

// Get node color for graph visualization
export function getNodeColor(entityClass?: string): string {
  const colors: Record<string, string> = {
    account: '#6366f1',      // Indigo
    organization: '#8b5cf6', // Purple
    domain: '#0ea5e9',       // Sky
    host: '#06b6d4',         // Cyan
    ipaddress: '#14b8a6',    // Teal
    port: '#22c55e',         // Green
    service: '#84cc16',      // Lime
    vulnerability: '#ef4444', // Red
    finding: '#f97316',      // Orange
    certificate: '#eab308',  // Yellow
    assessment: '#3b82f6',   // Blue
    threat: '#dc2626',       // Red
    risk: '#f59e0b',         // Amber
  };
  return colors[entityClass?.toLowerCase() || ''] || '#6b7280'; // Gray default
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Convert camelCase to Title Case
export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Parse entity type to readable name
export function parseEntityType(type: string): string {
  // Remove common prefixes
  const cleaned = type
    .replace(/^(bitsight_|ctm360_|tenable_easm_|easm_scanner_)/, '')
    .replace(/_/g, ' ');
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Group entities by class
export function groupByClass<T extends { class: string }>(entities: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entity of entities) {
    const group = groups.get(entity.class) || [];
    group.push(entity);
    groups.set(entity.class, group);
  }
  return groups;
}
