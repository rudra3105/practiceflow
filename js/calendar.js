'use strict';

let firmCalOffset = 0;
Modules.calendar = function(container){
  container.innerHTML = `
    ${pageHeadHTML(ROUTE_META.calendar.title, ROUTE_META.calendar.sub, `<button class="btn btn-primary" id="newMeetingBtn">${Icon('plus')} New Meeting</button>`)}
    <div class="grid" style="grid-template-columns:1fr 340px;gap:18px;align-items:start;">
      <div class="card card-pad" id="calMain"></div>
      <div class="card card-pad">
        <div class="card-head"><h3>Agenda</h3></div>
        <div id="agendaList"></div>
      </div>
    </div>`;
  qs('#newMeetingBtn').addEventListener('click', openMeetingModal);
  renderFirmCalendar();
};

function renderFirmCalendar(){
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth()+firmCalOffset);
  const monthLabel = base.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
  const firstDay = (base.getDay()+6)%7;
  const daysInMonth = new Date(base.getFullYear(), base.getMonth()+1, 0).getDate();
  const cells = []; for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(new Date(base.getFullYear(), base.getMonth(), d));

  qs('#calMain').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h3 style="font-size:15px;">${monthLabel}</h3>
      <div style="display:flex;gap:6px;">
        <button class="btn-icon btn-secondary btn" id="fcPrev">${Icon('chevronLeft')}</button>
        <button class="btn btn-secondary btn-sm" id="fcToday">Today</button>
        <button class="btn-icon btn-secondary btn" id="fcNext">${Icon('chevronRight')}</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:10px;overflow:hidden;">
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div style="background:var(--cloud);padding:7px;text-align:center;font-size:11px;font-weight:700;color:var(--slate);">${d}</div>`).join('')}
      ${cells.map(d=>{
        if(!d) return `<div style="background:var(--surface);min-height:92px;"></div>`;
        const dayMeetings = DB.meetings.filter(m=>new Date(m.start).toDateString()===d.toDateString());
        const dayJobs = DB.jobs.filter(j=>new Date(j.dueDate).toDateString()===d.toDateString() && !['completed','cancelled'].includes(j.status));
        const isToday = d.toDateString()===new Date().toDateString();
        return `<div style="background:var(--surface);min-height:92px;padding:6px;">
          <div style="font-size:11.5px;font-weight:700;color:${isToday?'var(--signal)':'var(--slate-300)'};margin-bottom:4px;">${isToday?`<span style="background:var(--signal);color:#fff;padding:1px 6px;border-radius:20px;">${d.getDate()}</span>`:d.getDate()}</div>
          ${dayMeetings.slice(0,1).map(m=>`<div style="font-size:10.5px;padding:2px 5px;border-radius:5px;background:var(--violet-100);color:var(--violet);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${Icon('calendar')} ${esc(m.title)}</div>`).join('')}
          ${dayJobs.slice(0,2).map(j=>`<div style="font-size:10.5px;padding:2px 5px;border-radius:5px;background:var(--amber-100);color:var(--amber);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${esc(j.clientName)}</div>`).join('')}
        </div>`;
      }).join('')}
    </div>`;
  qs('#fcPrev').addEventListener('click', ()=>{ firmCalOffset--; renderFirmCalendar(); });
  qs('#fcNext').addEventListener('click', ()=>{ firmCalOffset++; renderFirmCalendar(); });
  qs('#fcToday').addEventListener('click', ()=>{ firmCalOffset=0; renderFirmCalendar(); });

  const upcoming = [...DB.meetings].sort((a,b)=>new Date(a.start)-new Date(b.start)).filter(m=>new Date(m.start)>=new Date(Date.now()-86400000)).slice(0,8);
  qs('#agendaList').innerHTML = `<div class="timeline">${upcoming.map(m=>`
    <div class="timeline-item">
      <div style="font-size:12.8px;font-weight:600;">${esc(m.title)}</div>
      <div class="text-slate" style="font-size:11.5px;margin-top:2px;">${esc(m.clientName)}</div>
      <div class="text-slate-300" style="font-size:11px;margin-top:2px;">${fmtDate(m.start,{day:'numeric',month:'short'})} \u00b7 ${new Date(m.start).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})} \u00b7 ${esc(m.location)}</div>
    </div>`).join('') || '<p class="text-slate-300" style="font-size:12.5px;">No upcoming meetings.</p>'}</div>`;
}

function openMeetingModal(){
  showModal(`
    <div class="modal-head"><h3>Schedule Meeting</h3><button class="icon-btn" data-close-modal>${Icon('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Title</label><input id="mtTitle" placeholder="Quarterly Review"/></div>
      <div class="field"><label>Client</label><select id="mtClient">${DB.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field"><label>Date &amp; Time</label><input id="mtDate" type="datetime-local" value="${new Date(Date.now()+86400000).toISOString().slice(0,16)}"/></div>
        <div class="field"><label>Duration</label><select id="mtDuration"><option>30</option><option selected>45</option><option>60</option></select></div>
      </div>
      <div class="field"><label>Location</label><select id="mtLocation">${['Zoom','Firm Office \u2014 Meeting Room 1','Phone Call','Client Site'].map(l=>`<option>${l}</option>`).join('')}</select></div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="mtSave">Schedule</button></div>
  `);
  qs('#mtSave').addEventListener('click', ()=>{
    const client = DB.clients.find(c=>c.id===qs('#mtClient').value);
    DB.meetings.unshift({ id:uid('mtg'), title: qs('#mtTitle').value || 'Meeting', clientName:client.name, with:App.currentUser.name,
      start: new Date(qs('#mtDate').value), durationMins: parseInt(qs('#mtDuration').value), location: qs('#mtLocation').value });
    closeAllOverlays(); toast('Meeting scheduled','success');
    if (App.route==='calendar') renderFirmCalendar();
  });
}
