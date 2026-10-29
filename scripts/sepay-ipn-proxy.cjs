// Temporary local-development ingress: expose ONLY SePay IPN and a fixed return redirect.
// Never point a public tunnel at the complete API, admin routes or Swagger.
require('dotenv').config({ path: '.env.sepay.local', quiet: true });
require('dotenv').config({ quiet: true });
const http = require('node:http');
const frontend = new URL('/cai-dat/tai-khoan', process.env.FRONTEND_URL || 'http://localhost:3000');
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET' && url.pathname === '/payments/sepay/return') {
    const target = new URL(frontend);
    const id = url.searchParams.get('premiumOrder');
    if (id && /^[a-zA-Z0-9_-]{1,80}$/.test(id)) target.searchParams.set('premiumOrder', id);
    const result = url.searchParams.get('payment');
    if (['success','error','cancel'].includes(result)) target.searchParams.set('payment', result);
    res.writeHead(302, { Location: target.href }); return res.end();
  }
  if (req.method !== 'POST' || url.pathname !== '/api/membership/sepay/ipn' || url.search) {
    res.writeHead(404); return res.end();
  }
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) { res.writeHead(415); return res.end(); }
  try {
    let bytes = 0; const chunks = [];
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 65536) { res.writeHead(413); return res.end(); }
      chunks.push(chunk);
    }
    const headers = { 'content-type': 'application/json' };
    if (typeof req.headers['x-secret-key'] === 'string') headers['x-secret-key'] = req.headers['x-secret-key'];
    const response = await fetch('http://127.0.0.1:4000/api/membership/sepay/ipn', {
      method: 'POST', headers, body: Buffer.concat(chunks), signal: AbortSignal.timeout(12000), redirect: 'error',
    });
    const body = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json' }); res.end(body);
  } catch { if (!res.headersSent) res.writeHead(502); res.end('{"success":false}'); }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(4011, '127.0.0.1', () => console.log('Restricted SePay IPN ingress listening on 127.0.0.1:4011'));
