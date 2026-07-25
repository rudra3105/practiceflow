'use strict';

/* =========================================================================
   DUMMY DATA GENERATOR
   Everything lives in memory only (window.DB). A page refresh wipes it,
   by design — this is a frontend prototype with no backend/persistence.
   ========================================================================= */

const WORK_STATUSES = [
  { id: 'not_started', label: 'Not Started', color: '#9AA7BA' },
  { id: 'waiting_client', label: 'Waiting on Client', color: '#C9820A' },
  { id: 'docs_requested', label: 'Documents Requested', color: '#C9820A' },
  { id: 'docs_received', label: 'Documents Received', color: '#0E7C9E' },
  { id: 'in_progress', label: 'In Progress', color: '#2953E4' },
  { id: 'ready_review', label: 'Ready for Review', color: '#6E56CF' },
  { id: 'partner_review', label: 'Partner Review', color: '#6E56CF' },
  { id: 'approved', label: 'Approved', color: '#0F9D77' },
  { id: 'awaiting_signature', label: 'Awaiting Signature', color: '#C9820A' },
  { id: 'lodged', label: 'Lodged', color: '#0F9D77' },
  { id: 'completed', label: 'Completed', color: '#0F9D77' },
  { id: 'cancelled', label: 'Cancelled', color: '#D6483F' },
];

const SERVICES = ['Individual Tax Return','Company Tax Return','BAS Lodgement','GST Return','Payroll',
  'Bookkeeping','Audit','Financial Statements','ASIC Compliance','Virtual CFO','SMSF','Company Registration'];

const PRIORITIES = ['Low','Medium','High','Urgent'];

const FIRST_NAMES = ['Olivia','Jack','Charlotte','William','Ava','Noah','Mia','Lucas','Isla','Ethan','Amelia','Henry','Grace','Oliver','Zoe','Thomas','Ruby','James','Chloe','Leo','Sophie','Max','Ella','Samuel','Hannah','Daniel','Lily','Alexander','Emily','Cooper','Matilda','Riley','Georgia','Nathan','Ivy','Patrick','Freya','Marcus','Aisha','Ben'];
const LAST_NAMES = ['Nguyen','Smith','Tran','Wilson','Chen','Taylor','Anderson','Walker','Kumar','Brown','Patel','Johnson','Lee','White','Martin','Clarke','Robinson','Singh','Campbell','Mitchell','Scott','Bell','Ryan','Foster','Marshall','Reid','Hughes','Kelly','Ferguson','Cross'];
const COMPANY_WORDS1 = ['Southbank','Harbour','Coastal','Summit','Bridgeview','Northside','Bondi','Yarra','Redgum','Ironbark','Silverline','Parkview','Riverside','Crestline','Golden Acre','Blue Gum','Elm Street','Kangaroo','Outback','Sundance','Vantage','Anchor','Cedar','Meridian','Wattle'];
const COMPANY_WORDS2 = ['Constructions','Logistics','Retail Group','Hospitality','Consulting','Dental','Financial','Property','Media','Import Co','Engineering','Motors','Holdings','Fitness','Legal','Interiors','Café Co','Transport','Agriculture','Ventures','Technologies','Fabrication','Wholesale','Realty','Clinic'];
const AU_SUBURBS = ['Melbourne VIC','Sydney NSW','Brisbane QLD','Perth WA','Adelaide SA','Parramatta NSW','South Yarra VIC','Fortitude Valley QLD','Fremantle WA','Newcastle NSW','Geelong VIC','Surfers Paradise QLD','Chatswood NSW','Richmond VIC','North Sydney NSW'];

const ROLES = ['Managing Partner','Partner','Senior Accountant','Accountant','Tax Agent','Bookkeeper','Client Manager','Graduate Accountant','Office Manager'];
const DEPARTMENTS = ['Tax','Business Services','Bookkeeping','Audit & Assurance','SMSF','Advisory'];

function randomName(){ return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }
function randomCompany(){ return `${pick(COMPANY_WORDS1)} ${pick(COMPANY_WORDS2)}`; }
function randomABN(){ return Array.from({length:11},()=>rand(0,9)).join('').replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4'); }
function pastDate(maxDaysAgo){ return new Date(Date.now() - rand(0,maxDaysAgo)*86400000); }
function futureDate(maxDaysAhead, minDaysAhead=-10){ return new Date(Date.now() + rand(minDaysAhead,maxDaysAhead)*86400000); }

function buildDB(){
  const DB = {};

  /* ---------------- STAFF ---------------- */
  DB.staff = Array.from({length:25}).map((_,i)=>{
    const name = randomName();
    const role = i===0 ? 'Managing Partner' : (i<4 ? 'Partner' : pick(ROLES));
    const capacityPct = rand(38,108);
    return {
      id: uid('staff'),
      name, role,
      department: pick(DEPARTMENTS),
      email: `${name.toLowerCase().replace(' ','.')}@practiceflow.au`,
      avatarColor: avatarColor(name),
      capacity: capacityPct,
      billableTarget: rand(70,90),
      clientsAssigned: rand(4,22),
      activeJobs: rand(2,14),
      leaveUpcoming: Math.random()>0.7 ? futureDate(40,3) : null,
      productivityTrend: Array.from({length:8},()=>rand(60,100)),
    };
  });
  const partners = DB.staff.filter(s=>s.role.includes('Partner'));

  /* ---------------- CLIENTS ---------------- */
  const clientTypes = ['Company','Sole Trader','Trust','Partnership','SMSF'];
  DB.clients = Array.from({length:62}).map((_,i)=>{
    const isCompany = Math.random()>0.28;
    const name = isCompany ? randomCompany() : randomName();
    const manager = pick(DB.staff);
    return {
      id: uid('cli'),
      name,
      type: isCompany ? pick(clientTypes) : 'Individual',
      abn: isCompany ? randomABN() : null,
      email: `accounts@${name.toLowerCase().replace(/[^a-z0-9]/g,'')}.com.au`,
      phone: `04${rand(10,99)} ${rand(100,999)} ${rand(100,999)}`,
      location: pick(AU_SUBURBS),
      manager: manager.name,
      status: pick(['Active','Active','Active','Active','Onboarding','At Risk']),
      tags: pickN(['VIP','New','Xero','MYOB','QuickBooks','Monthly','Annual','High Value'], rand(1,3)),
      since: pastDate(1800),
      revenueYTD: rand(2200, 84000),
      openJobs: 0,
      notesCount: rand(0,9),
      docsCount: rand(3,40),
    };
  });

  /* ---------------- WORKFLOW TEMPLATES ---------------- */
  const stageSets = {
    'Individual Tax Return': ['Collect Client Documents','Review Documents','Prepare Return','Internal Review','Partner Approval','Send to Client','Receive Signature','Lodge Return','Completed'],
    'Company Tax Return': ['Collect Financials','Reconcile Accounts','Prepare Return','Internal Review','Partner Approval','Send to Client','Receive Signature','Lodge Return','Completed'],
    'BAS Lodgement': ['Request Source Data','Reconcile GST','Prepare BAS','Review','Client Approval','Lodge BAS','Completed'],
    'Payroll': ['Collect Timesheets','Process Pay Run','Review','Send Payslips','Lodge STP','Completed'],
    'SMSF': ['Collect Financials','Prepare Financial Statements','Audit Referral','Trustee Review','Lodge Return','Completed'],
    'Financial Statements': ['Collect Data','Draft Statements','Internal Review','Partner Sign-off','Deliver to Client','Completed'],
  };
  DB.workflowTemplates = SERVICES.map((svc)=>{
    const stages = stageSets[svc] || ['Collect Documents','Prepare Work','Internal Review','Partner Review','Send to Client','Completed'];
    return {
      id: uid('wft'),
      name: svc,
      description: `Standard ${svc.toLowerCase()} workflow used across the practice.`,
      category: svc,
      usageCount: rand(4,58),
      stages: stages.map((s,idx)=>({
        id: uid('stg'), name: s, order: idx,
        role: idx < stages.length-2 ? pick(['Accountant','Senior Accountant','Bookkeeper']) : 'Partner',
        durationDays: rand(1,5),
        automation: Math.random()>0.6 ? pick(['Notify assignee','Move to next stage','Email client','Create checklist']) : null,
      })),
    };
  }).concat(Array.from({length:30-SERVICES.length}).map((_,i)=>({
      id: uid('wft'), name: `${pick(SERVICES)} — Custom ${i+1}`, description:'Firm custom workflow variant.',
      category: pick(SERVICES), usageCount: rand(1,20),
      stages: ['Intake','Preparation','Review','Approval','Delivery'].map((s,idx)=>({ id:uid('stg'), name:s, order:idx, role: pick(['Accountant','Senior Accountant','Partner']), durationDays: rand(1,4), automation:null })),
  })));

  /* ---------------- JOBS (WORK ITEMS) ---------------- */
  DB.jobs = [];
  const statusWeights = ['not_started','not_started','waiting_client','waiting_client','docs_requested','docs_received','in_progress','in_progress','in_progress','ready_review','partner_review','approved','awaiting_signature','lodged','completed','completed'];
  DB.clients.forEach(client=>{
    const jobCount = rand(1,3);
    for(let j=0;j<jobCount;j++){
      const service = pick(SERVICES);
      const status = pick(statusWeights);
      const assignee = pick(DB.staff);
      const reviewer = pick(partners);
      const budget = rand(4,60);
      const actual = status==='completed'||status==='lodged' ? budget + randFloat(-3,4) : randFloat(0, budget*0.9);
      const template = DB.workflowTemplates.find(t=>t.category===service) || DB.workflowTemplates[0];
      const due = status==='completed'||status==='lodged'||status==='cancelled' ? pastDate(60) : futureDate(50, -20);
      const job = {
        id: uid('job'),
        title: `${service} — FY${25}`,
        clientId: client.id,
        clientName: client.name,
        service,
        status,
        priority: pick(PRIORITIES),
        assignee: assignee.name,
        reviewer: reviewer.name,
        budgetHours: budget,
        actualHours: Math.max(0,actual),
        dueDate: due,
        createdDate: pastDate(120),
        tags: pickN(['FY25','Recurring','New Client','Complex','Fast Track','ATO Flagged'], rand(0,2)),
        templateId: template.id,
        stageIndex: rand(0, template.stages.length-1),
        comments: rand(0,7),
        attachments: rand(0,9),
        dependencies: Math.random()>0.85 ? 1 : 0,
        activity: [],
      };
      job.progress = job.status==='completed' ? 100 : clamp(Math.round((job.stageIndex+1)/template.stages.length*100),5,96);
      job.activity.push({ text:`Job created from ${template.name} template`, at: job.createdDate, user: 'System' });
      job.activity.push({ text:`Assigned to ${assignee.name}`, at: pastDate(80), user: reviewer.name });
      if(['ready_review','partner_review','approved','lodged','completed'].includes(status)){
        job.activity.push({ text:`Status moved to ${WORK_STATUSES.find(s=>s.id===status).label}`, at: pastDate(10), user: assignee.name });
      }
      DB.jobs.push(job);
      client.openJobs += (status!=='completed' && status!=='cancelled') ? 1 : 0;
    }
  });

  /* ---------------- TASKS (subtasks under jobs) ---------------- */
  DB.tasks = [];
  const taskNames = ['Reconcile bank feed','Chase missing invoices','Prepare workpapers','Draft cover letter','Check prior year comparatives','Confirm ABN/TFN details','Upload signed docs to file','Update client contact details','Review depreciation schedule','Cross-check payroll totals'];
  DB.jobs.forEach(job=>{
    const n = rand(2,6);
    for(let i=0;i<n;i++){
      DB.tasks.push({
        id: uid('task'), jobId: job.id, title: pick(taskNames), done: Math.random()>0.5,
        assignee: job.assignee, due: futureDate(20,-5), priority: pick(PRIORITIES),
      });
    }
  });

  /* ---------------- DOCUMENTS ---------------- */
  DB.documents = [];
  const docTypes = ['Bank Statement.pdf','Driver Licence.pdf','Payroll Report.xlsx','BAS Report.pdf','Financial Statements.pdf','Invoice.pdf','Trust Deed.pdf','Prior Year Return.pdf','Asset Register.xlsx','Rental Schedule.pdf'];
  DB.clients.forEach(client=>{
    const n = rand(3,10);
    for(let i=0;i<n;i++){
      DB.documents.push({
        id: uid('doc'), clientId: client.id, clientName: client.name, name: pick(docTypes),
        category: pick(['Compliance','Financial','Identification','Correspondence']),
        uploadedBy: pick(DB.staff).name, uploadedAt: pastDate(200), size: `${randFloat(0.1,8.4)} MB`,
        status: pick(['Approved','Pending Review','Approved','Approved']),
      });
    }
  });

  /* ---------------- CLIENT DOCUMENT REQUESTS ---------------- */
  DB.requests = [];
  const reqItems = ['Driver Licence','Bank Statements (last 3 months)','Payroll Reports','BAS Reports','Financial Statements','Rental Income Summary','Motor Vehicle Logbook','Private Health Insurance Statement'];
  DB.clients.slice(0,34).forEach(client=>{
    DB.requests.push({
      id: uid('req'), clientId: client.id, clientName: client.name,
      items: pickN(reqItems, rand(2,4)).map(name=>({ name, status: pick(['Pending','Uploaded','Reviewed','Approved','Rejected']) })),
      sentAt: pastDate(30), dueDate: futureDate(15,1),
    });
  });

  /* ---------------- MEETINGS ---------------- */
  DB.meetings = Array.from({length:42}).map(()=>{
    const client = pick(DB.clients);
    return {
      id: uid('mtg'), title: pick(['Quarterly Review','Tax Planning Session','Onboarding Call','Year-End Review','BAS Check-in','Advisory Session']),
      clientName: client.name, with: pick(DB.staff).name,
      start: futureDate(30,-14), durationMins: pick([30,45,60]),
      location: pick(['Zoom','Firm Office — Meeting Room 1','Phone Call','Client Site']),
    };
  });

  /* ---------------- NOTIFICATIONS ---------------- */
  DB.notifications = Array.from({length:60}).map(()=>{
    const kind = pick(['mention','assignment','deadline','workflow','upload','system']);
    const map = {
      mention: { icon:'comment', text: `${pick(DB.staff).name} mentioned you in ${pick(DB.clients).name}`, color:'signal' },
      assignment: { icon:'userPlus', text: `You were assigned to ${pick(SERVICES)} for ${pick(DB.clients).name}`, color:'violet' },
      deadline: { icon:'clock', text: `${pick(SERVICES)} for ${pick(DB.clients).name} is due soon`, color:'amber' },
      workflow: { icon:'workflow', text: `${pick(DB.clients).name} moved to ${pick(WORK_STATUSES).label}`, color:'signal' },
      upload: { icon:'upload', text: `${pick(DB.clients).name} uploaded new documents`, color:'ledger' },
      system: { icon:'sparkle', text: `Weekly capacity report is ready`, color:'slate' },
    };
    const m = map[kind];
    return { id: uid('notif'), ...m, at: pastDate(20), read: Math.random()>0.4 };
  }).sort((a,b)=> new Date(b.at)-new Date(a.at));

  /* ---------------- AUTOMATIONS ---------------- */
  DB.automations = [
    { id: uid('auto'), name:'Client uploads documents → Notify accountant', trigger:'Client uploads documents', conditions:['Document category = Compliance'], actions:['Move workflow to Review','Notify assigned accountant','Create internal task'], active:true, runs: rand(80,400) },
    { id: uid('auto'), name:'Job overdue → Alert partner', trigger:'Due date passes', conditions:['Status is not Completed'], actions:['Notify partner','Flag job as at risk'], active:true, runs: rand(20,90) },
    { id: uid('auto'), name:'Return lodged → Send confirmation', trigger:'Status changes to Lodged', conditions:[], actions:['Email client confirmation','Archive documents'], active:true, runs: rand(100,300) },
    { id: uid('auto'), name:'New client → Onboarding checklist', trigger:'Client created', conditions:[], actions:['Create onboarding job','Assign client manager','Send welcome email'], active:false, runs: rand(10,60) },
    { id: uid('auto'), name:'Document request unanswered 7 days → Reminder', trigger:'Request pending 7 days', conditions:['Status = Pending'], actions:['Send reminder email','Notify accountant'], active:true, runs: rand(30,150) },
  ];

  /* ---------------- HELPDESK TICKETS ---------------- */
  DB.tickets = Array.from({length:22}).map(()=>{
    const isClient = Math.random()>0.4;
    return {
      id: uid('tkt'), subject: pick(['Cannot access client portal','Question about BAS lodgement','Need copy of prior year return','Update banking details','Xero connection issue','Invoice discrepancy']),
      from: isClient ? pick(DB.clients).name : pick(DB.staff).name,
      type: isClient ? 'Client' : 'Internal',
      status: pick(['Open','In Progress','Waiting','Resolved']),
      priority: pick(PRIORITIES),
      createdAt: pastDate(40),
    };
  });

  /* ---------------- INVOICES ---------------- */
  DB.invoices = DB.clients.slice(0,45).map(client=>({
    id: uid('inv'), number: `INV-${rand(10000,10999)}`, clientName: client.name,
    amount: rand(400,9000), status: pick(['Paid','Paid','Paid','Outstanding','Overdue','Draft']),
    issuedAt: pastDate(90), dueAt: futureDate(30,-30),
  }));

  return DB;
}

const DB = buildDB();
