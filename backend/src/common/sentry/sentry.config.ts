/**
 * Sentry configuration for District 13 Backend (T-64 / SDD 8.4)
 * Enforces NO PII (sendDefaultPii: false, strips sensitive fields).
 */
export interface SentryOptions {
  dsn?: string;
  environment?: string;
  sendDefaultPii: boolean;
  beforeSend?: (event: any) => any;
}

export function createSentryConfig(): SentryOptions {
  return {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Strictly disable Personal Identifiable Information
    sendDefaultPii: false,
    beforeSend(event) {
      // Scrub any request headers containing cookies, authorization, or tokens
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
        delete event.request.headers['x-csrf-token'];
      }
      // Scrub request body from containing password, pin, or tokens
      if (event.request?.data && typeof event.request.data === 'object') {
        const sensitiveKeys = [
          'password',
          'pin',
          'token',
          'refreshToken',
          'accessToken',
          'secret',
        ];
        for (const key of sensitiveKeys) {
          if (key in event.request.data) {
            event.request.data[key] = '[REDACTED]';
          }
        }
      }
      // Ensure user object does NOT include IP address, email, or real names
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },
  };
}
