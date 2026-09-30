import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BrowserOptions, ErrorEvent } from '@sentry/browser';

const { init } = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('@sentry/browser', () => ({ init }));

async function loadAndInit(): Promise<void> {
  const { initMonitoring } = await import('../monitoring.js');
  initMonitoring();
}

function initOptions(): BrowserOptions {
  expect(init).toHaveBeenCalledOnce();
  return init.mock.calls[0]?.[0] as BrowserOptions;
}

describe('initMonitoring', () => {
  beforeEach(() => {
    vi.resetModules();
    init.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does nothing without a DSN', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', '');
    await loadAndInit();
    expect(init).not.toHaveBeenCalled();
  });

  it('does nothing outside production builds', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@o0.ingest.sentry.io/0');
    await loadAndInit();
    expect(init).not.toHaveBeenCalled();
  });

  describe('in production with a DSN', () => {
    beforeEach(() => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_SENTRY_DSN', 'https://key@o0.ingest.sentry.io/0');
    });

    it('opts out of every personal-data collection category', async () => {
      await loadAndInit();
      expect(initOptions().dataCollection).toEqual({
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        stackFrameVariables: false,
        graphQL: { document: false, variables: false },
        genAI: { inputs: false, outputs: false },
        databaseQueryData: false,
        queues: false,
      });
    });

    it('keeps tracing off and synthetic stack traces disabled', async () => {
      await loadAndInit();
      expect(initOptions()).toMatchObject({ tracesSampleRate: 0, attachStacktrace: false });
    });

    it('drops events whose stack trace has no frames', async () => {
      await loadAndInit();
      const beforeSend = initOptions().beforeSend;
      const frameless: ErrorEvent = {
        type: undefined,
        exception: { values: [{ stacktrace: { frames: [] } }] },
      };
      const withFrames: ErrorEvent = {
        type: undefined,
        exception: { values: [{ stacktrace: { frames: [{ filename: 'app.js' }] } }] },
      };

      expect(beforeSend?.(frameless, {})).toBeNull();
      expect(beforeSend?.(withFrames, {})).toBe(withFrames);
    });
  });
});
