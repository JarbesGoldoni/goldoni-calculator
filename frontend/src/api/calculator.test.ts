import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculate, ENDPOINT_MAP } from './calculator';

describe('Calculator API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps all expected operators in ENDPOINT_MAP', () => {
    expect(ENDPOINT_MAP['+']).toBe('/api/add');
    expect(ENDPOINT_MAP['-']).toBe('/api/subtract');
    expect(ENDPOINT_MAP['×']).toBe('/api/multiply');
    expect(ENDPOINT_MAP['÷']).toBe('/api/divide');
    expect(ENDPOINT_MAP['^']).toBe('/api/power');
    expect(ENDPOINT_MAP['√']).toBe('/api/sqrt');
    expect(ENDPOINT_MAP['%']).toBe('/api/percentage');
  });

  it('throws an error immediately and does not call fetch for unknown operator', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(calculate('invalid', [1, 2])).rejects.toThrow(
      'Unsupported operator: invalid'
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('performs a successful POST request and returns result and expression', async () => {
    const mockResponse = { result: 8, expression: '5 + 3' };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const data = await calculate('+', [5, 3]);

    expect(fetchSpy).toHaveBeenCalledWith('/api/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ arguments: [5, 3] }),
    });
    expect(data).toEqual(mockResponse);
  });

  it('throws error with message from API error response when response is not ok', async () => {
    const mockErrorResponse = { error: 'division by zero', expression: '10 / 0' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => mockErrorResponse,
    } as unknown as Response);

    await expect(calculate('÷', [10, 0])).rejects.toThrow('division by zero');
  });

  it('falls back to default error message when error JSON has no error property', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({}),
    } as unknown as Response);

    await expect(calculate('+', [1, 2])).rejects.toThrow('Computation failed');
  });

  it('handles error response when json decoding fails gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    await expect(calculate('+', [1, 2])).rejects.toThrow('Internal Server Error');
  });
});
