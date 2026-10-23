import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/craft.js';

test('Craft-native administration works end to end at the API boundary',async()=>{
  const oldEnv={CRAFT_API_URL:process.env.CRAFT_API_URL,APP_ACCESS_KEY:process.env.APP_ACCESS_KEY,ATLAS_CONTROL_ROOT_ID:process.env.ATLAS_CONTROL_ROOT_ID};
  const oldFetch=globalThis.fetch;
  process.env.CRAFT_API_URL='https://connect.craft.do/links/test-connection/api/v1';
  process.env.APP_ACCESS_KEY='backend-only-hmac-material';
  process.env.ATLAS_CONTROL_ROOT_ID='194aec94-79cf-af4d-8d33-085219b12bb9';
  let count=0;
  const mockControl={data:[{id:process.env.ATLAS_CONTROL_ROOT_ID,type:'page',markdown:'Central de Controle',content:[
    {id:'h1',type:'text',textStyle:'h2',markdown:'## 01 · Acesso ao aplicativo'},
    {id:'k1',type:'text',markdown:'Código de acesso: atlas-teste'},
    {id:'sess',type:'text',markdown:'Sessão: 30 dias'},
    {id:'h2',type:'text',textStyle:'h2',markdown:'## 02 · Biblioteca publicada'},
    {id:'mode',type:'text',markdown:'Modo da biblioteca: selecionadas'},
    {id:'sel2',type:'text',markdown:'Exibir: Nota B'},
    {id:'sel1',type:'text',markdown:'Exibir: Nota A'},
    {id:'h3',type:'text',textStyle:'h2',markdown:'## 03 · Aparência e estudo'},
    {id:'view',type:'text',markdown:'Visualização padrão: imersivo'},
    {id:'home',type:'text',markdown:'Página inicial: biblioteca'}
  ]}]};
  globalThis.fetch=async function(url){
    count++;
    const u=new URL(url);
    let value;
    if(u.pathname.endsWith('/blocks')&&u.searchParams.get('id')===process.env.ATLAS_CONTROL_ROOT_ID)value=mockControl;
    else if(u.pathname.endsWith('/documents'))value={items:[
      {id:'d1',rootBlockId:'11',title:'Nota A'},
      {id:'d2',rootBlockId:'22',title:'Outra nota'},
      {id:'d3',rootBlockId:'33',title:'Nota B'}
    ]};
    else if(u.pathname.endsWith('/connection'))value={space:{id:'space-test'}};
    else throw Error('Unexpected Craft endpoint: '+u.href);
    return {ok:true,status:200,json:async()=>value};
  };
  const call=async(op,method='GET',body=null,cookie='')=>{
    let json=null,headers={};
    const req={url:'/api/craft?op='+op,method,body,headers:{cookie,'x-forwarded-proto':'https'}};
    const res={statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v},end(text){json=JSON.parse(text)}};
    await handler(req,res);
    return{code:res.statusCode,body:json,headers};
  };
  try{
    const status=await call('status');
    assert.equal(status.code,200);
    assert.equal(status.body.controlReady,true);
    assert.equal(status.body.controlError,false);
    assert.equal(status.body.authenticated,false);

    const unauthorized=await call('documents');
    assert.equal(unauthorized.code,401);

    const wrong=await call('login','POST',{password:'senha-errada'});
    assert.equal(wrong.code,401);

    const login=await call('login','POST',{password:'atlas-teste'});
    assert.equal(login.code,200);
    assert.equal(login.body.ok,true);
    assert.match(login.headers['set-cookie'],/HttpOnly/);
    const cookie=login.headers['set-cookie'].split(';')[0];

    const settings=await call('control','GET',null,cookie);
    assert.equal(settings.code,200);
    assert.equal(settings.body.libraryMode,'selected');
    assert.equal(settings.body.home,'library');
    assert.deepEqual(settings.body.visibleNotes,['Nota B','Nota A']);
    assert.equal(settings.body.accessCode,undefined);
    assert.equal(JSON.stringify(settings.body).includes('atlas-teste'),false);

    const list=await call('documents','GET',null,cookie);
    assert.equal(list.code,200);
    assert.deepEqual(list.body.items.map(x=>x.title),['Nota B','Nota A']);
    assert.ok(count>=2);
  }finally{
    globalThis.fetch=oldFetch;
    for(const [k,v] of Object.entries(oldEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v}
  }
});
