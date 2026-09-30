import * as Sentry from '@sentry/browser';

const NETWORK_ERRORS = [
  /^AbortError$/,
  /^TypeError: Failed to fetch$/,
  /^TypeError: NetworkError when attempting to fetch resource\.$/,
  /^TypeError: Load failed$/,
  /^TypeError: cancelled$/,
];

export function initMonitoring(): void {
  const dsn: string | undefined = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD) return;

  Sentry.init({
    dsn,
    environment: 'production',
    release: `pokedex@${import.meta.env.VITE_APP_VERSION ?? '1.0.0'}`,
    // SDK v11 replaced `sendDefaultPii: false` with `dataCollection`, whose
    // defaults are permissive (user info, cookies, headers, bodies, query
    // params). Opt out explicitly: only the error and its stack trace are sent.
    dataCollection: {
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
    },
    // v11 defaults this to true; keep v10 behaviour so non-Error throws (often
    // from extensions) arrive without frames and are dropped by beforeSend.
    attachStacktrace: false,
    tracesSampleRate: 0,
    allowUrls: [/pokedex-aghirculesei\.pages\.dev/],
    ignoreErrors: NETWORK_ERRORS,
    beforeSend(event) {
      // Drop events with no usable stack (e.g. browser extensions)
      const frames = event.exception?.values?.[0]?.stacktrace?.frames;
      if (frames?.length === 0) return null;
      return event;
    },
  });
}
