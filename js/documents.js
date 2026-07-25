'use strict';

const DocState = { tab:'library', query:'' };

Modules.documents = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.documents.title, ROUTE_META.documents.sub, `
      <button class="btn btn-secondary" id="newRequestBtn">${Icon('paperclip')} Request Documents</button>
      <button class="btn btn-primary" id="uploadDocBtn">${Icon('upload')} Upload</button>
    `)}
    <span class="pill-tabs" style="margin-bottom:18px;display:inline-flex;">
      <span class="pill-tab ${DocState.tab==='library'?'active':''}" data-t="library">Document Library</span>
      <span class="pill-tab ${DocState.tab==='requests'?'active':''}" data-t="requests">Client Requests</span>
    </span>
    <div id="docBody"></div>
  `;
  qsa('.pill-tab').forEach(t=>t.addEventListener('click', ()=>{ DocState.tab=t.dataset.t; Modules.documents(container); }));
  qs('#uploadDocBtn').addEventListener('click', ()=>toast('Document uploaded (simulated)','success'));
  qs('#newRequestBtn').addEventListener('click', openNewRequestModal);
  DocState.tab==='library' ? renderDocLibrary() : renderDocRequests();
};

function renderDocLibrary(){
  const body = qs('#docBody');
  body.innerHTML = `
    <div class="input-wrap" style="max-width:320px;margin-bottom:16px;">${Icon('search')}<input id="docSearch" placeholder="Search documents\u2026"/></div>
    <div class="upload-zone" id="docUploadZone" style="margin-bottom:18px;">${Icon('upload')}<div style="margin-top:8px;font-size:12.5px;">Drag and drop files, or click to browse</div></div>
    <div class="card"><div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>Document</th><th>Client</th><th>Category</th><th>Uploaded By</th><th>Date</th><th>Size</th><th>Status</th></tr></thead>
      <tbody id="docTbody"></tbody>
    </table></div></div>`;
  const renderRows = () => {
    const q = (qs('#docSearch').value||'').toLowerCase();
    const rows = DB.documents.filter(d=> !q || d.name.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q)).slice(0,80);
    qs('#docTbody').innerHTML = rows.map(d=>`
      <tr>
        <td><div style="display:flex;align-items:center;gap:9px;"><span class="notif-dot-icon" style="width:28px;height:28px;background:var(--signal-100);color:var(--signal);">${Icon('docs')}</span><span class="cell-primary">${esc(d.name)}</span></div></td>
        <td>${esc(d.clientName)}</td>
        <td><span class="tag">${esc(d.category)}</span></td>
        <td>${esc(d.uploadedBy)}</td>
        <td class="cell-sub">${timeAgo(d.uploadedAt)}</td>
        <td class="mono">${d.size}</td>
        <td><span class="badge ${d.status==='Approved'?'badge-green':'badge-amber'}">${d.status}</span></td>
      </tr>`).join('') || `<tr><td colspan="7">${emptyState('docs','No documents found','Try a different search term.')}</td></tr>`;
  };
  qs('#docSearch').addEventListener('input', debounce(renderRows,200));
  qs('#docUploadZone').addEventListener('click', ()=>toast('Document uploaded (simulated)','success'));
  renderRows();
}

function renderDocRequests(){
  const body = qs('#docBody');
  body.innerHTML = `<div class="grid grid-2 stagger">` + DB.requests.slice(0,20).map(r=>{
    const total = r.items.length; const done = r.items.filter(i=>i.status==='Approved'||i.status==='Reviewed').length;
    return `<div class="card card-pad">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div><b style="font-size:13.5px;">${esc(r.clientName)}</b><div class="text-slate-300" style="font-size:11.5px;margin-top:2px;">Sent ${fmtDateShort(r.sentAt)} \u00b7 Due ${fmtDateShort(r.dueDate)}</div></div>
        <span class="tag">${done}/${total} complete</span>
      </div>
      <div class="progress" style="margin-bottom:12px;"><div style="width:${(done/total)*100}%"></div></div>
      ${r.items.map(i=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line-soft);">
        <span style="font-size:12.5px;">${esc(i.name)}</span>${reqBadge(i.status)}
      </div>`).join('')}
    </div>`;
  }).join('') + `</div>`;
}
function reqBadge(status){
  const map = { Pending:'badge-slate', Uploaded:'badge-blue', Reviewed:'badge-violet', Approved:'badge-green', Rejected:'badge-coral' };
  return `<span class="badge ${map[status]}">${status}</span>`;
}

function openNewRequestModal(){
  const items = ['Driver Licence','Bank Statements','Payroll Reports','BAS Reports','Financial Statements','Rental Income Summary'];
  showModal(`
    <div class="modal-head"><h3>Request Documents</h3><button class="icon-btn" data-close-modal>${Icon('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Client</label><select id="reqClient">${DB.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Documents needed</label>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
          ${items.map(i=>`<label class="check-row"><input type="checkbox" class="reqItem" value="${i}"/> ${i}</label>`).join('')}
        </div>
      </div>
      <div class="field"><label>Due Date</label><input type="date" id="reqDue" value="${new Date(Date.now()+10*86400000).toISOString().slice(0,10)}"/></div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="reqSend">Send Request</button></div>
  `);
  qs('#reqSend').addEventListener('click', ()=>{
    const client = DB.clients.find(c=>c.id===qs('#reqClient').value);
    const chosen = qsa('.reqItem:checked').map(c=>c.value);
    if (!chosen.length){ toast('Select at least one document','warn'); return; }
    DB.requests.unshift({ id:uid('req'), clientId:client.id, clientName:client.name, items: chosen.map(name=>({name,status:'Pending'})), sentAt:new Date(), dueDate:new Date(qs('#reqDue').value) });
    closeAllOverlays(); toast(`Request sent to ${client.name}`,'success');
    if (App.route==='documents'){ DocState.tab='requests'; Modules.documents(qs('#pageContent')); }
  });
}
