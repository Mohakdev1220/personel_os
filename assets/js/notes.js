/* ============================================
   NEXUS OS - NOTES, JOURNAL, HABITS JS
   notes.js, journal.js, habits.js combined
   ============================================ */

'use strict';

/* ===========================
   NOTES
   =========================== */
const Notes = (() => {
  const STORE = 'notes';
  let notes = [];
  let editId = null;
  let filterCat = 'all';

  const load  = () => { notes = Nexus.storage.get(STORE, []); };
  const save  = () => Nexus.storage.set(STORE, notes);
  const escHtml = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function add(data) {
    notes.unshift({ id: Nexus.uid(), ...data, pinned: false, created: new Date().toISOString() });
    save(); render(); Nexus.toast.success('Note created!');
  }
  function update(id, data) {
    const n = notes.find(n => n.id === id);
    if (n) { Object.assign(n, data, { updated: new Date().toISOString() }); save(); render(); Nexus.toast.success('Note saved!'); }
  }
  async function remove(id) {
    if (!await Nexus.modal.confirm({ title:'Delete Note', message:'This note will be deleted.', danger:true, confirmText:'Delete' })) return;
    notes = notes.filter(n => n.id !== id); save(); render(); Nexus.toast.success('Note deleted');
  }
  function togglePin(id) {
    const n = notes.find(n => n.id === id);
    if (n) { n.pinned = !n.pinned; save(); render(); }
  }

  function getFiltered() {
    const q = document.getElementById('notes-search')?.value.toLowerCase() || '';
    return notes
      .filter(n => {
        const matchQ   = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
        const matchCat = filterCat === 'all' || n.category === filterCat;
        return matchQ && matchCat;
      })
      .sort((a,b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created) - new Date(a.created);
      });
  }

  function render() {
    const container = document.getElementById('notes-grid');
    if (!container) return;
    const list = getFiltered();
    const countEl = document.getElementById('notes-count');
    if (countEl) countEl.textContent = `${list.length} note${list.length!==1?'s':''}`;

    if (!list.length) {
      container.innerHTML = `<div class="empty-state col-span-all" style="grid-column:1/-1;padding:48px">
        <div class="empty-state-icon">📝</div><h3>No notes yet</h3><p>Create your first note</p>
      </div>`; return;
    }

    const catColors = { personal:'badge-purple', work:'badge-blue', ideas:'badge-green', misc:'badge-gray' };
    container.innerHTML = list.map(n => `
      <div class="note-card ${n.pinned ? 'pinned' : ''}">
        <div class="note-title">
          ${n.pinned ? '📌' : ''}
          ${escHtml(n.title || 'Untitled')}
        </div>
        <div class="note-preview">${escHtml(n.body || '')}</div>
        <div class="note-footer">
          <div style="display:flex;gap:6px;align-items:center">
            <span class="note-date">${Nexus.date.timeAgo(n.created)}</span>
            ${n.category ? `<span class="badge ${catColors[n.category]||'badge-gray'}">${n.category}</span>` : ''}
          </div>
          <div class="note-actions">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="Notes.togglePin('${n.id}')" title="${n.pinned?'Unpin':'Pin'}">📌</button>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="Notes.openEdit('${n.id}')" title="Edit">✏️</button>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="Notes.delete('${n.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function openAdd() {
    editId = null;
    Nexus.modal.open({ title:'📝 New Note', body: formHtml({}),
      footer:`<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
              <button class="btn btn-primary" onclick="Notes.submitForm()">Save Note</button>` });
  }
  function openEdit(id) {
    const n = notes.find(n => n.id === id);
    if (!n) return;
    editId = id;
    Nexus.modal.open({ title:'✏️ Edit Note', body: formHtml(n),
      footer:`<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
              <button class="btn btn-primary" onclick="Notes.submitForm()">Save Changes</button>` });
  }
  function formHtml(n) {
    return `
      <div class="form-group">
        <label class="form-label">Title</label>
        <input id="n-title" class="form-input" placeholder="Note title…" value="${escHtml(n.title||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea id="n-body" class="form-textarea" placeholder="Write your note…" style="min-height:160px">${escHtml(n.body||'')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="n-cat" class="form-select">
          <option value="personal" ${n.category==='personal'?'selected':''}>Personal</option>
          <option value="work"     ${n.category==='work'?'selected':''}>Work</option>
          <option value="ideas"    ${n.category==='ideas'?'selected':''}>Ideas</option>
          <option value="misc"     ${n.category==='misc'?'selected':''}>Misc</option>
        </select>
      </div>`;
  }
  function submitForm() {
    const title = document.getElementById('n-title')?.value.trim();
    const body  = document.getElementById('n-body')?.value.trim();
    if (!body) { Nexus.toast.error('Note content is required'); return; }
    const data = { title: title || 'Untitled', body, category: document.getElementById('n-cat')?.value };
    if (editId) update(editId, data); else add(data);
    Nexus.modal.close();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('notes-grid')) return;
    load(); render();
    document.getElementById('notes-search')?.addEventListener('input', render);
    document.getElementById('btn-add-note')?.addEventListener('click', openAdd);
    document.querySelectorAll('[data-filter-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-cat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); filterCat = btn.dataset.filterCat; render();
      });
    });
  });

  return { togglePin, openEdit, delete: remove, submitForm, openAdd };
})();
window.Notes = Notes;


/* ===========================
   JOURNAL
   =========================== */
const Journal = (() => {
  const STORE = 'journal';
  let entries = [];
  const escHtml = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const moods = [
    { key:'amazing',  label:'Amazing',  emoji:'🤩' },
    { key:'happy',    label:'Happy',    emoji:'😊' },
    { key:'neutral',  label:'Neutral',  emoji:'😐' },
    { key:'sad',      label:'Sad',      emoji:'😢' },
    { key:'stressed', label:'Stressed', emoji:'😤' },
    { key:'tired',    label:'Tired',    emoji:'😴' }
  ];

  const load = () => { entries = Nexus.storage.get(STORE, []); };
  const save = () => Nexus.storage.set(STORE, entries);

  let selectedMood = '';

  function bindMoods() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
      });
    });
  }

  function addEntry() {
    const body = document.getElementById('journal-body')?.value.trim();
    if (!body) { Nexus.toast.error('Write something first!'); return; }
    const entry = {
      id:      Nexus.uid(),
      body,
      mood:    selectedMood,
      date:    Nexus.date.today(),
      created: new Date().toISOString()
    };
    entries.unshift(entry);
    save(); renderEntries();
    document.getElementById('journal-body').value = '';
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    selectedMood = '';
    Nexus.toast.success('Journal entry saved!');
  }

  async function removeEntry(id) {
    if (!await Nexus.modal.confirm({ title:'Delete Entry', message:'This journal entry will be deleted.', danger:true, confirmText:'Delete' })) return;
    entries = entries.filter(e => e.id !== id); save(); renderEntries();
  }

  function renderEntries() {
    const container = document.getElementById('journal-entries');
    if (!container) return;
    const q    = document.getElementById('journal-search')?.value.toLowerCase() || '';
    const list = entries.filter(e => !q || e.body.toLowerCase().includes(q));

    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📖</div>
        <h3>No journal entries yet</h3><p>Start writing your thoughts</p></div>`;
      return;
    }

    const moodMap = Object.fromEntries(moods.map(m => [m.key, m.emoji]));
    container.innerHTML = list.map(e => `
      <div class="journal-entry anim-fade-up">
        <div class="journal-entry-header">
          <span class="journal-mood">${moodMap[e.mood] || '📝'}</span>
          <div>
            <div class="journal-date">${Nexus.date.format(e.date)}</div>
            ${e.mood ? `<div style="font-size:0.72rem;color:var(--text-muted);text-transform:capitalize">${e.mood}</div>` : ''}
          </div>
          <div style="margin-left:auto">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="Journal.delete('${e.id}')">🗑️</button>
          </div>
        </div>
        <div class="journal-entry-body">${escHtml(e.body)}</div>
      </div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('journal-entries')) return;
    load(); renderEntries(); bindMoods();
    document.getElementById('btn-save-entry')?.addEventListener('click', addEntry);
    document.getElementById('journal-search')?.addEventListener('input', renderEntries);
  });

  return { delete: removeEntry };
})();
window.Journal = Journal;


/* ===========================
   HABITS
   =========================== */
const Habits = (() => {
  const STORE = 'habits';
  let habits = [];
  const escHtml = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const load = () => { habits = Nexus.storage.get(STORE, []); };
  const save = () => Nexus.storage.set(STORE, habits);

  function add(data) {
    habits.push({ id: Nexus.uid(), ...data, log: [], created: new Date().toISOString() });
    save(); render(); Nexus.toast.success('Habit added!');
  }
  async function remove(id) {
    if (!await Nexus.modal.confirm({ title:'Delete Habit', message:'Delete this habit and all its history?', danger:true, confirmText:'Delete' })) return;
    habits = habits.filter(h => h.id !== id); save(); render();
  }

  function toggleToday(id) {
    const h = habits.find(h => h.id === id);
    if (!h) return;
    const today = Nexus.date.today();
    h.log = h.log || [];
    const idx = h.log.indexOf(today);
    if (idx >= 0) h.log.splice(idx, 1);
    else h.log.push(today);
    save(); render();
  }

  function computeStreak(log) {
    if (!log || !log.length) return 0;
    const sorted = [...log].sort().reverse();
    let streak = 0;
    let cur = new Date(); cur.setHours(0,0,0,0);
    for (const d of sorted) {
      const dt = new Date(d);
      const diff = Math.round((cur - dt) / 86400000);
      if (diff === streak) { streak++; cur = dt; } else break;
    }
    return streak;
  }

  function getLast7() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }

  function render() {
    const container = document.getElementById('habits-list');
    if (!container) return;
    const today = Nexus.date.today();
    const last7 = getLast7();

    const doneToday = habits.filter(h => h.log && h.log.includes(today)).length;
    const totalEl = document.getElementById('habits-done-today');
    if (totalEl) totalEl.textContent = `${doneToday}/${habits.length} today`;

    const pct = habits.length ? Math.round(doneToday/habits.length*100) : 0;
    const progEl = document.getElementById('habits-progress');
    if (progEl) { progEl.querySelector('.progress-bar').style.width = `${pct}%`; }

    if (!habits.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">🔥</div>
        <h3>No habits tracked</h3><p>Add a habit to start your streak</p>
      </div>`; return;
    }

    container.innerHTML = habits.map(h => {
      const streak  = computeStreak(h.log || []);
      const doneNow = h.log && h.log.includes(today);
      const dayLabels = ['S','M','T','W','T','F','S'];
      const dotsHtml  = last7.map((d, i) => {
        const done   = h.log && h.log.includes(d);
        const date   = new Date(d);
        const dayLbl = dayLabels[date.getDay()];
        return `<div class="habit-week-dot ${done ? 'done' : ''}" title="${d}" onclick="Habits.toggleDay('${h.id}','${d}')">${dayLbl}</div>`;
      }).join('');

      const total = h.log?.length || 0;
      const compPct = total > 0 ? Math.min(100, Math.round(total / 30 * 100)) : 0;

      return `
        <div class="habit-tracker-row">
          <span style="font-size:1.4rem;flex-shrink:0">${h.icon || '⭐'}</span>
          <div class="habit-tracker-info">
            <div class="habit-tracker-name">${escHtml(h.name)}</div>
            <div class="habit-tracker-sub">${h.frequency || 'Daily'} · ${total} total completions</div>
            <div class="progress" style="margin-top:5px;width:100px"><div class="progress-bar" style="width:${compPct}%"></div></div>
          </div>
          <div class="habit-week-dots">${dotsHtml}</div>
          <div class="habit-streak-badge">🔥 ${streak}</div>
          <button class="btn ${doneNow ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="Habits.toggleToday('${h.id}')">
            ${doneNow ? '✓ Done' : 'Mark Done'}
          </button>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Habits.delete('${h.id}')">🗑️</button>
        </div>
      `;
    }).join('');
  }

  function toggleDay(id, date) {
    const h = habits.find(h => h.id === id);
    if (!h) return;
    h.log = h.log || [];
    const idx = h.log.indexOf(date);
    if (idx >= 0) h.log.splice(idx, 1); else h.log.push(date);
    save(); render();
  }

  function openAdd() {
    const emojis = ['⭐','🏃','💪','📚','🧘','💧','🥗','😴','✍️','🎯'];
    Nexus.modal.open({
      title: '➕ New Habit',
      body: `
        <div class="form-group">
          <label class="form-label">Habit Name *</label>
          <input id="h-name" class="form-input" placeholder="e.g. Morning Run">
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${emojis.map(e => `<button type="button" class="mood-btn" data-emoji="${e}" onclick="this.parentNode.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('h-icon').value='${e}'">${e}</button>`).join('')}
          </div>
          <input id="h-icon" type="hidden" value="⭐">
        </div>
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select id="h-freq" class="form-select">
            <option value="Daily">Daily</option>
            <option value="Weekdays">Weekdays</option>
            <option value="Weekends">Weekends</option>
          </select>
        </div>`,
      footer: `<button class="btn btn-secondary" onclick="Nexus.modal.close()">Cancel</button>
               <button class="btn btn-primary" onclick="Habits.submitForm()">Add Habit</button>`
    });
  }
  function submitForm() {
    const name = document.getElementById('h-name')?.value.trim();
    if (!name) { Nexus.toast.error('Habit name is required'); return; }
    add({ name, icon: document.getElementById('h-icon')?.value || '⭐', frequency: document.getElementById('h-freq')?.value });
    Nexus.modal.close();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('habits-list')) return;
    load(); render();
    document.getElementById('btn-add-habit')?.addEventListener('click', openAdd);
  });

  return { toggleToday, toggleDay, delete: remove, submitForm, openAdd };
})();
window.Habits = Habits;
