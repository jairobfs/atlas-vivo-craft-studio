import {esc,rich,safe,title,raw,kind,image,rows,clean,steps,sides} from './visual-core.js';
const node=(label,i)=>'<div class="flow-node"><strong>ETAPA '+String(i+1).padStart(2,'0')+'</strong><div>'+rich(label)+'</div></div>';
function tableHTML(b){let data=rows(b).slice(0,80);if(!data.length)return '';return '<div class="table-wrap"><table><thead><tr>'+data[0].map(c=>'<th>'+rich(c)+'</th>').join('')+'</tr></thead><tbody>'+data.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+rich(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function figures(b){let url=image(b),alt=b.altText||b.alt||title(b);return url?'<figure class="figure featured"><img loading="lazy" data-zoom="'+esc(url)+'" src="'+esc(url)+'" alt="'+esc(alt)+'"><figcaption>'+rich(alt)+'</figcaption></figure>':'<div class="figure-missing">O Craft contém uma figura, mas seu endereço não está disponível neste bloco. Abra o original para preservá-la.</div>'}
export function viewItem(item,mode='atlas'){
 const b=item.block,k=item.kind,m=raw(b),val=clean(m);
 if(k==='heading')return '<h3>'+rich(title(b))+'</h3>';
 if(k==='image')return figures(b);
 if(k==='missing')return '<div class="figure-missing"><strong>Figura ainda não vinculada</strong><p>'+esc(m)+'</p><p class="mini">Esta indicação no texto não é uma imagem. Insira uma imagem verdadeira na nota Craft ou vincule o arquivo original.</p></div>';
 if(k==='table')return tableHTML(b);
 if(k==='file'){let u=safe(b.url||b.assetUrl);return '<div class="notice"><strong>Arquivo de referência</strong> '+(u?'<a target="_blank" rel="noopener" href="'+esc(u)+'">Abrir documento</a>':'Disponível na nota original')+'</div>'}
 if(k==='drawing')return '<div class="notice">Whiteboard/desenho nativo do Craft: preserve e visualize diretamente no Craft. O renderizador não substitui seu conteúdo.</div>';
 if(k==='code')return '<pre>'+esc(m)+'</pre>';
 if(k==='quote')return '<blockquote class="quote">'+rich(m.replace(/^>\s*/,''))+'</blockquote>';
 if(k==='callout'){let c=/alerta|segurança|atenção|risco|sepse/i.test(m)?'danger':/tratamento|conduta|adequada/i.test(m)?'success':'amber';return '<div class="callout '+c+'">'+rich(m.replace(/<\/?callout>/g,'').replace(/^(alerta|atenção|destaque|pérola|síntese|segurança):\s*/i,''))+'</div>'}
 if(k==='flow')return '<div class="flow-rail">'+steps(m).map((s,i)=>(i?'<div class="flow-arrow" aria-hidden="true">→</div>':'')+node(s,i)).join('')+'</div>';
 if(k==='comparison'){let parts=sides(m);return '<div class="compare">'+parts.map((x,i)=>'<div class="compare-col"><div class="eyebrow">'+(i?'ALTERNATIVA · B':'ALTERNATIVA · A')+'</div><h3>'+rich(x.split(' — ')[0])+'</h3><p>'+rich(x.split(' — ').slice(1).join(' — ')||x)+'</p></div>').join('')+'</div>'}
 if(k==='question')return '<div class="softpanel"><div class="eyebrow">RECUPERAÇÃO ATIVA</div><h3>'+rich(val)+'</h3><button class="btn small" data-answer-reveal>Revelar resposta</button></div>';
 if(k==='answer')return '<div class="answer" data-answer hidden><strong>Resposta comentada</strong><div>'+rich(val)+'</div></div>';
 if(k==='option')return '<button class="quiz-option" data-option>'+rich(m)+'</button>';
 if(k==='toggle')return '<details class="softpanel"><summary>'+rich(m.replace(/^\+\s*/,''))+'</summary><div class="mini muted">Abra a nota Craft para consultar os níveis aninhados e as respostas.</div></details>';
 if(k==='task')return '<label class="check"><input type="checkbox" '+(/^\-\s\[[xX]\]/.test(m)?'checked':'')+'><span>'+rich(m.replace(/^\-\s\[[ xX]\]\s*/,''))+'</span></label>';
 if(k==='bullet')return '<div class="editorial-copy"><p>• '+rich(m.replace(/^\-\s*/,''))+'</p></div>';
 let prose=rich(m);
 if(mode==='source')return '<div class="editorial-copy"><p>'+prose+'</p></div>';
 return '<div class="editorial-copy"><p>'+prose+'</p></div>';
}
export function renderSections(data,mode='atlas'){
 let j=0,html='';
 for(const sec of data.sections){
  if(!sec.items.length)continue;
  const heading=sec.key==='intro'?'INTRODUÇÃO':'SEÇÃO '+String(++j).padStart(2,'0');
  if(mode==='source'){html+='<section class="prancha" id="'+esc(sec.key)+'"><div class="eyebrow">'+heading+'</div><h2>'+rich(sec.name)+'</h2>'+sec.items.map(it=>'<div class="block-actions" style="margin-bottom:12px"><span class="mini muted">'+esc(it.kind)+'</span></div>'+viewItem(it,mode)).join('')+'</section>';continue}
  // Scientific editorial composition: types grouped into visual plates, not generic paragraph rows.
  let buckets=[],pending=[];
  const flush=()=>{if(!pending.length)return;buckets.push({kind:'prose',items:pending});pending=[]};
  for(const it of sec.items){
   if(['text','bullet','quote','heading','task'].includes(it.kind)){pending.push(it);continue}
   flush();
   if(it.kind==='image'&&buckets.length&&buckets[buckets.length-1].kind==='images')buckets[buckets.length-1].items.push(it);
   else buckets.push({kind:it.kind==='image'?'images':it.kind,items:[it]});
  }flush();
  html+='<section class="prancha" id="'+esc(sec.key)+'"><div class="prancha-head"><span class="eyebrow">'+heading+'</span><span class="chip">'+sec.items.length+' elementos</span></div><h2>'+rich(sec.name)+'</h2>';
  for(const g of buckets){
   if(g.kind==='images'){html+='<div class="figure-grid">'+g.items.map(it=>viewItem(it,mode)).join('')+'</div>';continue}
   if(g.kind==='prose'){html+='<div class="editorial-copy">'+g.items.map(it=>viewItem(it,mode)).join('')+'</div>';continue}
   html+='<div class="plate-part" style="margin:15px 0">'+g.items.map(it=>viewItem(it,mode)).join('')+'</div>';
  }
  html+='</section>';
 }
 return html||'<div class="empty">A nota não contém blocos de texto ou imagem acessíveis.</div>';
}
export function renderMap(data){
 let parts=data.sections.filter(s=>s.items.length);
 return '<section class="prancha"><div class="eyebrow">MAPA CONCEITUAL · ESTRUTURA REAL</div><h2>'+rich(data.title)+'</h2><p class="muted">Este mapa é extraído das seções existentes no documento, não representa um diagrama médico validado.</p><div class="flow-rail">'+parts.map((s,i)=>(i?'<div class="flow-arrow">→</div>':'')+node(s.name,i)).join('')+'</div></section>'+parts.map((s,i)=>'<section class="prancha"><div class="eyebrow">NÓ '+String(i+1).padStart(2,'0')+'</div><h3>'+rich(s.name)+'</h3><div class="cards">'+s.items.slice(0,6).map(it=>'<div class="mini-card"><b>'+esc(it.kind.toUpperCase())+'</b><p>'+rich(clean(raw(it.block)).slice(0,225))+'</p></div>').join('')+'</div></section>').join('');
}
export function bindVisualEvents(root=document){
 root.querySelectorAll('[data-zoom]').forEach(img=>img.addEventListener('click',()=>{let url=safe(img.getAttribute('data-zoom'));if(!url)return;const box=document.createElement('div');box.className='lightbox';const pic=document.createElement('img');pic.src=url;pic.alt=img.alt||'Imagem ampliada';const close=document.createElement('button');close.textContent='Fechar ×';close.addEventListener('click',()=>box.remove());box.addEventListener('click',e=>{if(e.target===box)box.remove()});box.append(pic,close);document.body.append(box)}));
 root.querySelectorAll('[data-answer-reveal]').forEach(btn=>btn.addEventListener('click',()=>{let next=btn.parentElement.nextElementSibling;if(next?.matches('[data-answer]')){next.hidden=!next.hidden;btn.textContent=next.hidden?'Revelar resposta':'Ocultar resposta'}else btn.textContent='Resposta disponível na nota original'}));
 root.querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>{btn.parentElement.querySelectorAll('[data-option]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected')}));
}
