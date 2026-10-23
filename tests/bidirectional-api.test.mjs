import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/craft.js';

// End-to-end API contract using a stateful simulation of the Craft HTTP API.
// Tests never use the owner's credentials, notes or third-party services.
test('ATLAS → Craft → ATLAS: updates a real source-linked block and persists visual layout', async()=>{
  const oldEnv=Object.fromEntries(['CRAFT_API_URL','APP_ACCESS_KEY','ATLAS_CONTROL_ROOT_ID','ATLAS_LAYOUT_ROOT_ID'].map(k=>[k,process.env[k]]));
  const originalFetch=globalThis.fetch;
  const controlId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const documentId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const layoutId='cccccccc-cccc-cccc-cccc-cccccccccccc';
  const textId='dddddddd-dddd-dddd-dddd-dddddddddddd';
  const metaId='eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const title='ATLAS VIVO · Teste fictício';
  let sourceText='Primeira descrição científica de teste.';
  let meta=null,requestCount=0;

  process.env.CRAFT_API_URL='https://connect.craft.do/links/test/api/v1';
  process.env.APP_ACCESS_KEY='test-hmac-key-for-simulation';
  process.env.ATLAS_CONTROL_ROOT_ID=controlId;
  process.env.ATLAS_LAYOUT_ROOT_ID=layoutId;

  const control={id:controlId,type:'page',markdown:'ATLAS · Controle',content:[
    {id:'head-1',type:'text',textStyle:'h2',markdown:'## 01 · Acesso ao aplicativo'},
    {id:'access-1',type:'text',markdown:'Código de acesso: test-code-123'},
    {id:'head-2',type:'text',textStyle:'h2',markdown:'## 02 · Biblioteca publicada'},
    {id:'mode-1',type:'text',markdown:'Modo da biblioteca: selecionadas'},
    {id:'show-1',type:'text',markdown:'Exibir: '+title},
    {id:'head-5',type:'text',textStyle:'h2',markdown:'## 05 · Edição e sincronização'},
    {id:'editable-1',type:'text',markdown:'Permitir edição no ATLAS: sim'}
  ]};
  const sourceBlock=()=>({id:textId,type:'text',markdown:sourceText});
  const document=()=>({id:documentId,type:'page',markdown:title,content:[sourceBlock()]});
  const layout=()=>({id:layoutId,type:'page',markdown:'Layout storage',content:meta?[{id:metaId,type:'text',markdown:meta}]:[]});
  globalThis.fetch=async(url,opts={})=>{
    requestCount++;
    const u=new URL(url),method=opts.method||'GET',id=u.searchParams.get('id');
    let body;
    if(method==='GET'&&u.pathname.endsWith('/blocks')){
      if(id===controlId)body={data:[control]};
      else if(id===layoutId)body={data:[layout()]};
      else if(id===documentId)body={data:[document()]};
      else if(id===textId)body={data:[sourceBlock()]};
      else throw Error('Unexpected block '+id);
    }else if(method==='GET'&&u.pathname.endsWith('/documents')){
      body={items:[{id:documentId,rootBlockId:documentId,title}]};
    }else if(method==='PUT'&&u.pathname.endsWith('/blocks')){
      const blocks=JSON.parse(opts.body).blocks;
      for(const b of blocks){if(b.id===textId)sourceText=b.markdown;else if(b.id===metaId)meta=b.markdown;else throw Error('Unexpected write '+b.id)}
      body={data:blocks};
    }else if(method==='POST'&&u.pathname.endsWith('/blocks')){
      const content=JSON.parse(opts.body);
      assert.equal(content.position.pageId,layoutId);
      assert.equal(content.position.position,'end');
      meta=content.markdown;
      body={data:[{id:metaId,markdown:meta}]};
    }else throw Error('Unexpected Craft operation '+method+' '+u.pathname);
    return{ok:true,status:200,json:async()=>body};
  };

  const call=async(op,method='GET',body=null,cookie='',params={})=>{
    const u=new URL('https://app.local/api/craft');u.searchParams.set('op',op);
    for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
    let payload=null,headers={};
    const req={url:u.pathname+u.search,method,body,headers:{cookie,'x-forwarded-proto':'https'}};
    const res={statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v},end(s){payload=JSON.parse(s)}};
    await handler(req,res);
    return{code:res.statusCode,body:payload,headers};
  };
  try{
    const login=await call('login','POST',{password:'test-code-123'});
    assert.equal(login.code,200);
    const cookie=login.headers['set-cookie'].split(';')[0];
    const before=await call('document','GET',null,cookie,{id:documentId});
    assert.equal(before.code,200);
    assert.equal(before.body.data[0].content[0].markdown,sourceText);

    const update=await call('update','POST',{
      id:textId,originalMarkdown:sourceText,markdown:'Descrição corrigida e persistida.'
    },cookie);
    assert.equal(update.code,200);
    const after=await call('document','GET',null,cookie,{id:documentId});
    assert.equal(after.body.data[0].content[0].markdown,'Descrição corrigida e persistida.');

    const conflict=await call('update','POST',{
      id:textId,originalMarkdown:'Primeira descrição científica de teste.',markdown:'Sobrescrita indevida'
    },cookie);
    assert.equal(conflict.code,409);
    assert.equal(sourceText,'Descrição corrigida e persistida.');

    const previous=await call('layout','GET',null,cookie,{documentId});
    assert.equal(previous.code,200);
    assert.equal(previous.body.config,null);
    const canvas={version:1,skin:'dark',boards:[{id:'board-one',title:'Lousa',nodes:[
      {id:'first',source:textId,x:30,y:60,w:420,h:250,design:'hero'}
    ]}]};
    const save=await call('layout-save','POST',{documentId,previousUpdatedAt:null,config:{layout:'editorial',density:'balanced',order:[],canvas}},cookie);
    assert.equal(save.code,200);
    assert.equal(save.body.storedIn,'Craft');
    assert.equal(save.body.config.canvas.boards[0].nodes[0].w,420);
    assert.ok(meta.startsWith('ATLAS-VIVO-LAYOUT '+documentId+' '));

    const retrieved=await call('layout','GET',null,cookie,{documentId});
    assert.equal(retrieved.code,200);
    assert.equal(retrieved.body.config.canvas.boards[0].nodes[0].x,30);
    assert.equal(retrieved.body.config.canvas.boards[0].nodes[0].source,textId);
    const stale=await call('layout-save','POST',{documentId,previousUpdatedAt:null,config:{layout:'mosaic',order:[],canvas}},cookie);
    assert.equal(stale.code,409);
    assert.ok(requestCount>=9);
  }finally{
    globalThis.fetch=originalFetch;
    for(const [k,v] of Object.entries(oldEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v}
  }
});
