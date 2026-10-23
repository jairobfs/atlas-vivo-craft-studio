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
