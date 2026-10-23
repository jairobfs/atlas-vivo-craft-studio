import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../visual-app.js',import.meta.url),'utf8');

test('Visual atlas binds figure and map nodes with NodeList selector, not a single element',()=>{
 assert.match(src,/\$\$\('\[data-zoom\]'\)\.forEach/);
 assert.match(src,/\$\$\('\[data-map-jump\]'\)\.forEach/);
 assert.doesNotMatch(src,/(^|[^$])\$\('\[data-(?:zoom|map-jump)\]'\)\.forEach/);
});

test('Presentation navigation is bound to both controls',()=>{
 assert.match(src,/id="next-slide"/);
 assert.match(src,/id="previous-slide"/);
 assert.match(src,/next\.onclick=/);
 assert.match(src,/prev\.onclick=/);
});

test('Craft visual editing refuses to modify public demo',()=>{
 assert.match(src,/if\(S\.demo\)\{\$\('#screen'\)/);
 assert.match(src,/originalMarkdown:raw\(block\)/);
});

test('Refresh on return skips unsaved studio work and public demo',()=>{
 assert.match(src,/S\.demo\|\|S\.settings\?\.autoRefresh===false\|\|S\.loading/);
 assert.match(src,/\['atlas','home','library'\]\.includes\(S\.tab\)/);
});
