// Vercel equivalent of the existing Render health endpoint.
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, service: 'atlas-vivo-uct20' }));
}
