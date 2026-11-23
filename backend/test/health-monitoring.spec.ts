import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppController } from '../src/app.controller.js';
import { UptimeAlertMonitor } from '../src/common/monitoring/alert-monitor.js';
import { createSentryConfig } from '../src/common/sentry/sentry.config.js';

describe('T-64: Monitoring, Health Checks & Alerting', () => {
  let appController: AppController;
  let mockAppService: any;
  let mockDatabaseService: any;

  beforeEach(() => {
    mockAppService = { getHello: vi.fn().mockReturnValue('Hello World!') };
    mockDatabaseService = {
      ping: vi.fn().mockResolvedValue(true),
      pingReporting: vi.fn().mockResolvedValue(true),
    };
    appController = new AppController(mockAppService, mockDatabaseService);
  });

  describe('Health Controller', () => {
    it('should return 200 OK for /health/ready when primary and reporting pools are connected', async () => {
      const result = await appController.getReadiness();
      expect(result.status).toBe('ok');
      expect((result as any).checks.database).toBe('connected');
      expect((result as any).checks.reportingDb).toBe('connected');
    });

    it('should throw 503 SERVICE_UNAVAILABLE when primary database is down', async () => {
      mockDatabaseService.ping.mockResolvedValueOnce(false);
      await expect(appController.getReadiness()).rejects.toThrow(
        expect.objectContaining({
          status: 503,
        }),
      );
    });

    it('should throw 503 SERVICE_UNAVAILABLE when reporting database is down', async () => {
      mockDatabaseService.pingReporting.mockResolvedValueOnce(false);
      await expect(appController.getReadiness()).rejects.toThrow(
        expect.objectContaining({
          status: 503,
        }),
      );
    });
  });

  describe('Uptime Alert Monitor (Simulated Downtime in <= 10m)', () => {
    it('should trigger alert to Discord when server fails > 2 times', async () => {
      const monitor = new UptimeAlertMonitor('http://localhost:3000', '');

      // 1st failure (e.g. at 0 min)
      const alert1 = await monitor.processCheckResult({
        statusCode: 503,
        latencyMs: 150,
        isReady: false,
      });
      expect(alert1).toBe(false);
      expect(monitor.getState().consecutiveFailures).toBe(1);

      // 2nd failure (e.g. at 5 min, total elapsed <= 10m)
      const alert2 = await monitor.processCheckResult({
        statusCode: 503,
        latencyMs: 200,
        isReady: false,
      });
      expect(alert2).toBe(true); // Alert triggered!
      expect(monitor.getState().status).toBe('ALERTING');

      // Recovery check
      const recovered = await monitor.processCheckResult({
        statusCode: 200,
        latencyMs: 50,
        isReady: true,
      });
      expect(recovered).toBe(false);
      expect(monitor.getState().status).toBe('HEALTHY');
    });
  });

  describe('Sentry Zero PII Configuration', () => {
    it('should enforce sendDefaultPii: false and scrub cookies, tokens, and passwords', () => {
      const sentryConfig = createSentryConfig();
      expect(sentryConfig.sendDefaultPii).toBe(false);

      const mockEvent: any = {
        request: {
          headers: {
            cookie: 'refresh_token=secret',
            authorization: 'Bearer secret-jwt',
          },
          data: {
            username: 'admin',
            password: 'super-secret-password',
            pin: '1234',
          },
        },
        user: {
          id: 'user-1',
          ip_address: '192.168.1.1',
          email: 'admin@district13.local',
        },
      };

      const sanitized = sentryConfig.beforeSend!(mockEvent);
      expect(sanitized.request.headers.cookie).toBeUndefined();
      expect(sanitized.request.headers.authorization).toBeUndefined();
      expect(sanitized.request.data.password).toBe('[REDACTED]');
      expect(sanitized.request.data.pin).toBe('[REDACTED]');
      expect(sanitized.user.ip_address).toBeUndefined();
      expect(sanitized.user.email).toBeUndefined();
    });
  });
});
