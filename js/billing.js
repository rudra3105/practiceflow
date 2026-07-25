'use strict';

/* ============================ TIME TRACKING ============================ */
let timerState = { running:false, seconds:0, jobId: DB.jobs[0]?.id, interval:null };

Modules.time = function(container){
  const totalBillable = DB.jobs.reduce((s,j)=>s+j.actualHours,0);
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.time.title, ROUTE_META.time.sub, `<button class="btn btn-secondary" id="manualEntryBtn">${Icon('plus')} Manual Entry</button>`)}
    <div class="grid" style="grid-template-columns:340px 1fr;gap:18px;align-items:start;margin-bottom:18px;">
      <div class="card card-pad" style="text-align:center;">
        <div class="card-head" style="justify-content:center;"><h3>Active Timer</h3></div>
        <select id="timerJob" style="width:100%;padding:9px;border:1.5px solid var(--line);border-radius:8px;margin-bottom:16px;">
          ${DB.jobs.slice(0,40).map(j=>`<option value="${j.id}" ${j.id===timerState.jobId?'selected':''}>${esc(j.clientName)} \u2014 ${esc(j.service)}</option>`).join('')}
        </select>
        <div class="mono" id="timerDisplay" style="font-size:38px;font-weight:600;margin-bottom:16px;">00:00:00</div>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-primary" id="timerToggle">${Icon(timerState.running?'pause':'play')} ${timerState.running?'Pause':'Start'}</button>
          <button class="btn btn-secondary" id="timerStop">${Icon('stop')} Stop &amp; Save</button>
        </div>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>This Week</h3></div>
        <div class="grid grid-3">
          ${kpi('time','Billable Hours', totalBillable.toFixed(0)+'h','+6.2h vs last week','up','signal')}
          ${kpi('trend','Utilisation', '78%','Target 80%','down','amber')}
          ${kpi('billing','Value Logged', fmtMoney(totalBillable*180),'At standard rates','up','ledger')}
        </div>
      </div>
    </div>
    <div class="card"><div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>Client</th><th>Service</th><th>Assignee</th><th>Budget</th><th>Actual</th><th>Variance</th></tr></thead>
      <tbody>${DB.jobs.slice(0,30).map(j=>{
        const variance = j.actualHours - j.budgetHours;
        return `<tr data-job="${j.id}"><td class="cell-primary">${esc(j.clientName)}</td><td>${esc(j.service)}</td><td>${esc(j.assignee)}</td><td class="mono">${j.budgetHours}h</td><td class="mono">${j.actualHours.toFixed(1)}h</td>
        <td class="mono" style="color:${variance>0?'var(--coral)':'var(--ledger)'};">${variance>0?'+':''}${variance.toFixed(1)}h</td></tr>`;
      }).join('')}</tbody>
    </table></div></div>
  `;
  qs('#manualEntryBtn').addEventListener('click', ()=>toast('Manual time entry saved (simulated)','success'));
  qsa('[data-job]').forEach(el=>el.addEventListener('click', ()=>openJobDrawer(el.dataset.job)));
  qs('#timerJob').addEventListener('change', e=> timerState.jobId = e.target.value);
  qs('#timerToggle').addEventListener('click', toggleTimer);
  qs('#timerStop').addEventListener('click', stopTimer);
  updateTimerDisplay();
};

function toggleTimer(){
  timerState.running = !timerState.running;
  if (timerState.running){
    timerState.interval = setInterval(()=>{ timerState.seconds++; updateTimerDisplay(); }, 1000);
    toast('Timer started','success');
  } else { clearInterval(timerState.interval); toast('Timer paused','info'); }
  const btn = qs('#timerToggle'); if(btn) btn.innerHTML = `${Icon(timerState.running?'pause':'play')} ${timerState.running?'Pause':'Start'}`;
}
function stopTimer(){
  clearInterval(timerState.interval);
  if (timerState.seconds>0){
    const job = DB.jobs.find(j=>j.id===timerState.jobId);
    if (job) job.actualHours += timerState.seconds/3600;
    toast(`Logged ${(timerState.seconds/3600).toFixed(2)}h to ${job?job.clientName:'job'}`,'success');
  }
  timerState = { running:false, seconds:0, jobId: timerState.jobId, interval:null };
  if (App.route==='time') Modules.time(qs('#pageContent'));
}
function updateTimerDisplay(){
  const el = qs('#timerDisplay'); if(!el) return;
  const h = String(Math.floor(timerState.seconds/3600)).padStart(2,'0');
  const m = String(Math.floor((timerState.seconds%3600)/60)).padStart(2,'0');
  const s = String(timerState.seconds%60).padStart(2,'0');
  el.textContent = `${h}:${m}:${s}`;
}

/* ============================ BILLING ============================ */
Modules.billing = function(container){
  const outstanding = DB.invoices.filter(i=>i.status==='Outstanding').reduce((s,i)=>s+i.amount,0);
  const overdue = DB.invoices.filter(i=>i.status==='Overdue').reduce((s,i)=>s+i.amount,0);
  const paid = DB.invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+i.amount,0);
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.billing.title, ROUTE_META.billing.sub, `<button class="btn btn-primary" id="newInvoiceBtn">${Icon('plus')} New Invoice</button>`)}
    <div class="grid grid-4" style="margin-bottom:18px;">
      ${kpi('billing','Paid (YTD)', fmtMoney(paid),'Collected revenue','up','ledger')}
      ${kpi('clock','Outstanding', fmtMoney(outstanding),'Awaiting payment','down','amber')}
      ${kpi('flag','Overdue', fmtMoney(overdue),'Needs follow-up','down','coral')}
      ${kpi('trend','Avg. Days to Pay', '18d','Across all clients','up','signal')}
    </div>
    <div class="card"><div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${DB.invoices.map(inv=>`<tr>
        <td class="cell-primary mono">${inv.number}</td><td>${esc(inv.clientName)}</td><td class="cell-sub">${fmtDateShort(inv.issuedAt)}</td><td class="cell-sub">${fmtDateShort(inv.dueAt)}</td>
        <td class="mono">${fmtMoney(inv.amount)}</td><td>${invBadge(inv.status)}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>
  `;
  qs('#newInvoiceBtn').addEventListener('click', ()=>toast('Invoice draft created (simulated)','success'));
};
function invBadge(status){
  const map = { Paid:'badge-green', Outstanding:'badge-amber', Overdue:'badge-coral', Draft:'badge-slate' };
  return `<span class="badge ${map[status]}">${status}</span>`;
}

/* ============================ HELPDESK ============================ */
Modules.helpdesk = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.helpdesk.title, ROUTE_META.helpdesk.sub, `<button class="btn btn-primary" id="newTicketBtn">${Icon('plus')} New Ticket</button>`)}
    <div class="grid grid-4" style="margin-bottom:18px;">
      ${kpi('ticket','Open Tickets', DB.tickets.filter(t=>t.status==='Open').length,'Needs a response','down','coral')}
      ${kpi('clock','In Progress', DB.tickets.filter(t=>t.status==='In Progress').length,'Being worked on','up','amber')}
      ${kpi('check','Resolved (30d)', DB.tickets.filter(t=>t.status==='Resolved').length,'Closed out','up','ledger')}
      ${kpi('time','Avg. Response', '3.2h','Across all tickets','up','signal')}
    </div>
    <div class="card"><div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>Subject</th><th>From</th><th>Type</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>${DB.tickets.map(t=>`<tr data-ticket="${t.id}">
        <td class="cell-primary">${esc(t.subject)}</td><td>${esc(t.from)}</td><td><span class="tag">${t.type}</span></td>
        <td><span class="priority-dot priority-${t.priority}" style="display:inline-block;margin-right:6px;"></span>${t.priority}</td>
        <td>${ticketBadge(t.status)}</td><td class="cell-sub">${timeAgo(t.createdAt)}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>
  `;
  qs('#newTicketBtn').addEventListener('click', ()=>{
    DB.tickets.unshift({ id:uid('tkt'), subject:'New support request', from:App.currentUser.name, type:'Internal', status:'Open', priority:'Medium', createdAt:new Date() });
    Modules.helpdesk(container); toast('Ticket created','success');
  });
  qsa('[data-ticket]').forEach(tr=>tr.addEventListener('click', ()=>openTicketDrawer(tr.dataset.ticket)));
};
function ticketBadge(status){
  const map = { Open:'badge-coral', 'In Progress':'badge-amber', Waiting:'badge-blue', Resolved:'badge-green' };
  return `<span class="badge ${map[status]}">${status}</span>`;
}
function openTicketDrawer(id){
  const t = DB.tickets.find(x=>x.id===id); if(!t) return;
  showDrawer(`
    <div class="drawer-head">
      <div style="display:flex;justify-content:space-between;"><h3 style="font-size:16px;">${esc(t.subject)}</h3><button class="icon-btn" data-close-drawer>${Icon('x')}</button></div>
      <div style="display:flex;gap:8px;margin-top:10px;">${ticketBadge(t.status)}<span class="tag">${t.type}</span><span class="badge badge-slate"><span class="priority-dot priority-${t.priority}"></span>${t.priority}</span></div>
    </div>
    <div class="drawer-body">
      <div class="drawer-section"><h4>From</h4><div style="display:flex;align-items:center;gap:8px;">${avatarHTML(t.from,26)}${esc(t.from)}</div></div>
      <div class="drawer-section"><h4>Status</h4>
        <select id="tkStatus" style="width:100%;padding:9px;border:1.5px solid var(--line);border-radius:8px;">${['Open','In Progress','Waiting','Resolved'].map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="drawer-section"><h4>Conversation</h4>
        <div class="card card-pad" style="padding:12px;margin-bottom:10px;"><div style="font-size:12.5px;">Thanks for reaching out \u2014 we're looking into this now and will follow up shortly.</div><div class="text-slate-300" style="font-size:11px;margin-top:6px;">${timeAgo(pastDate(1))}</div></div>
        <div style="display:flex;gap:8px;"><input id="tkReply" placeholder="Type a reply\u2026" style="flex:1;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;"/><button class="btn btn-secondary btn-sm" id="tkSend">Send</button></div>
      </div>
    </div>`);
  qs('#tkStatus').addEventListener('change', e=>{ t.status = e.target.value; toast('Ticket status updated','success'); });
  qs('#tkSend').addEventListener('click', ()=>{ if(!qs('#tkReply').value.trim()) return; qs('#tkReply').value=''; toast('Reply sent','success'); });
}
