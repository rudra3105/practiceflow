'use strict';

/* ============================ ICONS ============================
   Minimal inline SVG icon set (stroke-based, feather-inspired).
   Kept as template strings so no external icon font / network call
   is ever required. */
const Icon = (name, cls = '') => {
  const P = `stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = {
    dashboard: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>`,
    work: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>`,
    clients: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="8.5" r="2.5"/><path d="M15.5 14.2c2.6.3 4.7 2.3 5 5.8"/></svg>`,
    tasks: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M9 11l2.2 2.2L16 8.5"/><rect x="3" y="3" width="18" height="18" rx="4"/></svg>`,
    workflow: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="12" r="2.6"/><path d="M8.3 7.2 15.7 10.8M8.3 16.8 15.7 13.2"/></svg>`,
    templates: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    docs: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>`,
    calendar: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
    team: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 20.5c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"/></svg>`,
    automation: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`,
    insights: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>`,
    reports: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`,
    time: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.3 2"/></svg>`,
    billing: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>`,
    help: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2-2.6 3.6"/><path d="M12 17.3h.01"/></svg>`,
    bell: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M18 8a6 6 0 0 0-12 0c0 6-2.5 7-2.5 7h17S18 14 18 8z"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/></svg>`,
    settings: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.5 2.4a7.7 7.7 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3l-2 1.6 2 3.4 2.3-.9c.8.7 1.6 1.2 2.6 1.5L10 22h4l.5-2.4c1-.3 1.8-.8 2.6-1.5l2.3.9 2-3.4z"/></svg>`,
    search: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
    plus: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M12 5v14M5 12h14"/></svg>`,
    chevronDown: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="m6 9 6 6 6-6"/></svg>`,
    chevronLeft: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="m9 18 6-6-6-6"/></svg>`,
    x: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M18 6 6 18M6 6l12 12"/></svg>`,
    check: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M20 6 9 17l-5-5"/></svg>`,
    clock: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>`,
    flag: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M5 3v18M5 4h11l-2.2 3.5L16 11H5"/></svg>`,
    paperclip: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.3 3.3 0 0 1 4.7 4.7L10 19a1.6 1.6 0 0 1-2.3-2.3L15.5 9"/></svg>`,
    comment: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    dots: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
    dotsH: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>`,
    trash: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`,
    edit: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
    copy: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    upload: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>`,
    download: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>`,
    filter: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M4 5h16M7 12h10M10 19h4"/></svg>`,
    grid: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>`,
    list: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
    logout: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>`,
    mail: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 7 9-7"/></svg>`,
    building: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>`,
    fire: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c1.5 1 2 2.7 2 4.3A5.3 5.3 0 0 1 6.4 15C6.4 9 12 7 12 2z"/></svg>`,
    zap: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`,
    link: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M9 15l6-6"/><path d="M11 6l1-1a4 4 0 0 1 5.7 5.7l-1 1"/><path d="M13 18l-1 1A4 4 0 0 1 6.3 13.3l1-1"/></svg>`,
    ticket: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/></svg>`,
    sparkle: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>`,
    inbox: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M3 12h5l1.5 3h5L16 12h5"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`,
    trend: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M3 17l6-6 4 4 8-8"/><path d="M15 6h6v6"/></svg>`,
    trendDown: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M3 7l6 6 4-4 8 8"/><path d="M15 18h6v-6"/></svg>`,
    lock: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
    globe: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>`,
    play: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M6 4l13 8-13 8z"/></svg>`,
    pause: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M7 4h4v16H7zM13 4h4v16h-4z"/></svg>`,
    stop: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><rect x="5" y="5" width="14" height="14" rx="2"/></svg>`,
    star: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6z"/></svg>`,
    arrowRight: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    userPlus: `<svg class="${cls}" viewBox="0 0 24 24" ${P}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-6.2 6.5-6.2s6.5 2.7 6.5 6.2"/><path d="M18 8v5M20.5 10.5h-5"/></svg>`,
  };
  return icons[name] || '';
};

/* ============================ FORMAT ============================ */
const AUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const fmtMoney = (n) => AUD.format(n);
const fmtMoneyFull = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
const fmtNum = (n) => new Intl.NumberFormat('en-AU').format(n);
const fmtDate = (d, opts) => new Date(d).toLocaleDateString('en-AU', opts || { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateShort = (d) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
const fmtDateTime = (d) => new Date(d).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtHours = (h) => `${h.toFixed(1)}h`;

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30); return `${mo}mo ago`;
}

function daysUntil(date) {
  const diff = new Date(date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.round(diff / 86400000);
}

function dueLabel(date) {
  const d = daysUntil(date);
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, tone: 'coral' };
  if (d === 0) return { text: 'Due today', tone: 'amber' };
  if (d === 1) return { text: 'Due tomorrow', tone: 'amber' };
  if (d <= 5) return { text: `Due in ${d}d`, tone: 'amber' };
  return { text: `Due ${fmtDateShort(date)}`, tone: 'slate' };
}

/* ============================ MISC ============================ */
const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const esc = (str = '') => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (name = '') => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => { const c = [...arr]; const out = []; while (out.length < n && c.length) { out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); } return out; };
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dp=1) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));

const AVATAR_PALETTE = ['#2953E4', '#0F9D77', '#C9820A', '#D6483F', '#6E56CF', '#0E7C9E', '#B23B72', '#5B6B82'];
function avatarColor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function avatarHTML(name, size = 30) {
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${size*0.38}px;background:${avatarColor(name)}">${esc(initials(name))}</span>`;
}

function debounce(fn, ms = 250) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function animateCount(el, to, opts = {}) {
  const { duration = 700, prefix = '', suffix = '', decimals = 0 } = opts;
  const from = 0; const start = performance.now();
  function step(now) {
    const p = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = from + (to - from) * eased;
    el.textContent = prefix + val.toLocaleString('en-AU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================ TOASTS ============================ */
function toast(message, type = 'info') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const iconMap = { success: 'check', info: 'sparkle', warn: 'flag' };
  el.innerHTML = `<span class="icon">${Icon(iconMap[type] || 'sparkle', '')}</span><span>${esc(message)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .25s, transform .25s'; el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 260); }, 3200);
}

/* ============================ CONTEXT MENU ============================ */
function openContextMenu(x, y, items) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu scale-in';
  menu.id = 'activeCtxMenu';
  menu.innerHTML = items.map(it => it.sep ? `<div class="ctx-sep"></div>` :
    `<div class="ctx-item ${it.danger ? 'danger' : ''}" data-action="${it.id}">${Icon(it.icon || 'dots')}<span>${esc(it.label)}</span></div>`).join('');
  document.body.appendChild(menu);
  const rect = { w: 200, h: items.length * 34 };
  menu.style.left = Math.min(x, window.innerWidth - rect.w - 10) + 'px';
  menu.style.top = Math.min(y, window.innerHeight - rect.h - 10) + 'px';
  menu.querySelectorAll('.ctx-item').forEach(node => {
    node.addEventListener('click', () => {
      const item = items.find(i => i.id === node.dataset.action);
      closeContextMenu();
      if (item && item.onClick) item.onClick();
    });
  });
  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}
function closeContextMenu() { const m = document.getElementById('activeCtxMenu'); if (m) m.remove(); }

/* ============================ SMALL DOM HELPERS ============================ */
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }
