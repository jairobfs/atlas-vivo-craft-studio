(()=>{'use strict';
const B={
S:{H:[120,26],N:[120,44],P:[120,92],a:[104,48,96,74,92,98],b:[136,48,144,74,148,98],c:[112,92,110,120,109,146,104,152],d:[128,92,130,120,131,146,136,152],w:36,e:'f'},
D:{H:[110,26],N:[110,44],P:[110,92],a:[110,48,114,74,120,96],b:[110,48,106,74,108,96],c:[110,92,111,120,110,146,124,152],d:[110,92,108,120,107,146,121,152],w:26,e:'f'},
L:{H:[36,104],N:[54,104],P:[108,106],a:[56,108,84,110,110,110],b:[56,106,82,108,108,108],c:[110,104,150,104,190,104,204,98],d:[110,106,150,106,190,106,204,100],w:22,e:'b'},
E:{H:[100,30],N:[100,48],P:[100,92],a:[100,52,104,76,128,92],b:[100,52,102,76,126,94],c:[100,94,150,94,152,140,166,142],d:[100,96,148,96,150,142,164,144],w:28,e:'c'}};
const SK=['#d9a07a','#efc4a4'],SF=['#b5815f','#cc9a79'],SH=['#254a8a','#3a65b0'],SO=['#1b2a4a','#2a3f6a'];
function sg(a,b,w1,w2,c){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,s=(-.6*nx-.8*ny)>0?1:-1;
 const q=(w,k,o)=>{const u=w*k/2,v=s*o;return [[a[0]+nx*(u+v*w1),a[1]+ny*(u+v*w1)],[b[0]+nx*(u+v*w2),b[1]+ny*(u+v*w2)],[b[0]+nx*(-u+v*w2),b[1]+ny*(-u+v*w2)],[a[0]+nx*(-u+v*w1),a[1]+ny*(-u+v*w1)]]};
 const P=p=>p.map(z=>z[0].toFixed(1)+','+z[1].toFixed(1)).join(' ');
 const h=[[a[0]+nx*s*w1*.2,a[1]+ny*s*w1*.2],[b[0]+nx*s*w2*.2,b[1]+ny*s*w2*.2]];
 const hp=[[h[0][0]+nx*w1*.2,h[0][1]+ny*w1*.2],[h[1][0]+nx*w2*.2,h[1][1]+ny*w2*.2],[h[1][0]-nx*w2*.2,h[1][1]-ny*w2*.2],[h[0][0]-nx*w1*.2,h[0][1]-ny*w1*.2]];
 return '<polygon points="'+P(q(1,2,0).map(z=>z))+'" fill="'+c[0]+'"/>'.replace('',''),
 '';}
function seg(a,b,w1,w2,c){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,s=(-.6*nx-.8*ny)>0?1:-1;
 const pt=(p,w,k)=>[(p[0]+nx*w*k).toFixed(1),(p[1]+ny*w*k).toFixed(1)];
 const poly=(w1k,w2k,o1,o2,f)=>{const A=[a[0]+nx*s*o1,a[1]+ny*s*o1],Bp=[b[0]+nx*s*o2,b[1]+ny*s*o2];
  return '<polygon points="'+[pt(A,w1,w1k),pt(Bp,w2,w2k),pt(Bp,w2,-w2k),pt(A,w1,-w1k)].join(' ')+'" fill="'+f+'"/>'};
 return '<circle cx="'+a[0]+'" cy="'+a[1]+'" r="'+w1/2+'" fill="'+c[0]+'"/><circle cx="'+b[0]+'" cy="'+b[1]+'" r="'+w2/2+'" fill="'+c[0]+'"/>'+poly(.5,.5,0,0,c[0])+poly(.2,.2,w1*.2,w2*.2,c[1])}
const lp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
function arm(A,sk){const sh=[A[0],A[1]],el=[A[2],A[3]],wr=[A[4],A[5]];let tp=A.length>6?[A[6],A[7]]:null;
 if(!tp){const dx=wr[0]-el[0],dy=wr[1]-el[1],l=Math.hypot(dx,dy)||1;tp=[wr[0]+dx/l*11,wr[1]+dy/l*11]}
 return seg(sh,el,11,9,sk)+seg(el,wr,9,7,sk)+seg(wr,tp,8,6,sk)+seg(sh,lp(sh,el,.42),12,11,SH)}
function leg(L,sk){const h=[L[0],L[1]],k=[L[2],L[3]],a=[L[4],L[5]],t=[L[6],L[7]];
 return seg(h,k,18,13,sk)+seg(k,a,13,8,sk)+seg(a,t,9,7,['#dfe6f2','#fff'])+seg(h,lp(h,k,.5),20,16,SO)}
function env(e){return e=='b'?'<rect class="env" x="8" y="118" width="224" height="9" rx="3"/><rect class="env2" x="20" y="127" width="6" height="26"/><rect class="env2" x="214" y="127" width="6" height="26"/>':
 e=='c'?'<rect class="env" x="82" y="100" width="76" height="7" rx="3"/><rect class="env2" x="88" y="107" width="6" height="46"/><rect class="env2" x="146" y="107" width="6" height="46"/><rect class="env" x="70" y="52" width="8" height="50" rx="3"/>':
 '<rect class="env" x="10" y="154" width="220" height="3" rx="1"/>'}
function draw(p){const f=p.w;return env(p.e)+leg(p.d,SF)+arm(p.b,SF)+seg(p.N,p.P,f,f*.78,SH)+seg(lp(p.P,p.N,.12),p.P,f*.8,f*.78,SO)+leg(p.c,SK)+arm(p.a,SK)+
 seg(p.H,p.N,9,10,SK)+'<circle cx="'+p.H[0]+'" cy="'+p.H[1]+'" r="11" fill="'+SK[0]+'"/><path d="M'+(p.H[0]-11)+' '+(p.H[1]-1)+'A11 11 0 0 1 '+(p.H[0]+11)+' '+(p.H[1]-1)+'Q'+p.H[0]+' '+(p.H[1]-8)+' '+(p.H[0]-11)+' '+(p.H[1]-1)+'" fill="#2a1d17"/>'}

const M=(b,o)=>{const r=JSON.parse(JSON.stringify(b));for(const k in o)r[k]=o[k];return r};
const mix=(A,T,u)=>{const r={w:A.w,e:A.e};for(const k of ['H','N','P','a','b','c','d'])r[k]=A[k].map((v,i)=>v+(T[k][i]-v)*u);return r};
window.AtlasManeuverGeometry={render(item,progress=0){const A=M(B[item.pose],item.start),T=M(A,item.end);return draw(mix(A,T,progress));}};})();
