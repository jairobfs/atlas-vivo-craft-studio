import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import health from '../api/health.js';
import craftDisabled from '../api/craft-disabled.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
assert.equal(config.framework, null);
assert.equal(config.buildCommand, 'npm run build');
assert.equal(config.outputDirectory, 'web');
assert.deepEqual(config.rewrites, [
  { source: '/health', destination: '/api/health' },
  { source: '/api/craft/:path*', destination: '/api/craft-disabled' },
]);

const build = spawnSync(process.execPath, ['scripts/build-worker.mjs'], {
  cwd: root, encoding: 'utf8',
});
assert.equal(build.status, 0, build.stderr);
const site = (await import('../dist/server/index.js')).default;
const files = await readdir(join(root, config.outputDirectory));
assert.equal(files.length, 19);
for (const name of files) {
  const expected = await readFile(join(root, 'web', name));
  const response = await site.fetch(new Request('https://atlas.example/' + name), {});
  assert.equal(response.status, 200, name);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected, name);
  const head = await site.fetch(new Request('https://atlas.example/' + name, { method: 'HEAD' }), {});
  assert.equal(head.status, 200, name);
  assert.equal(await head.text(), '', name);
}
const home = await site.fetch(new Request('https://atlas.example/'), {});
const html = await home.text();
assert.equal(home.status, 200);
for (const [, asset] of html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) {
  assert.ok(files.includes(asset.slice(1)), 'Missing HTML asset: ' + asset);
}
const sw = await readFile(join(root, 'web/sw.js'), 'utf8');
const precache = sw.match(/const ASSETS=\[([^\]]+)\]/)[1];
for (const [, asset] of precache.matchAll(/'(\/[^']*)'/g)) {
  if (asset === '/') continue;
  assert.ok(files.includes(asset.slice(1)), 'Missing PWA asset: ' + asset);
}
assert.match(html, /webgl3d\.js/);
assert.match(html, /progress-transfer\.js/);
const summaries = await readFile(join(root, 'web/visual-summaries.js'), 'utf8');
assert.match(summaries, /window\.print\(\)/);

function invoke(handler, method, url) {
  const headers = {};
  let body;
  const res = {
    setHeader(key, value) { headers[key.toLowerCase()] = value; },
    end(value) { body = value; },
  };
  handler({ method, url }, res);
  return { status: res.statusCode, headers, body: JSON.parse(body) };
}
assert.deepEqual(invoke(health, 'GET', '/health').body, {
  ok: true, service: 'atlas-vivo-uct20',
});
for (const [method, url] of [
  ['GET', '/api/craft/read?scope=sp1'],
  ['POST', '/api/craft/annotation'],
]) {
  const response = invoke(craftDisabled, method, url);
  assert.equal(response.status, 503);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.body.ok, false);
}
console.log('Vercel deployment checks passed: 19 byte-identical assets, HTML/PWA references, 3D/PDF/progress modules, health and public Craft boundary.');
