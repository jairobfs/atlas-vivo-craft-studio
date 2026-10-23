/* Live Craft reader: all upstream calls happen on the site's server. */
(() => {
  'use strict';
  const root=document.getElementById('craft-reader-content');
  const status=document.getElementById('craft-reader-state');
  const refresh=document.getElementById('craft-refresh');
  const open=document.getElementById('craft-read-now');
  const form=document.getElementById('craft-annotation-form');
  const noteField=document.getElementById('craft-annotation-text');
  const save=document.getElementById('craft-save');
  const writeStatus=document.getElementById('craft-write-state');
  const title=document.getElementById('craft-reader-title');
  const description=document.getElementById('craft-reader-description');
  const contextLabel=document.getElementById('craft-context-label');
  const terms=document.getElementById('craft-context-terms');
  const contextDetail=document.getElementById('craft-context-detail');
  if(!root||!status||!refresh||!open)return;
  // This GitHub branch is intentionally public. Private Craft API endpoints
  // are disabled server-side; do not display controls that would only fail.
  const PUBLIC_EDITION = true;
  if (PUBLIC_EDITION) {
    const craftUrl='craftdocs://open?spaceId=8b335448-6499-3d04-91c1-5f99c399aca8&blockId=7600209f-ac0e-25cc-79b4-71e9b211b32d';
    status.textContent='Craft externo · privacidade preservada';
    title.textContent='Acervo original no Craft';
    description.textContent='Os capítulos, casos e modelos funcionam neste Atlas. Notas privadas e edição permanecem no aplicativo Craft.';
    root.innerHTML='<div class="craft-error"><b>Edição pública independente</b><p>Para manter suas notas privadas protegidas, a leitura e a gravação direta no Craft estão desabilitadas neste endereço.</p><p><a href="'+craftUrl+'">Abrir acervo original no Craft ↗</a></p></div>';
    refresh.hidden=true;refresh.disabled=true;refresh.style.display='none';
    open.hidden=true;open.disabled=true;open.style.display='none';
    form.hidden=true;form.style.display='none';
    document.querySelectorAll('[data-craft-source]').forEach(button=>{button.hidden=true;button.style.display='none'});
    return;
  }

  const context={
    sp1:['sp1','joelho','JOELHO · ARTICULAÇÕES'],sp2:['sp2','sarcomero','SARCÔMERO · MÚSCULO'],
    sp3:['sp3','fratura','FRATURA · TRAUMA'],sp4:['sp4','tumor','OSSO · TUMORES'],
    semiology:['sp1','joelho','JOELHO · SEMIOLOGIA'],ankle:['sp1','tornozelo','TORNOZELO · LIGAMENTOS'],
    crystals:['sp1','joelho','JOELHO · MONOARTRITE'],neuromuscular:['sp2','sarcomero','SARCÔMERO · CONTRAÇÃO'],
    clinical:['sp3','fratura','FRATURA · CASOS INTEGRADOS'],oncology:['sp4','tumor','OSSO · ONCO-ORTOPEDIA'],
    source:['sp4','tumor','ANATOMIA · PROVENIÊNCIA']
  };
  const labels={sp1:'SP1 · Articulações',sp2:'SP2 · Neuromuscular',sp3:'SP3 · Trauma',sp4:'SP4 · Tumores',semiology:'Atlas semiológico V06',ankle:'Atlas semiológico V07',crystals:'Cristais e monoartrite V08',neuromuscular:'Atlas neuromuscular V09',clinical:'Caderno integrador',oncology:'Laboratório onco-ortopédico V10',source:'Fontes e proveniência'};
  const conceptParts={
    sp1:[['lca','LCA'],['lcp','LCP'],['meniscos','Meniscos']],
    semiology:[['lca','LCA'],['colaterais','Colaterais'],['meniscos','Meniscos']],
    crystals:[['meniscos','Meniscos'],['tibia','Tíbia'],['femur','Fêmur']],
    ankle:[['ltfa','Talofibular anterior'],['lcf','Calcaneofibular'],['ltfp','Talofibular posterior']],
    sp2:[['calcio','Cálcio'],['actina','Actina'],['miosina','Miosina']],
    neuromuscular:[['discos','Discos Z'],['actina','Actina'],['miosina','Miosina']],
    sp3:[['foco','Foco'],['partes','Partes moles'],['vasos','Eixo neurovascular']],
    clinical:[['foco','Foco de fratura'],['osso','Osso'],['vasos','Eixo neurovascular']],
    sp4:[['lesao','Lesão'],['periosteo','Superfície'],['biopsia','Trajeto conceitual']],
    oncology:[['lesao','Lesão'],['periosteo','Periósteo'],['biopsia','Trajeto conceitual']],
    source:[['osso','Osso'],['lesao','Lesão']]
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  let current='sp1',controller=null,loadedKey='',cached=new Map();
  const inline=value=>esc(value).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https:\/\/[^ )]+|craftdocs:\/\/[^ )]+)\)/g,(_,label,url)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  function markdown(text){
    const rows=String(text).replace(/\r\n/g,'\n').split('\n');
    const out=[];let list=false,fence=false,code=[],table=[];
    const closeList=()=>{if(list){out.push('</ul>');list=false}};
    const flushTable=()=>{if(!table.length)return;
      const rows=table.filter(cells=>!cells.every(cell=>/^:?-{2,}:?$/.test(cell)));
      const tr=rows.map((cells,i)=>`<tr>${cells.map(cell=>`<${i===0?'th':'td'}>${inline(cell)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('');
      out.push(`<div class="craft-table-scroller"><table>${tr}</table></div>`);table=[];
    };
    for(const raw of rows){const line=raw.trim();
      if(line.startsWith('```')){closeList();flushTable();if(fence){out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);code=[]}fence=!fence;continue}
      if(fence){code.push(raw);continue}
      if(/^\|.*\|$/.test(line)){closeList();table.push(line.replace(/^\|/,'').replace(/\|$/,'').split('|').map(cell=>cell.trim()));continue}
      flushTable();
      if(!line){closeList();continue}
      if(/^#{1,4}\s/.test(line)){closeList();const level=Math.min(4,(line.match(/^#+/)||['##'])[0].length);out.push(`<h${level}>${inline(line.replace(/^#{1,4}\s+/,''))}</h${level}>`);continue}
      if(/^(?:-|\*|\d+\.)\s/.test(line)){if(!list){out.push('<ul>');list=true}out.push(`<li>${inline(line.replace(/^(?:-|\*|\d+\.)\s+/,''))}</li>`);continue}
      closeList();
      if(line.startsWith('>')){out.push(`<blockquote>${inline(line.slice(1).trim())}</blockquote>`);continue}
      const image=line.match(/^!\[([^\]]*)\]\((https:\/\/[^)]+)\)$/);
      if(image){try{const u=new URL(image[2]);if(/(^|\.)craft\.do$/.test(u.hostname)){out.push(`<figure><img loading="lazy" alt="${esc(image[1])}" src="${esc(u.href)}" style="max-width:100%;height:auto;border-radius:10px"><figcaption>${esc(image[1])}</figcaption></figure>`);continue}}catch{}}
      out.push(`<p>${inline(line)}</p>`);
    }
    closeList();flushTable();if(fence)out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
    return out.join('');
  }
  function show(data,key){
    root.innerHTML=`<div class="craft-source-tag">CRAFT AO VIVO · ${esc(key.toUpperCase())} · ${esc(data.document_title||'NOTA VINCULADA')}</div>${markdown(data.markdown)}`;
    if(data.truncated)root.insertAdjacentHTML('beforeend','<p class="reader-truncated">Nota extensa: parte do conteúdo foi omitida pelo limite de leitura. Consulte o original no Craft.</p>');
    status.textContent='Leitura atualizada';
    loadedKey=key;
  }
  function choose(key,shouldLoad=false){
    if(!context[key])return;
    current=key;
    const [sp,model,label]=context[key];
    const isSP=/^sp[1-4]$/.test(key);
    title.textContent=labels[key]||'Nota da ⌕ tutoria';
    description.textContent=isSP?'Leia a nota da SP, acompanhe o modelo e registre observações no Craft.':'Acervo complementar recuperado diretamente do Craft, com uma cena espacial associada ao tema.';
    contextLabel.textContent=label;
    const options=conceptParts[key]||[];
    terms.innerHTML=options.map(([id,name])=>`<button type="button" data-craft-part="${id}">${esc(name)}</button>`).join('');
    contextDetail.textContent='Selecione uma estrutura para destacar seu papel espacial.';
    form.hidden=!isSP;
    noteField.value='';writeStatus.textContent='Edição sob demanda';
    window.AtlasModel3D?.setModel(model);
    status.textContent=cached.has(key)?'Leitura desta sessão':'Ainda não consultado';
    if(cached.has(key))show(cached.get(key),key);
    else root.innerHTML='<p>Selecione “Atualizar nota” para consultar esta fonte diretamente no Craft.</p>';
    if(shouldLoad)load(false);
  }
  async function load(force=false){
    const key=current;
    if(!force&&cached.has(key)){show(cached.get(key),key);return}
    if(controller)controller.abort();controller=new AbortController();
    root.innerHTML='<p>Consultando a nota original do Craft…</p>';
    status.textContent='Carregando…';refresh.disabled=true;open.disabled=true;
    try{
      const response=await fetch(`/api/craft/read?scope=${encodeURIComponent(key)}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{accept:'application/json'}});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data?.error||`Conexão retornou HTTP ${response.status}`);
      if(key!==current)return;
      cached.set(key,data);show(data,key);
    }catch(error){
      if(error.name==='AbortError')return;
      status.textContent='Falha de conexão';
      const cachedData=cached.get(key);
      root.innerHTML=`<div class="craft-error"><b>Não foi possível consultar o Craft nesta tentativa.</b><p>${esc(error.message)}.</p><p>O leitor não exibirá conteúdo simulado como se fosse a nota ao vivo.</p></div>`;
      if(cachedData)root.insertAdjacentHTML('beforeend',`<details><summary>Ver última leitura desta sessão</summary>${markdown(cachedData.markdown)}</details>`);
    }finally{refresh.disabled=false;open.disabled=false}
  }
  window.addEventListener('atlas-theory-changed',event=>{
    choose(event.detail.key);
  });
  open.addEventListener('click',()=>{document.getElementById('craft-reader').scrollIntoView({behavior:'smooth',block:'start'});load(false)});
  refresh.addEventListener('click',()=>load(true));
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-craft-source]');if(!button)return;
    const key=button.dataset.craftSource;if(!context[key])return;
    event.preventDefault();
    const [sp]=context[key];
    window.AtlasOpenTheory?.(sp,false);
    choose(key,true);
    document.getElementById('craft-reader').scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.getElementById('craft-context-animate')?.addEventListener('click',()=>{
    window.AtlasModel3D?.setProgress(0);window.AtlasModel3D?.play();
  });
  terms?.addEventListener('click',event=>{
    const button=event.target.closest('[data-craft-part]');if(!button)return;
    window.AtlasModel3D?.selectPart(button.dataset.craftPart);
    terms.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));
    const model=context[current]?.[1];
    const part=window.AtlasModelDefinitions?.[model]?.parts?.find(p=>p.id===button.dataset.craftPart);
    contextDetail.textContent=part?.info||'Estrutura selecionada no modelo didático.';
  });
  document.getElementById('craft-context-focus')?.addEventListener('click',()=>{
    document.getElementById('theory-heading').scrollIntoView({behavior:'smooth',block:'start'});
    window.AtlasModel3D?.draw();
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const note=noteField.value.trim();if(!note||note.length>1200)return;
    const key=current;
    const requestId=crypto.randomUUID();
    save.disabled=true;writeStatus.textContent='Enviando ao Craft…';
    try{
      const response=await fetch('/api/craft/annotation',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'content-type':'application/json','accept':'application/json'},
        body:JSON.stringify({scope:key,note,requestId})
      });
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data?.error||`Falha HTTP ${response.status}`);
      if(!data.verified){writeStatus.textContent='Envio recebido; confirmação de leitura pendente. Confira no Craft antes de repetir.';return}
      writeStatus.textContent='Anotação confirmada no Craft.';
      noteField.value='';cached.delete(key);
      if(key===current)await load(true);
    }catch(error){
      writeStatus.textContent=`Resultado não confirmado: ${error.message}. Verifique a nota antes de enviar novamente.`;
    }finally{save.disabled=false}
  });
})();
