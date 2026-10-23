import test from 'node:test';
import assert from 'node:assert/strict';
import {parseControlDocument,safeControl} from '../api/atlas-control.js';
import {planAdminUpdate,publicCatalog,safeOrigin} from '../api/atlas-admin.js';

const ROOT='194aec94-79cf-af4d-8d33-085219b12bb9';
const A='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',C='cccccccc-cccc-cccc-cccc-cccccccccccc';
const sections=[
 ['## 01 · Acesso ao aplicativo','h2'],
 ['Código de acesso: jbfs'],['Sessão: 30 dias'],
 ['## 02 · Biblioteca publicada','h2'],
 ['Modo da biblioteca: selecionadas'],
 ['Exibir: Atlas A'],['Exibir: Atlas B'],
 ['## 03 · Aparência e estudo','h2'],
 ['Página inicial: biblioteca'],['Visualização padrão: imersivo'],['Tema padrão: escuro'],['Densidade editorial: equilibrada'],['Atualizar ao abrir: sim'],
 ['## 04 · Identidade','h2'],['Título do aplicativo: ATLAS VIVO'],['Subtítulo: Medicina'],['Texto de abertura: Aprenda.'],
 ['## 05 · Edição e sincronização','h2'],['Permitir edição no ATLAS: sim'],['Permitir criar notas: sim']
];
const source=()=>({data:[{id:ROOT,type:'page',markdown:'Central',content:sections.map((r,i)=>({id:'field-'+i,type:'text',textStyle:r[1],markdown:r[0]}))}]});
const catalog={items:[{id:A,title:'Atlas A'},{id:B,title:'Atlas B'},{id:C,title:'Atlas C'},{id:ROOT,title:'Central interna'}]};
test('Editions preserve the Craft as source of truth and expose no access secret',()=>{
  const parsed=parseControlDocument(source());
  assert.equal(parsed.accessCode,'jbfs');assert.equal(parsed.libraryMode,'selected');
  assert.equal(parsed.revision.length,64);assert.ok(!JSON.stringify(safeControl(parsed)).includes('jbfs'));
  assert.deepEqual(publicCatalog(catalog,ROOT).map(x=>x.id),[A,B,C]);
});
test('Owner can change code, theme and note order via one in-app action',()=>{
 const before=parseControlDocument(source());
 const plan=planAdminUpdate(source(),{expectedRevision:before.revision,patch:{accessCode:'novo-codigo',theme:'light',home:'home'},selectedIds:[B,A,C]},catalog,ROOT);
 assert.equal(plan.unchanged,false);
 assert.ok(plan.updates.some(x=>x.markdown==='Código de acesso: novo-codigo'));
 assert.ok(plan.updates.some(x=>x.markdown==='Tema padrão: claro'));
 assert.ok(plan.updates.some(x=>x.markdown==='Página inicial: painel'));
 assert.deepEqual(plan.updates.filter(x=>x.markdown.startsWith('Exibir:')).map(x=>x.markdown),['Exibir: Atlas B | '+B,'Exibir: Atlas A | '+A]);
 assert.deepEqual(plan.library.add,['Exibir: Atlas C | '+C]);
 assert.deepEqual(plan.library.remove,[]);
});
test('Removing a note from the Atlas does not require deleting the document',()=>{
 const s=source(),revision=parseControlDocument(s).revision;
 const plan=planAdminUpdate(s,{expectedRevision:revision,patch:{},selectedIds:[B]},catalog,ROOT);
 assert.equal(plan.library.remove.length,1);
 assert.equal(plan.updates.filter(x=>x.markdown.startsWith('Exibir:')).length,1);
 assert.equal(catalog.items.length,4); // the real Craft catalog is never touched
});
test('Concurrent Craft changes cannot be overridden from a stale Atlas tab',()=>{
 const s=source();const expected=parseControlDocument(s).revision;s.data[0].content[10].markdown='Tema padrão: claro';
 assert.throws(()=>planAdminUpdate(s,{expectedRevision:expected,patch:{theme:'dark'}},null,ROOT),{status:409});
});
test('Reject forged document IDs, duplicate selection and hostile field values',()=>{
 const s=source(),expectedRevision=parseControlDocument(s).revision;
 for(const selectedIds of [[A,A],['forged'],[ROOT]]){
  assert.throws(()=>planAdminUpdate(s,{expectedRevision,selectedIds,patch:{}},catalog,ROOT));
 }
 assert.throws(()=>planAdminUpdate(s,{expectedRevision,patch:{appTitle:'<script>'}},null,ROOT));
 assert.throws(()=>planAdminUpdate(s,{expectedRevision,patch:{totallyUnknown:true}},null,ROOT));
});
test('Owner-only writes refuse a cross-origin browser request',()=>{
 assert.equal(safeOrigin({headers:{host:'atlas.example',origin:'https://malicious.example'}}),false);
 assert.equal(safeOrigin({headers:{host:'atlas.example',origin:'https://atlas.example'}}),true);
});
