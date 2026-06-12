/* ============================================
   NEXUS OS - TASKS.JS v2 (BUG-FIXED)
   Fixes: localStorage persistence, filter chips,
   sort, edit modal, delete confirm, progress bar
   ============================================ */
'use strict';

const Tasks = (() => {
  const STORE = 'tasks';
  let tasks = [], editId = null, filterCat = 'all', filterPri = 'all', sortBy = 'created';

  const load = () => { tasks = Nexus.storage.get(STORE, []); };
  const save = () => Nexus.storage.set(STORE, tasks);
  const esc  = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function add(data) {
    tasks.unshift({ id:Nexus.uid(), title:data.title, notes:data.notes||'', priority:data.priority||'normal', category:data.category||'general', dueDate:data.dueDate||'', done:false, created:new Date().toISOString() });
    save(); render(); Nexus.toast.success('Task added! ✅');
  }

  function update(id, data) {
    const t = tasks.find(t=>t.id===id); if(!t) return;
    Object.assign(t, data, {updated:new Date().toISOString()});
    save(); render(); Nexus.toast.success('Task updated!');
  }

  async function remove(id) {
    const ok = await Nexus.modal.confirm({title:'Delete Task',message:'Permanently delete this task?',confirmText:'Delete',danger:true});
    if (!ok) return;
    tasks = tasks.filter(t=>t.id!==id); save(); render(); Nexus.toast.success('Task deleted');
  }

  function toggle(id) {
    const t = tasks.find(t=>t.id===id); if(!t) return;
    t.done = !t.done; t.completedAt = t.done ? new Date().toISOString() : null;
    save(); render();
  }

  function getFiltered() {
    const q = (document.getElementById('task-search')?.value||'').toLowerCase();
    return tasks.filter(t => {
      const mQ = !q || t.title.toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q);
      const mC = filterCat==='all' || t.category===filterCat;
      const mP = filterPri==='all' || t.priority===filterPri;
      return mQ && mC && mP;
    }).sort((a,b) => {
      if (sortBy==='priority') { const o={high:0,medium:1,normal:2}; return (o[a.priority]||2)-(o[b.priority]||2); }
      if (sortBy==='dueDate')  { if(!a.dueDate) return 1; if(!b.dueDate) return -1; return new Date(a.dueDate)-new Date(b.dueDate); }
      if (sortBy==='title')    return a.title.localeCompare(b.title);
      return new Date(b.created)-new Date(a.created);
    });
  }

  function render() {
    const list  = getFiltered();
    const done  = list.filter(t=>t.done).length;
    const total = list.length;
    const pct   = total ? Math.round(done/total*100) : 0;

    const pb  = document.getElementById('tasks-progress');
    const lbl = document.getElementById('tasks-progress-label');
    const cnt = document.getElementById('tasks-count');
    if (pb)  pb.querySelector('.progress-bar').style.width = pct+'%';
    if (lbl) lbl.textContent = done+'/'+total+' completed ('+pct+'%)';
    if (cnt) cnt.textContent = total+' task'+(total!==1?'s':'');

    const el = document.getElementById('tasks-list'); if(!el) return;
    if (!list.length) { el.innerHTML='<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No tasks found</h3><p>Add a task or adjust filters</p></div>'; return; }

    const pending   = list.filter(t=>!t.done);
    const completed = list.filter(t=>t.done);
    const priColor  = {high:'badge-red',medium:'badge-yellow',normal:'badge-gray'};
    const catColor  = {work:'badge-blue',personal:'badge-purple',health:'badge-green',general:'badge-gray'};

    const row = t => `
      <div class="list-item" style="${t.done?'opacity:.6':''}">
        <div onclick="Tasks.toggle('${esc(t.id)}')" style="width:20px;height:20px;border-radius:6px;border:1.5px solid var(--border-hover);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:.65rem;transition:var(--transition);${t.done?'background:var(--accent);border-color:var(--accent);color:#fff':''}">${t.done?'✓':''}</div>
        <div class="list-item-main">
          <div class="list-item-title" style="${t.done?'text-decoration:line-through;color:var(--text-muted)':''}">${esc(t.title)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px">
            <span class="badge ${priColor[t.priority]||'badge-gray'}">${t.priority||'normal'}</span>
            <span class="badge ${catColor[t.category]||'badge-gray'}">${t.category||'general'}</span>
            ${t.dueDate?`<span style="font-size:.72rem;color:${(t.dueDate<Nexus.date.today()&&!t.done)?'#f87171':'var(--text-muted)'}">📅 ${Nexus.date.format(t.dueDate)}</span>`:''}
          </div>
          ${t.notes?`<div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${esc(t.notes.slice(0,80))}${t.notes.length>80?'…':''}</div>`:''}
        </div>
        <div class="list-item-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Tasks.openEdit('${esc(t.id)}')">✏️</button>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Tasks.delete('${esc(t.id)}')">🗑️</button>
        </div>
      </div>`;

    el.innerHTML =
      (pending.length   ? `<div style="font-size:.72rem;color:var(--text-muted);font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px">Pending — ${pending.length}</div>${pending.map(row).join('')}` : '') +
      (completed.length ? `<div style="font-size:.72rem;color:var(--text-muted);font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin:16px 0 8px">Completed — ${completed.length}</div>${completed.map(row).join('')}` : '');
  }

  function formHtml(t={}) {
    return `
      <div class="form-group"><label class="form-label">Title *</label>
        <input id="t-title" class="form-input" placeholder="What needs to be done?" value="${esc(t.title||'')}"></div>
      <div class="form-group"><label class="form-label">Notes</label>
        <textarea id="t-notes" class="form-textarea" style="min-height:80px">${esc(t.notes||'')}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">Priority</label>
          <select id="t-priority" class="form-select">
            <option value="normal" ${t.priority==='normal'?'selected':''}>Normal</option>
            <option value="medium" ${t.priority==='medium'?'selected':''}>Medium</option>
            <option value="high"   ${t.priority==='high'  ?'selected':''}>High</option>
          </select></div>
        <div class="form-group"><label class="form-label">Category</label>
          <select id="t-category" class="form-select">
            <option value="general"  ${t.category==='general' ?'selected':''}>General</option>
            <option value="work"     ${t.category==='work'    ?'selected':''}>Work</option>
            <option value="personal" ${t.category==='personal'?'selected':''}>Personal</option>
            <option value="health"   ${t.category==='health'  ?'selected':''}>Health</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Due Date</label>
        <input id="t-due" class="form-input" type="date" value="${t.dueDate||''}"></div>`;
  }

  function openAdd() {
    editId = null;
    Nexus.modal.open({ title:'➕ New Task', body:formHtml(),
      footer:`<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
              <button class="btn btn-primary"   onclick="Tasks.submitForm()">Add Task</button>` });
  }

  function openEdit(id) {
    const t = tasks.find(t=>t.id===id); if(!t) return;
    editId = id;
    Nexus.modal.open({ title:'✏️ Edit Task', body:formHtml(t),
      footer:`<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
              <button class="btn btn-primary"   onclick="Tasks.submitForm()">Save</button>` });
  }

  function submitForm() {
    const title = document.getElementById('t-title')?.value.trim();
    if (!title) { Nexus.toast.error('Title is required'); return; }
    const data = { title, notes:document.getElementById('t-notes')?.value.trim(), priority:document.getElementById('t-priority')?.value, category:document.getElementById('t-category')?.value, dueDate:document.getElementById('t-due')?.value };
    if (editId) update(editId, data); else add(data);
    Nexus.modal.close();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('tasks-list')) return;
    load(); render();
    document.getElementById('task-search')?.addEventListener('input', render);
    document.getElementById('task-sort')?.addEventListener('change', e=>{sortBy=e.target.value;render();});
    document.getElementById('btn-add-task')?.addEventListener('click', openAdd);
    document.querySelectorAll('[data-filter-cat]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter-cat]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filterCat=b.dataset.filterCat;render();}));
    document.querySelectorAll('[data-filter-pri]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter-pri]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filterPri=b.dataset.filterPri;render();}));
  });

  return { toggle, openEdit, delete:remove, submitForm, openAdd };
})();
window.Tasks = Tasks;
