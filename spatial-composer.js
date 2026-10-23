import {esc,rich,kind,raw,image,rows,steps,sides} from './visual-core.js';
import {BOARD_W,BOARD_H,sourceMap,normalizeCanvas,defaultCanvas,addNode,updateNode,buildStorageConfig} from './spatial-core.js';

// A source-linked visual editor. All user gestures modify only the visual layout,
// never the scientific meaning of the native Craft blocks.
function nodeContent(block){
 const type=kind(block),m=raw(block);
 if(type==='image'){const url=image(block);return '<div class="component-content" data-kind="image">'+(url?'<img src="'+esc(url)+'" alt="'+esc(block.altText||block.alt||'Figura científica do Craft')+'" draggable="false">':'<p>Imagem original indisponível</p>')+'</div>';}
 if(type==='table'){const table=rows(block).slice(0,8);return '<div class="component-content"><table>'+table.map((cells,i)=>'<tr>'+cells.map(v=>i===0?'<th>'+rich(v)+'</th>':'<td>'+rich(v)+'</td>').join('')+'</tr>').join('')+'</table></div>';}
 if(type==='flow')return '<div class="component-content"><div class="small-flow">'+steps(m).map((v,i)=>(i?'<i>→</i>':'')+'<span>'+rich(v)+'</span>').join('')+'</div></div>';
 if(type==='comparison'){const parts=sides(m);return '<div class="component-content comparison">'+parts.map(x=>'<div><p>'+rich(x)+'</p></div>').join('')+'</div>';}
 if(type==='question'||type==='answer')return '<div class="component-content"><div class="question">'+rich(m.replace(/^(pergunta|resposta|questão):\s*/i,''))+'</div></div>';
 if(type==='callout')return '<div class="component-content"><div class="emphasis">'+rich(m.replace(/<\/?callout[^>]*>/g,''))+'</div></div>';
 if(type==='heading')return '<div class="component-content"><h3>'+rich(m.replace(/^#{1,4}\s+/,''))+'</h3></div>';
 return '<div class="component-content"><p>'+rich(m)+'</p></div>';
}
const typeName={image:'IMAGEM',table:'TABELA',text:'CONCEITO',flow:'FLUXOGRAMA',comparison:'COMPARAÇÃO',heading:'TÍTULO',callout:'ALERTA',question:'QUESTÃO',answer:'RESPOSTA',quote:'CITAÇÃO',option:'ALTERNATIVA',bullet:'LISTA',task:'CHECKLIST',toggle:'REVELAR'};
export function openSpatialComposer({mount,project,config,demo=false,save,onStored,saveText,onClose}){
 const available=sourceMap(project),canvas=normalizeCanvas(project,config?.canvas);
 let selected='',page=0,zoom=1,fit=true,scale=1,status='ok',statusText=demo?'Demonstração local':'Composição carregada do Craft';
 let savedConfig=config||{},mutation=0,latestSaved=0,busy=false,timer=null,destroyed=false;
 const host=typeof mount==='string'?document.querySelector(mount):mount;
 if(!host)throw Error('Área visual não encontrada');
 host.innerHTML='<div id="spatial-composer"></div>';
 const root=host.querySelector('#spatial-composer');
 function active(){return canvas.boards[Math.min(page,canvas.boards.length-1)]}
 function source(n){return available.get(String(n.source))}
 function pick(){return active()?.nodes.find(n=>n.id===selected)}
 function updateStatus(st,t){status=st;statusText=t;const el=root.querySelector('#compose-status');if(el){el.dataset.status=st;el.querySelector('.compose-status-text').textContent=t}}
 function schedule(){mutation++;updateStatus('dirty',demo?'Layout alterado nesta demonstração':'Salvamento automático pendente');clearTimeout(timer);if(!demo)timer=setTimeout(()=>saveNow(),1300)}
 async function saveNow(){
   clearTimeout(timer);
   if(demo){latestSaved=mutation;updateStatus('ok','Composição da demonstração aplicada');return}
   if(busy||destroyed)return;
   busy=true;const serial=mutation;updateStatus('dirty','Gravando composição no Craft...');
   try{
    const payload=buildStorageConfig(savedConfig,canvas);
    const response=await save(payload,savedConfig?.updatedAt||null);
    savedConfig=response?.config||payload;
    onStored?.(savedConfig);
    latestSaved=serial;
    if(mutation===serial)updateStatus('ok','Composição salva no Craft');
    else{updateStatus('dirty','Novas alterações pendentes');timer=setTimeout(()=>saveNow(),550)}
   }catch(err){updateStatus('error','Erro ao salvar: '+String(err.message||err));}
   finally{busy=false}
 }
 function nodeMarkup(n){
   const b=source(n);if(!b)return '';
   const k=kind(b),photo=k==='image';
   const design=photo&&n.design==='standard'?'picture':n.design;
   const dims='left:'+n.x+'px;top:'+n.y+'px;width:'+n.w+'px;height:'+n.h+'px;';
   return '<div class="compose-block '+(n.id===selected?'selected':'')+'" data-node="'+esc(n.id)+'" data-design="'+esc(design)+'" style="'+dims+'" tabindex="0" role="button" aria-label="Selecionar '+esc(typeName[k]||k)+'"><div class="component-type">'+esc(typeName[k]||'CONCEITO')+'</div>'+nodeContent(b)+'<span class="compose-resize" role="presentation" title="Redimensionar">⤡</span></div>';
 }
 function palette(){
   const names=new Set(active().nodes.map(n=>n.source));
   return [...available.entries()].filter(([id,b])=>!names.has(id)&&['text','image','table','flow','comparison','callout','question','answer','heading','bullet','quote'].includes(kind(b))).slice(0,80).map(([id,b])=>'<button data-add="'+esc(id)+'" title="Adicionar peça nesta lousa">'+esc((typeName[kind(b)]||'BLOCO')+' · '+raw(b).replace(/^#{1,4}\s+/,'').slice(0,65)||'Imagem')+'</button>').join('')||'<div class="compose-guide">Todos os blocos desta nota já estão disponíveis na prancha.</div>';
 }
 function inspector(){
   const n=pick(),b=n?source(n):null;
   return '<aside class="compose-inspector">'+
    '<div class="eyebrow">PROPRIEDADES DA COMPOSIÇÃO</div><h3>Editor de elementos</h3>'+
    '<div class="compose-guide">Toque numa peça. Arraste para reposicionar e use o canto inferior para redimensionar. No iPhone, também use os controles abaixo.</div>'+
    (n?'<div class="selected-preview"><b>'+(typeName[kind(b)]||'BLOCO')+'</b><p>'+esc((raw(b)||b?.altText||'Imagem').slice(0,240))+'</p></div>'+
    '<label for="component-style">Estilo do componente</label><select id="component-style" class="field">'+
    [['standard','Normal'],['hero','Destaque principal'],['warning','Alerta'],['picture','Moldura de figura'],['transparent','Sem moldura']].map(([x,v])=>'<option value="'+x+'" '+(n.design===x?'selected':'')+'>'+v+'</option>').join('')+'</select>'+
    '<label>Movimentar · 20 pontos</label><div class="control-grid"><button data-nudge="-20,-20">↖</button><button data-nudge="0,-20">↑</button><button data-nudge="20,-20">↗</button><button data-nudge="-20,0">←</button><button data-nudge="0,0" disabled>●</button><button data-nudge="20,0">→</button><button data-nudge="-20,20">↙</button><button data-nudge="0,20">↓</button><button data-nudge="20,20">↘</button></div>'+
    '<label>Dimensões</label><div class="compose-chips"><button class="btn" data-size="-50,0">− largura</button><button class="btn" data-size="50,0">+ largura</button><button class="btn" data-size="0,-45">− altura</button><button class="btn" data-size="0,45">+ altura</button></div>'+
    (kind(b)==='image'?'<div class="compose-guide" style="margin-top:12px">A imagem é o próprio arquivo original do Craft. Proporção e transparência são preservadas.</div>':
      '<label for="compose-text" style="display:block;margin-top:13px">Texto original do Craft</label><textarea id="compose-text" class="field" rows="5">'+esc(raw(b))+'</textarea><button id="compose-save-text" class="btn small primary" '+(demo?'disabled':'')+'>Salvar texto no Craft</button>')+
    '<button class="btn small outline" style="width:100%;margin-top:12px" id="compose-remove">Remover desta lousa</button>'
    :'<p class="muted mini">Selecione uma peça no painel visual ou adicione abaixo.</p>')+
    '<div class="eyebrow" style="margin-top:19px">INSERIR CONTEÚDO EXISTENTE</div><div class="compose-library">'+palette()+'</div>'+
    '<div class="compose-guide">Remover uma peça da lousa <b>não apaga</b> o bloco original no Craft.</div></aside>';
 }
 function draw(){
   if(destroyed)return;
   const board=active();
   if(!board)return;
   const menu=canvas.boards.map((b,i)=>'<option value="'+i+'" '+(i===page?'selected':'')+'>'+esc('Prancha '+(i+1)+' · '+b.title)+'</option>').join('');
   root.innerHTML='<section class="compose-root">'+
    '<header class="compose-header"><div><div class="eyebrow">ATLAS VIVO · ESTÚDIO DE COMPOSIÇÃO ESPACIAL</div><h1>Monte o conhecimento visualmente.</h1><p class="muted mini">Mova, redimensione e combine peças reais de seus documentos Craft.</p></div><div class="compose-top-actions"><button id="compose-close" class="btn outline">← Voltar ao atlas</button><button id="compose-save" class="btn primary" '+(demo?'':'')+'>Salvar composição</button></div></header>'+
    '<section class="compose-rail"><div class="compose-tools"><select id="compose-page" class="field" style="width:auto;flex:1;margin:0;min-width:150px" aria-label="Escolher prancha">'+menu+'</select><button id="compose-new" class="btn small">+ Lousa</button><button id="compose-remove-board" class="btn small outline" '+(canvas.boards.length===1?'disabled':'')+'>Excluir lousa</button><select id="compose-skin" class="field" style="width:auto;margin:0"><option value="dark" '+(canvas.skin==='dark'?'selected':'')+'>Escuro</option><option value="light" '+(canvas.skin==='light'?'selected':'')+'>Claro</option><option value="paper" '+(canvas.skin==='paper'?'selected':'')+'>Papel</option></select></div>'+
    '<div class="compose-tools"><div class="compose-status" id="compose-status" data-status="'+esc(status)+'"><i class="compose-status-dot"></i><span class="compose-status-text">'+esc(statusText)+'</span></div><span style="flex:1"></span><button id="compose-fit" class="btn small">Ajustar</button><button id="compose-zoom-out" class="btn small" aria-label="Diminuir zoom">−</button><span id="compose-zoom-label" class="muted mini">100%</span><button id="compose-zoom-in" class="btn small" aria-label="Ampliar zoom">+</button></div>'+
    '<div class="compose-scroll" id="compose-scroll"><div class="compose-viewport" id="compose-viewport"><div class="compose-board is-editing" id="compose-board" data-skin="'+esc(canvas.skin)+'"><div class="board-orbit a"></div><div class="board-orbit b"></div><div class="compose-artboard-label">ATLAS VIVO · '+esc(board.title.toUpperCase().slice(0,70))+'</div>'+board.nodes.map(nodeMarkup).join('')+'<div class="board-footer">CRAFT × COLORHUB · COMPOSIÇÃO EDITORIAL</div></div></div></div><div class="compose-bottomnote">Lousa 1100 × 619 · proporção 16:9 · textos e imagens originados do Craft · alteração visual salva separadamente.</div></section>'+
    inspector()+'</section>';
   bind();
   resizeBoard();
 }
 function resizeBoard(){
   const viewport=root.querySelector('#compose-viewport'),board=root.querySelector('#compose-board'),scroll=root.querySelector('#compose-scroll');if(!viewport||!board)return;
   const width=scroll.clientWidth-22;
   const natural=Math.min(1,Math.max(.1,width/BOARD_W));
   scale=fit?natural:zoom;
   viewport.style.width=Math.round(BOARD_W*scale)+'px';viewport.style.height=Math.round(BOARD_H*scale)+'px';
   board.style.transform='scale('+scale+')';
   const lbl=root.querySelector('#compose-zoom-label');if(lbl)lbl.textContent=Math.round(scale*100)+'%';
 }
 function mutateNode(node,changes){
   const next=updateNode(node,changes);
   Object.assign(node,next);schedule();draw();
 }
 function add(source){
   const item=addNode(active(),source);if(!item){updateStatus('error','Não é possível adicionar mais elementos nesta prancha');return}
   selected=item.id;schedule();draw();
 }
 function nudge(dx,dy){const n=pick();if(n)mutateNode(n,{x:n.x+dx,y:n.y+dy})}
 function applySave(){saveNow()}
 function bindBoard(){
   root.querySelectorAll('[data-node]').forEach(item=>{
      item.onclick=()=>{const key=item.dataset.node;if(selected!==key){selected=key;draw()}};
      item.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=item.dataset.node;draw()}};
      item.addEventListener('pointerdown',e=>{
        if(e.button!==undefined&&e.button!==0)return;
        const key=item.dataset.node;
        const node=active().nodes.find(n=>n.id===key);if(!node)return;
        const resize=Boolean(e.target.closest('.compose-resize'));
        e.stopPropagation();e.preventDefault();
        selected=key;
        root.querySelectorAll('[data-node]').forEach(x=>x.classList.toggle('selected',x===item));
        const initial={x:node.x,y:node.y,w:node.w,h:node.h};
        const px=e.clientX,py=e.clientY;
        let dragged=false;
        item.setPointerCapture(e.pointerId);
        function move(ev){
          const dx=(ev.clientX-px)/scale,dy=(ev.clientY-py)/scale;
          if(Math.abs(dx)+Math.abs(dy)>4)dragged=true;
          if(resize){
            let dims=updateNode(initial,{w:initial.w+dx,h:initial.h+dy});
            item.style.width=dims.w+'px';item.style.height=dims.h+'px';
          }else{
            let dims=updateNode(initial,{x:initial.x+dx,y:initial.y+dy});
            item.style.left=dims.x+'px';item.style.top=dims.y+'px';
          }
        }
        function stop(ev){
          item.removeEventListener('pointermove',move);item.removeEventListener('pointerup',stop);item.removeEventListener('pointercancel',stop);
          if(dragged){
            const dx=(ev.clientX-px)/scale,dy=(ev.clientY-py)/scale;
            const dims=resize?{w:initial.w+dx,h:initial.h+dy}:{x:initial.x+dx,y:initial.y+dy};
            Object.assign(node,updateNode(node,dims));schedule();
          }
          draw();
        }
        item.addEventListener('pointermove',move);item.addEventListener('pointerup',stop);item.addEventListener('pointercancel',stop);
      });
   });
 }
 function bind(){
   const byId=id=>root.querySelector('#'+id);
   byId('compose-close').onclick=()=>{
     if(!demo&&mutation!==latestSaved){if(!confirm('Existem alterações ainda não confirmadas no Craft. Voltar mesmo assim?'))return}
     close();
   };
   byId('compose-save').onclick=applySave;
   byId('compose-page').onchange=e=>{page=Number(e.target.value);selected='';draw()};
   byId('compose-new').onclick=()=>{if(canvas.boards.length>=18){updateStatus('error','Limite de 18 lousas');return}
     canvas.boards.push({id:'board-custom-'+Date.now().toString(36),title:'Nova composição '+(canvas.boards.length+1),nodes:[]});page=canvas.boards.length-1;selected='';schedule();draw()};
   byId('compose-remove-board').onclick=()=>{if(canvas.boards.length<=1)return;if(!confirm('Excluir esta lousa? Os blocos do Craft serão preservados.'))return;canvas.boards.splice(page,1);page=Math.min(page,canvas.boards.length-1);selected='';schedule();draw()};
   byId('compose-skin').onchange=e=>{canvas.skin=e.target.value;schedule();draw()};
   byId('compose-fit').onclick=()=>{fit=true;resizeBoard()};
   byId('compose-zoom-in').onclick=()=>{fit=false;zoom=clampZoom(scale+.12);resizeBoard()};
   byId('compose-zoom-out').onclick=()=>{fit=false;zoom=clampZoom(scale-.12);resizeBoard()};
   const remove=byId('compose-remove');if(remove)remove.onclick=()=>{active().nodes=active().nodes.filter(n=>n.id!==selected);selected='';schedule();draw()};
   const style=byId('component-style');if(style)style.onchange=e=>{let n=pick();if(n)mutateNode(n,{design:e.target.value})};
   root.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
   root.querySelectorAll('[data-nudge]').forEach(b=>b.onclick=()=>{let [x,y]=b.dataset.nudge.split(',').map(Number);nudge(x,y)});
   root.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{let [dw,dh]=b.dataset.size.split(',').map(Number),n=pick();if(n)mutateNode(n,{w:n.w+dw,h:n.h+dh})});
   const saveTextBtn=byId('compose-save-text');if(saveTextBtn)saveTextBtn.onclick=async()=>{
     const n=pick(),b=n?source(n):null,text=byId('compose-text').value;
     if(!b||demo)return;
     if(!text.trim())return updateStatus('error','O bloco não pode ficar vazio');
     saveTextBtn.disabled=true;updateStatus('dirty','Gravando o texto original no Craft...');
     try{await saveText(b,text);b.markdown=text;updateStatus('ok','Conteúdo atualizado no Craft');draw()}
     catch(err){updateStatus('error','Não salvo: '+String(err.message||err))}
     finally{if(root.querySelector('#compose-save-text'))root.querySelector('#compose-save-text').disabled=false}
   };
   bindBoard();
 }
 function clampZoom(v){return Math.min(1.3,Math.max(.22,v))}
 function close(){
   if(destroyed)return;destroyed=true;clearTimeout(timer);window.removeEventListener('resize',resizeBoard);
   root.remove();onClose?.();
 }
 window.addEventListener('resize',resizeBoard);
 draw();
 return {close,save:saveNow,getCanvas:()=>canvas};
}


export function renderSpatialDocument(project,layoutConfig){
 const saved=Boolean(layoutConfig?.canvas?.boards?.length);
 const c=normalizeCanvas(project,layoutConfig?.canvas),available=sourceMap(project);
 const boards=c.boards.map((b,i)=>{
   const pieces=b.nodes.map(n=>{
     const block=available.get(String(n.source));if(!block)return '';
     const k=kind(block),design=k==='image'&&n.design==='standard'?'picture':n.design;
     return '<div class="compose-block" data-design="'+esc(design)+'" style="left:'+n.x+'px;top:'+n.y+'px;width:'+n.w+'px;height:'+n.h+'px"><div class="component-type">'+esc(typeName[k]||'CONCEITO')+'</div>'+nodeContent(block)+'</div>';
   }).join('');
   return '<section class="spatial-preview-section"><div class="spatial-preview-heading"><div><span class="eyebrow">LOUSA '+String(i+1).padStart(2,'0')+' · COMPOSIÇÃO 16:9</span><h2>'+esc(b.title)+'</h2></div><span class="chip">'+b.nodes.length+' elementos</span></div><div class="spatial-preview-frame"><div class="compose-board" data-skin="'+esc(c.skin)+'"><div class="board-orbit a"></div><div class="board-orbit b"></div><div class="compose-artboard-label">ATLAS VIVO · '+esc(b.title.toUpperCase().slice(0,70))+'</div>'+pieces+'<div class="board-footer">CRAFT × COLORHUB · COMPOSIÇÃO EDITORIAL</div></div></div></section>';
 }).join('');
 return '<div class="spatial-previews"><p class="muted mini">'+(saved?'Estas lousas utilizam o posicionamento gravado no Craft.':'Prévia automática: personalize e grave a distribuição no Canvas livre.')+'</p>'+boards+'</div>';
}
export function scaleSpatialPreviews(){
 document.querySelectorAll('.spatial-preview-frame').forEach(frame=>{
   const board=frame.querySelector('.compose-board');if(!board)return;
   const scale=Math.min(1,Math.max(.1,frame.clientWidth/BOARD_W));
   frame.style.height=Math.ceil(BOARD_H*scale)+'px';
   board.style.transform='scale('+scale+')';
 });
}
