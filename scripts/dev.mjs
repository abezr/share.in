import { spawn } from 'node:child_process';
import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';

function run(cmd, args = []) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: false });
  child.on('exit', code => {
    console.log(`[dev] process ${cmd} ${args.join(' ')} exited with code ${code}`);
  });
  return child;
}

function serveDir(root, port) {
  const abs = resolve(root);
  const server = http.createServer((req, res) => {
    const urlPath = normalize(decodeURIComponent(req.url.split('?')[0] || '/'));
    // prevent path traversal
    const safePath = urlPath.replace(/^\\|^\.+/g, '');
    const filePath = join(abs, safePath === '/' ? 'index.html' : safePath);
    try {
      const st = statSync(filePath);
      if (st.isDirectory()) {
        const idx = join(filePath, 'index.html');
        if (existsSync(idx)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          return createReadStream(idx).pipe(res);
        }
        res.writeHead(403);
        return res.end('Forbidden');
      }
      const ext = filePath.split('.').pop();
      const ct = ext === 'html' ? 'text/html' : ext === 'js' ? 'application/javascript' : ext === 'css' ? 'text/css' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  server.listen(port, () => console.log(`[dev] static server ${abs} :${port}`));
  return server;
}

async function startOffers() {
  const { start } = await import('../services/offers/index.mjs');
  const port = process.env.OFFERS_PORT ? Number(process.env.OFFERS_PORT) : 8081;
  start(port);
}

async function startSignalingServer() {
  const { SignalingServer } = await import('../services/signaling/index.mjs');
  const port = process.env.SIGNALING_PORT ? Number(process.env.SIGNALING_PORT) : 8083;
  const server = new SignalingServer(port);
  server.start();
  return server;
}

function startDiagramsBuild() {
  run(process.execPath, ['scripts/render-diagrams.mjs']);
}

function startP2PDemo() {
  const port = process.env.P2P_PORT ? Number(process.env.P2P_PORT) : 8082;
  serveDir('apps/p2p-demo', port);
}

(async function main() {
  console.log('[dev] starting local services...');
  await startOffers();
  await startSignalingServer();
  //startDiagramsBuild();
  startP2PDemo();
  console.log('[dev] ready:');
  console.log('  - Offers service:        http://localhost:8081');
  console.log('  - P2P demo (static):     http://localhost:8082');
  console.log('  - Signaling server:      ws://localhost:8083/signaling');
  console.log('  - Health check:          http://localhost:8083/health');
})();
