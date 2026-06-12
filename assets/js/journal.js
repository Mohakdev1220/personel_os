/* ============================================
   NEXUS OS - JOURNAL.JS v2 (BUG-FIXED)
   Fixes: mood selection, entry save, search,
   delete confirm, date display, localStorage
   ============================================ */
'use strict';

const Journal = (() => {
  const STORE='journal';
  let entries=[],selectedMood='';
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>{entries=Nexus.storage.get(STORE,[]);};
  const save=()=>Nexus.storage.set(STORE,entries);

  const MOODS=[{key:'amazing',emoji:'🤩'},{key:'happy',emoji:'😊'},{key:'neutral',emoji:'😐'},{key:'sad',emoji:'😢'},{key:'stressed',emoji:'😤'},{key:'tired',emoji:'😴'}];
  const moodMap=Object.fromEntries(MOODS.map(m=>[m.key,m.emoji]));

  function bindMoods(){
    document.querySelectorAll('.mood-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood=btn.dataset.mood||'';
      });
    });
  }

  function saveEntry(){
    const body=document.getElementById('journal-body')?.value.trim();
    if(!body){Nexus.toast.error('Write something first!');return;}
    entries.unshift({id:Nexus.uid(),body,mood:selectedMood,date:Nexus.date.today(),created:new Date().toISOString()});
    save();render();
    document.getElementById('journal-body').value='';
    document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));
    selectedMood='';
    Nexus.toast.success('Journal entry saved! 📖');
  }

  async function remove(id){
    if(!await Nexus.modal.confirm({title:'Delete Entry',message:'Delete this journal entry?',confirmText:'Delete',danger:true}))return;
    entries=entries.filter(e=>e.id!==id);save();render();
  }

  function render(){
    const el=document.getElementById('journal-entries');if(!el)return;
    const q=(document.getElementById('journal-search')?.value||'').toLowerCase();
    const list=entries.filter(e=>!q||e.body.toLowerCase().includes(q)||(e.mood||'').includes(q));
    const cnt=document.getElementById('journal-count');
    if(cnt) cnt.textContent=entries.length+' entr'+(entries.length!==1?'ies':'y');
    if(!list.length){el.innerHTML='<div class="empty-state"><div class="empty-state-icon">📖</div><h3>No entries yet</h3><p>Start writing your thoughts above</p></div>';return;}
    el.innerHTML=list.map(e=>`
      <div class="journal-entry anim-fade-up">
        <div class="journal-entry-header">
          <span class="journal-mood">${moodMap[e.mood]||'📝'}</span>
          <div>
            <div class="journal-date">${Nexus.date.format(e.date,{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</div>
            ${e.mood?`<div style="font-size:.7rem;color:var(--text-muted);text-transform:capitalize">${e.mood}</div>`:''}
          </div>
          <div style="margin-left:auto">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="Journal.delete('${esc(e.id)}')">🗑️</button>
          </div>
        </div>
        <div class="journal-entry-body">${esc(e.body)}</div>
      </div>`).join('');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.getElementById('journal-entries'))return;
    load();render();bindMoods();
    document.getElementById('btn-save-entry')?.addEventListener('click',saveEntry);
    document.getElementById('journal-search')?.addEventListener('input',render);
  });
  return{delete:remove};
})();
window.Journal=Journal;
