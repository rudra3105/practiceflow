'use strict';

Modules.team = function(container){
  const avgCapacity = Math.round(DB.staff.reduce((s,x)=>s+x.capacity,0)/DB.staff.length);
  const overloaded = DB.staff.filter(s=>s.capacity>95).length;
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.team.title, ROUTE_META.team.sub, `<button class="btn btn-primary" id="inviteStaff">${Icon('userPlus')} Invite Staff</button>`)}
    <div class="grid grid-4 stagger" style="margin-bottom:18px;">
      ${kpi('team','Team Members', DB.staff.length, 'Across 6 departments','up','signal')}
      ${kpi('time','Avg. Utilisation', avgCapacity+'%', avgCapacity>85?'Running hot':'Healthy range', avgCapacity>85?'down':'up','violet')}
      ${kpi('flag','Overloaded', overloaded, overloaded?'Above 95% capacity':'Nobody overloaded', overloaded?'down':'up','coral')}
      ${kpi('star','On Leave Soon', DB.staff.filter(s=>s.leaveUpcoming).length,'Next 40 days','up','amber')}
    </div>
    <div class="card"><div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>Staff</th><th>Role</th><th>Department</th><th>Assigned Clients</th><th>Active Jobs</th><th>Capacity</th><th>Billable Target</th></tr></thead>
      <tbody>
        ${DB.staff.map(s=>`
        <tr data-staff="${s.id}">
          <td><div style="display:flex;align-items:center;gap:10px;">${avatarHTML(s.name,30)}<div><div class="cell-primary">${esc(s.name)}</div><div class="cell-sub">${esc(s.email)}</div></div></div></td>
          <td>${esc(s.role)}</td>
          <td>${esc(s.department)}</td>
          <td class="mono">${s.clientsAssigned}</td>
          <td class="mono">${s.activeJobs}</td>
          <td style="width:150px;"><div style="display:flex;align-items:center;gap:8px;"><div class="progress ${s.capacity>95?'coral':s.capacity>80?'amber':'green'}" style="flex:1;"><div style="width:${Math.min(s.capacity,100)}%"></div></div><span class="mono" style="font-size:11.5px;">${s.capacity}%</span></div></td>
          <td class="mono">${s.billableTarget}%</td>
        </tr>`).join('')}
      </tbody>
    </table></div></div>
  `;
  qs('#inviteStaff').addEventListener('click', ()=>toast('Invitation sent (simulated) \u2014 staff will appear once they accept.','success'));
  qsa('tr[data-staff]').forEach(tr=>tr.addEventListener('click', ()=>openStaffDrawer(tr.dataset.staff)));
};

function openStaffDrawer(staffId){
  const s = DB.staff.find(x=>x.id===staffId); if(!s) return;
  const jobs = DB.jobs.filter(j=>j.assignee===s.name);
  showDrawer(`
    <div class="drawer-head">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="display:flex;gap:12px;align-items:center;">${avatarHTML(s.name,44)}<div><h3 style="font-size:17px;">${esc(s.name)}</h3><div class="text-slate" style="font-size:12.5px;">${esc(s.role)} \u00b7 ${esc(s.department)}</div></div></div>
        <button class="icon-btn" data-close-drawer>${Icon('x')}</button>
      </div>
    </div>
    <div class="drawer-body">
      <div class="drawer-section">
        <h4>Capacity</h4>
        <div class="progress ${s.capacity>95?'coral':s.capacity>80?'amber':'green'}"><div style="width:${Math.min(s.capacity,100)}%"></div></div>
        <div class="text-slate-300" style="font-size:11.5px;margin-top:5px;">${s.capacity}% utilised this week \u00b7 Target ${s.billableTarget}% billable</div>
      </div>
      <div class="drawer-section">
        <h4>Productivity Trend</h4>
        <div style="display:flex;align-items:flex-end;gap:5px;height:60px;">
          ${s.productivityTrend.map(v=>`<div class="tooltip" data-tip="${v}%" style="flex:1;background:var(--signal-100);border-radius:4px 4px 0 0;height:${v}%;position:relative;"><div style="position:absolute;inset:0;background:var(--signal);border-radius:4px 4px 0 0;opacity:.55;"></div></div>`).join('')}
        </div>
      </div>
      <div class="drawer-section">
        <h4>Assigned Jobs (${jobs.length})</h4>
        ${jobs.slice(0,8).map(j=>{ const st=WORK_STATUSES.find(x=>x.id===j.status); return `<div data-job="${j.id}" style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line-soft);cursor:pointer;">
          <div><div style="font-size:12.5px;font-weight:600;">${esc(j.clientName)}</div><div class="text-slate-300" style="font-size:11px;">${esc(j.service)}</div></div>
          <span class="badge" style="background:${st.color}22;color:${st.color};">${st.label}</span>
        </div>`; }).join('') || '<p class="text-slate-300" style="font-size:12.5px;">No jobs assigned.</p>'}
      </div>
      ${s.leaveUpcoming?`<div class="drawer-section"><h4>Leave</h4><div class="badge badge-amber">Upcoming leave: ${fmtDate(s.leaveUpcoming)}</div></div>`:''}
    </div>`);
  qsa('[data-job]').forEach(el=>el.addEventListener('click', ()=>{ closeAllOverlays(); navigate('work'); setTimeout(()=>openJobDrawer(el.dataset.job),150); }));
}
