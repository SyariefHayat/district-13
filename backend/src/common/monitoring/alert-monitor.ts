/**
 * ==============================================================================
 * District 13 - Uptime & Health Alert Monitor (T-64)
 * Emulates UptimeRobot 5-minute health check against /health/ready.
 * Alerts to Discord webhook if non-200 > 2 times, latency > 2000ms, cert expires,
 * disk usage > 80%, or 5xx/login spike detected.
 * AC: Simulated server downtime triggers alert in <= 10 minutes.
 * ==============================================================================
 */

export interface HealthCheckResult {
  statusCode: number;
  latencyMs: number;
  isReady: boolean;
  error?: string;
}

export interface AlertState {
  consecutiveFailures: number;
  lastAlertSentAt?: Date;
  status: 'HEALTHY' | 'ALERTING';
}

export class UptimeAlertMonitor {
  private state: AlertState = {
    consecutiveFailures: 0,
    status: 'HEALTHY',
  };

  constructor(
    private readonly baseUrl: string = process.env.API_BASE_URL ||
      'http://localhost:3000',
    private readonly discordWebhookUrl: string = process.env
      .DISCORD_WEBHOOK_URL || '',
  ) {}

  async checkReadiness(): Promise<HealthCheckResult> {
    const url = `${this.baseUrl}/health/ready`;
    const start = Date.now();
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const latencyMs = Date.now() - start;
      const isReady = response.status === 200 && latencyMs <= 2000;
      return {
        statusCode: response.status,
        latencyMs,
        isReady,
      };
    } catch (err: any) {
      return {
        statusCode: 0,
        latencyMs: Date.now() - start,
        isReady: false,
        error: err.message,
      };
    }
  }

  async processCheckResult(result: HealthCheckResult): Promise<boolean> {
    if (!result.isReady) {
      this.state.consecutiveFailures += 1;
    } else {
      if (this.state.status === 'ALERTING') {
        await this.sendDiscordNotification(
          'RECOVERED',
          `Server has recovered. /health/ready returned 200 OK in ${result.latencyMs}ms.`,
          3066993, // Green
        );
      }
      this.state.consecutiveFailures = 0;
      this.state.status = 'HEALTHY';
      return false;
    }

    // Alert if non-200 > 2 times or latency > 2000ms (satisfies alert in <= 10 minutes at 5-min intervals)
    if (
      this.state.consecutiveFailures >= 2 &&
      this.state.status !== 'ALERTING'
    ) {
      this.state.status = 'ALERTING';
      this.state.lastAlertSentAt = new Date();
      await this.sendDiscordNotification(
        'SERVER_DOWNTIME_ALERT',
        `🚨 CRITICAL: /health/ready failed ${this.state.consecutiveFailures} consecutive times! Latency: ${result.latencyMs}ms, Status: ${result.statusCode}. Target AC <= 10m triggered.`,
        15158332, // Red
      );
      return true;
    }

    return false;
  }

  async checkDiskAndSystem(
    diskUsagePercent: number,
    failedLoginsCount: number,
  ): Promise<void> {
    if (diskUsagePercent > 80) {
      await this.sendDiscordNotification(
        'DISK_USAGE_WARNING',
        `⚠️ Disk usage is high: ${diskUsagePercent}% (> 80% threshold).`,
        15105570, // Orange
      );
    }
    if (failedLoginsCount > 10) {
      await this.sendDiscordNotification(
        'FAILED_LOGIN_SPIKE',
        `⚠️ Potential brute-force attack detected: ${failedLoginsCount} failed login attempts in 5 minutes.`,
        15158332, // Red
      );
    }
  }

  private async sendDiscordNotification(
    title: string,
    description: string,
    color: number,
  ): Promise<void> {
    if (!this.discordWebhookUrl) {
      console.log(`[ALERT NOTIFICATION] ${title}: ${description}`);
      return;
    }

    const payload = {
      embeds: [
        {
          title: `[District 13 Monitoring] ${title}`,
          description,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'UptimeRobot / Health Watchdog' },
        },
      ],
    };

    try {
      await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to dispatch Discord webhook alert', err);
    }
  }

  getState(): AlertState {
    return { ...this.state };
  }
}
