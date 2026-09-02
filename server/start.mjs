import { createServer } from 'node:http';

import('./server.mjs').catch(error => {
  const detail = error instanceof Error ? error.stack || error.message : String(error);
  console.error(detail);
  createServer((_, response) => {
    response.writeHead(500, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ ok: false, error: detail }));
  }).listen(Number(process.env.PORT || 8080), '0.0.0.0');
});
