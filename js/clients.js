'use strict';

const ClientState = { query:'', status:'all', sortKey:'name', sortDir:1 };

Modules.clients = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.clients.title, ROUTE_META.clients.sub, `
      <button class="btn btn-secondary" id="exportClients">${Icon('download')} Export</button>
      <button class="btn btn-primary" id="newClientBtn">${Icon('userPlus')} New Client</button>
    `)}
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
      <div class="input-wrap" style="min-width:240px;">${Icon('search')}<input id="clientSearch" placeholder="Search clients by name, ABN, manager\u2026"/></div>
      <span class="chip-filter ${ClientState.status==='all'?'active':''}" data-s="all">All (${DB.clients.length})</span>
      <span class="chip-filter ${ClientState.status==='Active'?'active':''}" data-s="Active">Active (${DB.clients.filter(c=>c.status==='Active').length})</span>
      <span class="chip-filter ${ClientState.status==='Onboarding'?'active':''}" data-s="Onboarding">Onboarding (${DB.clients.filter(c=>c.status==='Onboarding').length})</span>
      <span class="chip-filter ${ClientState.status==='At Risk'?'active':''}" data-s="At Risk">At Risk (${DB.clients.filter(c=>c.status==='At Risk').length})</span>
      <span class="text-slate-300" style="font-size:12px;margin-left:auto;" id="clientCount"></span>
    </div>
    <div class="card"><div style="overflow-x:auto;"><table class="data-table">
      <thead><tr>
        <th class="th-sort" data-k="name">Client</th><th>Type</th><th>Manager</th><th>Status</th>
        <th class="th-sort" data-k="openJobs">Open Jobs</th><th class="th-sort" data-k="revenueYTD">Revenue YTD</th><th>Tags</th><th></th>
      </tr></thead>
      <tbody id="clientTbody"></tbody>
    </table></div></div>
  `;

  qs('#newClientBtn').addEventListener('click', ()=>openClientModal());
  qs('#exportClients').addEventListener('click', ()=>toast('Client list exported to CSV (simulated)','success'));
  qs('#clientSearch').addEventListener('input', debounce(e=>{ ClientState.query=e.target.value; renderClientTable(); },200));
  qsa('.chip-filter').forEach(c=>c.addEventListener('click', ()=>{ ClientState.status=c.dataset.s; Modules.clients(container); }));
  qsa('.th-sort').forEach(th=>th.addEventListener('click', ()=>{
    const k = th.dataset.k;
    if (ClientState.sortKey===k) ClientState.sortDir*=-1; else { ClientState.sortKey=k; ClientState.sortDir=1; }
    renderClientTable();
  }));
  renderClientTable();
};

function renderClientTable(){
  const q = ClientState.query.toLowerCase();
  let rows = DB.clients.filter(c=>{
    if (ClientState.status!=='all' && c.status!==ClientState.status) return false;
    if (q && !(c.name.toLowerCase().includes(q) || (c.abn||'').includes(q) || c.manager.toLowerCase().includes(q))) return false;
    return true;
  });
  rows.sort((a,b)=>{
    let av=a[ClientState.sortKey], bv=b[ClientState.sortKey];
    if (typeof av==='string') { av=av.toLowerCase(); bv=bv.toLowerCase(); }
    if (av<bv) return -1*ClientState.sortDir; if(av>bv) return 1*ClientState.sortDir; return 0;
  });
  qs('#clientCount').textContent = `${rows.length} clients`;
  qs('#clientTbody').innerHTML = rows.map(c=>`
    <tr data-client="${c.id}">
      <td><div style="display:flex;align-items:center;gap:10px;">${avatarHTML(c.name,30)}<div><div class="cell-primary">${esc(c.name)}</div><div class="cell-sub">${c.abn?('ABN '+c.abn):esc(c.location)}</div></div></div></td>
      <td>${esc(c.type)}</td>
      <td>${esc(c.manager)}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="mono">${c.openJobs}</td>
      <td class="mono">${fmtMoney(c.revenueYTD)}</td>
      <td>${c.tags.slice(0,2).map(t=>`<span class="tag">${esc(t)}</span>`).join(' ')}</td>
      <td><button class="icon-btn ctxTrigger" data-client-menu="${c.id}">${Icon('dotsH')}</button></td>
    </tr>`).join('') || `<tr><td colspan="8">${emptyState('clients','No clients found','Try a different search or filter.')}</td></tr>`;

  qsa('#clientTbody tr[data-client]').forEach(tr=>{
    tr.addEventListener('click', (e)=>{ if(e.target.closest('.ctxTrigger')) return; openClientDrawer(tr.dataset.client); });
  });
  qsa('.ctxTrigger').forEach(btn=>btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const client = DB.clients.find(c=>c.id===btn.dataset.clientMenu);
    const r = btn.getBoundingClientRect();
    openContextMenu(r.left, r.bottom+4, [
      { id:'open', label:'View profile', icon:'clients', onClick:()=>openClientDrawer(client.id) },
      { id:'job', label:'New job', icon:'plus', onClick:()=>openJobModal(client.id) },
      { id:'edit', label:'Edit client', icon:'edit', onClick:()=>openClientModal(client) },
      { sep:true },
      { id:'archive', label:'Archive client', icon:'trash', danger:true, onClick:()=>{ DB.clients = DB.clients.filter(c=>c.id!==client.id); renderClientTable(); toast('Client archived','warn'); } },
    ]);
  }));
}

function statusBadge(status){
  const map = { Active:'badge-green', Onboarding:'badge-blue', 'At Risk':'badge-coral' };
  return `<span class="badge ${map[status]||'badge-slate'}">${status}</span>`;
}

/* ============================ CLIENT DRAWER ============================ */
let clientDrawerTab = 'overview';
function openClientDrawer(clientId){
  const client = DB.clients.find(c=>c.id===clientId); if(!client) return;
  clientDrawerTab = 'overview';
  renderClientDrawerContent(client);
}
function renderClientDrawerContent(client){
  const jobs = DB.jobs.filter(j=>j.clientId===client.id);
  const docs = DB.documents.filter(d=>d.clientId===client.id);
  showDrawer(`
    <div class="drawer-head">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="display:flex;gap:12px;align-items:center;">
          ${avatarHTML(client.name,44)}
          <div><h3 style="font-size:17px;">${esc(client.name)}</h3><div class="text-slate" style="font-size:12.5px;margin-top:2px;">${esc(client.type)} \u00b7 ${esc(client.location)}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" id="clientEditBtn">${Icon('edit')}</button>
          <button class="icon-btn" data-close-drawer>${Icon('x')}</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        ${statusBadge(client.status)}
        ${client.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}
      </div>
      <div class="tabs" style="margin:16px 0 0;border-bottom:none;">
        ${['overview','work','documents','notes'].map(t=>`<span class="tab ${clientDrawerTab===t?'active':''}" data-tab="${t}" style="margin-right:16px;">${t[0].toUpperCase()+t.slice(1)}</span>`).join('')}
      </div>
    </div>
    <div class="drawer-body" id="clientDrawerBody"></div>
  `);
  qs('#clientEditBtn').addEventListener('click', ()=>openClientModal(client));
  qsa('.drawer-head .tab').forEach(t=>t.addEventListener('click', ()=>{ clientDrawerTab=t.dataset.tab; renderClientDrawerContent(client); }));

  const body = qs('#clientDrawerBody');
  if (clientDrawerTab==='overview'){
    body.innerHTML = `
      <div class="drawer-section">
        <h4>Contact</h4>
        <div style="font-size:12.8px;line-height:2;">
          <div>${Icon('mail','icon-inline')} ${esc(client.email)}</div>
          <div>${esc(client.phone)}</div>
          ${client.abn?`<div>ABN ${client.abn}</div>`:''}
          <div>Client manager: <b>${esc(client.manager)}</b></div>
          <div>Client since ${fmtDate(client.since)}</div>
        </div>
      </div>
      <div class="drawer-section">
        <h4>Snapshot</h4>
        <div class="grid grid-3" style="gap:10px;">
          <div class="card card-pad" style="padding:12px;"><div class="text-slate-300" style="font-size:11px;">Open Jobs</div><div style="font-size:20px;font-weight:700;font-family:var(--font-display);">${jobs.filter(j=>!['completed','cancelled'].includes(j.status)).length}</div></div>
          <div class="card card-pad" style="padding:12px;"><div class="text-slate-300" style="font-size:11px;">Revenue YTD</div><div style="font-size:20px;font-weight:700;font-family:var(--font-display);">${fmtMoney(client.revenueYTD)}</div></div>
          <div class="card card-pad" style="padding:12px;"><div class="text-slate-300" style="font-size:11px;">Documents</div><div style="font-size:20px;font-weight:700;font-family:var(--font-display);">${docs.length}</div></div>
        </div>
      </div>
      <div class="drawer-section">
        <h4>Recent Activity</h4>
        <div class="timeline">
          ${jobs.flatMap(j=>j.activity.map(a=>({...a,job:j}))).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,5).map(a=>`
            <div class="timeline-item"><div style="font-size:12.5px;">${esc(a.text)}</div><div class="text-slate-300" style="font-size:11px;margin-top:2px;">${timeAgo(a.at)}</div></div>
          `).join('') || '<p class="text-slate-300" style="font-size:12.5px;">No recent activity.</p>'}
        </div>
      </div>`;
  } else if (clientDrawerTab==='work'){
    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h4 style="font-size:11.5px;text-transform:uppercase;color:var(--slate-300);font-weight:700;">${jobs.length} jobs</h4>
        <button class="btn btn-secondary btn-sm" id="clientNewJob">${Icon('plus')} New job</button>
      </div>
      ${jobs.map(j=>{ const st=WORK_STATUSES.find(s=>s.id===j.status); const d=dueLabel(j.dueDate);
        return `<div data-job="${j.id}" class="card card-pad" style="padding:12px 14px;margin-bottom:10px;cursor:pointer;">
          <div style="display:flex;justify-content:space-between;"><b style="font-size:13px;">${esc(j.service)}</b><span class="badge" style="background:${st.color}22;color:${st.color};">${st.label}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
            <span class="text-slate-300" style="font-size:11.5px;">${d.text}</span>${avatarHTML(j.assignee,20)}
          </div>
        </div>`;
      }).join('') || emptyState('work','No jobs yet','Create the first job for this client.')}`;
    qs('#clientNewJob')?.addEventListener('click', ()=>openJobModal(client.id));
    qsa('[data-job]').forEach(el=>el.addEventListener('click', ()=>openJobDrawer(el.dataset.job)));
  } else if (clientDrawerTab==='documents'){
    body.innerHTML = `
      <div class="upload-zone" style="margin-bottom:16px;" id="clientUpload">${Icon('upload')}<div style="margin-top:8px;font-size:12.5px;">Drag files here or click to upload</div></div>
      ${docs.map(d=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line-soft);">
        <span class="notif-dot-icon" style="background:var(--signal-100);color:var(--signal);">${Icon('docs')}</span>
        <div style="flex:1;min-width:0;"><div style="font-size:12.8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(d.name)}</div><div class="text-slate-300" style="font-size:11px;">${d.size} \u00b7 ${timeAgo(d.uploadedAt)}</div></div>
        <span class="badge ${d.status==='Approved'?'badge-green':'badge-amber'}">${d.status}</span>
      </div>`).join('') || emptyState('docs','No documents yet','Uploaded files will appear here.')}`;
    qs('#clientUpload')?.addEventListener('click', ()=>toast('File uploaded (simulated)','success'));
  } else if (clientDrawerTab==='notes'){
    body.innerHTML = `
      <div class="field"><textarea id="noteInput" rows="3" placeholder="Add an internal note about this client\u2026" style="width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:8px;resize:vertical;"></textarea></div>
      <button class="btn btn-secondary btn-sm" id="addNoteBtn" style="margin-bottom:16px;">Save note</button>
      <div id="noteList">
        <div class="card card-pad" style="padding:12px;margin-bottom:10px;"><div style="font-size:12.5px;">${esc(client.manager)} flagged this client for a mid-year tax planning check-in.</div><div class="text-slate-300" style="font-size:11px;margin-top:6px;">${timeAgo(pastDate(15))}</div></div>
      </div>`;
    qs('#addNoteBtn').addEventListener('click', ()=>{
      const val = qs('#noteInput').value.trim(); if(!val) return;
      qs('#noteList').insertAdjacentHTML('afterbegin', `<div class="card card-pad" style="padding:12px;margin-bottom:10px;"><div style="font-size:12.5px;">${esc(val)}</div><div class="text-slate-300" style="font-size:11px;margin-top:6px;">Just now</div></div>`);
      qs('#noteInput').value=''; client.notesCount++; toast('Note saved','success');
    });
  }
}

/* ============================ NEW/EDIT CLIENT MODAL ============================ */
function openClientModal(existing){
  const isEdit = !!existing;
  showModal(`
    <div class="modal-head"><h3>${isEdit?'Edit Client':'New Client'}</h3><button class="icon-btn" data-close-modal>${Icon('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Client Name</label><input id="ncName" value="${isEdit?esc(existing.name):''}" placeholder="e.g. Southbank Constructions"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field"><label>Type</label><select id="ncType">${['Individual','Company','Sole Trader','Trust','Partnership','SMSF'].map(t=>`<option ${isEdit&&existing.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label>Status</label><select id="ncStatus">${['Active','Onboarding','At Risk'].map(t=>`<option ${isEdit&&existing.status===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label>Client Manager</label><select id="ncManager">${DB.staff.map(s=>`<option ${isEdit&&existing.manager===s.name?'selected':''}>${s.name}</option>`).join('')}</select></div>
        <div class="field"><label>Location</label><input id="ncLocation" value="${isEdit?esc(existing.location):''}" placeholder="Melbourne VIC"/></div>
        <div class="field"><label>Email</label><input id="ncEmail" value="${isEdit?esc(existing.email):''}" placeholder="accounts@client.com.au"/></div>
        <div class="field"><label>Phone</label><input id="ncPhone" value="${isEdit?esc(existing.phone):''}" placeholder="04xx xxx xxx"/></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="ncSave">${isEdit?'Save Changes':'Create Client'}</button></div>
  `);
  qs('#ncSave').addEventListener('click', ()=>{
    const name = qs('#ncName').value.trim(); if(!name){ toast('Client name is required','warn'); return; }
    if (isEdit){
      Object.assign(existing, { name, type:qs('#ncType').value, status:qs('#ncStatus').value, manager:qs('#ncManager').value, location:qs('#ncLocation').value, email:qs('#ncEmail').value, phone:qs('#ncPhone').value });
      toast('Client updated','success');
    } else {
      const client = { id:uid('cli'), name, type:qs('#ncType').value, abn: qs('#ncType').value!=='Individual' ? randomABN() : null,
        email: qs('#ncEmail').value || `accounts@${name.toLowerCase().replace(/[^a-z0-9]/g,'')}.com.au`, phone: qs('#ncPhone').value || '04xx xxx xxx',
        location: qs('#ncLocation').value || 'Melbourne VIC', manager: qs('#ncManager').value, status: qs('#ncStatus').value,
        tags:['New'], since:new Date(), revenueYTD:0, openJobs:0, notesCount:0, docsCount:0 };
      DB.clients.unshift(client);
      toast('Client created','success');
    }
    closeAllOverlays();
    if (App.route==='clients') renderClientTable();
  });
}
