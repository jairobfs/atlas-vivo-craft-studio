import {kind,raw} from './visual-core.js';
export const BOARD_W=1100,BOARD_H=619;
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(Number(n))?Number(n):lo));
const within=(n,min,max)=>Math.round(clamp(n,min,max));
export function keyOf(section){return String(section?.source||section?.key||'')}
export function sourceMap(project){
 const m=new Map();
 for(const s of project?.sections||[])for(const it of s?.items||[])if(it?.block?.id)m.set(String(it.block.id),it.block);
 return m;
}
export function defaultCanvas(project){
 const boards=[];
 for(const [i,s] of (project?.sections||[]).entries()){
   const items=s.items.filter(x=>x.block?.id&&x.kind!=='missing').slice(0,7);
   const nodes=[];
   let textIndex=0,imgIndex=0;
   for(const [j,it] of items.entries()){
     const isImage=it.kind==='image';
     // Alternating text and figures; all elements are independently draggable.
     let x,y,w,h,design;
     if(j===0&&!isImage){x=38;y=93;w=630;h=150;design='hero'}
     else if(isImage){x=707;y=93+imgIndex*286;w=350;h=266;design='picture';imgIndex++}
     else {let row=textIndex++;x=row%2===0?38:377;y=278+Math.floor(row/2)*164;w=315;h=148;design=it.kind==='callout'?'warning':'standard'}
     if(y+h>BOARD_H-25)y=Math.max(310,BOARD_H-h-24);
     nodes.push({id:'n'+i+'-'+j,source:String(it.block.id),x,y,w,h,design});
   }
   boards.push({id:'board-'+keyOf(s),title:String(s.name||'Prancha '+(i+1)).slice(0,120),nodes});
 }
 if(!boards.length)boards.push({id:'board-intro',title:'Nova prancha',nodes:[]});
 return {version:1,skin:'dark',boards};
}
export function normalizeCanvas(project,value){
 const available=sourceMap(project),fallback=defaultCanvas(project);
 if(!value||!Array.isArray(value.boards))return fallback;
 const allowed=new Set(['standard','hero','warning','picture','transparent']);
 const seen=new Set,boards=[];
 for(const p of value.boards.slice(0,50)){
   if(!p||typeof p!=='object')continue;
   const boardId=String(p.id||'').slice(0,130);
   if(!boardId||seen.has(boardId))continue;seen.add(boardId);
   const nodes=[];
   for(const item of (Array.isArray(p.nodes)?p.nodes:[]).slice(0,40)){
      if(!item||!available.has(String(item.source)))continue;
      const w=within(item.w,110,1060),h=within(item.h,95,710);
      nodes.push({id:String(item.id||('n'+nodes.length)).slice(0,110),source:String(item.source),x:within(item.x,0,BOARD_W-w),y:within(item.y,0,BOARD_H-h),w,h,design:allowed.has(item.design)?item.design:'standard'});
   }
   boards.push({id:boardId,title:String(p.title||'Prancha').slice(0,120),nodes});
 }
 if(!boards.length)return fallback;
 return {version:1,skin:['dark','light','paper'].includes(value.skin)?value.skin:'dark',boards};
}
export function updateNode(node,changes){
 const w=within(changes.w??node.w,110,1060),h=within(changes.h??node.h,95,710);
 return {...node,w,h,x:within(changes.x??node.x,0,BOARD_W-w),y:within(changes.y??node.y,0,BOARD_H-h),design:changes.design||node.design};
}
export function addNode(board,source){
 const items=board.nodes;
 const n=items.length;
 if(n>=35)return null;
 const x=within(60+(n%3)*330,0,820),y=within(100+Math.floor(n/3)*168,0,BOARD_H-145);
 const node={id:'new-'+Date.now().toString(36)+'-'+n,source:String(source),x,y,w:300,h:145,design:'standard'};
 items.push(node);return node;
}
export function buildStorageConfig(existing,canvas){
 return {
   version:1,
   layout:existing?.layout||'editorial',
   density:existing?.density||'balanced',
   order:Array.isArray(existing?.order)?existing.order:[],
   canvas:{version:1,skin:canvas.skin,boards:canvas.boards.map(b=>({id:b.id,title:b.title,nodes:b.nodes.map(n=>({id:n.id,source:n.source,x:n.x,y:n.y,w:n.w,h:n.h,design:n.design}))}))}
 };
}
