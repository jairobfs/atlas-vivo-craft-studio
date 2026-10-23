import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,kind,image,rows,demo,rich,safe,flat,steps,sides} from '../visual-core.js';

test('Amostra editorial preserva 4 pranchas e componentes científicos',()=>{
 const result=compile(demo());
 assert.equal(result.sections.length,4);
 assert.equal(result.figures,1);
 assert.equal(result.tables,1);
 assert.ok(result.sections.some(s=>s.items.some(x=>x.kind==='flow')));
 assert.ok(result.sections.some(s=>s.items.some(x=>x.kind==='comparison')));
 assert.ok(result.sections.some(s=>s.items.some(x=>x.kind==='question')));
 assert.ok(result.sections.some(s=>s.items.some(x=>x.kind==='answer')));
});

test('Imagens nativas do Craft preservam URL e transparência',()=>{
 const original={type:'image',url:'https://r.craft.do/a1B2c3D4',altText:'Anatomia em PNG',mimeType:'image/png'};
 assert.equal(kind(original),'image');
 assert.equal(image(original),'https://r.craft.do/a1B2c3D4');
 assert.equal(safe('javascript:alert(1)'),'');
});

test('Tabelas nativas preservam os valores de todas as células',()=>{
 const n={type:'table',rows:[[{value:'Achado'},{value:'Interpretação'}],[{value:'Cristais presentes'},{value:'Infecção ainda possível'}]]};
 assert.deepEqual(rows(n),[['Achado','Interpretação'],['Cristais presentes','Infecção ainda possível']]);
});

test('Títulos e hierarquia do Craft geram pranchas organizadas',()=>{
 const src={data:[{type:'page',id:'doc',markdown:'Atlas',content:[{type:'text',id:'h',textStyle:'h2',markdown:'## Primeiro eixo'},{type:'text',id:'p',markdown:'Conceito real.'}]}]};
 assert.equal(flat(src).length,3);
 const doc=compile(src);
 assert.equal(doc.title,'Atlas');
 assert.equal(doc.sections.length,1);
 assert.equal(doc.sections[0].name,'Primeiro eixo');
});

test('Marcadores visuais simples do Craft se tornam fluxos e comparações',()=>{
 assert.deepEqual(steps('Fluxo: Identificar → Investigar → Tratar'),['Identificar','Investigar','Tratar']);
 assert.deepEqual(sides('Comparação: Urato | CPPD'),['Urato','CPPD']);
 assert.equal(kind({type:'text',markdown:'[FIGURA:sem-arquivo]'}),'missing');
});

test('HTML perigoso não atravessa o editor de conteúdo',()=>{
 const value=rich('<script>alert("X")</script> **destaque** [a](javascript:alert(1))');
 assert.ok(!value.includes('<script>'));
 assert.ok(value.includes('&lt;script&gt;'));
 assert.ok(value.includes('<strong>destaque</strong>'));
});
