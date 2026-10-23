import {image} from './visual-core.js';
function renderImmersiveAtlas(project){
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const txt=x=>String(x??'').trim();
 const clean=x=>txt(x).replace(/^#{1,4}\s*/,'').replace(/<\/?callout[^>]*>/g,'').replace(/^(Fluxo|Comparação|Pergunta|Resposta|Alerta):\s*/i,'');
 const all=project?.sections?.flatMap(s=>s.items||[])||[];
 if(!project?.sections?.length)return '<div class="empty">Crie títulos no Craft para organizar seu atlas visual.</div>';
 const getText=it=>txt(it?.block?.markdown??it?.block?.text?.value);
 const first=all.find(x=>x.kind==='text');
 const lead=first?getText(first).split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ])/u)[0].slice(0,280):'Percorra o conteúdo científico organizado a partir das suas notas.';
 const figure=all.find(x=>x.kind==='image'&&image(x.block));
 function crystalSvg(isUr){
   const type=isUr?'u':'p',base=isUr?'#eddd77':'#7dc2db';
   const elements=isUr?'<g stroke="#eddd77" stroke-width="2.7" stroke-linecap="round"><path d="M55 140L190 49 M87 42L202 163 M54 90L211 82 M120 175L152 23 M65 178L200 50 M55 48L170 161 M195 160L192 42"/><path stroke="#fff6aa" stroke-width="1" d="M55 140L190 49 M87 42L202 163"/></g>':'<g stroke="#82c9e5" stroke-width="2.6" fill="#4389b2" fill-opacity=".4"><polygon points="62,54 113,40 137,78 83,92"/><polygon points="140,109 193,95 213,131 163,144"/><polygon points="73,141 131,128 148,158 96,175"/><polygon points="161,23 189,17 199,41 167,51"/><polygon points="47,106 71,96 86,117 60,133"/></g>';
   return '<svg viewBox="0 0 260 206" role="img" aria-label="'+(isUr?'Esquema de agulhas de urato':'Esquema de cristais romboides de CPPD')+'"><defs><radialGradient id="va-grad-'+type+'"><stop stop-color="#223768"/><stop offset="1" stop-color="#090c20"/></radialGradient></defs><circle cx="130" cy="103" r="96" fill="url(#va-grad-'+type+')" stroke="#7fa5c144"/>'+elements+'<circle cx="130" cy="103" r="87" fill="none" stroke="#7fa5c122" stroke-dasharray="4 7"/></svg>';
 }
 function steps(s){return clean(s).split(/[→➜⟶]/).map(x=>x.trim()).filter(Boolean).slice(0,9)}
 function flow(s){
  const nodes=steps(s);if(nodes.length<2)return '';
  return '<div class="va-flow"><div class="va-overline">PROCESSO · ETAPAS DA NOTA</div><div class="va-flow-list">'+nodes.map((x,i)=>'<div class="va-flow-step"><div class="va-flow-index">'+String(i+1).padStart(2,'0')+'</div><strong>'+esc(x)+'</strong></div>').join('')+'</div><div class="va-caption">Sequência estruturada a partir do texto original do Craft; não substitui o raciocínio clínico.</div></div>';
 }
 function comp(item){
  const v=clean(getText(item)).split(/\s+\|\s+/).slice(0,2),special=/urato|cppd|pirofosfato/i.test(v.join(' '));
  if(v.length!==2)return '';
  return '<div class="va-specimens">'+v.map((a,i)=>{
   const sep=a.indexOf('—'),name=sep>-1?a.slice(0,sep).trim():i?'Critério B':'Critério A',body=sep>-1?a.slice(sep+1).trim():a;
   return '<div class="va-specimen"><div class="va-overline">ESPECÍME '+(i?'B':'A')+'</div>'+(special?'<div class="va-specimen-figure">'+crystalSvg(!i)+'</div>':'<div class="va-glyph">'+(i?'II':'I')+'</div>')+'<h3>'+esc(name)+'</h3><p>'+esc(body)+'</p></div>'
  }).join('')+'</div>'+(special?'<div class="va-caption">Ilustrações esquemáticas da morfologia cristalina, não fotomicrografias diagnósticas.</div>':'');
 }
 function table(item){
  const b=item.block,r=Array.isArray(b.rows)?b.rows.map(row=>(Array.isArray(row)?row:row?.cells||[]).map(cell=>String(cell?.value??cell?.markdown??cell??''))):getText(item).split(/\r?\n/).filter(s=>s.trim().startsWith('|')&&!/^\|[\s:|-]+\|?$/.test(s)).map(s=>s.replace(/^\||\|$/g,'').split('|').map(x=>x.trim()));
  if(!r.length)return '';
  return '<div class="va-table"><div class="va-tr va-head">'+r[0].map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'+r.slice(1).map(row=>'<div class="va-tr"><strong>'+esc(row[0]||'')+'</strong><span>'+esc(row[1]||'')+'</span></div>').join('')+'</div>';
 }
 function realImage(item){
  const u=image(item.block);if(!u)return '';
  const label=item.block.altText||item.block.caption||'Imagem científica do Craft';
  return '<figure class="va-real"><img src="'+esc(u)+'" data-zoom="'+esc(u)+'" loading="lazy" alt="'+esc(label)+'"><figcaption><b>FIGURA ORIGINAL · CRAFT</b><span>'+esc(label)+'</span></figcaption></figure>';
 }
 function section(sec,index){
  const its=sec.items||[],q=its.find(x=>x.kind==='question'),ans=its.find(x=>x.kind==='answer'),compare=its.find(x=>x.kind==='comparison'),process=its.find(x=>x.kind==='flow'),callout=its.find(x=>x.kind==='callout'),tbl=its.find(x=>x.kind==='table'),pictures=its.filter(x=>x.kind==='image'),prose=its.filter(x=>x.kind==='text').map(getText).filter(x=>x.length>30),citation=prose.find(x=>/fonte|licen[çc]a|autor/i.test(x));
  let contents='';
  if(q){
   contents='<div class="va-quiz"><div class="va-quiz-symbol">?</div><h3>'+esc(clean(getText(q)))+'</h3><details><summary>Revelar explicação <span>↗</span></summary><p>'+esc(ans?clean(getText(ans)):'Consulte o documento original.')+'</p></details></div>';
  }else if(compare){
   contents=comp(compare)+(tbl?'<div class="va-table-space"><div class="va-overline">INTERPRETAÇÃO EVIDENCIAL</div>'+table(tbl)+'</div>':'');
   if(pictures.length)contents+='<div class="va-photo-gallery">'+pictures.map(realImage).join('')+'</div>';
   if(citation)contents+='<div class="va-caption">'+esc(citation)+'</div>';
  }else if(pictures.length){
   contents='<div class="va-photo-gallery">'+pictures.map(realImage).join('')+'</div>';
   if(citation)contents+='<div class="va-caption">'+esc(citation)+'</div>';
  }else{
   contents='<div class="va-text-ledger">'+prose.slice(0,3).map((s,i)=>'<div class="va-ledger-item"><span>'+String(i+1).padStart(2,'0')+'</span><p>'+esc(s)+'</p></div>').join('')+'</div>';
   if(process)contents+=flow(getText(process));
   if(callout)contents+='<div class="va-safety"><span class="va-safety-mark">!</span><div><b>PONTO DE ATENÇÃO</b><p>'+esc(clean(getText(callout)))+'</p></div></div>';
  }
  return '<section class="va-section" id="'+esc(sec.key)+'"><header><div class="va-section-kicker">CAPÍTULO '+String(index+1).padStart(2,'0')+' / '+(q?'RECUPERAÇÃO ATIVA':compare?'COMPARAÇÃO VISUAL':pictures.length?'ICONOGRAFIA REAL':'MECANISMO E CONTEXTO')+'</div><h2>'+esc(sec.name)+'</h2></header>'+contents+'</section>';
 }
 const uri=figure?image(figure.block):'';
 const visual=uri?'<div class="va-cover-photo"><img src="'+esc(uri)+'" data-zoom="'+esc(uri)+'" alt="'+esc(figure.block.altText||'Microscopia científica original')+'"><span>FIGURA CIENTÍFICA DO CRAFT</span></div>':'<div class="va-cover-schematics">'+crystalSvg(true)+crystalSvg(false)+'<span>DIAGRAMAS ESQUEMÁTICOS</span></div>';
 const intro='<section class="va-cover"><div class="va-cover-copy"><div class="va-edition">ATLAS VIVO <span>∞</span> <i>MEDICINA / VISUAL EXPERIENCE</i></div><h1>'+esc(project.title)+'</h1><p>'+esc(lead)+'</p><div class="va-highlights"><span>'+project.sections.length+' capítulos</span><span>'+project.figures+' imagens</span><span>Craft · Fonte original</span></div><a class="va-start" href="#'+esc(project.sections[0].key)+'">Explorar atlas <b>↘</b></a></div><div class="va-cover-image"><div class="va-photo-heading"><span>ESTUDO ANATÔMICO E CLÍNICO</span><span>01 / IMAGEM</span></div>'+visual+'<div class="va-photo-footer"><span>EVIDÊNCIA + INTERPRETAÇÃO</span><span>COLORHUB × UNIVERSO</span></div></div></section>';
 const nav=project.sections.map((s,i)=>'<a href="#'+esc(s.key)+'" data-rail="'+esc(s.key)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(s.name)+'</a>').join('');
 return '<div class="va-experience"><div class="va-topline"><span>ATLAS VIVO</span><span>EXPERIÊNCIA CIENTÍFICA</span><span>FONTE: CRAFT</span></div>'+intro+'<div class="va-content"><aside class="va-chapter-nav"><div class="va-nav-inner"><div class="va-overline">PERCURSO DE ESTUDO</div><nav>'+nav+'</nav><div class="va-reading-meter"><i></i></div></div></aside><div class="va-story">'+project.sections.map(section).join('')+'<footer class="va-epilogue"><strong>ATLAS VIVO · MED</strong><span>Figuras reais identificadas; esquemas ilustrativos separados da evidência científica original.</span></footer></div></div></div>';
}
function bindImmersiveAtlas(host){
 const container=host.querySelector('.va-experience');if(!container)return;
 const links=[...container.querySelectorAll('[data-rail]')];
 links.forEach(link=>link.onclick=()=>links.forEach(a=>a.classList.toggle('on',a===link)));
 const sections=[...container.querySelectorAll('.va-section')];
 const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{let item=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(item)links.forEach(x=>x.classList.toggle('on',x.dataset.rail===item.target.id))},{rootMargin:'-15% 0px -50% 0px',threshold:[0,.1,.4]}):null;
 sections.forEach(s=>observer?.observe(s));
 const bar=container.querySelector('.va-reading-meter i');
 const update=()=>{if(!document.contains(container)){window.removeEventListener('scroll',update);observer?.disconnect();return}const b=container.getBoundingClientRect(),dist=b.height-innerHeight;bar.style.height=(Math.min(1,Math.max(0,dist>0?-b.top/dist:1))*100)+'%'};
 window.addEventListener('scroll',update,{passive:true});update();
}
export {renderImmersiveAtlas,bindImmersiveAtlas};
