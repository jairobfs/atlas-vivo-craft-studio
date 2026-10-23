import test from 'node:test';
import assert from 'node:assert/strict';
import {demo,compile,kind} from '../visual-core.js';
import {BOARD_W,BOARD_H,defaultCanvas,normalizeCanvas,updateNode,addNode,buildStorageConfig,sourceMap} from '../spatial-core.js';

test('Canvas is true 16:9 and all nodes are within its boundaries',()=>{
  assert.equal(BOARD_W,1100);
  assert.equal(BOARD_H,619);
  assert.ok(Math.abs(BOARD_W/BOARD_H-16/9)<.001);
  const model=compile(demo());
  const canvas=defaultCanvas(model);
  assert.equal(canvas.boards.length,model.sections.length);
  for(const b of canvas.boards)for(const n of b.nodes){
    assert.ok(n.x>=0&&n.y>=0);
    assert.ok(n.w>=110&&n.h>=95);
    assert.ok(n.x+n.w<=BOARD_W);
    assert.ok(n.y+n.h<=BOARD_H);
    assert.ok(sourceMap(model).has(n.source));
  }
});

test('Source-linked geometry stays within bounds on drag and resize',()=>{
  const initial={id:'x',source:'s',x:70,y:60,w:270,h:170,design:'standard'};
  const a=updateNode(initial,{x:3000,y:3000,w:900,h:700});
  assert.ok(a.x+a.w<=BOARD_W);
  assert.ok(a.y+a.h<=BOARD_H);
  const b=updateNode(initial,{x:-500,y:-10,w:1,h:5});
  assert.equal(b.x,0);assert.equal(b.y,0);
  assert.equal(b.w,110);assert.equal(b.h,95);
});

test('Normalized configuration removes nodes with nonexistent Craft block IDs',()=>{
  const model=compile(demo());
  const preserved=sourceMap(model).keys().next().value;
  const canvas=normalizeCanvas(model,{skin:'paper',boards:[{id:'b1',title:'Teste',nodes:[
    {id:'real',source:preserved,x:100,y:110,w:260,h:185,design:'picture'},
    {id:'deleted',source:'not-found',x:10,y:10,w:200,h:180,design:'standard'}
  ]}]});
  assert.equal(canvas.skin,'paper');
  assert.equal(canvas.boards[0].nodes.length,1);
  assert.equal(canvas.boards[0].nodes[0].source,preserved);
});

test('Canvas serialization preserves original page configuration without altering source blocks',()=>{
  const model=compile(demo());
  const canvas=defaultCanvas(model);
  const prior={layout:'mosaic',density:'compact',order:[{source:'demo',title:'Exemplo',display:'half'}]};
  const stored=buildStorageConfig(prior,canvas);
  assert.equal(stored.layout,'mosaic');
  assert.equal(stored.density,'compact');
  assert.equal(stored.order[0].source,'demo');
  assert.equal(stored.canvas.boards.length,model.sections.length);
  assert.equal(stored.canvas.skin,'dark');
  assert.deepEqual(Object.keys(stored.canvas.boards[0].nodes[0]).sort(),['design','h','id','source','w','x','y']);
});

test('Adding a source node does not mutate medical content',()=>{
  const model=compile(demo()),m=sourceMap(model),b={id:'b1',title:'Empty',nodes:[]};
  const textBefore=[...m.values()].map(x=>x.markdown).join('|');
  const result=addNode(b,m.keys().next().value);
  assert.ok(result);assert.equal(b.nodes.length,1);
  assert.equal([...m.values()].map(x=>x.markdown).join('|'),textBefore);
});

test('Spatial composer supports pointer dragging, keyboard selection and Craft persistence',async()=>{
  const fs=await import('node:fs');
  const contents=fs.readFileSync(new URL('../spatial-composer.js',import.meta.url),'utf8');
  assert.match(contents,/addEventListener\('pointerdown'/);
  assert.match(contents,/setPointerCapture/);
  assert.match(contents,/data-nudge/);
  assert.match(contents,/saveText\(b,text\)/);
  assert.match(contents,/savedConfig\?\.updatedAt/);
});
