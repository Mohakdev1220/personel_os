/* ============================================
   NEXUS OS - BOOKMARKS.JS v2 (BUG-FIXED)
   Fixes: localStorage save/load, favicon fetch,
   category filter, search, open link, delete
   ============================================ */
'use strict';

const Bookmarks = (() => {
  const STORE='bookmarks';
  let bookmarks=[],filterCat='all';
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>{bookmarks=Nexus.storage.get(STORE,[]);};
  const save=()=>Nexus.storage.set(STORE,bookmarks);

  function normalizeUrl(url){
    url=url.trim();
    if(!/^https?:\/\//i.test(url)) url='https://'+url;
    return url;
  }
  function getFavicon(url){try{return 'https://www.google.com/s2/favicons?domain='+new URL(url).hostname+'&sz=32';}catch{return '';}}
  function getHost(url){try{return new URL(url).hostname;}catch{return url;}}

  function add(data){
    const url=normalizeUrl(data.url);
    try{ new URL(url); }catch{ Nexus.toast.error('Invalid URL'); return; }
    bookmarks.unshift({id:Nexus.uid(),title:data.title||getHost(url),url,category:data.category||'general',tags:data.tags||'',favicon:getFavicon(url),created:new Date().toISOString()});
    save();render();Nexus.toast.success('Bookmark saved! 🔖');
  }

  async function remove(id){
    if(!await Nexus.modal.confirm({title:'Delete Bookmark',message:'Remove this bookmark?',confirmText:'Delete',danger:true}))return;
    bookmarks=bookmarks.filter(b=>b.id!==id);save();render();
  }

  function getFiltered(){
    const q=(document.getElementById('bm-search')?.value||'').toLowerCase();
    return bookmarks.filter(b=>{
      const mQ=!q||b.title.toLowerCase().includes(q)||b.url.toLowerCase().includes(q)||(b.tags||'').toLowerCase().includes(q);
      const mC=filterCat==='all'||b.category===filterCat;
      return mQ&&mC;
    });
  }

  function render(){
    const el=document.getElementById('bookmarks-grid');if(!el)return;
    const list=getFiltered();
    const cnt=document.getElementById('bm-count');
    if(cnt) cnt.textContent=list.length+' bookmark'+(list.length!==1?'s':'');
    if(!list.length){el.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔖</div><h3>No bookmarks</h3><p>Save your favourite links</p></div>';return;}
    const catBadge={work:'badge-blue',personal:'badge-purple',learning:'badge-green',tools:'badge-yellow',social:'badge-red',general:'badge-gray'};
    el.innerHTML=list.map(b=>`
      <div class="bookmark-card">
        <div style="display:flex;align-items:center;gap:9px">
          <div class="bookmark-favicon">
            ${b.favicon?`<img src="${esc(b.favicon)}" width="18" height="18" onerror="this.style.display='none'" loading="lazy" alt="">`:''}<span style="font-size:.85rem">🔗</span>
          </div>
          <div style="flex:1;min-width:0">
            <div class="bookmark-title">${esc(b.title)}</div>
            <div class="bookmark-url">${esc(getHost(b.url))}</div>
          </div>
        </div>
        ${b.tags?`<div style="font-size:.68rem;color:var(--text-muted);margin-top:4px">${esc(b.tags)}</div>`:''}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <span class="badge ${catBadge[b.category]||'badge-gray'}">${b.category}</span>
          <div style="display:flex;gap:4px">
            <a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-icon btn-sm" title="Open">🔗</a>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="Bookmarks.delete('${esc(b.id)}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>`).join('');
  }

  function openAdd(){
    Nexus.modal.open({title:'🔖 Add Bookmark',
      body:`
        <div class="form-group"><label class="form-label">URL *</label>
          <input id="bm-url" class="form-input" type="url" placeholder="https://example.com"></div>
        <div class="form-group"><label class="form-label">Title</label>
          <input id="bm-title" class="form-input" placeholder="e.g. GitHub"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Category</label>
            <select id="bm-cat" class="form-select">
              <option value="general">General</option><option value="work">Work</option>
              <option value="personal">Personal</option><option value="learning">Learning</option>
              <option value="tools">Tools</option><option value="social">Social</option>
            </select></div>
          <div class="form-group"><label class="form-label">Tags</label>
            <input id="bm-tags" class="form-input" placeholder="design, dev…"></div>
        </div>`,
      footer:`<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
              <button class="btn btn-primary" onclick="Bookmarks.submitForm()">Save</button>`});
  }

  function submitForm(){
    const url=document.getElementById('bm-url')?.value.trim();
    if(!url){Nexus.toast.error('URL is required');return;}
    add({url,title:document.getElementById('bm-title')?.value.trim(),category:document.getElementById('bm-cat')?.value,tags:document.getElementById('bm-tags')?.value.trim()});
    Nexus.modal.close();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.getElementById('bookmarks-grid'))return;
    load();render();
    document.getElementById('bm-search')?.addEventListener('input',render);
    document.getElementById('btn-add-bookmark')?.addEventListener('click',openAdd);
    document.querySelectorAll('[data-filter-cat]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('[data-filter-cat]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');filterCat=b.dataset.filterCat;render();
    }));
  });
  return {delete:remove,submitForm,openAdd};
})();
window.Bookmarks=Bookmarks;
