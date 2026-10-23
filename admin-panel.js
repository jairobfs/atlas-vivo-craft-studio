// ATLAS VIVO · Autonomous owner console. Every saved setting is persisted to Craft.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const modes=[
 {key:'library',label:'Biblioteca'},
 {key:'appearance',label:'Aparência'},
 {key:'access',label:'Acesso'},
 {key:'create',label:'Nova nota'}
];
const selects=[
 {key:'home',label:'Tela inicial',values:[['library','Biblioteca'],['home','Painel']]},
 {key:'view',label:'Visualização padrão',values:[['immersive','Experiência visual'],['composed','Lousas compostas'],['map','Mapa conceitual'],['atlas','Leitura clássica']]},
 {key:'theme',label:'Aparência',values:[['dark','Escuro / OLED'],['light','Claro']]},
 {key:'density',label:'Densidade editorial',values:[['compact','Compacta'],['balanced','Equilibrada'],['spacious','Ampla']]},
];
const booleanFields=[
 {key:'autoRefresh',label:'Atualizar notas ao retornar ao aplicativo',description:'Recarrega os dados do Craft quando você volta para a leitura.'},
 {key:'editingEnabled',label:'Permitir edição de conteúdo pelo ATLAS',description:'Autoriza salvar textos e composições nas notas originais.'},
 {key:'creationEnabled',label:'Permitir criação de notas pelo ATLAS',description:'Novas notas ficam disponíveis no Craft.'},
];
function refOf(x){const i=String(x||'').split(/\s+\|\s+/);return {title:i[0]||'',id:i[1]||''}}
function catalogId(note,catalog){
 const r=refOf(note);
 return catalog.find(d=>d.id===r.id||d.id===r.title||norm(d.title)===norm(r.title))?.id;
}
function el(id,host){return host.querySelector('#'+id)}
export async function renderAdminConsole({host,api,settings,onSaved,onExit,onCreated,startTab='library'}){
 let cfg=settings||await api('control'),catalogData;
 try{catalogData=await api('catalog')}catch{catalogData={items:[]}}
 let catalog=Array.isArray(catalogData?.items)?catalogData.items:[];
 let draft={...cfg},password='',active=startTab,search='',libraryDirty=false,settingsDirty=false,busy=false,selectedIds=(cfg.visibleNotes||[]).map(s=>catalogId(s,catalog)).filter(Boolean);
 let unresolved=(cfg.visibleNotes||[]).filter(s=>!catalogId(s,catalog));
 let notice='';
 const isOwner=()=>Boolean(cfg?.configured);
 function ensure(){if(!isOwner())throw Error('A Central de Controle precisa estar conectada ao Craft')}
 function markDirty(){el('admin-status',host)?.replaceChildren(document.createTextNode('Alterações não salvas'))}
 function chosen(){return selectedIds.map(id=>catalog.find(x=>x.id===id)).filter(Boolean)}
 function render(){
  const modeHtml=modes.map(m=>'<button class="admin-tab '+(active===m.key?'selected':'')+'" data-admin-tab="'+m.key+'">'+m.label+'</button>').join('');
  host.innerHTML='<div class="owner-console"><div class="owner-header"><div><div class="eyebrow">ATLAS VIVO · CONTROLE TOTAL</div><h1>Seu estúdio. Suas regras.</h1><p class="muted">Edite aqui. O aplicativo grava no Craft e compartilha a mesma configuração entre seus dispositivos.</p></div><div class="owner-top-actions"><button class="btn outline small" id="admin-reload">↻ Sincronizar</button><button class="btn primary" id="admin-save" '+(busy?'disabled':'')+'>'+(busy?'Salvando…':'Salvar alterações')+'</button></div></div>'+
  '<div class="owner-tabs" role="tablist" aria-label="Administração do Atlas">'+modeHtml+'</div>'+
  '<div class="owner-columns"><div id="owner-content">'+view()+'</div>'+
  '<aside class="owner-help"><div class="eyebrow">FONTE DE VERDADE</div><h3>ATLAS ⇄ CRAFT</h3><p>Tudo que você alterar aqui é gravado na Central do Craft, não numa configuração isolada do navegador.</p><div class="owner-stat"><span>Biblioteca</span><strong>'+selectedIds.length+' notas selecionadas</strong></div><div class="owner-stat"><span>Origem</span><strong>Craft conectado</strong></div><div class="owner-stat"><span>Publicação</span><strong>Sem editar código</strong></div><div id="admin-status" class="owner-state" aria-live="polite">'+escape(notice||'Configuração pronta para editar')+'</div><a class="owner-link" href="'+escape(cfg.craftUrl||'#')+'" target="_blank" rel="noopener noreferrer">Também abrir no Craft ↗</a><button class="btn outline small" id="admin-exit">Voltar à biblioteca</button></aside></div></div>';
  wire();
 }
 function view(){
  if(active==='library'){
   const sel=chosen();
   const candidates=catalog.filter(d=>!selectedIds.includes(d.id)&&norm(d.title).includes(norm(search)));
   return '<section class="panel owner-panel"><div class="eyebrow">01 · PUBLICAÇÃO DA BIBLIOTECA</div><h2>Escolha o que aparece no ATLAS.</h2><p class="muted mini">Ocultar uma nota não apaga nada do Craft. Reorganize com as setas; a mesma ordem aparecerá em seus outros dispositivos.</p><div class="owner-toggle" role="radiogroup" aria-label="Modo da biblioteca"><button data-mode="selected" class="'+(draft.libraryMode==='selected'?'active':'')+'">Somente escolhidas</button><button data-mode="all" class="'+(draft.libraryMode==='all'?'active':'')+'">Todas as notas</button></div>'+
    (draft.libraryMode==='all'?'<div class="notice mini">Você está mostrando todos os documentos acessíveis pela sua conexão do Craft. A lista de seleção abaixo será utilizada quando voltar para “Somente escolhidas”.</div>':'')+
    '<h3 class="owner-subtitle">Notas selecionadas <span class="chip">'+sel.length+'</span></h3><div class="owner-items">'+(sel.length?sel.map((d,i)=>'<div class="owner-selected"><span class="owner-order">'+String(i+1).padStart(2,'0')+'</span><span class="owner-name">'+escape(d.title)+'</span><div class="owner-arrows"><button data-shift="'+escape(d.id)+'" data-step="-1" aria-label="Subir" '+(i===0?'disabled':'')+'>↑</button><button data-shift="'+escape(d.id)+'" data-step="1" aria-label="Descer" '+(i===sel.length-1?'disabled':'')+'>↓</button><button data-remove="'+escape(d.id)+'" aria-label="Ocultar nota">×</button></div></div>').join(''):'<div class="owner-empty">Nenhuma nota selecionada. Pesquise e adicione abaixo.</div>')+'</div>'+
    (unresolved.length?'<div class="owner-warning">Algumas referências da Central do Craft não aparecem neste catálogo: '+unresolved.map(escape).join('; ')+'. Antes de salvar uma nova seleção, confira se essas notas ainda estão acessíveis.</div>':'')+
    '<h3 class="owner-subtitle">Adicionar à biblioteca</h3><input class="field" id="admin-filter" placeholder="Pesquisar todas as notas acessíveis..." value="'+escape(search)+'" autocomplete="off"><div class="owner-catalog">'+(candidates.length?candidates.slice(0,80).map(d=>'<button data-add="'+escape(d.id)+'" class="owner-candidate"><span><strong>'+escape(d.title)+'</strong><small>Nota existente no Craft</small></span><b>+ Adicionar</b></button>').join(''):'<div class="owner-empty">Nenhum resultado disponível.</div>')+'</div></section>';
  }
  if(active==='appearance'){
   return '<section class="panel owner-panel"><div class="eyebrow">02 · IDENTIDADE E EXPERIÊNCIA</div><h2>Personalize sem tocar no código.</h2><div class="owner-field-grid">'+selects.map(o=>'<label>'+o.label+'<select class="field" data-option="'+o.key+'">'+o.values.map(([v,label])=>'<option value="'+v+'" '+(draft[o.key]===v?'selected':'')+'>'+label+'</option>').join('')+'</select></label>').join('')+'</div>'+
    '<label>Título do aplicativo<input class="field" data-text="appTitle" maxlength="80" value="'+escape(draft.appTitle||'ATLAS VIVO')+'"></label><label>Subtítulo<input class="field" data-text="subtitle" maxlength="125" value="'+escape(draft.subtitle||'')+'"></label><label>Mensagem de abertura<textarea class="field" data-text="opening" maxlength="460" rows="4">'+escape(draft.opening||'')+'</textarea></label>'+
    '<div class="owner-switches">'+booleanFields.map(b=>'<label class="owner-switch"><input type="checkbox" data-flag="'+b.key+'" '+(draft[b.key]?'checked':'')+'><span><strong>'+b.label+'</strong><small>'+b.description+'</small></span></label>').join('')+'</div></section>';
  }
  if(active==='access'){
   return '<section class="panel owner-panel"><div class="eyebrow">03 · ACESSO E SESSÕES</div><h2>Troque seu código aqui.</h2><p class="muted mini">O código é salvo na Central privada do Craft. Ele não é enviado de volta à interface depois de salvo. A sessão deste dispositivo será mantida; as antigas serão invalidadas.</p><label>Novo código de acesso<input id="admin-password" class="field" type="password" autocomplete="new-password" minlength="4" maxlength="100" placeholder="Digite um novo código (opcional)" value="'+escape(password)+'"></label><label class="owner-switch owner-reveal"><input type="checkbox" id="admin-reveal"><span><strong>Mostrar enquanto digito</strong></span></label><label>Duração da sessão (dias)<input id="admin-days" class="field" type="number" min="1" max="90" step="1" value="'+escape(draft.sessionDays||30)+'"></label><div class="notice mini">Você continua com autonomia: pode redefinir o código aqui novamente sempre que desejar, sem visitar a Vercel.</div></section>';
  }
  return '<section class="panel owner-panel"><div class="eyebrow">04 · NOVAS NOTAS</div><h2>Crie direto no ATLAS.</h2><p class="muted mini">A nova nota será criada no Craft. Depois poderá ser editada, receber figuras e ser composta como qualquer outro atlas.</p><label>Título da nova nota<input id="owner-new-title" class="field" maxlength="160" placeholder="Ex.: SP1 · Atlas anatômico"></label><label>Primeiro parágrafo<textarea id="owner-new-body" class="field" rows="5" placeholder="Escreva o conteúdo inicial (opcional)"></textarea></label><button class="btn primary" id="owner-create" '+(!draft.creationEnabled?'disabled':'')+'>Criar nota no Craft</button>'+(!draft.creationEnabled?'<p class="owner-warning">A criação de notas está desativada. Ative-a em Aparência.</p>':'')+'</section>';
 }
 function wire(){
  host.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.onclick=()=>{active=btn.dataset.adminTab;render()});
  host.querySelector('#admin-exit').onclick=()=>onExit?.();
  host.querySelector('#admin-save').onclick=saveChanges;
  host.querySelector('#admin-reload').onclick=reload;
  host.querySelectorAll('[data-mode]').forEach(btn=>btn.onclick=()=>{draft.libraryMode=btn.dataset.mode;settingsDirty=true;render();markDirty()});
  host.querySelectorAll('[data-shift]').forEach(btn=>btn.onclick=()=>{
   const ix=selectedIds.indexOf(btn.dataset.shift),next=ix+Number(btn.dataset.step);
   if(ix<0||next<0||next>=selectedIds.length)return;
   [selectedIds[ix],selectedIds[next]]=[selectedIds[next],selectedIds[ix]];libraryDirty=true;render();markDirty();
  });
  host.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{
   selectedIds=selectedIds.filter(x=>x!==btn.dataset.remove);libraryDirty=true;render();markDirty();
  });
  host.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{
   if(!selectedIds.includes(btn.dataset.add))selectedIds.push(btn.dataset.add);
   libraryDirty=true;render();markDirty();
  });
  const filter=el('admin-filter',host);
  if(filter)filter.oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;render();const n=el('admin-filter',host);n?.focus();n?.setSelectionRange(pos,pos)};
  host.querySelectorAll('[data-option]').forEach(s=>s.onchange=e=>{draft[s.dataset.option]=e.target.value;settingsDirty=true;markDirty()});
  host.querySelectorAll('[data-text]').forEach(s=>s.oninput=e=>{draft[s.dataset.text]=e.target.value;settingsDirty=true;markDirty()});
  host.querySelectorAll('[data-flag]').forEach(s=>s.onchange=e=>{draft[s.dataset.flag]=e.target.checked;settingsDirty=true;markDirty()});
  const pass=el('admin-password',host);if(pass)pass.oninput=e=>{password=e.target.value;markDirty()};
  const reveal=el('admin-reveal',host);if(reveal)reveal.onchange=e=>{el('admin-password',host).type=e.target.checked?'text':'password'};
  const days=el('admin-days',host);if(days)days.oninput=e=>{draft.sessionDays=Number(e.target.value);settingsDirty=true;markDirty()};
  const create=el('owner-create',host);if(create)create.onclick=createNote;
 }
 async function saveChanges(){
  if(busy)return;ensure();
  const patch={};if(settingsDirty){
   for(const k of ['sessionDays','home','view','theme','density','autoRefresh','editingEnabled','creationEnabled','appTitle','subtitle','opening']){
    if(draft[k]!==cfg[k])patch[k]=draft[k];
   }
   if(draft.libraryMode!==cfg.libraryMode)patch.libraryMode=draft.libraryMode;
  }
  if(password.trim())patch.accessCode=password.trim();
  if(libraryDirty&&unresolved.length){notice='Há notas indisponíveis nesta seleção. Atualize o catálogo antes de substituir a lista.';render();return}
  if(!Object.keys(patch).length&&!libraryDirty){notice='Nenhuma alteração pendente.';render();return}
  busy=true;notice='Gravando no Craft…';render();
  try{
   const body={expectedRevision:cfg.revision,patch};
   if(libraryDirty)body.selectedIds=selectedIds;
   const res=await api('control-save',{},body);
   if(!res?.ok)throw Error('Craft não confirmou a gravação');
   cfg=res.settings;draft={...cfg};password='';settingsDirty=false;libraryDirty=false;
   unresolved=(cfg.visibleNotes||[]).filter(s=>!catalogId(s,catalog));
   notice='Alterações gravadas e confirmadas no Craft.';
   await onSaved?.(cfg);
   render();
  }catch(e){notice='Não foi possível salvar: '+e.message+' · confira os campos e tente novamente.';render()}
  finally{busy=false;const btn=el('admin-save',host);if(btn)btn.disabled=false}
 }
 async function reload(){
  if((settingsDirty||libraryDirty||password)&&!confirm('Descartar alterações não salvas e carregar o Craft?'))return;
  try{
   const [c,d]=await Promise.all([api('control'),api('catalog')]);
   cfg=c;draft={...c};catalog=Array.isArray(d?.items)?d.items:[];selectedIds=(cfg.visibleNotes||[]).map(s=>catalogId(s,catalog)).filter(Boolean);unresolved=(cfg.visibleNotes||[]).filter(s=>!catalogId(s,catalog));
   settingsDirty=false;libraryDirty=false;password='';notice='Configurações recarregadas diretamente do Craft.';render();
   await onSaved?.(cfg);
  }catch(e){notice='Não foi possível atualizar: '+e.message;render()}
 }
 async function createNote(){
  const t=el('owner-new-title',host)?.value.trim(),body=el('owner-new-body',host)?.value.trim();
  if(!t){notice='Digite um título antes de criar a nota.';render();return}
  if(!cfg.creationEnabled){notice='Criação desativada nas preferências.';render();return}
  const btn=el('owner-create',host);btn.disabled=true;
  try{
   const result=await api('create',{}, {title:t});
   const candidates=Array.isArray(result?.items)?result.items:Array.isArray(result?.data)?result.data:[result?.data||result];
   const created=candidates[0];const ident=String(created?.rootBlockId||created?.id||created?.documentId||'');
   if(body&&ident)await api('append',{}, {documentId:ident,markdown:body});
   const data=await api('catalog');catalog=Array.isArray(data?.items)?data.items:catalog;
   if(ident&&cfg.libraryMode==='selected'&&catalog.some(x=>x.id===ident)){
    selectedIds=[...selectedIds,ident];libraryDirty=true;
    notice='Nota criada no Craft. Clique em Salvar alterações para adicioná-la à biblioteca.';
   }else notice='Nota criada no Craft. Ela está disponível no catálogo; selecione-a para publicar.';
   active='library';render();await onCreated?.();
  }catch(e){notice='Erro ao criar nota: '+e.message;render()}
  finally{const b=el('owner-create',host);if(b)b.disabled=false}
 }
 render();return {reload,dispose(){}};
}
