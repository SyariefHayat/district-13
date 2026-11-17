import { Injectable, LoggerService, Scope } from '@nestjs/common';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
]);

function redactSensitive(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitive);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitive(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

@Injectable({ scope: Scope.DEFAULT })
export class PinoLoggerService implements LoggerService {
  private formatLog(
    level: 'info' | 'warn' | 'error' | 'debug' | 'verbose',
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): string {
    const extraData =
      extra && typeof extra === 'object'
        ? (redactSensitive(extra) as Record<string, unknown>)
        : {};

    const logObject: Record<string, unknown> = {
      time: new Date().toISOString(),
      level,
      module: context ?? 'Application',
      message: typeof message === 'string' ? message : redactSensitive(message),
      ...extraData,
    };

    return JSON.stringify(logObject);
  }

  log(message: unknown, context?: string): void {
    console.log(this.formatLog('info', message, context));
  }

  error(message: unknown, trace?: string, context?: string): void {
    const extra = trace ? { trace } : undefined;
    console.error(this.formatLog('error', message, context, extra));
  }

  warn(message: unknown, context?: string): void {
    console.warn(this.formatLog('warn', message, context));
  }

  debug(message: unknown, context?: string): void {
    console.debug(this.formatLog('debug', message, context));
  }

  verbose(message: unknown, context?: string): void {
    console.info(this.formatLog('verbose', message, context));
  }
}
