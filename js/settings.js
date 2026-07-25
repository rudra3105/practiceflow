'use strict';

const SettingsState = { tab:'profile' };
const SETTINGS_TABS = [
  { id:'profile', label:'Firm Profile' }, { id:'branding', label:'Branding' }, { id:'staff', label:'Staff & Permissions' },
  { id:'notifications', label:'Notifications' }, { id:'security', label:'Security' }, { id:'appearance', label:'Appearance' },
];

Modules.settings = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.settings.title, ROUTE_META.settings.sub)}
    <div class="grid" style="grid-template-columns:230px 1fr;gap:18px;align-items:start;">
      <div class="card card-pad">
        ${SETTINGS_TABS.map(t=>`<div class="nav-item" data-stab="${t.id}" style="color:${SettingsState.tab===t.id?'var(--signal)':'var(--ink)'};background:${SettingsState.tab===t.id?'var(--signal-50)':'transparent'};margin-bottom:2px;"><span style="font-size:12.8px;font-weight:600;">${t.label}</span></div>`).join('')}
      </div>
      <div class="card card-pad" id="settingsBody"></div>
    </div>`;
  qsa('[data-stab]').forEach(el=>el.addEventListener('click', ()=>{ SettingsState.tab = el.dataset.stab; Modules.settings(container); }));
  renderSettingsBody();
};

function renderSettingsBody(){
  const body = qs('#settingsBody');
  if (SettingsState.tab==='profile'){
    body.innerHTML = `
      <div class="card-head"><h3>Firm Profile</h3></div>
      <div class="field"><label>Firm Name</label><input value="Whitfield & Co Chartered Accountants"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field"><label>ABN</label><input value="${randomABN()}"/></div>
        <div class="field"><label>Primary Contact</label><input value="Sarah Whitfield"/></div>
        <div class="field"><label>Email</label><input value="admin@whitfieldco.com.au"/></div>
        <div class="field"><label>Phone</label><input value="(03) 9555 0182"/></div>
      </div>
      <div class="field"><label>Address</label><input value="Level 12, 100 Collins Street, Melbourne VIC 3000"/></div>
      <button class="btn btn-primary" id="saveProfileBtn">Save Changes</button>`;
    qs('#saveProfileBtn').addEventListener('click', ()=>toast('Firm profile updated','success'));
  } else if (SettingsState.tab==='branding'){
    body.innerHTML = `
      <div class="card-head"><h3>Branding</h3></div>
      <div class="field"><label>Primary Colour</label><div style="display:flex;gap:8px;">${['#2953E4','#0F9D77','#6E56CF','#C9820A','#D6483F'].map(c=>`<span style="width:32px;height:32px;border-radius:8px;background:${c};cursor:pointer;border:2px solid ${c==='#2953E4'?'#10233F':'transparent'};"></span>`).join('')}</div></div>
      <div class="field"><label>Logo</label><div class="upload-zone" style="padding:20px;">${Icon('upload')}<div style="font-size:12px;margin-top:6px;">Upload firm logo (PNG or SVG)</div></div></div>
      <div class="field"><label>Client Portal Subdomain</label><input value="whitfieldco.practiceflow.au"/></div>
      <button class="btn btn-primary" id="saveBrandBtn">Save Branding</button>`;
    qs('#saveBrandBtn').addEventListener('click', ()=>toast('Branding updated','success'));
  } else if (SettingsState.tab==='staff'){
    body.innerHTML = `
      <div class="card-head"><h3>Staff &amp; Permissions</h3><button class="btn btn-secondary btn-sm">${Icon('userPlus')} Invite</button></div>
      <table class="data-table"><thead><tr><th>Staff</th><th>Role</th><th>Permission Level</th><th></th></tr></thead>
      <tbody>${DB.staff.slice(0,10).map(s=>`<tr><td><div style="display:flex;align-items:center;gap:8px;">${avatarHTML(s.name,24)}${esc(s.name)}</div></td><td>${esc(s.role)}</td>
        <td><select style="padding:6px 10px;border:1px solid var(--line);border-radius:7px;"><option ${s.role.includes('Partner')?'selected':''}>Admin</option><option ${!s.role.includes('Partner')?'selected':''}>Standard</option><option>Read-only</option></select></td>
        <td><button class="icon-btn">${Icon('dotsH')}</button></td></tr>`).join('')}</tbody></table>`;
  } else if (SettingsState.tab==='notifications'){
    const items = ['New client assigned to me','Job status changes','Mentioned in a comment','Deadline within 3 days','Document uploaded by client','Weekly capacity digest'];
    body.innerHTML = `<div class="card-head"><h3>Notification Preferences</h3></div>` + items.map(i=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line-soft);">
        <span style="font-size:13px;">${i}</span>
        <label class="switch" style="position:relative;display:inline-block;width:38px;height:22px;"><input type="checkbox" checked style="opacity:0;"><span class="switch-track" style="position:absolute;inset:0;background:#2953E4;border-radius:20px;"></span></label>
      </div>`).join('');
    qsa('#settingsBody .switch input').forEach(cb=>cb.addEventListener('change', e=>{ e.target.nextElementSibling.style.background = e.target.checked?'#2953E4':'#D8DEE8'; }));
  } else if (SettingsState.tab==='security'){
    body.innerHTML = `
      <div class="card-head"><h3>Security</h3></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line-soft);">
        <div><div style="font-size:13px;font-weight:600;">Two-factor authentication</div><div class="text-slate" style="font-size:12px;">Require a code at sign-in</div></div>
        <span class="badge badge-green">Enabled</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line-soft);">
        <div><div style="font-size:13px;font-weight:600;">Single sign-on (SSO)</div><div class="text-slate" style="font-size:12px;">Google Workspace / Microsoft 365</div></div>
        <span class="badge badge-slate">Not configured</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;">
        <div><div style="font-size:13px;font-weight:600;">Session timeout</div><div class="text-slate" style="font-size:12px;">Auto sign-out after inactivity</div></div>
        <select style="padding:6px 10px;border:1px solid var(--line);border-radius:7px;"><option>30 minutes</option><option selected>1 hour</option><option>4 hours</option></select>
      </div>`;
  } else if (SettingsState.tab==='appearance'){
    body.innerHTML = `
      <div class="card-head"><h3>Appearance</h3></div>
      <div class="field"><label>Theme</label>
        <div style="display:flex;gap:10px;">
          <div class="card card-pad" style="padding:12px;border-color:var(--signal);text-align:center;width:100px;"><div style="height:36px;background:#fff;border:1px solid var(--line);border-radius:6px;margin-bottom:6px;"></div>Light</div>
          <div class="card card-pad" style="padding:12px;text-align:center;width:100px;opacity:.6;"><div style="height:36px;background:#10233F;border-radius:6px;margin-bottom:6px;"></div>Dark <span class="tag" style="margin-left:4px;">Soon</span></div>
        </div>
      </div>
      <div class="field"><label>Density</label><select><option>Comfortable</option><option selected>Compact</option></select></div>`;
  }
}
