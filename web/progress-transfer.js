/* Atlas Vivo V19 · local progress portability. No network calls. */
(()=>{
 'use strict';
 const KEYS=['atlas-vivo-theme','atlas-vivo-quiz-v1','atlas-vivo-quiz-position-v1','atlas-vivo-learning-path-v1','atlas-vivo-chapter-progress-v1','atlas-vivo-clinical-v1'];
 const exp=document.getElementById('progress-export'),imp=document.getElementById('progress-import'),fileInput=document.getElementById('progress-file'),summary=document.getElementById('progress-vault-summary'),feedback=document.getElementById('progress-vault-feedback');
 if(!exp||!imp||!fileInput||!summary||!feedback)return;
 const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
 function update(){
  const trail=read('atlas-vivo-learning-path-v1',{}),chapters=read('atlas-vivo-chapter-progress-v1',{}),grades=read('atlas-vivo-quiz-v1',{});
  const count=Object.values(trail&&typeof trail==='object'?trail:{}).reduce((sum,entry)=>sum+(entry&&Array.isArray(entry.done)?entry.done.filter(v=>v===true).length:0),0);
  const reviewed=Object.values(grades&&typeof grades==='object'?grades:{}).filter(value=>['rever','acertei','dominei'].includes(value)).length;
  const opened=Object.values(chapters&&typeof chapters==='object'?chapters:{}).filter(v=>v&&typeof v==='object'&&Array.isArray(v.done)&&v.done.some(x=>x===true)).length;
  summary.textContent=`${count} etapas da trilha · ${reviewed} cartões classificados · ${opened} capítulos em andamento neste aparelho.`;
 }
 const tell=(message,error=false)=>{feedback.textContent=message;feedback.style.color=error?'#b93845':''};
 exp.addEventListener('click',()=>{
  try{
   const data={};for(const key of KEYS){const raw=localStorage.getItem(key);if(raw!==null)data[key]=JSON.parse(raw)}
   const payload={format:'atlas-vivo-progress',version:1,exportedAt:new Date().toISOString(),data};
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download='atlas-vivo-progresso-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),10000);
   tell('Arquivo JSON preparado. Salve no app Arquivos para importar depois.');
  }catch{tell('Exportação indisponível neste navegador.',true)}
 });
 imp.addEventListener('click',()=>fileInput.click());
 fileInput.addEventListener('change',async()=>{
  const file=fileInput.files&&fileInput.files[0];if(!file)return;
  try{
   if(file.size>160000)throw Error('Arquivo muito grande para o Atlas Vivo.');
   const backup=JSON.parse(await file.text());
   if(!backup||backup.format!=='atlas-vivo-progress'||backup.version!==1||!backup.data||typeof backup.data!=='object'||Array.isArray(backup.data))throw Error('Formato de backup não reconhecido.');
   const keys=Object.keys(backup.data);
   if(!keys.length||keys.some(key=>!KEYS.includes(key)))throw Error('Arquivo contém campos não reconhecidos.');
   for(const key of keys){const value=backup.data[key];if(key==='atlas-vivo-theme'){if(value!=='light'&&value!=='dark')throw Error('Tema inválido.')}else if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Dados inválidos no backup.')}
   if(!window.confirm(`Importar ${keys.length} categorias de progresso? As categorias existentes neste aparelho serão substituídas.`)){tell('Importação cancelada. Nada foi alterado.');return}
   for(const key of keys)localStorage.setItem(key,JSON.stringify(backup.data[key]));
   tell('Progresso importado. Atualizando a sessão…');window.location.reload();
  }catch(err){tell(err&&err.message?err.message:'Arquivo inválido.',true)}
  finally{fileInput.value=''}
 });
 update();
})();
