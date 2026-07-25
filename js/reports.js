'use strict';

const ReportState = { tab:'revenue' };
const REPORT_TABS = ['Revenue','Jobs','Clients','Staff Performance','Productivity'];

Modules.reports = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.reports.title, ROUTE_META.reports.sub, `<button class="btn btn-secondary" id="exportReport">${Icon('download')} Export PDF</button>`)}
    <div class="tabs">${REPORT_TABS.map(t=>`<span class="tab ${ReportState.tab===t?'active':''}" data-t="${t}">${t}</span>`).join('')}</div>
    <div id="reportBody"></div>
  `;
  qs('#exportReport').addEventListener('click', ()=>toast('Report exported to PDF (simulated)','success'));
  qsa('.tab').forEach(t=>t.addEventListener('click', ()=>{ ReportState.tab=t.dataset.t; Modules.reports(container); }));
  renderReportBody();
};

function renderReportBody(){
  const body = qs('#reportBody');
  if (ReportState.tab==='Revenue') return renderRevenueReport(body);
  if (ReportState.tab==='Jobs') return renderJobsReport(body);
  if (ReportState.tab==='Clients') return renderClientsReport(body);
  if (ReportState.tab==='Staff Performance') return renderStaffReport(body);
  return renderProductivityReport(body);
}

function renderRevenueReport(body){
  const byService = SERVICES.map(svc=>({ svc, total: DB.jobs.filter(j=>j.service===svc).reduce((s,j)=>s + j.actualHours*180,0) })).sort((a,b)=>b.total-a.total);
  const max = Math.max(...byService.map(s=>s.total));
  body.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:18px;">
      ${kpi('billing','Revenue YTD', fmtMoney(DB.clients.reduce((s,c)=>s+c.revenueYTD,0)),'+12.4% YoY','up','signal')}
      ${kpi('trend','Avg. Revenue / Client', fmtMoney(Math.round(DB.clients.reduce((s,c)=>s+c.revenueYTD,0)/DB.clients.length)),'Across all clients','up','ledger')}
      ${kpi('clock','WIP Value', fmtMoney(Math.round(DB.jobs.reduce((s,j)=>s+j.actualHours*180,0))),'Unbilled work in progress','up','amber')}
      ${kpi('flag','Outstanding', fmtMoney(DB.invoices.filter(i=>i.status==='Outstanding'||i.status==='Overdue').reduce((s,i)=>s+i.amount,0)),'Awaiting payment','down','coral')}
    </div>
    <div class="card card-pad">
      <div class="card-head"><h3>Revenue by Service Line</h3></div>
      ${byService.map(s=>`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <span style="width:150px;font-size:12.5px;flex:none;">${s.svc}</span>
        <div class="progress" style="flex:1;"><div style="width:${(s.total/max)*100}%"></div></div>
        <span class="mono" style="width:90px;text-align:right;font-size:12px;">${fmtMoney(s.total)}</span>
      </div>`).join('')}
    </div>`;
}
function renderJobsReport(body){
  const byStatus = WORK_STATUSES.map(st=>({ st, count: DB.jobs.filter(j=>j.status===st.id).length }));
  const total = DB.jobs.length;
  body.innerHTML = `
    <div class="grid grid-2">
      <div class="card card-pad">
        <div class="card-head"><h3>Jobs by Status</h3></div>
        ${byStatus.map(s=>`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span class="dot" style="width:9px;height:9px;border-radius:50%;background:${s.st.color};flex:none;"></span>
          <span style="width:150px;font-size:12.5px;flex:none;">${s.st.label}</span>
          <div class="progress" style="flex:1;"><div style="width:${(s.count/total)*100}%;background:${s.st.color};"></div></div>
          <span class="mono" style="width:34px;text-align:right;font-size:12px;">${s.count}</span>
        </div>`).join('')}
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Jobs by Service</h3></div>
        ${SERVICES.map(svc=>{ const c = DB.jobs.filter(j=>j.service===svc).length; return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line-soft);font-size:12.5px;"><span>${svc}</span><b class="mono">${c}</b></div>`; }).join('')}
      </div>
    </div>`;
}
function renderClientsReport(body){
  const top = [...DB.clients].sort((a,b)=>b.revenueYTD-a.revenueYTD).slice(0,10);
  body.innerHTML = `<div class="card"><div style="overflow-x:auto;"><table class="data-table">
    <thead><tr><th>Client</th><th>Manager</th><th>Open Jobs</th><th>Revenue YTD</th></tr></thead>
    <tbody>${top.map(c=>`<tr><td class="cell-primary">${esc(c.name)}</td><td>${esc(c.manager)}</td><td class="mono">${c.openJobs}</td><td class="mono">${fmtMoney(c.revenueYTD)}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}
function renderStaffReport(body){
  body.innerHTML = `<div class="card"><div style="overflow-x:auto;"><table class="data-table">
    <thead><tr><th>Staff</th><th>Active Jobs</th><th>Utilisation</th><th>Billable Target</th></tr></thead>
    <tbody>${[...DB.staff].sort((a,b)=>b.capacity-a.capacity).map(s=>`<tr><td><div style="display:flex;align-items:center;gap:8px;">${avatarHTML(s.name,24)}${esc(s.name)}</div></td><td class="mono">${s.activeJobs}</td><td class="mono">${s.capacity}%</td><td class="mono">${s.billableTarget}%</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}
function renderProductivityReport(body){
  body.innerHTML = `<div class="card card-pad">
    <div class="card-head"><h3>Firm Productivity Trend</h3><span class="muted">Last 8 weeks</span></div>
    <canvas id="prodChart" height="180"></canvas>
  </div>`;
  drawRevenueChart(qs('#prodChart'), 8);
}
