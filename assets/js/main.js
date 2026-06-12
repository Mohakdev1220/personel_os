/* ============================================================
   NEXUS OS — main.js v4 FINAL
   Fixes: light mode everywhere, mobile sidebar close,
   accent full cascade, weather light mode, Firebase auth
   ============================================================ */
'use strict';
const Nexus = window.Nexus || {};
window.Nexus = Nexus;

/* ── STORAGE ── */
Nexus.storage = {
  get(k,fb=null){try{const r=localStorage.getItem('nexus_'+k);return r!==null?JSON.parse(r):fb;}catch{return fb;}},
  set(k,v){try{localStorage.setItem('nexus_'+k,JSON.stringify(v));return true;}catch{return false;}},
  remove(k){localStorage.removeItem('nexus_'+k);},
  export(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('nexus_')){try{d[k]=JSON.parse(localStorage.getItem(k));}catch{}}}return d;},
  import(data){Object.entries(data).forEach(([k,v])=>{if(k.startsWith('nexus_')){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}});}
};

/* ── TOAST ── */
Nexus.toast=(()=>{
  let c;
  const icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  function ensure(){c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';document.body.appendChild(c);}}
  function show(msg,type,dur){ensure();const t=document.createElement('div');t.className='toast '+type;t.innerHTML='<span class="toast-icon">'+(icons[type]||'ℹ️')+'</span><span style="flex:1">'+msg+'</span>';c.appendChild(t);setTimeout(()=>{t.classList.add('removing');t.addEventListener('animationend',()=>t.remove(),{once:true});},dur||3500);}
  return{success:(m,d)=>show(m,'success',d),error:(m,d)=>show(m,'error',d),warning:(m,d)=>show(m,'warning',d),info:(m,d)=>show(m,'info',d)};
})();

/* ── MODAL ── */
Nexus.modal={
  _ov:null,
  open(cfg){
    const{title,body,footer,size=''}=cfg;
    const ov=document.createElement('div');ov.className='modal-overlay';
    ov.innerHTML='<div class="modal '+size+'"><div class="modal-header"><span class="modal-title">'+title+'</span><button class="modal-close btn-icon btn" onclick="Nexus.modal.close()">✕</button></div><div class="modal-body">'+body+'</div>'+(footer?'<div class="modal-footer">'+footer+'</div>':'')+'</div>';
    document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('active'));
    ov.addEventListener('click',e=>{if(e.target===ov)Nexus.modal.close();});
    document.addEventListener('keydown',this._esc);this._ov=ov;
  },
  close(){if(!this._ov)return;this._ov.classList.remove('active');const ov=this._ov;this._ov=null;ov.addEventListener('transitionend',()=>ov.remove(),{once:true});document.removeEventListener('keydown',this._esc);},
  _esc(e){if(e.key==='Escape')Nexus.modal.close();},
  confirm(cfg){
    return new Promise(resolve=>{
      const{title,message,confirmText='Confirm',cancelText='Cancel',danger=false}=cfg;
      const ov=document.createElement('div');ov.className='modal-overlay';
      ov.innerHTML='<div class="confirm-dialog"><div class="confirm-icon">'+(danger?'🗑️':'❓')+'</div><div class="confirm-title">'+title+'</div><div class="confirm-message">'+message+'</div><div class="confirm-actions"><button class="btn btn-secondary" id="cn">'+cancelText+'</button><button class="btn '+(danger?'btn-danger':'btn-primary')+'" id="cy">'+confirmText+'</button></div></div>';
      document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('active'));
      const done=v=>{ov.classList.remove('active');ov.addEventListener('transitionend',()=>ov.remove(),{once:true});resolve(v);};
      ov.querySelector('#cy').onclick=()=>done(true);ov.querySelector('#cn').onclick=()=>done(false);
    });
  }
};

/* ── SIDEBAR — mobile auto-close fix ── */
Nexus.sidebar={
  el:null,mc:null,tog:null,ov:null,collapsed:false,
  init(){
    this.el=document.querySelector('.sidebar');this.mc=document.querySelector('.main-content');
    this.tog=document.querySelector('#sidebar-toggle');this.ov=document.querySelector('#sidebar-overlay');
    if(!this.el)return;
    this.collapsed=Nexus.storage.get('sidebar_collapsed',false);
    if(this.collapsed&&window.innerWidth>768)this._col(true);
    this.tog?.addEventListener('click',()=>this.toggle());
    // ✅ FIX: overlay closes sidebar on mobile
    this.ov?.addEventListener('click',()=>this.closeMobile());
    // ✅ FIX: any nav link closes sidebar on mobile
    this.el.querySelectorAll('.nav-item').forEach(a=>a.addEventListener('click',()=>{if(window.innerWidth<=768)this.closeMobile();}));
    this._setActive();window.addEventListener('resize',()=>this._resize());this._resize();
  },
  toggle(){if(window.innerWidth<=768)this._mob();else{this.collapsed=!this.collapsed;this._col(this.collapsed);Nexus.storage.set('sidebar_collapsed',this.collapsed);}},
  _col(s){this.el.classList.toggle('collapsed',s);this.mc?.classList.toggle('expanded',s);},
  _mob(){const open=this.el.classList.toggle('mobile-open');this.ov?.classList.toggle('active',open);document.body.style.overflow=open?'hidden':'';},
  closeMobile(){this.el.classList.remove('mobile-open');this.ov?.classList.remove('active');document.body.style.overflow='';},
  _resize(){if(window.innerWidth>768){this.el.classList.remove('mobile-open');this.ov?.classList.remove('active');document.body.style.overflow='';this._col(this.collapsed);}},
  _setActive(){
    const file=location.pathname.split('/').pop().replace('.html','')||'index';
    this.el.querySelectorAll('.nav-item').forEach(a=>{a.classList.remove('active');const h=(a.getAttribute('href')||'').split('/').pop().replace('.html','');if(h===file||(file===''&&h==='index'))a.classList.add('active');});
  }
};

/* ── CLOCK ── */
Nexus.clock={
  init(){this._tick();setInterval(()=>this._tick(),1000);},
  _tick(){
    const now=new Date();
    const ts=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const ds=now.toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const cl=document.getElementById('live-clock');if(cl)cl.textContent=ts;
    ['live-date','live-date-sub'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ds;});
  }
};

/* ── THEME — full accent cascade ── */
Nexus.theme={
  init(){
    const saved=Nexus.storage.get('theme','dark');
    document.body.classList.toggle('light-mode',saved==='light');
    this.setAccent(Nexus.storage.get('accent','#3b82f6'),false);
    this._sync();
  },
  toggle(){const light=document.body.classList.toggle('light-mode');Nexus.storage.set('theme',light?'light':'dark');this._sync();return light;},
  _sync(){
    const light=document.body.classList.contains('light-mode');
    const chk=document.getElementById('theme-toggle');if(chk)chk.checked=light;
    const btn=document.getElementById('theme-toggle-btn');if(btn)btn.textContent=light?'🌙':'☀️';
  },
  setAccent(hex,persist=true){
    if(!hex||!/^#[0-9a-fA-F]{6}$/.test(hex))return;
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    const root=document.documentElement;
    root.style.setProperty('--accent',hex);
    root.style.setProperty('--accent-light',hex);
    root.style.setProperty('--accent-r',r);root.style.setProperty('--accent-g',g);root.style.setProperty('--accent-b',b);
    root.style.setProperty('--accent-glow','rgba('+r+','+g+','+b+',.35)');
    root.style.setProperty('--accent-dim','rgba('+r+','+g+','+b+',.12)');
    root.style.setProperty('--border-hover','rgba('+r+','+g+','+b+',.4)');
    root.style.setProperty('--border-accent','rgba('+r+','+g+','+b+',.55)');
    root.style.setProperty('--shadow-accent','0 0 24px rgba('+r+','+g+','+b+',.3)');
    if(persist)Nexus.storage.set('accent',hex);
  }
};

/* ── PROFILE ── */
Nexus.profile={
  load(){
    const p=Nexus.storage.get('profile',{name:'User',email:'',bio:''});
    document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=p.name||'User');
    document.querySelectorAll('.user-avatar').forEach(el=>{if(!el.querySelector('img'))el.textContent=(p.name||'U').slice(0,2).toUpperCase();});
    return p;
  },
  save(data){Nexus.storage.set('profile',data);this.load();}
};

/* ── DATE ── */
Nexus.date={
  format(ds,opts={}){const d=new Date(ds);return isNaN(d)?'':d.toLocaleDateString([],{year:'numeric',month:'short',day:'numeric',...opts});},
  today(){return new Date().toISOString().split('T')[0];},
  timeAgo(ds){const diff=Date.now()-new Date(ds).getTime(),m=60000,h=m*60,dy=h*24,w=dy*7;if(diff<m)return'just now';if(diff<h)return Math.floor(diff/m)+'m ago';if(diff<dy)return Math.floor(diff/h)+'h ago';if(diff<w)return Math.floor(diff/dy)+'d ago';return this.format(ds);},
  greeting(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening';}
};
Nexus.uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* ── PRODUCTIVITY SCORE ── */
Nexus.productivity={
  compute(){
    const tasks=Nexus.storage.get('tasks',[]),habits=Nexus.storage.get('habits',[]),goals=Nexus.storage.get('goals',[]),today=Nexus.date.today();
    const tS=tasks.length?(tasks.filter(t=>t.done).length/tasks.length)*40:0;
    const hS=habits.length?(habits.filter(h=>h.log&&h.log.includes(today)).length/habits.length)*35:0;
    const gS=goals.length?goals.reduce((s,g)=>s+(g.progress||0),0)/goals.length*0.25:0;
    return Math.min(100,Math.round(tS+hS+gS));
  }
};

/* ── WEATHER — light mode fix ── */
Nexus.weather={
  async init(){
    const card=document.getElementById('weather-card');if(!card)return;
    const cache=Nexus.storage.get('weather_cache',null);
    if(cache&&Date.now()-cache.ts<900000){this._render(card,cache);return;}
    if(!navigator.geolocation){card.innerHTML=this._ph('📍','Allow location for weather');return;}
    card.innerHTML=this._ph('🔄','Getting weather…');
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const{latitude:lat,longitude:lon}=pos.coords;
        const res=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current_weather=true&timezone=auto');
        const data=await res.json();const cw=data.current_weather;
        let city='Your Location';
        try{const g=await(await fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json')).json();city=g.address?.city||g.address?.town||g.address?.village||city;}catch{}
        const info={ts:Date.now(),temp:Math.round(cw.temperature),wind:Math.round(cw.windspeed),code:cw.weathercode,city};
        Nexus.storage.set('weather_cache',info);this._render(card,info);
      }catch{card.innerHTML=this._ph('❌','Unavailable');}
    },()=>{card.innerHTML=this._ph('📍','Allow location');});
  },
  _icon(c){if(c===0)return'☀️';if(c<=2)return'⛅';if(c===3)return'☁️';if(c>=45&&c<=48)return'🌫️';if(c>=51&&c<=67)return'🌧️';if(c>=71&&c<=77)return'❄️';if(c>=80&&c<=82)return'🌦️';if(c>=95)return'⛈️';return'🌡️';},
  _desc(c){if(c===0)return'Clear sky';if(c<=2)return'Partly cloudy';if(c===3)return'Overcast';if(c>=45&&c<=48)return'Foggy';if(c>=51&&c<=55)return'Drizzle';if(c>=61&&c<=67)return'Rainy';if(c>=71&&c<=77)return'Snow';if(c>=80&&c<=82)return'Showers';if(c>=95)return'Thunderstorm';return'Mixed';},
  _render(card,i){card.innerHTML='<div class="weather-icon">'+this._icon(i.code)+'</div><div class="weather-temp">'+i.temp+'°C</div><div class="weather-label">'+this._desc(i.code)+'</div><div style="font-size:.7rem;color:var(--text-muted);margin-top:4px">📍 '+i.city+'</div><div style="font-size:.68rem;color:var(--text-muted);margin-top:2px">💨 '+i.wind+' km/h</div>';},
  _ph(icon,msg){return '<div class="weather-icon">'+icon+'</div><div style="font-size:.76rem;color:var(--text-muted);margin-top:6px;text-align:center">'+msg+'</div><button onclick="Nexus.weather.init()" class="btn btn-secondary btn-sm" style="margin-top:8px;font-size:.7rem">📍 Get Weather</button>';}
};

/* ── NOTIFICATIONS ── */
Nexus.notifications={
  async request(){if(!('Notification'in window))return false;if(Notification.permission==='granted')return true;return(await Notification.requestPermission())==='granted';},
  async push(title,body){const ok=await this.request();if(ok)new Notification(title,{body});else Nexus.toast.info('🔔 '+title+': '+body);},
  _last:0,
  startReminders(){this._check();setInterval(()=>this._check(),60000);},
  _check(){
    if(Date.now()-this._last<300000)return;
    const today=Nexus.date.today();
    const tasks=Nexus.storage.get('tasks',[]);const habits=Nexus.storage.get('habits',[]);
    const overdue=tasks.filter(t=>!t.done&&t.dueDate&&t.dueDate<today);
    if(overdue.length){this.push('⚠️ Overdue Tasks',overdue.length+' task(s) overdue!');this._last=Date.now();return;}
    if(new Date().getHours()>=20){const pend=habits.filter(h=>!(h.log&&h.log.includes(today))).length;if(pend>0){this.push('🔥 Habit Reminder',pend+' habit(s) not done today!');this._last=Date.now();}}
  }
};

/* ── FIREBASE AUTH SKELETON ── */
Nexus.auth={
  /*
   * ══════════════════════════════════════════════
   *  FIREBASE SETUP — ADD YOUR CONFIG HERE
   *  1. Go to https://console.firebase.google.com
   *  2. Create project → Add Web App → Copy config
   *  3. Paste values below
   *  4. Enable Authentication → Google sign-in
   *  5. Enable Firestore Database
   * ══════════════════════════════════════════════
   */
  config:{
    apiKey:           "YOUR_API_KEY",
    authDomain:       "YOUR_PROJECT.firebaseapp.com",
    projectId:        "YOUR_PROJECT_ID",
    storageBucket:    "YOUR_PROJECT.appspot.com",
    messagingSenderId:"YOUR_SENDER_ID",
    appId:            "YOUR_APP_ID"
  },
  _initialized:false,user:null,
  init(){
    if(typeof firebase==='undefined'){console.log('Firebase SDK not loaded — add CDN scripts to HTML');return;}
    if(this._initialized)return;
    try{
      if(!firebase.apps.length)firebase.initializeApp(this.config);
      this._initialized=true;
      firebase.auth().onAuthStateChanged(u=>{this.user=u;this._updateUI(u);});
    }catch(e){console.warn('Firebase init:',e.message);}
  },
  async signInGoogle(){
    if(!this._initialized){Nexus.toast.warning('Add Firebase config in assets/js/main.js first!');return;}
    try{
      const p=new firebase.auth.GoogleAuthProvider();
      const r=await firebase.auth().signInWithPopup(p);
      Nexus.profile.save({name:r.user.displayName,email:r.user.email,bio:'',photoURL:r.user.photoURL});
      Nexus.toast.success('Signed in as '+r.user.displayName+' 👋');
      await this.loadFromCloud();
    }catch(e){Nexus.toast.error('Sign-in failed: '+e.message);}
  },
  async signOut(){
    if(!this._initialized)return;
    await firebase.auth().signOut();this.user=null;this._updateUI(null);Nexus.toast.info('Signed out');
  },
  async syncToCloud(){
    if(!this.user||!this._initialized){Nexus.toast.warning('Sign in first to sync');return;}
    try{
      await firebase.firestore().collection('users').doc(this.user.uid).set({data:Nexus.storage.export(),updatedAt:new Date().toISOString()},{merge:true});
      Nexus.toast.success('Synced to cloud ☁️');
    }catch(e){Nexus.toast.error('Sync failed: '+e.message);}
  },
  async loadFromCloud(){
    if(!this.user||!this._initialized)return;
    try{
      const doc=await firebase.firestore().collection('users').doc(this.user.uid).get();
      if(doc.exists&&doc.data().data){Nexus.storage.import(doc.data().data);Nexus.toast.success('Data loaded from cloud ☁️');setTimeout(()=>location.reload(),1200);}
    }catch(e){Nexus.toast.error('Load failed: '+e.message);}
  },
  _updateUI(user){
    document.querySelectorAll('.auth-name').forEach(el=>el.textContent=user?(user.displayName||'User'):'Guest');
    document.querySelectorAll('.btn-signin').forEach(el=>el.style.display=user?'none':'flex');
    document.querySelectorAll('.btn-signout').forEach(el=>el.style.display=user?'flex':'none');
    document.querySelectorAll('.btn-cloudsync').forEach(el=>el.style.display=user?'flex':'none');
    if(user?.photoURL){document.querySelectorAll('.user-avatar').forEach(el=>{el.innerHTML='<img src="'+user.photoURL+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover" alt="">';});}
  }
};

/* ── TABS ── */
Nexus.tabs={
  init(){
    document.querySelectorAll('.tabs-wrapper').forEach(w=>{
      w.querySelectorAll('.tab-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
          w.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
          w.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
          btn.classList.add('active');const pane=w.querySelector('#'+btn.dataset.tab);if(pane)pane.classList.add('active');
        });
      });
    });
  }
};

/* ── SEARCH Ctrl+K ── */
Nexus.search={
  init(){
    const inp=document.querySelector('.topbar-search input');if(!inp)return;
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&inp.value.trim())Nexus.toast.info('Searching for "'+inp.value.trim()+'"…');});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();inp.focus();inp.select();}});
  }
};

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded',()=>{
  Nexus.theme.init();
  Nexus.profile.load();
  Nexus.sidebar.init();
  Nexus.clock.init();
  Nexus.search.init();
  Nexus.tabs.init();
  Nexus.weather.init();
  Nexus.notifications.startReminders();
  Nexus.auth.init();
  const greet=document.getElementById('welcome-greeting');if(greet)greet.textContent=Nexus.date.greeting();
  const btn=document.getElementById('theme-toggle-btn');if(btn)btn.addEventListener('click',()=>Nexus.theme.toggle());
});