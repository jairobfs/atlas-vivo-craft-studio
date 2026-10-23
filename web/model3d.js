(() => {
  'use strict';
  const cvs=document.getElementById('model-canvas');if(!cvs)return;
  const theoryCvs=document.getElementById('theory-canvas');
  const maneuverCvs=document.getElementById('maneuver-canvas');
  const craftCvs=document.getElementById('craft-context-canvas');
  const canvases=[cvs,theoryCvs,maneuverCvs,craftCvs].filter(Boolean);
  const palette={bone:'#e4dfcd',joint:'#9ec2bb',lig:'#eab17e',accent:'#54d4c6',other:'#b5a6ca'};
  const V=(x,y,z)=>[x,y,z];
  const models={
    joelho:{title:'Complexo do joelho',intro:'Côndilos femorais, platô tibial e principais estabilizadores — reconhecimento espacial esquemático. As fibrocartilagens têm borda livre fina e periferia espessa.',parts:[
      {id:'femur',name:'Fêmur distal',category:'bone',info:'Côndilos femorais e alargamento metafisário distal.',shape:[['bone',[V(0,1.78,0).concat(.24,.25),V(0,1.36,0).concat(.26,.26),V(0,.91,0).concat(.29,.30),V(0,.65,0).concat(.52,.36)]],['ell',V(-.35,.40,0),V(.39,.39,.45)],['ell',V(.35,.40,0),V(.39,.39,.45)]]},
      {id:'tibia',name:'Tíbia proximal',category:'bone',info:'Platôs tibiais e transição progressiva para a diáfise.',shape:[['ell',V(-.30,-.19,0),V(.37,.15,.44)],['ell',V(.30,-.19,0),V(.37,.15,.44)],['bone',[V(0,-.27,0).concat(.54,.39),V(0,-.48,0).concat(.42,.32),V(0,-.85,0).concat(.27,.27),V(0,-1.72,0).concat(.22,.23)]]]},
      {id:'patela',name:'Patela',category:'joint',info:'Osso sesamoide na face anterior do joelho.',shape:[['ell',V(0,.3,.67),V(.31,.39,.17)]]},
      {id:'lca',name:'Ligamento cruzado anterior',category:'lig',info:'Trajeto simplificado da tíbia anterior ao fêmur lateral.',shape:[['tube',V(-.15,-.05,.20),V(.28,.62,-.17),.07,.06]]},
      {id:'lcp',name:'Ligamento cruzado posterior',category:'lig',info:'Trajeto simplificado da tíbia posterior ao fêmur medial.',shape:[['tube',V(.15,-.09,-.22),V(-.26,.67,.13),.065,.065]]},
      {id:'colaterais',name:'Colaterais medial e lateral',category:'lig',info:'Resistência ao estresse em valgo e varo.',shape:[['tube',V(-.69,.52,0),V(-.67,-.32,0),.075,.065],['tube',V(.73,.48,0),V(.79,-.48,.02),.07,.06]]},
      {id:'meniscos',name:'Meniscos medial e lateral',category:'joint',info:'Crescente fibrocartilaginoso de seção triangular: borda periférica espessa e borda livre fina.',shape:[['meniscus',V(-.31,-.015,0),V(.26,0,.34),.50,5.70,.18,.09],['meniscus',V(.31,-.015,0),V(.26,0,.34),.36,5.85,.18,.09]]},
      {id:'tendao-patelar',name:'Ligamento patelar',category:'other',info:'Continuidade do mecanismo extensor, da patela à tuberosidade da tíbia.',shape:[['tube',V(0,.02,.70),V(0,-.77,.46),.085,.074]]},
      {id:'cabeca-fibula',name:'Cabeça da fíbula',category:'bone',info:'Referência óssea posterolateral para o complexo lateral do joelho.',shape:[['ell',V(.85,-.62,-.13),V(.19,.21,.23)],['bone',[V(.86,-.67,-.13).concat(.14,.16),V(.92,-1.51,-.14).concat(.12,.13)]]]}
    ]},
    ombro:{title:'Complexo do ombro',intro:'Relações volumétricas entre escápula, úmero e tendões do manguito. Modelo intencionalmente simplificado.',parts:[
      {id:'escapula',name:'Escápula / glenoide',category:'bone',info:'Superfície glenoidal e corpo escapular.',shape:[['mesh',[V(-.82,.58,-.32),V(-1.55,-1.25,-.28),V(-.55,-.76,-.15),V(-1.16,.48,-.20)],[[0,1,2],[0,2,3]]],['ell',V(-.55,.28,0),V(.20,.41,.27)]]},
      {id:'umero',name:'Cabeça e diáfise do úmero',category:'bone',info:'Articulação glenoumeral e transição metafisária para a diáfise.',shape:[['ell',V(.16,.24,0),V(.50,.50,.5)],['bone',[V(.29,-.05,0).concat(.29,.28),V(.38,-.40,0).concat(.28,.25),V(.51,-1.05,.01).concat(.22,.21),V(.60,-1.70,.02).concat(.20,.20)]]]},
      {id:'acromio',name:'Acrômio / clavícula',category:'joint',info:'Arco superior ósseo, orientação espacial.',shape:[['tube',V(-1.11,.87,-.23),V(-.15,.92,.18),.11,.10],['tube',V(-.10,.96,.20),V(.58,1.12,.33),.10,.10]]},
      {id:'supra',name:'Supraespinal',category:'lig',info:'Trajeto superior até o tubérculo maior — associado ao teste de Jobe.',shape:[['tube',V(-1.28,.46,-.16),V(.22,.60,.25),.105,.08]]},
      {id:'subescapular',name:'Subescapular',category:'lig',info:'Inserção anterior, associado à rotação interna e ao lift-off.',shape:[['tube',V(-1.10,-.08,.22),V(.02,.18,.49),.15,.10]]},
      {id:'infra',name:'Infraespinal',category:'other',info:'Componente posterior do manguito, rotação externa.',shape:[['tube',V(-1.30,-.50,-.30),V(.11,.20,-.41),.12,.095]]},
      {id:'biceps',name:'Cabeça longa do bíceps',category:'other',info:'Percurso anterior representado esquematicamente.',shape:[['tube',V(.32,.45,.49),V(.70,-1.56,.27),.052,.075]]}
    ]},
    tornozelo:{title:'Tornozelo lateral',intro:'Tíbia, fíbula, tálus, calcâneo e complexo ligamentar lateral — visão de relações gerais.',parts:[
      {id:'tibia',name:'Tíbia distal',category:'bone',info:'Principal superfície de carga da articulação talocrural.',shape:[['bone',[V(-.25,1.8,0).concat(.27,.27),V(-.25,.75,0).concat(.26,.27),V(-.22,.04,0).concat(.32,.31),V(-.22,-.19,0).concat(.39,.37)]],['ell',V(-.20,-.21,0),V(.43,.25,.38)]]},
      {id:'fibula',name:'Fíbula / maléolo lateral',category:'bone',info:'Maléolo lateral, origem dos principais ligamentos laterais.',shape:[['bone',[V(.58,1.60,-.06).concat(.12,.12),V(.60,.45,-.07).concat(.11,.12),V(.62,-.35,-.10).concat(.16,.15),V(.63,-.52,-.10).concat(.16,.16)]],['ell',V(.63,-.50,-.10),V(.16,.23,.18)]]},
      {id:'talus',name:'Tálus',category:'joint',info:'Transmite cargas da perna ao pé.',shape:[['ell',V(-.12,-.58,.09),V(.48,.30,.43)]]},
      {id:'calcaneo',name:'Calcâneo',category:'joint',info:'Osso posterior do retropé.',shape:[['ell',V(-.26,-1.15,-.18),V(.66,.29,.52)]]},
      {id:'ltfa',name:'Talofibular anterior',category:'lig',info:'Ligamento comumente acometido na inversão com flexão plantar.',shape:[['tube',V(.63,-.44,.02),V(.20,-.54,.48),.065,.064]]},
      {id:'lcf',name:'Calcaneofibular',category:'lig',info:'Curso inferoposterior, avaliado em estresse de inclinação talar.',shape:[['tube',V(.64,-.58,-.11),V(.06,-1.19,-.21),.064,.062]]},
      {id:'ltfp',name:'Talofibular posterior',category:'other',info:'Componente posterior, habitualmente menos lesionado.',shape:[['tube',V(.59,-.47,-.18),V(-.03,-.65,-.35),.062,.061]]}
    ]},
    sarcomero:{title:'Sarcômero · microarquitetura',intro:'Filamentos finos e grossos, linhas Z e íons cálcio em uma maquete conceitual. Não reproduz dimensão molecular ou geometria proteica real.',parts:[
      {id:'discos',name:'Discos Z',category:'bone',info:'Limites de uma unidade sarcomérica. Na contração, os discos Z se aproximam.',shape:[['tube',V(-1.55,-.9,-.35),V(-1.55,.9,-.35),.09,.09,1],['tube',V(1.55,-.9,-.35),V(1.55,.9,-.35),.09,.09,-1]]},
      {id:'actina',name:'Filamentos finos · actina',category:'joint',info:'Os filamentos finos deslizam sem encurtar; a sobreposição com a miosina aumenta.',shape:[['tube',V(-1.5,.48,.17),V(.23,.48,.17),.065,.065,1],['tube',V(-1.5,-.48,.17),V(.23,-.48,.17),.065,.065,1],['tube',V(1.5,.48,.17),V(-.23,.48,.17),.065,.065,-1],['tube',V(1.5,-.48,.17),V(-.23,-.48,.17),.065,.065,-1]]},
      {id:'miosina',name:'Filamentos grossos · miosina',category:'lig',info:'Motores ATP-dependentes estabelecem pontes cruzadas com filamentos de actina.',shape:[['tube',V(-.91,.08,0),V(.91,.08,0),.20,.20],['tube',V(-.8,.18,-.1),V(-.5,.43,.15),.045,.045],['tube',V(.2,.18,-.1),V(.5,.43,.15),.045,.045],['tube',V(-.2,-.08,.1),V(-.5,-.43,.15),.045,.045],['tube',V(.8,-.08,.1),V(.5,-.43,.15),.045,.045]]},
      {id:'calcio',name:'Ca²⁺ · sinal regulador',category:'other',info:'Ca²⁺ liga-se à troponina C; aqui as esferas indicam apenas presença espacial aproximada.',shape:[['ell',V(-1.03,.73,.36),V(.10,.10,.10)],['ell',V(-.61,-.75,.44),V(.10,.10,.10)],['ell',V(.45,.78,.38),V(.10,.10,.10)],['ell',V(.99,-.75,.46),V(.10,.10,.10)]]}
    ]},
    fratura:{title:'Fratura · osso e partes moles',intro:'Descontinuidade, desalinhamento, foco ósseo e envelope de tecidos em um corte espacial didático. Não atribui classificação Gustilo.',parts:[
      {id:'osso',name:'Segmentos ósseos',category:'bone',info:'Descontinuidade cortical e relação dos fragmentos, sem correspondência com paciente real.',shape:[['bone',[V(-.13,1.72,0).concat(.30,.31),V(-.13,.84,0).concat(.29,.29),V(-.13,.36,0).concat(.29,.29)]],['ell',V(-.13,1.66,0),V(.36,.25,.38)],['bone',[V(.23,-.18,.12).concat(.29,.28),V(.23,-.87,.12).concat(.28,.28),V(.23,-1.76,.12).concat(.23,.24)]],['ell',V(.23,-1.71,.12),V(.26,.23,.27)]]},
      {id:'foco',name:'Foco / fragmento angular',category:'lig',info:'Zona de ruptura com componente em cunha esquemático. A extensão de dano real exige avaliação clínica e radiológica.',shape:[['mesh',[V(-.47,.35,-.28),V(.38,.33,-.15),V(.14,-.16,.35),V(-.19,-.30,-.19)],[[0,1,2],[0,2,3],[1,2,3],[0,1,3]]],['ell',V(.08,.13,.18),V(.18,.12,.18)]]},
      {id:'partes',name:'Envelope de partes moles',category:'joint',info:'Representação transparente conceitual do tecido circundante; ferida e perfusão são dados clínicos, não inferíveis nesta maquete.',shape:[['ell',V(-.10,.78,-.16),V(.57,.87,.45)],['ell',V(.21,-.82,-.08),V(.55,.94,.45)]]},
      {id:'vasos',name:'Eixo neurovascular',category:'other',info:'Trajeto simbólico para lembrar exame dos pulsos, perfusão e sensibilidade.',shape:[['tube',V(-.59,1.64,-.42),V(-.55,-1.52,-.42),.044,.044]]}
    ]},
    osteomielite:{title:'Osteomielite crônica · anatomia espacial',intro:'Modelo 3D original de sequestro, invólucro e possível via de drenagem. Ao avançar a sequência, o sequestro se afasta para visualização: não representa evolução clínica ou tratamento.',parts:[
      {id:'cortical',name:'Osso cortical · referência',category:'bone',info:'O corpo ósseo é apenas referência topográfica; a geometria não representa uma tomografia.',shape:[['bone',[V(0,1.65,0).concat(.24,.24),V(0,.88,0).concat(.29,.28),V(0,-.75,0).concat(.25,.26),V(0,-1.65,0).concat(.22,.23)]]]},
      {id:'involucro',name:'Invólucro · neoformação óssea',category:'joint',info:'Osso reacional envolvendo uma área de infecção crônica. Os anéis indicam envoltório, sem reproduzir a topografia real.',shape:[['arc',V(0,.66,0),V(.43,0,.42),0,6.28,.052],['arc',V(0,-.04,0),V(.46,0,.43),0,6.28,.055],['arc',V(0,-.76,0),V(.40,0,.40),0,6.28,.051],['tube',V(-.43,.67,0),V(-.4,-.75,0),.044,.044],['tube',V(.43,.67,0),V(.4,-.75,0),.044,.044]]},
      {id:'sequestro',name:'Sequestro · osso necrótico',category:'lig',info:'Fragmento ósseo desvitalizado destacado do osso viável. O movimento é vista explodida, não mobilização real do fragmento.',shape:[['mesh',[V(.23,.52,.24),V(.51,.35,.43),V(.45,-.27,.45),V(.17,-.41,.19),V(.28,.17,.64)],[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,2,1],[0,3,2]]]]},
      {id:'cavidade',name:'Cavidade inflamatória · conceito',category:'other',info:'Volume simbólico para compreender supuração no contexto da infecção; achados variam entre pacientes.',shape:[['ell',V(.20,.13,.16),V(.32,.42,.26)]]},
      {id:'cloaca',name:'Cloaca · abertura cortical',category:'joint',info:'Comunicação possível do foco com o exterior da cortical. Não é achado obrigatório.',shape:[['arc',V(.38,-.35,.36),V(.16,0,.16),-.35,3.2,.045]]},
      {id:'fistula',name:'Trajeto fistuloso · possível',category:'other',info:'Trajeto esquemático de drenagem. Sua presença não é necessária para o diagnóstico de osteomielite crônica.',shape:[['tube',V(.45,-.35,.4),V(1.05,-.46,.72),.085,.057],['tube',V(1.05,-.46,.72),V(1.45,-.62,.83),.057,.034]]}
    ]},
    tumor:{title:'Lesão óssea · leitura espacial',intro:'Maquete abstrata de lesão, reação periosteal e trajeto de biópsia. Formas não correspondem a diagnóstico histológico.',parts:[
      {id:'osso',name:'Osso longo e cortical',category:'bone',info:'O local anatômico e a relação cortical/medular são fundamentais na análise radiográfica.',shape:[['bone',[V(0,1.76,0).concat(.37,.34),V(0,1.16,0).concat(.29,.28),V(0,.10,0).concat(.23,.24),V(0,-.92,0).concat(.27,.28),V(0,-1.6,0).concat(.33,.33)]],['ell',V(0,1.52,0),V(.45,.42,.43)],['ell',V(0,-1.57,0),V(.38,.27,.39)]]},
      {id:'lesao',name:'Área de lesão',category:'lig',info:'Volume abstrato para discutir padrão lítico, margens e zona de transição sem simular uma radiografia.',shape:[['ell',V(.12,.66,.12),V(.47,.49,.40)],['ell',V(-.10,.42,-.15),V(.37,.35,.34)]]},
      {id:'periosteo',name:'Reação da superfície',category:'joint',info:'Traços visuais não classificam reação periosteal nem agressividade.',shape:[['tube',V(.40,.85,0),V(.87,1.16,.12),.037,.014],['tube',V(.40,.65,.20),V(.86,.72,.48),.037,.014],['tube',V(.40,.39,-.03),V(.91,.11,-.12),.037,.014],['tube',V(-.39,.55,0),V(-.86,.60,.29),.037,.014]]},
      {id:'biopsia',name:'Trajeto de biópsia · conceito',category:'other',info:'Linha ilustrativa apenas: a via real é planejada pela equipe que conduzirá o tratamento definitivo.',shape:[['tube',V(1.52,.53,.59),V(.31,.53,.24),.052,.025]]}
    ]}
  };

  // The definitions are shared by the GPU renderer. The Canvas 2D engine is
  // retained solely as a compatibility fallback for browsers without WebGL.
  window.AtlasModelDefinitions=models;
  // A browser may advertise WebGL while blocking canvas context allocation.
  // Keep the interactive 2D compatibility engine for that case.
  let gpuAvailable=false;
  if(window.WebGLRenderingContext){try{gpuAvailable=!!cvs.getContext('webgl')}catch{gpuAvailable=false}}
  if(gpuAvailable)return;
  let current='joelho',selected=null,mesh=[],yaw=.6,pitch=-.12,zoom=1,active=false,auto=false,progress=0,playing=false;
  const toggles={bone:true,lig:true};
  const norm=a=>Math.hypot(...a)||1;
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const triangle=(list,a,b,c)=>list.push([a,b,c]);
  function ellipsoid(list,c,r){const nr=13,nt=18;const vertex=(p,t)=>[c[0]+r[0]*Math.sin(p)*Math.cos(t),c[1]+r[1]*Math.cos(p),c[2]+r[2]*Math.sin(p)*Math.sin(t)];
    for(let i=0;i<nr;i++)for(let j=0;j<nt;j++){const a=vertex(Math.PI*i/nr,Math.PI*2*j/nt),b=vertex(Math.PI*(i+1)/nr,Math.PI*2*j/nt),d=vertex(Math.PI*i/nr,Math.PI*2*(j+1)/nt),e=vertex(Math.PI*(i+1)/nr,Math.PI*2*(j+1)/nt);triangle(list,a,b,d);triangle(list,b,e,d)}
  }
  function tube(list,a,b,r1,r2){const axis=sub(b,a),d=norm(axis),u=axis.map(n=>n/d),base=Math.abs(dot(u,[0,1,0]))>.9?[1,0,0]:[0,1,0];let e=cross(u,base),ed=norm(e);e=e.map(v=>v/ed);const f=cross(u,e),s=14;const ring=(p,r,k)=>p.map((v,i)=>v+r*(Math.cos(k)*e[i]+Math.sin(k)*f[i]));
    for(let j=0;j<s;j++){const t=j*2*Math.PI/s,k=(j+1)*2*Math.PI/s,x=ring(a,r1,t),y=ring(a,r1,k),z=ring(b,r2,t),w=ring(b,r2,k);triangle(list,x,y,z);triangle(list,y,w,z);triangle(list,a,y,x);triangle(list,b,z,w)}
  }
  function arc(list,c,r,start,end,thickness){const point=t=>[c[0]+r[0]*Math.cos(t),c[1],c[2]+r[2]*Math.sin(t)];let old=point(start);const slices=28;for(let i=1;i<=slices;i++){const p=point(start+(end-start)*i/slices);tube(list,old,p,thickness,thickness);old=p}}
  function bone(list,sections){const n=18;const point=(s,t)=>[s[0]+s[3]*Math.cos(t),s[1],s[2]+s[4]*Math.sin(t)];for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){const t=j*Math.PI*2/n,k=(j+1)*Math.PI*2/n;const a=point(sections[i],t),b=point(sections[i],k),c=point(sections[i+1],t),d=point(sections[i+1],k);triangle(list,a,b,c);triangle(list,b,d,c)}for(let j=0;j<n;j++){const t=j*Math.PI*2/n,k=(j+1)*Math.PI*2/n;triangle(list,sections[0].slice(0,3),point(sections[0],k),point(sections[0],t));const end=sections[sections.length-1];triangle(list,end.slice(0,3),point(end,t),point(end,k))}}
  function meniscus(list,c,r,start,end,width,thickness){const ring=t=>{const point=(offset,h)=>[c[0]+(r[0]+offset)*Math.cos(t),c[1]+h,c[2]+(r[2]+offset)*Math.sin(t)];return [point(-width*.54,0),point(width*.45,thickness),point(width*.45,-thickness*.68)]};let prev=ring(start);triangle(list,...prev);for(let i=1;i<=36;i++){const next=ring(start+(end-start)*i/36);for(let k=0;k<3;k++){const j=(k+1)%3;triangle(list,prev[k],prev[j],next[k]);triangle(list,prev[j],next[j],next[k])}prev=next}triangle(list,prev[2],prev[1],prev[0])}
  function build(){mesh=[];const d=models[current];for(const part of d.parts){let triangles=[];for(const sh of part.shape){const before=triangles.length;if(sh[0]==='ell')ellipsoid(triangles,sh[1],sh[2]);if(sh[0]==='tube')tube(triangles,sh[1],sh[2],sh[3],sh[4]);if(sh[0]==='arc')arc(triangles,sh[1],sh[2],sh[3],sh[4],sh[5]);if(sh[0]==='bone')bone(triangles,sh[1]);if(sh[0]==='meniscus')meniscus(triangles,...sh.slice(1));if(sh[0]==='mesh')for(const face of sh[2])triangle(triangles,...face.map(i=>sh[1][i]));if(sh[0]==='tube'&&sh[5])for(let i=before;i<triangles.length;i++)triangles[i].motionSide=sh[5]}
    mesh.push({part,triangles});}
  }
  function applyMotion(p,part,side=0){const q=[...p];
    if(current==='joelho'&&['tibia','meniscos','cabeca-fibula'].includes(part.id))q[2]+=.36*progress;
    if(current==='sarcomero'&&['actina','discos'].includes(part.id))q[0]+=side*.31*progress;
    if(current==='ombro'&&['umero','biceps'].includes(part.id)){
      const a=.48*progress,c=Math.cos(a),s=Math.sin(a),x=q[0]-.16,y=q[1]-.24;
      q[0]=.16+x*c-y*s;q[1]=.24+x*s+y*c;
    }
    if(current==='tornozelo'&&part.id==='talus'){q[0]+=.17*progress;q[2]+=.18*progress}
    if(current==='fratura'&&part.id==='foco'){q[0]+=.12*progress;q[1]-=.19*progress}
    if(current==='osteomielite'&&part.id==='sequestro'){q[0]+=.32*progress;q[2]+=.33*progress}
    return q;
  }
  function rotate(p){const c=Math.cos(yaw),s=Math.sin(yaw),cy=Math.cos(pitch),sy=Math.sin(pitch);const x=p[0]*c+p[2]*s,z=-p[0]*s+p[2]*c;return [x,p[1]*cy-z*sy,p[1]*sy+z*cy]}
  function viewport(canvas){const rect=canvas.getBoundingClientRect();if(rect.width<20||rect.height<20)return null;const ratio=Math.min(devicePixelRatio||1,2);const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return {w,h,ratio}}
  function drawOne(canvas){const size=viewport(canvas);if(!size)return;const ctx=canvas.getContext('2d'),{w,h}=size;ctx.clearRect(0,0,w,h);const scale=Math.min(w,h)*.25*zoom;
    const proj=p=>{const f=6.5/(6.5-p[2]);return [w/2+p[0]*scale*f,h/2-p[1]*scale*f]};
    ctx.strokeStyle='#74adb626';ctx.lineWidth=1;for(let r=1;r<6;r++){ctx.beginPath();ctx.ellipse(w/2,h/2,scale*.65*r,scale*.19*r,0,0,Math.PI*2);ctx.stroke()}
    ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.strokeStyle='#69a8b020';ctx.stroke();
    const faces=[];for(const {part,triangles} of mesh){if(part.category==='bone'&&!toggles.bone)continue;if(part.category!=='bone'&&!toggles.lig)continue;for(const tri of triangles){const rt=tri.map(p=>rotate(applyMotion(p,part,tri.motionSide))),z=(rt[0][2]+rt[1][2]+rt[2][2])/3;faces.push({part,p:rt,z})}}
    faces.sort((a,b)=>a.z-b.z);
    const light=[-.35,.62,.73],ln=norm(light),l=light.map(v=>v/ln);
    for(const face of faces){const [a,b,c]=face.p,na=cross(sub(b,a),sub(c,a)),n=norm(na),diff=Math.abs(dot(na,l)/n);const strength=.55+diff*.43;const base=palette[face.part.category]||palette.joint;const rgb=[1,3,5].map(i=>parseInt(base.slice(i,i+2),16));const col=rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*strength))));const chosen=selected===face.part.id;
      ctx.globalAlpha=selected&&!chosen?.23:face.part.category==='bone'?.96:.95;
      ctx.fillStyle=`rgb(${col.join(',')})`;const pa=proj(a),pb=proj(b),pc=proj(c);ctx.beginPath();ctx.moveTo(...pa);ctx.lineTo(...pb);ctx.lineTo(...pc);ctx.closePath();ctx.fill();if(chosen){ctx.strokeStyle='#e8fffca0';ctx.lineWidth=.55*devicePixelRatio;ctx.stroke()}
    }
    ctx.globalAlpha=1;ctx.fillStyle='#8eb6c6';ctx.font=`${10*Math.min(devicePixelRatio||1,2)}px DM Sans, sans-serif`;
    ctx.textAlign='center';ctx.fillText('MODELO ESPACIAL · NÃO ESTÁ EM ESCALA',w/2,h-14*Math.min(devicePixelRatio||1,2));
  }
  function draw(){if(!active)return;canvases.forEach(drawOne)}
  function renderPanel(){const d=models[current];document.getElementById('model-title').textContent=d.title;document.getElementById('model-intro').textContent=d.intro;
    document.getElementById('structure-list').innerHTML=d.parts.map(part=>`<button class="structure-item ${part.id===selected?'active':''}" data-part="${part.id}" aria-pressed="${part.id===selected}"><strong><span class="structure-dot" style="background:${palette[part.category]}"></span>${part.name}</strong><p>${part.info}</p></button>`).join('');
    document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{selected=selected===b.dataset.part?null:b.dataset.part;renderPanel();draw()});
  }
  function syncControls(){document.querySelectorAll('[data-3d-progress]').forEach(el=>el.value=Math.round(progress*100));document.querySelectorAll('[data-3d-play]').forEach(el=>{el.textContent=playing?'Pausar':'Reproduzir';el.setAttribute('aria-pressed',String(playing))});document.querySelectorAll('[data-3d-phase]').forEach(el=>el.textContent=`${Math.round(progress*100)}%`);const labels={joelho:['Joelho em repouso','Translação tibial · simulação','Deslocamento máximo'],ombro:['Posição inicial','Elevação simplificada','Amplitude ilustrativa'],tornozelo:['Posição inicial','Deslocamento esquemático','Fim da sequência'],sarcomero:['Sobreposição inicial','Deslizamento dos filamentos','Linhas Z aproximadas'],fratura:['Foco inicial','Visualização do deslocamento','Fragmento deslocado'],osteomielite:['Relações anatômicas','Sequestro destacado para estudar','Vista explodida máxima'],tumor:['Avalie a localização','Compare a superfície','Planeje a investigação']};const stage=progress<.16?0:progress<.78?1:2;document.querySelectorAll('[data-3d-caption]').forEach(el=>el.textContent=(labels[current]||[])[stage]||'Exploração tridimensional')}
  function setProgress(p){progress=Math.min(1,Math.max(0,p));syncControls();draw()}
  function setModel(m){if(!models[m])return;current=m;selected=null;yaw=.62;pitch=-.13;zoom=1;progress=0;playing=false;build();renderPanel();syncControls();document.querySelectorAll('[data-model]').forEach(b=>b.classList.toggle('active',b.dataset.model===m));draw()}
  const pointers=new Map();let oldDist=0;
  for(const canvas of canvases){
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);oldDist=0});
    canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);const p=[...pointers.values()];if(p.length===1){yaw+=(e.clientX-old[0])*.009;pitch=Math.max(-1.2,Math.min(1.2,pitch+(e.clientY-old[1])*.008))}else if(p.length===2){const dist=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(oldDist)zoom=Math.min(2.5,Math.max(.5,zoom*dist/oldDist));oldDist=dist}draw()});
    const release=e=>{pointers.delete(e.pointerId);oldDist=0};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(2.5,Math.max(.5,zoom*(e.deltaY>0?.92:1.08)));draw()},{passive:false});
    canvas.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch-=.12;if(e.key==='ArrowDown')pitch+=.12;draw()}});
  }
  document.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>setModel(b.dataset.model));
  document.getElementById('bones-toggle').onchange=e=>{toggles.bone=e.target.checked;draw()};
  document.getElementById('ligaments-toggle').onchange=e=>{toggles.lig=e.target.checked;draw()};
  document.getElementById('auto-rotate').onchange=e=>{auto=e.target.checked};
  const resetView=()=>{selected=null;yaw=.62;pitch=-.13;zoom=1;renderPanel();draw()};
  document.getElementById('reset-view').onclick=resetView;
  document.getElementById('export-model').onclick=()=>{
    let vertex=1;const lines=[`# Atlas Vivo UCT20 - ${current} (esquema 3D, fora de escala)`, '# Criado por JBFS · não usar como referência anatômica ou planejamento clínico'];
    for(const {part,triangles} of mesh){lines.push(`g ${part.id}`);for(const tri of triangles){for(const p of tri)lines.push(`v ${p.map(v=>v.toFixed(6)).join(' ')}`);lines.push(`f ${vertex} ${vertex+1} ${vertex+2}`);vertex+=3}}
    const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`atlas-vivo-${current}-esquematico.obj`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  if('ResizeObserver'in window){const observer=new ResizeObserver(()=>draw());canvases.forEach(c=>observer.observe(c))}
  document.addEventListener('click',e=>{if(e.target.closest('[data-3d-play]')){playing=!playing;syncControls()}});
  document.addEventListener('input',e=>{if(e.target.matches('[data-3d-progress]')){playing=false;setProgress(Number(e.target.value)/100)}});
  let last=0;function animate(now){const dt=Math.min(.065,(now-last)/1000||0);last=now;if(active&&(auto||playing)&&!matchMedia('(prefers-reduced-motion:reduce)').matches){if(auto)yaw+=dt*.21;if(playing){progress+=dt*.25;if(progress>1)progress=0;syncControls()}draw()}requestAnimationFrame(animate)}requestAnimationFrame(animate);
  build();renderPanel();syncControls();
  window.AtlasModel3D={activate(){active=true;draw()},deactivate(){active=false},draw,setModel,setProgress,resetView,selectPart(id){selected=id;renderPanel();draw()},play(){playing=true;syncControls()},stop(){playing=false;syncControls()}};
})();
