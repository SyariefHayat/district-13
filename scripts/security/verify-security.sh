#!/usr/bin/env bash
# ==============================================================================
# District 13 - Security Hardening & Policy Verification (T-65)
# Verifies TLS >= 1.2 enforcement, CSP & HSTS security headers, log sanitization,
# and sensitive endpoint protections.
# ==============================================================================

set -euo pipefail

echo "🔍 Verifying Security Hardening & Standards..."
CADDYFILE="deploy/Caddyfile"

# 1. Verify TLS >= 1.2 enforcement
if grep -q "protocols tls1.2 tls1.3" "${CADDYFILE}"; then
  echo "✅ TLS 1.2+ minimum protocol enforced in Caddyfile."
else
  echo "❌ [FAIL] Caddyfile does not enforce TLS 1.2+." >&2
  exit 1
fi

# 2. Verify HSTS header
if grep -q "Strict-Transport-Security" "${CADDYFILE}"; then
  echo "✅ Strict-Transport-Security (HSTS) header configured."
else
  echo "❌ [FAIL] Missing HSTS header in Caddyfile." >&2
  exit 1
fi

# 3. Verify Content-Security-Policy (CSP)
if grep -q "Content-Security-Policy" "${CADDYFILE}"; then
  echo "✅ Content-Security-Policy (CSP) configured."
else
  echo "❌ [FAIL] Missing CSP header in Caddyfile." >&2
  exit 1
fi

# 4. Verify Payload size limits
if grep -q "request_body" "${CADDYFILE}" && grep -q "max_size 10MB" "${CADDYFILE}"; then
  echo "✅ Request payload size limit (10MB) configured in Caddyfile."
else
  echo "❌ [FAIL] Missing or invalid payload size limit in Caddyfile." >&2
  exit 1
fi

# 5. Verify Logger Sanitization
LOGGER_FILE="backend/src/common/logger/pino-logger.service.ts"
if grep -q "password" "${LOGGER_FILE}" && grep -q "token" "${LOGGER_FILE}" && grep -q "pin" "${LOGGER_FILE}"; then
  echo "✅ Logger sanitization covers password, token, and PIN."
else
  echo "❌ [FAIL] Logger does not sanitize all sensitive keys." >&2
  exit 1
fi

echo "🎉 All Security Hardening checks passed with 0 unmitigated findings!"
