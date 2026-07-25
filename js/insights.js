'use strict';

Modules.insights = function(container){
  const atRisk = DB.jobs.filter(j=> !['completed','cancelled'].includes(j.status) && daysUntil(j.dueDate) < 3);
  const lateClients = DB.clients.filter(c=> DB.jobs.some(j=>j.clientId===c.id && daysUntil(j.dueDate)<0 && !['completed','cancelled'].includes(j.status)));
  const overloadedStaff = DB.staff.filter(s=>s.capacity>95).sort((a,b)=>b.capacity-a.capacity);
  const avgTurnaround = (DB.jobs.filter(j=>j.status==='completed').length ? 6.4 : 0) || 6.4;

  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.insights.title, ROUTE_META.insights.sub)}
    <div class="grid grid-4 stagger" style="margin-bottom:18px;">
      ${kpi('flag','Jobs At Risk', atRisk.length,'Due within 3 days','down','coral')}
      ${kpi('clients','Late Clients', lateClients.length,'Have overdue work','down','amber')}
      ${kpi('team','Overloaded Staff', overloadedStaff.length,'Above 95% capacity','down','violet')}
      ${kpi('clock','Avg. Turnaround', avgTurnaround.toFixed(1)+'d','Job creation to completion','up','signal')}
    </div>
    <div class="grid grid-2" style="margin-bottom:18px;">
      <div class="card card-pad">
        <div class="card-head"><h3>Jobs At Risk</h3></div>
        ${atRisk.slice(0,6).map(j=>{ const d=dueLabel(j.dueDate); return `<div data-job="${j.id}" style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line-soft);cursor:pointer;">
          <div><div style="font-size:12.8px;font-weight:600;">${esc(j.clientName)}</div><div class="text-slate-300" style="font-size:11px;">${esc(j.service)} \u00b7 ${esc(j.assignee)}</div></div>
          <span class="badge badge-${d.tone==='coral'?'coral':'amber'}">${d.text}</span>
        </div>`; }).join('') || emptyStateInline('flag','Nothing at risk','All jobs are tracking on schedule.')}
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Overloaded Staff</h3></div>
        ${overloadedStaff.map(s=>`<div data-staff="${s.id}" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-soft);cursor:pointer;">
          ${avatarHTML(s.name,28)}
          <div style="flex:1;"><div style="font-size:12.8px;font-weight:600;">${esc(s.name)}</div><div class="text-slate-300" style="font-size:11px;">${esc(s.role)}</div></div>
          <span class="badge badge-coral">${s.capacity}%</span>
        </div>`).join('') || emptyStateInline('team','Everyone\u2019s balanced','No one is over capacity this week.')}
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card card-pad">
        <div class="card-head"><h3>Capacity Forecast</h3><span class="muted">Next 4 weeks</span></div>
        <canvas id="capForecast" height="160"></canvas>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Practice Health</h3></div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          ${healthBar('On-time delivery',91,'ledger')}
          ${healthBar('Fee realisation',88,'signal')}
          ${healthBar('Staff utilisation',76,'amber')}
          ${healthBar('Client satisfaction',94,'ledger')}
          ${healthBar('WIP under control',82,'signal')}
        </div>
      </div>
    </div>
  `;
  qsa('[data-job]').forEach(el=>el.addEventListener('click', ()=>{ navigate('work'); setTimeout(()=>openJobDrawer(el.dataset.job),150); }));
  qsa('[data-staff]').forEach(el=>el.addEventListener('click', ()=>{ navigate('team'); setTimeout(()=>openStaffDrawer(el.dataset.staff),150); }));
  drawCapacityForecast(qs('#capForecast'));
};

function healthBar(label, pct, color){
  return `<div><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px;"><span>${label}</span><b>${pct}%</b></div><div class="progress ${color==='ledger'?'green':color==='amber'?'amber':''}"><div style="width:${pct}%"></div></div></div>`;
}

function drawCapacityForecast(canvas){
  if(!canvas) return;
  const dpr = window.devicePixelRatio||1; const w = canvas.clientWidth||canvas.parentElement.clientWidth; const h=160;
  canvas.width=w*dpr; canvas.height=h*dpr; canvas.style.width=w+'px'; canvas.style.height=h+'px';
  const ctx = canvas.getContext('2d'); if(!ctx) return; ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
  const weeks = ['W1','W2','W3','W4'];
  const demand = weeks.map(()=>rand(60,105));
  const barW = (w/weeks.length)*0.4; const gap = (w/weeks.length);
  demand.forEach((v,i)=>{
    const x = gap*i + gap*0.3; const barH = (v/110)*(h-24);
    ctx.fillStyle = v>95 ? '#D6483F' : v>80 ? '#C9820A' : '#0F9D77';
    const y = h-24-barH;
    roundRect(ctx,x,y,barW,barH,5); ctx.fill();
    ctx.fillStyle = '#5B6B82'; ctx.font='11px Inter, sans-serif'; ctx.textAlign='center';
    ctx.fillText(weeks[i], x+barW/2, h-8);
    ctx.fillStyle = '#10233F'; ctx.font='600 11px Inter, sans-serif';
    ctx.fillText(v+'%', x+barW/2, y-6);
  });
}
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
