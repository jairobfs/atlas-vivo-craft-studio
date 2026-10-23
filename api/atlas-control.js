// ATLAS VIVO · Craft-native administration.
// The Craft page is the single source of truth for owner-editable preferences.
// Never serialize the accessCode to the browser or to application logs.
const normalize = s => String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const raw = b => String(b?.markdown??b?.text?.value??'').trim();
const yes = v => /^(sim|s|yes|on|ativo|ativado|true|1)$/i.test(normalize(v));
function root(result) {
  const d=result?.data??result;
  return Array.isArray(d)?d[0]:Array.isArray(result?.items)?result.items[0]:d;
}
export function parseControlDocument(response) {
  const page=root(response);
  const blocks=Array.isArray(page?.content)?page.content:[];
  const settings={
    source:'craft',
    accessCode:'',
    sessionDays:30,
    libraryMode:'all',
    visibleNotes:[],
    home:'home',
    view:'immersive',
    theme:'dark',
    density:'balanced',
    autoRefresh:true,
    editingEnabled:true,
    creationEnabled:true,
    appTitle:'ATLAS VIVO',
    subtitle:'ColorHub × Universo',
    opening:'Estude Medicina em um atlas visual e interativo.'
  };
  const allowedViews={imersivo:'immersive',imersiva:'immersive',immersive:'immersive',lousas:'composed',compostas:'composed',composed:'composed',mapa:'map',leitura:'atlas',classica:'atlas',classico:'atlas'};
  const allowedDensity={compacta:'compact',compacto:'compact',equilibrada:'balanced',equilibrado:'balanced',ampla:'spacious',amplo:'spacious'};
  const seen=new Set();
  let section='';
  for(const b of blocks) {
    if(b?.listStyle==='toggle'||b?.type!=='text')continue;
    const line=raw(b).replace(/^([-*]\s+|#{1,5}\s+)/,'').trim();
    if(!line)continue;
    const h=line.match(/^(?:0?[1-9]\s*[.·\-–]\s*)?(acesso|biblioteca|apar[eê]ncia|identidade|edi[cç][aã]o|edi[cç][aã]o e sincroniza[cç][aã]o)\b/i);
    if(b?.textStyle?.startsWith('h')&&h)section=normalize(h[1]);
    const match=line.match(/^([^:]{2,45}):\s*(.*?)\s*$/);
    if(!match)continue;
    const k=normalize(match[1]).replace(/\*\*/g,''),v=match[2].replace(/\*\*$/,'').replace(/^\*\*/,'').trim();
    if(!v)continue;
    if(k==='codigo de acesso'&&section.includes('acesso')){
      settings.accessCode=v.length<=100?v:'';
    } else if(k==='sessao'&&section.includes('acesso')){
      const n=Number(v.match(/\d+/)?.[0]);if(n>=1&&n<=90)settings.sessionDays=n;
    } else if(k==='modo da biblioteca'){
      settings.libraryMode=/^selecionad/i.test(normalize(v))?'selected':'all';
    } else if(k==='exibir'&&section.includes('biblioteca')){
      const item=v.replace(/^[-*]\s*/, '').trim();
      if(!seen.has(normalize(item))&&settings.visibleNotes.length<150){settings.visibleNotes.push(item);seen.add(normalize(item))}
    } else if(k==='pagina inicial'){
      settings.home=normalize(v).startsWith('biblioteca')?'library':'home';
    } else if(k==='visualizacao padrao'){
      settings.view=allowedViews[normalize(v)]||'immersive';
    } else if(k==='tema padrao'){
      settings.theme=normalize(v)==='claro'?'light':'dark';
    } else if(k==='densidade editorial'){
      settings.density=allowedDensity[normalize(v)]||'balanced';
    } else if(k==='atualizar ao abrir'){
      settings.autoRefresh=yes(v);
    } else if(k==='titulo do aplicativo'){
      settings.appTitle=v.slice(0,80);
    } else if(k==='subtitulo'){
      settings.subtitle=v.slice(0,125);
    } else if(k==='texto de abertura'){
      settings.opening=v.slice(0,460);
    } else if(k==='permitir edicao no atlas'){
      settings.editingEnabled=yes(v);
    } else if(k==='permitir criar notas'){
      settings.creationEnabled=yes(v);
    }
  }
  return settings;
}
export function safeControl(settings) {
  if(!settings)return {configured:false,libraryMode:'all',visibleNotes:[],home:'home',view:'immersive',theme:'dark',density:'balanced',autoRefresh:true,editingEnabled:true,creationEnabled:true,appTitle:'ATLAS VIVO',subtitle:'ColorHub × Universo',opening:'Estude Medicina em um atlas visual e interativo.'};
  const {accessCode,sessionDays,source,...rest}=settings;
  return {...rest,configured:true,sessionDays};
}
export function matchesNote(entry,item){
  const original=String(item||'').trim();
  const [label,id]=original.includes('|')?original.split(/\s+\|\s+/):[original,''];
  const ids=[entry?.id,entry?.rootBlockId,entry?.documentId].filter(Boolean).map(normalize);
  return ids.includes(normalize(label))||ids.includes(normalize(id))||
    normalize(entry?.title?.text||entry?.title?.markdown||entry?.title||entry?.name||entry?.markdown)===normalize(label);
}
export function filterLibrary(result,settings){
  if(!settings||settings.libraryMode!=='selected')return result;
  const filtered=arr=>Array.isArray(arr)?arr.filter(doc=>settings.visibleNotes.some(item=>matchesNote(doc,item))):arr;
  if(Array.isArray(result))return filtered(result);
  if(Array.isArray(result?.items))return {...result,items:filtered(result.items)};
  if(Array.isArray(result?.documents))return {...result,documents:filtered(result.documents)};
  if(Array.isArray(result?.data))return {...result,data:filtered(result.data)};
  if(Array.isArray(result?.data?.items))return {...result,data:{...result.data,items:filtered(result.data.items)}};
  return result;
}
