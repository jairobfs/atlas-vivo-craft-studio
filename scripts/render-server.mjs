import { createServer } from 'node:http';
import site from '../dist/server/index.js';

const port = Number(process.env.PORT || 10000);
const publicMessage = 'A biblioteca Craft ao vivo permanece disponível pelo aplicativo Craft. A sincronização direta não está habilitada nesta edição pública.';

const server = createServer(async (req, res) => {
  try {
    // The original site was owner-private. Never expose its Craft read/write
    // endpoints on a public Render address without an actual login system.
    if (req.url?.startsWith('/api/craft/')) {
      res.writeHead(503, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      });
      res.end(JSON.stringify({ ok: false, error: publicMessage }));
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true,"service":"atlas-vivo-uct20"}');
      return;
    }

    const host = req.headers.host || `localhost:${port}`;
    const target = new URL(req.url || '/', `http://${host}`);
    const request = new Request(target, { method: req.method, headers: req.headers });
    const response = await site.fetch(request, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Falha ao servir Atlas Vivo:', error?.message || 'erro desconhecido');
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Falha temporária no Atlas Vivo');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Atlas Vivo UCT20: porta ${port}`);
});
