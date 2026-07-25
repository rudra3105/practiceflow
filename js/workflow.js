'use strict';

let activeWorkflowId = DB.workflowTemplates[0].id;

Modules.workflow = function(container){
  const wf = DB.workflowTemplates.find(w=>w.id===activeWorkflowId) || DB.workflowTemplates[0];
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.workflow.title, ROUTE_META.workflow.sub, `
      <button class="btn btn-secondary" id="wfDup">${Icon('copy')} Duplicate</button>
      <button class="btn btn-primary" id="wfAddStage">${Icon('plus')} Add Stage</button>
    `)}
    <div class="grid" style="grid-template-columns:280px 1fr;gap:18px;align-items:start;">
      <div class="card card-pad">
        <div class="card-head"><h3>Templates</h3></div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:560px;overflow-y:auto;">
          ${DB.workflowTemplates.map(w=>`<div class="nav-item" data-wf="${w.id}" style="color:${w.id===activeWorkflowId?'var(--signal)':'var(--ink)'};background:${w.id===activeWorkflowId?'var(--signal-50)':'transparent'};">
            <span style="flex:1;font-size:12.8px;font-weight:600;">${esc(w.name)}</span><span class="text-slate-300" style="font-size:11px;">${w.stages.length}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="card card-pad">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div><h3 style="font-size:16px;">${esc(wf.name)}</h3><div class="text-slate" style="font-size:12px;margin-top:2px;">${esc(wf.description)}</div></div>
          <span class="tag">Used ${wf.usageCount}\u00d7</span>
        </div>
        <div class="workflow-canvas" id="wfCanvas"></div>
      </div>
    </div>
  `;
  qsa('[data-wf]').forEach(el=>el.addEventListener('click', ()=>{ activeWorkflowId = el.dataset.wf; Modules.workflow(container); }));
  qs('#wfAddStage').addEventListener('click', ()=>{
    wf.stages.push({ id:uid('stg'), name:'New Stage', order:wf.stages.length, role:'Accountant', durationDays:2, automation:null });
    Modules.workflow(container);
    toast('Stage added','success');
  });
  qs('#wfDup').addEventListener('click', ()=>{
    const copy = { ...wf, id:uid('wft'), name:wf.name+' (Copy)', usageCount:0, stages: wf.stages.map(s=>({...s,id:uid('stg')})) };
    DB.workflowTemplates.push(copy); activeWorkflowId = copy.id; Modules.workflow(container);
    toast('Workflow duplicated','success');
  });
  renderWfCanvas(wf);
};

function renderWfCanvas(wf){
  const canvas = qs('#wfCanvas');
  canvas.innerHTML = wf.stages.map((s,i)=>`
    ${i>0?`<div class="wf-connector"></div>`:''}
    <div class="wf-stage" draggable="true" data-stage="${s.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:10.5px;color:var(--slate-300);font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Stage ${i+1}</div>
          <div style="font-size:14px;font-weight:700;margin-top:2px;" contenteditable="true" data-edit="name">${esc(s.name)}</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="icon-btn tooltip" data-tip="Duplicate" data-act="dup" style="width:28px;height:28px;">${Icon('copy')}</button>
          <button class="icon-btn tooltip" data-tip="Delete" data-act="del" style="width:28px;height:28px;">${Icon('trash')}</button>
        </div>
      </div>
      <div style="display:flex;gap:14px;margin-top:10px;font-size:11.5px;color:var(--slate);flex-wrap:wrap;">
        <span class="badge badge-slate">${Icon('team')} ${esc(s.role)}</span>
        <span class="badge badge-slate">${Icon('clock')} ${s.durationDays}d</span>
        ${s.automation?`<span class="badge badge-blue">${Icon('automation')} ${esc(s.automation)}</span>`:''}
      </div>
    </div>
  `).join('') + `<div class="wf-connector"></div><div class="wf-stage" style="border-style:dashed;text-align:center;color:var(--ledger);cursor:default;">${Icon('check')} Completed</div>`;

  canvas.querySelectorAll('.wf-stage[data-stage]').forEach(node=>{
    const stageId = node.dataset.stage;
    node.addEventListener('dragstart', ()=> node.classList.add('dragging'));
    node.addEventListener('dragend', ()=>{ node.classList.remove('dragging'); reorderStages(wf, canvas); });
    node.addEventListener('dragover', (e)=>{
      e.preventDefault();
      const dragging = canvas.querySelector('.dragging'); if(!dragging || dragging===node) return;
      const rect = node.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      node.parentNode.insertBefore(dragging, before? node : node.nextSibling);
    });
    node.querySelector('[data-edit="name"]').addEventListener('blur', (e)=>{
      const s = wf.stages.find(x=>x.id===stageId); s.name = e.target.textContent.trim() || s.name;
    });
    node.querySelector('[data-act="del"]').addEventListener('click', ()=>{
      wf.stages = wf.stages.filter(x=>x.id!==stageId);
      renderWfCanvas(wf); toast('Stage removed','warn');
    });
    node.querySelector('[data-act="dup"]').addEventListener('click', ()=>{
      const idx = wf.stages.findIndex(x=>x.id===stageId);
      const copy = { ...wf.stages[idx], id:uid('stg'), name: wf.stages[idx].name+' (Copy)' };
      wf.stages.splice(idx+1,0,copy);
      renderWfCanvas(wf); toast('Stage duplicated','success');
    });
  });
}
function reorderStages(wf, canvas){
  const order = [...canvas.querySelectorAll('.wf-stage[data-stage]')].map(n=>n.dataset.stage);
  wf.stages.sort((a,b)=> order.indexOf(a.id)-order.indexOf(b.id));
  wf.stages.forEach((s,i)=>s.order=i);
}

/* ============================ TEMPLATES GALLERY ============================ */
Modules.templates = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.templates.title, ROUTE_META.templates.sub, `<button class="btn btn-primary" id="newTemplateBtn">${Icon('plus')} New Template</button>`)}
    <div class="grid grid-3 stagger" id="templateGrid"></div>
  `;
  qs('#templateGrid').innerHTML = DB.workflowTemplates.slice(0,18).map(w=>`
    <div class="card card-pad card-hover-lift" style="cursor:pointer;transition:transform .15s;" data-tpl="${w.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <span class="kpi-icon" style="background:var(--signal-100);color:var(--signal);">${Icon('templates')}</span>
        <span class="tag">${w.stages.length} stages</span>
      </div>
      <h3 style="font-size:14.5px;margin-bottom:4px;">${esc(w.name)}</h3>
      <p class="text-slate" style="font-size:12px;margin-bottom:14px;line-height:1.5;">${esc(w.description)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="text-slate-300" style="font-size:11.5px;">Used ${w.usageCount}\u00d7 this year</span>
        <button class="btn btn-secondary btn-sm" data-use="${w.id}">Use Template</button>
      </div>
    </div>`).join('');
  qsa('[data-tpl]').forEach(card=>card.addEventListener('click',(e)=>{ if(e.target.closest('[data-use]')) return; activeWorkflowId=card.dataset.tpl; navigate('workflow'); }));
  qsa('[data-use]').forEach(btn=>btn.addEventListener('click',(e)=>{ e.stopPropagation(); openJobModal(); toast('Template loaded into New Job form','info'); }));
  qs('#newTemplateBtn').addEventListener('click', ()=>{
    const name = prompt('Template name'); if(!name) return;
    const w = { id:uid('wft'), name, description:'Custom firm template.', category:name, usageCount:0,
      stages:['Intake','Preparation','Review','Delivery'].map((s,i)=>({id:uid('stg'),name:s,order:i,role:'Accountant',durationDays:2,automation:null})) };
    DB.workflowTemplates.unshift(w); Modules.templates(container); toast('Template created','success');
  });
};
