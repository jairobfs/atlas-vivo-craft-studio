import {esc,safe,list,flat,title,id,raw,rich,image,level,kind,compile,clean,steps,sides,rows,demo} from './visual-core.js';
import {openVisualComposer,orderedVisualSections} from './visual-composer.js';
import {openSpatialComposer,renderSpatialDocument,scaleSpatialPreviews} from './spatial-composer.js';
import {renderImmersiveAtlas,bindImmersiveAtlas} from './immersive-atlas.js';
import {renderAdminConsole} from './admin-panel.js';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let S={auth:false,tab:'home',docs:[],doc:null,docId:'',project:null,filter:'',mode:'immersive',presentationIndex:0,theme:localStorage.getItem('atlas-theme')||'dark',demo:false,selected:'',draft:'',editorMode:'edit',review:0,answers:{},loading:false,layoutConfig:null,composer:null,spatial:null,settings:null};
const menu=[['home','Painel'],['library','Biblioteca'],['atlas','Atlas visual'],['studio','Estúdio'],['control','Meu ATLAS']];
async function API(op,args={},data){
 const u=new URL('/api/craft',location.href);u.searchParams.set('op',op);
 for(const [k,v] of Object.entries(args))u.searchParams.set(k,v);
 const resp=await fetch(u,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),credentials:'same-origin'});
 let val;try{val=await resp.json()}catch{val={}}if(!resp.ok)throw Error(typeof val.error==='string'?val.error:'Falha no Craft ('+resp.status+')');return val;
}
function inform(v){const el=$('#toast');el.textContent=String(v);el.classList.remove('hide');clearTimeout(inform.t);inform.t=setTimeout(()=>el.classList.add('hide'),3800)}
function navigate(p){S.tab=p;if(p==='atlas'&&!S.project&&S.auth){S.doc=demo();S.project=compile(S.doc);S.demo=true};updateNav();render();window.scrollTo(0,0)}
function updateNav(){for(const el of $$('.nav-target'))el.innerHTML=menu.map(([p,l])=>'<button data-nav="'+p+'" class="'+(S.tab===p?'active':'')+'">'+l+'</button>').join('');$$('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));$('#crumb').textContent='ATLAS VIVO / '+({home:'Painel',library:'Biblioteca',atlas:'Atlas Visual',studio:'Estúdio',control:'Meu ATLAS'}[S.tab]||S.tab)}
function documentCard(d){const key=id(d);return '<button class="tile" data-doc="'+esc(key)+'"><div class="eyebrow">DOCUMENTO NATIVO · CRAFT</div><h3>'+esc(title(d))+'</h3><p>Visualizar em pranchas, editar conteúdo e explorar conceitos</p><div class="footer-note">Abrir atlas →</div></button>'}
function bindCards(){$$('[data-doc]').forEach(b=>b.onclick=()=>openDoc(b.dataset.doc))}
function landing(){
 const cards=S.docs.slice(0,6);
 $('#screen').innerHTML='<div class="hero"><div class="eyebrow">ATLAS VIVO · COLORHUB × UNIVERSO</div><h1>'+esc(S.settings?.appTitle||'ATLAS VIVO')+'<br>Craft e ciência em uma experiência.</h1><p>'+esc(S.settings?.opening||'Pranchas científicas, comparações, imagens reais, diagramas e recuperação ativa.')+'</p><div class="actions"><button class="btn primary" id="browse">Abrir biblioteca →</button><button class="btn" id="example">Explorar exemplo visual</button><button class="btn" id="sync">Sincronizar Craft</button></div></div>'+
 '<div class="stats"><div class="panel"><div class="eyebrow">BIBLIOTECA CRAFT</div><div class="stat-value">'+S.docs.length+'</div><div class="muted mini">Notas consultáveis no seu espaço</div></div><div class="panel"><div class="eyebrow">PONTOS DE EDIÇÃO</div><div class="stat-value">2 vias</div><div class="muted mini">Craft ↔ interface visual</div></div></div><div class="section-top"><h2>Notas recentes</h2><button class="btn small" id="more">Ver todas</button></div>'+
 '<div class="grid">'+cards.map(documentCard).join('')+'</div>';
 $('#browse').onclick=$('#more').onclick=()=>navigate('library');$('#example').onclick=()=>{S.doc=demo();S.project=compile(S.doc);S.demo=true;S.layoutConfig=null;S.docId='';navigate('atlas')};$('#sync').onclick=sync;bindCards();
}
function library(){
 let docs=S.docs.filter(d=>title(d).toLowerCase().includes(S.filter.toLowerCase()));
 $('#screen').innerHTML='<div class="section-top"><div><div class="eyebrow">CONTEÚDO FONTE · CRAFT</div><h1>Biblioteca viva</h1></div><div class="actions"><button id="manage-library" class="btn small outline">Gerenciar biblioteca</button><button id="sync" class="btn">Sincronizar</button></div></div><input class="field" id="search" placeholder="Pesquise por título..." value="'+esc(S.filter)+'"><div class="mini muted" id="result-count">'+docs.length+' documentos · clique para construir a visualização</div><div id="cards" class="grid" style="margin-top:16px">'+docs.map(documentCard).join('')+'</div>';
 $('#manage-library').onclick=()=>navigate('control');
 $('#sync').onclick=sync;$('#search').oninput=e=>{S.filter=e.target.value;let v=S.docs.filter(d=>title(d).toLowerCase().includes(S.filter.toLowerCase()));$('#cards').innerHTML=v.map(documentCard).join('');$('#result-count').textContent=v.length+' documentos';bindCards()};bindCards();
}
function craftURL(){
 const x=S.doc?.data?.[0]||{},docs=S.docs||[];const current=docs.find(d=>id(d)===S.docId);
 if(typeof current?.clickableLink==='string'&&current.clickableLink.startsWith('craftdocs://'))return current.clickableLink;
 const sid=S.connection?.space?.id||S.connection?.data?.space?.id||S.connection?.spaceId;
 return sid&&S.docId?'craftdocs://open?spaceId='+encodeURIComponent(sid)+'&blockId='+encodeURIComponent(S.docId):'';
}
function crumb(b){const s=raw(b).replace(/^#{1,4}\s*/,'');return s.length>95?s.slice(0,95)+'…':s}
function textItem(item){
 const k=item.kind,b=item.block,m=raw(b);
 if(k==='heading')return '<h3>'+rich(m.replace(/^#{1,4}\s+/,''))+'</h3>';
 if(k==='image'){const u=image(b);const name=b.altText||b.alt||b.caption||'Imagem original do Craft';return u?'<figure class="figure featured"><img data-zoom="'+esc(u)+'" alt="'+esc(name)+'" loading="lazy" src="'+esc(u)+'"><figcaption>'+esc(name)+' · fonte: Craft</figcaption></figure>':'<div class="figure-missing">Imagem nativa sem endereço de visualização. Consulte o arquivo original no Craft.</div>'}
 if(k==='file'){const url=image(b);return url?'<a class="btn outline" target="_blank" rel="noopener" href="'+esc(url)+'">Abrir fonte no Craft ↗</a>':'<div class="notice">Arquivo incorporado ao Craft. Consulte o documento original.</div>'}
 if(k==='table'){const data=rows(b);if(!data.length)return '<div class="notice">Tabela de origem disponível no Craft.</div>';let header=data[0],rest=data.slice(1);return '<div class="table-wrap"><table><thead><tr>'+header.map(c=>'<th>'+rich(c)+'</th>').join('')+'</tr></thead><tbody>'+rest.map(row=>'<tr>'+row.map(c=>'<td>'+rich(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
 if(k==='callout'){const tone=/alerta|atenção|risco|segurança/i.test(m)?'danger':/tratamento|conduta|sucesso/i.test(m)?'success':'';
 return '<div class="callout '+tone+'">'+rich(clean(m.replace(/<\/?callout[^>]*>/g,'')))+'</div>'}
 if(k==='flow'){const parts=steps(m);return '<div class="flow-rail">'+parts.map((v,i)=>(i?'<div class="flow-arrow" aria-hidden="true">→</div>':'')+'<div class="flow-node"><strong>ETAPA '+String(i+1).padStart(2,'0')+'</strong><div>'+rich(v)+'</div></div>').join('')+'</div>'}
 if(k==='comparison'){const opts=sides(m);return '<div class="compare">'+opts.map((x,i)=>'<div class="compare-col"><div class="eyebrow">PERSPECTIVA '+(i+1)+'</div><h3>'+rich(x.split('—')[0])+'</h3><p>'+rich(x.includes('—')?x.slice(x.indexOf('—')+1).trim():x)+'</p></div>').join('')+'</div>'}
 if(k==='question')return '<div class="softpanel"><div class="eyebrow">REVISÃO ATIVA · PERGUNTA</div><h3>'+rich(clean(m))+'</h3></div>';
 if(k==='answer')return '<details class="softpanel"><summary style="cursor:pointer;font-weight:700;color:var(--aqua)">Revelar resposta comentada</summary><p style="margin:12px 0 0">'+rich(clean(m))+'</p></details>';
 if(k==='toggle')return '<details class="softpanel"><summary>'+rich(m.replace(/^\+\s/,''))+'</summary><p class="muted mini" style="margin-top:7px">Expanda os detalhes na nota ou nos blocos seguintes.</p></details>';
 if(k==='option')return '<div class="mini-card" style="margin:5px 0"><p>'+rich(m)+'</p></div>';
 if(k==='quote')return '<blockquote class="quote">'+rich(m.replace(/^>\s*/,''))+'</blockquote>';
 if(k==='missing')return '<div class="figure-missing"><strong>Figura referenciada, não incorporada.</strong><p>'+esc(m)+'</p><span class="mini">Este marcador original não contém imagem. Insira um arquivo real no Craft para que apareça aqui.</span></div>';
 if(k==='code')return '<pre>'+esc(m)+'</pre>';
 if(k==='task')return '<label class="check"><input type="checkbox" disabled '+(/^- \[[xX]\]/.test(m)?'checked':'')+'><span>'+rich(m.replace(/^- \[[xX ]\]\s*/,''))+'</span></label>';
 if(k==='bullet')return '<div class="editorial-copy"><p>• '+rich(m.replace(/^[-•]\s*/,''))+'</p></div>';
 if(k==='drawing')return '<div class="notice">Prancha vetorial ou whiteboard original: abra no Craft para explorar.</div>';
 // Split long source paragraphs into faithful sentence panels, without summarizing or inventing statements.
 if(m.length>440){
   const sentences=m.split(/(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/u).map(s=>s.trim()).filter(Boolean);
   if(sentences.length>=3 && sentences.length<=12){
     const tiles=sentences.map((s,i)=>'<div class="mini-card"><b>CONCEITO '+String(i+1).padStart(2,'0')+'</b><p>'+rich(s)+'</p></div>').join('');
     return '<div class="cards">'+tiles+'</div>';
   }
 }
 return '<div class="editorial-copy"><p>'+rich(m)+'</p></div>';
}
function groupRender(section,idx){
 const v=section.items;let html='';
 // Collect uninterrupted image blocks into real image galleries.
 for(let i=0;i<v.length;){
  if(v[i].kind==='image'){let images=[];while(i<v.length&&v[i].kind==='image')images.push(v[i++]);html+='<div class="figure-grid">'+images.map(textItem).join('')+'</div>';continue}
  html+=textItem(v[i]);i++;
 }
 return '<section class="prancha '+(section.display==='half'?'section-half':section.display==='feature'?'section-feature':'')+'" id="'+esc(section.key)+'"><div class="prancha-head"><span class="eyebrow">PRANCHA '+String(idx+1).padStart(2,'0')+' · '+(idx===0?'ABERTURA':'EVIDÊNCIA E MECANISMO')+'</span><span class="chip">'+v.length+' componentes</span></div><h2>'+rich(section.name)+'</h2>'+html+'</section>';
}
function atlas(){
 if(!S.project){$('#screen').innerHTML='<div class="empty">Selecione um documento para construir o atlas.</div>';return}
 const v={...S.project,sections:orderedVisualSections(S.project,S.layoutConfig)},demoFlag=S.demo;
 const u=craftURL();
 $('#screen').innerHTML='<div class="article"><div class="article-head"><div class="eyebrow">ATLAS VISUAL · COLORHUB × UNIVERSO</div><h1>'+esc(v.title)+'</h1><p class="outline-label">'+(demoFlag?'Exemplo autoral de apresentação. Abra uma nota para renderizar conteúdo verdadeiro.':'Composição editorial estruturada a partir dos blocos originais do Craft.')+'</p><div class="bar"><div class="pillset"><span class="chip">'+v.sections.length+' pranchas</span><span class="chip">'+v.figures+' imagens</span><span class="chip">'+v.tables+' tabelas</span>'+(v.missingFigures?.length?'<button class="btn small audit-figure" id="audit-figures">'+v.missingFigures.length+' figuras pendentes</button>':'')+'</div><div class="actions"><button class="btn small" id="refresh">Atualizar</button>'+(!demoFlag&&u?'<a class="btn small primary" href="'+esc(u)+'">Editar no Craft ↗</a>':'')+'</div></div><div class="actions" style="margin-top:13px"><button class="btn small '+(S.mode==='immersive'?'active':'')+'" id="immersive-mode">Experiência visual</button><button class="btn small '+(S.mode==='atlas'?'active':'')+'" id="atlas-mode">Leitura clássica</button><button class="btn small '+(S.mode==='map'?'active':'')+'" id="map-mode">Mapa mental</button><button class="btn small '+(S.mode==='presentation'?'active':'')+'" id="presentation-mode">Apresentar 16:9</button><button class="btn small '+(S.mode==='composed'?'active':'')+'" id="composed-mode">Lousas compostas</button>'+(S.settings?.editingEnabled===false&&!S.demo?'':'<button class="btn small" id="composer-open">Layouts rápidos</button><button class="btn small primary" id="canvas-open">Canvas livre · arrastar peças</button><button class="btn small" id="visual-edit">Editar textos</button>')+'<button class="btn small" id="print">Exportar PDF</button></div></div>'+
 (S.mode==='immersive'?renderImmersiveAtlas(v):S.mode==='map'?renderMap(v):S.mode==='presentation'?renderPresentation(v):S.mode==='composed'?renderSpatialDocument(S.project,S.layoutConfig):'<div class="article-toc">'+v.sections.map(s=>'<a href="#'+esc(s.key)+'">'+esc(s.name)+'</a>').join('')+'</div><div class="atlas-stack layout-'+esc(S.layoutConfig?.layout||'editorial')+' density-'+esc(S.layoutConfig?.density||'balanced')+'">'+v.sections.map(groupRender).join('')+'</div>')+
 '<div class="footer-note">Origem: Craft. Figuras originais preservadas. Este renderizador não substitui revisão científica das fontes.</div></div>';
 $('#refresh').onclick=()=>{if(S.demo){S.project=compile(demo());atlas()}else openDoc(S.docId)};
 $('#immersive-mode').onclick=()=>{S.mode='immersive';atlas()};
 $('#atlas-mode').onclick=()=>{S.mode='atlas';atlas()};$('#map-mode').onclick=()=>{S.mode='map';atlas()};$('#presentation-mode').onclick=()=>{S.mode='presentation';S.presentationIndex=0;atlas()};
 $('#composed-mode').onclick=()=>{S.mode='composed';atlas()};
 const composeButton=$('#composer-open');if(composeButton)composeButton.onclick=showComposer;
 const canvasButton=$('#canvas-open');if(canvasButton)canvasButton.onclick=showSpatialComposer;
 const audit=$('#audit-figures');if(audit)audit.onclick=showFigureAudit;
 const editButton=$('#visual-edit');if(editButton)editButton.onclick=()=>{S.editorMode='edit';navigate('studio')};$('#print').onclick=()=>window.print();
 $$('[data-zoom]').forEach(img=>img.onclick=()=>zoom(img.dataset.zoom,img.alt));
 if(S.mode==='composed')requestAnimationFrame(scaleSpatialPreviews);
 if(S.mode==='immersive')bindImmersiveAtlas($('#screen'));
 $$('[data-zoom]').forEach(img=>img.onclick=()=>zoom(img.dataset.zoom,img.alt));
 $$('[data-map-jump]').forEach(b=>b.onclick=e=>{e.preventDefault();S.mode='atlas';atlas();document.getElementById(b.dataset.mapJump)?.scrollIntoView({behavior:'smooth'})});
 const prev=$('#previous-slide'),next=$('#next-slide');if(prev)prev.onclick=()=>{S.presentationIndex=Math.max(0,S.presentationIndex-1);atlas()};if(next)next.onclick=()=>{S.presentationIndex=Math.min(S.project.sections.length-1,S.presentationIndex+1);atlas()};
}
function showFigureAudit(){
 const missing=S.project?.missingFigures||[];
 const root=document.createElement('div');root.className='figure-audit-modal';
 root.innerHTML='<div class="audit-panel"><div class="bar"><div><div class="eyebrow">ATLAS VIVO · AUDITORIA ICONOGRÁFICA</div><h2>Figuras ainda sem imagem</h2></div><button id="audit-close" class="btn">Fechar</button></div><p class="muted">São marcadores editoriais reais do Craft sem arquivo visual associado. Não serão apresentados como ilustrações científicas prontas.</p><div class="audit-list">'+missing.map((b,i)=>'<div class="audit-row"><strong>'+String(i+1).padStart(2,'0')+'</strong><span>'+esc(b.reference)+'</span><span class="chip">Imagem pendente</span></div>').join('')+'</div><div class="notice">Insira a imagem científica original, com fonte e legenda, no documento Craft. O Atlas Vivo a recuperará ao atualizar a nota.</div></div>';
 document.body.append(root);root.querySelector('#audit-close').onclick=()=>root.remove();
 root.onclick=e=>{if(e.target===root)root.remove()};
}
function showSpatialComposer(){
 if(!S.project)return inform('Abra um documento antes de compor');
 if(S.spatial?.close)S.spatial.close();
 S.spatial=openSpatialComposer({
   mount:'#screen',project:S.project,config:S.layoutConfig,demo:S.demo,
   save:async(config,previousUpdatedAt)=>{
     if(S.demo)return {config};
     if(!S.docId)throw Error('Abra uma nota real do Craft para salvar');
     return API('layout-save',{}, {documentId:S.docId,config,previousUpdatedAt});
   },
   saveText:async(block,text)=>{
     if(S.demo)throw Error('A demonstração não altera o Craft');
     return API('update',{}, {id:block.id,markdown:text,originalMarkdown:raw(block)});
   },
   onStored:(config)=>{S.layoutConfig=config},
   onClose:()=>{S.spatial=null;if(S.tab==='atlas')atlas()}
 });
}
function showComposer(){
 if(!S.project)return inform('Abra um atlas antes de compor sua apresentação');
 S.composer=openVisualComposer({
  project:S.project,config:S.layoutConfig,demo:S.demo,renderSection:groupRender,
  save:async(config)=>{
    if(S.demo)return{config};
    if(!S.docId)throw Error('Nenhum documento do Craft selecionado');
    return await API('layout-save',{}, {documentId:S.docId,config,previousUpdatedAt:S.layoutConfig?.updatedAt||null});
  },
  onStored:(config)=>{S.layoutConfig=config;inform(S.demo?'Prévia visual ajustada':'Composição armazenada no Craft')},
  onClose:()=>{S.composer=null;atlas()},
  onEditText:(source)=>{
    const sec=S.project.sections.find(s=>String(s.source||s.key)===String(source));
    const block=sec?.items?.find(x=>x.block?.type==='text'&&x.block?.id);
    S.selected=block?.block?.id||'';S.editorMode='edit';navigate('studio');
  }
 });
}
function renderPresentation(data){
 const n=Math.max(0,Math.min(S.presentationIndex,data.sections.length-1)),section=data.sections[n];
 if(!section)return '<div class="empty">Não há pranchas neste documento.</div>';
 return '<div class="presentation-stage"><div class="presentation-controls"><div><span class="eyebrow">MODO LOUSA · 16:9</span><span class="muted mini" style="margin-left:12px">Prancha '+(n+1)+' de '+data.sections.length+'</span></div><div class="actions"><button class="btn small" id="previous-slide" '+(n===0?'disabled':'')+'>← Anterior</button><button class="btn small primary" id="next-slide" '+(n===data.sections.length-1?'disabled':'')+'>Próxima →</button></div></div>'+groupRender(section,n)+'</div>';
}
function renderMap(data){
 if(!data.sections.length)return '<div class="empty">Organize a nota em títulos no Craft para obter seu mapa editorial.</div>';
 const center='<div class="map-hub"><span class="eyebrow">DOCUMENTO FONTE · CRAFT</span><h2>'+esc(data.title)+'</h2><p class="muted mini">'+data.sections.length+' módulos de conhecimento</p></div>';
 const leaves=data.sections.map((s,i)=>'<a class="map-leaf" href="#'+esc(s.key)+'" data-map-jump="'+esc(s.key)+'"><span class="eyebrow">MÓDULO '+String(i+1).padStart(2,'0')+'</span><strong>'+esc(s.name)+'</strong><span class="mini muted">'+s.items.length+' blocos documentais</span></a>').join('');
 return '<section class="prancha map-prancha"><div class="eyebrow">ARQUITETURA DO CONHECIMENTO</div><h2>Mapa editorial navegável</h2><p class="muted mini">A distribuição mostra módulos e hierarquia presentes na nota. Linhas não representam mecanismos causais.</p><div class="concept-web">'+center+'<div class="concept-leaves">'+leaves+'</div></div></section>';
}

function zoom(url,caption){let host=document.createElement('div');host.className='lightbox';host.innerHTML='<button aria-label="Fechar imagem">Fechar ×</button><img src="'+esc(url)+'" alt="'+esc(caption)+'"><figcaption>'+esc(caption)+'</figcaption>';document.body.append(host);host.onclick=()=>host.remove();document.addEventListener('keydown',function once(e){if(e.key==='Escape'){host.remove();document.removeEventListener('keydown',once)}})}
function studio(){
 if(S.settings?.editingEnabled===false&&!S.demo){$('#screen').innerHTML='<div class="hero"><div class="eyebrow">CONTROLE CRAFT</div><h1>Edição desativada nesta biblioteca.</h1><p>Abra a Central de Controle e altere o campo Permitir edição no ATLAS para sim.</p><button class="btn primary" id="go-control">Abrir Controle Craft</button></div>';$('#go-control').onclick=()=>navigate('control');return}
 if(S.demo){$('#screen').innerHTML='<div class="hero"><div class="eyebrow">EDITORIAL</div><h1>Abra um documento real do Craft.</h1><p>Na demonstração, a edição está bloqueada para não criar dados fictícios. Use sua biblioteca real para editar texto e criar pranchas.</p><button class="btn primary" id="choose">Abrir biblioteca</button></div>';$('#choose').onclick=()=>navigate('library');return}
 if(!S.project){$('#screen').innerHTML='<div class="hero"><div class="eyebrow">ESTÚDIO</div><h1>Edição visual, sem código.</h1><p>Abra um atlas real para editar suas seções e componentes.</p><button class="btn primary" id="choose">Escolher nota Craft</button></div>';$('#choose').onclick=()=>navigate('library');return}
 const blocks=S.project.body.filter(b=>b.type==='text'||b.type==='code');
 const options=blocks.map(b=>'<button class="editrow '+(S.selected===b.id?'active':'')+'" data-edit="'+esc(b.id)+'"><span>'+esc(kind(b).toUpperCase())+'</span>'+esc(raw(b).slice(0,125))+'</button>').join('');
 $('#screen').innerHTML='<div class="eyebrow">EDIÇÃO BIDIRECIONAL · CRAFT</div><h1>Estúdio editorial</h1><p class="muted">Edite blocos existentes, transforme um conceito em fluxo ou crie componentes visuais. As alterações são gravadas no documento original do Craft.</p><div class="toolbar"><button class="btn '+(S.editorMode==='edit'?'active':'')+'" id="tab-edit">Editar bloco</button><button class="btn '+(S.editorMode==='insert'?'active':'')+'" id="tab-insert">Criar prancha</button><button class="btn" id="back-atlas">Prévia do atlas</button></div>'+
 (S.editorMode==='edit'?'<div class="canvas"><div class="panel"><div class="eyebrow">BLOCOS DO DOCUMENTO</div><div class="editlist">'+options+'</div></div><div class="panel"><div class="eyebrow">EDIÇÃO SEM CÓDIGO</div><h3>Conteúdo selecionado</h3><textarea id="edit-text" class="field" rows="9" placeholder="Selecione um bloco"></textarea><label class="mini muted" for="format">Apresentação</label><select class="field" id="format"><option value="none">Texto / formato atual</option><option value="callout">Destaque editorial</option><option value="danger">Alerta científico</option><option value="flow">Fluxograma horizontal</option><option value="comparison">Comparação lado a lado</option><option value="question">Pergunta de recuperação ativa</option><option value="answer">Resposta oculta</option></select><div class="notice mini">Você altera o texto e escolhe a forma de apresentação. Ao salvar, a mesma informação permanece editável no Craft.</div><button class="btn primary" id="save">Salvar no Craft</button><div id="save-state" class="footer-note"></div></div></div>':
 '<div class="canvas"><div class="panel"><div class="eyebrow">MODELO DE PRANCHA</div><h3>Selecione a representação</h3><div class="pillset" id="templates"><button class="btn active" data-template="flow">Fluxograma</button><button class="btn" data-template="compare">Comparação</button><button class="btn" data-template="callout">Quadro clínico</button><button class="btn" data-template="question">Pergunta</button><button class="btn" data-template="text">Seção editorial</button></div><label for="new-name">Título</label><input id="new-name" class="field" value="Nova prancha visual"><label for="new-body">Conteúdo (edite como texto)</label><textarea id="new-body" class="field" rows="7"></textarea><p class="mini muted">Use uma seta → para separar etapas de um fluxo. Use | para comparar dois conceitos. Essas marcações são texto simples no Craft, não código.</p><button class="btn primary" id="create-visual">Inserir no Craft</button><p class="mini muted" id="create-state"></p></div><div class="panel"><div class="eyebrow">PRÉVIA DA ESTRUTURA</div><div id="template-preview"></div></div></div>')+
 '<div class="footer-note">Os arquivos de imagem devem ser inseridos como imagens nativas no Craft. O Studio recuperará sua URL e transparência sem recriá-los.</div>';
 $('#tab-edit').onclick=()=>{S.editorMode='edit';studio()};$('#tab-insert').onclick=()=>{S.editorMode='insert';studio()};$('#back-atlas').onclick=()=>{S.mode='atlas';navigate('atlas')};
 if(S.editorMode==='edit'){
  $$('[data-edit]').forEach(b=>b.onclick=()=>{S.selected=b.dataset.edit;studio()});
  const block=blocks.find(b=>b.id===S.selected)||blocks[0];if(block){S.selected=block.id;$('#edit-text').value=raw(block);const pre=kind(block);$('#format').value=['callout','flow','comparison','question','answer'].includes(pre)?pre:'none';}
  $('#save').onclick=async()=>{let b=$('#save'),rawText=$('#edit-text').value,form=$('#format').value;if(!S.selected){inform('Selecione um bloco');return}b.disabled=true;try{let cleanText=rawText.replace(/^(Fluxo|Comparação|Pergunta|Resposta|Alerta):\s*/i,'');let value=form==='flow'?'Fluxo: '+cleanText:form==='comparison'?'Comparação: '+cleanText:form==='question'?'Pergunta: '+cleanText:form==='answer'?'Resposta: '+cleanText:form==='danger'?'Alerta: '+cleanText:form==='callout'?'<callout>'+cleanText+'</callout>':rawText;await API('update',{}, {id:S.selected,markdown:value,originalMarkdown:raw(block)});$('#save-state').textContent='Salvo no Craft. Atualizando a prévia...';await openDoc(S.docId);inform('Bloco salvo diretamente no Craft')}catch(e){$('#save-state').textContent=e.message}finally{b.disabled=false}};
 } else {
  const examples={flow:'Avaliação clínica → Dados decisivos → Exames pertinentes → Decisão fundamentada',compare:'Critério A — definição ou interpretação | Critério B — definição ou interpretação',callout:'Identifique a evidência principal e sua implicação clínica.',question:'Qual achado muda a interpretação do caso?',text:'Explique a anatomia, o mecanismo ou a classificação.'};
  let current='flow';
  function preview(){const name=$('#new-name').value||'Nova prancha';const body=$('#new-body').value;$('#template-preview').innerHTML='<div class="prancha"><div class="eyebrow">COMPOSIÇÃO EDITORIAL</div><h2>'+esc(name)+'</h2>'+textItem({kind:current==='compare'?'comparison':current==='callout'?'callout':current==='text'?'text':current==='question'?'question':'flow',block:{markdown:(current==='flow'?'Fluxo: ':current==='compare'?'Comparação: ':current==='question'?'Pergunta: ':'')+body}})+'</div>'}
  $('#new-body').value=examples[current];$$('[data-template]').forEach(b=>b.onclick=()=>{current=b.dataset.template;$$('[data-template]').forEach(x=>x.classList.toggle('active',x===b));$('#new-body').value=examples[current];preview()});$('#new-name').oninput=preview;$('#new-body').oninput=preview;preview();
  $('#create-visual').onclick=async()=>{let b=$('#create-visual');b.disabled=true;try{let data=$('#new-body').value.trim(),name=$('#new-name').value.trim();if(!name||!data)throw Error('Preencha título e conteúdo');let v=current==='flow'?'Fluxo: '+data:current==='compare'?'Comparação: '+data:current==='question'?'Pergunta: '+data:current==='callout'?'<callout>'+data+'</callout>':data;await API('visual',{}, {documentId:S.docId,blocks:[{markdown:'## '+name},{markdown:v}]});await openDoc(S.docId);inform('Nova prancha criada no Craft')}catch(e){$('#create-state').textContent=e.message}finally{b.disabled=false}};
 }
}
function controlPanel(){
 if(S.demo){
  $('#screen').innerHTML='<div class="hero"><div class="eyebrow">ADMINISTRAÇÃO</div><h1>Entre para gerenciar o seu ATLAS.</h1><p>A demonstração pública não permite alterar as configurações do Craft.</p><button class="btn primary" id="back-demo">Voltar ao atlas</button></div>';
  $('#back-demo').onclick=()=>navigate('atlas');return;
 }
 $('#screen').innerHTML='<div class="panel"><div class="eyebrow">MEU ATLAS</div><h2>Carregando controles do Craft…</h2></div>';
 renderAdminConsole({
   host:$('#screen'),api:API,settings:S.settings,
   onSaved:async settings=>{
     S.settings=settings;applyControlOptions();
     try{const d=await API('documents');S.docs=list(d)}catch(e){inform('Ajustes salvos; biblioteca temporariamente indisponível: '+e.message)}
   },
   onCreated:async()=>{
     try{const d=await API('documents');S.docs=list(d)}catch{}
   },
   onExit:()=>navigate('library')
 }).catch(e=>{
   $('#screen').innerHTML='<div class="panel"><div class="eyebrow">ADMINISTRAÇÃO</div><h2>Não foi possível abrir o painel.</h2><p class="muted">'+esc(e.message)+'</p><button class="btn" id="admin-try">Tentar novamente</button></div>';
   $('#admin-try').onclick=controlPanel;
 });
}

function login(){
 $('#screen').innerHTML='<div class="login"><div class="eyebrow">ATLAS VIVO · ACESSO PRIVADO</div><h1>Estudo visual conectado ao Craft.</h1><p class="muted">Conexão e credenciais permanecem no servidor. A biblioteca só é carregada depois do login.</p><div class="panel"><label for="key">Código de acesso</label><input id="key" type="password" class="field" autocomplete="current-password" placeholder="Digite o código privado"><button class="btn primary" id="enter" style="width:100%">Entrar no Studio</button><button class="btn outline" id="preview" style="width:100%;margin-top:10px">Conhecer atlas visual de demonstração</button><div id="err" class="mini muted"></div></div></div>';
 $('#preview').onclick=()=>{S.demo=true;S.auth=true;S.docs=[];S.doc=demo();S.docId='';S.project=compile(S.doc);S.mode='immersive';navigate('atlas')};
 $('#enter').onclick=async()=>{let b=$('#enter');b.disabled=true;try{await API('login',{}, {password:$('#key').value});S.auth=true;await sync();navigate(S.settings?.home||'home')}catch(e){$('#err').textContent=e.message}finally{b.disabled=false}};$('#key').onkeydown=e=>{if(e.key==='Enter')$('#enter').click()};
}
function render(){$('#logout').classList.toggle('hide',!S.auth);if(!S.auth)return login();if(S.tab==='home')landing();else if(S.tab==='library')library();else if(S.tab==='atlas')atlas();else if(S.tab==='control')controlPanel();else studio()}
function applyControlOptions(){
 const conf=S.settings;if(!conf)return;
 document.body.classList.toggle('light',conf.theme==='light');
 document.body.classList.remove('atlas-density-compact','atlas-density-balanced','atlas-density-spacious');
 document.body.classList.add('atlas-density-'+(conf.density||'balanced'));
 const tagline=document.querySelector('.tagline');if(tagline)tagline.textContent=conf.subtitle||'ColorHub × Craft Studio';
 document.title=(conf.appTitle||'ATLAS VIVO')+' · Craft Studio';
}
async function sync(){
 if(S.loading)return;
 S.loading=true;
 try{
   const [d,conn,control]=await Promise.allSettled([API('documents'),API('connection'),API('control')]);
   if(d.status!=='fulfilled')throw d.reason;
   S.docs=list(d.value);
   if(conn.status==='fulfilled')S.connection=conn.value;
   if(control.status==='fulfilled'){S.settings=control.value;applyControlOptions()}
   else inform('Biblioteca carregada; controles do Craft indisponíveis temporariamente');
   render();inform(S.docs.length+' documentos na biblioteca selecionada');
 }catch(e){inform('Craft: '+e.message)}
 finally{S.loading=false}
}
async function openDoc(documentId,preserveMode=false){if(!documentId)return;const previous=S.mode;try{const d=await API('document',{id:documentId});S.doc=d;S.docId=documentId;S.project=compile(d);S.demo=false;S.mode=preserveMode?previous:(S.settings?.view||'immersive');try{const layout=await API('layout',{documentId});S.layoutConfig=layout.config||null}catch(err){S.layoutConfig=null;console.warn('Layout unavailable',String(err.message||err))}navigate('atlas')}catch(e){inform('Falha ao abrir documento: '+e.message)}}
$('#theme').onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('atlas-theme',document.body.classList.contains('light')?'light':'dark')};
if(S.theme==='light')document.body.classList.add('light');
$('#logout').onclick=async()=>{if(!S.demo){try{await API('logout')}catch{}}S.demo=false;S.auth=false;S.doc=null;S.project=null;S.docs=[];navigate('home')};

let lastAutoRefresh=0;
function refreshOnReturn(){
 if(!S.auth||S.demo||S.settings?.autoRefresh===false||S.tab!=='atlas'||!S.docId)return;
 const now=Date.now();
 if(now-lastAutoRefresh<15000)return;
 lastAutoRefresh=now;
 openDoc(S.docId,true);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshOnReturn()});
window.addEventListener('focus',refreshOnReturn);
updateNav();(async()=>{if(new URLSearchParams(location.search).get('demo')==='1'){S.auth=true;S.demo=true;S.docs=[];S.doc=demo();S.docId='';S.project=compile(S.doc);S.mode='immersive';navigate('atlas');return}try{const st=await API('status');S.auth=!!st.authenticated;if(S.auth){await sync();S.tab=S.settings?.home||'home';updateNav()}render()}catch{render()}})();

window.addEventListener('resize',scaleSpatialPreviews);
