/* Single-origin app + allowlisted Craft reader. Credentials are runtime-only. */
const DOCUMENTS=Object.freeze({
  sp1:'1c671fcd-331d-c1af-2e84-4c064596a834',
  sp2:'cc851eea-5217-be5a-1aa2-446f6a278ef4',
  sp3:'bcdd8511-2dcb-7ae7-95f9-cb35b3fc8f5b',
  sp4:'5742d6e6-a85d-e1bb-c7d7-e34cc6fb6a9e',
  clinical:'ab8e73f0-c075-774e-f2cb-a0dacb367137',
  semiology:'8afd2a17-3004-2fed-d644-5d6c1b5e3243',
  ankle:'1339202a-8a02-0fa1-8738-5ddf5265aad2',
  neuromuscular:'7c9a9f24-9e24-39d5-c87f-9bd837a65823',
  oncology:'27694586-41ab-bc65-5302-11465b450185',
  crystals:'c42d737c-7b74-e3bf-daec-6387a97ab9b2',
  source:'11e24325-0bd4-5a13-ec53-d553a1ff0320'
});
const TITLES=Object.freeze({sp1:'SP1 · Articulações',sp2:'SP2 · Neuromuscular',sp3:'SP3 · Trauma',sp4:'SP4 · Tumores',clinical:'Caderno integrador · 12 casos',semiology:'Atlas semiológico V06',ankle:'Atlas semiológico V07',neuromuscular:'Atlas neuromuscular V09',oncology:'Laboratório de decisão V10',crystals:'Cristais e monoartrite V08',source:'Referências e proveniência'});
const EXPECTED_SPACE='8b335448-6499-3d04-91c1-5f99c399aca8';
const json=(value,status=200)=>new Response(JSON.stringify(value),{
  status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}
});
const safeError=(error)=>{
  if(error==='not_configured')return 'Conexão Craft ainda não configurada no servidor.';
  if(error==='wrong_space')return 'A conexão disponível não pertence ao espaço ⌕ tutoria. Nenhum conteúdo externo foi importado.';
  if(error==='not_found')return 'A nota solicitada não está disponível nesta conexão.';
  return 'Falha ao ler o Craft. Verifique a conexão e tente atualizar.';
};
async function readCraft(request,env,url){
  const scope=url.searchParams.get('scope');
  if(!Object.prototype.hasOwnProperty.call(DOCUMENTS,scope))return json({ok:false,error:'Nota não reconhecida.'},400);
  if(!env.CRAFT_API_BASE)return json({ok:false,error:safeError('not_configured')},503);
  const caller=request.headers.get('origin');
  if(caller&&caller!==url.origin)return json({ok:false,error:'Origem não autorizada.'},403);
  const remoteBase=String(env.CRAFT_API_BASE).replace(/\/+$/,'');
  try{
    const root=new URL(remoteBase);
    if(root.protocol!=='https:'||root.hostname!=='connect.craft.do')throw new Error('configuration');
    const head=await fetch(`${remoteBase}/connection`,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(9000)});
    if(!head.ok)throw new Error('upstream');
    const info=await head.json();
    const actual=info?.space?.id||info?.spaceId||info?.connection?.spaceId;
    if(actual!==EXPECTED_SPACE)return json({ok:false,error:safeError('wrong_space')},409);
    const endpoint=new URL(`${remoteBase}/blocks`);
    endpoint.searchParams.set('id',DOCUMENTS[scope]);endpoint.searchParams.set('maxDepth','-1');
    const res=await fetch(endpoint,{headers:{accept:'text/markdown'},redirect:'error',signal:AbortSignal.timeout(14000)});
    if(!res.ok)return json({ok:false,error:safeError(res.status===404?'not_found':'upstream')},502);
    const content=await res.text();
    return json({ok:true,scope,document_title:TITLES[scope],markdown:content.slice(0,210000),truncated:content.length>210000,source:'Craft Full Space API',fetched_at:new Date().toISOString()});
  }catch{return json({ok:false,error:safeError('upstream')},502)}
}
async function appendCraft(request,env,url){
  const origin=request.headers.get('origin');
  if(origin!==url.origin)return json({ok:false,error:'Origem não autorizada.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,error:'Envie dados em JSON.'},415);
  if(!env.CRAFT_API_BASE)return json({ok:false,error:safeError('not_configured')},503);
  let body;
  try{const raw=await request.text();if(raw.length>6000)throw new Error('limit');body=JSON.parse(raw)}
  catch{return json({ok:false,error:'Anotação inválida.'},400)}
  const {scope,note,requestId}=body;
  if(!/^sp[1-4]$/.test(scope)||typeof note!=='string'||note.trim().length<2||note.trim().length>1200||typeof requestId!=='string'||!/^[0-9a-f-]{36}$/i.test(requestId))return json({ok:false,error:'Anotações graváveis apenas nas quatro SPs. Confira o conteúdo antes de enviar.'},400);
  const root=String(env.CRAFT_API_BASE).replace(/\/+$/,'');
  try{const u=new URL(root);if(u.protocol!=='https:'||u.hostname!=='connect.craft.do')throw new Error('configuration')}
  catch{return json({ok:false,error:'Configuração Craft inválida.'},503)}
  try{
    const head=await fetch(`${root}/connection`,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(9000)});
    if(!head.ok)throw new Error('connection');
    const info=await head.json();const actual=info?.space?.id||info?.spaceId||info?.connection?.spaceId;
    if(actual!==EXPECTED_SPACE)return json({ok:false,error:safeError('wrong_space')},409);
    const target=new URL(`${root}/blocks`);target.searchParams.set('id',DOCUMENTS[scope]);
    const getNote=()=>fetch(target,{headers:{accept:'text/markdown'},redirect:'error',signal:AbortSignal.timeout(14000)});
    const before=await getNote();if(!before.ok)throw new Error('read');
    const marker=`AV-${requestId}`;const original=await before.text();
    if(original.includes(marker))return json({ok:true,verified:true,duplicate:true});
    const stamp=new Date().toISOString().slice(0,16).replace('T',' ');
    const markdown=`### Anotação Atlas Vivo · ${stamp} UTC\n\n${note.trim()}\n\n[${marker}]`;
    const sent=await fetch(`${root}/blocks`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(14000),
      headers:{accept:'application/json','content-type':'application/json'},
      body:JSON.stringify({markdown,position:{position:'end',pageId:DOCUMENTS[scope]}})
    });
    if(!sent.ok)return json({ok:false,error:'O Craft não confirmou a gravação. Consulte a nota antes de repetir.'},502);
    const after=await getNote();
    if(!after.ok)return json({ok:true,verified:false});
    const exists=(await after.text()).includes(marker);
    return json({ok:true,verified:exists});
  }catch{return json({ok:false,error:'Estado da gravação incerto. Confira a nota original antes de repetir.'},502)}
}
const TYPES={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',svg:'image/svg+xml',webmanifest:'application/manifest+json',png:'image/png'};
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/craft/annotation'){
      if(request.method!=='POST')return json({ok:false,error:'Método não permitido.'},405);
      return appendCraft(request,env,url);
    }
    if(url.pathname==='/api/craft/read'){
      if(request.method!=='GET')return json({ok:false,error:'Método não permitido.'},405);
      return readCraft(request,env,url);
    }
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    const path=url.pathname==='/'?'/index.html':url.pathname;
    if(!Object.prototype.hasOwnProperty.call(ASSETS,path))return new Response('Not found',{status:404});
    const ext=path.split('.').pop();
    const asset=ASSETS[path];
    const body=request.method==='HEAD'?null:(asset&&typeof asset==='object'&&asset.base64?Uint8Array.from(atob(asset.base64),ch=>ch.charCodeAt(0)):asset);
    return new Response(body,{headers:{'content-type':TYPES[ext]||'text/plain; charset=utf-8','cache-control':'private, max-age=0, must-revalidate','x-content-type-options':'nosniff'}});
  }
};
