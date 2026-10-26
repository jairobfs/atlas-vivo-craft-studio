// Preserve the public edition's existing Craft boundary from render-server.mjs.
// Do not forward public requests to private Craft credentials.
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.statusCode = 503;
  res.end(JSON.stringify({
    ok: false,
    error: 'A biblioteca Craft ao vivo permanece disponível pelo aplicativo Craft. A sincronização direta não está habilitada nesta edição pública.',
  }));
}
