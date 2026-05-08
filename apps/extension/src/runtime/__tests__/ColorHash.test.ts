import { describe, expect, it } from 'vitest';
import { semanticMarbleColor } from '../ColorHash';

describe('semanticMarbleColor', () => {
  it('returns deterministic color for same kind and domain', () => {
    const first = semanticMarbleColor({
      kind: 'next',
      type: 'NEXT',
      domainKey: 'playground',
    });
    const second = semanticMarbleColor({
      kind: 'next',
      type: 'NEXT',
      domainKey: 'playground',
    });

    expect(first).toBe(second);
  });

  it('uses different semantic colors for different rx kinds', () => {
    const nextColor = semanticMarbleColor({
      kind: 'next',
      type: 'NEXT',
      domainKey: 'playground',
    });
    const errorColor = semanticMarbleColor({
      kind: 'error',
      type: 'ERROR',
      domainKey: 'playground',
    });

    expect(nextColor).not.toBe(errorColor);
  });

  it('applies deterministic domain tint variation', () => {
    const playground = semanticMarbleColor({
      kind: 'next',
      type: 'NEXT',
      domainKey: 'playground',
    });
    const api = semanticMarbleColor({
      kind: 'next',
      type: 'NEXT',
      domainKey: 'api',
    });

    expect(playground).not.toBe(api);
  });
});
