import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/craft.js';

test('Real API contract: Atlas writes owner settings, code and library to native Craft blocks',async()=>{
 const envKeys=['APP_ACCESS_KEY','CRAFT_API_URL','ATLAS_CONTROL_ROOT_ID'];
 const oldEnv=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]));
 const oldFetch=globalThis.fetch;
 const ROOT='11111111-1111-1111-1111-111111111111';
 const A='22222222-2222-2222-2222-222222222222';
 const B='33333333-3333-3333-3333-333333333333';
 const C='44444444-4444-4444-4444-444444444444';
 let id=0,deletedIds=[],putCount=0,postCount=0;
 const rows=[
  ['## 01 · Acesso ao aplicativo','h2'],
  ['Código de acesso: original-demo-code'],['Sessão: 30 dias'],
  ['## 02 · Biblioteca publicada','h2'],
  ['Modo da biblioteca: selecionadas'],['Exibir: Nota A'],['Exibir: Nota B'],
  ['## 03 · Aparência e estudo','h2'],
  ['Página inicial: biblioteca'],['Visualização padrão: imersivo'],['Tema padrão: escuro'],['Densidade editorial: equilibrada'],['Atualizar ao abrir: sim'],
  ['## 04 · Identidade','h2'],
  ['Título do aplicativo: ATLAS VIVO'],['Subtítulo: Medicina'],['Texto de abertura: Conhecimento.'],
  ['## 05 · Edição e sincronização','h2'],['Permitir edição no ATLAS: sim'],['Permitir criar notas: sim']
 ];
 const blocks=rows.map(([markdown,textStyle])=>({id:'field-'+(++id),type:'text',textStyle,markdown}));
 const list=[
  {id:C,rootBlockId:C,title:'Nota C'},
  {id:B,rootBlockId:B,title:'Nota B'},
  {id:A,rootBlockId:A,title:'Nota A'},
  {id:ROOT,rootBlockId:ROOT,title:'Central de controle'}
 ];
 process.env.APP_ACCESS_KEY='temporary-test-hmac-secret';
 process.env.CRAFT_API_URL='https://connect.craft.do/links/test-only/api/v1';
 process.env.ATLAS_CONTROL_ROOT_ID=ROOT;
 const response=data=>({ok:true,status:200,json:async()=>data});
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),method=opts.method||'GET',payload=opts.body?JSON.parse(opts.body):{};
  if(u.pathname.endsWith('/documents')&&method==='GET')return response({items:list});
  if(u.pathname.endsWith('/blocks')&&method==='GET'){
   assert.equal(u.searchParams.get('id'),ROOT);
   return response({data:[{id:ROOT,type:'page',markdown:'Central',content:blocks.map(b=>({...b}))}]});
  }
  if(u.pathname.endsWith('/blocks')&&method==='PUT'){
   putCount++;
   for(const b of payload.blocks||[]){let prior=blocks.find(x=>x.id===b.id);assert.ok(prior);prior.markdown=b.markdown}
   return response({items:payload.blocks});
  }
  if(u.pathname.endsWith('/blocks')&&method==='POST'){
   postCount++;
   const anchor=blocks.findIndex(x=>x.id===payload.position?.siblingId);
   assert.ok(anchor>=0);
   const added=payload.markdown.split('\n\n').map(markdown=>({id:'added-'+(++id),type:'text',markdown}));
   blocks.splice(anchor+1,0,...added);
   return response({items:added});
  }
  if(u.pathname.endsWith('/blocks')&&method==='DELETE'){
   const list=payload.blockIds||[];deletedIds.push(...list);
   for(const id of list){const pos=blocks.findIndex(b=>b.id===id);assert.ok(pos>=0);blocks.splice(pos,1)}
   return response({items:list});
  }
  throw Error('Unexpected Craft operation '+method+' '+u.pathname);
 };
 const call=async(op,verb='GET',body,cookie='',expectedOrigin='https://app.test')=>{
  const req={url:'/api/craft?op='+op,method:verb,headers:{cookie,host:'app.test',origin:expectedOrigin,'x-forwarded-proto':'https'},body};
  let data,headers={};const res={statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v},end(v){data=JSON.parse(v)}};
  await handler(req,res);return{status:res.statusCode,data,headers};
 };
 try{
   const login=await call('login','POST',{password:'original-demo-code'});
   assert.equal(login.status,200);
   const cookie=login.headers['set-cookie'].split(';')[0];
   const control=await call('control','GET',null,cookie);
   assert.equal(control.status,200);
   assert.equal(control.data.configured,true);
   assert.ok(!JSON.stringify(control.data).includes('original-demo-code'));
   assert.ok(control.data.revision);
   const all=await call('catalog','GET',null,cookie);
   assert.deepEqual(all.data.items.map(x=>x.id),[C,B,A]);
   const updated=await call('control-save','POST',{
     expectedRevision:control.data.revision,
     patch:{accessCode:'changed-demo-code',theme:'light',home:'home',appTitle:'MEU ATLAS'},
     selectedIds:[C,A,B]
   },cookie);
   assert.equal(updated.status,200,JSON.stringify(updated.data));
   assert.equal(updated.data.storedIn,'Craft');
   assert.equal(updated.data.accessRotated,true);
   assert.equal(updated.data.settings.theme,'light');
   assert.equal(updated.data.settings.appTitle,'MEU ATLAS');
   assert.ok(!JSON.stringify(updated.data).includes('changed-demo-code'));
   const newCookie=updated.headers['set-cookie'].split(';')[0];
   assert.notEqual(cookie,newCookie);
   const badOld=await call('control','GET',null,cookie);
   assert.equal(badOld.status,401);
   const refreshed=await call('control','GET',null,newCookie);
   assert.equal(refreshed.status,200);
   assert.deepEqual(refreshed.data.visibleNotes.map(x=>x.split('|').pop().trim()),[C,A,B]);
   const documents=await call('documents','GET',null,newCookie);
   assert.deepEqual(documents.data.items.map(x=>x.id),[C,A,B]);
   assert.ok(putCount>0);assert.equal(postCount,1);
   const stale=await call('control-save','POST',{expectedRevision:control.data.revision,patch:{theme:'dark'}},newCookie);
   assert.equal(stale.status,409);
   const denied=await call('control-save','POST',{expectedRevision:refreshed.data.revision,patch:{theme:'dark'}},newCookie,'https://fake.test');
   assert.equal(denied.status,403);
   const trimmed=await call('control-save','POST',{expectedRevision:refreshed.data.revision,patch:{theme:'dark'},selectedIds:[A]},newCookie);
   assert.equal(trimmed.status,200,JSON.stringify(trimmed.data));
   assert.ok(deletedIds.length>=2);
   const freshList=await call('documents','GET',null,newCookie);
   assert.deepEqual(freshList.data.items.map(x=>x.id),[A]);
 }finally{
   globalThis.fetch=oldFetch;
   for(const [k,v] of Object.entries(oldEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v}
 }
});
