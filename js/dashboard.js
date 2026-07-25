'use strict';

Modules.dashboard = function(container){
  const jobs = DB.jobs;
  const activeJobs = jobs.filter(j=>!['completed','cancelled'].includes(j.status));
  const waiting = jobs.filter(j=>j.status==='waiting_client'||j.status==='docs_requested');
  const readyReview = jobs.filter(j=>j.status==='ready_review'||j.status==='partner_review');
  const overdue = jobs.filter(j=> !['completed','cancelled','lodged'].includes(j.status) && daysUntil(j.dueDate) < 0);
  const upcoming = jobs.filter(j=> !['completed','cancelled'].includes(j.status) && daysUntil(j.dueDate)>=0 && daysUntil(j.dueDate)<=7)
    .sort((a,b)=> new Date(a.dueDate)-new Date(b.dueDate));
  const revenueYTD = DB.clients.reduce((s,c)=>s+c.revenueYTD,0);

  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.dashboard.title, ROUTE_META.dashboard.sub, `
      <button class="btn btn-secondary" id="qaSchedule">${Icon('calendar')} Schedule Meeting</button>
      <button class="btn btn-primary" id="qaNewJob">${Icon('plus')} New Job</button>
    `)}

    <div class="grid grid-4 stagger" style="margin-bottom:18px;">
      ${kpi('clients','Total Clients', DB.clients.length, '+4 this month', 'up','signal')}
      ${kpi('work','Active Jobs', activeJobs.length, `${waiting.length} waiting on client`, 'up','violet')}
      ${kpi('tasks','Ready for Review', readyReview.length, 'Needs partner sign-off', 'up','amber')}
      ${kpi('flag','Overdue Work', overdue.length, overdue.length ? 'Needs attention' : 'All on track', overdue.length?'down':'up','coral')}
    </div>

    <div class="grid grid-2" style="margin-bottom:18px;align-items:stretch;">
      <div class="card card-pad">
        <div class="card-head"><h3>Revenue Overview</h3><span class="pill-tabs" id="revRange">
          <span class="pill-tab active" data-r="12">12mo</span><span class="pill-tab" data-r="6">6mo</span><span class="pill-tab" data-r="3">3mo</span></span></div>
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px;">
          <div class="mono" style="font-size:26px;font-weight:700;font-family:var(--font-display);" id="revBig">${fmtMoney(revenueYTD)}</div>
          <span class="kpi-delta up">${Icon('trend')} 12.4%</span>
        </div>
        <div class="text-slate" style="font-size:12.5px;margin-bottom:14px;">Fee revenue, financial year to date</div>
        <canvas id="revChart" height="150"></canvas>
      </div>
      <div class="card card-pad" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div class="card-head" style="width:100%;"><h3>Firm Health Score</h3></div>
        <div id="healthRing"></div>
        <div style="font-family:var(--font-display);font-size:34px;font-weight:600;margin-top:6px;">86<span style="font-size:16px;color:var(--slate-300);">/100</span></div>
        <div class="badge badge-green" style="margin-top:8px;">${Icon('trend')} Trending up</div>
        <div class="divider" style="width:100%;margin:16px 0;"></div>
        <div style="display:flex;justify-content:space-between;width:100%;font-size:12px;">
          <div><div class="text-slate">On-time delivery</div><b>91%</b></div>
          <div><div class="text-slate">Realisation</div><b>88%</b></div>
          <div><div class="text-slate">Utilisation</div><b>76%</b></div>
        </div>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card card-pad">
        <div class="card-head"><h3>Today\u2019s Schedule</h3><span class="muted">${fmtDate(new Date(),{weekday:'short',day:'numeric',month:'short'})}</span></div>
        <div id="todaySchedule"></div>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Upcoming Deadlines</h3><span class="muted">Next 7 days</span></div>
        <div id="upcomingDeadlines"></div>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Recent Activity</h3></div>
        <div id="recentActivity"></div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card card-pad">
        <div class="card-head"><h3>Staff Capacity</h3><span class="muted">Utilisation this week</span></div>
        <div id="staffCapacity"></div>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Workload Heatmap</h3><span class="muted">Jobs due per day, next 4 weeks</span></div>
        <div id="heatmap"></div>
      </div>
    </div>
  `;

  drawRevenueChart(qs('#revChart'), 12);
  qsa('#revRange .pill-tab').forEach(t=>t.addEventListener('click', ()=>{
    qsa('#revRange .pill-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
    drawRevenueChart(qs('#revChart'), parseInt(t.dataset.r));
  }));

  qs('#healthRing').innerHTML = healthRingSVG(86);

  qs('#todaySchedule').innerHTML = renderTodaySchedule();
  qs('#upcomingDeadlines').innerHTML = renderUpcomingDeadlines(upcoming);
  qs('#recentActivity').innerHTML = renderRecentActivity();
  qs('#staffCapacity').innerHTML = renderStaffCapacity();
  qs('#heatmap').innerHTML = renderHeatmap();

  qs('#qaNewJob').addEventListener('click', openJobModal);
  qs('#qaSchedule').addEventListener('click', () => toast('Meeting scheduler opened \u2014 see Calendar to confirm details.', 'info'));
  qsa('.deadline-row, .activity-row').forEach(()=>{});
  container.querySelectorAll('[data-job]').forEach(el=>el.addEventListener('click', ()=>{ navigate('work'); setTimeout(()=>openJobDrawer(el.dataset.job),150); }));
};

function kpi(icon,label,value,delta,dir,color){
  return `<div class="card kpi-card">
    <div class="kpi-top"><span class="kpi-icon" style="background:var(--${color}-100);color:var(--${color});">${Icon(icon)}</span></div>
    <div class="kpi-label">${label}</div>
    <div class="kpi-value">${value}</div>
    <div class="kpi-delta ${dir}">${Icon(dir==='up'?'trend':'trendDown')} ${delta}</div>
  </div>`;
}

function healthRingSVG(pct){
  const size=140, r=58, c=2*Math.PI*r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" style="stroke:var(--line-soft);fill:none;stroke-width:10;"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" style="stroke:var(--ledger);fill:none;stroke-width:10;stroke-linecap:round;stroke-dasharray:${c};stroke-dashoffset:${c*(1-pct/100)};transition:stroke-dashoffset 1s var(--ease);"/>
  </svg>`;
}

function renderTodaySchedule(){
  const today = DB.meetings.filter(m=> new Date(m.start).toDateString() === new Date().toDateString()
    || Math.random()>0.85).slice(0,4);
  const items = today.length ? today : pickN(DB.meetings,3);
  return `<div class="timeline">${items.map(m=>`
    <div class="timeline-item">
      <div style="display:flex;justify-content:space-between;">
        <b style="font-size:13px;">${esc(m.title)}</b>
        <span class="mono text-slate-300" style="font-size:11.5px;">${new Date(m.start).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <div class="text-slate" style="font-size:12px;margin-top:2px;">${esc(m.clientName)} \u00b7 ${esc(m.location)}</div>
    </div>`).join('')}</div>`;
}

function renderUpcomingDeadlines(upcoming){
  if(!upcoming.length) return emptyStateInline('flag','Nothing due this week','Enjoy the breathing room.');
  return upcoming.slice(0,5).map(j=>{
    const d = dueLabel(j.dueDate);
    return `<div data-job="${j.id}" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-soft);cursor:pointer;">
      <span class="priority-dot priority-${j.priority}"></span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12.8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(j.clientName)}</div>
        <div class="text-slate-300" style="font-size:11.5px;">${esc(j.service)}</div>
      </div>
      <span class="badge badge-${d.tone==='coral'?'coral':d.tone==='amber'?'amber':'slate'}">${d.text}</span>
    </div>`;
  }).join('');
}

function renderRecentActivity(){
  const acts = DB.jobs.flatMap(j=>j.activity.map(a=>({...a, job:j}))).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6);
  return `<div class="timeline">${acts.map(a=>`
    <div class="timeline-item">
      <div style="font-size:12.8px;">${avatarHTML(a.user,18)} <span style="margin-left:4px;">${esc(a.text)}</span></div>
      <div class="text-slate-300" style="font-size:11px;margin-top:3px;">${timeAgo(a.at)}</div>
    </div>`).join('')}</div>`;
}

function renderStaffCapacity(){
  const staff = [...DB.staff].sort((a,b)=>b.capacity-a.capacity).slice(0,7);
  return staff.map(s=>{
    const over = s.capacity>95;
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      ${avatarHTML(s.name,28)}
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;">
          <b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.name)}</b>
          <span class="mono ${over?'':'text-slate'}" style="color:${over?'var(--coral)':''}">${s.capacity}%</span>
        </div>
        <div class="progress ${over?'coral':s.capacity>80?'amber':'green'}"><div style="width:${Math.min(s.capacity,100)}%"></div></div>
      </div>
    </div>`;
  }).join('');
}

function renderHeatmap(){
  const days = Array.from({length:28}).map((_,i)=>{
    const date = new Date(); date.setDate(date.getDate()+i);
    const count = DB.jobs.filter(j=> new Date(j.dueDate).toDateString()===date.toDateString()).length;
    return { date, count };
  });
  const max = Math.max(...days.map(d=>d.count),1);
  return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">
    ${['M','T','W','T','F','S','S'].map(d=>`<div class="text-slate-300" style="font-size:10.5px;text-align:center;">${d}</div>`).join('')}
    ${days.map(d=>{
      const intensity = d.count/max;
      const bg = intensity===0 ? 'var(--line-soft)' : `rgba(41,83,228,${0.15+intensity*0.75})`;
      return `<div class="heatcell tooltip" data-tip="${fmtDateShort(d.date)}: ${d.count} due" style="background:${bg};"></div>`;
    }).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:11px;color:var(--slate-300);">
    <span>Less</span>
    <div style="display:flex;gap:3px;">${[0.15,0.4,0.65,0.9].map(o=>`<span style="width:12px;height:12px;border-radius:3px;background:rgba(41,83,228,${o});display:inline-block;"></span>`).join('')}</div>
    <span>More</span>
  </div>`;
}

function emptyStateInline(icon,title,body){
  return `<div style="text-align:center;padding:20px 10px;color:var(--slate);">
    <div class="icon-wrap" style="width:40px;height:40px;margin-bottom:10px;">${Icon(icon)}</div>
    <div style="font-size:13px;font-weight:600;color:var(--ink);">${esc(title)}</div>
    <div style="font-size:12px;margin-top:2px;">${esc(body)}</div>
  </div>`;
}

/* ---- Canvas revenue chart (no external libs) ---- */
function drawRevenueChart(canvas, months){
  if(!canvas) return;
  const dpr = window.devicePixelRatio||1;
  const w = canvas.clientWidth || canvas.parentElement.clientWidth; const h = 150;
  canvas.width = w*dpr; canvas.height = h*dpr; canvas.style.width=w+'px'; canvas.style.height=h+'px';
  const ctx = canvas.getContext('2d'); if(!ctx) return; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,h);
  const data = Array.from({length:months}).map(()=>rand(40,100));
  const max = Math.max(...data), min = Math.min(...data)*0.7;
  const pad = 8, gw = w-pad*2, gh = h-pad*2;
  const pts = data.map((v,i)=>[pad + i*(gw/(data.length-1)), pad + gh - ((v-min)/(max-min))*gh]);

  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'rgba(41,83,228,.22)'); grad.addColorStop(1,'rgba(41,83,228,0)');
  ctx.beginPath(); ctx.moveTo(pts[0][0], h-pad);
  pts.forEach(p=>ctx.lineTo(p[0],p[1])); ctx.lineTo(pts[pts.length-1][0], h-pad); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){
    const [x0,y0]=pts[i-1], [x1,y1]=pts[i]; const midx=(x0+x1)/2;
    ctx.bezierCurveTo(midx,y0,midx,y1,x1,y1);
  }
  ctx.strokeStyle = '#2953E4'; ctx.lineWidth = 2.4; ctx.lineJoin='round'; ctx.stroke();

  const last = pts[pts.length-1];
  ctx.beginPath(); ctx.arc(last[0],last[1],4,0,Math.PI*2); ctx.fillStyle='#2953E4'; ctx.fill();
  ctx.beginPath(); ctx.arc(last[0],last[1],7,0,Math.PI*2); ctx.strokeStyle='rgba(41,83,228,.3)'; ctx.lineWidth=2; ctx.stroke();
}
