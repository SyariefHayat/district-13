/**
 * ==============================================================================
 * District 13 - k6 Concurrent Load Test Scenario (T-66)
 * Simulates:
 * - 3 concurrent cashiers continuously recording transactions
 * - Concurrent manager / owner querying heavy reports & overview
 * - Concurrent product search queries
 *
 * AC Thresholds:
 * - P95 Transaction Save: < 1000ms
 * - P95 Product Search:   < 1000ms
 * - P95 Reports / Export: <= 5000ms (target 2000ms)
 * ==============================================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const txSaveTrend = new Trend('transaction_save_duration');
const searchTrend = new Trend('product_search_duration');
const reportTrend = new Trend('report_duration');

export const options = {
  scenarios: {
    // Scenario 1: 3 Concurrent Cashiers creating sales
    cashiers: {
      executor: 'constant-vus',
      vus: 3,
      duration: '30s',
      exec: 'cashierFlow',
    },
    // Scenario 2: Concurrent reports and analytics queries
    managers: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      exec: 'reportFlow',
    },
  },
  thresholds: {
    transaction_save_duration: ['p(95)<1000'], // P95 < 1 second
    product_search_duration:   ['p(95)<1000'], // P95 < 1 second
    report_duration:           ['p(95)<=5000'], // P95 <= 5 seconds (target 2s)
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000/api/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-jwt-token';

const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

export function cashierFlow() {
  // 1. Search products
  const searchStart = Date.now();
  const searchRes = http.get(`${BASE_URL}/products?search=kopi&limit=10`, { headers: authHeaders });
  searchTrend.add(Date.now() - searchStart);
  check(searchRes, { 'search status is 200': (r) => r.status === 200 });

  // 2. Submit transaction
  const payload = JSON.stringify({
    events: [
      {
        id: `k6-tx-${Date.now()}-${__VU}-${__ITER}`,
        type: 'TRANSACTION_CREATE',
        timestamp: new Date().toISOString(),
        payload: {
          items: [
            {
              productId: 'c0a80123-0000-0000-0000-000000000001',
              quantity: 2,
              unitPrice: 20000,
            },
          ],
          paymentMethod: 'CASH',
          paidAmount: 50000,
          changeAmount: 10000,
          subtotalAmount: 40000,
          discountAmount: 0,
          totalAmount: 40000,
        },
      },
    ],
  });

  const txStart = Date.now();
  const txRes = http.post(`${BASE_URL}/sync/events`, payload, {
    headers: Object.assign({}, authHeaders, { 'x-device-code': `device-${__VU}` }),
  });
  txSaveTrend.add(Date.now() - txStart);
  check(txRes, { 'tx save status is 200 or 201': (r) => r.status === 200 || r.status === 201 });

  sleep(0.5);
}

export function reportFlow() {
  const reports = [
    '/reports/dashboard',
    '/reports/overview?startDate=2026-01-01&endDate=2026-12-31',
    '/reports/sales?page=1&limit=20',
    '/reports/products?page=1&limit=20',
  ];

  const targetReport = reports[Math.floor(Math.random() * reports.length)];
  const repStart = Date.now();
  const res = http.get(`${BASE_URL}${targetReport}`, { headers: authHeaders });
  reportTrend.add(Date.now() - repStart);
  check(res, { 'report status is 200': (r) => r.status === 200 });

  sleep(2);
}
