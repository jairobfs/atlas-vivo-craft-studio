// ATLAS VIVO · In-app administration that writes the owner's existing Craft note.
// No independent settings database: the Craft document is the single source of truth.
import { parseControlDocument } from './atlas-control.js';

const txt=b=>String(b?.markdown??b?.text?.value??'').trim();
const normal=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const clean=(value,max=140)=>{
  if(typeof value!=='string')throw Object.assign(new Error('Valor inválido'),{status:400});
  const v=value.trim();
  if(!v||v.length>max||/[\r\n\u0000-\u001f]/.test(v)||v.includes('<')||v.includes('>'))throw Object.assign(new Error('Texto inválido: escreva somente uma linha'),{status:400});
  return v;
};
const idPattern=/^[A-Za-z0-9-]{8,100}$/;
const getRoot=result=>{
  const obj=result?.data??result?.items??result;
  return Array.isArray(obj)?obj[0]:obj;
};
const entryId=d=>String(d?.rootBlockId||d?.id||d?.documentId||d?.exposedDocumentId||'');
const entryTitle=d=>String(d?.title?.text?.value??d?.title?.text??d?.title?.markdown??d?.title?.value??d?.title??d?.name??'');
const listOf=d=>Array.isArray(d)?d:Array.isArray(d?.items)?d.items:Array.isArray(d?.documents)?d.documents:Array.isArray(d?.data)?d.data:Array.isArray(d?.data?.items)?d.data.items:[];

export function publicCatalog(result,controlRootId){
 const seen=new Set();
 return listOf(result).filter(d=>{
   const id=entryId(d);if(!idPattern.test(id)||id===controlRootId||d?.deleted||d?.isDeleted||d?.location==='trash'||seen.has(id))return false;
   seen.add(id);return true;
 }).map(d=>({id:entryId(d),title:entryTitle(d).slice(0,200)}));
}
export const ADMIN_FIELDS={
 sessionDays:{label:'Sessão',validate:v=>{const n=Number(v);if(!Number.isInteger(n)||n<1||n>90)throw Error('Sessão: use de 1 a 90 dias');return n+' dias'}},
 libraryMode:{label:'Modo da biblioteca',validate:v=>({selected:'selecionadas',all:'todas'})[v]||reject('Modo da biblioteca inválido')},
 home:{label:'Página inicial',validate:v=>({library:'biblioteca',home:'painel'})[v]||reject('Tela inicial inválida')},
 view:{label:'Visualização padrão',validate:v=>({immersive:'imersivo',composed:'lousas',map:'mapa',atlas:'leitura'})[v]||reject('Visualização inválida')},
 theme:{label:'Tema padrão',validate:v=>({dark:'escuro',light:'claro'})[v]||reject('Tema inválido')},
 density:{label:'Densidade editorial',validate:v=>({compact:'compacta',balanced:'equilibrada',spacious:'ampla'})[v]||reject('Densidade inválida')},
 autoRefresh:{label:'Atualizar ao abrir',validate:v=>bool(v)},
 editingEnabled:{label:'Permitir edição no ATLAS',validate:v=>bool(v)},
 creationEnabled:{label:'Permitir criar notas',validate:v=>bool(v)},
 appTitle:{label:'Título do aplicativo',validate:v=>clean(v,80)},
 subtitle:{label:'Subtítulo',validate:v=>clean(v,125)},
 opening:{label:'Texto de abertura',validate:v=>clean(v,460)},
 accessCode:{label:'Código de acesso',validate:v=>{const s=clean(v,100);if(s.length<4)throw Error('Código de acesso: use ao menos 4 caracteres');return s}},
};
function reject(msg){throw Object.assign(new Error(msg),{status:400})}
function bool(v){if(typeof v!=='boolean')return reject('Opção deve ser sim ou não');return v?'sim':'não'}
function sameEntries(a,b){return JSON.stringify(a)===JSON.stringify(b)}
export function planAdminUpdate(controlResponse,request,catalogResponse,controlRootId){
 const root=getRoot(controlResponse),blocks=root?.content;
 if(!Array.isArray(blocks))return reject('Central de Controle sem blocos');
 const settings=parseControlDocument(controlResponse);
 if(!settings?.accessCode)return reject('Central sem código de acesso');
 if(typeof request?.expectedRevision!=='string'||request.expectedRevision!==settings.revision){
   throw Object.assign(new Error('A Central foi modificada. Atualize antes de gravar.'),{status:409});
 }
 const patch=request.patch===undefined?{}:request.patch;
 if(!patch||Array.isArray(patch)||typeof patch!=='object')return reject('Configurações inválidas');
 const names=Object.keys(patch);
 if(names.length>16||names.some(n=>!ADMIN_FIELDS[n]))return reject('Campo administrativo desconhecido');
 if(Object.hasOwn(patch,'accessCode')&&(typeof patch.accessCode!=='string'||patch.accessCode.length<4))return reject('Código de acesso inválido');
 const updates=[];
 for(const key of names){
   const field=ADMIN_FIELDS[key];
   const value=field.validate(patch[key]);
   const block=blocks.find(b=>b?.type==='text'&&normal(txt(b).split(':')[0])===normal(field.label));
   if(!block?.id)return reject('Campo '+field.label+' não existe na Central Craft');
   const markdown=field.label+': '+value;
   if(txt(block)!==markdown)updates.push({id:block.id,markdown});
 }
 let library=null;
 if(Object.hasOwn(request,'selectedIds')){
   if(!Array.isArray(request.selectedIds)||request.selectedIds.length>120)return reject('Seleção de biblioteca inválida');
   const selected=request.selectedIds.map(String);
   if(selected.some(id=>!idPattern.test(id))||new Set(selected).size!==selected.length)return reject('Documentos inválidos ou duplicados');
   const docs=publicCatalog(catalogResponse,controlRootId),available=new Map(docs.map(d=>[d.id,d]));
   const missing=selected.filter(id=>!available.has(id));if(missing.length)return reject('Algumas notas deixaram de estar disponíveis; atualize o catálogo');
   const values=selected.map(id=>{
     const d=available.get(id);
     const title=clean(d.title||'Documento',160);
     return 'Exibir: '+title+' | '+id;
   });
   const first=blocks.findIndex(b=>normal(txt(b)).startsWith('modo da biblioteca:'));
   const last=blocks.findIndex((b,i)=>i>first&&b?.textStyle?.startsWith('h'));
   const group=blocks.slice(first+1,last===-1?blocks.length:last).filter(b=>normal(txt(b)).startsWith('exibir:')&&b.id);
   for(let i=0;i<Math.min(values.length,group.length);i++){
     if(txt(group[i])!==values[i])updates.push({id:group[i].id,markdown:values[i]});
   }
   library={
     add:values.slice(group.length),
     remove:group.slice(values.length).map(b=>b.id),
     anchor:group[group.length-1]?.id||blocks[first]?.id,
     changed:!sameEntries(settings.visibleNotes,values.map(x=>x.slice(7))),
   };
   if(!library.anchor)return reject('Seção Biblioteca ausente no Craft');
 }
 if(updates.length===0&&(!library||(!library.add.length&&!library.remove.length&&!library.changed))) return {unchanged:true,previous:settings};
 return {updates,library,unchanged:false,previous:settings};
}
export function safeOrigin(req){
 const origin=req.headers?.origin;if(!origin)return true;
 try{
   const u=new URL(origin),host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'');
   return u.protocol==='https:'&&u.host===host;
 }catch{return false}
}
