import {flat,raw,kind,level,title,image,rows,steps,sides,esc,rich,compile} from './visual-core.js';
const W=1100,H=735,PREFIX='ATLAS_VIVO_LAYOUT_V1:';
const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>[...root.querySelectorAll(s)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const id=()=>('v'+Math.random().toString(36).slice(2,9));
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9-]{6,110}$/.test(x);
const sourceTitle=b=>raw(b).replace(/^#{1,4}\s*/,'').replace(/^<callout>/,'').slice(0,100);
const metadataOf=(doc)=>flat(doc).find(b=>raw(b).startsWith(PREFIX));
const cleanBlock=b=>raw(b).startsWith(PREFIX);
const styleFor=k=>k==='image'?'picture':k==='callout'?'warning':k==='heading'?'hero':'normal';
function starter(doc){
 const grouped=compile(doc).sections;
 let boards=[];
 for(const sec of grouped){
  const useful=sec.items.filter(i=>validId(i.block?.id)&&i.kind!=='empty'&&i.kind!=='layout-meta');
  for(let pos=0;pos<useful.length;pos+=4){
   const subset=useful.slice(pos,pos+4);
   const slide={uid:id(),name:sec.name+(pos?' · continuação':''),skin:'dark',nodes:[]};
   subset.forEach((it,index)=>{
    const hero=it.kind==='heading',img=it.kind==='image';
    const dims=[
     {x:40,y:78,w:640,h:225},
     {x:710,y:78,w:350,h:225},
     {x:40,y:328,w:520,h:342},
     {x:580,y:328,w:480,h:342}
    ][index];
    slide.nodes.push({uid:id(),sourceId:it.block.id,kind:it.kind,x:dims.x,y:dims.y,w:dims.w,h:dims.h,design:styleFor(it.kind),accent:'#56c9c7'});
   });
   boards.push(slide);
  }
 }
 if(!boards.length)boards=[{uid:id(),name:'Prancha editorial',skin:'dark',nodes:[]}];
 return {v:1,boards:boards.slice(0,30)};
}
function validate(doc,v){
 if(!v||v.v!==1||!Array.isArray(v.boards)||v.boards.length<1||v.boards.length>30)return starter(doc);
 const safeBoards=[];
 for(const b of v.boards){
  const nodes=[];
  for(const n of (Array.isArray(b.nodes)?b.nodes:[]).slice(0,14)){
   if(!n||typeof n!=='object')continue;
   const src=validId(n.sourceId)?n.sourceId:null;
   const type=String(n.kind||'text');
   if(!['text','heading','callout','flow','comparison','table','image','question','answer','toggle','option','bullet','code','quote','note','arrow','shape','task','missing','file','drawing'].includes(type))continue;
   nodes.push({uid:String(n.uid||id()).slice(0,50),sourceId:src,kind:type,
    x:clamp(Number(n.x)||0,0,W-80),y:clamp(Number(n.y)||0,0,H-60),
    w:clamp(Number(n.w)||220,120,W),h:clamp(Number(n.h)||130,60,H),
    design:['normal','hero','warning','picture','transparent'].includes(n.design)?n.design:'normal',
    accent:/^#[0-9a-fA-F]{6}$/.test(n.accent||'')?n.accent:'#56c9c7',
    text:String(n.text||'').slice(0,700)});
  }
  safeBoards.push({uid:String(b.uid||id()).slice(0,50),name:String(b.name||'Prancha').slice(0,95),skin:['dark','light','paper'].includes(b.skin)?b.skin:'dark',nodes});
 }
 return{v:1,boards:safeBoards};
}
function extract(doc){
 const block=metadataOf(doc);if(!block)return{metadata:null,layout:starter(doc)};
 try{
  const payload=raw(block).slice(PREFIX.length);
  if(payload.length>120000)throw Error('layout muito extenso');
  return{metadata:block,layout:validate(doc,JSON.parse(decodeURIComponent(payload)))};
 }catch(e){return{metadata:block,layout:starter(doc),error:e.message}};
}
function str(manifest){return PREFIX+encodeURIComponent(JSON.stringify(manifest))}
function nodeHTML(node,source){
 const type=node.kind,t=source?raw(source):String(node.text||'');
 if(type==='image'){const url=source?image(source):'';return url?'<img src="'+esc(url)+'" loading="lazy" alt="'+esc(source?.altText||'Figura científica do Craft')+'">':'<p>Figura pendente. Insira uma imagem nativa no Craft.</p>'}
 if(type==='heading')return '<h3>'+rich(t.replace(/^#{1,4}\s+/,''))+'</h3>';
 if(type==='flow')return '<div class="small-flow">'+steps(t).map((x,i)=>(i?'<i>→</i>':'')+'<span>'+rich(x)+'</span>').join('')+'</div>';
 if(type==='comparison')return '<div class="comparison">'+sides(t).map(x=>'<div><p>'+rich(x)+'</p></div>').join('')+'</div>';
 if(type==='table'){const data=source?rows(source):[];return data.length?'<table><thead><tr>'+data[0].map(x=>'<th>'+rich(x)+'</th>').join('')+'</tr></thead><tbody>'+data.slice(1,6).map(row=>'<tr>'+row.map(x=>'<td>'+rich(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>':'<p>Tabela original disponível no Craft.</p>'}
 if(type==='question')return '<div class="question">'+rich(t.replace(/^(pergunta|questão):\s*/i,''))+'</div>';
 if(type==='arrow')return '<div style="font-size:88px;text-align:center;color:'+esc(node.accent)+'">→</div>';
 if(type==='shape')return '<div style="height:100%;min-height:60px;border:4px solid '+esc(node.accent)+';border-radius:60%;opacity:.8"></div>';
 if(type==='note')return '<div class="emphasis">'+rich(node.text||'Anotação editorial')+'</div>';
 if(type==='callout')return '<div class="emphasis">'+rich(t.replace(/<\/?callout>/g,''))+'</div>';
 if(type==='answer')return '<p>'+rich(t.replace(/^resposta:\s*/i,''))+'</p>';
 if(type==='code')return '<p>'+esc(t.slice(0,550))+'</p>';
 return '<p>'+rich(t.replace(/^>\s*/,''))+'</p>';
}
export function mountComposer(ctx){
 const target=ctx.target;const doc=ctx.doc,sourceNodes=flat(doc);
 const sources=new Map(sourceNodes.filter(n=>validId(n.id)&&!cleanBlock(n)).map(n=>[n.id,n]));
 const parsed=extract(doc);
 let layout=parsed.layout,layoutBlock=parsed.metadata||null,originalLayoutMarkdown=layoutBlock?raw(layoutBlock):null;
 let boardIndex=0,selected=null,editing=true,zoomMode='fit',scale=1,dirty=0,saved=0,timer=null,saving=false,disposed=false;
 const demo=!!ctx.demo;const canWrite=!demo&&!!ctx.documentId&&typeof ctx.api==='function';
 const getBoard=()=>layout.boards[boardIndex];
 const current=()=>getBoard().nodes.find(n=>n.uid===selected)||null;
 function state(label,mode='pending'){let e=$('#composition-state',target);if(!e)return;e.setAttribute('data-status',mode);$('.status-label',e).textContent=label}
 function schedule(){dirty++;state(demo?'Prévia local · não sincronizada':'Alterações pendentes','pending');if(!canWrite)return;clearTimeout(timer);timer=setTimeout(save,1400)}
 async function save(){
  if(!canWrite||disposed||saving||saved>=dirty)return;
  saving=true;const version=dirty;state('Salvando composição no Craft…');
  const markdown=str(layout);
  try{
   const out=await ctx.api('layout',{}, {
     documentId:ctx.documentId,blockId:layoutBlock?.id||null,
     originalMarkdown:originalLayoutMarkdown,markdown
   });
   if(!layoutBlock?.id){
     const item=out?.items?.[0]||out?.data?.[0]||out?.data?.items?.[0]||out?.items?.items?.[0];
     if(item?.id){layoutBlock={id:item.id};originalLayoutMarkdown=markdown}
     else{
       const fresh=await ctx.api('document',{id:ctx.documentId});
       const found=metadataOf(fresh);
       if(!found?.id)throw Error('Composição criada, mas o Craft não retornou o ID. Reabra a nota antes de salvar novamente.');
       layoutBlock={id:found.id};originalLayoutMarkdown=raw(found);
     }
   }else{originalLayoutMarkdown=markdown}
   saved=version;state(saved>=dirty?'Composição salva no Craft':'Sincronizando alterações recentes',saved>=dirty?'ok':'pending');
  }catch(e){state('Falha ao salvar: '+e.message,'error')}finally{saving=false;if(saved<dirty&&saved>0&&!disposed)timer=setTimeout(save,1000)}
 }
 function itemText(n){const src=n.sourceId?sources.get(n.sourceId):null;return src?sourceTitle(src):n.text||'Elemento gráfico'}
 function setDimensions(){
  const host=$('#composition-viewport',target),scroll=$('#composition-scroll',target),board=$('#composition-board',target);
  if(!host||!scroll||!board)return;
  let usable=scroll.clientWidth-23;
  scale=zoomMode==='actual'?1:clamp(usable/W,.17,1);
  host.style.width=zoomMode==='actual'?W+'px':'100%';
  host.style.height=(H*scale)+'px';
  scroll.style.overflowX=zoomMode==='actual'?'auto':'hidden';
  board.style.transform='scale('+scale+')';
 }
 function renderBoard(){
  const board=getBoard(),host=$('#composition-board',target);if(!host)return;
  host.setAttribute('data-skin',board.skin);host.classList.toggle('is-editing',editing);
  host.innerHTML='<div class="board-orbit a"></div><div class="board-orbit b"></div><div class="compose-artboard-label">ATLAS VIVO <span style="opacity:.65">/</span> '+esc(board.name.slice(0,60))+'</div>'+
    board.nodes.map(n=>{const src=n.sourceId?sources.get(n.sourceId):null;const missing=n.sourceId&&!src;
       return '<div class="compose-block '+(n.uid===selected?'selected':'')+'" data-node="'+esc(n.uid)+'" data-design="'+esc(n.design)+'" tabindex="0" role="button" aria-label="Selecionar '+esc(itemText(n).slice(0,60))+'" style="left:'+n.x+'px;top:'+n.y+'px;width:'+Math.min(n.w,W-n.x)+'px;height:'+Math.min(n.h,H-n.y)+'px;'+(n.accent?'border-left-color:'+n.accent+';':'')+'"><div class="component-type">'+esc(n.kind==='note'?'ANOTAÇÃO':n.kind==='image'?'FIGURA':n.kind==='flow'?'MECANISMO':n.kind==='heading'?'CONCEITO':n.kind)+'</div><div class="component-content" data-kind="'+esc(n.kind)+'">'+(missing?'<p>Este bloco foi removido do Craft.</p>':nodeHTML(n,src))+'</div>'+(editing&&n.uid===selected?'<button class="compose-resize" aria-label="Redimensionar elemento" data-resize="'+esc(n.uid)+'">↘</button>':'')+'</div>'}).join('')+
    '<div class="board-footer">COLORHUB · VISUAL MASTER · '+String(boardIndex+1).padStart(2,'0')+'</div>';
  wireBoard();
 }
 function select(uid){selected=uid;renderBoard();renderInspector()}
 function wireBoard(){
  const board=$('#composition-board',target);
  for(const element of $$('.compose-block',board)){
   element.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(element.dataset.node)}};
   element.onpointerdown=e=>{
    if(!editing)return;
    const uid=element.dataset.node,n=getBoard().nodes.find(x=>x.uid===uid);if(!n)return;
    const resize=!!e.target.closest('[data-resize]');e.preventDefault();e.stopPropagation();
    const initial={x:n.x,y:n.y,w:n.w,h:n.h,px:e.clientX,py:e.clientY};
    selected=uid;renderInspector();for(const a of $$('.compose-block',board))a.classList.toggle('selected',a.dataset.node===uid);
    const moved=e2=>{
     const dx=(e2.clientX-initial.px)/scale,dy=(e2.clientY-initial.py)/scale;
     if(resize){n.w=clamp(Math.round((initial.w+dx)/10)*10,120,W-n.x);n.h=clamp(Math.round((initial.h+dy)/10)*10,60,H-n.y)}
     else{n.x=clamp(Math.round((initial.x+dx)/10)*10,0,W-n.w);n.y=clamp(Math.round((initial.y+dy)/10)*10,0,H-n.h)}
     element.style.left=n.x+'px';element.style.top=n.y+'px';element.style.width=n.w+'px';element.style.height=n.h+'px';
    };
    const end=()=>{window.removeEventListener('pointermove',moved);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);schedule();renderBoard();renderInspector()};
    window.addEventListener('pointermove',moved);window.addEventListener('pointerup',end,{once:true});window.addEventListener('pointercancel',end,{once:true});
   };
  }
 }
 function renderInspector(){
  const panel=$('#composition-inspector',target);if(!panel)return;
  const n=current(),source=n?.sourceId?sources.get(n.sourceId):null;
  const palette='<div class="eyebrow">BIBLIOTECA DE COMPONENTES</div><div class="compose-library">'+[...sources.values()].filter(b=>!['page','collection'].includes(b.type)&&kind(b)!=='empty'&&kind(b)!=='layout-meta').slice(0,80).map(b=>'<button data-source="'+esc(b.id)+'" title="Adicionar do Craft">'+esc(sourceTitle(b).slice(0,94))+'</button>').join('')+'</div>';
  if(!n){
   panel.innerHTML='<div class="eyebrow">ESTÚDIO GRÁFICO</div><h3>Componha livremente</h3><p class="muted mini">Selecione uma peça na prancha ou adicione um bloco da sua nota.</p><div class="compose-chips"><button class="btn" data-create="note">+ Anotação</button><button class="btn" data-create="arrow">+ Seta</button><button class="btn" data-create="shape">+ Círculo</button></div><div style="height:19px"></div>'+palette+'<p class="compose-guide">Toque numa peça para selecionar. Arraste para mover ou use os controles de posição. O layout fica gravado no Craft.</p>';
  }else{
   panel.innerHTML='<div class="eyebrow">PROPRIEDADES DA PEÇA</div><h3>'+esc(itemText(n).slice(0,95))+'</h3><div class="selected-preview">'+esc((source?raw(source):n.text||'Gráfico decorativo').slice(0,280))+'</div><label for="component-design">Estilo visual</label><select class="field" id="component-design"><option value="normal">Cartão científico</option><option value="hero">Destaque principal</option><option value="warning">Alerta clínico</option><option value="picture">Imagem sem moldura</option><option value="transparent">Transparente</option></select><label>Posição na prancha</label><div class="control-grid"><button data-nudge="-30,0">←</button><button data-nudge="0,-30">↑</button><button data-nudge="30,0">→</button><button data-nudge="-0,30">↓</button><button data-scale="-40,0">Largura −</button><button data-scale="40,0">Largura +</button><button data-scale="0,-35">Altura −</button><button data-scale="0,35">Altura +</button><button data-remove="1">Excluir</button></div><label>Cor de realce</label><input class="field" type="color" id="component-accent" style="height:42px;padding:3px" value="'+esc(n.accent||'#56c9c7')+'">'+
     (n.kind==='note'?'<label>Texto livre da anotação</label><textarea class="field" id="component-text" rows="4">'+esc(n.text||'')+'</textarea>':'')+
     (source&&source.type==='text'?'<div class="eyebrow" style="margin-top:14px">EDIÇÃO BIDIRECIONAL</div><label>Texto original no Craft</label><textarea class="field" id="source-text" rows="5">'+esc(raw(source))+'</textarea><button class="btn primary" id="save-source">Salvar texto no Craft</button><p class="mini muted">Esta ação atualiza o bloco original, não uma cópia visual.</p>':'')+
     '<div style="height:14px"></div>'+palette;
   $('#component-design',panel).value=n.design;
   $('#component-design',panel).onchange=e=>{n.design=e.target.value;schedule();renderBoard()};
   $('#component-accent',panel).oninput=e=>{n.accent=e.target.value;schedule();renderBoard()};
   $$( '[data-nudge]',panel).forEach(b=>b.onclick=()=>{let [dx,dy]=b.dataset.nudge.split(',').map(Number);n.x=clamp(n.x+dx,0,W-n.w);n.y=clamp(n.y+dy,0,H-n.h);schedule();renderBoard()});
   $$('[data-scale]',panel).forEach(b=>b.onclick=()=>{let [dw,dh]=b.dataset.scale.split(',').map(Number);n.w=clamp(n.w+dw,120,W-n.x);n.h=clamp(n.h+dh,60,H-n.y);schedule();renderBoard()});
   $('[data-remove]',panel).onclick=()=>{getBoard().nodes=getBoard().nodes.filter(x=>x.uid!==n.uid);selected=null;schedule();renderBoard();renderInspector()};
   const text=$('#component-text',panel);if(text)text.oninput=e=>{n.text=e.target.value.slice(0,700);schedule();renderBoard()};
   const saveText=$('#save-source',panel);if(saveText)saveText.onclick=async()=>{
     if(!canWrite){state('Modo demonstração: edição não publicada','error');return}
     const val=$('#source-text',panel).value;const prev=raw(source);
     if(val===prev)return;
     saveText.disabled=true;state('Atualizando conteúdo no Craft…');
     try{await ctx.api('update',{}, {id:source.id,originalMarkdown:prev,markdown:val});source.markdown=val;state('Conteúdo atualizado no Craft','ok');renderBoard();renderInspector()}
     catch(e){state('Erro ao salvar conteúdo: '+e.message,'error')}finally{saveText.disabled=false}
   };
  }
  $$('[data-source]',panel).forEach(b=>b.onclick=()=>{
    const src=sources.get(b.dataset.source);if(!src)return;
    const k=kind(src),slide=getBoard();if(slide.nodes.length>=14){state('Limite de 14 peças nesta prancha','error');return}
    const spot=slide.nodes.length;
    const x=clamp(55+(spot%3)*105,0,760),y=clamp(100+(spot%4)*72,0,500);
    const item={uid:id(),sourceId:src.id,kind:k,x,y,w:k==='image'?380:450,h:k==='image'?340:175,design:styleFor(k),accent:'#56c9c7'};
    slide.nodes.push(item);selected=item.uid;schedule();renderBoard();renderInspector();
  });
  $$('[data-create]',panel).forEach(b=>b.onclick=()=>{
    let k=b.dataset.create,slide=getBoard();if(slide.nodes.length>=14)return;
    let item={uid:id(),sourceId:null,kind:k,x:220,y:170,w:k==='arrow'?190:300,h:k==='arrow'?140:160,design:k==='arrow'?'transparent':'normal',accent:'#56c9c7',text:k==='note'?'Novo destaque do atlas':''};
    slide.nodes.push(item);selected=item.uid;schedule();renderBoard();renderInspector();
  });
 }
 function updateHead(){
  const label=$('#compose-board-counter',target);if(label)label.textContent=(boardIndex+1)+' / '+layout.boards.length;
  const name=$('#compose-board-name',target);if(name)name.value=getBoard().name;
  const skin=$('#compose-skin',target);if(skin)skin.value=getBoard().skin;
 }
 function render(){target.innerHTML='<div class="compose-root"><div class="compose-header"><div><div class="eyebrow">CANVAS EDITORIAL · CRAFT BACKEND</div><h1>Compositor Visual</h1><p class="muted mini">Pranchas espaciais, imagens científicas e mecanismos — ajuste as peças sem programação.</p></div><div class="compose-top-actions"><button id="compose-back" class="btn">← Voltar ao atlas</button><button id="compose-save" class="btn primary" '+(!canWrite?'disabled':'')+'>Salvar no Craft</button></div></div><div class="compose-rail"><div class="compose-tools"><button class="btn small" id="previous-board">←</button><span id="compose-board-counter" class="chip"></span><button class="btn small" id="next-board">→</button><button class="btn small" id="add-board">+ Prancha</button><button class="btn small" id="remove-board">Excluir prancha</button><button class="btn small" id="zoom-mode">100%</button><button class="btn small" id="reset-board">Auto-organizar</button><div id="composition-state" data-status="ok" class="compose-status"><span class="compose-status-dot"></span><span class="status-label">Pronto para editar</span></div></div><div class="compose-scroll" id="composition-scroll"><div class="compose-viewport" id="composition-viewport"><div class="compose-board is-editing" id="composition-board"></div></div></div><div class="compose-bottomnote">Ajuste a disposição arrastando ou pelos controles. O tamanho do quadro mantém a proporção editorial e se adapta ao celular.</div></div><div class="compose-inspector" id="composition-inspector"></div></div>';
  $('#compose-back',target).onclick=()=>{clearTimeout(timer);if(canWrite&&saved<dirty)save();ctx.onBack?.()};
  $('#compose-save',target).onclick=()=>{clearTimeout(timer);save()};
  $('#previous-board',target).onclick=()=>{boardIndex=clamp(boardIndex-1,0,layout.boards.length-1);selected=null;draw()};
  $('#next-board',target).onclick=()=>{boardIndex=clamp(boardIndex+1,0,layout.boards.length-1);selected=null;draw()};
  $('#add-board',target).onclick=()=>{if(layout.boards.length>=30)return;layout.boards.push({uid:id(),name:'Nova prancha',skin:'dark',nodes:[]});boardIndex=layout.boards.length-1;selected=null;schedule();draw()};
  $('#remove-board',target).onclick=()=>{if(layout.boards.length===1){state('Mantenha pelo menos uma prancha','error');return}layout.boards.splice(boardIndex,1);boardIndex=clamp(boardIndex,0,layout.boards.length-1);selected=null;schedule();draw()};
  $('#zoom-mode',target).onclick=()=>{zoomMode=zoomMode==='fit'?'actual':'fit';$('#zoom-mode',target).textContent=zoomMode==='fit'?'100%':'Ajustar';setDimensions()};
  $('#reset-board',target).onclick=()=>{getBoard().nodes.forEach((n,i)=>{const coords=[{x:40,y:78,w:630,h:225},{x:690,y:78,w:370,h:225},{x:40,y:325,w:510,h:348},{x:570,y:325,w:490,h:348}][i%4];Object.assign(n,coords)});schedule();draw()};
  const observe=new ResizeObserver(()=>{if(!disposed)setDimensions()});observe.observe($('#composition-scroll',target));ctx.cleanup=()=>{disposed=true;observe.disconnect();clearTimeout(timer)};
  function draw(){updateHead();renderBoard();renderInspector();setDimensions()}
  draw();
  const name=$('#compose-board-name',target);if(name)name.onchange=e=>{getBoard().name=e.target.value.slice(0,95);schedule();renderBoard()};
  return{redraw:draw};
 }
 const result=render();
 // Add chapter options to stage toolbar without code editing.
 const toolbar=$('.compose-tools',target);
 const extras=document.createElement('div');extras.className='compose-chips';extras.innerHTML='<label class="mini muted">Nome <input class="field" id="compose-board-name" style="width:145px;margin:0;padding:7px" value="'+esc(getBoard().name)+'"></label><label class="mini muted">Fundo <select class="field" id="compose-skin" style="width:99px;margin:0;padding:7px"><option value="dark">Marinho</option><option value="light">Claro</option><option value="paper">Papel</option></select></label>';
 toolbar.append(extras);$('#compose-skin',target).value=getBoard().skin;
 $('#compose-skin',target).onchange=e=>{getBoard().skin=e.target.value;schedule();renderBoard()};
 $('#compose-board-name',target).onchange=e=>{getBoard().name=e.target.value.slice(0,95);schedule();renderBoard()};
 return{cleanup:()=>{disposed=true;clearTimeout(timer);ctx.cleanup?.()},getLayout:()=>layout};
}
function styleFor(k){return k==='image'?'picture':k==='callout'?'warning':k==='heading'?'hero':'normal'}
export function getLayoutMetadata(doc){return extract(doc)}
export function layoutMetadataMarker(){return PREFIX}
