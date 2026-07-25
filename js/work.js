'use strict';

const WorkState = { view: 'board', scope: 'team', query: '', assigneeFilter: 'all', priorityFilter: 'all' };

Modules.work = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.work.title, ROUTE_META.work.sub, `
      <button class="btn btn-secondary" id="wfTemplateBtn">${Icon('templates')} From Template</button>
      <button class="btn btn-primary" id="wNewJob">${Icon('plus')} New Job</button>
    `)}
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
      <span class="pill-tabs" id="viewTabs">
        ${['board','list','timeline','calendar'].map(v=>`<span class="pill-tab ${WorkState.view===v?'active':''}" data-v="${v}">${v[0].toUpperCase()+v.slice(1)}</span>`).join('')}
      </span>
      <span class="pill-tabs" id="scopeTabs">
        <span class="pill-tab ${WorkState.scope==='mine'?'active':''}" data-s="mine">My Work</span>
        <span class="pill-tab ${WorkState.scope==='team'?'active':''}" data-s="team">Team Work</span>
      </span>
      <div class="input-wrap" style="min-width:220px;">${Icon('search')}<input id="workSearch" placeholder="Search jobs or clients\u2026" value="${esc(WorkState.query)}"/></div>
      <button class="select-btn" id="priorityFilterBtn">${Icon('filter')} Priority: ${WorkState.priorityFilter==='all'?'All':WorkState.priorityFilter}</button>
      <span class="text-slate-300" style="font-size:12px;margin-left:auto;" id="workCount"></span>
    </div>
    <div id="workViewport"></div>
  `;

  qs('#wNewJob').addEventListener('click', () => openJobModal());
  qs('#wfTemplateBtn').addEventListener('click', () => navigate('templates'));
  qsa('#viewTabs .pill-tab').forEach(t=>t.addEventListener('click', ()=>{ WorkState.view=t.dataset.v; Modules.work(container); }));
  qsa('#scopeTabs .pill-tab').forEach(t=>t.addEventListener('click', ()=>{ WorkState.scope=t.dataset.s; Modules.work(container); }));
  qs('#workSearch').addEventListener('input', debounce((e)=>{ WorkState.query = e.target.value; renderWorkViewport(); },200));
  qs('#priorityFilterBtn').addEventListener('click', (e)=>{
    openContextMenu(e.clientX, e.clientY, ['all',...PRIORITIES].map(p=>({ id:p, label:p==='all'?'All priorities':p, icon:'flag', onClick:()=>{ WorkState.priorityFilter=p; Modules.work(container); } })));
  });

  renderWorkViewport();
};

function filteredJobs(){
  const q = WorkState.query.toLowerCase();
  return DB.jobs.filter(j=>{
    if (WorkState.scope==='mine' && j.assignee !== App.currentUser.name && j.reviewer !== App.currentUser.name){
      // no jobs literally assigned to Sarah by name match sometimes; fall back to first partner's jobs for demo richness
    }
    if (WorkState.scope==='mine'){
      const mine = j.assignee===App.currentUser.name || j.reviewer===App.currentUser.name || j.reviewer.includes('Whitfield');
      if(!mine) return false;
    }
    if (WorkState.priorityFilter!=='all' && j.priority!==WorkState.priorityFilter) return false;
    if (q && !(j.title.toLowerCase().includes(q) || j.clientName.toLowerCase().includes(q) || j.assignee.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderWorkViewport(){
  const vp = qs('#workViewport'); if(!vp) return;
  const jobs = filteredJobs();
  qs('#workCount').textContent = `${jobs.length} job${jobs.length!==1?'s':''}`;
  if (WorkState.view==='board') vp.innerHTML = boardViewHTML(jobs);
  else if (WorkState.view==='list') vp.innerHTML = listViewHTML(jobs);
  else if (WorkState.view==='timeline') vp.innerHTML = timelineViewHTML(jobs);
  else vp.innerHTML = calendarViewHTML(jobs);
  bindWorkViewportEvents();
}

/* ============================ BOARD VIEW ============================ */
function boardViewHTML(jobs){
  return `<div class="board-wrap">
    ${WORK_STATUSES.map(st=>{
      const col = jobs.filter(j=>j.status===st.id);
      return `<div class="board-col">
        <div class="board-col-head"><span class="dot" style="background:${st.color}"></span><span class="title">${st.label}</span><span class="count">${col.length}</span></div>
        <div class="board-col-body" data-status="${st.id}">
          ${col.map(j=>jobCardHTML(j)).join('') || ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function jobCardHTML(j){
  const d = dueLabel(j.dueDate);
  return `<div class="job-card" draggable="true" data-job="${j.id}">
    <div class="jc-top"><span class="jc-client">${esc(j.clientName)}</span><span class="priority-dot priority-${j.priority}" data-tip="${j.priority} priority"></span></div>
    <div class="jc-title">${esc(j.service)}</div>
    ${j.tags.length?`<div class="jc-tags">${j.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`:''}
    <div class="jc-meta">
      <span class="meta-item">${Icon('clock')} ${j.actualHours.toFixed(1)}/${j.budgetHours}h</span>
      ${j.comments?`<span class="meta-item">${Icon('comment')} ${j.comments}</span>`:''}
      ${j.attachments?`<span class="meta-item">${Icon('paperclip')} ${j.attachments}</span>`:''}
    </div>
    <div class="jc-foot">
      <span class="badge badge-${d.tone==='coral'?'coral':d.tone==='amber'?'amber':'slate'}">${d.text}</span>
      ${avatarHTML(j.assignee,24)}
    </div>
  </div>`;
}

/* ============================ LIST VIEW ============================ */
let listSort = { key:'dueDate', dir:1 };
function listViewHTML(jobs){
  const sorted = [...jobs].sort((a,b)=>{
    let av=a[listSort.key], bv=b[listSort.key];
    if (listSort.key==='dueDate') { av=new Date(av); bv=new Date(bv); }
    if (av<bv) return -1*listSort.dir; if(av>bv) return 1*listSort.dir; return 0;
  });
  return `<div class="card"><div style="overflow-x:auto;"><table class="data-table">
    <thead><tr>
      <th class="th-sort" data-k="clientName">Client ${sortArrow('clientName')}</th>
      <th class="th-sort" data-k="service">Service ${sortArrow('service')}</th>
      <th>Status</th>
      <th class="th-sort" data-k="priority">Priority ${sortArrow('priority')}</th>
      <th class="th-sort" data-k="dueDate">Due ${sortArrow('dueDate')}</th>
      <th>Assignee</th>
      <th>Reviewer</th>
      <th>Progress</th>
      <th class="th-sort" data-k="actualHours">Hours ${sortArrow('actualHours')}</th>
    </tr></thead>
    <tbody>
      ${sorted.map(j=>{
        const st = WORK_STATUSES.find(s=>s.id===j.status);
        return `<tr data-job="${j.id}">
          <td class="cell-primary">${esc(j.clientName)}</td>
          <td>${esc(j.service)}</td>
          <td><span class="badge" style="background:${st.color}22;color:${st.color};">${st.label}</span></td>
          <td><span class="priority-dot priority-${j.priority}" style="display:inline-block;margin-right:6px;"></span>${j.priority}</td>
          <td>${dueCell(j.dueDate)}</td>
          <td>${avatarHTML(j.assignee,22)} <span style="margin-left:6px;">${esc(j.assignee.split(' ')[0])}</span></td>
          <td class="cell-sub">${esc(j.reviewer)}</td>
          <td style="width:120px;"><div class="progress"><div style="width:${j.progress}%"></div></div></td>
          <td class="mono">${j.actualHours.toFixed(1)}/${j.budgetHours}</td>
        </tr>`;
      }).join('') || `<tr><td colspan="9"><div class="empty-state"><div class="icon-wrap">${Icon('work')}</div><h4>No jobs match</h4><p>Try adjusting your search or filters.</p></div></td></tr>`}
    </tbody>
  </table></div></div>`;
}
function sortArrow(key){ if(listSort.key!==key) return ''; return listSort.dir===1?'\u2191':'\u2193'; }
function dueCell(date){ const d = dueLabel(date); const cls = d.tone==='coral'?'style="color:var(--coral);font-weight:600;"':''; return `<span ${cls}>${fmtDateShort(date)}</span>`; }

/* ============================ TIMELINE VIEW ============================ */
function timelineViewHTML(jobs){
  const days = 30;
  const start = new Date(); start.setDate(start.getDate()-3);
  const relevant = jobs.filter(j=>!['completed','cancelled'].includes(j.status)).slice(0,26);
  const dayWidth = 34;
  const header = Array.from({length:days}).map((_,i)=>{
    const d = new Date(start); d.setDate(d.getDate()+i);
    const isToday = d.toDateString()===new Date().toDateString();
    return `<div style="width:${dayWidth}px;flex:none;text-align:center;font-size:10.5px;color:${isToday?'var(--signal)':'var(--slate-300)'};font-weight:${isToday?'700':'500'};">${d.getDate()}<div style="font-size:9px;">${d.toLocaleDateString('en-AU',{month:'short'})}</div></div>`;
  }).join('');
  const rows = relevant.map(j=>{
    const created = new Date(Math.max(new Date(j.createdDate), start));
    const due = new Date(j.dueDate);
    const offset = clamp(Math.round((created-start)/86400000), 0, days-1);
    let span = Math.max(1, Math.round((due-created)/86400000));
    span = clamp(span,1,days-offset);
    const st = WORK_STATUSES.find(s=>s.id===j.status);
    return `<div style="display:flex;min-width:${days*dayWidth+220}px;border-top:1px solid var(--line-soft);">
      <div style="width:220px;flex:none;padding:8px 10px 8px 0;display:flex;align-items:center;gap:8px;">
        ${avatarHTML(j.assignee,20)}<span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(j.clientName)}</span>
      </div>
      <div style="position:relative;flex:1;height:38px;">
        <div class="tooltip" data-tip="${esc(j.clientName)} \u2014 ${esc(j.service)}" data-job="${j.id}"
          style="position:absolute;top:7px;left:${offset*dayWidth}px;width:${span*dayWidth-4}px;height:24px;border-radius:7px;background:${st.color}22;border:1.5px solid ${st.color};display:flex;align-items:center;padding:0 8px;font-size:11px;font-weight:600;color:${st.color};overflow:hidden;white-space:nowrap;cursor:pointer;">
          ${esc(j.service)}
        </div>
      </div>
    </div>`;
  }).join('');
  return `<div class="card card-pad" style="overflow-x:auto;">
    <div style="display:flex;min-width:${days*dayWidth+220}px;">
      <div style="width:220px;flex:none;"></div>
      <div style="display:flex;">${header}</div>
    </div>
    ${rows || emptyState('work','No active jobs on the timeline','Everything here is completed or cancelled.')}
  </div>
  <div class="text-slate-300" style="font-size:11.5px;margin-top:10px;">Showing ${relevant.length} active jobs. Bars represent creation to due date.</div>`;
}

/* ============================ CALENDAR VIEW ============================ */
let calMonthOffset = 0;
function calendarViewHTML(jobs){
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth()+calMonthOffset);
  const monthLabel = base.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
  const firstDay = (base.getDay()+6)%7; // Monday=0
  const daysInMonth = new Date(base.getFullYear(), base.getMonth()+1, 0).getDate();
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(new Date(base.getFullYear(), base.getMonth(), d));
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h3 style="font-size:15px;">${monthLabel}</h3>
      <div style="display:flex;gap:6px;">
        <button class="btn-icon btn-secondary btn" id="calPrev">${Icon('chevronLeft')}</button>
        <button class="btn btn-secondary btn-sm" id="calToday">Today</button>
        <button class="btn-icon btn-secondary btn" id="calNext">${Icon('chevronRight')}</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:10px;overflow:hidden;">
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div style="background:var(--cloud);padding:7px;text-align:center;font-size:11px;font-weight:700;color:var(--slate);">${d}</div>`).join('')}
      ${cells.map(d=>{
        if(!d) return `<div style="background:var(--surface);min-height:88px;"></div>`;
        const dayJobs = jobs.filter(j=>new Date(j.dueDate).toDateString()===d.toDateString());
        const isToday = d.toDateString()===new Date().toDateString();
        return `<div style="background:var(--surface);min-height:88px;padding:6px;">
          <div style="font-size:11.5px;font-weight:700;color:${isToday?'var(--signal)':'var(--slate-300)'};margin-bottom:4px;">${isToday?`<span style="background:var(--signal);color:#fff;padding:1px 6px;border-radius:20px;">${d.getDate()}</span>`:d.getDate()}</div>
          ${dayJobs.slice(0,2).map(j=>{
            const st = WORK_STATUSES.find(s=>s.id===j.status);
            return `<div data-job="${j.id}" style="font-size:10.5px;padding:2px 5px;border-radius:5px;background:${st.color}18;color:${st.color};margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;font-weight:600;">${esc(j.clientName)}</div>`;
          }).join('')}
          ${dayJobs.length>2?`<div style="font-size:10px;color:var(--slate-300);">+${dayJobs.length-2} more</div>`:''}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ============================ EVENTS / DRAG&DROP ============================ */
function bindWorkViewportEvents(){
  qsa('[data-job]').forEach(el=>{
    el.addEventListener('click', (e)=>{ if(el.dataset.dragging) return; openJobDrawer(el.dataset.job); });
    el.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      const job = DB.jobs.find(j=>j.id===el.dataset.job);
      openContextMenu(e.clientX,e.clientY,[
        { id:'open', label:'Open job', icon:'work', onClick:()=>openJobDrawer(job.id) },
        { id:'dup', label:'Duplicate', icon:'copy', onClick:()=>duplicateJob(job) },
        { sep:true },
        { id:'del', label:'Cancel job', icon:'trash', danger:true, onClick:()=>{ job.status='cancelled'; renderWorkViewport(); toast('Job cancelled','warn'); } },
      ]);
    });
  });
  qs('#calPrev')?.addEventListener('click', ()=>{ calMonthOffset--; renderWorkViewport(); });
  qs('#calNext')?.addEventListener('click', ()=>{ calMonthOffset++; renderWorkViewport(); });
  qs('#calToday')?.addEventListener('click', ()=>{ calMonthOffset=0; renderWorkViewport(); });

  // drag & drop for board
  qsa('.job-card').forEach(card=>{
    card.addEventListener('dragstart', (e)=>{ card.classList.add('dragging'); card.dataset.dragging='1'; e.dataTransfer.setData('text/plain', card.dataset.job); });
    card.addEventListener('dragend', ()=>{ card.classList.remove('dragging'); setTimeout(()=>delete card.dataset.dragging,50); });
  });
  qsa('.board-col-body').forEach(col=>{
    col.addEventListener('dragover', (e)=>{ e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', ()=> col.classList.remove('drag-over'));
    col.addEventListener('drop', (e)=>{
      e.preventDefault(); col.classList.remove('drag-over');
      const jobId = e.dataTransfer.getData('text/plain');
      const job = DB.jobs.find(j=>j.id===jobId); if(!job) return;
      const newStatus = col.dataset.status;
      if (job.status===newStatus) return;
      job.status = newStatus;
      job.progress = newStatus==='completed'?100:clamp(job.progress+12,5,96);
      job.activity.unshift({ text:`Status moved to ${WORK_STATUSES.find(s=>s.id===newStatus).label}`, at:new Date(), user:App.currentUser.name });
      renderWorkViewport();
      toast(`${job.clientName} moved to ${WORK_STATUSES.find(s=>s.id===newStatus).label}`, 'success');
    });
  });
}

function duplicateJob(job){
  const copy = { ...job, id: uid('job'), title: job.title+' (Copy)', status:'not_started', progress:5, activity:[{text:'Duplicated from existing job', at:new Date(), user:App.currentUser.name}] };
  DB.jobs.unshift(copy);
  renderWorkViewport();
  toast('Job duplicated','success');
}

/* ============================ JOB DRAWER ============================ */
function openJobDrawer(jobId){
  const job = DB.jobs.find(j=>j.id===jobId); if(!job) return;
  const client = DB.clients.find(c=>c.id===job.clientId);
  const tasks = DB.tasks.filter(t=>t.jobId===job.id);
  const template = DB.workflowTemplates.find(t=>t.id===job.templateId);
  const d = dueLabel(job.dueDate);

  showDrawer(`
    <div class="drawer-head">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="text-slate" style="font-size:12px;font-weight:600;margin-bottom:4px;cursor:pointer;color:var(--signal);" id="drawerClientLink">${esc(job.clientName)}</div>
          <h3>${esc(job.service)}</h3>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" id="jobMenuBtn">${Icon('dotsH')}</button>
          <button class="icon-btn" data-close-drawer>${Icon('x')}</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
        <span class="badge badge-${d.tone==='coral'?'coral':d.tone==='amber'?'amber':'slate'}">${d.text}</span>
        <span class="badge badge-slate"><span class="priority-dot priority-${job.priority}"></span>${job.priority}</span>
        ${job.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}
      </div>
    </div>
    <div class="drawer-body">
      <div class="drawer-section">
        <h4>Status</h4>
        <select class="field" id="statusSelect" style="width:100%;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;background:var(--cloud);">
          ${WORK_STATUSES.map(s=>`<option value="${s.id}" ${s.id===job.status?'selected':''}>${s.label}</option>`).join('')}
        </select>
        <div class="progress" style="margin-top:10px;"><div style="width:${job.progress}%"></div></div>
        <div class="text-slate-300" style="font-size:11.5px;margin-top:4px;">${job.progress}% complete \u2014 stage ${job.stageIndex+1} of ${template.stages.length} (${esc(template.name)})</div>
      </div>

      <div class="drawer-section">
        <h4>Details</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12.5px;">
          <div><div class="text-slate-300">Assigned Accountant</div><div style="display:flex;align-items:center;gap:6px;margin-top:4px;">${avatarHTML(job.assignee,20)}${esc(job.assignee)}</div></div>
          <div><div class="text-slate-300">Reviewer</div><div style="display:flex;align-items:center;gap:6px;margin-top:4px;">${avatarHTML(job.reviewer,20)}${esc(job.reviewer)}</div></div>
          <div><div class="text-slate-300">Due Date</div><div style="margin-top:4px;font-weight:600;">${fmtDate(job.dueDate)}</div></div>
          <div><div class="text-slate-300">Created</div><div style="margin-top:4px;">${fmtDate(job.createdDate)}</div></div>
          <div><div class="text-slate-300">Budget Hours</div><div class="mono" style="margin-top:4px;">${job.budgetHours}h</div></div>
          <div><div class="text-slate-300">Actual / Remaining</div><div class="mono" style="margin-top:4px;">${job.actualHours.toFixed(1)}h / ${Math.max(0,job.budgetHours-job.actualHours).toFixed(1)}h</div></div>
        </div>
      </div>

      <div class="drawer-section">
        <div style="display:flex;justify-content:space-between;align-items:center;"><h4 style="margin-bottom:0;">Checklist (${tasks.filter(t=>t.done).length}/${tasks.length})</h4><button class="link-btn" id="addTaskBtn">+ Add task</button></div>
        <div id="taskList" style="margin-top:10px;">${tasks.map(t=>taskRowHTML(t)).join('') || '<p class="text-slate-300" style="font-size:12.5px;">No tasks yet.</p>'}</div>
      </div>

      <div class="drawer-section">
        <h4>Internal Notes &amp; Comments (${job.comments})</h4>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input id="commentInput" placeholder="Leave a comment for the team\u2026" style="flex:1;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;"/>
          <button class="btn btn-secondary btn-sm" id="commentSend">Send</button>
        </div>
        <div id="commentList"></div>
      </div>

      <div class="drawer-section">
        <h4>Attachments (${job.attachments})</h4>
        <div class="upload-zone" id="jobUpload">${Icon('upload')}<div style="margin-top:8px;font-size:12.5px;">Drag files here or click to upload</div></div>
      </div>

      <div class="drawer-section">
        <h4>Activity Timeline</h4>
        <div class="timeline">${job.activity.map(a=>`<div class="timeline-item"><div style="font-size:12.5px;">${esc(a.text)}</div><div class="text-slate-300" style="font-size:11px;margin-top:2px;">${esc(a.user)} \u00b7 ${timeAgo(a.at)}</div></div>`).join('')}</div>
      </div>
    </div>
  `);

  qs('#statusSelect').addEventListener('change', (e)=>{
    job.status = e.target.value;
    job.activity.unshift({ text:`Status changed to ${WORK_STATUSES.find(s=>s.id===job.status).label}`, at:new Date(), user:App.currentUser.name });
    toast('Status updated','success');
    renderWorkViewport();
  });
  qs('#drawerClientLink').addEventListener('click', ()=>{ closeAllOverlays(); navigate('clients'); setTimeout(()=>openClientDrawer(job.clientId),150); });
  qs('#jobMenuBtn').addEventListener('click', (e)=>{
    openContextMenu(e.clientX,e.clientY,[
      { id:'dup', label:'Duplicate job', icon:'copy', onClick:()=>{ duplicateJob(job); closeAllOverlays(); } },
      { id:'cancel', label:'Cancel job', icon:'trash', danger:true, onClick:()=>{ job.status='cancelled'; renderWorkViewport(); closeAllOverlays(); toast('Job cancelled','warn'); } },
    ]);
  });
  qs('#addTaskBtn').addEventListener('click', ()=>{
    const title = prompt('New task name');
    if(!title) return;
    const t = { id:uid('task'), jobId:job.id, title, done:false, assignee:job.assignee, due:futureDate(14), priority:'Medium' };
    DB.tasks.push(t);
    qs('#taskList').insertAdjacentHTML('beforeend', taskRowHTML(t));
    bindTaskRow(qs(`[data-task="${t.id}"]`), job);
    toast('Task added','success');
  });
  qsa('.task-row').forEach(row=>bindTaskRow(row, job));

  const commentsBox = qs('#commentList');
  const seedComments = [
    { user: job.reviewer, text:'Looks good \u2014 just confirm the depreciation schedule before we send it out.', at: pastDate(3) },
    { user: job.assignee, text:'Documents received from client, starting preparation now.', at: pastDate(6) },
  ];
  commentsBox.innerHTML = seedComments.map(c=>commentHTML(c)).join('');
  qs('#commentSend').addEventListener('click', ()=>{
    const input = qs('#commentInput'); if(!input.value.trim()) return;
    commentsBox.insertAdjacentHTML('afterbegin', commentHTML({ user:App.currentUser.name, text:input.value.trim(), at:new Date() }));
    job.comments++;
    input.value='';
    toast('Comment posted','success');
  });
  qs('#jobUpload').addEventListener('click', ()=>{ job.attachments++; toast('File uploaded (simulated)','success'); openJobDrawer(job.id); });
}

function taskRowHTML(t){
  return `<div class="task-row" data-task="${t.id}" style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line-soft);">
    <input type="checkbox" ${t.done?'checked':''} style="accent-color:var(--signal);width:16px;height:16px;"/>
    <span style="flex:1;font-size:12.8px;${t.done?'text-decoration:line-through;color:var(--slate-300);':''}">${esc(t.title)}</span>
    <span class="text-slate-300" style="font-size:11px;">${fmtDateShort(t.due)}</span>
  </div>`;
}
function bindTaskRow(row, job){
  if(!row) return;
  row.querySelector('input').addEventListener('change', (e)=>{
    const t = DB.tasks.find(x=>x.id===row.dataset.task); t.done = e.target.checked;
    row.querySelector('span').style.textDecoration = t.done?'line-through':'none';
    row.querySelector('span').style.color = t.done?'var(--slate-300)':'';
  });
}
function commentHTML(c){
  return `<div style="display:flex;gap:10px;margin-bottom:14px;">
    ${avatarHTML(c.user,28)}
    <div style="flex:1;">
      <div style="font-size:12.5px;"><b>${esc(c.user)}</b> <span class="text-slate-300" style="font-size:11px;">${timeAgo(c.at)}</span></div>
      <div style="font-size:12.8px;margin-top:2px;">${esc(c.text)}</div>
    </div>
  </div>`;
}

/* ============================ NEW JOB MODAL ============================ */
function openJobModal(prefillClientId){
  const clientOptions = DB.clients.map(c=>`<option value="${c.id}" ${c.id===prefillClientId?'selected':''}>${esc(c.name)}</option>`).join('');
  showModal(`
    <div class="modal-head"><h3>Create New Job</h3><button class="icon-btn" data-close-modal>${Icon('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Client</label><select id="njClient">${clientOptions}</select></div>
      <div class="field"><label>Service / Template</label><select id="njService">${SERVICES.map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field"><label>Assigned Accountant</label><select id="njAssignee">${DB.staff.map(s=>`<option>${s.name}</option>`).join('')}</select></div>
        <div class="field"><label>Reviewer</label><select id="njReviewer">${DB.staff.filter(s=>s.role.includes('Partner')).map(s=>`<option>${s.name}</option>`).join('')}</select></div>
        <div class="field"><label>Priority</label><select id="njPriority">${PRIORITIES.map(p=>`<option ${p==='Medium'?'selected':''}>${p}</option>`).join('')}</select></div>
        <div class="field"><label>Due Date</label><input id="njDue" type="date" value="${new Date(Date.now()+14*86400000).toISOString().slice(0,10)}"/></div>
        <div class="field"><label>Budget Hours</label><input id="njBudget" type="number" value="8" min="1"/></div>
      </div>
      <div class="text-slate-300" style="font-size:12px;">Selecting a service auto-generates the full workflow from that template \u2014 see Workflow Builder for stage details.</div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="njCreate">${Icon('plus')} Create Job</button></div>
  `);
  qs('#njCreate').addEventListener('click', ()=>{
    const clientId = qs('#njClient').value;
    const client = DB.clients.find(c=>c.id===clientId);
    const service = qs('#njService').value;
    const template = DB.workflowTemplates.find(t=>t.category===service) || DB.workflowTemplates[0];
    const job = {
      id: uid('job'), title:`${service} \u2014 FY25`, clientId, clientName: client.name, service,
      status:'not_started', priority: qs('#njPriority').value, assignee: qs('#njAssignee').value, reviewer: qs('#njReviewer').value,
      budgetHours: parseFloat(qs('#njBudget').value)||8, actualHours:0, dueDate: new Date(qs('#njDue').value),
      createdDate: new Date(), tags:['New'], templateId: template.id, stageIndex:0, comments:0, attachments:0, dependencies:0,
      progress:5, activity:[{ text:`Job created from ${template.name} template`, at:new Date(), user:App.currentUser.name }],
    };
    DB.jobs.unshift(job);
    client.openJobs++;
    closeAllOverlays();
    toast(`Job created for ${client.name}`,'success');
    if (App.route==='work') renderWorkViewport();
    if (App.route==='dashboard') navigate('dashboard');
  });
}
