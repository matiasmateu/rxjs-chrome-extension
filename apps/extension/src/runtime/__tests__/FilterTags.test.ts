import { describe, expect, it } from 'vitest';
import { extractFilterTags } from '../FilterTags';

describe('extractFilterTags', () => {
  it('prefers source.domain and normalizes formatted labels', () => {
    const tags = extractFilterTags({
      source: {
        domain: 'core • media-player',
      },
    });

    expect(tags).toEqual({
      domainKey: 'media-player',
      domainLabel: 'Media Player',
    });
  });

  it('falls back to top-level domain and prettifies separators', () => {
    const tags = extractFilterTags({
      domain: 'user_profile',
    });

    expect(tags).toEqual({
      domainKey: 'user_profile',
      domainLabel: 'User Profile',
    });
  });

  it('returns Unknown when no domain information exists', () => {
    const tags = extractFilterTags(undefined);

    expect(tags).toEqual({
      domainKey: 'unknown',
      domainLabel: 'Unknown',
    });
  });
});
