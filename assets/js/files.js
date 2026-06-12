/* ============================================
   NEXUS OS - FILES.JS v2 (BUG-FIXED)
   Fixes: drag-drop upload, file metadata storage,
   grid/list toggle, category filter, delete confirm
   ============================================ */
'use strict';

const Files = (() => {
  const STORE='files_meta';
  let files=[],viewMode='grid';
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>{files=Nexus.storage.get(STORE,[]);};
  const save=()=>Nexus.storage.set(STORE,files);

  const ICONS={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',ppt:'📑',pptx:'📑',png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️',svg:'🖼️',webp:'🖼️',mp4:'🎬',mov:'🎬',avi:'🎬',mp3:'🎵',wav:'🎵',zip:'📦',rar:'📦',tar:'📦',gz:'📦',js:'💻',ts:'💻',py:'💻',html:'💻',css:'💻',json:'🔧',txt:'📃',md:'📃',csv:'📃'};
  const getExt=name=>(name.split('.').pop()||'').toLowerCase();
  const getIcon=name=>ICONS[getExt(name)]||'📁';
  const getCat=name=>{const e=getExt(name);if(['png','jpg','jpeg','gif','svg','webp'].includes(e))return'images';if(['mp4','mov','avi','mkv'].includes(e))return'videos';if(['mp3','wav','flac'].includes(e))return'audio';if(['pdf','doc','docx','xls','xlsx','txt','md'].includes(e))return'documents';if(['zip','rar','tar','gz'].includes(e))return'archives';return'other';};
  const fmtSize=b=>{if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB';};

  function addFiles(fileList){
    [...fileList].forEach(f=>{
      files.unshift({id:Nexus.uid(),name:f.name,size:f.size,type:f.type,category:getCat(f.name),created:new Date().toISOString()});
    });
    save();render();renderStats();
    Nexus.toast.success(fileList.length+' file'+(fileList.length!==1?'s':'')+' added!');
  }

  async function remove(id){
    if(!await Nexus.modal.confirm({title:'Delete File',message:'Remove this file entry?',confirmText:'Delete',danger:true}))return;
    files=files.filter(f=>f.id!==id);save();render();renderStats();
  }

  function getFiltered(){
    const q=(document.getElementById('files-search')?.value||'').toLowerCase();
    const cat=document.querySelector('[data-filter-cat].active')?.dataset.filterCat||'all';
    return files.filter(f=>{
      const mQ=!q||f.name.toLowerCase().includes(q);
      const mC=cat==='all'||f.category===cat;
      return mQ&&mC;
    });
  }

  function render(){
    const el=document.getElementById('files-container');if(!el)return;
    const list=getFiltered();
    if(!list.length){
      el.className='';
      el.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📁</div><h3>No files yet</h3><p>Drag & drop files or click the upload zone</p></div>';
      return;
    }
    if(viewMode==='grid'){
      el.className='files-grid';
      el.innerHTML=list.map(f=>`
        <div class="file-card">
          <div class="file-icon">${getIcon(f.name)}</div>
          <div class="file-name" title="${esc(f.name)}">${esc(f.name.length>20?f.name.slice(0,18)+'…':f.name)}</div>
          <div class="file-size">${fmtSize(f.size)}</div>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Files.delete('${esc(f.id)}')" title="Delete">🗑️</button>
        </div>`).join('');
    } else {
      el.className='';
      el.innerHTML=list.map(f=>`
        <div class="list-item">
          <div style="font-size:1.4rem">${getIcon(f.name)}</div>
          <div class="list-item-main">
            <div class="list-item-title">${esc(f.name)}</div>
            <div class="list-item-sub">${fmtSize(f.size)} · ${f.category} · ${Nexus.date.timeAgo(f.created)}</div>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Files.delete('${esc(f.id)}')">🗑️</button>
        </div>`).join('');
    }
  }

  function renderStats(){
    const tot=document.getElementById('files-total');
    const sz=document.getElementById('files-size');
    if(tot) tot.textContent=files.length;
    if(sz)  sz.textContent=fmtSize(files.reduce((s,f)=>s+f.size,0));
  }

  function bindUpload(){
    const zone=document.getElementById('upload-zone');
    const inp=document.getElementById('file-input');
    if(!zone||!inp)return;
    zone.addEventListener('click',()=>inp.click());
    ['dragover','dragenter'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag-over');}));
    ['dragleave','dragend'].forEach(ev=>zone.addEventListener(ev,()=>zone.classList.remove('drag-over')));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');if(e.dataTransfer.files.length)addFiles(e.dataTransfer.files);});
    inp.addEventListener('change',()=>{if(inp.files.length)addFiles(inp.files);inp.value='';});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.getElementById('files-container'))return;
    load();render();renderStats();bindUpload();
    document.getElementById('files-search')?.addEventListener('input',render);
    document.getElementById('view-grid')?.addEventListener('click',()=>{viewMode='grid';render();});
    document.getElementById('view-list')?.addEventListener('click',()=>{viewMode='list';render();});
    document.querySelectorAll('[data-filter-cat]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('[data-filter-cat]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');render();
    }));
  });
  return{delete:remove};
})();
window.Files=Files;
