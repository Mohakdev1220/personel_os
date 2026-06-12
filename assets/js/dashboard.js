/* ============================================================
   NEXUS OS — dashboard.js v4 FINAL
   All widgets: tasks, habits, calendar, storage, memories, gym
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderProductivityScore();
  renderDashboardTasks();
  renderDashboardHabits();
  renderMiniCalendar();
  renderStorageBar();
  renderDashboardMemories();
  renderGymSummary();
});

function animateCount(el, to, ms) {
  if (!el) return;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / ms, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function renderProductivityScore() {
  const score = Nexus.productivity.compute();
  animateCount(document.getElementById('productivity-score'), score, 900);
  const fill = document.querySelector('.progress-ring-fill');
  if (fill) {
    const r = parseFloat(fill.getAttribute('r') || 42);
    const circ = 2 * Math.PI * r;
    fill.style.strokeDasharray = circ;
    fill.style.strokeDashoffset = circ - (circ * score / 100);
  }
}

function renderStats() {
  const tasks  = Nexus.storage.get('tasks',   []);
  const habits = Nexus.storage.get('habits',  []);
  const goals  = Nexus.storage.get('goals',   []);
  const gym    = Nexus.storage.get('workouts',[]);
  const today  = Nexus.date.today();
  const done   = tasks.filter(t => t.done).length;
  const habDone= habits.filter(h => h.log && h.log.includes(today)).length;
  animateCount(document.getElementById('stat-tasks-val'),    done,         700);
  animateCount(document.getElementById('stat-tasks-done'),   done,         700);
  animateCount(document.getElementById('stat-habits-val'),   habDone,      700);
  animateCount(document.getElementById('stat-habits-today'), habDone,      700);
  animateCount(document.getElementById('stat-goals-count'),  goals.length, 700);
  animateCount(document.getElementById('stat-gym-sessions'), gym.length,   700);
}

function renderDashboardTasks() {
  const el = document.getElementById('dash-tasks'); if (!el) return;
  const tasks = Nexus.storage.get('tasks', []).filter(t => !t.done).slice(0, 6);
  if (!tasks.length) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>All caught up!</p></div>'; return; }
  const pm = { high:'badge-red', medium:'badge-yellow', normal:'badge-gray' };
  el.innerHTML = tasks.map(t => `
    <div class="task-item" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div onclick="dashToggle('${esc(t.id)}')" style="width:18px;height:18px;border-radius:5px;border:1.5px solid var(--border-hover);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:.6rem;transition:var(--tr);${t.done ? 'background:var(--accent);border-color:var(--accent);color:#fff' : ''}">${t.done ? '✓' : ''}</div>
      <span style="flex:1;font-size:.84rem;color:var(--text-primary)">${esc(t.title)}</span>
      <span class="badge ${pm[t.priority] || 'badge-gray'}" style="font-size:.63rem">${t.priority || 'normal'}</span>
    </div>`).join('');
}

window.dashToggle = function(id) {
  const tasks = Nexus.storage.get('tasks', []);
  const t = tasks.find(t => t.id === id); if (!t) return;
  t.done = !t.done; t.completedAt = t.done ? new Date().toISOString() : null;
  Nexus.storage.set('tasks', tasks);
  renderDashboardTasks(); renderStats(); renderProductivityScore();
  Nexus.toast.success(t.done ? 'Task done! ✅' : 'Task reopened');
};

function renderDashboardHabits() {
  const el = document.getElementById('dash-habits'); if (!el) return;
  const habits = Nexus.storage.get('habits', []).slice(0, 5);
  const today  = Nexus.date.today();
  if (!habits.length) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔥</div><p>No habits yet</p></div>'; return; }
  const last7 = Array.from({length:7}, (_,i) => { const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().split('T')[0]; });
  el.innerHTML = habits.map(h => {
    const streak = computeStreak(h.log || []);
    return `<div class="habit-row">
      <span style="font-size:.95rem">${h.icon || '⭐'}</span>
      <span class="habit-name">${esc(h.name)}</span>
      <div class="habit-dots">${last7.map(d => `<div class="habit-dot${h.log && h.log.includes(d) ? ' done' : ''}" title="${d}"></div>`).join('')}</div>
      <span class="habit-streak">🔥${streak}</span>
    </div>`;
  }).join('');
}

function computeStreak(log) {
  if (!log || !log.length) return 0;
  const s = [...log].sort().reverse(); let st = 0, cur = new Date(); cur.setHours(0,0,0,0);
  for (const d of s) { const dt = new Date(d), diff = Math.round((cur-dt)/86400000); if (diff === st) { st++; cur = dt; } else break; }
  return st;
}

function renderMiniCalendar() {
  const el = document.getElementById('mini-cal'); if (!el) return;
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
  const events = Nexus.storage.get('events', []);
  const evDays = events.filter(e => { const d=new Date(e.date); return d.getFullYear()===y && d.getMonth()===m; }).map(e => new Date(e.date).getDate());
  const first  = new Date(y, m, 1).getDay(), days = new Date(y, m+1, 0).getDate();
  const monthLabel = now.toLocaleDateString([], {month:'long', year:'numeric'});
  let cells = ''; for (let i=0;i<first;i++) cells+='<div></div>';
  for (let d=1;d<=days;d++) cells+=`<div class="mini-cal-day${d===today?' today':''}${evDays.includes(d)?' has-event':''}">${d}</div>`;
  el.innerHTML = `<div class="mini-cal-header"><span class="mini-cal-title">${monthLabel}</span></div><div class="mini-cal-grid">${['S','M','T','W','T','F','S'].map(d=>`<div class="mini-cal-day-label">${d}</div>`).join('')}${cells}</div>`;
}

function renderStorageBar() {
  const raw = JSON.stringify(Nexus.storage.export()).length;
  const kb  = (raw/1024).toFixed(1);
  const p   = Math.min(100, (raw/(5*1024*1024)*100)).toFixed(1);
  const col = p>80 ? '#f87171' : p>50 ? '#f59e0b' : 'var(--accent)';
  const bar = document.getElementById('storage-bar');
  if (bar) bar.innerHTML = `<div class="storage-seg" style="width:${p}%;background:${col}"></div>`;
  const u = document.getElementById('storage-used'); if(u) u.textContent = `${kb} KB used`;
  const pc= document.getElementById('storage-pct');  if(pc) pc.textContent= `${p}% of ~5MB`;
}

function renderDashboardMemories() {
  const el = document.getElementById('dash-memories'); if (!el) return;
  const mems = Nexus.storage.get('memories', []).slice(0, 3);
  if (!mems.length) { el.innerHTML='<div class="empty-state"><div class="empty-state-icon">📸</div><p>No memories yet</p></div>'; return; }
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">${mems.map(m=>`
    <div class="memory-card-sm">
      <div class="memory-img">${m.emoji||'📸'}</div>
      <div class="memory-info"><div class="memory-title">${esc(m.title||'Memory')}</div><div class="memory-date">${Nexus.date.timeAgo(m.created)}</div></div>
    </div>`).join('')}</div>`;
}

function renderGymSummary() {
  const el = document.getElementById('dash-gym'); if (!el) return;
  const wk = Nexus.storage.get('workouts', []);
  if (!wk.length) { el.innerHTML='<div class="empty-state"><div class="empty-state-icon">🏋️</div><p>No workouts yet</p></div>'; return; }
  const last = wk[wk.length-1];
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const weekCt  = wk.filter(w => new Date(w.date||w.created) >= weekAgo).length;
  el.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
    <div style="font-size:2rem">🏋️</div>
    <div>
      <div style="font-weight:700;font-size:.87rem;color:var(--text-primary)">${esc(last.name||'Last Workout')}</div>
      <div style="font-size:.74rem;color:var(--text-muted);margin-top:2px">${Nexus.date.timeAgo(last.date||last.created)}</div>
      <div style="font-size:.77rem;color:var(--text-secondary);margin-top:2px">${last.exercises?.length||0} exercises · ${weekCt} this week</div>
    </div>
  </div>`;
}

function esc(s) { return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }