(() => {
  'use strict';

  // Interpretive interactive layers on top of the archived vector drawings.
  // These stages describe a schematic mechanism, never a patient time course.
  const laboratories = {
    sp1: {
      eyebrow: 'MECÂNICA · TORNOZELO', title: 'Inversão sob controle',
      hint: 'Movimente a articulação e acompanhe a tensão lateral. A amplitude é ilustrativa, não uma mensuração clínica.',
      stages: [
        ['Posição neutra', 'Observe a relação entre tíbia, fíbula e tálus antes de aplicar o movimento.'],
        ['Inversão progressiva', 'A rotação esquemática evidencia a sobrecarga do complexo ligamentar lateral.'],
        ['Interpretar a lesão', 'O LTFA é frequentemente acometido em entorses por inversão, especialmente com flexão plantar. O diagnóstico exige contexto e exame.']
      ],
      question: 'Uma inversão do tornozelo confirma, por si só, ruptura do LTFA?',
      answer: 'Não. Mecanismo e dor orientam a hipótese; exame de estabilidade, palpação, capacidade de apoio e critérios para imagem orientam a avaliação.',
      model: 'tornozelo', motion: 'Movimento esquemático · inversão'
    },
    sp2: {
      eyebrow: 'MICROFISIOLOGIA · MÚSCULO', title: 'Deslizar sem encurtar o filamento',
      hint: 'Compare os limites das linhas Z com a miosina central. Os filamentos finos deslizam; seus comprimentos não mudam.',
      stages: [
        ['Acoplamento', 'O estímulo elétrico favorece a liberação de Ca²⁺ pelo retículo sarcoplasmático.'],
        ['Ponte cruzada', 'Ca²⁺ liga-se à troponina C; a miosina interage ciclicamente com a actina com gasto de ATP.'],
        ['Encurtamento', 'A sobreposição dos filamentos aumenta e as linhas Z se aproximam; a banda A permanece praticamente constante.']
      ],
      question: 'Na contração, o que encurta: a miosina, a actina ou o sarcômero?',
      answer: 'O sarcômero encurta por deslizamento dos filamentos, que preservam seus próprios comprimentos. A energia dos ciclos de pontes cruzadas vem do ATP.',
      model: 'sarcomero', motion: 'Sobreposição relativa dos filamentos'
    },
    sp3: {
      eyebrow: 'PATOLOGIA · TECIDO ÓSSEO', title: 'A arquitetura da infecção crônica',
      hint: 'Revele o sequestro e o envoltório reacional. Esta figura mostra elementos morfológicos, não a velocidade de evolução da doença.',
      stages: [
        ['Osso e envoltório', 'Observe o osso cortical e o invólucro, osso novo reacional formado ao redor da área afetada.'],
        ['Foco desvitalizado', 'O sequestro representa osso necrótico. A área de supuração é indicada de forma esquemática.'],
        ['Trajeto de drenagem', 'Uma cloaca e eventual trajeto fistuloso podem permitir drenagem em formas crônicas; não estão presentes em todos os pacientes.']
      ],
      question: 'Qual estrutura é osso morto: sequestro ou invólucro?',
      answer: 'Sequestro é tecido ósseo necrótico; invólucro é formação óssea reacional ao redor. Fístula e cloaca são achados possíveis, não universais.',
      model: 'osteomielite', motion: 'Revelação de estruturas · não cronológica'
    },
    sp4: {
      eyebrow: 'RADIOLOGIA · PADRÕES', title: 'Três respostas periosteais, três leituras',
      hint: 'Alterne os padrões morfológicos. São alternativas de aparência radiológica, não fases consecutivas de um único tumor.',
      stages: [
        ['Triângulo de Codman', 'Elevação periosteal cria um aspecto triangular. É um sinal de agressividade possível, mas não específico de tumor maligno.'],
        ['Raios de sol', 'Espículas perpendiculares ou divergentes produzem padrão radiado; devem ser interpretadas com a lesão completa.'],
        ['Casca de cebola', 'Camadas lamelares refletem deposição periosteal sucessiva. O padrão isolado não identifica uma doença.']
      ],
      question: 'A reação em casca de cebola é suficiente para diagnosticar sarcoma de Ewing?',
      answer: 'Não. Reações periosteais não são patognomônicas. Idade, topografia, matriz, zona de transição, imagem integral e avaliação especializada são essenciais.',
      model: 'tumor', motion: 'Comparação de padrões · não temporal'
    }
  };

  let cleanup = () => {};
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));

  function mount(container, key, on3d) {
    cleanup();
    const config = laboratories[key];
    if (!config || !container) return;
    container.dataset.mechanism = key;
    const figure = container.querySelector('figure');
    const svg = figure?.querySelector('svg');
    if (!figure || !svg) return;

    figure.classList.add('mechanism-art');
    const oldCaption = figure.querySelector('figcaption');
    if (oldCaption) oldCaption.remove();
    const oldSeg = figure.querySelector('.seg');
    if (oldSeg) oldSeg.remove();
    figure.querySelector('#cap4')?.remove();
    svg.setAttribute('aria-describedby', 'mechanism-note');
    svg.setAttribute('focusable', 'false');
    const header = document.createElement('div');
    header.className = 'mechanism-intro';
    header.innerHTML = `<div><span class="source-figure-label">${config.eyebrow}</span><h3>${config.title}</h3><p>${config.hint}</p></div><span class="mechanism-kind">SIMULAÇÃO DIDÁTICA</span>`;
    figure.before(header);

    const panel = document.createElement('div');
    panel.className = 'mechanism-panel';
    panel.innerHTML = `
      <div class="mechanism-controls">
        <button type="button" class="mechanism-play" data-action="play" aria-pressed="false">Reproduzir movimento</button>
        <label class="mechanism-range-wrap"><span>Explorar mecanismo</span><input type="range" min="0" max="100" value="0" step="1" aria-label="Explorar o mecanismo, de zero a cem por cento" data-action="range" /></label>
        <output class="mechanism-percent" data-output="percent">0%</output>
        <button type="button" class="mechanism-labels" data-action="labels" aria-pressed="false">Ocultar rótulos</button>
      </div>
      <div class="mechanism-stages" role="group" aria-label="Três etapas do mecanismo">
        ${config.stages.map(([title],i)=>`<button type="button" class="mechanism-stage${i===0?' selected':''}" data-action="stage" data-stage="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span><strong>${title}</strong></button>`).join('')}
      </div>
      <section class="mechanism-explanation" aria-live="polite" aria-atomic="true"><span class="mechanism-stage-count" data-output="stage">ETAPA 01 / 03</span><h4 data-output="title"></h4><p id="mechanism-note" data-output="description"></p></section>
      <div class="mechanism-bottom">
        <button type="button" class="mechanism-to-3d" data-action="3d">Manipular este tema em 3D <span aria-hidden="true">↗</span></button>
        <span>${config.motion}</span>
      </div>
      <div class="mechanism-recall"><div><span class="source-figure-label">RECUPERAÇÃO ATIVA</span><p>${config.question}</p></div><button type="button" data-action="answer" aria-expanded="false">Revelar raciocínio</button><p class="mechanism-answer" data-output="answer" hidden>${config.answer}</p></div>`;
    figure.after(panel);

    const range = panel.querySelector('[data-action="range"]');
    const play = panel.querySelector('[data-action="play"]');
    const labels = panel.querySelector('[data-action="labels"]');
    const stageButtons = [...panel.querySelectorAll('[data-action="stage"]')];
    const stageTitle = panel.querySelector('[data-output="title"]');
    const stageDescription = panel.querySelector('[data-output="description"]');
    const stageCount = panel.querySelector('[data-output="stage"]');
    const percent = panel.querySelector('[data-output="percent"]');
    const answer = panel.querySelector('[data-output="answer"]');
    const tags = [...svg.querySelectorAll('.tag')];
    let progress = 0, playing = false, lastTime = null, raf = null, activeStage = -1;

    function render(p) {
      progress = clamp(p);
      const t = progress, stage = Math.min(2, Math.round(progress * 2));
      range.value = String(Math.round(t * 100));
      percent.textContent = `${Math.round(t * 100)}%`;
      if (key === 'sp1') {
        svg.querySelector('.tilt')?.setAttribute('transform', `rotate(${(14*t).toFixed(2)} 158 100)`);
        const ligament = svg.querySelector('.glow');
        if (ligament) {
          ligament.setAttribute('stroke-width', String((3+4*t).toFixed(2)));
          ligament.setAttribute('opacity', String((.48+.52*t).toFixed(2)));
        }
      } else if (key === 'sp2') {
        svg.querySelector('.tl')?.setAttribute('transform', `translate(${(35*t).toFixed(2)} 0)`);
        svg.querySelector('.tr')?.setAttribute('transform', `translate(${(-35*t).toFixed(2)} 0)`);
        svg.querySelector('.rk')?.setAttribute('opacity', String(Math.min(1,.16+t*1.4).toFixed(2)));
      } else if (key === 'sp3') {
        const cavity=svg.querySelector('.cav');
        if(cavity){cavity.setAttribute('opacity', String((.35+.65*t).toFixed(2)));cavity.setAttribute('transform',`translate(160 90) scale(${(.68+.32*t).toFixed(3)}) translate(-160 -90)`)}
        const trail=svg.querySelector('.inc');
        if(trail){trail.setAttribute('stroke-dashoffset', String((-38*t).toFixed(2)));trail.setAttribute('opacity',String((.2+.8*t).toFixed(2)))}
        svg.querySelectorAll('.dr').forEach((drop,i)=>{drop.setAttribute('transform', `translate(${(7*t*(i+1)).toFixed(2)} ${(5*t*(i+1)).toFixed(2)})`);drop.setAttribute('opacity', String(Math.max(0,t*.9).toFixed(2))) });
      } else if (key === 'sp4') {
        const variants = ['c','s','o'];
        svg.dataset.m = variants[stage];
        svg.querySelectorAll('.g').forEach(group=>{group.style.opacity=group.classList.contains(variants[stage])?'1':'0'});
      }
      if(stage !== activeStage){
        activeStage=stage;
        const [title,description]=config.stages[stage];
        stageTitle.textContent=title;stageDescription.textContent=description;
        stageCount.textContent=`ETAPA 0${stage+1} / 03`;
        stageButtons.forEach((button,i)=>{button.classList.toggle('selected',i===stage);button.setAttribute('aria-pressed',String(i===stage))});
      }
    }
    function stop(){playing=false;lastTime=null;if(raf!==null){cancelAnimationFrame(raf);raf=null}play.textContent='Reproduzir movimento';play.setAttribute('aria-pressed','false')}
    function tick(time){if(!playing)return;if(lastTime!==null)render(progress+(time-lastTime)/6200);lastTime=time;if(progress>=1){stop();return}raf=requestAnimationFrame(tick)}
    function start(){if(reduced())return;stop();if(progress>=1)render(0);playing=true;play.textContent='Pausar movimento';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick)}
    const onVisibility=()=>{if(document.hidden)stop()};
    document.addEventListener('visibilitychange',onVisibility);
    panel.addEventListener('input',event=>{if(event.target===range){stop();render(Number(range.value)/100)}});
    panel.addEventListener('click',event=>{
      const button=event.target.closest('button[data-action]');if(!button)return;
      const action=button.dataset.action;
      if(action==='play'){if(playing)stop();else start()}
      if(action==='stage'){stop();render(Number(button.dataset.stage)/2)}
      if(action==='labels'){
        const hidden=button.getAttribute('aria-pressed')!=='true';
        tags.forEach(tag=>tag.style.opacity=hidden?'0':'1');
        button.setAttribute('aria-pressed',String(hidden));button.textContent=hidden?'Mostrar rótulos':'Ocultar rótulos';
      }
      if(action==='3d'){stop();on3d?.(config.model,progress)}
      if(action==='answer'){
        const show=answer.hidden;answer.hidden=!show;
        button.textContent=show?'Ocultar raciocínio':'Revelar raciocínio';
        button.setAttribute('aria-expanded',String(show));
      }
    });
    if(reduced()){play.disabled=true;play.title='A animação automática está desativada pela preferência de movimento reduzido. Use as etapas ou o controle manual.'}
    render(0);
    cleanup=()=>{stop();document.removeEventListener('visibilitychange',onVisibility)};
  }
  window.AtlasMechanismWorkbench={mount,stop:()=>cleanup(),laboratories};
})();
