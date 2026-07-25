'use strict';

/* =========================================================================
   APP STATE
   ========================================================================= */
const App = {
  route: 'dashboard',
  sidebarCollapsed: false,
  currentUser: { name: 'Sarah Whitfield', role: 'Managing Partner', firm: 'Whitfield & Co Chartered Accountants' },
};

const NAV = [
  { section: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'insights', label: 'Insights', icon: 'insights' },
  ]},
  { section: 'Practice', items: [
    { id: 'work', label: 'Work', icon: 'work', badge: () => DB.jobs.filter(j=>!['completed','cancelled'].includes(j.status)).length },
    { id: 'tasks', label: 'Tasks', icon: 'tasks' },
    { id: 'workflow', label: 'Workflow Builder', icon: 'workflow' },
    { id: 'templates', label: 'Work Templates', icon: 'templates' },
    { id: 'automations', label: 'Automations', icon: 'automation' },
  ]},
  { section: 'Clients', items: [
    { id: 'clients', label: 'Clients', icon: 'clients' },
    { id: 'documents', label: 'Documents', icon: 'docs' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'helpdesk', label: 'Helpdesk', icon: 'ticket' },
  ]},
  { section: 'Firm', items: [
    { id: 'team', label: 'Team', icon: 'team' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'time', label: 'Time Tracking', icon: 'time' },
    { id: 'billing', label: 'Billing', icon: 'billing' },
  ]},
];

const ROUTE_META = {
  dashboard:{ title:'Dashboard', sub:'Good morning — here\u2019s how the firm is tracking today.' },
  insights:{ title:'Insights', sub:'Executive intelligence across jobs, clients and staff.' },
  work:{ title:'Work', sub:'Every job across the firm, in one place.' },
  tasks:{ title:'Tasks', sub:'Granular to-dos across all active jobs.' },
  workflow:{ title:'Workflow Builder', sub:'Design the stages a job moves through.' },
  templates:{ title:'Work Templates', sub:'Reusable job blueprints for common engagements.' },
  automations:{ title:'Automations', sub:'Let the practice run itself.' },
  clients:{ title:'Clients', sub:'Every relationship the firm manages.' },
  documents:{ title:'Documents', sub:'Client files, requests and version history.' },
  calendar:{ title:'Calendar', sub:'Meetings, deadlines and lodgements.' },
  helpdesk:{ title:'Helpdesk', sub:'Client and internal support tickets.' },
  team:{ title:'Team', sub:'Capacity, workload and performance.' },
  reports:{ title:'Reports', sub:'Revenue, productivity and turnaround analytics.' },
  time:{ title:'Time Tracking', sub:'Timers, timesheets and billable hours.' },
  billing:{ title:'Billing', sub:'Invoices, payments and outstanding balances.' },
  settings:{ title:'Settings', sub:'Firm profile, branding, staff and security.' },
};

/* =========================================================================
   BOOTSTRAP
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  renderLogin();
});

function renderLogin(){
  const root = document.getElementById('root');
  root.innerHTML = `
  <div class="login-screen">
    <div class="login-form-side">
      <div class="login-box fade-in">
        <div class="login-brand">
          <svg class="mark" viewBox="0 0 34 34"><rect width="34" height="34" rx="9" fill="#2953E4"/><path d="M9 22V12l8 6 8-6v10" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>PracticeFlow</span>
        </div>
        <h1>Welcome back</h1>
        <p class="login-sub">Sign in to Whitfield &amp; Co&rsquo;s workspace.</p>
        <form id="loginForm">
          <div class="field">
            <label for="loginEmail">Email address</label>
            <input id="loginEmail" type="email" placeholder="you@yourfirm.com.au" value="sarah@whitfieldco.com.au" required />
          </div>
          <div class="field">
            <label for="loginPass">Password</label>
            <input id="loginPass" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" value="practiceflow" required />
          </div>
          <div class="field-row-between">
            <label class="check-row"><input type="checkbox" checked/> Remember me</label>
            <button type="button" class="link-btn" id="forgotBtn">Forgot password?</button>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;" id="loginSubmit">
            <span id="loginSubmitLabel">Sign in</span>
          </button>
        </form>
        <div class="login-demo"><b>Demo mode.</b> Any email and password will sign you in \u2014 this is a self-contained prototype with no live backend.</div>
      </div>
    </div>
    <div class="login-art">
      <div class="login-ring-float">${miniHealthRing(86)}</div>
      <div class="login-art-content">
        <div class="eyebrow">Practice Management, Rebuilt</div>
        <h2>Run the whole firm from one calm, connected workspace.</h2>
        <p>Jobs, clients, documents, deadlines and capacity \u2014 mapped to how Australian accounting practices actually work, from intake to lodgement.</p>
      </div>
    </div>
  </div>`;

  qs('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = qs('#loginSubmit'); const label = qs('#loginSubmitLabel');
    btn.disabled = true; label.innerHTML = `<span class="spinner" style="border-color:rgba(255,255,255,.4);border-top-color:#fff;"></span>`;
    setTimeout(() => { renderShell(); }, 650);
  });
  qs('#forgotBtn').addEventListener('click', () => toastLoginHint());
}
function toastLoginHint(){
  const box = qs('.login-demo');
  box.style.background = 'var(--amber-100)'; box.style.borderColor='#F0D08A';
  box.innerHTML = `<b>No worries.</b> In this prototype any credentials work \u2014 just hit Sign in.`;
}

function miniHealthRing(size){
  const r = size/2 - 8; const c = 2*Math.PI*r; const pct = 0.86;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle class="ring" cx="${size/2}" cy="${size/2}" r="${r}" stroke="rgba(255,255,255,.15)" style="fill:none;stroke-width:8;"/>
    <circle class="ring" cx="${size/2}" cy="${size/2}" r="${r}" stroke="#6FE3B4" stroke-linecap="round" style="fill:none;stroke-width:8;stroke-dasharray:${c};stroke-dashoffset:${c*(1-pct)};transform-origin:center;"/>
  </svg>`;
}

/* =========================================================================
   APP SHELL
   ========================================================================= */
function renderShell(){
  const root = document.getElementById('root');
  root.innerHTML = `
    <div id="toastWrap" class="toast-wrap"></div>
    <div class="overlay" id="overlay"></div>
    <div class="app-shell" id="appShell">
      ${renderSidebar()}
      <div class="main-col">
        ${renderTopbar()}
        <main class="page view-fade" id="pageContent"></main>
      </div>
    </div>
    <div class="cmdk" id="cmdk"></div>
    <div class="drawer" id="drawer"></div>
    <div class="modal" id="modal"></div>
  `;
  bindShellEvents();
  navigate('dashboard');
  setTimeout(() => toast('Welcome back, Sarah. 4 jobs need your review today.', 'info'), 900);
}

function renderSidebar(){
  return `
  <aside class="sidebar" id="sidebar">
    <div class="collapse-btn" id="collapseBtn">${Icon('chevronLeft')}</div>
    <div class="sidebar-brand">
      <svg class="mark" viewBox="0 0 34 34"><rect width="34" height="34" rx="9" fill="#2953E4"/><path d="M9 22V12l8 6 8-6v10" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>PracticeFlow</span>
    </div>
    <nav style="overflow-y:auto;flex:1;">
      ${NAV.map(sec => `
        <div class="nav-section">
          <div class="nav-section-title">${sec.section}</div>
          ${sec.items.map(it => `
            <div class="nav-item ${App.route===it.id?'active':''}" data-route="${it.id}" data-tip="${it.label}">
              ${Icon(it.icon)}<span class="nav-label">${it.label}</span>
              ${it.badge ? `<span class="nav-badge">${it.badge()}</span>` : ''}
            </div>`).join('')}
        </div>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="nav-item" data-route="settings"><span style="width:18px;display:inline-flex;">${Icon('settings')}</span><span class="nav-label">Settings</span></div>
      <div class="sidebar-firm" id="firmSwitcher">
        ${avatarHTML(App.currentUser.name, 32)}
        <div class="who"><strong>${App.currentUser.name}</strong><small>${App.currentUser.role}</small></div>
      </div>
    </div>
  </aside>`;
}

function renderTopbar(){
  const unread = DB.notifications.filter(n=>!n.read).length;
  return `
  <header class="topbar">
    <div class="topbar-crumb"><b id="crumbTitle">${ROUTE_META[App.route]?.title||''}</b></div>
    <div class="topbar-search" id="openCmdk">
      ${Icon('search')}<span>Search clients, jobs, documents\u2026</span><span class="kbd">\u2318K</span>
    </div>
    <div class="topbar-right">
      <button class="icon-btn tooltip" data-tip="Time tracking" id="timerBtn">${Icon('time')}</button>
      <button class="icon-btn tooltip" data-tip="Notifications" id="notifBtn">${Icon('bell')}${unread?'<span class="dot"></span>':''}</button>
      <div class="hr-v" style="height:22px;margin:0 4px;"></div>
      <img class="topbar-avatar" id="topAvatarImg" style="display:none" />
      <div id="topAvatarWrap">${avatarHTML(App.currentUser.name,34)}</div>
    </div>
  </header>`;
}

function bindShellEvents(){
  qs('#collapseBtn').addEventListener('click', () => {
    App.sidebarCollapsed = !App.sidebarCollapsed;
    qs('#appShell').classList.toggle('sidebar-collapsed', App.sidebarCollapsed);
    qs('#collapseBtn').innerHTML = Icon(App.sidebarCollapsed ? 'chevronRight' : 'chevronLeft');
  });
  qsa('.nav-item[data-route]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.route)));
  qs('#openCmdk').addEventListener('click', openCommandPalette);
  qs('#notifBtn').addEventListener('click', openNotifications);
  qs('#firmSwitcher').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    openContextMenu(r.left, r.top - 90, [
      { id:'settings', label:'Settings', icon:'settings', onClick: () => navigate('settings') },
      { id:'switch', label:'Switch firm (Enterprise)', icon:'building', onClick: () => toast('Firm switching is available on the Enterprise plan.', 'info') },
      { sep:true },
      { id:'logout', label:'Log out', icon:'logout', danger:true, onClick: renderLogin },
    ]);
  });
  qs('#topAvatarWrap').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    openContextMenu(r.right-190, r.bottom+8, [
      { id:'profile', label:'My profile', icon:'clients', onClick: () => navigate('settings') },
      { id:'settings', label:'Settings', icon:'settings', onClick: () => navigate('settings') },
      { sep:true },
      { id:'logout', label:'Log out', icon:'logout', danger:true, onClick: renderLogin },
    ]);
  });
  qs('#timerBtn').addEventListener('click', openTimerQuick);
  qs('#overlay').addEventListener('click', closeAllOverlays);
  document.addEventListener('keydown', globalKeydown);
}

function globalKeydown(e){
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCommandPalette(); return; }
  if (e.key === 'Escape'){ closeAllOverlays(); }
}

function closeAllOverlays(){
  qs('#overlay')?.classList.remove('open');
  qs('#cmdk')?.classList.remove('open');
  qs('#drawer')?.classList.remove('open');
  qs('#modal')?.classList.remove('open');
  const notifPanel = document.getElementById('notifPanel'); if(notifPanel) notifPanel.remove();
}

/* =========================================================================
   ROUTER
   ========================================================================= */
const Modules = {}; // populated by module files: Modules.dashboard = function(container){...}

function navigate(route){
  App.route = route;
  qsa('.nav-item[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route===route));
  const meta = ROUTE_META[route] || { title: route, sub:'' };
  const crumb = qs('#crumbTitle'); if (crumb) crumb.textContent = meta.title;
  const container = qs('#pageContent');
  container.classList.remove('view-fade'); void container.offsetWidth; container.classList.add('view-fade');
  if (typeof Modules[route] === 'function') {
    Modules[route](container);
  } else {
    container.innerHTML = pageHeadHTML(meta.title, meta.sub) + emptyState('sparkle','Coming soon',`The ${meta.title} module is being polished.`);
  }
  closeAllOverlays();
}

function pageHeadHTML(title, sub, actionsHTML=''){
  return `<div class="page-head"><div><h1>${esc(title)}</h1><div class="sub">${esc(sub||'')}</div></div><div class="page-actions">${actionsHTML}</div></div>`;
}
function emptyState(icon, title, body, ctaHTML=''){
  return `<div class="empty-state card" style="padding:60px 20px;"><div class="icon-wrap">${Icon(icon)}</div><h4>${esc(title)}</h4><p>${esc(body)}</p>${ctaHTML}</div>`;
}

/* =========================================================================
   COMMAND PALETTE
   ========================================================================= */
function openCommandPalette(){
  const cmdk = qs('#cmdk');
  cmdk.innerHTML = `
    <div class="cmdk-input-row">${Icon('search')}<input id="cmdkInput" placeholder="Search clients, jobs, documents, staff, or type a command\u2026" autocomplete="off"/><span class="kbd">esc</span></div>
    <div class="cmdk-list" id="cmdkList"></div>`;
  qs('#overlay').classList.add('open');
  cmdk.classList.add('open');
  const input = qs('#cmdkInput');
  setTimeout(()=>input.focus(), 50);
  renderCmdkResults('');
  input.addEventListener('input', () => renderCmdkResults(input.value));
}

function renderCmdkResults(query){
  const q = query.trim().toLowerCase();
  const list = qs('#cmdkList');
  if (!q){
    list.innerHTML = `
      <div class="cmdk-group-title">Quick actions</div>
      ${cmdkItem('plus','New job','Create','newJob')}
      ${cmdkItem('userPlus','New client','Create','newClient')}
      ${cmdkItem('workflow','Open Workflow Builder','Go to','workflow')}
      <div class="cmdk-group-title">Navigate</div>
      ${NAV.flatMap(s=>s.items).map(it=>cmdkItem(it.icon, it.label, 'Go to', it.id)).join('')}
    `;
  } else {
    const clientMatches = DB.clients.filter(c=>c.name.toLowerCase().includes(q)).slice(0,5);
    const jobMatches = DB.jobs.filter(j=>j.title.toLowerCase().includes(q) || j.clientName.toLowerCase().includes(q)).slice(0,5);
    const staffMatches = DB.staff.filter(s=>s.name.toLowerCase().includes(q)).slice(0,4);
    const docMatches = DB.documents.filter(d=>d.name.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q)).slice(0,4);
    list.innerHTML = `
      ${clientMatches.length?`<div class="cmdk-group-title">Clients</div>${clientMatches.map(c=>cmdkItem('clients', c.name, c.type, 'client:'+c.id)).join('')}`:''}
      ${jobMatches.length?`<div class="cmdk-group-title">Jobs</div>${jobMatches.map(j=>cmdkItem('work', j.title+' \u2014 '+j.clientName, WORK_STATUSES.find(s=>s.id===j.status).label, 'job:'+j.id)).join('')}`:''}
      ${staffMatches.length?`<div class="cmdk-group-title">Staff</div>${staffMatches.map(s=>cmdkItem('team', s.name, s.role, 'staff:'+s.id)).join('')}`:''}
      ${docMatches.length?`<div class="cmdk-group-title">Documents</div>${docMatches.map(d=>cmdkItem('docs', d.name, d.clientName, 'doc:'+d.id)).join('')}`:''}
      ${!clientMatches.length && !jobMatches.length && !staffMatches.length && !docMatches.length ? `<div class="empty-state" style="padding:34px 10px;"><p>No results for \u201c${esc(query)}\u201d</p></div>` : ''}
    `;
  }
  qsa('.cmdk-item').forEach(el => el.addEventListener('click', () => handleCmdkAction(el.dataset.action)));
}
function cmdkItem(icon,label,sub,action){
  return `<div class="cmdk-item" data-action="${action}">${Icon(icon)}<span>${esc(label)}</span><span class="cmdk-sub">${esc(sub)}</span></div>`;
}
function handleCmdkAction(action){
  closeAllOverlays();
  if (action==='newJob') return openJobModal();
  if (action==='newClient') return openClientModal();
  if (NAV.flatMap(s=>s.items).some(it=>it.id===action)) return navigate(action);
  const [type,id] = action.split(':');
  if (type==='client') { navigate('clients'); setTimeout(()=>openClientDrawer(id),150); }
  if (type==='job') { navigate('work'); setTimeout(()=>openJobDrawer(id),150); }
  if (type==='staff') { navigate('team'); setTimeout(()=>openStaffDrawer(id),150); }
  if (type==='doc') { navigate('documents'); }
}

/* =========================================================================
   NOTIFICATIONS PANEL
   ========================================================================= */
function openNotifications(){
  const existing = document.getElementById('notifPanel');
  if (existing){ existing.remove(); return; }
  const panel = document.createElement('div');
  panel.id = 'notifPanel';
  panel.className = 'card scale-in';
  panel.style.cssText = 'position:fixed;top:60px;right:22px;width:380px;max-height:70vh;overflow-y:auto;z-index:120;box-shadow:var(--shadow-lg);';
  panel.innerHTML = `
    <div style="padding:16px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;">
      <h3 style="font-size:14.5px;font-weight:700;">Notifications</h3>
      <button class="link-btn" id="markAllRead">Mark all read</button>
    </div>
    <div style="padding:8px;">
      ${DB.notifications.slice(0,18).map(n=>`
        <div class="notif-item ${n.read?'':'unread'}" data-id="${n.id}">
          <span class="notif-dot-icon" style="background:var(--${n.color}-100);color:var(--${n.color});">${Icon(n.icon)}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12.8px;line-height:1.4;">${n.text}</div>
            <div style="font-size:11px;color:var(--slate-300);margin-top:2px;">${timeAgo(n.at)}</div>
          </div>
        </div>`).join('')}
    </div>`;
  document.body.appendChild(panel);
  qs('#markAllRead').addEventListener('click', () => { DB.notifications.forEach(n=>n.read=true); panel.remove(); qs('#notifBtn').innerHTML = Icon('bell'); toast('All notifications marked as read','success'); });
  panel.querySelectorAll('.notif-item').forEach(el => el.addEventListener('click', () => {
    const n = DB.notifications.find(x=>x.id===el.dataset.id); if(n) n.read = true;
    el.classList.remove('unread');
  }));
  setTimeout(()=>document.addEventListener('click', function h(e){ if(!panel.contains(e.target) && e.target.id!=='notifBtn'){ panel.remove(); document.removeEventListener('click',h);} }),0);
}

function openTimerQuick(){
  toast('Timer started for General Admin \u2014 open Time Tracking to assign it to a job.', 'success');
}

/* =========================================================================
   GENERIC MODAL / DRAWER PRIMITIVES
   ========================================================================= */
function showModal(html, opts={}){
  const modal = qs('#modal');
  modal.className = 'modal scale-in' + (opts.large ? ' modal-lg' : '');
  modal.innerHTML = html;
  qs('#overlay').classList.add('open');
  modal.classList.add('open');
  modal.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click', closeAllOverlays));
}
function showDrawer(html){
  const drawer = qs('#drawer');
  drawer.innerHTML = html;
  qs('#overlay').classList.add('open');
  drawer.classList.add('open');
  drawer.querySelectorAll('[data-close-drawer]').forEach(el=>el.addEventListener('click', closeAllOverlays));
}
