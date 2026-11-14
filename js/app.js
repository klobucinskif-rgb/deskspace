/* Deskspace — demo app. All data lives in this browser (localStorage). */
(function () {
  'use strict';

  var KEY = 'deskspace-demo-v3', USER_KEY = 'deskspace-user';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  // Demo sign-in: the user is whoever signed in on login.html (stored in this browser only).
  var USER = null;
  try { USER = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { USER = null; }
  if (!USER || !USER.email) { location.replace('login.html'); return; }
  var ME = (USER.name || 'You').split(' ')[0];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tc(t) { t = Math.max(0, Math.floor(t + 0.001)); return pad(Math.floor(t / 60)) + ':' + pad(t % 60); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function slug(s) { return String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'file'; }
  function fmtSize(b) {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
    if (b >= 1e6) return Math.round(b / 1e6) + ' MB';
    return Math.max(1, Math.round(b / 1e3)) + ' KB';
  }
  function src(x) { return !x ? '' : (x.indexOf('data:') === 0 || x.indexOf('blob:') === 0 ? x : 'img/' + x + '.jpg'); }
  function avClass(name) {
    if (name === ME) return '';
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 5;
    return ' c' + (h + 1);
  }
  function av(name, sm) { return '<span class="av' + (sm ? ' sm' : '') + avClass(name) + '">' + esc(name.charAt(0).toUpperCase()) + '</span>'; }

  var ICON = {
    home: '<path d="M4 11l8-6.5 8 6.5v8a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    review: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    plans: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 14.5h4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    tasks: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.5l2.4 2.4 4.6-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
    down: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    panel: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chev: '<path d="M8 10l4-4 4 4M8 14l4 4 4-4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    file: '<path d="M7 3.5h7l4.5 4.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M14 3.5V8h4.5"/>',
    film: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>',
    send: '<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.2v.3"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }

  var STATUS = { draft: 'Draft', review: 'In Review', changes: 'Changes', approved: 'Approved' };
  var THEME_BTN = '<button class="theme-btn" type="button" data-theme-toggle aria-label="Switch between light and dark theme" title="Light / dark">' +
    '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>' +
    '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg></button>';

  var PLANS = [
    { id: 'free', name: 'Free', price: '€0', gb: 1, ws: 1, team: 1, f: 'Try it on one project.' },
    { id: 'creator', name: 'Creator', price: '€19.99', gb: 250, ws: 1, team: 1, f: 'For freelancers and solo creators.' },
    { id: 'pro', name: 'Pro', price: '€34.99', gb: 1000, ws: 1, team: 1, f: 'For heavy video work on your own.' },
    { id: 'team', name: 'Team', price: '€54.99', gb: 2000, ws: 2, team: 5, f: 'For studios and small agencies.' },
    { id: 'agency', name: 'Agency', price: '€89.99', gb: 5000, ws: 5, team: 10, f: 'For agencies with several teams.' }
  ];
  function gb(n) { return n >= 1000 ? (Math.round(n / 10) / 100) + ' TB' : n + ' GB'; }
  function plan() { return PLANS.filter(function (x) { return x.id === S.plan; })[0] || PLANS[3]; }
  function store(w) {
    var p = plan(), over = w.usedGb > p.gb;
    return { pct: Math.min(100, Math.max(1, Math.round(w.usedGb / p.gb * 100))), over: over, txt: gb(w.usedGb) + ' of ' + gb(p.gb),
      free: over ? 'Over the ' + p.name + ' limit by ' + gb(w.usedGb - p.gb) : p.name + ' plan · ' + gb(p.gb - w.usedGb) + ' free' };
  }
  function wsSub(w) { return plan().name + ' · ' + w.team.length + (w.team.length === 1 ? ' person' : ' people'); }
  function foldersOf(p) {
    if (!p.folders) p.folders = [];
    p.files.forEach(function (f) { if (f.folder && p.folders.indexOf(f.folder) < 0) p.folders.push(f.folder); });
    return p.folders;
  }

  function pill(s) { return '<span class="pill ' + s + '">' + STATUS[s] + '</span>'; }

  /* ---------- seed data ---------- */
  function seed() {
    return {
      ws: 'halden', collapsed: false, plan: 'team',
      notes: [
        { id: 'n1', text: 'Maren prefers the shorter intro. Keep every cut under 45 seconds.', project: '', ws: 'halden', when: 'Yesterday' },
        { id: 'n2', text: 'Ask Jo for the final Atelier logo before the Lookbook export.', project: '', ws: 'halden', when: '2 days ago' },
        { id: 'n3', text: 'The client wants the 9x16 version first. The wide cut can follow.', project: 'northline-campaign', ws: 'halden', when: 'Yesterday' }
      ],
      workspaces: [
        { id: 'halden', name: 'Halden Studio', letter: 'H', usedGb: 1240, team: [ME, 'Leo', 'Sam', 'Jo', 'Kai'] },
        { id: 'films', name: 'Halden Films', letter: 'F', cls: 'f', usedGb: 160, team: [ME, 'Leo', 'Kai'] }
      ],
      clients: [
        { id: 'northline', ws: 'halden', name: 'Northline', contact: 'Maren', color: '#4f9ce8' },
        { id: 'north', ws: 'halden', name: 'North Studio', contact: 'Noor', color: '#6c7fd8' },
        { id: 'atelier', ws: 'halden', name: 'Atelier Journal', contact: 'Jo', color: '#3db389' },
        { id: 'forma', ws: 'halden', name: 'Forma', contact: 'Sam', color: '#e3a43a' }
      ],
      projects: [
        { id: 'northline-campaign', ws: 'halden', name: 'Northline Campaign', client: 'northline', due: 'Fri 7 Nov', cover: 'bridge-wide', folders: ['Cuts', 'Selects', 'Audio', 'Delivery'], files: [
          { id: 'nl-main', name: 'Northline_Campaign.mp4', kind: 'video', folder: 'Cuts', size: '1.8 GB · ProRes 422', dur: 42, version: 3, status: 'review', thumb: 'bridge-wide',
            segs: [{ label: 'Intro', len: 12, img: 'bridge-wide' }, { label: 'Bridge', len: 10, img: 'bridge-arm' }, { label: 'Street', len: 10, img: 'walk' }, { label: 'Canal', len: 10, img: 'walk-close' }],
            comments: [{ id: 'c1', who: ME, role: 'Editor', t: 14, v: 3, text: 'New cut is up — tighter bridge scene and a new grade.' }] },
          { id: 'nl-teaser', name: 'Northline_Teaser_15s.mp4', kind: 'video', folder: 'Cuts', size: '48 MB', dur: 15, version: 1, status: 'draft', thumb: 'teaser',
            segs: [{ label: 'Teaser', len: 15, img: 'walk' }], comments: [] },
          { id: 'nl-bts', name: 'Northline_BTS_Crew.mov', kind: 'video', folder: 'Selects', size: '3.2 GB', dur: 66, version: 1, status: 'changes', thumb: 'crew',
            segs: [{ label: 'Crew', len: 66, img: 'crew' }],
            comments: [{ id: 'c2', who: 'Maren', role: 'Client', t: 21, v: 1, text: 'Can we cut the pause here? It drags a little.' }] },
          { id: 'nl-still', name: 'Northline_Hero_Still.jpg', kind: 'image', folder: 'Selects', size: '14 MB', dur: 0, version: 1, status: 'draft', thumb: 'portrait', segs: [], comments: [] },
          { id: 'nl-social', name: 'Northline_Social_9x16.mp4', kind: 'video', folder: 'Delivery', size: '96 MB', dur: 18, version: 2, status: 'approved', approvedV: 2, approvedBy: 'Maren', thumb: 'social',
            segs: [{ label: 'Social', len: 18, img: 'walk-close' }], comments: [] }
        ] },
        { id: 'spring-teaser', ws: 'halden', name: 'Spring — Teaser', client: 'north', due: 'Wed 12 Nov', cover: 'spring', files: [
          { id: 'sp-main', name: 'Spring_Teaser.mp4', kind: 'video', folder: 'Cuts', size: '640 MB', dur: 30, version: 2, status: 'review', thumb: 'spring',
            segs: [{ label: 'Valley', len: 30, img: 'spring' }], comments: [{ id: 'c3', who: 'Leo', role: 'Editor', t: 4, v: 2, text: 'Second pass on the colour. Waiting on your notes.' }] }
        ] },
        { id: 'lookbook-01', ws: 'halden', name: 'Lookbook 01', client: 'atelier', due: 'Mon 10 Nov', cover: 'lookbook', files: [
          { id: 'lb-main', name: 'Lookbook_01_Cut.mp4', kind: 'video', folder: 'Cuts', size: '1.1 GB', dur: 48, version: 1, status: 'changes', thumb: 'lookbook',
            segs: [{ label: 'Opening', len: 48, img: 'lookbook' }],
            comments: [
              { id: 'c4', who: 'Jo', role: 'Client', t: 9, v: 1, text: 'Hold this shot one second longer.' },
              { id: 'c5', who: 'Jo', role: 'Client', t: 31, v: 1, text: 'The title should come in earlier.' }
            ] }
        ] },
        { id: 'forma-brand-film', ws: 'halden', name: 'Forma — Brand film', client: 'forma', due: 'Fri 21 Nov', cover: 'walk', files: [
          { id: 'fo-main', name: 'Forma_Rough_Cut.mp4', kind: 'video', folder: 'Cuts', size: '2.4 GB', dur: 54, version: 1, status: 'draft', thumb: 'walk',
            segs: [{ label: 'Rough cut', len: 54, img: 'walk' }], comments: [] }
        ] }
      ],
      tasks: [
        { id: 't1', text: 'Send v3 of the campaign film to Maren', project: 'northline-campaign', done: true },
        { id: 't2', text: 'Recut the BTS pause at 00:21', project: 'northline-campaign', done: false },
        { id: 't3', text: 'Export 9x16 teaser for social', project: 'northline-campaign', done: false },
        { id: 't4', text: 'Apply Jo\'s two notes on Lookbook 01', project: 'lookbook-01', done: false },
        { id: 't5', text: 'Follow up with North Studio on the teaser', project: 'spring-teaser', done: false }
      ],
      activity: [
        { who: 'Maren', text: 'approved Northline_Social_9x16.mp4', when: '2 h ago' },
        { who: 'Leo', text: 'uploaded v2 of Spring_Teaser.mp4', when: 'Yesterday' },
        { who: ME, text: 'uploaded v3 of Northline_Campaign.mp4', when: 'Yesterday' },
        { who: 'Jo', text: 'requested 2 changes on Lookbook 01', when: '2 days ago' }
      ]
    };
  }

  /* ---------- state ---------- */
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || !S.projects || !S.notes) S = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable or full */ } }

  var ui = { wsOpen: false, acct: false, share: false, shareDl: true, modal: null, as: 'team', folder: '', q: '', t: 0, playing: false, sel: 0, hot: '' };
  var blobs = {};      // fileId -> object URL of a file uploaded in this session
  var tick = null;

  function ws() { return S.workspaces.filter(function (w) { return w.id === S.ws; })[0] || S.workspaces[0]; }
  function projects() { return S.projects.filter(function (p) { return p.ws === S.ws; }); }
  function clients() { return S.clients.filter(function (c) { return c.ws === S.ws; }); }
  function client(id) { return S.clients.filter(function (c) { return c.id === id; })[0] || { name: 'No client', contact: 'Client', color: '#64748b' }; }
  function project(id) { return S.projects.filter(function (p) { return p.id === id; })[0]; }
  function fileOf(p, id) { return p && p.files.filter(function (f) { return f.id === id; })[0]; }
  function pStatus(p) {
    var st = p.files.map(function (f) { return f.status; });
    if (st.indexOf('changes') > -1) return 'changes';
    if (st.indexOf('review') > -1) return 'review';
    if (st.length && st.every(function (s) { return s === 'approved'; })) return 'approved';
    if (st.indexOf('approved') > -1 && st.indexOf('review') < 0) return 'approved';
    return 'draft';
  }
  function log(who, text) { S.activity.unshift({ who: who, text: text, when: 'Just now' }); S.activity = S.activity.slice(0, 30); }

  /* ---------- routing ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    return { v: h[0] || 'home', a: h[1] || '', b: h[2] || '' };
  }
  function go(path) { if (location.hash === '#/' + path) render(); else location.hash = '#/' + path; }
  var lastFile = '';

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.innerHTML = ic('check') + '<span>' + esc(msg) + '</span>';
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  /* ---------- sidebar ---------- */
  function renderSide() {
    var r = route(), w = ws(), ps = projects(), st = store(w);
    var inReview = 0;
    ps.forEach(function (p) { p.files.forEach(function (f) { if (f.status === 'review' || f.status === 'changes') inReview++; }); });
    var ids = ps.map(function (p) { return p.id; });
    var open = S.tasks.filter(function (t) { return !t.done && ids.indexOf(t.project) > -1; }).length;
    function item(v, icon, label, count) {
      var on = r.v === v || (v === 'projects' && (r.v === 'p' || r.v === 'f'));
      return '<button class="nav-item' + (on ? ' on' : '') + '" data-go="' + v + '" title="' + label + '">' + ic(icon) + '<span>' + label + '</span>' + (count != null ? '<span class="count">' + count + '</span>' : '') + '</button>';
    }
    var h = '<div class="side-top"><a class="logo" href="#/home" title="Deskspace"><svg><use href="#mark"/></svg><span>Desk<span class="space">space</span></span></a>' +
      '<button class="icon-btn" data-act="collapse" title="Collapse sidebar" aria-label="Collapse sidebar">' + ic('panel') + '</button></div>';
    h += '<div class="ws"><button class="ws-btn" data-act="ws-toggle" aria-expanded="' + ui.wsOpen + '"><span class="ws-ic ' + (w.cls || '') + '">' + w.letter + '</span><span><b>' + esc(w.name) + '</b><small>' + esc(wsSub(w)) + '</small></span>' + ic('chev') + '</button>';
    if (ui.wsOpen) {
      h += '<div class="menu ws-menu"><header>Workspaces <span>' + esc(plan().name) + ' plan</span></header>' + S.workspaces.map(function (x) {
        var n = S.projects.filter(function (p) { return p.ws === x.id; }).length;
        return '<button class="ws-opt' + (x.id === S.ws ? ' on' : '') + '" data-act="ws-set" data-id="' + x.id + '"><span class="ws-ic ' + (x.cls || '') + '">' + x.letter + '</span><span><b>' + esc(x.name) + '</b><small>' + n + ' project' + (n === 1 ? '' : 's') + '</small></span>' + (x.id === S.ws ? ic('check') : '') + '</button>';
      }).join('') + '</div>';
    }
    h += '</div>';
    h += item('home', 'home', 'Home') + item('projects', 'folder', 'Projects', ps.length) + item('review', 'review', 'In review', inReview) + item('tasks', 'tasks', 'Tasks', open) + item('activity', 'activity', 'Activity') + item('plans', 'plans', 'Plans');
    var cs = clients();
    if (cs.length) {
      h += '<div class="side-label">Clients</div>' + cs.map(function (c) {
        var n = ps.filter(function (p) { return p.client === c.id; }).length;
        return '<button class="nav-item' + (r.v === 'c' && r.a === c.id ? ' on' : '') + '" data-go="c/' + c.id + '" title="' + esc(c.name) + '"><span class="dot" style="background:' + c.color + '"></span><span>' + esc(c.name) + '</span><span class="count">' + n + '</span></button>';
      }).join('');
    }
    h += '<div class="side-foot"><div class="storage"><b>Storage</b><div class="meter"><i' + (st.over ? ' class="over"' : '') + ' style="width:' + st.pct + '%"></i></div><small>' + esc(st.txt) + '</small></div>' +
      '<div class="acct">' + (ui.acct ? '<div class="menu acct-menu" role="menu"><button role="menuitem" data-go="account">Account</button><button role="menuitem" data-go="plans">Plans</button><button role="menuitem" data-theme-toggle>Switch light / dark</button><a role="menuitem" href="index.html">Back to site</a><button role="menuitem" data-act="reset">Reset demo data</button><hr><button role="menuitem" data-act="logout">Sign out</button></div>' : '') +
      '<button class="acct-btn" data-act="acct-toggle" aria-haspopup="menu" aria-expanded="' + ui.acct + '" title="Account">' + av(ME) + '<span><b>' + esc(USER.name) + '</b><small>' + esc(USER.email) + '</small></span>' + ic('chev') + '</button></div></div>';
    $('#side').innerHTML = h;
    $('#app').classList.toggle('collapsed', !!S.collapsed);
  }

  /* ---------- top bar ---------- */
  function renderTop() {
    var r = route(), p, f, h = '<button class="icon-btn menu-btn" data-act="drawer" aria-label="Open menu">' + ic('menu') + '</button>';
    if (r.v === 'p' || r.v === 'f') {
      p = project(r.a); f = r.v === 'f' ? fileOf(p, r.b) : null;
      h += '<button class="icon-btn" data-go="' + (f ? 'p/' + r.a : 'projects') + '" aria-label="Back">' + ic('back') + '</button>';
      if (p) h += '<div class="crumb"><b>' + esc(f ? f.name : p.name) + '</b><small>' + esc(f ? p.name : client(p.client).name + ' · ' + p.files.length + ' file' + (p.files.length === 1 ? '' : 's')) + '</small></div>';
      h += '<span class="sp"></span>' + THEME_BTN;
      if (p && !f) h += '<button class="btn btn-primary btn-sm" data-act="upload">' + ic('upload') + 'Upload</button>';
      if (f && ui.as === 'team') {
        h += '<button class="btn btn-ghost btn-sm" data-act="new-version">' + ic('upload') + 'New version</button>' +
          '<button class="btn btn-primary btn-sm" data-act="share-toggle">' + ic('link') + 'Share link</button>';
      }
    } else {
      var now = new Date();
      var titles = { home: 'Good flow, ' + ME, projects: 'Projects', review: 'In review', tasks: 'Tasks', activity: 'Activity', plans: 'Plans', account: 'Account', c: client(r.a).name };
      var subs = { home: now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), projects: ws().name, review: 'Waiting on a client or on you', tasks: ws().name, activity: ws().name, plans: ws().name, account: USER.email, c: 'Client' };
      h += '<div class="crumb"><b>' + esc(titles[r.v] || 'Deskspace') + '</b><small>' + esc(subs[r.v] || '') + '</small></div><span class="sp"></span>' + THEME_BTN;
      if (r.v === 'home' || r.v === 'projects' || r.v === 'c') {
        h += '<label class="search">' + ic('search') + '<input id="q" type="search" placeholder="Search projects" value="' + esc(ui.q) + '" aria-label="Search projects"></label>' +
          '<button class="btn btn-primary btn-sm" data-act="new-project">' + ic('plus') + 'New project</button>';
      }
    }
    $('#top').innerHTML = h;
  }

  /* ---------- views ---------- */
  function thumb(x, icon) { return x ? '<img src="' + src(x) + '" alt="" loading="lazy">' : '<span class="ph">' + ic(icon || 'file') + '</span>'; }

  function pCard(p) {
    var st = pStatus(p), c = client(p.client);
    var n = p.files.filter(function (f) { return f.status === 'changes'; }).length;
    var next = { draft: ['Not sent yet', 'Open'], review: ['Waiting on client feedback', 'Open'], changes: [n + ' file' + (n === 1 ? '' : 's') + ' to revise', 'Open'], approved: ['Ready to deliver', 'Deliver'] }[st];
    return '<button class="card pcard" data-go="p/' + p.id + (st === 'approved' ? '/delivery' : '') + '"><span class="thumb">' + thumb(p.cover, 'folder') + pill(st) + '</span>' +
      '<span class="body"><b>' + esc(p.name) + '</b><small>' + esc(c.name) + ' · ' + p.files.length + ' file' + (p.files.length === 1 ? '' : 's') + (p.due ? ' · due ' + esc(p.due) : '') + '</small></span>' +
      '<span class="next ' + st + '"><span>' + next[0] + '</span><span>' + next[1] + ' →</span></span></button>';
  }
  function emptyProjects() {
    return '<div class="empty"><b>No projects here yet</b>Create the first project for this workspace.<br><button class="btn btn-primary btn-sm" data-act="new-project">' + ic('plus') + 'New project</button></div>';
  }
  function filtered(list) {
    var q = ui.q.trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (p) { return (p.name + ' ' + client(p.client).name).toLowerCase().indexOf(q) > -1; });
  }

  function taskRows(tasks, pid) {
    return (tasks.length ? tasks.map(function (t) {
      var p = project(t.project);
      return '<button class="row' + (t.done ? ' done' : '') + '" data-act="task" data-id="' + t.id + '"><span class="check' + (t.done ? ' on' : '') + '">' + ic('check') + '</span><span class="grow"><b>' + esc(t.text) + '</b>' + (!pid && p ? '<small>' + esc(p.name) + '</small>' : '') + '</span></button>';
    }).join('') : '<div class="empty-sm">Nothing open. Add the next thing to do.</div>') +
      '<form class="add" data-form="task" data-pid="' + (pid || '') + '"><input class="input" name="text" placeholder="Add a task…" autocomplete="off" aria-label="New task"><button class="btn btn-ghost btn-sm" type="submit">Add</button></form>';
  }
  function notesFor(pid) { return S.notes.filter(function (n) { return (n.project || '') === pid && (pid || n.ws === S.ws); }); }
  function noteRows(pid) {
    var ns = notesFor(pid);
    return (ns.length ? ns.map(function (n) {
      return '<div class="note-row"><p>' + esc(n.text) + '<small>' + esc(n.when) + '</small></p><button class="x" data-act="note-del" data-id="' + n.id + '" aria-label="Delete note">' + ic('x') + '</button></div>';
    }).join('') : '<div class="empty-sm">No notes yet. Write down what you don\'t want to forget.</div>') +
      '<form class="add" data-form="note" data-pid="' + pid + '"><input class="input" name="text" placeholder="Write a note…" autocomplete="off" aria-label="New note"><button class="btn btn-ghost btn-sm" type="submit">Add</button></form>';
  }

  function vHome() {
    var w = ws(), st = store(w), all = projects(), ps = filtered(all);
    var order = { changes: 0, approved: 1, review: 2, draft: 3 };
    ps = ps.slice().sort(function (a, b) { return order[pStatus(a)] - order[pStatus(b)]; });
    var deliver = ps.filter(function (p) { return pStatus(p) === 'approved'; }).length, revise = ps.filter(function (p) { return pStatus(p) === 'changes'; }).length;
    var ids = all.map(function (p) { return p.id; });
    var open = S.tasks.filter(function (t) { return !t.done && ids.indexOf(t.project) > -1; }).slice(0, 5);
    var circ = 2 * Math.PI * 28;
    var h = '<div class="view-head"><h1>Active projects</h1><small>' + deliver + ' to deliver · ' + revise + ' to revise</small><span class="sp"></span><small>Sorted by what needs you</small></div>';
    if (ui.q && !ps.length) h += '<div class="empty"><b>Nothing matches “' + esc(ui.q) + '”</b>Try another name or client.</div>';
    else h += '<div class="pgrid">' + ps.map(pCard).join('') + '</div>' + (ui.q ? '' : '<button class="add-tile bar" data-act="new-project"><span>' + ic('plus') + '</span>New project</button>');
    h += '<div class="home3">' +
      '<div class="card list"><div class="card-h">Tasks <button class="link" data-go="tasks">See all</button></div>' + (all.length ? taskRows(open, '') : '<div class="empty-sm">Create a project to add tasks.</div>') + '</div>' +
      '<div class="card list"><div class="card-h">Notes <span class="muted">' + notesFor('').length + '</span></div>' + noteRows('') + '</div>' +
      '<div class="card"><div class="card-h">Activity <button class="link" data-go="activity">See all</button></div><div class="pad">' + (all.length ? '<ul class="act">' + S.activity.slice(0, 5).map(actLi).join('') + '</ul>' : '<span class="muted">Uploads, comments and approvals show up here.</span>') + '</div></div></div>';
    h += '<div class="home2">' +
      '<div class="card pad"><div class="sub-h">Storage <button class="link" style="font-size:12px" data-go="plans">Plans</button></div><div class="ring"><svg viewBox="0 0 68 68"><circle class="trk" cx="34" cy="34" r="28" fill="none" stroke-width="6"/><circle class="val' + (st.over ? ' over' : '') + '" cx="34" cy="34" r="28" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (circ * st.pct / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 34 34)"/><text x="34" y="38.5" text-anchor="middle">' + st.pct + '%</text></svg><div><b>' + esc(st.txt) + '</b><small>' + esc(st.free) + '</small></div></div></div>' +
      '<div class="card pad"><div class="sub-h">Team <small>' + w.team.length + ' people</small></div><div class="avs">' + w.team.map(function (n) { return av(n); }).join('') + '</div><span class="muted">Clients review by link and don\'t need a seat.</span></div></div>';
    return h;
  }

  function vPlans() {
    var w = ws(), st = store(w), cur = plan();
    var h = '<div class="view-head"><h1>Plans</h1><small>Monthly. Pick by storage and by how many people work inside.</small></div>';
    h += '<div class="card usage"><span><b>' + esc(cur.name) + ' plan</b><br><small>' + esc(st.free) + '</small></span><div class="meter"><i' + (st.over ? ' class="over"' : '') + ' style="width:' + st.pct + '%"></i></div><b>' + esc(st.txt) + '</b></div>';
    h += '<div class="plan-grid">' + PLANS.map(function (p, i) {
      var on = p.id === cur.id;
      return '<div class="card plan-card' + (on ? ' cur' : '') + '">' + (on ? '<span class="pill review tag">Current plan</span>' : '') + '<h3>' + p.name + '</h3><p class="for">' + p.f + '</p><div class="price">' + p.price + '<small>per month</small></div>' +
        '<ul><li>' + ic('check') + gb(p.gb) + ' storage</li><li>' + ic('check') + (p.ws > 1 ? 'Up to ' + p.ws + ' workspaces' : 'Personal space') + '</li>' + (p.team > 1 ? '<li>' + ic('check') + 'Up to ' + p.team + ' team members</li>' : '') + '</ul>' +
        (on ? '<button class="btn btn-ghost btn-sm" disabled>Your plan</button>' : '<button class="btn btn-primary btn-sm" data-act="plan-set" data-id="' + p.id + '">' + (i > PLANS.indexOf(cur) ? 'Upgrade' : 'Switch') + ' to ' + p.name + '</button>') + '</div>';
    }).join('') + '</div><p class="muted" style="margin-top:16px;max-width:640px">Clients review by link and don\'t need a seat. On Team and Agency, your personal space counts as one of the workspaces. This is a demo, so switching plans here does not charge anything.</p>';
    return h;
  }

  function actLi(a) { return '<li>' + av(a.who) + '<span><span><b>' + esc(a.who) + '</b> ' + esc(a.text) + '</span><small>' + esc(a.when) + '</small></span></li>'; }

  function vActivity() {
    var h = '<div class="view-head"><h1>Activity</h1><small>Uploads, comments and approvals</small></div>';
    if (!projects().length || !S.activity.length) return h + '<div class="empty"><b>No activity yet</b>Uploads, comments and approvals in this workspace show up here.</div>';
    return h + '<div class="card pad narrow"><ul class="act">' + S.activity.map(actLi).join('') + '</ul></div>';
  }

  function vAccount() {
    var w = ws(), st = store(w), pl = plan();
    return '<div class="narrow"><div class="profile"><span class="av lg">' + esc(ME.charAt(0).toUpperCase()) + '</span><div><h1>' + esc(USER.name) + '</h1><small>' + esc(USER.email) + '</small></div></div>' +
      '<div class="group"><h2>Profile</h2><form class="card fields" data-form="profile"><div><label for="ac-name">Full name</label><input class="input" id="ac-name" name="name" value="' + esc(USER.name) + '" required autocomplete="name"></div><div><label for="ac-email">Email</label><input class="input" id="ac-email" name="email" type="email" value="' + esc(USER.email) + '" required autocomplete="email"></div><div class="foot"><button class="btn btn-primary btn-sm" type="submit">Save changes</button></div></form></div>' +
      '<div class="group"><h2>Plan and storage</h2><div class="card"><div class="kv"><span><b>' + esc(pl.name) + ' plan</b><small>' + pl.price + ' per month · ' + gb(pl.gb) + ' storage</small></span><button class="btn btn-ghost btn-sm" data-go="plans">Change plan</button></div><div class="kv"><span><b>Storage</b><small>' + esc(st.txt) + ' in ' + esc(w.name) + '</small></span><div class="meter"><i' + (st.over ? ' class="over"' : '') + ' style="width:' + st.pct + '%"></i></div></div></div></div>' +
      '<div class="group"><h2>Workspaces</h2><div class="card">' + S.workspaces.map(function (x) {
        return '<div class="kv"><span style="display:flex;align-items:center;gap:10px"><span class="ws-ic ' + (x.cls || '') + '">' + x.letter + '</span><span><b>' + esc(x.name) + '</b><small>' + x.team.length + ' members</small></span></span>' + (x.id === S.ws ? '<span class="muted">Current</span>' : '<button class="btn btn-ghost btn-sm" data-act="ws-set" data-id="' + x.id + '">Switch</button>') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="group"><h2>Session</h2><div class="card"><div class="kv"><span><b>Sign out</b><small>You stay signed in on this browser until you sign out.</small></span><button class="btn btn-danger btn-sm" data-act="logout">Sign out</button></div></div></div></div>';
  }

  function vProjects(clientId) {
    var ps = projects();
    if (clientId) ps = ps.filter(function (p) { return p.client === clientId; });
    ps = filtered(ps);
    var h = '<div class="view-head"><h1>' + (clientId ? esc(client(clientId).name) : 'All projects') + '</h1><small>' + ps.length + ' project' + (ps.length === 1 ? '' : 's') + '</small></div>';
    return h + (ps.length ? '<div class="pgrid">' + ps.map(pCard).join('') + '</div>' : (ui.q ? '<div class="empty"><b>Nothing matches “' + esc(ui.q) + '”</b>Try another name or client.</div>' : emptyProjects()));
  }

  function fCard(p, f) {
    var open = f.comments.filter(function (c) { return !c.resolvedIn; }).length;
    return '<button class="card fcard" data-go="f/' + p.id + '/' + f.id + '"><span class="thumb">' + thumb(f.thumb, f.kind === 'video' ? 'film' : 'file') +
      (f.status !== 'draft' ? pill(f.status) : '') + (f.kind === 'video' && f.dur ? '<span class="dur">' + tc(f.dur) + '</span>' : (f.kind === 'image' ? '<span class="dur">STILL</span>' : '')) +
      (open ? '<span class="cmt">' + ic('review') + open + '</span>' : '') + '</span>' +
      '<span class="meta"><b>' + esc(f.name) + '</b><small>v' + f.version + ' · ' + esc(f.size) + '</small></span></button>';
  }

  function vProject(p, tab) {
    if (!p) return '<div class="empty"><b>Project not found</b><button class="btn btn-ghost btn-sm" data-go="projects">Back to projects</button></div>';
    tab = tab || 'files';
    var st = pStatus(p), tasks = S.tasks.filter(function (t) { return t.project === p.id; });
    var approved = p.files.filter(function (f) { return f.status === 'approved'; });
    var h = '<div class="view-head"><h1>' + esc(p.name) + '</h1>' + pill(st) + '<span class="sp"></span><small>' + (p.due ? 'Due ' + esc(p.due) + ' · ' : '') + tasks.filter(function (t) { return !t.done; }).length + ' open tasks</small></div>';
    h += '<div class="tabs">' + [['files', 'Files', p.files.length], ['tasks', 'Tasks', tasks.length], ['notes', 'Notes', notesFor(p.id).length], ['activity', 'Activity', ''], ['delivery', 'Delivery', approved.length]].map(function (t) {
      return '<button class="tab' + (tab === t[0] ? ' on' : '') + '" data-go="p/' + p.id + '/' + t[0] + '">' + t[1] + (t[2] !== '' ? '<span class="n">' + t[2] + '</span>' : '') + '</button>';
    }).join('') + '</div>';

    if (tab === 'files') {
      var folders = {}, names = foldersOf(p);
      if (ui.folder && names.indexOf(ui.folder) < 0) ui.folder = '';
      p.files.forEach(function (f) { folders[f.folder] = (folders[f.folder] || 0) + 1; });
      h += '<div class="chips"><button class="chip' + (!ui.folder ? ' on' : '') + '" data-act="folder" data-id="">All <em>' + p.files.length + '</em></button>' + names.map(function (n) {
        return '<button class="chip' + (ui.folder === n ? ' on' : '') + '" data-act="folder" data-id="' + esc(n) + '">' + ic('folder') + esc(n) + ' <em>' + (folders[n] || 0) + '</em></button>';
      }).join('') + '<button class="chip add" data-act="new-folder">' + ic('plus') + 'New folder</button></div>';
      var fs = p.files.filter(function (f) { return !ui.folder || f.folder === ui.folder; });
      h += fs.length ? '<div class="fgrid">' + fs.map(function (f) { return fCard(p, f); }).join('') + '</div>' : '';
      h += '<div class="drop" id="drop">' + (p.files.length ? 'Drop videos, photos or documents here to add them to ' + (ui.folder ? '“' + esc(ui.folder) + '”' : 'this project') : '<b style="color:var(--ink);display:block;margin-bottom:4px">No files yet</b>Drop the first cut here, or use Upload.') + '</div>';
    } else if (tab === 'tasks') {
      h += taskList(tasks, p.id);
    } else if (tab === 'notes') {
      h += '<div class="card list narrow">' + noteRows(p.id) + '</div>';
    } else if (tab === 'activity') {
      var acts = S.activity.filter(function (a) { return p.files.some(function (f) { return a.text.indexOf(f.name) > -1; }) || a.text.indexOf(p.name) > -1; });
      h += acts.length ? '<div class="card pad"><ul class="act">' + acts.map(actLi).join('') + '</ul></div>' : '<div class="empty"><b>No activity yet</b>Uploads, comments and approvals show up here.</div>';
    } else {
      if (!approved.length) {
        h += '<div class="empty"><b>Nothing approved yet</b>When the client approves a version, it shows up here ready to deliver.</div>';
      } else {
        h += '<div class="fin-head"><h2>Final files</h2>' + pill('approved') + '</div><p class="fin-sub">Original quality — exactly as uploaded, on the same link the client reviewed.</p><div class="card list">' + approved.map(function (f) {
          return '<div class="row">' + thumb(f.thumb, 'film') + '<span class="grow"><b>' + esc(f.name) + '</b><small>Approved by ' + esc(f.approvedBy || client(p.client).contact) + ' · v' + (f.approvedV || f.version) + ' · ' + esc(f.size) + '</small></span><button class="dl" data-act="download" data-id="' + f.id + '" aria-label="Download ' + esc(f.name) + '">' + ic('down') + '</button></div>';
        }).join('') + '</div><button class="btn btn-primary" style="width:100%;margin-top:12px" data-act="download-all">' + ic('down') + 'Download all · ' + approved.length + ' file' + (approved.length === 1 ? '' : 's') + '</button>';
      }
    }
    return h;
  }

  function taskList(tasks, pid) { return '<div class="card list">' + taskRows(tasks, pid) + '</div>'; }

  function vTasks() {
    var ids = projects().map(function (p) { return p.id; });
    var ts = S.tasks.filter(function (t) { return ids.indexOf(t.project) > -1; });
    return '<div class="view-head"><h1>Tasks</h1><small>' + ts.filter(function (t) { return !t.done; }).length + ' open</small></div>' + (ids.length ? taskList(ts, '') : emptyProjects());
  }

  function vInReview() {
    var groups = { changes: [], review: [] };
    projects().forEach(function (p) { p.files.forEach(function (f) { if (groups[f.status]) groups[f.status].push([p, f]); }); });
    function block(title, list, note) {
      if (!list.length) return '';
      return '<div class="sub-h" style="margin-top:18px">' + title + ' <small>' + list.length + '</small></div><div class="card list">' + list.map(function (x) {
        var p = x[0], f = x[1], n = f.comments.filter(function (c) { return !c.resolvedIn && c.role === 'Client'; }).length;
        return '<button class="row" data-go="f/' + p.id + '/' + f.id + '">' + thumb(f.thumb, 'film') + '<span class="grow"><b>' + esc(f.name) + '</b><small>' + esc(p.name) + ' · v' + f.version + (n ? ' · ' + n + ' open note' + (n === 1 ? '' : 's') : '') + '</small></span>' + pill(f.status) + '</button>';
      }).join('') + '</div>';
    }
    var h = '<div class="view-head"><h1>In review</h1></div>';
    if (!groups.changes.length && !groups.review.length) return h + '<div class="empty"><b>Nothing is in review</b>Share a file for review and it shows up here.</div>';
    return h + block('Changes requested — needs you', groups.changes) + block('Waiting on client', groups.review);
  }

  /* ---------- review ---------- */
  function segAt(f, t) {
    var acc = 0;
    for (var i = 0; i < f.segs.length; i++) { acc += f.segs[i].len; if (t < acc) return i; }
    return Math.max(0, f.segs.length - 1);
  }
  function shown(f) { return f.comments.filter(function (c) { return c.v === ui.sel || c.resolvedIn === ui.sel; }); }

  function vReview(p, f) {
    if (!p || !f) return '<div class="rv-main"><div class="empty"><b>File not found</b><button class="btn btn-ghost btn-sm" data-go="projects">Back to projects</button></div></div>';
    var c = client(p.client), isVid = f.kind === 'video', blob = blobs[f.id] && ui.sel === f.version ? blobs[f.id] : '';
    var vers = '';
    for (var i = 1; i <= f.version; i++) vers += '<button class="' + (i === ui.sel ? 'on' : '') + '" data-act="ver" data-id="' + i + '">v' + i + '</button>';
    var seg = f.segs[segAt(f, ui.t)], still = seg ? seg.img : f.thumb;
    var h = '<div class="rv-layout"><div class="rv-main"><div class="rv-bar"><div class="seg" role="group" aria-label="Versions">' + vers + '</div>' + (ui.sel !== f.version ? '<small>Older version. Latest is v' + f.version + '</small>' : '') + '<span class="sp"></span>' + pill(f.status) + '</div>';
    h += '<div class="player' + (ui.playing ? ' playing' : '') + '" id="player">';
    if (blob && isVid) h += '<video id="pvid" src="' + blob + '" playsinline preload="auto" style="width:100%;height:100%;object-fit:contain"></video>';
    else h += still ? '<img id="pimg" src="' + src(blob || still) + '" alt="' + esc(f.name) + '">' : '<span class="ph">' + ic(isVid ? 'film' : 'file') + '</span>';
    if (isVid) h += '<button class="big-play" data-act="play" aria-label="Play or pause"><span>' + ic('play') + '</span></button>';
    h += '</div>';
    if (isVid) {
      h += '<div class="transport"><button class="play-btn" data-act="play" id="pbtn" aria-label="Play or pause">' + ic(ui.playing ? 'pause' : 'play') + '</button><span class="time" id="ptime">' + tc(ui.t) + '</span>' +
        '<div class="scrub" id="scrub" role="slider" aria-label="Timeline" aria-valuemin="0" aria-valuemax="' + Math.round(f.dur) + '" aria-valuenow="' + Math.round(ui.t) + '" tabindex="0"><span class="wave"></span><span class="fillw" id="pfill"></span>' +
        shown(f).filter(function (x) { return x.t != null; }).map(function (x) { return '<span class="mk' + (x.role !== 'Client' ? ' a' : '') + (x.resolvedIn ? ' ok' : '') + '" style="left:' + (x.t / (f.dur || 1) * 100) + '%"></span>'; }).join('') +
        '<span class="pin" id="ppin"></span></div><span class="time">' + tc(f.dur) + '</span></div>';
      if (!blob && f.segs.length > 1) {
        h += '<div class="strip" id="strip">' + f.segs.map(function (s, k) {
          var start = f.segs.slice(0, k).reduce(function (a, b) { return a + b.len; }, 0);
          return '<button style="flex:' + s.len + '" data-act="seek" data-id="' + start + '"' + (k === segAt(f, ui.t) ? ' class="on"' : '') + '><img src="' + src(s.img) + '" alt=""><span>' + esc(s.label) + ' · ' + s.len + 's</span></button>';
        }).join('') + '</div>';
      }
    }
    h += '</div>';

    // feedback panel
    var list = shown(f).slice().sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    h += '<aside class="fb"><div class="fb-head">Feedback <span>v' + ui.sel + '</span></div>' +
      '<div class="fb-as"><span>Viewing as</span><div class="seg txt"><button class="' + (ui.as === 'team' ? 'on' : '') + '" data-act="as" data-id="team">' + ME + ' · Team</button><button class="' + (ui.as === 'client' ? 'on' : '') + '" data-act="as" data-id="client">' + esc(c.contact) + ' · Client</button></div></div>';
    h += '<div class="fb-list" id="fblist">' + (list.length ? list.map(function (x) {
      return '<button class="cm' + (ui.hot === x.id ? ' hot' : '') + '" data-act="jump" data-id="' + x.id + '"><header>' + av(x.who, true) + esc(x.who) + ' <em>· ' + esc(x.role) + '</em>' + (x.t != null ? '<span class="tc">' + tc(x.t) + '</span>' : '') + '</header>' + esc(x.text) +
        (x.resolvedIn ? '<div class="ok">' + ic('check') + 'Resolved in v' + x.resolvedIn + (x.v !== ui.sel ? ' <span class="vtag">· from v' + x.v + '</span>' : '') + '</div>' : '') + '</button>';
    }).join('') : '<div class="fb-empty">No comments on v' + ui.sel + ' yet.<br>' + (isVid ? 'Pause on a frame and write the note.' : 'Write the first note.') + '</div>') + '</div>';
    h += '<div class="fb-foot">';
    if (f.status === 'approved') h += '<div class="banner approved">' + ic('check') + 'Approved by ' + esc(f.approvedBy || c.contact) + ' · v' + (f.approvedV || f.version) + '</div>';
    if (f.status === 'changes' && ui.as === 'team') h += '<div class="banner changes">' + ic('alert') + esc(c.contact) + ' requested changes on v' + f.version + '</div>';
    if (ui.sel === f.version) {
      h += '<form class="cbox" data-form="comment"><input name="text" id="cinput" autocomplete="off" placeholder="' + (isVid ? 'Comment at ' + tc(ui.t) + '…' : 'Write a comment…') + '" aria-label="Comment"><button type="submit" aria-label="Send comment">' + ic('send') + '</button></form>';
      if (ui.as === 'client' && f.status !== 'approved') h += '<div class="two"><button class="btn btn-danger btn-sm" data-act="request">Request changes</button><button class="btn btn-green btn-sm" data-act="approve">' + ic('check') + 'Approve</button></div>';
      if (ui.as === 'team' && f.status === 'approved') h += '<button class="btn btn-primary btn-sm" data-go="p/' + p.id + '/delivery">' + ic('down') + 'Open delivery</button>';
    }
    h += '</div></aside></div>';

    if (ui.share) {
      h += '<div class="pop" id="pop"><h4>Share for review <small>v' + f.version + '</small></h4><div class="linkbox">' + ic('link') + '<span id="rlink">deskspace.app/r/' + slug(f.name) + '-v' + f.version + '</span><button data-act="copy" aria-label="Copy link">' + ic('copy') + '</button></div>' +
        '<div class="who">' + av(c.contact) + '<span><b>' + esc(c.contact) + '</b><small>' + esc(c.name) + ' · can comment and approve</small></span></div>' +
        '<div class="opt"><span>Download after approval</span><button class="switch' + (ui.shareDl ? ' on' : '') + '" data-act="share-dl" role="switch" aria-checked="' + ui.shareDl + '" aria-label="Download after approval"></button></div>' +
        '<button class="btn btn-primary btn-sm" data-act="send-link">' + ic('send') + 'Send link to ' + esc(c.contact) + '</button></div>';
    }
    return h;
  }

  function curFile() { var r = route(); if (r.v !== 'f') return null; var p = project(r.a), f = fileOf(p, r.b); return f ? { p: p, f: f } : null; }

  function paint() {
    var cur = curFile(); if (!cur) return;
    var f = cur.f, d = f.dur || 1, pct = Math.min(100, ui.t / d * 100);
    var el;
    if ((el = $('#ptime'))) el.textContent = tc(ui.t);
    if ((el = $('#pfill'))) el.style.width = pct + '%';
    if ((el = $('#ppin'))) el.style.left = pct + '%';
    if ((el = $('#scrub'))) el.setAttribute('aria-valuenow', Math.round(ui.t));
    if ((el = $('#player'))) el.classList.toggle('playing', ui.playing);
    if ((el = $('#pbtn'))) el.innerHTML = ic(ui.playing ? 'pause' : 'play');
    if ((el = $('#cinput')) && f.kind === 'video') el.placeholder = 'Comment at ' + tc(ui.t) + '…';
    var k = segAt(f, ui.t), img = $('#pimg');
    if (img && f.segs[k] && !blobs[f.id]) { var want = src(f.segs[k].img); if (img.getAttribute('src') !== want) img.setAttribute('src', want); }
    var strip = $('#strip');
    if (strip) [].forEach.call(strip.children, function (b, i) { b.classList.toggle('on', i === k); });
  }
  function seek(t) {
    var cur = curFile(); if (!cur) return;
    ui.t = Math.max(0, Math.min(cur.f.dur || 0, t));
    var v = $('#pvid'); if (v) { try { v.currentTime = ui.t; } catch (e) { /* not ready */ } }
    paint();
  }
  function setPlaying(on) {
    var cur = curFile(); clearInterval(tick); tick = null;
    if (!cur || cur.f.kind !== 'video') { ui.playing = false; return; }
    var f = cur.f, v = $('#pvid');
    ui.playing = on;
    if (v) { if (on) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { ui.playing = false; paint(); }); } else v.pause(); }
    else if (on) {
      if (ui.t >= f.dur - 0.05) ui.t = 0;
      tick = setInterval(function () {
        ui.t += 0.1;
        if (ui.t >= f.dur) { ui.t = f.dur; setPlaying(false); }
        paint();
      }, 100);
    }
    paint();
  }
  function bindReview() {
    var cur = curFile(); if (!cur) return;
    var v = $('#pvid');
    if (v) {
      v.addEventListener('loadedmetadata', function () {
        if (isFinite(v.duration) && Math.abs(v.duration - cur.f.dur) > 0.5) { cur.f.dur = v.duration; save(); renderView(); return; }
        try { v.currentTime = ui.t; } catch (e) { /* ignore */ }
      });
      v.addEventListener('timeupdate', function () { ui.t = v.currentTime; paint(); });
      v.addEventListener('ended', function () { ui.playing = false; paint(); });
    }
    var sc = $('#scrub');
    if (sc) {
      var drag = false;
      var at = function (e) { var b = sc.getBoundingClientRect(); seek((e.clientX - b.left) / b.width * (cur.f.dur || 0)); };
      sc.addEventListener('pointerdown', function (e) { drag = true; sc.setPointerCapture(e.pointerId); at(e); });
      sc.addEventListener('pointermove', function (e) { if (drag) at(e); });
      sc.addEventListener('pointerup', function () { drag = false; });
      sc.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { seek(ui.t + 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { seek(ui.t - 1); e.preventDefault(); }
      });
    }
    paint();
  }

  /* ---------- render ---------- */
  function renderView() {
    var r = route(), view = $('#view'), h;
    clearInterval(tick); tick = null;
    view.classList.toggle('flush', r.v === 'f');
    if (r.v === 'f') {
      var p = project(r.a), f = fileOf(p, r.b), key = r.a + '/' + r.b;
      if (f && lastFile !== key) { lastFile = key; ui.t = 0; ui.sel = f.version; ui.hot = ''; ui.share = false; }
      if (f && (ui.sel < 1 || ui.sel > f.version)) ui.sel = f.version;
      ui.playing = false;
      h = vReview(p, f);
    } else {
      lastFile = ''; ui.playing = false; ui.share = false;
      if (r.v === 'home') h = vHome();
      else if (r.v === 'projects') h = vProjects('');
      else if (r.v === 'c') h = vProjects(r.a);
      else if (r.v === 'p') h = vProject(project(r.a), r.b);
      else if (r.v === 'review') h = vInReview();
      else if (r.v === 'tasks') h = vTasks();
      else if (r.v === 'activity') h = vActivity();
      else if (r.v === 'plans') h = vPlans();
      else if (r.v === 'account') h = vAccount();
      else h = vHome();
    }
    view.innerHTML = h;
    if (r.v === 'f') bindReview();
    if (r.v === 'p') bindDrop();
  }
  function renderModal() {
    var m = ui.modal, h = '';
    if (m === 'project') {
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="project" role="dialog" aria-modal="true" aria-label="New project"><h3>New project</h3><label for="np-name">Project name</label><input class="input" id="np-name" name="name" required placeholder="e.g. Autumn Reels" autocomplete="off">' +
        '<label for="np-client">Client</label><input class="input" id="np-client" name="client" required list="np-clients" placeholder="Client name" autocomplete="off"><datalist id="np-clients">' + clients().map(function (c) { return '<option value="' + esc(c.name) + '">'; }).join('') + '</datalist>' +
        '<div class="foot"><button class="btn btn-ghost btn-sm" type="button" data-act="close-modal" data-force="1">Cancel</button><button class="btn btn-primary btn-sm" type="submit">Create project</button></div></form></div>';
    } else if (m === 'folder') {
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="folder" role="dialog" aria-modal="true" aria-label="New folder"><h3>New folder</h3><label for="nf-name">Folder name</label><input class="input" id="nf-name" name="name" required placeholder="e.g. Audio" autocomplete="off">' +
        '<div class="foot"><button class="btn btn-ghost btn-sm" type="button" data-act="close-modal" data-force="1">Cancel</button><button class="btn btn-primary btn-sm" type="submit">Create folder</button></div></form></div>';
    } else if (m === 'version') {
      var cur = curFile();
      if (cur) h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="version" role="dialog" aria-modal="true" aria-label="New version"><h3>Upload v' + (cur.f.version + 1) + ' of ' + esc(cur.f.name) + '</h3><label for="nv-file">File (optional in this demo)</label><input class="input" style="padding-top:8px" id="nv-file" name="file" type="file">' +
        '<label for="nv-note">What changed?</label><input class="input" id="nv-note" name="note" placeholder="e.g. Trimmed 5 s — the intro now ends at 00:07." autocomplete="off">' +
        '<div class="foot"><button class="btn btn-ghost btn-sm" type="button" data-act="close-modal" data-force="1">Cancel</button><button class="btn btn-primary btn-sm" type="submit">Upload version</button></div></form></div>';
    }
    $('#layer').innerHTML = h;
    var first = $('#layer input:not([type=file])'); if (first) first.focus();
  }
  function render() { renderSide(); renderTop(); renderView(); renderModal(); }

  /* ---------- uploads ---------- */
  function makeThumb(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), done = false;
      function finish(el, w, h, dur) {
        if (done) return; done = true;
        var out = { url: url, thumb: '', dur: dur || 0 };
        try {
          var c = document.createElement('canvas'), s = Math.min(1, 480 / (w || 480));
          c.width = Math.round((w || 480) * s); c.height = Math.round((h || 270) * s);
          c.getContext('2d').drawImage(el, 0, 0, c.width, c.height);
          out.thumb = c.toDataURL('image/jpeg', 0.7);
        } catch (e) { /* no preview */ }
        resolve(out);
      }
      function fail() { if (!done) { done = true; resolve({ url: url, thumb: '', dur: 0 }); } }
      if (file.type.indexOf('image/') === 0) {
        var img = new Image();
        img.onload = function () { finish(img, img.naturalWidth, img.naturalHeight, 0); };
        img.onerror = fail; img.src = url;
      } else if (file.type.indexOf('video/') === 0) {
        var v = document.createElement('video');
        v.muted = true; v.preload = 'auto'; v.playsInline = true;
        v.onloadeddata = function () { try { v.currentTime = Math.min(1, (v.duration || 2) / 3); } catch (e) { fail(); } };
        v.onseeked = function () { finish(v, v.videoWidth, v.videoHeight, v.duration); };
        v.onerror = fail; v.src = url;
        setTimeout(fail, 5000);
      } else fail();
    });
  }
  function kindOf(file) { return file.type.indexOf('video/') === 0 ? 'video' : file.type.indexOf('image/') === 0 ? 'image' : 'doc'; }

  function addFiles(list) {
    var r = route(), p = project(r.a);
    if (!p || !list || !list.length) return;
    var files = [].slice.call(list);
    Promise.all(files.map(makeThumb)).then(function (res) {
      files.forEach(function (file, i) {
        var id = 'u' + uid(), kind = kindOf(file);
        blobs[id] = res[i].url;
        p.files.unshift({ id: id, name: file.name, kind: kind, folder: ui.folder || foldersOf(p)[0] || 'Files', size: fmtSize(file.size), dur: kind === 'video' ? (res[i].dur || 0) : 0, version: 1, status: 'draft', thumb: res[i].thumb, segs: [], comments: [] });
        if (!p.cover && res[i].thumb) p.cover = res[i].thumb;
        log(ME, 'uploaded ' + file.name);
      });
      save(); render();
      toast(files.length === 1 ? files[0].name + ' added' : files.length + ' files added');
    });
  }
  function bindDrop() {
    var view = $('#view'), drop = $('#drop');
    if (!drop) return;
    view.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    view.ondragleave = function (e) { if (e.target === view || !view.contains(e.relatedTarget)) drop.classList.remove('over'); };
    view.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); };
  }

  /* ---------- actions ---------- */
  function act(name, id, el, ev) {
    var cur = curFile(), f = cur && cur.f, p = cur && cur.p, c = p && client(p.client);
    switch (name) {
      case 'collapse': S.collapsed = !S.collapsed; save(); renderSide(); break;
      case 'drawer': $('#app').classList.toggle('drawer'); break;
      case 'ws-toggle': ui.wsOpen = !ui.wsOpen; ui.acct = false; renderSide(); break;
      case 'acct-toggle': ui.acct = !ui.acct; ui.wsOpen = false; renderSide(); break;
      case 'logout': try { localStorage.removeItem(USER_KEY); } catch (e) { /* ignore */ } location.href = 'login.html'; break;
      case 'ws-set': S.ws = id; ui.wsOpen = false; ui.q = ''; save(); go('home'); break;
      case 'reset':
        ui.acct = false; renderSide();
        if (confirm('Reset the demo? Everything you added in this browser will be removed.')) { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } S = seed(); ui.q = ''; go('home'); }
        break;
      case 'new-project': ui.modal = 'project'; renderModal(); break;
      case 'new-folder': ui.modal = 'folder'; renderModal(); break;
      case 'note-del': S.notes = S.notes.filter(function (n) { return n.id !== id; }); save(); renderView(); break;
      case 'plan-set':
        if (id !== S.plan) { S.plan = id; save(); render(); toast('You are now on the ' + plan().name + ' plan (demo, nothing is charged)'); }
        break;
      case 'new-version': ui.modal = 'version'; ui.share = false; renderModal(); break;
      case 'close-modal': if (ev.target === el || el.getAttribute('data-force')) { ui.modal = null; renderModal(); } break;
      case 'upload': $('#picker').click(); break;
      case 'folder': ui.folder = id; renderView(); break;
      case 'task':
        S.tasks.forEach(function (t) { if (t.id === id) t.done = !t.done; }); save(); renderSide(); renderView(); break;
      case 'download': el.classList.add('done'); el.innerHTML = ic('check'); toast('Demo: the real app downloads the original file'); break;
      case 'download-all': toast('Demo: the real app downloads every approved file'); break;
      case 'play': setPlaying(!ui.playing); break;
      case 'seek': setPlaying(false); seek(parseFloat(id)); break;
      case 'ver': ui.sel = parseInt(id, 10); ui.hot = ''; renderView(); break;
      case 'as': ui.as = id; ui.share = false; renderTop(); renderView(); break;
      case 'jump':
        var cm = f && f.comments.filter(function (x) { return x.id === id; })[0];
        if (cm) { setPlaying(false); ui.hot = id; if (cm.t != null) seek(cm.t); [].forEach.call(document.querySelectorAll('.fb .cm'), function (b) { b.classList.toggle('hot', b.getAttribute('data-id') === id); }); }
        break;
      case 'share-toggle': ui.share = !ui.share; renderView(); break;
      case 'share-dl': ui.shareDl = !ui.shareDl; el.classList.toggle('on', ui.shareDl); el.setAttribute('aria-checked', ui.shareDl); break;
      case 'copy':
        var link = 'https://' + $('#rlink').textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(function () { toast('Link copied'); }, function () { toast('Copy the link from the box'); });
        else toast('Copy the link from the box');
        break;
      case 'send-link':
        if (f.status !== 'approved') f.status = 'review';
        ui.share = false; log(ME, 'sent ' + f.name + ' v' + f.version + ' to ' + c.contact + ' for review'); save(); render(); toast('Link sent to ' + c.contact); break;
      case 'approve':
        f.status = 'approved'; f.approvedV = f.version; f.approvedBy = c.contact;
        log(c.contact, 'approved ' + f.name + ' v' + f.version); save(); render(); toast('v' + f.version + ' approved — ready to deliver'); break;
      case 'request':
        var notes = f.comments.filter(function (x) { return x.role === 'Client' && x.v === f.version && !x.resolvedIn; }).length;
        if (!notes) { toast('Add a comment first so the team knows what to change'); var ci = $('#cinput'); if (ci) ci.focus(); break; }
        f.status = 'changes'; log(c.contact, 'requested changes on ' + f.name); save(); render(); toast('Changes requested on v' + f.version); break;
    }
  }

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); $('#app').classList.remove('drawer'); ui.wsOpen = false; ui.acct = false; ui.folder = g.getAttribute('data-go').indexOf('p/') === 0 ? ui.folder : ''; go(g.getAttribute('data-go')); return; }
    var a = e.target.closest('[data-act]');
    if (a) { act(a.getAttribute('data-act'), a.getAttribute('data-id'), a, e); return; }
    if (ui.wsOpen && !e.target.closest('.ws')) { ui.wsOpen = false; renderSide(); }
    if (ui.acct && !e.target.closest('.acct')) { ui.acct = false; renderSide(); }
    if (ui.share && !e.target.closest('#pop')) { ui.share = false; renderView(); }
    if (e.target.id === 'app' || (e.target.closest('.main') && $('#app').classList.contains('drawer'))) $('#app').classList.remove('drawer');
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-form]'); if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form'), cur = curFile();
    if (kind === 'task') {
      var text = form.elements.text.value.trim(); if (!text) return;
      var pid = form.getAttribute('data-pid') || (projects()[0] && projects()[0].id);
      if (!pid) { toast('Create a project first'); return; }
      S.tasks.push({ id: 't' + uid(), text: text, project: pid, done: false }); save(); renderSide(); renderView();
      var again = $('[data-form=task] input'); if (again) again.focus();
    } else if (kind === 'comment' && cur) {
      var body = form.elements.text.value.trim(); if (!body) return;
      var c = client(cur.p.client), isClient = ui.as === 'client', id = 'c' + uid();
      setPlaying(false);
      cur.f.comments.push({ id: id, who: isClient ? c.contact : ME, role: isClient ? 'Client' : 'Editor', t: cur.f.kind === 'video' ? Math.floor(ui.t) : null, v: cur.f.version, text: body });
      ui.hot = id; log(isClient ? c.contact : ME, 'commented on ' + cur.f.name + (cur.f.kind === 'video' ? ' at ' + tc(ui.t) : ''));
      save(); renderSide(); renderView();
    } else if (kind === 'note') {
      var nt = form.elements.text.value.trim(); if (!nt) return;
      S.notes.unshift({ id: 'n' + uid(), text: nt, project: form.getAttribute('data-pid') || '', ws: S.ws, when: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
      save(); renderView();
      var nin = $('[data-form=note] input'); if (nin) nin.focus();
    } else if (kind === 'folder') {
      var fp = project(route().a), fn = form.elements.name.value.trim(); if (!fp || !fn) return;
      var fl = foldersOf(fp);
      if (fl.some(function (x) { return x.toLowerCase() === fn.toLowerCase(); })) { toast('That folder already exists'); return; }
      fl.push(fn); ui.folder = fn; ui.modal = null; save(); render(); toast('Folder “' + fn + '” created');
    } else if (kind === 'profile') {
      var nm = form.elements.name.value.trim(), em = form.elements.email.value.trim();
      if (!nm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast('Enter a name and a valid email'); return; }
      USER.name = nm; USER.email = em; ME = nm.split(' ')[0];
      try { localStorage.setItem(USER_KEY, JSON.stringify(USER)); } catch (err) { /* ignore */ }
      render(); toast('Profile saved');
    } else if (kind === 'project') {
      var name = form.elements.name.value.trim(), cname = form.elements.client.value.trim(); if (!name || !cname) return;
      var cl = clients().filter(function (x) { return x.name.toLowerCase() === cname.toLowerCase(); })[0];
      if (!cl) { cl = { id: slug(cname) + '-' + uid(), ws: S.ws, name: cname, contact: 'Client', color: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6'][S.clients.length % 6] }; S.clients.push(cl); }
      var np = { id: slug(name) + '-' + uid(), ws: S.ws, name: name, client: cl.id, due: '', cover: '', folders: ['Cuts', 'Selects', 'Delivery'], files: [] };
      S.projects.unshift(np); log(ME, 'created the project ' + name); ui.modal = null; save(); go('p/' + np.id);
    } else if (kind === 'version' && cur) {
      var f = cur.f, note = form.elements.note.value.trim(), file = form.elements.file.files[0];
      var apply = function (res) {
        f.version += 1;
        f.comments.forEach(function (x) { if (x.role === 'Client' && !x.resolvedIn) x.resolvedIn = f.version; });
        if (note) f.comments.push({ id: 'c' + uid(), who: ME, role: 'Editor', t: f.kind === 'video' ? 0 : null, v: f.version, text: note });
        if (res) { blobs[f.id] = res.url; if (res.thumb) f.thumb = res.thumb; if (res.dur) f.dur = res.dur; f.segs = []; f.size = fmtSize(file.size); }
        if (f.status !== 'draft') f.status = 'review';
        delete f.approvedV; delete f.approvedBy;
        ui.sel = f.version; ui.t = 0; ui.modal = null;
        log(ME, 'uploaded v' + f.version + ' of ' + f.name); save(); render();
        toast('v' + f.version + ' is up' + (f.status === 'review' ? ' — on the same review link' : ''));
      };
      if (file) makeThumb(file).then(apply); else apply(null);
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { ui.q = e.target.value; renderView(); }
  });
  $('#picker').addEventListener('change', function () { addFiles(this.files); this.value = ''; });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (ui.modal) { ui.modal = null; renderModal(); }
      else if (ui.share) { ui.share = false; renderView(); }
      else if (ui.wsOpen || ui.acct) { ui.wsOpen = false; ui.acct = false; renderSide(); }
    }
    if (e.key === ' ' && curFile() && !/INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName)) { e.preventDefault(); setPlaying(!ui.playing); }
  });
  function enter() { var v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
  addEventListener('hashchange', function () { ui.modal = null; render(); $('#view').scrollTop = 0; enter(); });

  render();
  enter();
})();
