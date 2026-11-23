/**
 * Sentry Configuration for District 13 Frontend / PWA (T-64)
 * Zero PII collection (sendDefaultPii: false).
 */
export interface ClientSentryOptions {
  dsn?: string;
  environment?: string;
  sendDefaultPii: boolean;
  tracesSampleRate: number;
}

export function initClientSentry(): ClientSentryOptions {
  return {
    dsn: (import.meta as any).env?.VITE_SENTRY_DSN,
    environment: (import.meta as any).env?.MODE || "development",
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  };
}
