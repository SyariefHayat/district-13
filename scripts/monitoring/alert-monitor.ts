#!/usr/bin/env node
import { UptimeAlertMonitor } from "../../backend/src/common/monitoring/alert-monitor.js";

export { UptimeAlertMonitor };

if (
  process.argv[1]?.endsWith("alert-monitor.ts") ||
  process.argv[1]?.endsWith("alert-monitor.js")
) {
  const monitor = new UptimeAlertMonitor();
  monitor.checkReadiness().then((res) => {
    monitor.processCheckResult(res).then(() => {
      console.log("Health check executed:", res);
    });
  });
}
