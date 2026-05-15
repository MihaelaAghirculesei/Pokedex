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
    sendDefaultPii: false,
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
