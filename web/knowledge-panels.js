/* V15 · Editorial atlas panels. Original visual models, clinically qualified. */
(() => {
  'use strict';
  const panel=document.getElementById('knowledge-content');if(!panel)return;
  let sp='sp1',grade='IIIA',phase=0;
  const stages=[
    {n:'01',title:'Inflamação e hematoma',tag:'MEDIADORES + RECRUTAMENTO',tone:'#dc625f',body:'Hematoma, sinais inflamatórios e recrutamento de células iniciam o reparo. Estabilidade e vascularização modulam a resposta.',shape:'hemo'},
    {n:'02',title:'Calo fibrocartilaginoso',tag:'PONTE FLEXÍVEL',tone:'#1baebc',body:'Forma-se uma ponte de tecido de granulação/fibrocartilagem entre fragmentos, sobretudo na consolidação indireta com estabilidade relativa.',shape:'soft'},
    {n:'03',title:'Calo ósseo',tag:'OSSIFICAÇÃO',tone:'#ea9c5f',body:'O calo é progressivamente mineralizado e ossificado; a resistência aumenta, mas a arquitetura ainda não é a do osso maduro.',shape:'hard'},
    {n:'04',title:'Remodelação',tag:'ADAPTAÇÃO À CARGA',tone:'#39976a',body:'Remodelação coordenada substitui osso imaturo por lamelar e reorganiza a arquitetura conforme estímulos biomecânicos.',shape:'mature'}
  ];
  const gustilo=[
    {id:'I',label:'Tipo I',tone:'#2684b5',indicator:'Ferida pequena, usualmente ≤1 cm',detail:'Lesão de baixa energia, ferida limpa, mínima lesão de partes moles. O tamanho é um dado, não critério isolado.',context:'Avaliar tecidos e mecanismo antes de classificar.'},
    {id:'II',label:'Tipo II',tone:'#239eac',indicator:'Ferida >1 cm, sem dano extenso',detail:'Laceração maior sem retalhos extensos, avulsão ou perda relevante de partes moles.',context:'Nem toda ferida entre 1 e 10 cm se enquadra sem análise do envelope.'},
    {id:'IIIA',label:'Tipo IIIA',tone:'#30a4a5',indicator:'Alta energia · cobertura viável',detail:'Fratura grave com lesão extensa, porém cobertura adequada do osso pelos tecidos moles após desbridamento.',context:'O tipo III depende de energia, contaminação e tecidos, não apenas >10 cm.'},
    {id:'IIIB',label:'Tipo IIIB',tone:'#e68a49',indicator:'Perda de cobertura · reconstrução',detail:'Perda extensa de partes moles, exposição óssea/desnudamento periosteal e necessidade de reconstrução de cobertura.',context:'Cobertura inadequada distingue IIIB de IIIA.'},
    {id:'IIIC',label:'Tipo IIIC',tone:'#c34e58',indicator:'Lesão arterial exige reparo',detail:'Fratura exposta associada a lesão arterial que requer reparo cirúrgico, independentemente do aspecto ou tamanho da ferida.',context:'Emergência vascular; classificação independe de um limiar de centímetros.'}
  ];
  const evidence=(url,label)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
  const jointSvg=`<svg viewBox="0 0 280 270" role="img" aria-label="Esquema da articulação sinovial: cartilagem, cápsula, líquido sinovial e osso subcondral"><defs><linearGradient id="synBone" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6e7cd"/><stop offset="1" stop-color="#d7b594"/></linearGradient></defs><path d="M112 16V98q0 24-17 32Q76 145 79 160q6 17 38 14h45q32 1 39-14 1-15-14-30-17-12-17-32V16z" fill="url(#synBone)" stroke="#ba9072" stroke-width="2"/><path d="M112 252v-63q0-13-13-19h85q-13 6-13 19v63" fill="url(#synBone)" stroke="#ba9072" stroke-width="2"/><path d="M92 146q57 17 96 0M96 176q46-13 90 0" stroke="#278ec8" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M82 132q-32 32 0 59 61 28 118 0 30-30 0-59" fill="none" stroke="#d46d72" stroke-width="5"/><path d="M106 163q36 18 69 0" fill="none" stroke="#89d5f4" stroke-width="9"/><g stroke="#768d9e" stroke-width="1.5" fill="none"><path d="M78 149H18V130"/><path d="M113 175H22V210"/><path d="M165 83h70V54"/><path d="M189 193h51v29"/></g><g fill="currentColor" font-size="10" font-weight="700"><text x="8" y="118">Cápsula</text><text x="8" y="222">Cartilagem</text><text x="206" y="44">Osso</text><text x="210" y="235">Sinóvia</text></g></svg>`;
  const tendonSvg=`<svg viewBox="0 0 280 270" role="img" aria-label="Hierarquia de tendão: feixes, fibrilas e colágeno em secção"><path d="M28 93Q88 44 176 79L245 113 174 148Q89 176 28 124Z" fill="#e8ded1" stroke="#a78d78" stroke-width="2"/><path d="M28 96Q104 76 177 99M28 110Q104 94 177 112M28 124Q104 115 177 124" stroke="#c9a979" stroke-width="5" fill="none"/><circle cx="182" cy="113" r="34" fill="#f0d8af" stroke="#a78d78" stroke-width="2"/><g fill="#d3ac70">${Array.from({length:13},(_,i)=>{const a=i*Math.PI*2/13;return `<circle cx="${(182+21*Math.cos(a)).toFixed(1)}" cy="${(113+21*Math.sin(a)).toFixed(1)}" r="5"/>`}).join('')}</g><path d="M161 144q-28 30-36 58M197 145q22 35 23 58" stroke="#a899bc" stroke-width="2" stroke-dasharray="4 4" fill="none"/><circle cx="91" cy="215" r="35" fill="#f2e2ca" stroke="#b79365" stroke-width="2"/><g stroke="#c4a065" stroke-width="2" fill="none">${[0,1,2,3,4,5].map(i=>`<path d="M64 ${197+i*6}q32 14 54 0"/>`).join('')}</g><circle cx="219" cy="215" r="35" fill="#eae1ed" stroke="#9877af" stroke-width="2"/><g stroke="#a785b5" stroke-width="2">${[0,1,2,3,4,5].map(i=>`<path d="M${191+i*7} 193l${32-i*3} 39"/>`).join('')}</g><text x="91" y="261" text-anchor="middle" fill="currentColor" font-size="10">Fibras alinhadas</text><text x="219" y="261" text-anchor="middle" fill="currentColor" font-size="10">Desorganização</text></svg>`;
  const boneSvg=(shape)=>`<svg viewBox="0 0 360 120" role="img" aria-label="Etapa esquemática da consolidação óssea"><path d="M18 34H136l18 22-18 25H18zM342 34H224l-18 22 18 25h118z" fill="#ecdcc3" stroke="#aa8b6e" stroke-width="3"/><path d="M18 47h118M342 47H224" stroke="#fff5e4" stroke-width="3"/>${shape==='hemo'?'<ellipse cx="180" cy="58" rx="49" ry="40" fill="#de64656a" stroke="#d74b52" stroke-width="3" stroke-dasharray="5 5"/><g fill="#cb3844"><circle cx="166" cy="51" r="5"/><circle cx="181" cy="58" r="6"/><circle cx="196" cy="68" r="5"/></g>':shape==='soft'?'<ellipse cx="180" cy="57" rx="66" ry="44" fill="#53d5d84d" stroke="#1fa6b5" stroke-width="3"/><path d="M134 56q46-37 92 0m-92 7q43 33 92 0" stroke="#34aeb5" stroke-width="2" fill="none"/>':shape==='hard'?'<ellipse cx="180" cy="57" rx="67" ry="46" fill="#eead683d" stroke="#e38c4f" stroke-width="4"/><g fill="#df9a60">'+Array.from({length:16},(_,i)=>{const x=138+(i*23)%87,y=25+(i*19)%63;return `<circle cx="${x}" cy="${y}" r="4"/>`}).join('')+'</g>':'<rect x="133" y="24" width="95" height="68" rx="20" fill="#9bd7ae88" stroke="#39976a" stroke-width="3"/><path d="M135 46H227m-91 20h90" stroke="#4b9769" stroke-dasharray="7 4" stroke-width="3"/>'}</svg>`;
  const commonHeader=(label,title,lead)=>`<header class="knowledge-head"><span class="knowledge-label">${label}</span><div><h3>${title}</h3><p>${lead}</p></div></header>`;
  function sp1(){return `${commonHeader('CAPÍTULO 01 · SP1','Articulação, tendão e dor: três níveis distintos','Observe tecidos e estruturas antes de interpretar o teste clínico ou classificar a síndrome dolorosa.')}
    <div class="knowledge-figure-grid"><figure class="knowledge-figure"><div class="knowledge-svg">${jointSvg}</div><figcaption><b>ARTICULAÇÃO SINOVIAL</b><span>Cartilagem, osso subcondral, membrana e líquido sinovial.</span></figcaption></figure><figure class="knowledge-figure"><div class="knowledge-svg">${tendonSvg}</div><figcaption><b>HIERARQUIA DO TENDÃO</b><span>Feixes de colágeno e desorganização fibrilar esquemática.</span></figcaption></figure></div>
    <h4 class="knowledge-subhead">Como um achado muda a hipótese</h4><div class="knowledge-rule-grid"><article class="knowledge-rule" style="--rule:#18859a"><span>ESTRUTURA</span><b>Dor tendínea</b><p>Localização, carga provocadora e palpação orientam o diagnóstico clínico. A imagem é útil quando muda a conduta ou há dúvida relevante.</p></article><article class="knowledge-rule" style="--rule:#d28a48"><span>PROCESSO</span><b>Sinovite</b><p>Derrame e limitação dolorosa sugerem processo intra-articular. História e sinais sistêmicos guiam investigação.</p></article><article class="knowledge-rule" style="--rule:#b93845"><span>URGÊNCIA</span><b>Infecção articular</b><p>Monoartrite aguda febril requer exclusão de artrite séptica. Cristais não afastam infecção coexistente.</p></article></div><div class="knowledge-alert"><strong>Armadilha que vale uma prova</strong><p>Infiltração corticosteroide próxima de tendões exige critério, pelo risco de lesão/ruptura; a terapia não é uma sequência obrigatória de “AINE → injeção”. O manejo depende do tendão, estágio e contexto.</p></div>`}
  function sp2(){return `${commonHeader('CAPÍTULO 02 · SP2','Distrofinopatias: do fenótipo ao mecanismo','Fluxo diagnóstico flexível, com CK como marcador de lesão e genética como instrumento etiológico.')}
    <div class="knowledge-diagnostic"><div class="knowledge-mini-title">FLUXO DE INVESTIGAÇÃO · DMD / BMD</div><div class="knowledge-diag-step"><span>01</span><div><strong>Fenótipo clínico + CK</strong><small>Fraqueza proximal progressiva, Gowers, história familiar; CK frequentemente muito elevada em DMD, mas não há limiar único que separe DMD de BMD.</small></div></div><div class="knowledge-down">↓</div><div class="knowledge-diag-step"><span>02</span><div><strong>Teste molecular de <i>DMD</i></strong><small>Selecionar técnicas capazes de identificar deleções/duplicações e variantes de sequência conforme o algoritmo laboratorial.</small></div></div><div class="knowledge-down">↓</div><div class="knowledge-diag-step"><span>03</span><div><strong>Reavaliar se resultado não esclarecedor</strong><small>Revisão fenotípica, painéis complementares e, em casos selecionados, estudos de proteína/biópsia e avaliação especializada.</small></div></div><p class="knowledge-fine">A estratégia não determina que toda análise negativa de deleção/duplicação seja seguida imediatamente por biópsia: sequenciamento é parte relevante da investigação.</p></div>
    <div class="knowledge-rule-grid"><article class="knowledge-rule" style="--rule:#c84f57"><span>DUCHENNE</span><b>Distrofina ausente ou quase ausente</b><p>Em geral, início mais precoce e curso mais grave. Variabilidade individual e terapias modificadoras alteram marcos funcionais.</p></article><article class="knowledge-rule" style="--rule:#148fa4"><span>BECKER</span><b>Distrofina parcialmente funcional</b><p>Fenótipo tipicamente mais brando e curso heterogêneo; CK pode ser bastante elevada, sem faixa exclusiva confiável.</p></article><article class="knowledge-rule" style="--rule:#a97c3d"><span>INTERPRETAÇÃO</span><b>Genótipo + fenótipo</b><p>O efeito da variante sobre a transcrição e a tradução ajuda a explicar diferenças, com exceções à regra de leitura.</p></article></div><div class="knowledge-reference">${evidence('https://www.ncbi.nlm.nih.gov/books/NBK1119/','GeneReviews · Dystrophinopathies')}</div>`}
  function gustiloCard(){const v=gustilo.find(x=>x.id===grade);return `<div class="gustilo-wrap"><div class="knowledge-mini-title">ESTRATIFICAÇÃO DE GUSTILO–ANDERSON</div><div class="gustilo-selector" role="group" aria-label="Selecionar tipo de fratura exposta">${gustilo.map(x=>`<button type="button" data-gustilo="${x.id}" aria-pressed="${x.id===grade}" class="${x.id===grade?'active':''}">${x.id}</button>`).join('')}</div><div class="gustilo-active" style="--grade:${v.tone}"><div class="gustilo-name"><span>${v.label}</span><b>${v.indicator}</b></div><div class="gustilo-severity"><i style="width:${(gustilo.indexOf(v)+1)*20}%"></i></div><p>${v.detail}</p><small>${v.context}</small></div><div class="knowledge-alert"><strong>Antibiótico e cirurgia: individualizar</strong><p>Administrar antibiótico IV precocemente (idealmente ≤1 h, conforme BOAST); cobertura deve seguir protocolo local e tipo de contaminação. Não transformar “gentamicina em todo tipo III” numa regra universal. Avaliação neurovascular, profilaxia antitetânica, estabilização e desbridamento são essenciais.</p><div class="knowledge-reference">${evidence('https://www.boa.ac.uk/resource/boast-4-pdf.html','BOAST · Open Fractures')}</div></div></div>`}
  function healingCard(){return `<div class="healing-wrap"><div class="knowledge-mini-title">CONSOLIDAÇÃO INDIRETA · QUATRO FASES SOBREPOSTAS</div><div class="healing-select" role="group" aria-label="Selecionar fase do reparo ósseo">${stages.map((s,i)=>`<button type="button" data-healing="${i}" class="${phase===i?'active':''}" aria-pressed="${phase===i}" style="--stage:${s.tone}"><span>${s.n}</span><b>${s.title}</b></button>`).join('')}</div><div class="healing-current" style="--stage:${stages[phase].tone}"><div class="healing-graphic">${boneSvg(stages[phase].shape)}</div><span>${stages[phase].tag}</span><h5>${stages[phase].title}</h5><p>${stages[phase].body}</p></div><p class="knowledge-fine">Processo esquemático da consolidação secundária. Cronologia e sobreposição variam conforme perfusão, estabilidade, lesão, infecção e fatores do paciente.</p></div>`}
  function sp3(){return `${commonHeader('CAPÍTULO 03 · SP3','Do trauma ao reparo: qual decisão muda o desfecho?','Classifique o envelope de partes moles, reconheça emergência vascular e acompanhe a biologia da consolidação.')}
    <div class="knowledge-trauma-columns"><div>${gustiloCard()}</div><div>${healingCard()}</div></div><h4 class="knowledge-subhead">Estabilidade e contexto cirúrgico</h4><div class="knowledge-rule-grid"><article class="knowledge-rule" style="--rule:#b93845"><span>CONTROLE DE DANOS</span><b>Fixação externa</b><p>Pode ser priorizada em politraumatizado instável e fraturas com lesão grave de partes moles ou contaminação, conforme plano cirúrgico.</p></article><article class="knowledge-rule" style="--rule:#246cd4"><span>FIXAÇÃO DEFINITIVA</span><b>Osteossíntese</b><p>O método depende da fratura, do estado fisiológico, da cobertura e do potencial de controle de infecção; não há fórmula única por tipo.</p></article><article class="knowledge-rule" style="--rule:#e99558"><span>TRANSIÇÃO</span><b>Estratégia por etapas</b><p>Estabilização temporária e posterior fixação definitiva podem ser indicadas. A decisão é individualizada, não uma sequência mandatória.</p></article></div>`}
  function sp4(){return `${commonHeader('CAPÍTULO 04 · SP4','Oncologia: primeiro caracterizar, depois intervir','A leitura da imagem orienta a hipótese, mas o trajeto de uma eventual biópsia precisa integrar o tratamento definitivo.')}
    <div class="knowledge-diagnostic"><div class="knowledge-mini-title">TRIAGEM RADIOCLÍNICA</div><div class="knowledge-diag-step"><span>01</span><div><strong>Paciente + comportamento</strong><small>Idade, dor progressiva, sintomas sistêmicos, antecedente neoplásico e velocidade de evolução.</small></div></div><div class="knowledge-down">↓</div><div class="knowledge-diag-step"><span>02</span><div><strong>Radiografia em contexto</strong><small>Topografia, matriz, margem/zona de transição, cortical e reação periosteal; padrões não são diagnósticos isolados.</small></div></div><div class="knowledge-down">↓</div><div class="knowledge-diag-step"><span>03</span><div><strong>Investigação local e referência</strong><small>RM quando indicada para extensão/planejamento. Na suspeita de sarcoma, equipe especializada define necessidade e trajeto de biópsia.</small></div></div></div><div class="knowledge-rule-grid"><article class="knowledge-rule" style="--rule:#2d94a4"><span>BAIXA AGRESSIVIDADE</span><b>Zona de transição estreita</b><p>Pode apoiar comportamento indolente, mas idade, local, sintomas e tipo de lesão continuam determinantes.</p></article><article class="knowledge-rule" style="--rule:#e89557"><span>ALERTA</span><b>Destruição cortical</b><p>Interrupção cortical, massa de partes moles e margens imprecisas aumentam preocupação.</p></article><article class="knowledge-rule" style="--rule:#bc4f5b"><span>SEGURANÇA</span><b>Biópsia planejada</b><p>Evitar trajeto inadvertido que comprometa o plano de ressecção; encaminhar para serviço especializado.</p></article></div><div class="knowledge-next"><div><b>Explore os três padrões periosteais.</b><span>Codman, raios de sol e casca de cebola em um atlas vetorial interativo.</span></div><button type="button" data-knowledge-clinical="imagem">Abrir radiologia →</button></div><div class="knowledge-reference">${evidence('https://acsearch.acr.org/docs/69421/narrative/','ACR · Suspected Primary Bone Tumors')}</div>`}
  const lessonKey='atlas-vivo-chapter-progress-v1';
  const readProgress=()=>{try{const value=JSON.parse(localStorage.getItem(lessonKey)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}};
  const lessonProgress=readProgress();
  if(['sp1','sp2','sp3','sp4'].includes(lessonProgress.lastSp))sp=lessonProgress.lastSp;
  const lessonSteps={
    sp1:[['Observar','Articulação × tendão','.knowledge-figure-grid'],['Interpretar','Sinovite, dor e urgência','.knowledge-rule-grid'],['Decidir','Segurança na conduta','.knowledge-alert']],
    sp2:[['Investigar','Fenótipo, CK e genética','.knowledge-diagnostic'],['Comparar','Duchenne × Becker','.knowledge-rule-grid'],['Integrar','Genética e contexto clínico','.knowledge-reflection']],
    sp3:[['Classificar','Gustilo–Anderson','.gustilo-wrap'],['Acompanhar','Fases de consolidação','.healing-wrap'],['Planejar','Estabilidade e tecidos','.knowledge-rule-grid']],
    sp4:[['Investigar','Triagem radioclínica','.knowledge-diagnostic'],['Interpretar','Padrões de agressividade','.knowledge-rule-grid'],['Decidir','Rota da biópsia','.knowledge-next']]
  };
  const checkpoints={
    sp1:{q:'A identificação de cristais no líquido sinovial exclui artrite séptica?',options:['Sim, cristais confirmam que não há infecção.','Não. Cristais e infecção podem coexistir.','Somente se os leucócitos forem inferiores a 50 mil/µL.'],correct:1,why:'Cristais não excluem infecção. Quando houver suspeita clínica, são necessários estudos microbiológicos do líquido sinovial.',source:'https://jbji.copernicus.org/articles/8/29/2023/',label:'EBJIS · SANJO'},
    sp2:{q:'Uma CK muito elevada, isoladamente, distingue Duchenne de Becker?',options:['Sim: existe um ponto de corte universal.','Sim, quando não há história familiar.','Não. A integração com fenótipo e análise genética é essencial.'],correct:2,why:'A CK reflete lesão muscular e pode estar muito elevada em ambas; a investigação molecular e a apresentação clínica orientam a caracterização.',source:'https://www.ncbi.nlm.nih.gov/books/NBK1119/',label:'GeneReviews · Distrofinopatias'},
    sp3:{q:'Qual elemento diferencia principalmente Gustilo IIIA de IIIB?',options:['O comprimento da ferida isoladamente.','A suficiência da cobertura de partes moles após o desbridamento.','O osso afetado, independentemente dos tecidos.'],correct:1,why:'A classificação considera a lesão de partes moles. No IIIA há cobertura adequada; no IIIB há perda extensa e necessidade de reconstrução de cobertura.',source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11149747/',label:'Revisão de cobertura · IIIB'},
    sp4:{q:'Diante de suspeita de sarcoma ósseo, qual é o passo seguro antes da biópsia?',options:['Planejar investigação e trajeto com equipe especializada.','Puncionar no local mais próximo antes da imagem.','Esperar a fratura patológica para confirmar agressividade.'],correct:0,why:'O planejamento por equipe responsável pelo tratamento definitivo reduz o risco de comprometer margens e o trajeto cirúrgico.',source:'https://acsearch.acr.org/docs/69421/narrative/',label:'ACR · Tumores ósseos'}
  };
  let activeStep=0;
  const stateFor=key=>{
    const value=lessonProgress[key];
    if(!value||typeof value!=='object'||Array.isArray(value))lessonProgress[key]={done:[false,false,false],answer:null};
    const state=lessonProgress[key];
    if(!Array.isArray(state.done))state.done=[];
    state.done=[0,1,2].map(i=>state.done[i]===true);
    if(!Number.isInteger(state.answer)||state.answer<0||state.answer>2)state.answer=null;
    return state;
  };
  const saveLesson=()=>{try{localStorage.setItem(lessonKey,JSON.stringify(lessonProgress))}catch{}};
  const progressCount=key=>{
    const state=stateFor(key);
    return state.done.filter(Boolean).length+Number(state.answer===checkpoints[key].correct);
  };
  function updateCatalog(){
    document.querySelectorAll('.chapter-tile[data-open-knowledge]').forEach(b=>{
      const key=b.dataset.openKnowledge;
      if(checkpoints[key])b.dataset.progress=`${progressCount(key)} de 4 etapas`;
    });
  }
  function buildLesson(){
    const steps=lessonSteps[sp],state=stateFor(sp),quiz=checkpoints[sp];
    if(sp==='sp2'){
      const bridge=document.createElement('div');
      bridge.className='knowledge-reflection';
      bridge.innerHTML='<span>INTEGRAÇÃO CLÍNICA</span><h4>Do resultado ao paciente</h4><p>Uma CK isolada não define a síndrome nem sua gravidade. Confronte a variante molecular, a evolução funcional e as manifestações cardíacas e respiratórias. A avaliação multiprofissional faz parte da interpretação longitudinal.</p>';
      panel.appendChild(bridge);
    }
    const nav=document.createElement('nav');
    nav.className='knowledge-lesson-nav';nav.setAttribute('aria-label','Etapas deste capítulo');
    nav.innerHTML='<div class="knowledge-lesson-top"><div><span>PERCURSO DO CAPÍTULO</span><strong>Estude por seções</strong></div><b class="knowledge-lesson-count"></b></div><div class="knowledge-lesson-meter"><i></i></div><div class="knowledge-lesson-steps">'+
      [...steps.map(([title,sub],i)=>`<button type="button" data-knowledge-step="${i}" aria-current="${i===activeStep?'step':'false'}"><span class="knowledge-step-n">${String(i+1).padStart(2,'0')}</span><b>${title}</b><small>${sub}</small></button>`),
      '<button type="button" data-knowledge-step="3" aria-current="false"><span class="knowledge-step-n">04</span><b>Recordar</b><small>Questão comentada</small></button>'].join('')+'</div>';
    panel.querySelector('.knowledge-head')?.insertAdjacentElement('afterend',nav);
    steps.forEach(([title,sub,selector],i)=>{
      const target=panel.querySelector(selector);if(!target)return;
      const wrapper=document.createElement('section');
      wrapper.className='knowledge-stage';wrapper.id=`knowledge-stage-${i}`;
      wrapper.setAttribute('aria-label',`Seção ${i+1}: ${title}`);
      target.parentNode.insertBefore(wrapper,target);wrapper.appendChild(target);
      wrapper.insertAdjacentHTML('afterbegin',`<div class="knowledge-stage-banner"><span>SEÇÃO ${String(i+1).padStart(2,'0')}</span><div><strong>${title}</strong><small>${sub}</small></div></div>`);
      wrapper.insertAdjacentHTML('beforeend',`<div class="knowledge-stage-actions"><button type="button" data-knowledge-mark="${i}"></button><button type="button" data-knowledge-step="${i+1}">Próxima etapa →</button></div>`);
    });
    const checkpoint=document.createElement('section');
    checkpoint.className='knowledge-checkpoint';checkpoint.id='knowledge-stage-3';checkpoint.setAttribute('aria-label','Questão de recuperação ativa');
    checkpoint.innerHTML=`<div class="knowledge-checkpoint-kicker">SEÇÃO 04 · RECUPERAÇÃO ATIVA</div><h4>Agora, sem consultar os quadros.</h4><p>${quiz.q}</p><div class="knowledge-checkpoint-options">${quiz.options.map((option,i)=>`<button type="button" data-knowledge-choice="${i}" aria-pressed="false"><span>${'ABC'[i]}</span>${option}</button>`).join('')}</div><div class="knowledge-checkpoint-feedback" role="status" aria-live="polite" hidden></div><a href="${quiz.source}" target="_blank" rel="noopener noreferrer">Conferir fonte · ${quiz.label} ↗</a><button type="button" data-knowledge-next class="knowledge-next-chapter">Avançar ao próximo capítulo →</button>`;
    panel.appendChild(checkpoint);
    paintLesson();
  }
  function paintLesson(){
    const state=stateFor(sp),quiz=checkpoints[sp],passed=state.answer===quiz.correct;
    const completed=state.done.filter(Boolean).length+Number(passed);
    const count=panel.querySelector('.knowledge-lesson-count');if(count)count.textContent=`${completed} de 4 etapas`;
    const meter=panel.querySelector('.knowledge-lesson-meter i');if(meter)meter.style.width=`${completed*25}%`;
    panel.querySelectorAll('.knowledge-lesson-steps [data-knowledge-step]').forEach(b=>{
      const index=Number(b.dataset.knowledgeStep),done=index===3?passed:state.done[index];
      b.classList.toggle('done',done);b.setAttribute('aria-current',String(activeStep===index?'step':'false'));
      const marker=b.querySelector('.knowledge-step-n');if(marker)marker.textContent=done?'✓':String(index+1).padStart(2,'0');
    });
    panel.querySelectorAll('[data-knowledge-mark]').forEach(b=>{
      const index=Number(b.dataset.knowledgeMark),done=state.done[index];
      b.textContent=done?'Estudada · desfazer ✓':'Marcar como estudada ✓';
      b.setAttribute('aria-pressed',String(done));
      b.closest('.knowledge-stage')?.classList.toggle('studied',done);
    });
    panel.querySelectorAll('[data-knowledge-choice]').forEach(b=>{
      const chosen=Number(b.dataset.knowledgeChoice),selected=state.answer===chosen;
      b.classList.toggle('chosen',selected);
      b.classList.toggle('correct',selected&&passed);
      b.classList.toggle('incorrect',selected&&!passed);
      b.setAttribute('aria-pressed',String(selected));
    });
    const feedback=panel.querySelector('.knowledge-checkpoint-feedback');
    if(feedback){
      feedback.hidden=state.answer===null;
      feedback.classList.toggle('correct',passed);
      feedback.innerHTML=state.answer===null?'':`<b>${passed?'Resposta correta.':'Revise esta decisão.'}</b><p>${quiz.why}</p>`;
    }
    updateCatalog();
  }
  function render(){
    if(!panel)return;
    activeStep=0;
    lessonProgress.lastSp=sp;saveLesson();
    panel.innerHTML=({sp1,sp2,sp3,sp4})[sp]();
    buildLesson();
    document.querySelectorAll('[data-knowledge]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.knowledge===sp)));
    document.querySelectorAll('.chapter-tile').forEach(b=>{b.classList.toggle('selected',b.dataset.openKnowledge===sp);b.setAttribute('aria-pressed',String(b.dataset.openKnowledge===sp));});
  }
  document.getElementById('knowledge-chapters')?.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.knowledge){sp=b.dataset.knowledge;render();return;}
    if(b.dataset.gustilo){grade=b.dataset.gustilo;const target=panel.querySelector('.gustilo-wrap');if(target)target.outerHTML=gustiloCard();return;}
    if(b.dataset.healing){phase=Number(b.dataset.healing);const target=panel.querySelector('.healing-wrap');if(target)target.outerHTML=healingCard();return;}
    if(b.dataset.knowledgeStep){activeStep=Number(b.dataset.knowledgeStep);paintLesson();panel.querySelector(`#knowledge-stage-${activeStep}`)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(b.dataset.knowledgeMark!==undefined){const state=stateFor(sp),index=Number(b.dataset.knowledgeMark);state.done[index]=!state.done[index];saveLesson();paintLesson();return;}
    if(b.dataset.knowledgeChoice!==undefined){stateFor(sp).answer=Number(b.dataset.knowledgeChoice);saveLesson();paintLesson();return;}
    if(b.hasAttribute('data-knowledge-next')){const order=['sp1','sp2','sp3','sp4'];sp=order[(order.indexOf(sp)+1)%order.length];render();document.getElementById('knowledge-chapters')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(b.dataset.knowledgeClinical){window.location.hash='clinica';document.querySelector('[data-clinic-tab="imagem"]')?.click();return;}
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-open-knowledge]');if(!button)return;
    const key=button.dataset.openKnowledge;if(!['sp1','sp2','sp3','sp4'].includes(key))return;
    event.preventDefault();
    sp=key;render();
    window.AtlasGo?.('capitulos');
    requestAnimationFrame(()=>document.getElementById('knowledge-chapters')?.scrollIntoView({behavior:'smooth',block:'start'}));
  });
  window.AtlasKnowledgeSync=key=>{if(!['sp1','sp2','sp3','sp4'].includes(key))return;sp=key;render()};
  render();
})();
