import http from 'node:http';

const PORT = parseInt(process.env.PORT || '3000', 10);

const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none';",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Apply default security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }

  // Routes
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(200);
    res.end(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>District 13 POS API</title>
</head>
<body>
  <h1>District 13 POS Production API Service</h1>
  <p>Status: Active</p>
  <ul>
    <li><a href="/health">Healthcheck</a></li>
    <li><a href="/health/ready">Readiness Check</a></li>
    <li><a href="/api/v1/products">Products Endpoint</a></li>
    <li><a href="/api/v1/categories">Categories Endpoint</a></li>
    <li><a href="/auth/login">Auth Login Endpoint</a></li>
  </ul>
</body>
</html>`);
    return;
  }

  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (pathname === '/health/ready') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  if (pathname === '/api/v1/products') {
    res.writeHead(200);
    res.end(JSON.stringify({ data: [], total: 0 }));
    return;
  }

  if (pathname === '/api/v1/categories') {
    res.writeHead(200);
    res.end(JSON.stringify({ data: [], total: 0 }));
    return;
  }

  if (pathname === '/auth/login') {
    if (req.method === 'POST') {
      res.writeHead(200);
      res.end(JSON.stringify({ accessToken: 'mock-token', expiresIn: 900 }));
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'POST username and password to login' }));
    }
    return;
  }

  if (pathname === '/robots.txt') {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('User-agent: *\nDisallow: /api/\n');
    return;
  }

  // 404 Not Found fallback
  res.writeHead(404);
  res.end(JSON.stringify({ statusCode: 404, message: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ZAP target service listening on http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
