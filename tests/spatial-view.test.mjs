import test from 'node:test';
import assert from 'node:assert/strict';
import {demo,compile} from '../visual-core.js';
import {defaultCanvas} from '../spatial-core.js';
import {renderSpatialDocument} from '../spatial-composer.js';

test('Visual atlas reader renders the exact saved Craft canvas geometry',()=>{
  const project=compile(demo()),canvas=defaultCanvas(project);
  const n=canvas.boards[0].nodes[0];
  n.x=217;n.y=113;n.w=395;n.h=228;
  const html=renderSpatialDocument(project,{canvas});
  assert.ok(html.includes('left:217px;top:113px;width:395px;height:228px'));
  assert.ok(html.includes('LOUSA 01'));
  assert.equal((html.match(/spatial-preview-frame/g)||[]).length,canvas.boards.length);
  assert.ok(html.includes('Estas lousas utilizam o posicionamento gravado no Craft'));
});

test('Unconfigured document gets automatic visually editable preview',()=>{
 const project=compile(demo());
 const html=renderSpatialDocument(project,null);
 assert.ok(html.includes('Prévia automática'));
 assert.ok(html.includes('compose-block'));
});

test('Source images are referenced directly without altering their URLs',()=>{
 const project=compile(demo()),html=renderSpatialDocument(project,{canvas:defaultCanvas(project)});
 assert.ok(html.includes('Cristais de urato'));
 assert.ok(html.includes('Wikimedia')||html.includes('upload.wikimedia.org'));
});
