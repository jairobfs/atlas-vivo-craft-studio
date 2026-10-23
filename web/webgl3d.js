/* Atlas Vivo · GPU anatomy renderer. The geometry is an educational schematic,
   never a validated patient model. Every triangle is rendered with real 3D
   depth-testing, surface illumination and per-structure object selection. */
(() => {
  'use strict';
  if (!window.WebGLRenderingContext || !window.AtlasModelDefinitions) return;
  const models=window.AtlasModelDefinitions;
  const surfaces=['model-canvas','theory-canvas','maneuver-canvas','craft-context-canvas']
    .map(id=>document.getElementById(id)).filter(Boolean);
  const colors={bone:[.86,.83,.73],joint:[.37,.68,.67],lig:[.94,.52,.34],accent:[.18,.81,.78],other:[.55,.48,.7]};
  const vs=`
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute float aMotionSide;
    uniform float uYaw,uPitch,uZoom,uAspect,uProgress;
    uniform int uMotion;
    varying vec3 vNormal;
    void main(){
      vec3 p=aPosition;
      if(uMotion==1){p.z+=.36*uProgress;}
      if(uMotion==2){p.x+=aMotionSide*.31*uProgress;}
      if(uMotion==3){float a=.48*uProgress;vec2 r=p.xy-vec2(.16,.24);p.xy=vec2(.16,.24)+vec2(r.x*cos(a)-r.y*sin(a),r.x*sin(a)+r.y*cos(a));}
      if(uMotion==4){p.x+=.17*uProgress; p.z+=.18*uProgress;}
      if(uMotion==5){p.x+=.12*uProgress; p.y-=.19*uProgress;}
      if(uMotion==6){p.x+=.32*uProgress; p.z+=.33*uProgress;}
      float c=cos(uYaw),s=sin(uYaw),d=cos(uPitch),t=sin(uPitch);
      p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
      p=vec3(p.x,p.y*d-p.z*t,p.y*t+p.z*d);
      vec3 n=vec3(aNormal.x*c+aNormal.z*s,aNormal.y,-aNormal.x*s+aNormal.z*c);
      vNormal=normalize(vec3(n.x,n.y*d-n.z*t,n.y*t+n.z*d));
      p*=uZoom;
      float depth=6.7-p.z;
      gl_Position=vec4(p.x*3.05/uAspect,p.y*3.05,1.01005*depth-.3015,depth);
    }`;
  const fs=`
    precision mediump float;
    uniform vec3 uColor;
    uniform vec3 uPick;
    uniform bool uPicking;
    uniform float uDim;
    varying vec3 vNormal;
    void main(){
      if(uPicking){gl_FragColor=vec4(uPick,1.);return;}
      float light=.34+.66*abs(dot(normalize(vNormal),normalize(vec3(-.38,.82,.65))));
      vec3 base=uColor*(.20+.8*light)*uDim;
      gl_FragColor=vec4(pow(base,vec3(.91)),1.);
    }`;
  const compile=(gl,type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader};
  function init(canvas){
    let gl;
    try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true})}catch{}
    if(!gl)return null;
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
    gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.enableVertexAttribArray(gl.getAttribLocation(program,'aPosition'));
    gl.enableVertexAttribArray(gl.getAttribLocation(program,'aNormal'));
    gl.enableVertexAttribArray(gl.getAttribLocation(program,'aMotionSide'));
    const keys=['uYaw','uPitch','uZoom','uAspect','uProgress','uMotion','uColor','uPick','uPicking','uDim'];
    const u=Object.fromEntries(keys.map(k=>[k,gl.getUniformLocation(program,k)]));
    return {canvas,gl,program,u,position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),motionSide:gl.getAttribLocation(program,'aMotionSide')};
  }
  const contexts=surfaces.map(init).filter(Boolean);
  if(!contexts.length)return;
  const V=(x,y,z)=>[x,y,z], minus=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const magnitude=a=>Math.hypot(...a)||1,unit=a=>a.map(v=>v/magnitude(a));
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  function trianglesFor(shape){
    const faces=[];
    const tri=(a,b,c,side=0)=>faces.push([a,b,c,side]);
    const ell=(center,r)=>{const lat=24,lon=32;
      const point=(i,j)=>[center[0]+r[0]*Math.sin(Math.PI*i/lat)*Math.cos(2*Math.PI*j/lon),center[1]+r[1]*Math.cos(Math.PI*i/lat),center[2]+r[2]*Math.sin(Math.PI*i/lat)*Math.sin(2*Math.PI*j/lon)];
      for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const a=point(i,j),b=point(i+1,j),c=point(i,j+1),d=point(i+1,j+1);tri(a,b,c);tri(b,d,c)}
    };
    const tube=(a,b,ra,rb,side=0)=>{
      const axis=unit(minus(b,a));const ref=Math.abs(dot(axis,[0,1,0]))>.9?[1,0,0]:[0,1,0];
      const n=unit(cross(axis,ref)),m=cross(axis,n),steps=18;
      const point=(origin,r,angle)=>origin.map((v,k)=>v+r*(Math.cos(angle)*n[k]+Math.sin(angle)*m[k]));
      for(let j=0;j<steps;j++){
        const t=j*2*Math.PI/steps,k=(j+1)*2*Math.PI/steps;
        const x=point(a,ra,t),y=point(a,ra,k),z=point(b,rb,t),w=point(b,rb,k);
        tri(x,y,z,side);tri(y,w,z,side);tri(a,y,x,side);tri(b,z,w,side);
      }
    };
    // Contoured shafts give bony landmarks a gentle metaphyseal flare rather
    // than the same circular cylinder along the complete length.
    const bone=(sections)=>{
      const segments=28;
      const point=(s,t)=>[s[0]+s[3]*Math.cos(t),s[1],s[2]+s[4]*Math.sin(t)];
      for(let i=0;i<sections.length-1;i++)for(let j=0;j<segments;j++){
        const a=point(sections[i],j*Math.PI*2/segments),b=point(sections[i],(j+1)*Math.PI*2/segments);
        const c=point(sections[i+1],j*Math.PI*2/segments),d=point(sections[i+1],(j+1)*Math.PI*2/segments);
        tri(a,b,c);tri(b,d,c);
      }
      for(let j=0;j<segments;j++){
        const t=j*Math.PI*2/segments,next=(j+1)*Math.PI*2/segments;
        tri(sections[0].slice(0,3),point(sections[0],next),point(sections[0],t));
        const end=sections[sections.length-1];tri(end.slice(0,3),point(end,t),point(end,next));
      }
    };
    // A C-shaped fibrocartilage with a thin free edge and a thick peripheral
    // rim. Dimensions are schematic; it is not a scanned anatomical surface.
    const meniscus=(center,r,start,end,width,thickness)=>{
      const sections=56;
      const ring=t=>{
        const point=(offset,height)=>[center[0]+(r[0]+offset)*Math.cos(t),center[1]+height,center[2]+(r[2]+offset)*Math.sin(t)];
        return [point(-width*.54,0),point(width*.45,thickness),point(width*.45,-thickness*.68)];
      };
      let prev=ring(start);
      tri(prev[0],prev[1],prev[2]);
      for(let i=1;i<=sections;i++){
        const next=ring(start+(end-start)*i/sections);
        for(let k=0;k<3;k++){const j=(k+1)%3;tri(prev[k],prev[j],next[k]);tri(prev[j],next[j],next[k])}
        prev=next;
      }
      tri(prev[2],prev[1],prev[0]);
    };
    for(const item of shape){
      if(item[0]==='ell')ell(item[1],item[2]);
      if(item[0]==='tube')tube(item[1],item[2],item[3],item[4],item[5]||0);
      if(item[0]==='bone')bone(item[1]);
      if(item[0]==='meniscus')meniscus(...item.slice(1));
      if(item[0]==='arc'){
        const [,center,r,start,end,thickness]=item;
        const point=t=>V(center[0]+r[0]*Math.cos(t),center[1],center[2]+r[2]*Math.sin(t));
        let prev=point(start);for(let i=1;i<=40;i++){const next=point(start+(end-start)*i/40);tube(prev,next,thickness,thickness);prev=next}
      }
      if(item[0]==='mesh')for(const ids of item[2])tri(...ids.map(i=>item[1][i]));
    }
    const verts=[];
    for(const [a,b,c,side] of faces){const normal=unit(cross(minus(b,a),minus(c,a)));for(const v of [a,b,c])verts.push(...v,...normal,side)}
    return new Float32Array(verts);
  }
  let model='joelho',selected=null,yaw=.63,pitch=-.12,zoom=1,progress=0,playing=false,rotation=false,active=false;
  let objects=[];
  function build(){
    for(const surface of contexts)for(const obj of objects)surface.gl.deleteBuffer(obj.buffers.get(surface.gl));
    objects=models[model].parts.map((part,i)=>{
      const vertices=trianglesFor(part.shape),buffers=new Map();
      for(const surface of contexts){const gl=surface.gl,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);buffers.set(gl,buf)}
      return {part,index:i+1,vertices,buffers,count:vertices.length/7};
    });
  }
  function motion(part){
    if(model==='joelho'&&(part.id==='tibia'||part.id==='meniscos'||part.id==='cabeca-fibula'))return 1;
    if(model==='sarcomero'&&(part.id==='actina'||part.id==='discos'))return 2;
    if(model==='ombro'&&(part.id==='umero'||part.id==='biceps'))return 3;
    if(model==='tornozelo'&&part.id==='talus')return 4;
    if(model==='fratura'&&part.id==='foco')return 5;
    if(model==='osteomielite'&&part.id==='sequestro')return 6;
    return 0;
  }
  function drawSurface(surface,picking=false){
    const {canvas,gl,u}=surface,rect=canvas.getBoundingClientRect();
    if(rect.width<20||rect.height<20)return;
    const ratio=Math.min(window.devicePixelRatio||1,2),w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(surface.program);gl.uniform1f(u.uYaw,yaw);gl.uniform1f(u.uPitch,pitch);
    gl.uniform1f(u.uZoom,zoom);gl.uniform1f(u.uAspect,w/h);gl.uniform1f(u.uProgress,progress);
    gl.uniform1i(u.uPicking,picking?1:0);gl.disable(gl.BLEND);
    for(const obj of objects){
      const {part,index,buffers,count}=obj;
      if(part.category==='bone'&&!toggles.bone)continue;
      if(part.category!=='bone'&&!toggles.lig)continue;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers.get(gl));gl.vertexAttribPointer(surface.position,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(surface.normal,3,gl.FLOAT,false,28,12);gl.vertexAttribPointer(surface.motionSide,1,gl.FLOAT,false,28,24);
      const base=colors[part.category]||colors.joint;
      const chosen=selected===part.id;
      gl.uniform3fv(u.uColor,chosen?[.20,.95,.83]:base);
      gl.uniform1f(u.uDim,selected&&!chosen?.36:chosen?1.2:1);
      gl.uniform1i(u.uMotion,motion(part));
      gl.uniform3f(u.uPick,index/255,0,0);
      gl.drawArrays(gl.TRIANGLES,0,count);
    }
  }
  function draw(){if(!active)return;contexts.forEach(surface=>drawSurface(surface))}
  function pick(surface,x,y){
    drawSurface(surface,true);const {gl,canvas}=surface,rect=canvas.getBoundingClientRect();
    const px=Math.max(0,Math.min(canvas.width-1,Math.round((x-rect.left)/rect.width*canvas.width)));
    const py=Math.max(0,Math.min(canvas.height-1,Math.round((rect.bottom-y)/rect.height*canvas.height)));
    const pixel=new Uint8Array(4);gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    selected=objects.find(o=>o.index===pixel[0])?.part.id||null;
    renderPanel();draw();
  }
  function renderPanel(){
    const data=models[model];
    document.getElementById('model-title').textContent=data.title;
    document.getElementById('model-intro').textContent=data.intro;
    document.getElementById('structure-list').innerHTML=data.parts.map(part=>
      `<button class="structure-item ${part.id===selected?'active':''}" data-part="${part.id}" aria-pressed="${part.id===selected}"><strong><span class="structure-dot" style="background:${toHex(colors[part.category]||colors.joint)}"></span>${part.name}</strong><p>${part.info}</p></button>`).join('');
    document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>selectPart(b.dataset.part===selected?null:b.dataset.part));
    const part=data.parts.find(p=>p.id===selected);
    document.querySelectorAll('.canvas-structure-caption').forEach(el=>{el.textContent=part?`${part.name} · ${part.info}`:'Toque uma estrutura para identificá-la';el.classList.toggle('has-selection',!!part)});
  }
  function toHex(v){return '#'+v.map(n=>Math.round(n*255).toString(16).padStart(2,'0')).join('')}
  function selectPart(id){selected=id;renderPanel();draw()}
  function setModel(name){if(!models[name])return;model=name;selected=null;progress=0;playing=false;build();renderPanel();syncControls();document.querySelectorAll('[data-model]').forEach(b=>b.classList.toggle('active',b.dataset.model===name));draw()}
  const toggles={bone:true,lig:true};
  function syncControls(){
    document.querySelectorAll('[data-3d-progress]').forEach(el=>{el.value=Math.round(progress*100);el.setAttribute('aria-valuetext',`${Math.round(progress*100)}% da sequência`)});
    document.querySelectorAll('[data-3d-play]').forEach(b=>{b.textContent=playing?'Pausar':'Reproduzir';b.setAttribute('aria-pressed',String(playing))});
    const labels={joelho:['Joelho em repouso','Translação tibial · simulação','Deslocamento máximo'],ombro:['Posição inicial','Elevação simplificada','Amplitude ilustrativa'],tornozelo:['Posição inicial','Deslocamento esquemático','Fim da sequência'],sarcomero:['Sobreposição inicial','Deslizamento dos filamentos','Linhas Z aproximadas'],fratura:['Foco inicial','Visualização do deslocamento','Fragmento deslocado'],osteomielite:['Relações anatômicas','Sequestro destacado para estudar','Vista explodida máxima'],tumor:['Avalie a localização','Compare a superfície','Planeje a investigação']};
    const stage=progress<.16?0:progress<.78?1:2;
    document.querySelectorAll('[data-3d-phase]').forEach(el=>{el.textContent=`${Math.round(progress*100)}%`;el.title=(labels[model]||[])[stage]||'';el.setAttribute('aria-label',el.title)});
    document.querySelectorAll('[data-3d-caption]').forEach(el=>el.textContent=(labels[model]||[])[stage]||'Exploração tridimensional');
  }
  function setProgress(value){progress=Math.max(0,Math.min(1,value));syncControls();draw()}
  function resetView(){selected=null;yaw=.63;pitch=-.12;zoom=1;renderPanel();draw()}
  for(const surface of contexts){
    const {canvas}=surface,points=new Map();let moved=false,oldDist=0;
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture(event.pointerId);points.set(event.pointerId,[event.clientX,event.clientY]);moved=false;oldDist=0});
    canvas.addEventListener('pointermove',event=>{
      if(!points.has(event.pointerId))return;
      const old=points.get(event.pointerId);points.set(event.pointerId,[event.clientX,event.clientY]);
      const arr=[...points.values()];
      if(Math.hypot(event.clientX-old[0],event.clientY-old[1])>1)moved=true;
      if(arr.length===1){yaw+=(event.clientX-old[0])*.009;pitch=Math.max(-1.4,Math.min(1.4,pitch+(event.clientY-old[1])*.008))}
      if(arr.length===2){const dist=Math.hypot(arr[0][0]-arr[1][0],arr[0][1]-arr[1][1]);if(oldDist)zoom=Math.max(.48,Math.min(2.6,zoom*dist/oldDist));oldDist=dist}
      draw();
    });
    canvas.addEventListener('pointerup',event=>{if(!moved&&points.size===1)pick(surface,event.clientX,event.clientY);points.delete(event.pointerId);oldDist=0});
    canvas.addEventListener('pointercancel',event=>points.delete(event.pointerId));
    canvas.addEventListener('wheel',event=>{event.preventDefault();zoom=Math.max(.48,Math.min(2.6,zoom*(event.deltaY>0?.91:1.09)));draw()},{passive:false});
    canvas.addEventListener('keydown',event=>{if(!event.key.startsWith('Arrow'))return;event.preventDefault();yaw+=event.key==='ArrowLeft'?-.12:event.key==='ArrowRight'?.12:0;pitch+=event.key==='ArrowUp'?.12:event.key==='ArrowDown'?-.12:0;draw()});
    const label=document.createElement('div');label.className='canvas-structure-caption';label.textContent='Toque uma estrutura para identificá-la';canvas.parentNode.appendChild(label);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;label.textContent='Renderização interrompida. Recarregue esta página.'});
  }
  document.querySelectorAll('[data-model]').forEach(button=>button.onclick=()=>setModel(button.dataset.model));
  document.getElementById('bones-toggle').onchange=e=>{toggles.bone=e.target.checked;draw()};
  document.getElementById('ligaments-toggle').onchange=e=>{toggles.lig=e.target.checked;draw()};
  document.getElementById('auto-rotate').onchange=e=>rotation=e.target.checked;
  document.getElementById('reset-view').onclick=resetView;
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-3d-play]');if(btn){playing=!playing;syncControls()}});
  document.addEventListener('input',e=>{if(e.target.matches('[data-3d-progress]')){playing=false;setProgress(Number(e.target.value)/100)}});
  document.getElementById('export-model').onclick=()=>{
    let i=1;const lines=[`# Atlas Vivo · ${model}: modelo didático fora de escala`, '# Criado por JBFS · não usar para planejamento clínico'];
    for(const obj of objects){lines.push(`g ${obj.part.id}`);const data=obj.vertices;for(let n=0;n<data.length;n+=21){for(let k=0;k<21;k+=7)lines.push(`v ${Array.from(data.slice(n+k,n+k+3)).map(x=>x.toFixed(6)).join(' ')}`);lines.push(`f ${i} ${i+1} ${i+2}`);i+=3}}
    const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`atlas-vivo-${model}-3d.obj`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
  };
  if('ResizeObserver'in window){const observer=new ResizeObserver(()=>draw());contexts.forEach(c=>observer.observe(c.canvas))}
  let last=0;function animate(now){
    const dt=Math.min(.065,(now-last)/1000||0);last=now;
    if(active&&(playing||rotation)&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      if(rotation||(playing&&model==='tumor'))yaw+=dt*.21;
      if(playing){progress+=dt*.25;if(progress>1)progress=0;syncControls()}
      draw();
    }
    requestAnimationFrame(animate);
  }
  build();renderPanel();syncControls();requestAnimationFrame(animate);
  window.AtlasModel3D={activate(){active=true;draw()},deactivate(){active=false},draw,setModel,resetView,selectPart,setProgress,play(){playing=true;syncControls()},stop(){playing=false;syncControls()}};
})();
