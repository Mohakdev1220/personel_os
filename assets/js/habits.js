/* ============================================
   NEXUS OS - HABITS.JS v2 (BUG-FIXED)
   Fixes: streak calc, today toggle, week dots,
   progress bar, localStorage persistence
   ============================================ */
'use strict';

const Habits = (() => {
  const STORE = 'habits';
  let habits  = [];
  const esc = s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load = ()=>{ habits = Nexus.storage.get(STORE,[]); };
  const save = ()=> Nexus.storage.set(STORE, habits);

  const EMOJIS = ['⭐','🏃','💪','📚','🧘','💧','🥗','😴','✍️','🎯','🎵','🌅','🚴','🧹','🌿'];

  function getLast7(){
    return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().split('T')[0];});
  }

  function computeStreak(log){
    if(!log||!log.length) return 0;
    const sorted=[...log].sort().reverse();
    let streak=0,cur=new Date();cur.setHours(0,0,0,0);
    for(const d of sorted){const dt=new Date(d),diff=Math.round((cur-dt)/86400000);if(diff===streak){streak++;cur=dt;}else break;}
    return streak;
  }

  function toggleDay(id, date){
    const h=habits.find(h=>h.id===id);if(!h)return;
    h.log=h.log||[];
    const i=h.log.indexOf(date);
    if(i>=0) h.log.splice(i,1); else h.log.push(date);
    save(); render();
  }

  function toggleToday(id){ toggleDay(id, Nexus.date.today()); }

  async function remove(id){
    if(!await Nexus.modal.confirm({title:'Delete Habit',message:'Delete this habit and all streak history?',confirmText:'Delete',danger:true}))return;
    habits=habits.filter(h=>h.id!==id);save();render();
  }

  function render(){
    const el=document.getElementById('habits-list');if(!el)return;
    const today=Nexus.date.today();
    const last7=getLast7();
    const done=habits.filter(h=>h.log&&h.log.includes(today)).length;
    const total=habits.length;
    const pct=total?Math.round(done/total*100):0;

    const doneLbl=document.getElementById('habits-done-today');
    if(doneLbl) doneLbl.textContent=done+'/'+total+' today';
    const pb=document.getElementById('habits-progress');
    if(pb) pb.querySelector('.progress-bar').style.width=pct+'%';

    if(!habits.length){el.innerHTML='<div class="empty-state"><div class="empty-state-icon">🔥</div><h3>No habits yet</h3><p>Add a habit and start your streak!</p></div>';return;}
    const DAY_LABELS=['S','M','T','W','T','F','S'];

    el.innerHTML=habits.map(h=>{
      const streak=computeStreak(h.log||[]);
      const doneNow=h.log&&h.log.includes(today);
      const compPct=Math.min(100,Math.round((h.log?.length||0)/30*100));
      const dots=last7.map((d,i)=>{
        const dt=new Date(d);
        const lbl=DAY_LABELS[dt.getDay()];
        const isDone=h.log&&h.log.includes(d);
        return `<div class="habit-week-dot${isDone?' done':''}" onclick="Habits.toggleDay('${esc(h.id)}','${d}')" title="${d}">${lbl}</div>`;
      }).join('');
      return `
        <div class="habit-tracker-row">
          <span style="font-size:1.4rem;flex-shrink:0">${h.icon||'⭐'}</span>
          <div class="habit-tracker-info">
            <div class="habit-tracker-name">${esc(h.name)}</div>
            <div class="habit-tracker-sub">${h.frequency||'Daily'} · ${h.log?.length||0} total</div>
            <div class="progress" style="margin-top:4px;width:100px"><div class="progress-bar" style="width:${compPct}%"></div></div>
          </div>
          <div class="habit-week-dots">${dots}</div>
          <div class="habit-streak-badge">🔥 ${streak}</div>
          <button class="btn ${doneNow?'btn-primary':'btn-secondary'} btn-sm" onclick="Habits.toggleToday('${esc(h.id)}')">${doneNow?'✓ Done':'Mark Done'}</button>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Habits.delete('${esc(h.id)}')">🗑️</button>
        </div>`;
    }).join('');
  }

  function openAdd(){
    Nexus.modal.open({title:'➕ New Habit',
      body:`
        <div class="form-group"><label class="form-label">Habit Name *</label>
          <input id="h-name" class="form-input" placeholder="e.g. Morning Run"></div>
        <div class="form-group"><label class="form-label">Icon</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px" id="emoji-picker">
            ${EMOJIS.map(e=>`<button type="button" style="font-size:1.3rem;padding:5px;border-radius:7px;border:1.5px solid transparent;background:var(--bg-tertiary);cursor:pointer;transition:var(--transition)" onclick="document.getElementById('h-icon').value='${e}';document.querySelectorAll('#emoji-picker button').forEach(b=>b.style.borderColor='transparent');this.style.borderColor='var(--accent)'">${e}</button>`).join('')}
          </div>
          <input id="h-icon" type="hidden" value="⭐"></div>
        <div class="form-group"><label class="form-label">Frequency</label>
          <select id="h-freq" class="form-select">
            <option value="Daily">Daily</option>
            <option value="Weekdays">Weekdays</option>
            <option value="Weekends">Weekends</option>
          </select></div>`,
      footer:`<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
              <button class="btn btn-primary" onclick="Habits.submitForm()">Add Habit</button>`});
  }

  function submitForm(){
    const name=document.getElementById('h-name')?.value.trim();
    if(!name){Nexus.toast.error('Habit name is required');return;}
    habits.push({id:Nexus.uid(),name,icon:document.getElementById('h-icon')?.value||'⭐',frequency:document.getElementById('h-freq')?.value||'Daily',log:[],created:new Date().toISOString()});
    save();render();Nexus.modal.close();Nexus.toast.success('Habit added! 🔥');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.getElementById('habits-list'))return;
    load();render();
    document.getElementById('btn-add-habit')?.addEventListener('click',openAdd);
  });

  return {toggleToday,toggleDay,delete:remove,submitForm,openAdd};
})();
window.Habits=Habits;
