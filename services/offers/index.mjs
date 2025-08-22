import http from 'node:http';

const offers = [];
const optOut = new Set();

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function start(port = 8081) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/ingest') {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => {
        try {
          const offer = JSON.parse(data || '{}');
          offer.id = offer.id || String(Date.now());
          offers.push(offer);
          json(res, 200, { ok: true, id: offer.id });
        } catch (_e) {
          json(res, 400, { ok: false, error: 'invalid json' });
        }
      });
      return;
    }
    if (req.method === 'POST' && req.url?.startsWith('/consent/optout/')) {
      const user = req.url.split('/').pop();
      optOut.add(user);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && req.url?.startsWith('/offers/')) {
      const user = req.url.split('/').pop();
      if (optOut.has(user)) return json(res, 200, { offers: [] });
      // simplistic targeting: return all active offers
      const now = Date.now();
      const active = offers.filter(o => !o.schedule || (now >= (o.schedule.start||0) && now <= (o.schedule.end||Infinity)));
      return json(res, 200, { offers: active });
    }
    json(res, 404, { ok: false });
  });
  server.listen(port, () => console.log(`Offers service on :${port}`));
  return server;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  start(process.env.PORT ? Number(process.env.PORT) : 8081);
}
