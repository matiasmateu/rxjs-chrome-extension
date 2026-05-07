import type { FilterTags } from '../types';
import { firstString } from './StringUtils';
import type { RuntimeMarbleMessage } from './runtime-types';

function normalizeTypeLabel(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('•')) {
    const parts = trimmed.split('•');
    return parts[parts.length - 1].trim();
  }
  return trimmed;
}

function prettifyDomain(domain?: string): string {
  if (!domain) return '';
  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Extracts filter tags used by the panel domain filter controls.
 *
 * @param message Runtime marble message candidate.
 * @returns Normalized domain key/label pair.
 */
export function extractFilterTags(
  message: Partial<RuntimeMarbleMessage> | null | undefined,
): FilterTags {
  const domainRaw = normalizeTypeLabel(firstString(message?.source?.domain, message?.domain));
  const domainKey = (domainRaw || 'unknown').toLowerCase();

  return {
    domainKey,
    domainLabel: domainRaw ? prettifyDomain(domainRaw) || domainRaw : 'Unknown',
  };
}
