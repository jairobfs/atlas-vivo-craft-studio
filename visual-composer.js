import {esc,raw,image,kind} from './visual-core.js';

// ATLAS VIVO / No-code visual composition. The Craft document retains all medical source content;
// its visual presentation is saved to a separate Craft configuration note.
const PRESETS=[
 {id:'editorial',name:'Editorial',detail:'Pranchas sequenciais e leitura guiada'},
 {id:'mosaic',name:'Mosaico',detail:'Blocos e imagens em painel assimétrico'},
 {id:'spotlight',name:'Destaque',detail:'Uma ideia ou figura dominante por prancha'},
 {id:'story',name:'Narrativa',detail:'Explicação clínica com progressão visual'},
 {id:'panorama',name:'Lousa 16:9',detail:'Composição panorâmica para apresentação'}
];
const DISPLAY=[
 {id:'full',label:'Largura inteira',note:'Ocupa toda a linha'},
 {id:'half',label:'Meia largura',note:'Pode aparecer lado a lado'},
 {id:'feature',label:'Destaque',note:'Amplia a prancha no painel'},
 {id:'hidden',label:'Não mostrar',note:'Oculta apenas na visualização; mantém no Craft'}
];
function uid(section){return String(section.source||section.key)}
function excerpt(section){
 const paragraph=section.items.find(v=>['text','callout','question','comparison','flow'].includes(v.kind));
 return paragraph?raw(paragraph.block).replace(/<\/?callout[^>]*>/g,'').replace(/^(Fluxo|Comparação|Pergunta|Resposta):\s*/i,'').slice(0,230):'';
}
function sectionImage(section){
 const found=section.items.find(v=>v.kind==='image');
 return found?image(found.block):'';
}
export function normalizeVisualConfig(project,config){
 const allowed=new Set(['full','half','feature','hidden']);
 const saved=Array.isArray(config?.order)?config.order:[];
 const original=project.sections.map(s=>({source:uid(s),title:s.name,display:'full'}));
 const indexed=new Map(original.map(x=>[x.source,x]));
 let result=[];
 for(const item of saved){
  if(!item||typeof item!=='object')continue;
  const existing=indexed.get(String(item.source));if(!existing)continue;
  result.push({...existing,display:allowed.has(item.display)?item.display:'full'});
  indexed.delete(existing.source);
 }
 for(const item of original){if(indexed.has(item.source))result.push(item)}
 return {version:1,layout:PRESETS.some(x=>x.id===config?.layout)?config.layout:'editorial',
   density:['compact','balanced','expanded'].includes(config?.density)?config.density:'balanced',
   order:result};
}
export function orderedVisualSections(project,config){
 const safe=normalizeVisualConfig(project,config);
 const byId=new Map(project.sections.map(s=>[uid(s),s]));
 return safe.order.filter(item=>item.display!=='hidden').map(item=>({...byId.get(item.source),display:item.display})).filter(s=>s&&s.items);
}
const sectionIcons={image:'◎',table:'▤',comparison:'◇',flow:'⇢',callout:'!',question:'?',text:'≡'};
function cardMarkup(section,opt,i,selected,full,renderSection){
 const thumbnail=sectionImage(section),kinds=new Set(section.items.map(x=>x.kind));
 const iconrow=[...kinds].filter(k=>k in sectionIcons).slice(0,5).map(k=>'<span class="vc-icon" title="'+esc(k)+'">'+esc(sectionIcons[k])+'</span>').join('');
 const figure=thumbnail?'<div class="vc-photo"><img loading="lazy" src="'+esc(thumbnail)+'" alt="Figura do Craft neste módulo"></div>':'';
 const body=full&&renderSection?'<div class="vc-source">'+renderSection(section,i)+'</div>':
  figure+'<div class="vc-excerpt">'+esc(excerpt(section))+'</div><div class="vc-icons">'+iconrow+'</div>';
 return '<article class="vc-card '+(opt.display==='half'?'vc-half':opt.display==='feature'?'vc-feature':'')+(opt.display==='hidden'?' vc-muted':'')+(opt.source===selected?' selected':'')+'" data-select="'+esc(opt.source)+'" draggable="true" data-drag="'+esc(opt.source)+'"><div class="vc-card-header"><span class="vc-kicker">PRANCHA '+String(i+1).padStart(2,'0')+'</span><span class="vc-handle" title="Arraste para reorganizar">⋮⋮</span></div><h3>'+esc(section.name)+'</h3>'+body+'</article>';
}
export function openVisualComposer({project,config,renderSection,save,onClose,onStored,onEditText,demo=false}){
 const state=normalizeVisualConfig(project,config);
 state.selected=state.order[0]?.source||'';
 state.full=false;
 let dirty=false, busy=false,drag='';
 const shell=document.createElement('div');shell.id='atlas-composer';shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Compositor visual do Atlas Vivo');
 document.body.appendChild(shell);
 const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const escKey=()=>{close()};
 document.addEventListener('keydown',escapeClose);
 function escapeClose(e){if(e.key==='Escape'&&!busy){e.preventDefault();close()}}
 function close(){document.removeEventListener('keydown',escapeClose);shell.remove();document.body.style.overflow=oldOverflow;onClose?.()}
 function touch(){dirty=true;draw()}
 function reorder(src,to){
  let from=state.order.findIndex(x=>x.source===src);
  if(from<0||to<0||to>=state.order.length||from===to)return;
  const [item]=state.order.splice(from,1);state.order.splice(to,0,item);touch();
 }
 function setDisplay(value){
  const selected=state.order.find(x=>x.source===state.selected);if(!selected)return;
  selected.display=value;touch();
 }
 function sections(){
  const byId=new Map(project.sections.map(s=>[uid(s),s]));
  return state.order.map((opt,i)=>({opt,section:byId.get(opt.source),i})).filter(x=>x.section);
 }
 function inspector(){
  const x=sections().find(x=>x.opt.source===state.selected);
  if(!x)return '<div class="vc-empty">Selecione uma prancha na área central.</div>';
  const layoutOpts=DISPLAY.map(d=>'<option value="'+d.id+'" '+(x.opt.display===d.id?'selected':'')+'>'+d.label+'</option>').join('');
  return '<div class="vc-pane-title">Prancha selecionada</div><div class="vc-prop-title">'+esc(x.section.name)+'</div><p class="vc-muted-text">'+x.section.items.length+' elementos originais do Craft</p>'+
   '<label for="vc-size" class="vc-label">Composição</label><select id="vc-size" class="vc-input">'+layoutOpts+'</select>'+
   '<div class="vc-segment"><button id="vc-up" class="vc-mini">↑ Subir</button><button id="vc-down" class="vc-mini">↓ Descer</button></div>'+
   '<div class="vc-metadata"><strong>Conteúdo preservado</strong><p>Textos, tabelas e imagens continuam no documento original. Mudar a aparência não altera evidências nem legendas.</p></div>'+
   '<button id="vc-edit" class="vc-action">Editar o conteúdo original ↗</button>';
 }
 function draw(){
  const view=sections(),selected=state.selected;
  const palettes=PRESETS.map(p=>'<button class="vc-preset '+(state.layout===p.id?'chosen':'')+'" data-preset="'+p.id+'"><span>'+esc(p.name)+'</span><small>'+esc(p.detail)+'</small></button>').join('');
  shell.innerHTML='<div class="vc-wrap">'+
   '<header class="vc-top"><div class="vc-heading"><span class="vc-mark">ATLAS VIVO / COMPOSITOR</span><strong>Ateliê visual</strong><small>O conteúdo vive no Craft. A composição também.</small></div><div class="vc-actions"><span id="vc-status">'+(dirty?'Alterações ainda não salvas':'Composição atual')+'</span><button id="vc-cancel" class="vc-mini">Fechar</button><button id="vc-save" class="vc-save" '+(busy?'disabled':'')+'>"+(demo?'Aplicar à demonstração':'Salvar no Craft')+"</button></div></header>'+
   '<div class="vc-body"><aside class="vc-left"><div class="vc-pane-title">Linguagem visual</div><p class="vc-muted-text">Escolha um sistema de composição. A mudança aparece imediatamente.</p>'+palettes+
   '<div class="vc-pane-title" style="margin-top:23px">Densidade</div><div class="vc-segment">'+['compact','balanced','expanded'].map(p=>'<button data-density="'+p+'" class="vc-mini '+(state.density===p?'chosen':'')+'">'+({compact:'Sintética',balanced:'Equilibrada',expanded:'Ampliada'}[p])+'</button>').join('')+'</div></aside>'+
   '<section class="vc-center"><div class="vc-canvas-head"><div><div class="vc-pane-title">Pranchas do documento</div><p>Toque para selecionar. Arraste ou use as setas para mudar a ordem.</p></div><button id="vc-detail" class="vc-mini">'+(state.full?'Prévia simplificada':'Mostrar conteúdo integral')+'</button></div>'+
   '<div class="vc-canvas vc-layout-'+state.layout+' vc-density-'+state.density+'">'+view.map(({section,opt,i})=>cardMarkup(section,opt,i,selected,state.full,renderSection)).join('')+'</div></section>'+
   '<aside class="vc-right">'+inspector()+'</aside></div></div>';
  shell.querySelector('#vc-cancel').onclick=close;
  shell.querySelector('#vc-save').onclick=async()=>{
   if(busy)return;busy=true;const btn=shell.querySelector('#vc-save');btn.disabled=true;btn.textContent='Gravando...';
   try{
    const payload={version:1,layout:state.layout,density:state.density,order:state.order.map(x=>({source:x.source,title:x.title,display:x.display}))};
    const saved=await save(payload);dirty=false;onStored?.(saved?.config||payload);draw();
    const status=shell.querySelector('#vc-status');status.textContent=demo?'Aplicado à demonstração':'Salvo no Craft';
   }catch(err){
    const status=shell.querySelector('#vc-status');status.textContent='Não foi salvo: '+String(err.message||err);
    btn.textContent='Tentar novamente';
   }finally{busy=false;btn.disabled=false}
  };
  shell.querySelector('#vc-detail').onclick=()=>{state.full=!state.full;draw()};
  shell.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{state.layout=b.dataset.preset;touch()});
  shell.querySelectorAll('[data-density]').forEach(b=>b.onclick=()=>{state.density=b.dataset.density;touch()});
  shell.querySelectorAll('[data-select]').forEach(b=>b.onclick=e=>{if(e.target.closest('a,button'))return;state.selected=b.dataset.select;draw()});
  shell.querySelectorAll('[data-drag]').forEach(b=>{
   b.addEventListener('dragstart',e=>{drag=b.dataset.drag;e.dataTransfer.effectAllowed='move'});
   b.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move'});
   b.addEventListener('drop',e=>{e.preventDefault();const where=state.order.findIndex(x=>x.source===b.dataset.drag);reorder(drag,where);drag=''});
  });
  const selector=shell.querySelector('#vc-size');if(selector)selector.onchange=e=>setDisplay(e.target.value);
  const index=state.order.findIndex(x=>x.source===state.selected);
  const up=shell.querySelector('#vc-up'),down=shell.querySelector('#vc-down');
  if(up)up.onclick=()=>reorder(state.selected,index-1);
  if(down)down.onclick=()=>reorder(state.selected,index+1);
  const edit=shell.querySelector('#vc-edit');if(edit)edit.onclick=()=>{close();onEditText?.(state.selected)};
 }
 draw();
 return {close};
}
