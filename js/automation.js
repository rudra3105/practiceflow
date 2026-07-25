'use strict';

Modules.automations = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.automations.title, ROUTE_META.automations.sub, `<button class="btn btn-primary" id="newAutoBtn">${Icon('plus')} New Automation</button>`)}
    <div class="grid grid-4" style="margin-bottom:18px;">
      ${kpi('automation','Active Rules', DB.automations.filter(a=>a.active).length,'Running now','up','signal')}
      ${kpi('zap','Total Runs (30d)', fmtNum(DB.automations.reduce((s,a)=>s+a.runs,0)),'Across all rules','up','violet')}
      ${kpi('time','Hours Saved (est.)', Math.round(DB.automations.reduce((s,a)=>s+a.runs,0)*0.08),'Manual work avoided','up','ledger')}
      ${kpi('sparkle','Automation Library', 12,'Ready-made recipes','up','amber')}
    </div>
    <div id="autoList"></div>
  `;
  qs('#newAutoBtn').addEventListener('click', openAutomationModal);
  renderAutoList();
};

function renderAutoList(){
  qs('#autoList').innerHTML = DB.automations.map(a=>`
    <div class="card card-pad" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <b style="font-size:14px;">${esc(a.name)}</b>
            <span class="badge ${a.active?'badge-green':'badge-slate'}">${a.active?'Active':'Paused'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px;">
            <span class="badge badge-blue">${Icon('zap')} IF ${esc(a.trigger)}</span>
            ${Icon('arrowRight')}
            ${a.actions.map(act=>`<span class="tag">${esc(act)}</span>`).join('')}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="text-align:right;"><div class="mono" style="font-weight:700;">${a.runs}</div><div class="text-slate-300" style="font-size:10.5px;">runs / 30d</div></div>
          <label class="switch" style="position:relative;display:inline-block;width:38px;height:22px;">
            <input type="checkbox" data-auto="${a.id}" ${a.active?'checked':''} style="opacity:0;width:0;height:0;">
            <span class="switch-track" style="position:absolute;inset:0;background:${a.active?'#2953E4':'#D8DEE8'};border-radius:20px;cursor:pointer;transition:.15s;"></span>
          </label>
        </div>
      </div>
    </div>`).join('');
  qsa('[data-auto]').forEach(cb=>cb.addEventListener('change', (e)=>{
    const a = DB.automations.find(x=>x.id===cb.dataset.auto); a.active = e.target.checked;
    renderAutoList(); toast(a.active?`${a.name} activated`:`${a.name} paused`, a.active?'success':'warn');
  }));
}

function openAutomationModal(){
  const triggers = ['Client uploads documents','Job status changes','Due date passes','Client created','Document request unanswered 7 days'];
  const actions = ['Move workflow to Review','Notify assigned accountant','Create internal task','Email client confirmation','Archive documents','Notify partner','Send reminder email'];
  showModal(`
    <div class="modal-head"><h3>New Automation</h3><button class="icon-btn" data-close-modal>${Icon('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Automation name</label><input id="autoName" placeholder="e.g. Notify on document upload"/></div>
      <div class="field"><label>Trigger</label><select id="autoTrigger">${triggers.map(t=>`<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Actions</label>
        <div style="display:flex;flex-direction:column;gap:8px;">${actions.map(a=>`<label class="check-row"><input type="checkbox" class="autoAction" value="${a}"/> ${a}</label>`).join('')}</div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="autoSave">Create Automation</button></div>
  `);
  qs('#autoSave').addEventListener('click', ()=>{
    const name = qs('#autoName').value.trim() || 'Untitled automation';
    const chosen = qsa('.autoAction:checked').map(c=>c.value);
    DB.automations.unshift({ id:uid('auto'), name, trigger: qs('#autoTrigger').value, conditions:[], actions: chosen.length?chosen:['Notify assigned accountant'], active:true, runs:0 });
    closeAllOverlays(); toast('Automation created','success');
    if (App.route==='automations') renderAutoList();
  });
}
