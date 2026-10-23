import test from 'node:test';
import assert from 'node:assert/strict';
import {parseControlDocument,safeControl,filterLibrary,matchesNote} from '../api/atlas-control.js';

function note(lines){
 const blocks=[];let heading=false;
 for(let i=0;i<lines.length;i++){
  const s=lines[i];
  const isHeading=s.startsWith('## ');
  blocks.push({id:'block-'+i,type:'text',textStyle:isHeading?'h2':undefined,markdown:s});
 }
 return {data:[{id:'control-root',type:'page',markdown:'ATLAS VIVO · Central de Controle',content:blocks}]};
}
const input=note([
 '## 01 · Acesso ao aplicativo',
 'Código de acesso: atlas7',
 'Sessão: 30 dias',
 '## 02 · Biblioteca publicada',
 'Modo da biblioteca: selecionadas',
 'Exibir: ATLAS VIVO · Estúdio editorial — piloto sem código',
 'Exibir: ATLAS VIVO · Componentes visuais — Manual de autoria',
 '## 03 · Aparência e estudo',
 'Página inicial: biblioteca',
 'Visualização padrão: imersivo',
 'Tema padrão: escuro',
 'Densidade editorial: equilibrada',
 'Atualizar ao abrir: sim',
 '## 04 · Identidade',
 'Título do aplicativo: ATLAS VIVO',
 'Subtítulo: ColorHub × Universo · Medicina',
 'Texto de abertura: Estude Medicina como um atlas visual.',
 '## 05 · Edição e sincronização',
 'Permitir edição no ATLAS: sim',
 'Permitir criar notas: sim'
]);
test('Native Craft controls preserve owner-selected access and session',()=>{
 const c=parseControlDocument(input);
 assert.equal(c.accessCode,'atlas7');
 assert.equal(c.sessionDays,30);
 assert.equal(c.libraryMode,'selected');
 assert.equal(c.visibleNotes.length,2);
 assert.equal(c.home,'library');
 assert.equal(c.view,'immersive');
 assert.equal(c.theme,'dark');
 assert.equal(c.density,'balanced');
 assert.equal(c.autoRefresh,true);
 assert.equal(c.editingEnabled,true);
});
test('The browser never receives the private access code',()=>{
 const settings=safeControl(parseControlDocument(input));
 assert.equal(settings.configured,true);
 assert.equal(settings.sessionDays,30);
 assert.ok(!('accessCode' in settings));
 assert.ok(!JSON.stringify(settings).includes('atlas7'));
});
test('The curated library contains only selected documents in Craft order',()=>{
 const settings=parseControlDocument(input);
 const docs={data:[
 {id:'a',title:'Outro documento'},
 {id:'manual',title:'ATLAS VIVO · Componentes visuais — Manual de autoria'},
 {id:'pilot',title:'ATLAS VIVO · Estúdio editorial — piloto sem código'}
 ]};
 const curated=filterLibrary(docs,settings);
 assert.deepEqual(curated.data.map(d=>d.id),['pilot','manual']);
 assert.deepEqual(docs.data.map(d=>d.id),['a','manual','pilot']);
});
test('Switching library to all does not remove source documents',()=>{
 const c=parseControlDocument(input);c.libraryMode='all';
 const entries={items:[{id:'1',title:'a'},{id:'2',title:'b'}]};
 assert.equal(filterLibrary(entries,c),entries);
});
test('Craft can publish by root block ID or exact title',()=>{
 assert.equal(matchesNote({id:'6405e16f-cee5-c4c3-3ad3-0b506991cfb6',title:'Exemplo'},'6405e16f-cee5-c4c3-3ad3-0b506991cfb6'),true);
 assert.equal(matchesNote({id:'doc',title:{text:'Árvore médica'}},'arvore medica'),true);
 assert.equal(matchesNote({id:'doc',title:'Outro título'},'Árvore médica'),false);
});
test('Text under documentation toggle does not redefine login',()=>{
 const content=note(['## 01 · Acesso ao aplicativo','Código de acesso: atlas7']);
 content.data[0].content.push({id:'toggle',type:'text',listStyle:'toggle',markdown:'Código de acesso: exemplo'});
 assert.equal(parseControlDocument(content).accessCode,'atlas7');
});
test('Craft owner can disable authoring without disabling reading',()=>{
 const src=note(['## 05 · Edição e sincronização','Permitir edição no ATLAS: não','Permitir criar notas: não']);
 const c=parseControlDocument(src);
 assert.equal(c.editingEnabled,false);
 assert.equal(c.creationEnabled,false);
});


test('Control syntax matches actual Craft native h2 and body blocks after editorial cleanup',()=>{
 const root={data:[{id:'194aec94-79cf-af4d-8d33-085219b12bb9',type:'page',markdown:'Central de Controle',content:[
  {type:'text',textStyle:'body',markdown:'Painel administrativo · Edição direta no Craft'},
  {type:'text',textStyle:'h2',markdown:'## 01 · Acesso ao aplicativo'},
  {type:'text',markdown:'Código de acesso: exemplo-privado'},
  {type:'text',markdown:'Sessão: 30 dias'},
  {type:'text',textStyle:'h2',markdown:'## 02 · Biblioteca publicada'},
  {type:'text',markdown:'Modo da biblioteca: selecionadas'},
  {type:'text',markdown:'Exibir: ATLAS VIVO · Estúdio editorial — piloto sem código'},
  {type:'text',markdown:'Exibir: ATLAS VIVO · Componentes visuais — Manual de autoria'},
  {type:'text',textStyle:'h2',markdown:'## 03 · Aparência e estudo'},
  {type:'text',markdown:'Visualização padrão: imersivo'},
  {type:'text',textStyle:'h2',markdown:'## 05 · Edição e sincronização'},
  {type:'text',markdown:'Permitir edição no ATLAS: sim'}
 ]}]};
 const x=parseControlDocument(root);
 assert.equal(x.accessCode,'exemplo-privado');
 assert.equal(x.libraryMode,'selected');
 assert.equal(x.visibleNotes.length,2);
 assert.equal(x.view,'immersive');
 assert.equal(x.editingEnabled,true);
 assert.equal(safeControl(x).accessCode,undefined);
});
test('Filter accepts Craft rootBlockId with rich title objects and omits trashed docs',()=>{
 const policy=parseControlDocument(input);
 const data={items:[
  {rootBlockId:'1',title:{text:{value:'ATLAS VIVO · Componentes visuais — Manual de autoria'}}},
  {rootBlockId:'2',title:'ATLAS VIVO · Estúdio editorial — piloto sem código'},
  {rootBlockId:'3',title:'ATLAS VIVO · Estúdio editorial — piloto sem código',isDeleted:true},
  {rootBlockId:'4',title:'ATLAS VIVO · Estúdio editorial — piloto sem código',location:'trash'}
 ]};
 assert.deepEqual(filterLibrary(data,policy).items.map(x=>x.rootBlockId),['2','1']);
});
test('Source ID matching supports API search result exposedDocumentId',()=>{
 assert.equal(matchesNote({exposedDocumentId:'f9b76d84-4ccb-4aaa-aa12-ffdde3440001'},'f9b76d84-4ccb-4aaa-aa12-ffdde3440001'),true);
});
test('Server handles search results by exposedDocumentId and has short-lived Craft control cache',async()=>{
 const {readFileSync}=await import('node:fs');
 const code=readFileSync(new URL('../api/craft.js',import.meta.url),'utf8');
 assert.match(code,/controlCacheUntil/);
 assert.match(code,/exposedDocumentId/);
 assert.match(code,/safeControl\(control\)/);
 assert.match(code,/filterLibrary\(await craft\('\/documents\?fetchMetadata=true'\)/);
});
