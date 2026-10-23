(() => {
  'use strict';
  const SPACE = '8b335448-6499-3d04-91c1-5f99c399aca8';
  const ROOT = '7600209f-ac0e-25cc-79b4-71e9b211b32d';
  const craft = id => `craftdocs://open?spaceId=${SPACE}&blockId=${id}`;
  const ids = {
    root: ROOT,
    sp1: '1c671fcd-331d-c1af-2e84-4c064596a834',
    sp2: 'cc851eea-5217-be5a-1aa2-446f6a278ef4',
    sp3: 'bcdd8511-2dcb-7ae7-95f9-cb35b3fc8f5b',
    sp4: '5742d6e6-a85d-e1bb-c7d7-e34cc6fb6a9e',
    clinical: 'ab8e73f0-c075-774e-f2cb-a0dacb367137',
    semiology: '8afd2a17-3004-2fed-d644-5d6c1b5e3243',
    ankle: '1339202a-8a02-0fa1-8738-5ddf5265aad2',
    neuromuscular: '7c9a9f24-9e24-39d5-c87f-9bd837a65823',
    oncology: '27694586-41ab-bc65-5302-11465b450185',
    crystals: 'c42d737c-7b74-e3bf-daec-6387a97ab9b2',
    source: '11e24325-0bd4-5a13-ec53-d553a1ff0320'
  };
  const SP = [
    {key:'sp1',num:'SP1',tone:'blue',title:'Articulações & reumatologia',subtitle:'Do exame físico à monoartrite.',topics:['Manguito, joelho, quadril e tornozelo','Gota × CPPD × artrite séptica','Osteoporose, SpA e radiculopatias'],second:'Semiologia ilustrada',secondId:ids.semiology},
    {key:'sp2',num:'SP2',tone:'green',title:'Músculo & sistema nervoso',subtitle:'Estrutura, contração e disfunção.',topics:['Sarcômero e acoplamento excitação–contração','Miastenia × Lambert–Eaton','Duchenne × Becker, DORT e túnel do carpo'],second:'Atlas neuromuscular',secondId:ids.neuromuscular},
    {key:'sp3',num:'SP3',tone:'orange',title:'Trauma & infecção',subtitle:'O primeiro passo muda o desfecho.',topics:['Fraturas e lesões expostas','Osteomielite e necrose avascular','Síndrome compartimental e consolidação'],second:'Casos integradores',secondId:ids.clinical},
    {key:'sp4',num:'SP4',tone:'plum',title:'Onco-ortopedia',subtitle:'Ler imagem antes de decidir.',topics:['Padrões líticos, blásticos e periosteais','Tumores benignos × agressivos','Biópsia planejada, margens e Enneking'],second:'Laboratório de 8 casos',secondId:ids.oncology}
  ];
  const resources = [
    ['semiology','Semiologia especial', 'Ombro · joelho · quadril · punho', 'sp1'],
    ['ankle','Tornozelo, Aquiles e coluna', 'Figuras e perguntas comentadas', 'sp1'],
    ['crystals','Cristais e monoartrite', 'Diagnóstico diferencial em casos', 'sp1'],
    ['neuromuscular','Atlas neuromuscular', 'Sinapse · distrofina · sarcômero · nervos', 'sp2'],
    ['oncology','Laboratório onco-ortopédico', 'Oito decisões com justificativa', 'sp4'],
    ['clinical','Caderno integrador', 'Doze casos clínicos', 'sp3'],
    ['source','Fontes e proveniência', 'Bibliografia e rastreabilidade', 'sp4']
  ];
  document.getElementById('side-craft').href = craft(ROOT);
  document.getElementById('sp-list').innerHTML = SP.map(s => `
    <article class="sp-card" data-tone="${s.tone}">
      <div class="sp-card-top"><span class="sp-number">${s.num} / UCT20</span><h3>${s.title}</h3><p>${s.subtitle}</p></div>
      <div class="sp-card-body"><ul>${s.topics.map(x=>`<li>${x}</li>`).join('')}</ul>
        <div class="sp-links"><button class="craft-btn" type="button" data-craft-source="${s.key}">Ler SP no Atlas ↓</button><button class="secondary-link" data-open-knowledge="${s.key}">Capítulo ilustrado ↓</button><button class="secondary-link" data-theory="${s.key}">Explorar mecanismo 3D →</button><a class="secondary-link" href="${craft(ids[s.key])}" title="Abrir página original no aplicativo Craft">Original no Craft ↗</a></div>
      </div>
    </article>`).join('');
  document.getElementById('craft-resources').innerHTML = resources.map(([key,title,sub,sp])=>`<article class="resource-link" data-resource-key="${key}" data-resource-title="${title.toLocaleLowerCase('pt-BR')}"><div class="resource-details"><b>${title}</b><small>${sub}</small></div><div class="resource-actions"><button type="button" data-craft-source="${key}" data-craft-theory="${sp}">Ler no Atlas</button><a href="${craft(ids[key])}" aria-label="Abrir ${title} no aplicativo Craft">Craft ↗</a></div></article>`).join('');
  document.getElementById('resource-search')?.addEventListener('input',event=>{
    const q=event.target.value.trim().toLocaleLowerCase('pt-BR');
    document.querySelectorAll('[data-resource-key]').forEach(card=>{
      card.hidden=!!q&&!`${card.dataset.resourceTitle} ${card.textContent.toLocaleLowerCase('pt-BR')}`.includes(q);
    });
  });

  const names={inicio:'Visão geral',capitulos:'Capítulos ilustrados',sps:'Módulos SP1–SP4',atlas:'Atlas ilustrado','3d':'Laboratório 3D',clinica:'Laboratório clínico',prova:'Modo prova'};
  function go(page,updateHash=true){
    if(!names[page])page='inicio';
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));
    document.querySelectorAll('[data-page]').forEach(b=>{
      const selected=b.dataset.page===page;b.classList.toggle('selected',selected);
      if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    document.getElementById('crumb-current').textContent=names[page];
    if(updateHash)history.replaceState(null,'',`#${page}`);
    window.scrollTo({top:0,behavior:'instant'});
    if(window.AtlasModel3D){if(page==='3d'||page==='sps'||page==='atlas')window.AtlasModel3D.activate();else window.AtlasModel3D.deactivate()}
    if(page==='sps')window.AtlasTheoryRestore?.();
    if(page==='atlas')window.AtlasManeuverRefresh?.();
    if(page==='clinica')window.AtlasClinicalRefresh?.();
    window.AtlasJourneyRefresh?.();
  }
  window.AtlasGo=go;
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-page],[data-goto],[data-nav]');if(!b)return;
    const page=b.dataset.page||b.dataset.goto||b.dataset.nav;if(!page)return;
    e.preventDefault();window.AtlasJourneyPause?.();go(page);
  });
  window.addEventListener('hashchange',()=>go(location.hash.slice(1),false));
  go(location.hash.slice(1)||'inicio',false);

  const theories={
    sp1:{eye:'SP1 · ANATOMIA APLICADA',title:'O ligamento é a hipótese. A manobra, o experimento.',lead:'Na avaliação do joelho, a direção da translação tibial e a qualidade do ponto final ajudam a relacionar o exame físico com a função dos estabilizadores.',model:'joelho',highlight:'lca',focus:['lca','tibia','lca'],modelTitle:'JOELHO · CRUZADOS E COLATERAIS',craftId:ids.semiology,
      steps:[['01 · Estrutura','O LCA limita principalmente a translação anterior da tíbia em relação ao fêmur. Compare sua posição com o LCP e os colaterais.'],['02 · Mecânica','No Lachman, o joelho permanece em cerca de 20–30° de flexão. Aplique a força de translação anterior e avalie a resistência final.'],['03 · Decisão clínica','A frouxidão assimétrica apoia a hipótese de lesão do LCA, mas história, dor, derrame e demais achados integram a interpretação.']]},
    sp2:{eye:'SP2 · FISIOLOGIA MUSCULAR',title:'Do sinal de Ca²⁺ ao deslizamento dos filamentos.',lead:'A cena mostra filamentos finos e grossos dentro de um sarcômero esquemático. Use o destaque para localizar as estruturas enquanto acompanha cada etapa molecular.',model:'sarcomero',highlight:'actina',focus:['calcio','actina','discos'],modelTitle:'SARCÔMERO · FILAMENTOS E Z',craftId:ids.neuromuscular,
      steps:[['01 · Excitação','O potencial de ação aciona o acoplamento excitação–contração e promove liberação de Ca²⁺ pelo retículo sarcoplasmático.'],['02 · Ponte cruzada','Ca²⁺ liga-se à troponina C; o deslocamento da tropomiosina expõe sítios de actina. A miosina realiza ciclos dependentes de ATP.'],['03 · Correlação','Distrofinopatias alteram a estabilidade mecânica da fibra muscular; o defeito não equivale a uma ausência de liberação de cálcio.']]},
    sp3:{eye:'SP3 · TRAUMA E TECIDOS',title:'Na fratura, o osso nunca está sozinho.',lead:'Analise o foco de fratura junto ao envelope de partes moles. A cena é uma representação de relações, não uma classificação de Gustilo ou um caso real.',model:'fratura',highlight:'foco',focus:['partes','vasos','foco'],modelTitle:'FRATURA · FOCO E ENVOLTÓRIO',craftId:ids.sp3,
      steps:[['01 · Primeiro olhar','Descreva mecanismo, ferida e exposição, contaminação, perfusão distal e função neurológica. Documente antes e depois das intervenções.'],['02 · Primeiras medidas','Em fratura exposta, priorizam-se estabilização, antibiótico sistêmico precoce, profilaxia antitetânica quando indicada e avaliação cirúrgica.'],['03 · Plano definitivo','Desbridamento, estabilidade e cobertura de partes moles dependem da gravidade e da equipe. A morfologia óssea isolada não define o prognóstico.']]},
    sp4:{eye:'SP4 · ONCO-ORTOPEDIA',title:'Uma lesão óssea é um padrão, não um nome.',lead:'Explore a relação entre osso, lesão, superfície cortical e trajeto de biópsia planejada. Volumes são propositadamente abstratos: não representam imagem diagnóstica.',model:'tumor',highlight:'lesao',focus:['osso','lesao','biopsia'],modelTitle:'LESÃO ÓSSEA · PLANO E CONTEXTO',craftId:ids.oncology,
      steps:[['01 · Ler antes de rotular','Localização, zona de transição, matriz, reação periosteal e destruição cortical compõem o raciocínio radiológico.'],['02 · Integrar hipóteses','Idade, dor, evolução e radiografia orientam o diferencial; nenhuma forma isolada da cena autoriza diagnosticar malignidade.'],['03 · Proteger o trajeto','Suspeita de tumor maligno exige encaminhamento e planejamento da biópsia pela equipe responsável pelo tratamento definitivo.']]}
  };
  let theory='sp1';
  function openTheory(key,scroll=false,syncChapter=true){
    const t=theories[key];if(!t)return;theory=key;
    document.querySelectorAll('[data-theory]').forEach(b=>b.classList.toggle('active',b.dataset.theory===key));
    document.getElementById('theory-eyebrow').textContent=t.eye;
    document.getElementById('theory-title').textContent=t.title;
    document.getElementById('theory-lead').textContent=t.lead;
    document.getElementById('theory-model-title').textContent=t.modelTitle;
    document.getElementById('theory-craft').href=craft(t.craftId);
    document.getElementById('theory-steps').innerHTML=t.steps.map(([number,copy],i)=>`<div class="theory-step ${i===0?'is-active':''}"><button type="button" data-theory-step="${i}" aria-label="Exibir etapa ${i+1} em 3D"><strong>${number}</strong><p>${copy}</p></button></div>`).join('');
    window.AtlasModel3D?.setModel(t.model);
    window.AtlasModel3D?.selectPart(t.highlight);
    window.AtlasModel3D?.setProgress(0);
    window.AtlasLearningSync?.(key);
    if(syncChapter)window.AtlasKnowledgeSync?.(key);
    window.dispatchEvent(new CustomEvent('atlas-theory-changed',{detail:{key}}));
    if(scroll)document.getElementById('theory-heading').scrollIntoView({behavior:'smooth',block:'start'});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-theory]');if(b){e.preventDefault();openTheory(b.dataset.theory,true)}});
  document.getElementById('theory-reset').onclick=()=>{window.AtlasModel3D?.resetView()};
  document.getElementById('theory-highlight').onclick=()=>{window.AtlasModel3D?.selectPart(theories[theory].highlight)};
  document.getElementById('theory-steps').addEventListener('click',e=>{
    const button=e.target.closest('[data-theory-step]');if(!button)return;
    const i=Number(button.dataset.theoryStep);
    window.AtlasModel3D?.stop();window.AtlasModel3D?.setProgress(i/2);
    window.AtlasModel3D?.selectPart(theories[theory].focus[i]);
    document.querySelectorAll('.theory-step').forEach((item,n)=>item.classList.toggle('is-active',n===i));
  });
  window.AtlasTheoryKey=()=>theory;
  window.AtlasOpenTheory=(key,scroll=false)=>openTheory(key,scroll);
  // Initialize the 3D laboratory without overriding the student's last chapter.
  openTheory('sp1',false,false);
  window.AtlasTheoryRestore=()=>openTheory(theory);

  function getLocal(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}
  function putLocal(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch{}}
  const mode=getLocal('atlas-vivo-theme','light');document.documentElement.dataset.theme=mode;
  document.getElementById('theme-toggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;putLocal('atlas-vivo-theme',next);window.AtlasModel3D?.draw()};
  if('serviceWorker'in navigator)window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });

  // Unified source-of-truth, reconstructed from the study documents.
  const source=window.AtlasUnifiedContent;
  const scene=window.AtlasManeuverGeometry;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const trustedRich=s=>String(s).replace(/<(?!\/?(?:b|strong|i|em|sup|sub|br)\b)[^>]*>/gi,'');
  const sceneFor={Joelho:'joelho',Ombro:'ombro',Tornozelo:'tornozelo'};
  const sourceWarnings=[
    [/Kocher|criança de 4 anos.*febre/i,'Os critérios de Kocher foram desenvolvidos para quadril. Percentuais históricos não são universais; não transplantar para joelho. Investigar artrite séptica segundo a apresentação e avaliação clínica.','https://www.idsociety.org/practice-guideline/acute-bacterial-arthritis-in-pediatrics2/','PIDS/IDSA 2023'],
    [/gonocócica|gonococemia|poliartralgia migratória/i,'Atualização CDC: ceftriaxona para artrite/dermatite; doxiciclina para clamídia se não excluída. Não usar azitromicina de rotina como apresentado na fonte histórica.','https://www.cdc.gov/std/treatment-guidelines/gonorrhea-adults.htm','CDC · IST'],
    [/fratura exposta/i,'A escolha e a duração dos antibióticos variam com a lesão e o protocolo local; esquemas com gentamicina não constituem regra universal para todo Gustilo III.'],
    [/De Quervain/i,'Na descrição das manobras, distinguir Finkelstein clássico de Eichhoff. O primeiro compartimento inclui APL e EPB.'],
    [/metástase óssea/i,'O predomínio blástico é típico da próstata, mas outros tumores também podem produzir lesões escleróticas. Não interpretar a mnemônica como regra absoluta.'],
    [/Homem de 44 anos.*hálux/i,'A uricemia normal não afasta gota. Terapia hipouricemiante já prescrita geralmente é mantida durante crises, e início durante crise pode ser apropriado com profilaxia conforme diretriz.','https://acrjournals.onlinelibrary.wiley.com/doi/full/10.1002/art.41247','ACR · gota 2020'],
    [/LER\/DORT|CAT e hérnia/i,'Informações administrativas e previdenciárias da fonte histórica exigem conferência nas normas vigentes antes da aplicação.']
  ];
  function warningFor(question){return sourceWarnings.filter(([p])=>p.test(question)).map(([,message,url,label])=>({message,url,label}))}
  function studyEntry([question,answer,memo],i,scope){
    const warnings=warningFor(question);
    return `<details class="learning-item"><summary><span class="entry-no">${String(i+1).padStart(2,'0')}</span><span>${esc(question)}</span><span class="entry-plus" aria-hidden="true">+</span></summary>
      <div class="learning-answer">${warnings.map(note=>`<div class="source-correction"><b>Atualização crítica</b><p>${esc(note.message)}</p>${note.url?`<a href="${note.url}" target="_blank" rel="noopener noreferrer">Verificar ${esc(note.label)} ↗</a>`:''}</div>`).join('')}
        <div class="source-answer-label">EXPLICAÇÃO DA FONTE · CONTEXTUALIZADA</div>
        <p>${trustedRich(answer)}</p><div class="memory-line"><b>Para lembrar</b> ${esc(memo)}</div>
        <div class="learning-answer-actions"><a href="${craft(ids[scope]||ids.root)}">Conferir texto integral no Craft ↗</a>${/^sp[1-4]$/.test(scope)?`<button type="button" data-learn-3d="${scope}">Relacionar com 3D ↑</button>`:''}</div>
      </div></details>`;
  }
  document.body.insertAdjacentHTML('afterbegin',source.defs);
  let learning='sp1';
  function renderLearning(key){
    learning=key;
    const i=Number(key.slice(-1))-1;
    document.querySelectorAll('[data-learning]').forEach(b=>b.classList.toggle('active',b.dataset.learning===key));
    document.getElementById('learning-count').textContent=`${source.study[i].length} explicações · ${key.toUpperCase()}`;
    document.getElementById('learning-list').innerHTML=source.study[i].map((entry,k)=>studyEntry(entry,k,key)).join('');
    document.getElementById('learning-figure').innerHTML=`${source.figures[key]}`;
    window.AtlasMechanismWorkbench?.mount(document.getElementById('learning-figure'),key,(model,progress)=>{
      go('3d');
      window.AtlasModel3D?.setModel(model);
      window.AtlasModel3D?.setProgress(progress);
      document.getElementById('model-canvas')?.focus({preventScroll:true});
    });
  }
  window.AtlasLearningSync=renderLearning;
  document.getElementById('learning-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-learning]');if(b)openTheory(b.dataset.learning)});
  document.getElementById('learning-list').addEventListener('click',e=>{const b=e.target.closest('[data-learn-3d]');if(b)openTheory(b.dataset.learn3d,true)});
  renderLearning('sp1');
  // The 11 original cross-topic vignettes are preserved as native disclosures.
  document.getElementById('cases-list').innerHTML=source.study[4].map((entry,i)=>studyEntry(entry,i,'clinical')).join('');

  const regions=['Todos',...new Set(source.maneuvers.map(m=>m.region))];
  let region='Todos',query='',paused=false;
  const filterWrap=document.getElementById('maneuver-filters');
  filterWrap.innerHTML=regions.map(r=>`<button data-region="${esc(r)}" class="${r===region?'active':''}">${esc(r)}</button>`).join('');
  const maneuverList=document.getElementById('maneuver-list');
  const selectedManeuvers=new Set();
  const observer=('IntersectionObserver'in window)?new IntersectionObserver(entries=>entries.forEach(e=>{
    const id=Number(e.target.dataset.id);
    if(e.isIntersecting)selectedManeuvers.add(id);else selectedManeuvers.delete(id);
  }),{rootMargin:'130px'}):null;
  function renderManeuvers(){
    const filtered=source.maneuvers.filter(m=>(region==='Todos'||m.region===region)&&
      [m.region,m.name,m.target,m.how,m.positive].join(' ').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
    document.getElementById('maneuver-count').textContent=`${filtered.length} de ${source.maneuvers.length} manobras`;
    document.querySelectorAll('[data-region]').forEach(b=>b.classList.toggle('active',b.dataset.region===region));
    if(observer)observer.disconnect();selectedManeuvers.clear();
    maneuverList.innerHTML=filtered.map(m=>{
      const hasScene=sceneFor[m.region];
      return `<article class="maneuver-card" data-id="${m.id}">
        <div class="maneuver-card-top"><span>${esc(m.region)}</span><span>Nº ${String(m.id).padStart(2,'0')}</span></div>
        <div class="maneuver-art"><svg viewBox="0 0 240 160" role="img" aria-label="Sequência esquemática da manobra ${esc(m.name)}"><g data-pose="${m.id}"></g>${m.mark}</svg></div>
        <div class="maneuver-card-body"><h3>${esc(m.name)}</h3><div class="maneuver-target"><span>ESTRUTURA</span><strong>${esc(m.target)}</strong></div>
          <details><summary>Execução, achado e interpretação</summary><div><label>COMO EXECUTAR</label><p>${esc(m.how)}</p><label>ACHADO POSITIVO</label><p>${esc(m.positive)}</p>${m.tip?`<blockquote>${esc(m.tip)}</blockquote>`:''}</div></details>
          <div class="maneuver-card-bottom">${hasScene?`<button data-view-3d="${hasScene}" data-view-name="${esc(m.name)}">Relacionar com 3D ↗</button>`:'<span>Estudo 2D esquemático</span>'}<a href="${craft(ids.semiology)}">Craft ↗</a></div>
        </div></article>`;
    }).join('')||'<div class="maneuver-empty">Nenhuma manobra corresponde à busca. Experimente outro termo ou região.</div>';
    maneuverList.querySelectorAll('.maneuver-card').forEach(card=>{
      if(observer)observer.observe(card);else selectedManeuvers.add(Number(card.dataset.id));
    });
    paintManeuvers(performance.now());
  }
  function paintManeuvers(now){
    const slow=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const phase=paused||slow?1:(1-Math.cos(2*Math.PI*(now%4200)/4200))/2;
    for(const id of selectedManeuvers){
      const target=maneuverList.querySelector(`[data-pose="${id}"]`);
      const m=source.maneuvers.find(x=>x.id===id);
      if(target&&m)target.innerHTML=scene.render(m,phase);
    }
  }
  let lastManeuverPaint=0;
  function moveManeuvers(now){if(document.getElementById('page-atlas').classList.contains('active')&&now-lastManeuverPaint>100){paintManeuvers(now);lastManeuverPaint=now}requestAnimationFrame(moveManeuvers)}
  requestAnimationFrame(moveManeuvers);
  filterWrap.addEventListener('click',e=>{const b=e.target.closest('[data-region]');if(!b)return;region=b.dataset.region;renderManeuvers()});
  document.getElementById('maneuver-search').oninput=e=>{query=e.target.value.trim();renderManeuvers()};
  document.getElementById('pause-maneuvers').onclick=e=>{paused=!paused;e.currentTarget.textContent=paused?'Retomar movimento ▶':'Pausar movimento Ⅱ';e.currentTarget.setAttribute('aria-pressed',String(paused));paintManeuvers(performance.now())};
  maneuverList.addEventListener('click',e=>{
    const b=e.target.closest('[data-view-3d]');if(!b)return;
    const view=document.getElementById('maneuver-three-d');
    view.hidden=false;document.getElementById('maneuver-3d-heading').textContent=`Estruturas relacionadas · ${b.dataset.viewName}`;
    window.AtlasModel3D?.setModel(b.getAttribute('data-view-3d'));
    window.AtlasModel3D?.draw();view.scrollIntoView({behavior:'smooth',block:'center'});
  });
  document.getElementById('close-maneuver-3d').onclick=()=>{document.getElementById('maneuver-three-d').hidden=true};
  renderManeuvers();
  window.AtlasManeuverRefresh=()=>{paintManeuvers(performance.now());window.AtlasModel3D?.draw()};

  const Q=[
    ['semiologia','Qual manobra testa principalmente a integridade funcional do supraespinal?','Jobe (empty can).','Abdução no plano escapular sob resistência. Dor e fraqueza devem ser interpretadas com o exame global, pois testes isolados não fecham diagnóstico.',ids.semiology],
    ['semiologia','Na suspeita de lesão do subescapular, que manobra avalia a rotação interna?','Gerber (lift-off).','Com o dorso da mão na região lombar, tenta-se afastá-la contra resistência. Limitações de amplitude podem exigir testes alternativos.',ids.semiology],
    ['semiologia','Qual achado define um teste de apreensão anterior de ombro positivo?','Apreensão de luxação, não apenas dor.','A reprodução da sensação de instabilidade durante abdução e rotação externa é mais específica do que uma queixa inespecífica de desconforto.',ids.semiology],
    ['semiologia','Lachman: qual ligamento, posição e achado positivo?','LCA; 20–30° de flexão; translação anterior aumentada e endpoint amolecido.','Compare com o joelho contralateral e associe a história de trauma e demais testes.',ids.semiology],
    ['semiologia','Qual manobra de joelho usa apoio unipodal com rotação a 5° e 20°?','Thessaly, para investigação de lesão meniscal.','Dor ou sintomas na interlinha são relevantes, mas a acurácia isolada é insuficiente para confirmação.',ids.semiology],
    ['semiologia','O que diferencia o teste de Thompson positivo?','Ausência ou redução importante de flexão plantar ao comprimir a panturrilha.','Sugere ruptura do tendão calcâneo; considerar falsos negativos em rupturas parciais e complementar exame clínico.',ids.ankle],
    ['semiologia','Qual estrutura é predominantemente avaliada pelo talar tilt em inversão?','Ligamento calcaneofibular.','A gaveta anterior avalia principalmente o ligamento talofibular anterior; estabilidade deve ser comparada ao lado oposto.',ids.ankle],
    ['semiologia','O que significa Trendelenburg positivo em apoio sobre um único membro?','Queda pélvica contralateral por insuficiência dos abdutores da anca/quadril.','Pode refletir dor, déficit neuromuscular ou disfunção do glúteo médio/mínimo, não só ruptura isolada.',ids.semiology],
    ['SP1','Cristais em agulha com birrefringência negativa: qual doença é típica?','Gota por urato monossódico.','O nível sérico de urato pode estar normal na crise; identificar cristais não exclui artrite séptica concomitante.',ids.crystals],
    ['SP1','Cristais romboides com birrefringência fracamente positiva sugerem o quê?','Doença por deposição de pirofosfato de cálcio (CPPD).','Envolve com frequência joelho e punho. A presença de cristais não dispensa investigação de infecção quando suspeita.',ids.crystals],
    ['SP1','Em monoartrite febril com derrame, qual procedimento orienta o diagnóstico?','Artrocentese com análise do líquido sinovial.','Contagem celular, Gram/cultura e cristais; não usar limite único de leucócitos para excluir artrite séptica.',ids.crystals],
    ['SP1','Os critérios de Kocher podem ser extrapolados para qualquer joelho doloroso infantil?','Não. Foram desenvolvidos para o quadril.','Probabilidades históricas não são universais. Use avaliação clínica, exames e artrocentese conforme suspeita; a apresentação no joelho é diferente.',ids.sp1],
    ['SP2','Qual proteína liga o citoesqueleto muscular ao complexo de glicoproteínas sarcolemais e está ausente/alterada na DMD/BMD?','Distrofina.','Em Duchenne costuma haver perda de proteína funcional; em Becker, proteína residual ou anômala.',ids.neuromuscular],
    ['SP2','Qual relação entre cálcio, troponina e miosina inicia a contração?','Ca²⁺ liga-se à troponina C, deslocando a tropomiosina.','Os sítios de actina tornam-se acessíveis. ATP permite dissociação e ciclagem das pontes cruzadas.',ids.neuromuscular],
    ['SP2','Qual síndrome da junção neuromuscular envolve autoanticorpos contra canais de cálcio pré-sinápticos?','Síndrome miastênica de Lambert–Eaton.','A miastenia gravis típica envolve anticorpos pós-sinápticos (p.ex., AChR), com padrão clínico distinto.',ids.neuromuscular],
    ['SP2','De Quervain: quais tendões ocupam o primeiro compartimento extensor?','Abdutor longo do polegar (APL) e extensor curto do polegar (EPB).','Não confundir com extensor longo ou adutor curto; diferenciar as manobras Finkelstein e Eichhoff.',ids.sp2],
    ['SP3','Em fratura exposta, qual é a prioridade inicial além da avaliação do trauma?','Estado neurovascular, antibiótico precoce e desbridamento oportuno.','Identificar perfusão, cobertura de partes moles, contaminação e necessidades de profilaxia antitetânica.',ids.sp3],
    ['SP3','O que caracteriza o fragmento desvitalizado na osteomielite crônica?','Sequestro ósseo.','Pode coexistir com invólucro e cloaca; a remoção cirúrgica pode ser necessária conforme foco e evolução.',ids.sp3],
    ['SP4','Osteoma osteoide: qual par é especialmente sugestivo?','Nidus pequeno e dor noturna que melhora com AINE.','A imagem e o diferencial importam; padrões podem variar conforme localização.',ids.sp4],
    ['SP4','Qual princípio de segurança precede biópsia de tumor ósseo possivelmente maligno?','Planejamento no centro/equipe que fará o tratamento definitivo.','O trajeto da biópsia deve integrar o plano cirúrgico para não contaminar compartimentos desnecessariamente.',ids.oncology]
  ];
  const grades=getLocal('atlas-vivo-quiz-v1',{});
  const quizPositionKey='atlas-vivo-quiz-position-v1';
  const lastQuizPosition=getLocal(quizPositionKey,{});
  const validTopics=['todos','semiologia','SP1','SP2','SP3','SP4'];
  let topic=validTopics.includes(lastQuizPosition?.topic)?lastQuizPosition.topic:'todos';
  let index=Number.isInteger(lastQuizPosition?.index)&&lastQuizPosition.index>=0?lastQuizPosition.index:0;
  let revealed=false,reviewOnly=false;
  const topicCards=()=>Q.map((q,i)=>({q,i})).filter(x=>topic==='todos'||x.q[0]===topic);
  const filtered=()=>topicCards().filter(x=>!reviewOnly||grades[x.i]==='rever');
  const quizNotice=message=>{document.getElementById('quiz-feedback').textContent=message};
  const saveQuizPosition=()=>putLocal(quizPositionKey,{topic,index});
  function renderQuiz(){
    const cards=topicCards();
    const difficult=cards.filter(x=>grades[x.i]==='rever').length;
    if(reviewOnly&&!difficult){
      reviewOnly=false;index=0;
      quizNotice('Você revisou todas as dificuldades desta seleção. Retome os cartões completos quando quiser.');
    }
    const all=filtered();if(!all.length)return;index=((index%all.length)+all.length)%all.length;
    const {q,i}=all[index];document.getElementById('quiz-tag').textContent=q[0]==='semiologia'?'SEMIOLOGIA':q[0];
    document.getElementById('quiz-count').textContent=`${index+1} / ${all.length}`;
    document.getElementById('quiz-prompt').textContent=q[1];document.getElementById('quiz-solution').textContent=q[2];document.getElementById('quiz-explain').textContent=q[3];
    document.getElementById('quiz-source').innerHTML=`<a href="${craft(q[4])}">Revisar no Craft ↗</a>`;
    document.getElementById('quiz-answer').hidden=!revealed;document.getElementById('quiz-reveal').hidden=revealed;document.getElementById('rating-actions').hidden=!revealed;
    document.getElementById('quiz-reviewed').textContent=cards.filter(x=>Boolean(grades[x.i])).length;
    document.getElementById('quiz-total').textContent=cards.length;
    document.getElementById('quiz-weak-count').textContent=difficult;
    document.getElementById('quiz-weak-label').textContent=reviewOnly?'Ver todos os cartões':'Rever dificuldades';
    const weakToggle=document.getElementById('quiz-weak-toggle');
    weakToggle.disabled=!reviewOnly&&!difficult;
    weakToggle.setAttribute('aria-pressed',String(reviewOnly));
    document.querySelectorAll('[data-grade]').forEach(b=>b.setAttribute('aria-pressed',String(grades[i]===b.dataset.grade)));
    saveQuizPosition();
  }
  function step(delta){index+=delta;revealed=false;renderQuiz()}
  document.getElementById('quiz-reveal').onclick=()=>{revealed=true;renderQuiz()};
  document.getElementById('quiz-prev').onclick=()=>step(-1);
  document.getElementById('quiz-next').onclick=()=>step(1);
  document.getElementById('quiz-topic').value=topic;
  document.getElementById('quiz-topic').onchange=e=>{
    topic=e.target.value;index=0;revealed=false;reviewOnly=false;
    quizNotice('Seleção atualizada. Responda sem consultar a resposta e classifique sua lembrança.');renderQuiz();
  };
  document.getElementById('quiz-weak-toggle').onclick=()=>{
    reviewOnly=!reviewOnly;index=0;revealed=false;
    quizNotice(reviewOnly?'Revisão focada: somente os cartões classificados como “Rever”.':'Todos os cartões desta seleção estão disponíveis.');
    renderQuiz();
  };
  document.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>{
    const all=filtered();const active=all[index];if(!active)return;
    const grade=b.dataset.grade;
    grades[active.i]=grade;putLocal('atlas-vivo-quiz-v1',grades);
    if(!reviewOnly||grade==='rever')index+=1;
    revealed=false;
    quizNotice(grade==='rever'?'Cartão incluído na fila de dificuldades.':'Resposta registrada. Você pode retomá-la quando quiser.');
    renderQuiz();
    window.AtlasJourneyRefresh?.();
  });
  renderQuiz();

  // V13 · A learner-controlled route through the existing, independently usable tools.
  // A visit never counts as completion: only the explicit completion action does.
  const journeySteps=[
    {title:'Compreender',short:'Ler capítulo',description:'Comece pelos quadros ilustrados do capítulo. Observe os tecidos, siga o fluxograma e reconheça sinais de alerta; depois consulte a SP original se precisar aprofundar.',action:'Abrir capítulo ilustrado →'},
    {title:'Visualizar',short:'Ver o mecanismo',description:'Percorra a explicação em três momentos. Compare a estrutura com o movimento e selecione os destaques do modelo anatômico.',action:'Explorar o mecanismo →'},
    {title:'Manipular',short:'Explorar em 3D',description:'Gire, amplie, isole estruturas e controle a animação. Descreva a relação espacial sem consultar os rótulos antes de verificar.',action:'Abrir o laboratório 3D →'},
    {title:'Aplicar',short:'Responder',description:'Resolva os cartões correspondentes à SP. Formule a resposta mentalmente, revele a justificativa e classifique sua recuperação.',action:'Fazer a revisão ativa →'},
    {title:'Consolidar',short:'Explicar sem olhar',description:'Volte aos fundamentos comentados e às figuras do mecanismo. Identifique os pontos difíceis, releia a explicação e registre dúvidas na sua nota.',action:'Revisar os fundamentos →'}
  ];
  const journeyStorageKey='atlas-vivo-learning-path-v1';
  const recoveredJourney=getLocal(journeyStorageKey,{});
  const journeyData=recoveredJourney&&typeof recoveredJourney==='object'&&!Array.isArray(recoveredJourney)?recoveredJourney:{};
  let journeySp=SP.some(s=>s.key===journeyData.current)?journeyData.current:'sp1';
  let journeyRunning=false;
  const journeyEl=document.getElementById('guided-journey');
  const journeyDock=document.getElementById('journey-dock');
  const pathFor=key=>{
    const saved=journeyData[key];
    if(!saved||typeof saved!=='object')journeyData[key]={done:[false,false,false,false,false],focus:0};
    const entry=journeyData[key];
    if(!Array.isArray(entry.done))entry.done=[];
    entry.done=journeySteps.map((_,i)=>entry.done[i]===true);
    entry.focus=Math.max(0,Math.min(journeySteps.length-1,Number.isInteger(entry.focus)?entry.focus:0));
    return entry;
  };
  const saveJourney=()=>{journeyData.current=journeySp;putLocal(journeyStorageKey,journeyData)};
  const journeyScroll=target=>requestAnimationFrame(()=>document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'}));
  function renderJourney(){
    const path=pathFor(journeySp);
    const count=path.done.filter(Boolean).length;
    const difficult=Q.filter((q,i)=>q[0]===journeySp.toUpperCase()&&grades[i]==='rever').length;
    document.getElementById('journey-recall').hidden=!difficult;
    document.getElementById('journey-recall-count').textContent=`${difficult} ${difficult===1?'cartão':'cartões'} para retomar`;
    document.getElementById('journey-count').textContent=count===5?'Trilha concluída':`${count} de 5 etapas`;
    const meter=document.getElementById('journey-meter');
    meter.setAttribute('aria-valuenow',String(count));
    document.getElementById('journey-meter-fill').style.width=`${count*20}%`;
    document.querySelectorAll('[data-journey-sp]').forEach(b=>{
      const active=b.dataset.journeySp===journeySp;
      b.classList.toggle('active',active);
      b.setAttribute('aria-pressed',String(active));
    });
    document.getElementById('journey-steps').innerHTML=journeySteps.map((step,i)=>{
      const selected=i===path.focus;
      return `<button type="button" data-journey-stage="${i}" class="journey-stage${selected?' active':''}${path.done[i]?' complete':''}" aria-pressed="${selected}"><span class="journey-stage-number">${path.done[i]?'✓':String(i+1).padStart(2,'0')}</span><span class="journey-stage-copy"><strong>${step.title}</strong><small>${step.short}</small></span></button>`;
    }).join('');
    const step=journeySteps[path.focus];
    document.getElementById('journey-step-position').textContent=`${journeySp.toUpperCase()} · ETAPA ${String(path.focus+1).padStart(2,'0')} / 05`;
    document.getElementById('journey-step-title').textContent=count===5?'Percurso concluído.':step.title;
    document.getElementById('journey-step-description').textContent=count===5?'Você marcou as cinco etapas. Para testar a retenção, retome os cartões difíceis no Modo prova ou revisite uma atividade antes da próxima SP.':step.description;
    document.getElementById('journey-open').textContent=count===5?'Revisitar atividade →':step.action;
    const doneButton=document.getElementById('journey-complete');
    doneButton.disabled=path.done[path.focus]&&count!==5;
    doneButton.textContent=count===5?'Continuar para a próxima SP →':path.done[path.focus]?'Etapa já concluída':'Marcar como concluída';
    const currentPage=document.querySelector('.page.active')?.id;
    journeyDock.hidden=!journeyRunning||currentPage==='page-inicio';
    document.getElementById('journey-dock-title').textContent=`${journeySp.toUpperCase()} · ${step.title} · ${count}/5`;
    document.getElementById('journey-finish').disabled=path.done[path.focus];
  }
  function openJourneyStep(){
    const step=pathFor(journeySp).focus;
    journeyRunning=true;
    if(step===0){
      window.AtlasKnowledgeSync?.(journeySp);go('capitulos');
      journeyScroll('#knowledge-chapters');
    }else if(step===1){
      go('sps');openTheory(journeySp);
      journeyScroll('#theory-heading');
    }else if(step===2){
      go('3d');window.AtlasModel3D?.setModel(({sp1:'joelho',sp2:'sarcomero',sp3:'fratura',sp4:'tumor'})[journeySp]);
      journeyScroll('.lab-layout');
    }else if(step===3){
      go('prova');
      const select=document.getElementById('quiz-topic');select.value=journeySp.toUpperCase();select.dispatchEvent(new Event('change',{bubbles:true}));
      journeyScroll('.quiz-toolbar');
    }else{
      go('sps');openTheory(journeySp);
      journeyScroll('.learning-section');
    }
    renderJourney();
  }
  function finishJourneyStep(){
    const path=pathFor(journeySp);
    if(path.done.every(Boolean)){
      journeySp=SP[(SP.findIndex(s=>s.key===journeySp)+1)%SP.length].key;
      journeyRunning=false;saveJourney();go('inicio');renderJourney();journeyScroll('#guided-journey');
      return;
    }
    path.done[path.focus]=true;
    const next=path.done.findIndex((done,i)=>i>path.focus&&!done);
    const firstOpen=path.done.findIndex(done=>!done);
    path.focus=next>=0?next:(firstOpen>=0?firstOpen:journeySteps.length-1);
    journeyRunning=false;
    saveJourney();go('inicio');renderJourney();journeyScroll('#guided-journey');
  }
  journeyEl.addEventListener('click',e=>{
    const sp=e.target.closest('[data-journey-sp]');
    if(sp){journeySp=sp.dataset.journeySp;journeyRunning=false;saveJourney();renderJourney();return}
    const stage=e.target.closest('[data-journey-stage]');
    if(stage){pathFor(journeySp).focus=Number(stage.dataset.journeyStage);saveJourney();renderJourney()}
  });
  document.getElementById('journey-open').addEventListener('click',openJourneyStep);
  document.getElementById('journey-complete').addEventListener('click',finishJourneyStep);
  document.getElementById('journey-recall-open').addEventListener('click',()=>{
    topic=journeySp.toUpperCase();index=0;reviewOnly=true;revealed=false;journeyRunning=false;
    document.getElementById('quiz-topic').value=topic;
    quizNotice('Retomada da trilha: somente os cartões difíceis desta SP.');
    renderQuiz();go('prova');renderJourney();journeyScroll('.quiz-toolbar');
  });
  document.getElementById('journey-finish').addEventListener('click',finishJourneyStep);
  document.getElementById('journey-back').addEventListener('click',()=>{journeyRunning=false;go('inicio');renderJourney();journeyScroll('#guided-journey')});
  window.AtlasJourneyRefresh=renderJourney;
  window.AtlasJourneyPause=()=>{journeyRunning=false;renderJourney()};
  renderJourney();
})();
