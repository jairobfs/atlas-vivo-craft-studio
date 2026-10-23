import { createHmac, timingSafeEqual } from 'node:crypto';

// The Craft connection is stored as an encrypted server-side Vercel environment variable.
// Do not place the private connection URL in browser-side scripts.
function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
const accessKey = () => process.env.APP_ACCESS_KEY || '';
const sessionToken = () => createHmac('sha256', accessKey()).update('atlas-vivo:session:v1').digest('hex');
function same(a, b) {
  const left = Buffer.from(String(a || '')), right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}
function authenticated(req) {
  const cookie = (req.headers.cookie || '').split(';').map(x => x.trim())
    .find(x => x.startsWith('av_session='))?.slice('av_session='.length);
  return Boolean(accessKey()) && same(cookie, sessionToken());
}
function base() {
  try {
    const u = new URL(process.env.CRAFT_API_URL || '');
    if (u.protocol !== 'https:' || u.hostname !== 'connect.craft.do' || !u.pathname.endsWith('/api/v1')) return null;
    return u.href.replace(/\/$/, '');
  } catch { return null; }
}
function validId(s) { return typeof s === 'string' && /^[a-zA-Z0-9-]{8,100}$/.test(s); }
function limited(s, max = 20000) { return String(s ?? '').slice(0, max).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
async function input(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  let raw = '';
  for await (const part of req) {
    raw += part;
    if (raw.length > 250000) throw Object.assign(new Error('Dados excessivos'), { status: 413 });
  }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}
async function craft(path, options = {}) {
  if (!base()) throw Object.assign(new Error('Conexão Craft indisponível'), { status: 503 });
  const response = await fetch(base() + path, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
    signal: AbortSignal.timeout(18000),
  });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    throw Object.assign(new Error(data.message || data.error || 'Craft: HTTP ' + response.status), { status: response.status });
  }
  return data;
}
export default async function handler(req, res) {
  try {
    const u = new URL(req.url, 'https://localhost');
    const op = u.searchParams.get('op') || 'status';
    if (op === 'status') {
      return json(res, 200, { configured: Boolean(base()), authenticated: authenticated(req) });
    }
    if (op === 'login') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido' });
      const body = await input(req);
      if (!accessKey() || !same(body.password, accessKey())) return json(res, 401, { error: 'Código incorreto' });
      const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
      res.setHeader('Set-Cookie', 'av_session=' + sessionToken() + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800' + secure);
      return json(res, 200, { ok: true });
    }
    if (op === 'logout') {
      res.setHeader('Set-Cookie', 'av_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure');
      return json(res, 200, { ok: true });
    }
    if (!authenticated(req)) return json(res, 401, { error: 'Entre com a senha do Studio' });
    if (op === 'connection' && req.method === 'GET') return json(res, 200, await craft('/connection'));
    if (op === 'documents' && req.method === 'GET') return json(res, 200, await craft('/documents?fetchMetadata=true'));
    if (op === 'document' && req.method === 'GET') {
      const id = u.searchParams.get('id');
      if (!validId(id)) return json(res, 400, { error: 'ID de documento inválido' });
      return json(res, 200, await craft('/blocks?id=' + encodeURIComponent(id) + '&maxDepth=10'));
    }
    if (op === 'search' && req.method === 'GET') {
      const q = limited(u.searchParams.get('q'), 120).trim();
      if (q.length < 2) return json(res, 400, { error: 'Pesquisa muito curta' });
      return json(res, 200, await craft('/documents/search?include=' + encodeURIComponent(q)));
    }
    if (op === 'create' && req.method === 'POST') {
      const b = await input(req);
      const title = limited(b.title, 160).trim();
      if (!title) return json(res, 400, { error: 'Título obrigatório' });
      return json(res, 200, await craft('/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: [{ title }], destination: { destination: 'unsorted' } }),
      }));
    }
    if (op === 'append' && req.method === 'POST') {
      const b = await input(req);
      const id = b.documentId || b.id;
      if (!validId(id)) return json(res, 400, { error: 'ID inválido' });
      const markdown = Array.isArray(b.blocks)
        ? b.blocks.slice(0, 90).map(x => limited(x.markdown, 10000)).filter(Boolean).join('\n\n')
        : limited(b.markdown, 30000);
      if (!markdown.trim()) return json(res, 400, { error: 'Conteúdo vazio' });
      return json(res, 200, await craft('/blocks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, position: { pageId: id, position: 'end' } }),
      }));
    }
    if (op === 'update' && req.method === 'POST') {
      const b = await input(req);
      const id = b.id || b.blockId;
      if (!validId(id) || typeof b.markdown !== 'string' || b.markdown.length > 30000) {
        return json(res, 400, { error: 'Bloco ou conteúdo inválido' });
      }
      // Craft's official API: PUT /blocks with a blocks[] payload, preserving block IDs.
      return json(res, 200, await craft('/blocks', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: [{ id, markdown: b.markdown }] }),
      }));
    }
    if (op === 'visual' && req.method === 'POST') {
      const b = await input(req);
      if (!validId(b.documentId) || !Array.isArray(b.blocks) || b.blocks.length === 0 || b.blocks.length > 12) {
        return json(res, 400, { error: 'Componentes inválidos' });
      }
      // Inserts native headings and text. Craft remains the sole source of truth.
      const markdown = b.blocks.map(x => limited(x.markdown, 2500).trim()).filter(Boolean).join('\n\n');
      if (!markdown.trim()) return json(res, 400, { error: 'Blocos vazios' });
      return json(res, 200, await craft('/blocks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, position: { pageId: b.documentId, position: 'end' } }),
      }));
    }
    if (op === 'upload' && req.method === 'POST') {
      const id = u.searchParams.get('id');
      const position = u.searchParams.get('position') || 'end';
      if (!validId(id) || !['start','end'].includes(position)) return json(res, 400, { error: 'ID/posição inválidos' });
      const mime = String(req.headers['content-type'] || '');
      if (!['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf'].includes(mime)) {
        return json(res, 415, { error: 'Tipo de arquivo não suportado' });
      }
      const parts = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 4*1024*1024) return json(res, 413, { error: 'Limite de 4 MB' });
        parts.push(chunk);
      }
      const qs = new URLSearchParams({ pageId: id, position, fileName: limited(u.searchParams.get('name'), 110) || 'arquivo' });
      return json(res, 200, await craft('/upload?' + qs, {
        method: 'POST', headers: { 'Content-Type': mime }, body: Buffer.concat(parts),
      }));
    }
    return json(res, 404, { error: 'Operação não encontrada' });
  } catch (err) {
    return json(res, err.status || 500, { error: String(err.message || err) });
  }
}
