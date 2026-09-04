// src/server.js
//
// Zero-dependency dashboard server (uses only Node's built-in http/fs).
//
// Usage:
//   node src/server.js
//   node src/server.js --port 4000
//
// Then open http://localhost:3737

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getAuditTrail, getSummaryStats } = require('./log/audit_logger');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx !== -1 ? Number(args[portIdx + 1]) : (process.env.DASHBOARD_PORT || 3737);

const DASHBOARD_DIR = path.join(__dirname, '..', 'dashboard');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'text/babel; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(req, res, urlPath) {
  const relativePath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(DASHBOARD_DIR, relativePath);

  if (!filePath.startsWith(DASHBOARD_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/summary') {
    try {
      return sendJson(res, 200, getSummaryStats());
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (url.pathname === '/api/audit-trail') {
    try {
      const limit = Number(url.searchParams.get('limit')) || 200;
      const customerId = url.searchParams.get('customerId') || null;
      return sendJson(res, 200, getAuditTrail({ limit, customerId }));
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  return serveStaticFile(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`[server] Dashboard running at http://localhost:${PORT}`);
  console.log(`[server] API: /api/summary, /api/audit-trail`);
});