'use strict';

const TaskState = { query:'', onlyMine:false, hideDone:true };

Modules.tasks = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.tasks.title, ROUTE_META.tasks.sub, `<button class="btn btn-primary" id="taskAddBtn">${Icon('plus')} New Task</button>`)}
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
      <div class="input-wrap" style="min-width:220px;">${Icon('search')}<input id="taskSearch" placeholder="Search tasks or clients\u2026"/></div>
      <span class="chip-filter ${TaskState.hideDone?'active':''}" id="hideDoneChip">Hide completed</span>
      <span class="text-slate-300" style="font-size:12px;margin-left:auto;" id="taskCount"></span>
    </div>
    <div class="card"><div id="taskGroups"></div></div>
  `;
  qs('#taskSearch').addEventListener('input', debounce(e=>{ TaskState.query=e.target.value; renderTaskGroups(); },200));
  qs('#hideDoneChip').addEventListener('click', (e)=>{ TaskState.hideDone=!TaskState.hideDone; e.target.classList.toggle('active'); renderTaskGroups(); });
  qs('#taskAddBtn').addEventListener('click', ()=>{
    const job = DB.jobs[rand(0,DB.jobs.length-1)];
    const title = prompt('Task name'); if(!title) return;
    DB.tasks.unshift({ id:uid('task'), jobId:job.id, title, done:false, assignee:App.currentUser.name, due:futureDate(10), priority:'Medium' });
    renderTaskGroups(); toast('Task created on '+job.clientName,'success');
  });
  renderTaskGroups();
};

function renderTaskGroups(){
  const q = TaskState.query.toLowerCase();
  let tasks = DB.tasks.map(t=>({ ...t, job: DB.jobs.find(j=>j.id===t.jobId) })).filter(t=>t.job);
  if (TaskState.hideDone) tasks = tasks.filter(t=>!t.done);
  if (q) tasks = tasks.filter(t=> t.title.toLowerCase().includes(q) || t.job.clientName.toLowerCase().includes(q));
  tasks.sort((a,b)=> new Date(a.due)-new Date(b.due));
  qs('#taskCount').textContent = `${tasks.length} tasks`;
  const grouped = {};
  tasks.slice(0,120).forEach(t=>{ (grouped[t.job.clientName] ||= []).push(t); });
  const keys = Object.keys(grouped);
  qs('#taskGroups').innerHTML = keys.length ? keys.map(k=>`
    <div style="padding:14px 18px;border-bottom:1px solid var(--line-soft);">
      <div style="font-size:11.5px;font-weight:700;color:var(--slate-300);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">${esc(k)}</div>
      ${grouped[k].map(t=>{ const d = dueLabel(t.due); return `
        <div class="task-global-row" data-task="${t.id}" style="display:flex;align-items:center;gap:12px;padding:8px 0;">
          <input type="checkbox" ${t.done?'checked':''} style="accent-color:var(--signal);width:17px;height:17px;"/>
          <span class="priority-dot priority-${t.priority}"></span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12.8px;font-weight:500;${t.done?'text-decoration:line-through;color:var(--slate-300);':''}">${esc(t.title)}</div>
            <div class="text-slate-300" style="font-size:11px;">${esc(t.job.service)}</div>
          </div>
          ${avatarHTML(t.assignee,22)}
          <span class="badge badge-${d.tone==='coral'?'coral':d.tone==='amber'?'amber':'slate'}" style="width:100px;justify-content:center;">${d.text}</span>
        </div>`; }).join('')}
    </div>`).join('') : emptyState('tasks','No tasks match','Try adjusting your search or filters.');

  qsa('.task-global-row input').forEach(cb=>cb.addEventListener('change', (e)=>{
    const row = e.target.closest('.task-global-row'); const t = DB.tasks.find(x=>x.id===row.dataset.task);
    t.done = e.target.checked; if (TaskState.hideDone && t.done) renderTaskGroups(); else { row.querySelector('div div').style.textDecoration = t.done?'line-through':'none'; }
  }));
  qsa('.task-global-row').forEach(row=>row.addEventListener('click', (e)=>{
    if (e.target.tagName==='INPUT') return;
    const t = DB.tasks.find(x=>x.id===row.dataset.task);
    navigate('work'); setTimeout(()=>openJobDrawer(t.jobId),150);
  }));
}
