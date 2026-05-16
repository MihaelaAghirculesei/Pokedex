import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPokemons, fetchOnePokemon, fetchAllPokemonDetails, getErrorMessage } from '../api.js';

function mockResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchWithRetry — via fetchPokemons', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns on first attempt when the API responds 200', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(200, { results: [] }));

    const result = await fetchPokemons(0, 10, signal);

    expect(result).toEqual({ results: [] });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds on the second attempt', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200, { results: [] }));

    const promise = fetchPokemons(0, 10, signal);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ results: [] });
  });

  it('retries on 503 and succeeds on the second attempt', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(200, { results: [] }));

    const promise = fetchPokemons(0, 10, signal);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ results: [] });
  });

  it('throws after exhausting all 3 retries (4 total calls)', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(500));

    // Catch eagerly to prevent unhandled rejection during timer advancement
    const promise = fetchPokemons(0, 10, signal).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    const error = await promise;

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('HTTP 500');
    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
  });

  it('does not retry on 404', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(404));

    await expect(fetchPokemons(0, 10, signal)).rejects.toThrow('HTTP 404');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the AbortSignal fires', async () => {
    const controller = new AbortController();
    const abortError = Object.assign(new Error('The user aborted a request.'), {
      name: 'AbortError',
    });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
    controller.abort();

    await expect(fetchPokemons(0, 10, controller.signal)).rejects.toThrow(
      'The user aborted a request.',
    );
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchWithRetry — via fetchOnePokemon', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retries on 429 and succeeds', async () => {
    const signal = new AbortController().signal;
    const pokemon = { id: 1, name: 'bulbasaur' };
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200, pokemon));

    const promise = fetchOnePokemon('https://pokeapi.co/api/v2/pokemon/1', signal);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({ id: 1, name: 'bulbasaur' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('sleep abort — via fetchPokemons', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('rejects when AbortSignal fires during the retry sleep delay', async () => {
    const controller = new AbortController();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(429));

    const promise = fetchPokemons(0, 10, controller.signal).catch((e: unknown) => e);

    // Let the 429 fetch microtask resolve so fetchWithRetry enters sleep()
    await Promise.resolve();

    // Abort while sleeping — triggers onAbort inside sleep()
    controller.abort();

    const error = await promise;
    expect(error).toBeInstanceOf(Error);
  });
});

describe('fetchAllPokemonDetails', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns all pokemon when every request succeeds', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockResponse(200, { id: 1, name: 'bulbasaur' }))
      .mockResolvedValueOnce(mockResponse(200, { id: 4, name: 'charmander' }));

    const result = await fetchAllPokemonDetails(
      [
        { url: 'https://pokeapi.co/api/v2/pokemon/1' },
        { url: 'https://pokeapi.co/api/v2/pokemon/4' },
      ],
      signal,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, name: 'bulbasaur' });
    expect(result[1]).toMatchObject({ id: 4, name: 'charmander' });
  });

  it('returns only the successful pokemon when some requests fail', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockResponse(200, { id: 1, name: 'bulbasaur' }))
      .mockResolvedValueOnce(mockResponse(404));

    const result = await fetchAllPokemonDetails(
      [
        { url: 'https://pokeapi.co/api/v2/pokemon/1' },
        { url: 'https://pokeapi.co/api/v2/pokemon/bad' },
      ],
      signal,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, name: 'bulbasaur' });
  });

  it('throws the first error when all requests fail', async () => {
    const signal = new AbortController().signal;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(404));

    await expect(
      fetchAllPokemonDetails([{ url: 'https://pokeapi.co/api/v2/pokemon/1' }], signal),
    ).rejects.toThrow('HTTP 404');
  });

  it('returns an empty array when given no URLs', async () => {
    const signal = new AbortController().signal;

    const result = await fetchAllPokemonDetails([], signal);

    expect(result).toEqual([]);
  });
});

describe('getErrorMessage', () => {
  it('returns rate-limit message for 429 errors', () => {
    expect(getErrorMessage(new Error('HTTP 429: Too Many Requests'))).toContain(
      'Too many requests',
    );
  });

  it('returns server error message for 5xx errors', () => {
    expect(getErrorMessage(new Error('HTTP 503: Service Unavailable'))).toContain(
      'temporarily unavailable',
    );
  });

  it('returns generic message for network errors', () => {
    expect(getErrorMessage(new Error('Failed to fetch'))).toContain('Check your connection');
  });
});
