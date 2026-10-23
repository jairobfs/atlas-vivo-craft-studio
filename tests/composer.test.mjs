import test from 'node:test';
import assert from 'node:assert/strict';
import {demo} from '../visual-core.js';
import {getLayoutMetadata,layoutMetadataMarker} from '../composer.js';
test('new Craft atlas gets editable multi-prancha source-based layout',()=>{
 const result=getLayoutMetadata(demo());
 assert.equal(result.metadata,null);
 assert.ok(result.layout.boards.length>=3);
 assert.ok(result.layout.boards.every(b=>Array.isArray(b.nodes)));
 assert.ok(result.layout.boards.some(b=>b.nodes.some(n=>n.sourceId)));
});
test('layout is loaded from native Craft metadata block',()=>{
 const doc=demo();
 const layout=getLayoutMetadata(doc).layout;
 layout.boards[0].name='Prancha revisada';
 const block={type:'text',id:'9d36cf8a-404a-44c3-bd0b-882d67a3d669',markdown:layoutMetadataMarker()+encodeURIComponent(JSON.stringify(layout))};
 doc.data[0].content.push(block);
 const saved=getLayoutMetadata(doc);
 assert.equal(saved.metadata.id,block.id);
 assert.equal(saved.layout.boards[0].name,'Prancha revisada');
});
test('corrupt layout falls back safely instead of crashing the atlas',()=>{
 const doc=demo();
 doc.data[0].content.push({type:'text',id:'valid',markdown:layoutMetadataMarker()+'%ZZ'});
 const result=getLayoutMetadata(doc);
 assert.ok(result.error);
 assert.ok(result.layout.boards.length>=1);
});
