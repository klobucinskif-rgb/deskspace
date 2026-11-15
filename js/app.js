/* Deskspace — demo app. All data lives in this browser (localStorage). */
(function () {
  'use strict';

  var KEY = 'deskspace-demo-v6', USER_KEY = 'deskspace-user';
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
  function photoOf(name) {
    if (name === ME) return USER.photo || '';
    var w = S && S.workspaces && ws(), m = w && (w.members || []).filter(function (x) { return !x.me && x.name === name; })[0];
    return (m && m.photo) || '';
  }
  function av(name, sm, cls) {
    var ph = photoOf(name);
    return '<span class="av' + (sm ? ' sm' : '') + (cls ? ' ' + cls : '') + avClass(name) + (ph ? ' has-photo' : '') + '">' + (ph ? '<img src="' + ph + '" alt="">' : esc(name.charAt(0).toUpperCase())) + '</span>';
  }

  var ICON = {
    home: '<path d="M4 11l8-6.5 8 6.5v8a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    review: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    notes: '<path d="M6.5 3.5h8l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M14.5 3.5V8H19M8.5 12.5h7M8.5 16h5"/>',
    inbox: '<path d="M3.5 13.5l2.6-7.2A2 2 0 0 1 8 5h8a2 2 0 0 1 1.9 1.3l2.6 7.2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clip: '<path d="M20.5 11.5l-8.2 8.2a5.2 5.2 0 0 1-7.4-7.4l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a1.8 1.8 0 0 1-2.5-2.5l7.8-7.8"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.6a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17.5" cy="9.5" r="2.4"/><path d="M16.5 14.6c2.4.2 4 1.7 4.5 4.4"/>',
    camera: '<path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
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

  var SEARCH_BTN = '<button class="icon-btn top-ic" data-act="search" title="Search (Ctrl K)" aria-label="Search">' + ic('search') + '</button>';
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
  function wsSub(w) { var k = (w.members || []).length; return plan().name + ' · ' + k + (k === 1 ? ' person' : ' people'); }
  function foldersOf(p) {
    if (!p.folders) p.folders = [];
    p.files.forEach(function (f) { if (f.folder && p.folders.indexOf(f.folder) < 0) p.folders.push(f.folder); });
    return p.folders;
  }

  function pill(s) { return '<span class="pill ' + s + '">' + STATUS[s] + '</span>'; }

  /* ---------- seed data ---------- */
  function seed() {
    return {
      ws: 'halden', collapsed: false, plan: 'team', seenAt: ts(-1, 12, 0),
      notes: [
        { id: 'n1', ws: 'halden', project: 'northline-campaign', title: 'Frames for the 9x16 cut', date: dayOffset(0), created: ts(-1, 9, 40), entries: [
          { id: 'e1', who: ME, at: ts(-1, 9, 40), text: 'Maren wants the vertical version first. These two frames hold up best in 9x16.', media: [{ id: 'm1', kind: 'image', src: 'social', name: 'social_frame.jpg' }, { id: 'm2', kind: 'image', src: 'walk-close', name: 'walk_close.jpg' }] },
          { id: 'e2', who: 'Leo', at: ts(-1, 10, 5), text: 'Agreed. The bridge shot crops well too if we keep her on the right.', media: [{ id: 'm3', kind: 'image', src: 'bridge-arm', name: 'bridge.jpg' }] },
          { id: 'e3', who: ME, at: ts(0, 9, 12), text: 'Here is the full reveal for reference.', media: [{ id: 'm4', kind: 'video', src: 'media/deskspace-reveal.mp4', thumb: 'poster', dur: 50, name: 'deskspace-reveal.mp4' }] }
        ] },
        { id: 'n2', ws: 'halden', project: 'lookbook-01', title: 'Colour references', date: dayOffset(-1), created: ts(-2, 16, 20), entries: [
          { id: 'e4', who: 'Sam', at: ts(-2, 16, 20), text: 'Warm reds against a cool background, like these.', media: [{ id: 'm5', kind: 'image', src: 'lookbook', name: 'lookbook.jpg' }, { id: 'm6', kind: 'image', src: 'spring', name: 'spring.jpg' }, { id: 'm7', kind: 'image', src: 'teaser', name: 'teaser.jpg' }] }
        ] },
        { id: 'n3', ws: 'halden', project: '', title: 'Client preferences', date: dayOffset(-1), created: ts(-1, 18, 2), entries: [
          { id: 'e5', who: ME, at: ts(-1, 18, 2), text: 'Maren prefers the shorter intro. Keep every cut under 45 seconds.', media: [] },
          { id: 'e6', who: ME, at: ts(-1, 18, 4), text: 'Jo signs off on colour only after seeing it on a phone.', media: [] }
        ] },
        { id: 'n4', ws: 'halden', project: '', title: 'Ask Jo for the final logo', date: dayOffset(2), created: ts(-2, 11, 30), entries: [
          { id: 'e7', who: ME, at: ts(-2, 11, 30), text: 'Ask Jo for the final Atelier logo before the Lookbook export.', media: [] }
        ] }
      ],
      workspaces: [
        { id: 'halden', name: 'Halden Studio', letter: 'H', code: 'HLD-7K2-Q9X', usedGb: 1240, members: [
          { id: 'u-me', me: true, name: ME, full: USER.name, email: USER.email, role: 'Owner', job: 'Producer. Runs the client projects and signs off deliveries.' },
          { id: 'u-leo', name: 'Leo', full: 'Leo Brandt', email: 'leo@haldenstudio.co', role: 'Admin', job: 'Lead editor. Cuts the films and manages versions.' },
          { id: 'u-sam', name: 'Sam', full: 'Sam Okafor', email: 'sam@haldenstudio.co', role: 'Editor', job: 'Colourist and finishing.' },
          { id: 'u-mira', name: 'Mira', full: 'Mira Kos', email: 'mira@haldenstudio.co', role: 'Editor', job: 'Motion design and titles.' }
        ] },
        { id: 'films', name: 'Halden Films', letter: 'F', cls: 'f', code: 'FLM-4PZ-8RT', usedGb: 160, members: [
          { id: 'u-me', me: true, name: ME, full: USER.name, email: USER.email, role: 'Owner', job: 'Producer.' },
          { id: 'u-leo', name: 'Leo', full: 'Leo Brandt', email: 'leo@haldenstudio.co', role: 'Admin', job: 'Lead editor.' },
          { id: 'u-kai', name: 'Kai', full: 'Kai Lund', email: 'kai@haldenstudio.co', role: 'Editor', job: 'Assistant editor.' }
        ] }
      ],
      clients: [
        { id: 'northline', ws: 'halden', name: 'Northline', contact: 'Maren', color: '#4f9ce8' },
        { id: 'north', ws: 'halden', name: 'North Studio', contact: 'Noor', color: '#6c7fd8' },
        { id: 'atelier', ws: 'halden', name: 'Atelier Journal', contact: 'Jo', color: '#3db389' },
        { id: 'forma', ws: 'halden', name: 'Forma', contact: 'Elif', color: '#e3a43a' }
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
        ] },
        { id: 'northline-reels', ws: 'halden', name: 'Northline — Reels pack', client: 'northline', due: 'Thu 20 Nov', cover: 'social', folders: ['Cuts', 'Delivery'], files: [
          { id: 'nr-1', name: 'Northline_Reel_01.mp4', kind: 'video', folder: 'Delivery', size: '84 MB', dur: 22, version: 2, status: 'approved', approvedV: 2, approvedBy: 'Maren', thumb: 'social',
            segs: [{ label: 'Reel 01', len: 22, img: 'walk-close' }], comments: [] },
          { id: 'nr-2', name: 'Northline_Reel_02.mp4', kind: 'video', folder: 'Cuts', size: '91 MB', dur: 24, version: 1, status: 'review', thumb: 'bridge-arm',
            segs: [{ label: 'Reel 02', len: 24, img: 'bridge-arm' }], comments: [{ id: 'c6', who: ME, role: 'Editor', t: 3, v: 1, text: 'First cut of Reel 02 with the new hook.' }] },
          { id: 'nr-3', name: 'Northline_Reel_03.mp4', kind: 'video', folder: 'Cuts', size: '88 MB', dur: 21, version: 1, status: 'draft', thumb: 'teaser',
            segs: [{ label: 'Reel 03', len: 21, img: 'walk' }], comments: [] }
        ] },
        { id: 'atelier-portraits', ws: 'halden', name: 'Atelier — Portrait series', client: 'atelier', due: 'Tue 25 Nov', cover: 'portrait', folders: ['Selects', 'Delivery'], files: [
          { id: 'ap-1', name: 'Atelier_Portrait_01.jpg', kind: 'image', folder: 'Selects', size: '22 MB', dur: 0, version: 2, status: 'approved', approvedV: 2, approvedBy: 'Jo', thumb: 'portrait', segs: [], comments: [] },
          { id: 'ap-2', name: 'Atelier_Portrait_02.jpg', kind: 'image', folder: 'Selects', size: '19 MB', dur: 0, version: 1, status: 'draft', thumb: 'crew', segs: [], comments: [] }
        ] }
      ],
      tasks: [
        { id: 't1', text: 'Send v3 of the campaign film to Maren', project: 'northline-campaign', ws: 'halden', due: dayOffset(-2), done: true, doneAt: ts(-2, 17, 0) },
        { id: 't2', text: 'Recut the BTS pause at 00:21', project: 'northline-campaign', ws: 'halden', due: dayOffset(0), done: false },
        { id: 't3', text: 'Export 9x16 teaser for social', project: 'northline-campaign', ws: 'halden', due: dayOffset(1), done: false },
        { id: 't4', text: 'Apply Jo\'s two notes on Lookbook 01', project: 'lookbook-01', ws: 'halden', due: dayOffset(-1), done: false },
        { id: 't5', text: 'Follow up with North Studio on the teaser', project: 'spring-teaser', ws: 'halden', due: '', done: false },
        { id: 't6', text: 'Renew the stock music licence', project: '', ws: 'halden', due: dayOffset(3), done: false },
        { id: 't7', text: 'Back up last month\'s raw footage', project: '', ws: 'halden', due: '', done: false }
      ],
      chats: [
        { id: 'team-halden', ws: 'halden', kind: 'team', entries: [
          { id: 'c-1', who: 'Leo', at: ts(-1, 9, 2), text: 'Morning! v3 of Northline is up for Maren.', media: [] },
          { id: 'c-2', who: 'Sam', at: ts(-1, 9, 20), text: 'Grade on the bridge scene, before and after:', media: [{ id: 'cm1', kind: 'image', src: 'bridge-wide', name: 'before.jpg' }, { id: 'cm2', kind: 'image', src: 'bridge-arm', name: 'after.jpg' }] },
          { id: 'c-3', who: ME, at: ts(-1, 11, 45), text: 'Looks great. Sharing the vertical frames note so everyone has it.', media: [], noteRef: 'n1' },
          { id: 'c-4', who: 'Mira', at: ts(0, 8, 58), text: 'Titles for the Forma film are ready for review this afternoon.', media: [] },
          { id: 'c-5', who: 'Sam', at: ts(0, 9, 30), text: 'Northline invoice goes out after delivery. The pay day is in the calendar.', media: [] }
        ] },
        { id: 'dm:halden:u-leo', ws: 'halden', kind: 'dm', member: 'u-leo', entries: [
          { id: 'd-1', who: 'Leo', at: ts(0, 8, 40), text: 'Can you check the trim at 00:12 before I send v4?', media: [] },
          { id: 'd-2', who: ME, at: ts(0, 8, 52), text: 'Yes, give me ten minutes.', media: [] }
        ] },
        { id: 'grp:halden:northline', ws: 'halden', kind: 'group', name: 'Northline crew', color: 'teal', members: ['u-me', 'u-leo', 'u-sam'], unread: 2, entries: [
          { id: 'g-1', who: 'Sam', at: ts(-1, 15, 10), text: 'Final grade for the bridge scene is exported.', media: [] },
          { id: 'g-2', who: 'Leo', at: ts(0, 10, 2), text: 'Cutting it into v4 now. Maren gets it before lunch.', media: [] }
        ] },
        { id: 'grp:halden:edit', ws: 'halden', kind: 'group', name: 'Edit bay', color: 'violet', members: ['u-me', 'u-leo', 'u-mira'], entries: [
          { id: 'g-3', who: 'Mira', at: ts(-2, 17, 40), text: 'Who has the Forma title template?', media: [] },
          { id: 'g-4', who: ME, at: ts(-2, 17, 52), text: 'It is in Forma, in the Selects folder.', media: [] }
        ] }
      ],
      events: [
        { id: 'ev1', ws: 'halden', title: 'Northline delivery window', type: 'delivery', project: 'northline-campaign', start: dayOffset(1), end: dayOffset(3) },
        { id: 'ev2', ws: 'halden', title: 'Spring teaser review call', type: 'meeting', project: 'spring-teaser', start: dayOffset(0), end: dayOffset(0) },
        { id: 'ev3', ws: 'halden', title: 'Lookbook 01 final cut', type: 'deadline', project: 'lookbook-01', start: dayOffset(5), end: dayOffset(5) },
        { id: 'ev4', ws: 'halden', title: 'Northline invoice paid', type: 'payday', project: 'northline-campaign', start: dayOffset(9), end: dayOffset(9) },
        { id: 'ev5', ws: 'halden', title: 'Forma shoot', type: 'shoot', project: 'forma-brand-film', start: dayOffset(12), end: dayOffset(13) },
        { id: 'ev6', ws: 'halden', title: 'Team pay day', type: 'payday', project: '', start: dayOffset(16), end: dayOffset(16) }
      ],
      activity: [
        { who: 'Maren', text: 'approved Northline_Social_9x16.mp4', when: '2 h ago', at: Date.now() - 2 * 3600e3 },
        { who: 'Leo', text: 'uploaded v2 of Spring_Teaser.mp4', when: 'Yesterday', at: ts(-1, 16, 0) },
        { who: ME, text: 'uploaded v3 of Northline_Campaign.mp4', when: 'Yesterday', at: ts(-1, 11, 0) },
        { who: 'Jo', text: 'requested 2 changes on Lookbook 01', when: '2 days ago', at: ts(-2, 15, 0) }
      ]
    };
  }

  /* ---------- state ---------- */
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || !S.projects || !S.notes) S = seed();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
    catch (e) { toast('Browser storage is full, so this change lasts only until you reload. Remove some images from notes.'); return false; }
  }
  function migrate() {
    S.workspaces.forEach(function (w) {
      if (!w.members) w.members = (w.team || [ME]).map(function (n, i) { return { id: i ? 'u-' + slug(n) : 'u-me', me: !i, name: n, full: n, email: '', role: i ? 'Editor' : 'Owner', job: '' }; });
      if (w.usedGb == null) w.usedGb = 0;
    });
    if (!S.chats) S.chats = [];
    S.workspaces.forEach(function (w) { if (!w.code) w.code = genCode(); });
    if (!S.events) S.events = [];
    S.tasks.forEach(function (t) {
      if (!t.ws) { var tp = t.project && project(t.project); t.ws = tp ? tp.ws : S.ws; }
      if (t.due == null) t.due = '';
    });
    S.notes = S.notes.map(function (n) {
      if (n.entries) return n;
      return { id: n.id, ws: n.ws || S.ws, project: n.project || '', title: String(n.text || 'Note').split(/[.!?]/)[0].slice(0, 60), date: today(), created: Date.now(),
        entries: [{ id: 'e' + uid(), who: ME, at: Date.now(), text: n.text || '', media: [] }] };
    });
  }
  migrate();
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ui = { bell: false, invTab: 'qr', chatQ: '', calView: 'month', calOff: {}, calDir: 0, replying: {}, taskId: '', preset: '', qaLoc: '', noteId: '', pend: {}, reading: '', attachFor: '', shareFor: '', teamTab: 'chat', chatId: '', calMonth: '', evId: '', sq: '', si: 0, sres: [], lb: null, freshNote: '', freshEntry: '', freshTask: '', doneOpen: false, wsOpen: false, acct: false, share: false, shareDl: true, modal: null, as: 'team', folder: '', q: '', t: 0, playing: false, sel: 0, hot: '' };
  var blobs = {};      // fileId -> object URL of a file uploaded in this session
  var mediaBlobs = {}; // note media id -> object URL of a video attached in this session
  var sky = document.createElement('div'); sky.className = 'app-sky'; sky.setAttribute('aria-hidden', 'true'); sky.innerHTML = '<i></i><i></i><i></i>';
  document.body.insertBefore(sky, document.body.firstChild);
  var lbEl = document.createElement('div'); lbEl.id = 'lb'; document.body.appendChild(lbEl);
  var notePicker = document.createElement('input');
  notePicker.type = 'file'; notePicker.multiple = true; notePicker.accept = 'image/*,video/*'; notePicker.hidden = true;
  document.body.appendChild(notePicker);
  var photoPicker = document.createElement('input');
  photoPicker.type = 'file'; photoPicker.accept = 'image/*'; photoPicker.hidden = true;
  document.body.appendChild(photoPicker);
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
  function log(who, text) { S.activity.unshift({ who: who, text: text, when: 'Just now', at: Date.now() }); S.activity = S.activity.slice(0, 30); }

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
    var open = wsTasks().filter(function (t) { return !t.done; }).length;
    function item(v, icon, label, count, hot) {
      var on = r.v === v || (v === 'projects' && (r.v === 'p' || r.v === 'f'));
      return '<button class="nav-item' + (on ? ' on' : '') + '" data-go="' + v + '" title="' + label + '">' + ic(icon) + '<span>' + label + '</span>' + (count != null ? '<span class="count' + (hot ? ' hot' : '') + '">' + count + '</span>' : '') + '</button>';
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
    h += item('home', 'home', 'Home') + item('projects', 'folder', 'Projects', ps.length) + item('review', 'review', 'In review', inReview) + item('tasks', 'tasks', 'Tasks', open) + item('notes', 'notes', 'Notes', wsNotes().length) + item('calendar', 'cal', 'Calendar') + item('team', 'people', 'Team', unreadTotal() || null, true) + item('activity', 'activity', 'Activity');
    var cs = clients();
    if (cs.length) {
      h += '<div class="side-label">Clients</div>' + cs.map(function (c) {
        var n = ps.filter(function (p) { return p.client === c.id; }).length;
        return '<button class="nav-item' + (r.v === 'c' && r.a === c.id ? ' on' : '') + '" data-go="c/' + c.id + '" title="' + esc(c.name) + '"><span class="dot" style="background:' + c.color + '"></span><span>' + esc(c.name) + '</span><span class="count">' + n + '</span></button>';
      }).join('');
    }
    var pl = plan(), sc = 2 * Math.PI * 15, ringAnim = sideRingPct !== st.pct; sideRingPct = st.pct;
    h += '<div class="side-foot">' +
      '<button class="plan-s" data-go="plans" title="Plans"><span class="ps-l"><small>Your plan</small><b>' + esc(pl.name) + '</b></span><span class="ps-r"><b>' + pl.price + '</b><small>per month</small></span><span class="ps-cta">' + (pl.id === 'agency' ? 'See plans' : 'Upgrade') + ic('chevR') + '</span></button>' +
      '<button class="storage" data-go="plans" title="Storage"><svg class="sring' + (ringAnim ? ' anim' : '') + '" viewBox="0 0 40 40" aria-hidden="true"><circle class="trk" cx="20" cy="20" r="15" fill="none" stroke-width="3.5"/><circle class="val' + (st.over ? ' over' : '') + '" cx="20" cy="20" r="15" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="' + (sc * st.pct / 100).toFixed(1) + ' ' + sc.toFixed(1) + '" transform="rotate(-90 20 20)"/><text x="20" y="23.2" text-anchor="middle"' + (ringAnim ? ' data-count="' + st.pct + '" data-suffix="%"' : '') + '>' + st.pct + '%</text></svg>' +
        '<span><b>Storage</b><small>' + esc(st.txt) + '</small></span></button>' +
      '<div class="acct">' + (ui.acct ? '<div class="menu acct-menu" role="menu"><button role="menuitem" data-go="account">Account</button><button role="menuitem" data-go="plans">Plans</button><button role="menuitem" data-theme-toggle>Switch light / dark</button><a role="menuitem" href="index.html">Back to site</a><button role="menuitem" data-act="reset">Reset demo data</button><hr><button role="menuitem" data-act="logout">Sign out</button></div>' : '') +
      '<button class="acct-btn" data-act="acct-toggle" aria-haspopup="menu" aria-expanded="' + ui.acct + '" title="Account">' + av(ME) + '<span><b>' + esc(USER.name) + '</b><small>' + esc(USER.email) + '</small></span>' + ic('chev') + '</button></div></div>';
    $('#side').innerHTML = h;
    $('#app').classList.toggle('collapsed', !!S.collapsed);
    placeNavInd();
    if (ringAnim) runCounts($('#side .storage'));
  }

  var sideRingPct = null, navY = null;
  function placeNavInd() {
    var side = $('#side'), on = side.querySelector('.nav-item.on'), ind = document.createElement('span');
    ind.className = 'nav-ind'; side.appendChild(ind);
    if (!on) { ind.style.opacity = '0'; navY = null; return; }
    var y = on.offsetTop, setPos = function (yy) { ind.style.transform = 'translateY(' + yy + 'px)'; };
    ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; ind.style.height = on.offsetHeight + 'px';
    if (navY !== null && navY !== y && !reduceMotion) { ind.style.transition = 'none'; setPos(navY); void ind.offsetWidth; ind.style.transition = ''; }
    setPos(y); navY = y;
  }
  function unreadTotal() { return S.chats.filter(function (c) { return c.ws === S.ws; }).reduce(function (a, c) { return a + (c.unread || 0); }, 0); }
  function runCounts(root) {
    if (!root) return;
    [].forEach.call(root.querySelectorAll('[data-count]'), function (el) {
      var to = parseFloat(el.getAttribute('data-count')), from = parseFloat(el.getAttribute('data-from') || '0'), fmt = el.getAttribute('data-fmt'),
        suf = el.getAttribute('data-suffix') || '', delay = +(el.getAttribute('data-delay') || 0), dur = +(el.getAttribute('data-dur') || 1000);
      var out = function (v) { el.textContent = fmt === 'eur' ? '€' + (to % 1 ? v.toFixed(2) : Math.round(v)) : Math.round(v) + suf; };
      if (reduceMotion) { out(to); return; }
      out(from);
      setTimeout(function () {
        var t0 = performance.now();
        (function step(now) { var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); out(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
      }, delay);
    });
  }
  var navHist = [], navBack = false, lastPath = currentPath();
  function currentPath() { return location.hash.replace(/^#\/?/, '') || 'home'; }
  function parentOf(path) { var q = path.split('/'); if (q[0] === 'f') return 'p/' + q[1]; if (q[0] === 'p') return q[2] ? 'p/' + q[1] : 'projects'; if (q[0] === 'c') return 'projects'; return 'home'; }
  function goBack() {
    var cur = currentPath(), t = navHist.pop();
    while (t === cur && navHist.length) t = navHist.pop();
    if (!t || t === cur) t = parentOf(cur);
    navBack = true; go(t);
  }
  function bellItems() {
    var items = S.chats.filter(function (c) { return c.ws === S.ws && c.unread && (c.kind !== 'dm' || memberById(c.member)); }).map(function (c) {
      var l = c.entries[c.entries.length - 1] || {};
      return { who: l.who || ME, text: c.unread + ' new message' + (c.unread > 1 ? 's' : '') + ' in ' + chatName(c), when: l.at ? relWhen(l.at) : '', unread: true, chat: c.id };
    });
    return items.concat(S.activity.slice(0, 8).map(function (a) { return { who: a.who, text: a.text, when: a.at ? relWhen(a.at) : a.when, unread: (a.at || 0) > (S.seenAt || 0) }; }));
  }
  function bellHtml() {
    var items = bellItems(), n = items.filter(function (i) { return i.unread; }).length;
    return '<div class="bell-wrap"><button class="icon-btn top-ic bell" data-act="bell" aria-label="Notifications' + (n ? ', ' + n + ' new' : '') + '" aria-expanded="' + ui.bell + '" title="Notifications">' + ic('bell') + (n ? '<em class="bdg">' + n + '</em>' : '') + '</button>' +
      (ui.bell ? '<div class="menu bell-menu" role="menu"><header>Notifications' + (n ? '<button class="link" data-act="bell-read">Mark all read</button>' : '') + '</header><div class="bell-list">' +
        (items.length ? items.map(function (i) {
          return '<button class="bl-row' + (i.unread ? ' unread' : '') + '" ' + (i.chat ? 'data-act="chat-open" data-id="' + esc(i.chat) + '"' : 'data-go="activity"') + '>' + av(i.who, true) + '<span><span>' + (i.chat ? '' : '<b>' + esc(i.who) + '</b> ') + esc(i.text) + '</span><small>' + esc(i.when) + '</small></span></button>';
        }).join('') : '<div class="empty-sm">You are all caught up.</div>') + '</div></div>' : '') + '</div>';
  }

  /* ---------- top bar ---------- */
  function renderTop() {
    var r = route(), p, f, h = '<button class="icon-btn menu-btn" data-act="drawer" aria-label="Open menu">' + ic('menu') + '</button>';
    if (r.v === 'p' || r.v === 'f') {
      p = project(r.a); f = r.v === 'f' ? fileOf(p, r.b) : null;
      h += '<button class="icon-btn back-btn" data-act="back" aria-label="Back" title="Back">' + ic('back') + '</button>';
      if (p) h += '<div class="crumb"><b>' + esc(f ? f.name : p.name) + '</b><small>' + esc(f ? p.name : client(p.client).name + ' · ' + p.files.length + ' file' + (p.files.length === 1 ? '' : 's')) + '</small></div>';
      h += '<span class="sp"></span>' + SEARCH_BTN + bellHtml() + THEME_BTN;
      if (p && !f) h += '<button class="btn btn-primary btn-sm" data-act="upload">' + ic('upload') + 'Upload</button>';
      if (f && ui.as === 'team') {
        h += '<button class="btn btn-ghost btn-sm" data-act="new-version">' + ic('upload') + 'New version</button>' +
          '<button class="btn btn-primary btn-sm" data-act="share-toggle">' + ic('link') + 'Share link</button>';
      }
    } else {
      if (r.v !== 'home') h += '<button class="icon-btn back-btn" data-act="back" aria-label="Back" title="Back">' + ic('back') + '</button>';
      var titles = { home: '', projects: 'Projects', review: 'In review', tasks: 'Tasks', notes: 'Notes', calendar: 'Calendar', team: 'Team', activity: 'Activity', plans: 'Plans', account: 'Account', c: client(r.a).name };
      var subs = { home: '', projects: ws().name, review: 'Waiting on a client or on you', tasks: ws().name, notes: ws().name, calendar: 'Deliveries, finish dates and pay days', team: ws().name, activity: ws().name, plans: ws().name, account: USER.email, c: 'Client' };
      h += (r.v === 'home' ? '' : '<div class="crumb"><b>' + esc(titles[r.v] || 'Deskspace') + '</b><small>' + esc(subs[r.v] || '') + '</small></div>') + '<span class="sp"></span>' + SEARCH_BTN + bellHtml() + THEME_BTN;
      if (r.v === 'projects' || r.v === 'c') h += '<button class="btn btn-primary btn-sm" data-act="new-project">' + ic('plus') + 'New project</button>';
      if (r.v === 'calendar') h += '<button class="btn btn-primary btn-sm" data-act="ev-new" data-id="">' + ic('plus') + 'New event</button>';
      if (r.v === 'team') h += '<button class="btn btn-ghost btn-sm" data-act="join">' + ic('key') + 'Join with code</button>' + (canManage() ? '<button class="btn btn-primary btn-sm" data-act="invite">' + ic('plus') + 'Add member</button>' : '');
      if (r.v === 'tasks') h += '<button class="btn btn-primary btn-sm" data-act="task-new" data-id="">' + ic('plus') + 'New task</button>';
      if (r.v === 'notes') h += '<button class="btn btn-primary btn-sm" data-act="note-new" data-id="">' + ic('plus') + 'New note</button>';
    }
    $('#top').innerHTML = h;
  }

  /* ---------- views ---------- */
  function thumb(x, icon) { return x ? '<img src="' + src(x) + '" alt="" loading="lazy">' : '<span class="ph">' + ic(icon || 'file') + '</span>'; }

  function pCard(p) {
    var st = pStatus(p), c = client(p.client);
    var n = p.files.filter(function (f) { return f.status === 'changes'; }).length;
    var okN = p.files.filter(function (f) { return f.status === 'approved'; }).length, okPct = p.files.length ? Math.round(okN / p.files.length * 100) : 0;
    var next = { draft: ['Not sent yet', 'Open'], review: ['Waiting on client feedback', 'Open'], changes: [n + ' file' + (n === 1 ? '' : 's') + ' to revise', 'Open'], approved: ['Ready to deliver', 'Deliver'] }[st];
    return '<button class="card pcard" data-go="p/' + p.id + (st === 'approved' ? '/delivery' : '') + '"><span class="thumb">' + thumb(p.cover, 'folder') + pill(st) + '</span>' +
      '<span class="body"><b>' + esc(p.name) + '</b><small>' + esc(c.name) + ' · ' + p.files.length + ' file' + (p.files.length === 1 ? '' : 's') + (p.due ? ' · due ' + esc(p.due) : '') + '</small>' +
        '<span class="pprog" title="' + okN + ' of ' + p.files.length + ' approved"><i style="width:' + okPct + '%"></i></span></span>' +
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

  /* ---------- dates ---------- */
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayOffset(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
  function today() { return dayOffset(0); }
  function ts(dayOff, h, m) { var d = new Date(); d.setDate(d.getDate() + dayOff); d.setHours(h, m, 0, 0); return d.getTime(); }
  function fmtDay(s) {
    if (!s) return '';
    if (s === today()) return 'Today';
    if (s === dayOffset(1)) return 'Tomorrow';
    if (s === dayOffset(-1)) return 'Yesterday';
    var p = s.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  }
  function fmtTime(t) { return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }

  /* ---------- shared bits ---------- */
  function locOptions(sel, none) {
    var ps = projects();
    return '<option value="">' + none + '</option>' + (ps.length ? '<optgroup label="Projects">' + ps.map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name) + '</option>';
    }).join('') + '</optgroup>' : '');
  }
  function sec(icon, title, n, go) {
    return '<div class="sec-h">' + icon + '<span>' + title + '</span><span class="muted">' + n + '</span>' + (go ? '<button class="link" data-go="' + go + '">Open project ' + ic('chevR') + '</button>' : '') + '</div>';
  }
  function cdot(p) { return '<span class="dot" style="background:' + client(p.client).color + '"></span>'; }

  /* ---------- tasks ---------- */
  function taskById(id) { return S.tasks.filter(function (t) { return t.id === id; })[0]; }
  function wsTasks() {
    var ids = projects().map(function (p) { return p.id; });
    return S.tasks.filter(function (t) { return t.project ? ids.indexOf(t.project) > -1 : (t.ws || S.ws) === S.ws; });
  }
  function byDue(a, b) { var x = a.due || '9999-99-99', y = b.due || '9999-99-99'; return x < y ? -1 : x > y ? 1 : 0; }
  function taskLoc(t) { var p = t.project && project(t.project); return p ? p.name : 'My Tasks'; }
  function dueChip(t) {
    if (!t.due) return '';
    var cls = t.done ? '' : t.due < today() ? ' late' : t.due === today() ? ' today' : '';
    return '<span class="due' + cls + '" title="Due ' + esc(fmtDay(t.due)) + '">' + ic('cal') + esc(fmtDay(t.due)) + '</span>';
  }
  function taskRow(t, showLoc) {
    return '<div class="tk' + (t.done ? ' is-done' : ' open') + (t.id === ui.freshTask ? ' fresh' : '') + '" data-id="' + t.id + '">' +
      (t.done ? '' : '<div class="tk-bg" aria-hidden="true">' + ic('check') + 'Done</div>') +
      '<div class="row task' + (t.done ? ' done' : '') + '">' +
        '<button class="check' + (t.done ? ' on' : '') + '" data-act="task" data-id="' + t.id + '" aria-label="' + (t.done ? 'Mark as not done' : 'Mark as done') + '" title="' + (t.done ? 'Mark as not done' : 'Mark as done') + '">' + ic('check') + '</button>' +
        '<button class="tk-main" data-act="task-edit" data-id="' + t.id + '" title="Edit task"><b>' + esc(t.text) + '</b>' + (showLoc ? '<small>' + esc(taskLoc(t)) + '</small>' : '') + '</button>' +
        dueChip(t) +
      '</div></div>';
  }
  function quickAdd(pid, mode) {
    var loc = mode === 'full' ? (ui.qaLoc || '') : (pid || '');
    return '<form class="add qa" data-form="task" data-pid="' + esc(pid || '') + '">' +
      '<input class="input" name="text" placeholder="' + (pid ? 'Add a task…' : 'Add to My Tasks…') + '" autocomplete="off" aria-label="New task">' +
      (mode ? '<input class="input date" type="date" name="due" aria-label="Due date" title="Due date">' : '') +
      (mode === 'full' ? '<select class="input sel" name="loc" aria-label="Location" title="Location">' + locOptions(loc, 'My Tasks') + '</select>' : '') +
      '<button class="btn btn-ghost btn-sm" type="submit">Add</button></form>';
  }
  function doneBlock(list) {
    if (!list.length) return '';
    return '<details class="tdone"' + (ui.doneOpen ? ' open' : '') + '><summary>' + ic('chevR') + 'Completed <span class="muted">' + list.length + '</span></summary><div class="card list">' +
      list.slice().sort(function (a, b) { return (b.doneAt || 0) - (a.doneAt || 0); }).map(function (t) { return taskRow(t, true); }).join('') + '</div></details>';
  }
  function vTasks() {
    var all = wsTasks(), open = all.filter(function (t) { return !t.done; }).sort(byDue), done = all.filter(function (t) { return t.done; });
    var late = open.filter(function (t) { return t.due && t.due < today(); }).length;
    var mine = open.filter(function (t) { return !t.project; });
    var h = '<div class="view-head"><h1>Tasks</h1><small>' + open.length + ' open' + (late ? ' · <span class="late-txt">' + late + ' overdue</span>' : '') + '</small></div>';
    h += '<div class="card qa-card">' + quickAdd('', 'full') + '</div>';
    h += sec(ic('inbox'), 'My Tasks', mine.length) + '<div class="card list">' + (mine.length ? mine.map(function (t) { return taskRow(t, false); }).join('') : '<div class="empty-sm">Nothing here. Tasks without a project land in My Tasks.</div>') + '</div>';
    projects().forEach(function (p) {
      var pts = open.filter(function (t) { return t.project === p.id; });
      if (pts.length) h += sec(cdot(p), esc(p.name), pts.length, 'p/' + p.id + '/tasks') + '<div class="card list">' + pts.map(function (t) { return taskRow(t, false); }).join('') + '</div>';
    });
    return h + doneBlock(done);
  }
  function afterTasks() { save(); renderSide(); renderView(); }
  function completeTask(tk, id) {
    var t = taskById(id); if (!t) return;
    if (t.done) { t.done = false; delete t.doneAt; afterTasks(); toast('Moved back to ' + taskLoc(t)); return; }
    var finish = function () { t.done = true; t.doneAt = Date.now(); log(ME, 'completed “' + t.text + '”'); afterTasks(); toast('Completed: ' + t.text); };
    if (!tk || reduceMotion) { finish(); return; }
    if (tk.classList.contains('leaving')) return;
    var row = tk.querySelector('.row'), chk = tk.querySelector('.check');
    if (chk) { chk.classList.add('on', 'pop'); }
    tk.style.height = tk.offsetHeight + 'px';
    tk.classList.add('leaving');
    setTimeout(function () { tk.classList.add('arm'); row.style.transform = 'translateX(-104%)'; }, 150);
    setTimeout(function () { tk.classList.add('gone'); }, 560);
    setTimeout(finish, 840);
  }

  /* ---------- notes ---------- */
  function noteById(id) { return S.notes.filter(function (n) { return n.id === id; })[0]; }
  function wsNotes() {
    var ids = projects().map(function (p) { return p.id; });
    return S.notes.filter(function (n) { return n.project ? ids.indexOf(n.project) > -1 : (n.ws || S.ws) === S.ws; });
  }
  function lastAt(n) { var e = n.entries[n.entries.length - 1]; return e ? e.at : (n.created || 0); }
  function byRecent(a, b) { return lastAt(b) - lastAt(a); }
  function notesOf(pid) { return wsNotes().filter(function (n) { return (n.project || '') === pid; }).sort(byRecent); }
  function noteMedia(n) { var out = []; n.entries.forEach(function (e) { (e.media || []).forEach(function (m) { out.push(m); }); }); return out; }
  function noteExcerpt(n) { for (var i = n.entries.length - 1; i >= 0; i--) if (n.entries[i].text) return n.entries[i].text; return ''; }
  function noteLoc(n) { var p = n.project && project(n.project); return p ? p.name : 'My Notes'; }
  function isUrl(x) { return /^(data:|blob:|media\/|https?:)/.test(x || ''); }
  function mUrl(m) { return m.src ? (isUrl(m.src) ? m.src : src(m.src)) : (mediaBlobs[m.id] || ''); }
  function mThumb(m) { return m.kind === 'image' ? mUrl(m) : (m.thumb ? (isUrl(m.thumb) ? m.thumb : src(m.thumb)) : ''); }
  function countTxt(n) { var k = n.entries.length, f = noteMedia(n).length; return k + ' message' + (k === 1 ? '' : 's') + (f ? ' · ' + f + ' file' + (f === 1 ? '' : 's') : ''); }

  function nCard(n) {
    var media = noteMedia(n), ths = media.map(mThumb).filter(Boolean), who = [], cover;
    n.entries.forEach(function (e) { if (who.indexOf(e.who) < 0) who.push(e.who); });
    if (media.length) {
      var pics = ths.length >= 3 ? ths.slice(0, 3) : ths.slice(0, 1);
      cover = '<span class="ncover' + (pics.length === 3 ? ' stack' : '') + '">' + (pics.length ? pics.map(function (u) { return '<img src="' + u + '" alt="" loading="lazy">'; }).join('') : '<span class="ph">' + ic('film') + '</span>') +
        '<span class="nbadge">' + ic('clip') + media.length + '</span></span>';
    } else cover = '<span class="ncover"><span class="quote">' + esc(noteExcerpt(n) || 'Empty note. Open it to start writing.') + '</span></span>';
    var k = n.entries.length;
    return '<button class="card ncard' + (n.id === ui.freshNote && !ui.modal ? ' fresh' : '') + '" data-act="note-open" data-id="' + n.id + '">' + cover +
      '<span class="body"><b>' + esc(n.title) + '</b><small>' + esc(noteLoc(n)) + (n.date ? ' · ' + esc(fmtDay(n.date)) : '') + '</small></span>' +
      '<span class="nfoot"><span class="avs">' + who.slice(0, 3).map(function (w) { return av(w, true); }).join('') + '</span><span>' + k + ' message' + (k === 1 ? '' : 's') + '</span></span></button>';
  }
  function nLine(n, actName) {
    var media = noteMedia(n), th = media.length ? mThumb(media[0]) : '';
    return '<button class="row nline" data-act="' + (typeof actName === 'string' ? actName : 'note-open') + '" data-id="' + n.id + '">' + (th ? '<img class="nthumb" src="' + th + '" alt="">' : '<span class="nic">' + ic('notes') + '</span>') +
      '<span class="grow"><b>' + esc(n.title) + '</b><small>' + esc(noteLoc(n)) + ' · ' + esc(noteExcerpt(n) || 'No messages yet') + '</small></span>' +
      (media.length ? '<span class="due">' + ic('clip') + media.length + '</span>' : '') + '</button>';
  }
  function addNoteTile(pid) { return '<button class="add-tile" data-act="note-new" data-id="' + esc(pid) + '"><span>' + ic('plus') + '</span>New note</button>'; }
  function vNotes() {
    var all = wsNotes().sort(byRecent), mine = all.filter(function (n) { return !n.project; });
    var h = '<div class="view-head"><h1>Notes</h1><small>' + all.length + ' note' + (all.length === 1 ? '' : 's') + ' · open one to write and attach images or videos</small></div>';
    h += sec(ic('inbox'), 'My Notes', mine.length) + '<div class="ngrid">' + mine.map(nCard).join('') + addNoteTile('') + '</div>';
    projects().forEach(function (p) {
      var ns = all.filter(function (n) { return n.project === p.id; });
      if (ns.length) h += sec(cdot(p), esc(p.name), ns.length, 'p/' + p.id + '/notes') + '<div class="ngrid">' + ns.map(nCard).join('') + addNoteTile(p.id) + '</div>';
    });
    return h;
  }

  /* chat threads: notes and team chats share one look */
  function chatById(id) { return S.chats.filter(function (c) { return c.id === id; })[0]; }
  function threadById(id) { return noteById(id) || chatById(id); }
  function pendOf(id) { return ui.pend[id] || (ui.pend[id] = []); }
  function mediaGrid(list) {
    var n = list.length;
    return '<div class="mgrid ' + (n === 1 ? 'one' : n === 3 ? 'three' : 'two') + '">' + list.slice(0, 4).map(function (m, i) {
      var th = mThumb(m), playable = m.kind !== 'video' || !!mUrl(m);
      return '<button type="button" class="mt' + (m.kind === 'video' ? ' vid' : '') + (playable ? '' : ' gone') + '" data-act="lb" data-id="' + m.id + '" aria-label="Open ' + esc(m.name || m.kind) + '">' +
        (th ? '<img src="' + th + '" alt="">' : '<span class="ph">' + ic('film') + '</span>') +
        (m.kind === 'video' ? '<span class="play">' + ic('play') + '</span>' + (m.dur ? '<span class="dur">' + tc(m.dur) + '</span>' : '') : '') +
        (i === 3 && n > 4 ? '<span class="more">+' + (n - 4) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function noteRefHtml(id) {
    var n = noteById(id);
    if (!n) return '<span class="nref gone"><span class="nic">' + ic('notes') + '</span><span><b>Note deleted</b><small>It is no longer available</small></span></span>';
    var th = noteMedia(n).map(mThumb).filter(Boolean)[0];
    return '<button type="button" class="nref" data-act="note-open" data-id="' + n.id + '">' + (th ? '<img src="' + th + '" alt="">' : '<span class="nic">' + ic('notes') + '</span>') +
      '<span><b>' + esc(n.title) + '</b><small>' + esc(noteLoc(n)) + ' · ' + countTxt(n) + '</small></span>' + ic('chevR') + '</button>';
  }
  function threadHtml(n) {
    if (!n.entries.length) return n.kind ? '<div class="thread-empty">' + ic('review') + '<b>No messages yet</b>Say hello, share a note, or drop images and videos here.</div>' :
      '<div class="thread-empty">' + ic('notes') + '<b>Start the note</b>Write below, or attach images and videos with the clip. You can also drop or paste files here.</div>';
    var out = '', lastDay = '';
    n.entries.forEach(function (e, i) {
      var d = iso(new Date(e.at)), prev = n.entries[i - 1], me = e.who === ME;
      if (d !== lastDay) { out += '<div class="day-sep">' + esc(fmtDay(d)) + '</div>'; lastDay = d; }
      if (e.sys) { out += '<div class="sys">' + esc(e.text) + '</div>'; return; }
      var cont = prev && prev.who === e.who && iso(new Date(prev.at)) === d && e.at - prev.at < 10 * 60 * 1000;
      var hasMedia = e.media && e.media.length;
      out += '<div class="msg' + (me ? ' me' : '') + (cont ? ' cont' : '') + (e.id === ui.freshEntry ? ' new' : '') + '">' +
        (me ? '' : (cont ? '<span class="av-sp"></span>' : av(e.who, true))) +
        '<div class="bubble' + (hasMedia ? ' has-media' : '') + '">' + (!me && !cont ? '<b class="who">' + esc(e.who) + '</b>' : '') +
        (hasMedia ? mediaGrid(e.media) : '') + (e.noteRef ? noteRefHtml(e.noteRef) : '') + (e.text ? '<p>' + esc(e.text) + '</p>' : '') +
        '<time>' + fmtTime(e.at) + '</time></div></div>';
    });
    return out;
  }
  function chatHead(n) {
    return '<header class="chat-h"><span class="chat-ic">' + ic('notes') + '</span><div class="chat-t">' +
      '<input class="chat-title" data-note-field="title" value="' + esc(n.title) + '" aria-label="Note title" maxlength="80">' +
      '<div class="chat-meta"><label class="meta-chip" title="Location">' + ic('folder') + '<select data-note-field="project" aria-label="Location">' + locOptions(n.project, 'My Notes') + '</select></label>' +
      '<label class="meta-chip" title="Date">' + ic('cal') + '<input type="date" data-note-field="date" value="' + esc(n.date || '') + '" aria-label="Date"></label>' +
      '<span class="muted" id="chat-count">' + countTxt(n) + '</span></div></div>' +
      '<button class="icon-btn" data-act="note-del" data-id="' + n.id + '" title="Delete note" aria-label="Delete note">' + ic('trash') + '</button>' +
      '<button class="icon-btn" data-act="close-modal" data-force="1" title="Close" aria-label="Close">' + ic('x') + '</button></header>';
  }
  function pendHtml(id) {
    return pendOf(id).map(function (m) {
      var th = mThumb(m);
      return '<div class="pend-tile">' + (th ? '<img src="' + th + '" alt="">' : '<span class="ph">' + ic('film') + '</span>') + (m.kind === 'video' ? '<span class="pend-vid">' + ic('play') + '</span>' : '') +
        '<button type="button" class="pend-x" data-act="pend-del" data-id="' + m.id + '" aria-label="Remove ' + esc(m.name || 'attachment') + '">' + ic('x') + '</button></div>';
    }).join('') + (ui.reading === id ? '<div class="pend-tile loading"><span class="spin"></span></div>' : '');
  }
  function composerHtml(id, share) {
    return '<form class="composer" data-form="note-msg" data-thread="' + esc(id) + '"><div class="pend" data-pend="' + esc(id) + '">' + pendHtml(id) + '</div>' +
      '<div class="comp-row"><button type="button" class="icon-btn" data-act="note-attach" title="Attach images or videos" aria-label="Attach images or videos">' + ic('clip') + '</button>' +
      (share ? '<button type="button" class="icon-btn" data-act="share-note" title="Share a note" aria-label="Share a note">' + ic('notes') + '</button>' : '') +
      '<textarea class="compose" name="text" rows="1" placeholder="Write a message…" aria-label="Message"></textarea>' +
      '<button class="send" type="submit" aria-label="Send" title="Send">' + ic('send') + '</button></div>' +
      '<div class="comp-hint">Enter to send · Shift + Enter for a new line · drop or paste images and videos</div></form>';
  }
  function threadEl(id) { return document.querySelector('[data-thread-body="' + id + '"]'); }
  function paintThread(id) {
    var n = threadById(id), th = threadEl(id);
    if (!n || !th) return;
    th.innerHTML = threadHtml(n); ui.freshEntry = '';
    th.scrollTop = th.scrollHeight;
    [].forEach.call(th.querySelectorAll('.msg.new img'), function (img) { img.addEventListener('load', function () { th.scrollTop = th.scrollHeight; }, { once: true }); });
    if (noteById(id)) { var cnt = $('#chat-count'); if (cnt) cnt.textContent = countTxt(n); }
  }
  function paintPending(id) { var el = document.querySelector('[data-pend="' + id + '"]'); if (el) el.innerHTML = pendHtml(id); }
  function bindChat(root, id, first) {
    if (!root) return;
    var th = threadEl(id), c = root.querySelector('.compose');
    if (th) {
      th.scrollTop = th.scrollHeight;
      if (first) [].forEach.call(th.querySelectorAll('img'), function (img) { img.addEventListener('load', function () { th.scrollTop = th.scrollHeight; }, { once: true }); });
    }
    root.ondragover = function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') > -1) { e.preventDefault(); root.classList.add('drop-hi'); } };
    root.ondragleave = function (e) { if (!root.contains(e.relatedTarget)) root.classList.remove('drop-hi'); };
    root.ondrop = function (e) { e.preventDefault(); root.classList.remove('drop-hi'); addPending(e.dataTransfer.files, id); };
    if (c) c.focus();
  }
  function shrinkImage(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'), out = '';
        c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
        try { var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height); out = c.toDataURL('image/jpeg', 0.8); } catch (e) { out = ''; }
        URL.revokeObjectURL(url); resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  }
  function readMedia(file) {
    if (file.type.indexOf('image/') === 0) return shrinkImage(file).then(function (data) { return data ? { id: 'm' + uid(), kind: 'image', name: file.name, src: data } : null; });
    if (file.type.indexOf('video/') === 0) return makeThumb(file).then(function (res) {
      var id = 'm' + uid(); mediaBlobs[id] = res.url;
      return { id: id, kind: 'video', name: file.name, src: '', thumb: res.thumb, dur: isFinite(res.dur) ? Math.round(res.dur) : 0 };
    });
    return Promise.resolve(null);
  }
  function addPending(list, id) {
    if (!id) return;
    var files = [].slice.call(list || []), ok = files.filter(function (f) { return /^(image|video)\//.test(f.type); });
    if (ok.length < files.length) toast('Only images and videos can be attached');
    ok = ok.slice(0, Math.max(0, 12 - pendOf(id).length));
    if (!ok.length) return;
    ui.reading = id; paintPending(id);
    Promise.all(ok.map(readMedia)).then(function (res) {
      res.forEach(function (m) { if (m) pendOf(id).push(m); });
      ui.reading = ''; paintPending(id);
      var form = document.querySelector('form[data-thread="' + id + '"]'), c = form && form.querySelector('.compose'); if (c) c.focus();
    });
  }
  function renderLb() {
    var n = ui.lb && threadById(ui.lb.t), list = n ? noteMedia(n) : [], m = ui.lb ? list[ui.lb.i] : null;
    if (!m) { ui.lb = null; lbEl.innerHTML = ''; return; }
    var url = mUrl(m), th = mThumb(m), body;
    if (m.kind === 'video') body = url ? '<video src="' + url + '" controls autoplay playsinline' + (th ? ' poster="' + th + '"' : '') + '></video>' :
      '<div class="lb-gone">' + (th ? '<img src="' + th + '" alt="">' : '') + '<p>This demo keeps attached videos only until the page is reloaded. Attach it again to play it.</p></div>';
    else body = '<img src="' + url + '" alt="' + esc(m.name || 'Image') + '">';
    lbEl.innerHTML = '<div class="lightbox" data-act="lb-close" role="dialog" aria-modal="true" aria-label="' + esc(m.name || 'Attachment') + '">' + body +
      '<button class="lb-x" data-act="lb-close" data-force="1" aria-label="Close">' + ic('x') + '</button>' +
      (list.length > 1 ? '<button class="lb-nav prev" data-act="lb-nav" data-id="-1" aria-label="Previous">' + ic('back') + '</button><button class="lb-nav next" data-act="lb-nav" data-id="1" aria-label="Next">' + ic('arrow') + '</button>' : '') +
      '<div class="lb-cap">' + esc(m.name || '') + (list.length > 1 ? ' · ' + (ui.lb.i + 1) + ' of ' + list.length : '') + '</div></div>';
  }
  function lbStep(d) {
    var n = ui.lb && threadById(ui.lb.t), len = n ? noteMedia(n).length : 0;
    if (!len) return;
    ui.lb.i = (ui.lb.i + d + len) % len; renderLb();
  }
  function copyText(t, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast(msg); }, function () { toast('Copy failed. Select it and copy by hand.'); });
    else toast('Copy failed. Select it and copy by hand.');
  }
  function animBody() { var b = $('.cal-body'); if (!b || reduceMotion) return; b.classList.add('anim'); setTimeout(function () { b.classList.remove('anim'); }, 900); }
  function closeModal() {
    var wasNote = ui.modal === 'note';
    if (wasNote) ui.pend[ui.noteId] = [];
    ui.modal = null; ui.taskId = ''; ui.evId = ''; ui.lb = null; renderLb(); renderModal();
    if (wasNote) { renderView(); ui.freshNote = ''; }
  }

  function vHome() {
    var w = ws(), st = store(w), all = projects(), td = today(), recent = all.slice(0, 6), mem = activeMembers(w);
    var open = wsTasks().filter(function (t) { return !t.done; }), dueToday = open.filter(function (t) { return t.due === td; }).length, overdue = open.filter(function (t) { return t.due && t.due < td; }).length;
    var waiting = 0; all.forEach(function (p) { p.files.forEach(function (f) { if (f.status === 'review') waiting++; }); });
    var nextDel = wsEvents().filter(function (e) { return e.type === 'delivery' && (e.end || e.start) >= td; }).sort(byStart)[0];
    var openList = open.slice().sort(byDue).slice(0, 6), recentNotes = wsNotes().sort(byRecent).slice(0, 4);
    var up = wsEvents().filter(function (e) { return (e.end || e.start) >= td; }).sort(byStart).slice(0, 3);
    var circ = 2 * Math.PI * 28, tc0 = chatById(teamChatId()), last = tc0 && tc0.entries[tc0.entries.length - 1];
    var tiles = [['new-project', 'folder', 'New project'], ['task-new', 'tasks', 'New task'], ['note-new', 'notes', 'New note'], ['ev-new', 'cal', 'New event']];
    var h = '<div class="home"><div class="tiles">' + tiles.map(function (t) {
      return '<button class="tile" data-act="' + t[0] + '" data-id=""><span class="tile-ic">' + ic(t[1]) + '</span><b>' + t[2] + '</b><span class="tile-plus">' + ic('plus') + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="pulse">' +
      '<button class="pl" data-go="tasks"><b data-count="' + dueToday + '">' + dueToday + '</b><span>due today</span></button>' +
      '<button class="pl' + (overdue ? ' warn' : '') + '" data-go="tasks"><b data-count="' + overdue + '">' + overdue + '</b><span>overdue</span></button>' +
      '<button class="pl" data-go="review"><b data-count="' + waiting + '">' + waiting + '</b><span>waiting on clients</span></button>' +
      '<button class="pl" data-go="calendar">' + ic('cal') + '<span>' + (nextDel ? 'Next delivery <b class="inl">' + esc(fmtDay(nextDel.start)) + '</b>' : 'No delivery planned') + '</span></button></div>';
    h += '<div class="view-head"><h1>Recent projects</h1><span class="sp"></span><button class="link see-all" data-go="projects">See all ' + ic('chevR') + '</button></div>';
    h += recent.length ? '<div class="pgrid six">' + recent.map(pCard).join('') + '</div>' : emptyProjects();
    h += '<div class="home3 grow">' +
      '<div class="card list"><div class="card-h">Tasks <span class="card-acts"><button class="icon-btn sm" data-act="task-new" data-id="" title="New task" aria-label="New task">' + ic('plus') + '</button><button class="link" data-go="tasks">See all</button></span></div>' +
        (openList.length ? openList.map(function (t) { return taskRow(t, true); }).join('') : '<div class="empty-sm">Nothing open.</div>') + quickAdd('', '') + '</div>' +
      '<div class="card list"><div class="card-h">Notes <span class="card-acts"><button class="icon-btn sm" data-act="note-new" data-id="" title="New note" aria-label="New note">' + ic('plus') + '</button><button class="link" data-go="notes">See all</button></span></div>' +
        (recentNotes.length ? recentNotes.map(function (n) { return nLine(n); }).join('') : '<div class="empty-sm">No notes yet.</div>') + '<button class="add-line" data-act="note-new" data-id="">' + ic('plus') + 'New note</button></div>' +
      '<div class="card list"><div class="card-h">Activity <button class="link" data-go="activity">See all</button></div><div class="pad">' + (S.activity.length ? '<ul class="act">' + S.activity.slice(0, 6).map(actLi).join('') + '</ul>' : '<span class="muted">Nothing yet.</span>') + '</div></div></div>';
    h += '<div class="home3 bottom">' +
      '<button class="card pad stor-card" data-go="plans"><div class="sub-h">Storage <span class="link">Plans ' + ic('chevR') + '</span></div><div class="ring"><svg viewBox="0 0 68 68"><circle class="trk" cx="34" cy="34" r="28" fill="none" stroke-width="6"/><circle class="val' + (st.over ? ' over' : '') + '" cx="34" cy="34" r="28" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (circ * st.pct / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 34 34)"/><text x="34" y="38.5" text-anchor="middle" data-count="' + st.pct + '" data-suffix="%">' + st.pct + '%</text></svg><div><b>' + esc(st.txt) + '</b><small>' + esc(st.free) + '</small></div></div></button>' +
      '<div class="card"><div class="card-h">Coming up <button class="link" data-go="calendar">Calendar</button></div><div class="evlist">' + (up.length ? up.map(evLine).join('') : '<div class="empty-sm">Nothing planned.</div>') + '</div></div>' +
      '<div class="card pad team-card"><div class="sub-h">Team <small>' + w.members.length + ' of ' + plan().team + ' seats</small></div><div class="avs">' + mem.map(function (m) { return av(mName(m)); }).join('') + '</div>' +
        '<p class="tc-prev">' + (last ? '<b>' + esc(last.who === ME ? 'You' : last.who) + ':</b> ' + esc(last.text || (last.noteRef ? 'Shared a note' : 'Sent an attachment')) : '') + '</p>' +
        '<div class="row-btns"><button class="btn btn-ghost btn-sm" data-act="chat-open" data-id="' + teamChatId() + '">' + ic('review') + 'Team chat</button><button class="btn btn-ghost btn-sm" data-act="invite">' + ic('plus') + 'Add member</button></div></div>' +
      '</div></div>';
    return h;
  }

  /* ---------- team ---------- */
  var ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'];
  var ROLE_INFO = { Owner: 'Plan, billing and everything else', Admin: 'Members, projects and clients', Editor: 'Uploads, comments, deliveries', Viewer: 'Views and comments' };
  var GROUP_COLORS = ['blue', 'teal', 'violet', 'amber', 'rose'];
  var REPLIES = ['On it.', 'Looks good to me.', 'Give me ten minutes.', 'Sending it over now.', 'Nice, thanks!', 'Can we go over this at 3?', 'Agreed, let\'s keep it.', 'I\'ll check and get back to you.'];
  function myMember(w) { w = w || ws(); return (w.members || []).filter(function (m) { return m.me; })[0]; }
  function canManage() { var m = myMember(); return !!m && (m.role === 'Owner' || m.role === 'Admin'); }
  function isOwner() { var m = myMember(); return !!m && m.role === 'Owner'; }
  function mName(m) { return m.me ? ME : m.name; }
  function mFull(m) { return m ? (m.me ? USER.name : (m.full || m.name)) : 'Former member'; }
  function mEmail(m) { return m.me ? USER.email : (m.email || ''); }
  function memberById(id) { return (ws().members || []).filter(function (m) { return m.id === id; })[0]; }
  function activeMembers(w) { return ((w || ws()).members || []).filter(function (m) { return !m.pending; }); }
  function teamChatId() { return 'team-' + S.ws; }
  function dmId(mid) { return 'dm:' + S.ws + ':' + mid; }
  function ensureChat(id) {
    var c = chatById(id);
    if (!c) { var dm = id.indexOf('dm:') === 0; c = { id: id, ws: S.ws, kind: dm ? 'dm' : 'team', member: dm ? id.split(':')[2] : '', entries: [] }; S.chats.push(c); }
    return c;
  }
  function chatOk(id) {
    if (id === teamChatId()) return true;
    if (id.indexOf('dm:' + S.ws + ':') === 0) { var m = memberById(id.split(':')[2]); return !!m && !m.pending; }
    var c = chatById(id); return !!c && c.kind === 'group' && c.ws === S.ws;
  }
  function genCode() { var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', x = ''; for (var i = 0; i < 9; i++) x += a.charAt(Math.floor(Math.random() * a.length)); return x.slice(0, 3) + '-' + x.slice(3, 6) + '-' + x.slice(6); }
  function wsCode(w) { w = w || ws(); if (!w.code) { w.code = genCode(); save(); } return w.code; }
  function joinUrl() { return location.href.replace(/app\.html.*$/, '').replace(/#.*$/, '') + 'login.html?join=' + wsCode(); }
  function chatMembers(c) {
    if (c.kind === 'team') return activeMembers();
    if (c.kind === 'dm') return [myMember(), memberById(c.member)].filter(Boolean);
    return (c.members || []).map(memberById).filter(function (m) { return m && !m.pending; });
  }
  function chatName(c) { return c.kind === 'team' ? ws().name : c.kind === 'dm' ? mFull(memberById(c.member)) : c.name; }
  function chatIcon(c, big) {
    if (c.kind === 'dm') { var m = memberById(c.member); return av(m ? m.name : '?', false, big ? 'xl' : 'lg2'); }
    var letters = c.kind === 'team' ? ws().letter : c.name.split(/\s+/).map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase();
    return '<span class="gic' + (big ? ' big' : '') + ' g-' + (c.kind === 'team' ? 'blue' : (c.color || 'violet')) + '">' + esc(letters) + '</span>';
  }
  function shortWhen(t) { var d = iso(new Date(t)); return d === today() ? fmtTime(t) : d === dayOffset(-1) ? 'Yesterday' : new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  function lastPreview(c) {
    var l = c.entries[c.entries.length - 1];
    if (!l) return c.kind === 'team' ? 'Everyone in ' + ws().name : c.kind === 'group' ? chatMembers(c).length + ' members' : ((memberById(c.member) || {}).job || 'Say hello');
    if (l.sys) return l.text;
    var what = l.text || (l.noteRef ? 'Shared a note' : (l.media && l.media.length ? (l.media[0].kind === 'video' ? 'Video' : 'Photo') + (l.media.length > 1 ? ' + ' + (l.media.length - 1) : '') : ''));
    return (l.who === ME ? 'You: ' : (c.kind !== 'dm' ? l.who + ': ' : '')) + what;
  }
  function chatRow(c) {
    var l = c.entries[c.entries.length - 1], un = c.unread || 0;
    return '<button class="cl-row' + (ui.chatId === c.id ? ' on' : '') + (un ? ' unread' : '') + '" data-act="chat-open" data-id="' + esc(c.id) + '">' + chatIcon(c) +
      '<span class="cl-main"><span class="cl-top"><b>' + esc(chatName(c)) + '</b>' + (l ? '<time>' + esc(shortWhen(l.at)) + '</time>' : '') + '</span>' +
      '<span class="cl-bot"><small>' + esc(lastPreview(c)) + '</small>' + (un ? '<em class="badge">' + un + '</em>' : '') + '</span></span></button>';
  }
  function chatListHtml() {
    var q = (ui.chatQ || '').trim().toLowerCase(), f = function (c) { return !q || chatName(c).toLowerCase().indexOf(q) > -1; };
    var groups = [ensureChat(teamChatId())].concat(S.chats.filter(function (c) { return c.ws === S.ws && c.kind === 'group'; }));
    var dms = activeMembers().filter(function (m) { return !m.me; }).map(function (m) { return chatById(dmId(m.id)) || { id: dmId(m.id), kind: 'dm', member: m.id, entries: [] }; });
    var g = groups.filter(f), d = dms.filter(f);
    return '<div class="cl-sec"><span>Groups</span><button class="icon-btn sm" data-act="group-new" title="New group" aria-label="New group">' + ic('plus') + '</button></div>' + g.map(chatRow).join('') +
      '<div class="cl-sec"><span>Direct messages</span></div>' + (d.length ? d.map(chatRow).join('') : '<div class="empty-sm">No one matches.</div>');
  }
  function paintChatList() { var el = $('#chat-list'); if (el) el.innerHTML = chatListHtml(); }
  function teamChatHtml() {
    if (!ui.chatId || !chatOk(ui.chatId)) ui.chatId = teamChatId();
    var c = ensureChat(ui.chatId), mem = chatMembers(c), sub, acts = '';
    if (c.unread) { c.unread = 0; save(); }
    if (c.kind === 'dm') { var m = memberById(c.member); sub = m.role + (m.job ? ' · ' + m.job : ''); }
    else sub = mem.length + ' members';
    if (c.kind === 'group') acts = '<button class="btn btn-ghost btn-sm" data-act="group-add" data-id="' + esc(c.id) + '">' + ic('plus') + 'Add people</button><button class="icon-btn" data-act="group-del" data-id="' + esc(c.id) + '" title="Delete group" aria-label="Delete group">' + ic('trash') + '</button>';
    else if (c.kind === 'team' && canManage()) acts = '<button class="btn btn-ghost btn-sm" data-act="invite">' + ic('plus') + 'Add member</button>';
    var stack = c.kind === 'dm' ? '' : '<span class="avs mini">' + mem.slice(0, 5).map(function (x) { return av(mName(x), true); }).join('') + '</span>';
    return '<div class="tchat"><aside class="cl"><label class="cl-search">' + ic('search') + '<input id="chat-q" placeholder="Search chats" value="' + esc(ui.chatQ || '') + '" autocomplete="off" aria-label="Search chats"></label>' +
      '<div class="cl-list" id="chat-list">' + chatListHtml() + '</div>' +
      (canManage() ? '<button class="cl-add" data-act="invite"><span class="cl-add-ic">' + ic('qr') + '</span><span><b>Add team member</b><small>QR code, join code or email</small></span></button>' : '') + '</aside>' +
      '<section class="chat-pane"><header class="cp-h">' + chatIcon(c, true) + '<div class="cp-t"><b>' + esc(chatName(c)) + '</b><small>' + esc(sub) + '</small></div>' + stack + acts + '</header>' +
      '<div class="thread" data-thread-body="' + esc(c.id) + '">' + threadHtml(c) + '</div>' + composerHtml(c.id, true) + '</section></div>';
  }
  function inviteCard() {
    var w = ws(), code = wsCode(w), full = w.members.length >= plan().team;
    if (full) return '<div class="card inv-card"><b>All ' + plan().team + ' seats are used</b><p class="muted">Upgrade the plan to add more people.</p><button class="btn btn-primary btn-sm" data-go="plans">See plans</button></div>';
    return '<div class="card inv-card"><div class="sub-h">Invite with a QR code</div><div class="qr" id="qr-side"><span class="spin"></span></div>' +
      '<small class="muted">Or share this join code</small><div class="join-code sm">' + code.split('-').map(function (x) { return '<span>' + x + '</span>'; }).join('<i>–</i>') + '</div>' +
      '<div class="inv-acts"><button class="btn btn-ghost btn-sm" data-act="copy-code">' + ic('copy') + 'Copy code</button><button class="btn btn-ghost btn-sm" data-act="invite" data-id="email">' + ic('mail') + 'Email</button></div></div>';
  }
  function teamMembersHtml() {
    var w = ws(), mg = canManage(), own = isOwner(), seats = plan().team, used = w.members.length, act = activeMembers(w), pend = w.members.filter(function (m) { return m.pending; });
    var h = '<div class="tm-grid"><div class="tm-main"><div class="tm-bar"><b>' + used + ' of ' + seats + ' seat' + (seats === 1 ? '' : 's') + ' used</b><div class="meter"><i' + (used > seats ? ' class="over"' : '') + ' style="width:' + Math.min(100, used / seats * 100) + '%"></i></div>' +
      (own ? '<button class="btn btn-ghost btn-sm" data-act="team-new">' + ic('people') + 'Create team</button>' : '') + '</div>';
    h += '<div class="card members">' + act.map(function (m) {
      var editable = mg && !m.me && m.role !== 'Owner';
      return '<div class="mem" data-mid="' + m.id + '">' +
        (m.me ? '<button class="mem-ph" data-act="photo-up" title="Change your photo" aria-label="Change your photo">' + av(mName(m), false, 'xl') + '<span class="cam">' + ic('camera') + '</span></button>' : av(m.name, false, 'xl')) +
        '<div class="mem-id"><b>' + esc(mFull(m)) + (m.me ? '<span class="you">You</span>' : '') + '</b><small>' + esc(mEmail(m)) + '</small></div>' +
        '<div class="mem-job">' + (mg || m.me ? '<input class="input slim" data-member-field="job" value="' + esc(m.job || '') + '" placeholder="What does ' + esc(mName(m)) + ' do?" aria-label="What ' + esc(mName(m)) + ' does">' : '<span>' + esc(m.job || '—') + '</span>') + '</div>' +
        '<div class="mem-role">' + (editable ? '<select class="input slim" data-member-field="role" aria-label="Role of ' + esc(mName(m)) + '">' + ROLES.slice(1).map(function (r) { return '<option' + (r === m.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' : '<span class="role-pill r-' + m.role.toLowerCase() + '">' + m.role + '</span>') + '</div>' +
        '<div class="mem-acts">' + (!m.me ? '<button class="icon-btn" data-act="chat-open" data-id="' + esc(dmId(m.id)) + '" title="Message ' + esc(mName(m)) + '" aria-label="Message ' + esc(mName(m)) + '">' + ic('review') + '</button>' : '') +
          (editable && own ? '<button class="icon-btn" data-act="member-del" data-id="' + m.id + '" title="Remove from team" aria-label="Remove ' + esc(mName(m)) + ' from the team">' + ic('trash') + '</button>' : '') + '</div></div>';
    }).join('') + '</div>';
    if (pend.length) h += '<div class="sec-h">' + ic('mail') + '<span>Pending invites</span><span class="muted">' + pend.length + '</span></div><div class="card members">' + pend.map(function (m) {
      return '<div class="mem pending" data-mid="' + m.id + '">' + av(m.name, false, 'xl') + '<div class="mem-id"><b>' + esc(mFull(m)) + '</b><small>' + esc(m.email) + '</small></div><div class="mem-job"><span>Invited as ' + esc(m.role) + (m.job ? ' · ' + esc(m.job) : '') + '</span></div>' +
        '<div class="mem-role"><span class="role-pill">Pending</span></div><div class="mem-acts"><button class="icon-btn" data-act="inv-resend" data-id="' + m.id + '" title="Resend invite" aria-label="Resend invite">' + ic('send') + '</button><button class="icon-btn" data-act="member-del" data-id="' + m.id + '" title="Cancel invite" aria-label="Cancel invite">' + ic('x') + '</button></div></div>';
    }).join('') + '</div>';
    h += '<p class="roles-line">' + ROLES.map(function (r) { return '<span><span class="role-pill r-' + r.toLowerCase() + '">' + r + '</span>' + ROLE_INFO[r] + '</span>'; }).join('') + '</p></div>';
    return h + '<aside class="tm-side">' + (mg ? inviteCard() : '') + '</aside></div>';
  }
  function vTeam() {
    var w = ws(), tab = ui.teamTab || 'chat';
    return '<div class="view-head"><h1>' + esc(w.name) + '</h1><small>' + activeMembers(w).length + ' members · ' + esc(plan().name) + ' plan</small><span class="sp"></span>' +
      '<div class="seg txt big" role="tablist"><button class="' + (tab === 'chat' ? 'on' : '') + '" data-act="team-tab" data-id="chat" role="tab" aria-selected="' + (tab === 'chat') + '">' + ic('review') + 'Chats</button>' +
      '<button class="' + (tab === 'members' ? 'on' : '') + '" data-act="team-tab" data-id="members" role="tab" aria-selected="' + (tab === 'members') + '">' + ic('people') + 'Members</button></div></div>' +
      (tab === 'members' ? teamMembersHtml() : teamChatHtml());
  }
  function showTyping(cid, who) {
    var th = threadEl(cid); if (!th || th.querySelector('.typing')) return;
    var t = document.createElement('div'); t.className = 'msg typing'; t.innerHTML = av(who, true) + '<div class="bubble"><span class="dots"><i></i><i></i><i></i></span></div>';
    th.appendChild(t); th.scrollTop = th.scrollHeight;
  }
  function simulateReply(cid) {
    var c = chatById(cid); if (!c || ui.replying[cid]) return;
    var pool = chatMembers(c).filter(function (m) { return !m.me; }); if (!pool.length) return;
    var who = mName(pool[Math.floor(Math.random() * pool.length)]);
    ui.replying[cid] = true;
    setTimeout(function () { showTyping(cid, who); }, 800);
    setTimeout(function () {
      ui.replying[cid] = false;
      var e = { id: 'e' + uid(), who: who, at: Date.now(), text: REPLIES[Math.floor(Math.random() * REPLIES.length)], media: [] };
      c.entries.push(e);
      var open = route().v === 'team' && (ui.teamTab || 'chat') === 'chat' && ui.chatId === cid;
      if (!open) c.unread = (c.unread || 0) + 1;
      ui.freshEntry = e.id; save();
      if (open) paintThread(cid); else { var tp = threadEl(cid); if (tp) { var ty = tp.querySelector('.typing'); if (ty) ty.remove(); } }
      paintChatList(); renderSide(); renderTop();
    }, 2300 + Math.random() * 1200);
  }
  var qrLib = null;
  function loadQR() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (qrLib) return qrLib;
    qrLib = new Promise(function (resolve, reject) {
      var urls = ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'];
      (function next(i) {
        if (i >= urls.length) { qrLib = null; reject(new Error('QR library unavailable')); return; }
        var sc = document.createElement('script'); sc.src = urls[i]; sc.async = true;
        sc.onload = function () { if (window.qrcode) resolve(window.qrcode); else next(i + 1); };
        sc.onerror = function () { sc.remove(); next(i + 1); };
        document.head.appendChild(sc);
      })(0);
    });
    return qrLib;
  }
  function renderQR(el, text) {
    if (!el) return;
    loadQR().then(function (qrcode) {
      var q = qrcode(0, 'M'); q.addData(text); q.make();
      var n = q.getModuleCount(), d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
      el.innerHTML = '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="QR code to join ' + esc(ws().name) + '"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" rx="1.5" fill="#fff"/><path d="' + d + '" fill="#0d1b2f"/></svg>';
      el.classList.add('ready');
    }, function () { el.innerHTML = '<span class="qr-off">The QR code needs an internet connection. Share the join code instead.</span>'; });
  }
  function squarePhoto(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var sz = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas'), out = '';
        c.width = c.height = 256;
        try { c.getContext('2d').drawImage(img, (img.naturalWidth - sz) / 2, (img.naturalHeight - sz) / 2, sz, sz, 0, 0, 256, 256); out = c.toDataURL('image/jpeg', 0.85); } catch (e) { out = ''; }
        URL.revokeObjectURL(url); resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  }
  function saveUser() { try { localStorage.setItem(USER_KEY, JSON.stringify(USER)); return true; } catch (e) { toast('Browser storage is full, so this lasts only until you reload'); return false; } }

  /* ---------- calendar ---------- */
  var EV_TYPES = { delivery: 'Delivery', deadline: 'Finish date', payday: 'Pay day', shoot: 'Shoot', meeting: 'Review or meeting' };
  function wsEvents() {
    var ids = projects().map(function (p) { return p.id; });
    return S.events.filter(function (e) { return e.project ? ids.indexOf(e.project) > -1 : (e.ws || S.ws) === S.ws; });
  }
  function evById(id) { return S.events.filter(function (e) { return e.id === id; })[0]; }
  function byStart(a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; }
  function evSpan(e) { return !e.end || e.end === e.start ? fmtDay(e.start) : fmtDay(e.start) + ' – ' + fmtDay(e.end); }
  function evLine(e) {
    var p = e.project && project(e.project), d = e.start.split('-');
    var mon = new Date(+d[0], +d[1] - 1, +d[2]).toLocaleDateString('en-GB', { month: 'short' });
    return '<button class="evl" data-act="ev-edit" data-id="' + e.id + '"><span class="evd t-' + e.type + '"><b>' + (+d[2]) + '</b><small>' + mon + '</small></span>' +
      '<span class="grow"><b>' + esc(e.title) + '</b><small>' + EV_TYPES[e.type] + ' · ' + esc(evSpan(e)) + (p ? ' · ' + esc(p.name) : '') + '</small></span></button>';
  }
  function calItems() {
    var off = ui.calOff || {}, out = [];
    wsEvents().forEach(function (e) { if (!off[e.type]) out.push({ id: e.id, kind: 'ev', type: e.type, title: e.title, s: e.start, e: e.end || e.start, p: e.project }); });
    if (!off.task) wsTasks().forEach(function (t) { if (!t.done && t.due) out.push({ id: t.id, kind: 'task', type: 'task', title: t.text, s: t.due, e: t.due, p: t.project }); });
    return out;
  }
  function itemTip(it) { return it.title + ' · ' + (it.kind === 'task' ? 'Task due ' + fmtDay(it.s) : EV_TYPES[it.type] + ' · ' + (it.s === it.e ? fmtDay(it.s) : fmtDay(it.s) + ' – ' + fmtDay(it.e))); }
  function calMonth(items, y, mo) {
    var first = new Date(y, mo, 1, 12), lead = (first.getDay() + 6) % 7, start = new Date(y, mo, 1 - lead, 12);
    var weeks = Math.ceil((lead + new Date(y, mo + 1, 0).getDate()) / 7), td = today(), MAX = 3;
    var h = '<div class="month"><div class="cal-dow">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>';
    for (var w = 0; w < weeks; w++) {
      var ds = [];
      for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate() + w * 7 + i); ds.push(d); }
      var isos = ds.map(iso), a = isos[0], b = isos[6];
      var segs = items.filter(function (it) { return it.s <= b && it.e >= a; }).map(function (it) {
        var s0 = it.s < a ? a : it.s, e0 = it.e > b ? b : it.e;
        return { it: it, c0: isos.indexOf(s0), c1: isos.indexOf(e0), cl: it.s < a, cr: it.e > b };
      }).sort(function (x, z) { return x.c0 - z.c0 || (z.c1 - z.c0) - (x.c1 - x.c0) || (x.it.kind === 'task') - (z.it.kind === 'task'); });
      var lanes = [], hidden = [0, 0, 0, 0, 0, 0, 0];
      segs.forEach(function (sg) {
        var L = 0;
        while (lanes[L] && lanes[L].some(function (r) { return !(sg.c1 < r[0] || sg.c0 > r[1]); })) L++;
        (lanes[L] = lanes[L] || []).push([sg.c0, sg.c1]); sg.lane = L;
        if (L >= MAX) for (var k = sg.c0; k <= sg.c1; k++) hidden[k]++;
      });
      h += '<div class="wk"><div class="wk-bg">' + ds.map(function (dd, i2) {
        return '<button class="day' + (dd.getMonth() === mo ? '' : ' out') + (isos[i2] === td ? ' today' : '') + (i2 > 4 ? ' wkend' : '') + '" data-act="ev-new" data-id="' + isos[i2] + '" aria-label="Add an event on ' + esc(fmtDay(isos[i2])) + '">' +
          '<span class="dn">' + dd.getDate() + '</span><span class="day-add">' + ic('plus') + '</span>' + (hidden[i2] ? '<span class="more">+' + hidden[i2] + ' more</span>' : '') + '</button>';
      }).join('') + '</div><div class="wk-fg">' + segs.filter(function (sg) { return sg.lane < MAX; }).map(function (sg) {
        var it = sg.it;
        return '<button class="bar t-' + it.type + (it.kind === 'task' ? ' task' : '') + (sg.cl ? ' cl' : '') + (sg.cr ? ' cr' : '') + '" style="grid-column:' + (sg.c0 + 1) + ' / ' + (sg.c1 + 2) + ';grid-row:' + (sg.lane + 1) + ';--d:' + (w * 2 + sg.lane + sg.c0) + '" data-act="' + (it.kind === 'task' ? 'task-edit' : 'ev-edit') + '" data-id="' + it.id + '" title="' + esc(itemTip(it)) + '">' +
          (it.kind === 'task' ? ic('check') : '') + '<span>' + esc(it.title) + '</span></button>';
      }).join('') + '</div></div>';
    }
    return h + '</div>';
  }
  function calList(items, a, b, first) {
    var list = items.filter(function (it) { return it.s <= b && it.e >= a; }).sort(function (x, z) { return x.s < z.s ? -1 : x.s > z.s ? 1 : 0; }), td = today();
    if (!list.length) return '<div class="cal-empty">' + ic('cal') + '<b>Nothing planned in ' + first.toLocaleDateString('en-GB', { month: 'long' }) + '</b><span>Add a delivery window, a finish date or a pay day.</span><button class="btn btn-primary btn-sm" data-act="ev-new" data-id="">' + ic('plus') + 'New event</button></div>';
    var h = '<div class="agenda">', cur = '';
    list.forEach(function (it, n) {
      var day = it.s < a ? a : it.s;
      if (day !== cur) {
        var dd = day.split('-'), dt = new Date(+dd[0], +dd[1] - 1, +dd[2]);
        h += (cur ? '</div></div>' : '') + '<div class="ag-day' + (day === td ? ' today' : '') + (day < td ? ' past' : '') + '"><div class="ag-date"><b>' + dt.getDate() + '</b><small>' + dt.toLocaleDateString('en-GB', { weekday: 'short' }) + '</small></div><div class="ag-items">';
        cur = day;
      }
      var p = it.p && project(it.p);
      h += '<button class="ag-row t-' + it.type + '" data-act="' + (it.kind === 'task' ? 'task-edit' : 'ev-edit') + '" data-id="' + it.id + '" style="--d:' + n + '"><i class="lg"></i><span class="grow"><b>' + esc(it.title) + '</b><small>' + (it.kind === 'task' ? 'Task due' : EV_TYPES[it.type]) + (p ? ' · ' + esc(p.name) : '') + '</small></span>' +
        '<span class="ag-when">' + (it.s === it.e ? (day === td ? 'Today' : 'All day') : esc(fmtDay(it.s) + ' – ' + fmtDay(it.e))) + '</span>' + ic('chevR') + '</button>';
    });
    return h + '</div></div></div>';
  }
  function vCalendar() {
    var ym = ui.calMonth || today().slice(0, 7), y = +ym.slice(0, 4), mo = +ym.slice(5, 7) - 1, mode = ui.calView || 'month', off = ui.calOff || {};
    var first = new Date(y, mo, 1, 12), mStart = iso(first), mEnd = iso(new Date(y, mo + 1, 0, 12));
    var items = calItems(), n = items.filter(function (it) { return it.s <= mEnd && it.e >= mStart; }).length;
    var h = '<div class="cal"><div class="cal-top"><div class="cal-title"><h1>' + first.toLocaleDateString('en-GB', { month: 'long' }) + ' <span>' + y + '</span></h1><small>' + n + ' item' + (n === 1 ? '' : 's') + '</small></div>' +
      '<div class="cal-ctrls"><div class="seg txt"><button class="' + (mode === 'month' ? 'on' : '') + '" data-act="cal-view" data-id="month">Month</button><button class="' + (mode === 'list' ? 'on' : '') + '" data-act="cal-view" data-id="list">List</button></div>' +
      '<div class="cal-arrows"><button class="icon-btn" data-act="cal-nav" data-id="-1" aria-label="Previous month">' + ic('back') + '</button><button class="btn btn-ghost btn-sm" data-act="cal-today">Today</button><button class="icon-btn" data-act="cal-nav" data-id="1" aria-label="Next month">' + ic('arrow') + '</button></div></div></div>';
    h += '<div class="cal-filters" role="group" aria-label="Show types">' + Object.keys(EV_TYPES).concat(['task']).map(function (k) {
      return '<button class="cf t-' + k + (off[k] ? ' off' : '') + '" data-act="cal-filter" data-id="' + k + '" aria-pressed="' + !off[k] + '"><i class="lg"></i>' + (k === 'task' ? 'Task due' : EV_TYPES[k]) + '</button>';
    }).join('') + '</div>';
    h += '<div class="cal-body' + (ui.calDir ? (ui.calDir > 0 ? ' from-r' : ' from-l') : '') + '">' + (mode === 'list' ? calList(items, mStart, mEnd, first) : calMonth(items, y, mo)) + '</div></div>';
    ui.calDir = 0;
    return h;
  }

  /* ---------- search ---------- */
  function searchItems(q) {
    q = q.trim().toLowerCase();
    var out = [], ps = projects();
    function hit(x) { return String(x || '').toLowerCase().indexOf(q) > -1; }
    if (!q) {
      out.push({ g: 'Quick actions', ic: 'folder', t: 'New project', s: 'Start a client project', act: 'new-project' },
        { g: 'Quick actions', ic: 'tasks', t: 'New task', s: 'Into My Tasks or a project', act: 'task-new' },
        { g: 'Quick actions', ic: 'notes', t: 'New note', s: 'Write, add images and videos', act: 'note-new' },
        { g: 'Quick actions', ic: 'cal', t: 'New event', s: 'Delivery, finish date, pay day', act: 'ev-new' });
      ps.slice(0, 5).forEach(function (p) { out.push({ g: 'Recent projects', ic: 'folder', t: p.name, s: client(p.client).name, go: 'p/' + p.id }); });
      return out;
    }
    ps.forEach(function (p) { if (hit(p.name) || hit(client(p.client).name)) out.push({ g: 'Projects', ic: 'folder', t: p.name, s: client(p.client).name + ' · ' + p.files.length + ' files', go: 'p/' + p.id }); });
    ps.forEach(function (p) { p.files.forEach(function (f) { if (hit(f.name)) out.push({ g: 'Files', ic: f.kind === 'video' ? 'film' : 'file', t: f.name, s: p.name + ' · v' + f.version, go: 'f/' + p.id + '/' + f.id }); }); });
    wsTasks().forEach(function (t) { if (hit(t.text)) out.push({ g: 'Tasks', ic: 'tasks', t: t.text, s: taskLoc(t) + (t.due ? ' · ' + fmtDay(t.due) : '') + (t.done ? ' · done' : ''), act: 'task-edit', id: t.id }); });
    wsNotes().forEach(function (n) { if (hit(n.title) || n.entries.some(function (e) { return hit(e.text); })) out.push({ g: 'Notes', ic: 'notes', t: n.title, s: noteLoc(n) + ' · ' + (noteExcerpt(n) || 'No messages yet'), act: 'note-open', id: n.id }); });
    wsEvents().forEach(function (e) { if (hit(e.title) || hit(EV_TYPES[e.type])) out.push({ g: 'Calendar', ic: 'cal', t: e.title, s: EV_TYPES[e.type] + ' · ' + evSpan(e), act: 'ev-edit', id: e.id }); });
    ws().members.forEach(function (m) { if (hit(mFull(m)) || hit(m.job) || hit(m.role)) out.push({ g: 'Team', ic: 'people', t: mFull(m), s: m.role + (m.job ? ' · ' + m.job : ''), member: m.id }); });
    clients().forEach(function (c) { if (hit(c.name)) out.push({ g: 'Clients', ic: 'people', t: c.name, s: 'Client · ' + c.contact, go: 'c/' + c.id }); });
    return out.slice(0, 40);
  }
  function markHit(t) {
    var q = (ui.sq || '').trim(); if (!q) return esc(t);
    var i = t.toLowerCase().indexOf(q.toLowerCase());
    return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length));
  }
  function searchResultsHtml() {
    var items = ui.sres = searchItems(ui.sq || ''), g = '', h = '';
    if (!items.length) return '<div class="sr-empty">Nothing matches “' + esc(ui.sq) + '”.</div>';
    if (ui.si >= items.length) ui.si = items.length - 1;
    items.forEach(function (it, i) {
      if (it.g !== g) { h += '<div class="sr-g">' + it.g + '</div>'; g = it.g; }
      h += '<button class="sr' + (i === ui.si ? ' on' : '') + '" data-act="sr-go" data-id="' + i + '"><span class="sr-ic">' + ic(it.ic) + '</span><span class="grow"><b>' + markHit(it.t) + '</b><small>' + esc(it.s) + '</small></span>' + (i === ui.si ? '<kbd>Enter</kbd>' : '') + '</button>';
    });
    return h;
  }
  function openSearch() { ui.sq = ''; ui.si = 0; ui.modal = 'search'; renderModal(); }
  function srGo(i) {
    var it = (ui.sres || [])[i]; if (!it) return;
    ui.modal = null; renderModal();
    if (it.go) go(it.go);
    else if (it.member) { var mm = memberById(it.member); ui.teamTab = mm && mm.me ? 'members' : 'chat'; if (mm && !mm.me) ui.chatId = dmId(mm.id); route().v === 'team' ? renderView() : go('team'); }
    else if (it.act) act(it.act, it.id || '', document.body, { target: null });
  }

  function vPlans() {
    var w = ws(), st = store(w), cur = plan(), circ = 2 * Math.PI * 34;
    var h = '<div class="view-head"><h1>Plans</h1><small>Monthly. Pick by storage and by how many people work inside.</small></div>';
    h += '<div class="card usage"><svg class="uring" viewBox="0 0 84 84" aria-hidden="true"><circle class="trk" cx="42" cy="42" r="34" fill="none" stroke-width="7"/><circle class="val' + (st.over ? ' over' : '') + '" cx="42" cy="42" r="34" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (circ * st.pct / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 42 42)"/><text x="42" y="47" text-anchor="middle" data-count="' + st.pct + '" data-suffix="%">' + st.pct + '%</text></svg>' +
      '<div class="u-t"><small>Storage in ' + esc(w.name) + '</small><b>' + esc(st.txt) + '</b><span class="muted">' + esc(st.free) + '</span></div>' +
      '<div class="u-t"><small>Your plan</small><b>' + esc(cur.name) + '</b><span class="muted">' + cur.price + ' per month</span></div>' +
      '<div class="u-t"><small>Seats</small><b>' + w.members.length + ' of ' + cur.team + '</b><span class="muted">' + S.workspaces.length + ' of ' + cur.ws + ' team' + (cur.ws === 1 ? '' : 's') + '</span></div></div>';
    h += '<div class="plan-grid">' + PLANS.map(function (p, i) {
      var on = p.id === cur.id, rec = p.id === 'team', val = parseFloat(p.price.replace('€', '')), from = val ? Math.round(val * 1.7) + 0.99 : 9;
      return '<div class="card plan-card' + (on ? ' cur' : '') + (rec ? ' recd' : '') + '">' + (rec ? '<span class="rec">Recommended</span>' : '') +
        '<h3>' + p.name + (on ? '<span class="now">Current</span>' : '') + '</h3><p class="for">' + p.f + '</p>' +
        '<div class="price"><span data-count="' + val + '" data-from="' + from + '" data-fmt="eur" data-dur="1100" data-delay="' + (i * 90) + '">' + p.price + '</span><small>per month</small></div>' +
        '<ul><li>' + ic('check') + gb(p.gb) + ' storage</li><li>' + ic('check') + (p.ws > 1 ? 'Up to ' + p.ws + ' teams' : 'Personal space') + '</li>' + (p.team > 1 ? '<li>' + ic('check') + 'Up to ' + p.team + ' people</li>' : '<li>' + ic('check') + 'Just you</li>') + '</ul>' +
        (on ? '<button class="btn btn-ghost btn-sm" disabled>Your plan</button>' : '<button class="btn ' + (rec ? 'btn-primary' : 'btn-ghost') + ' btn-sm" data-act="plan-set" data-id="' + p.id + '">' + (i > PLANS.indexOf(cur) ? 'Upgrade' : 'Switch') + ' to ' + p.name + '</button>') + '</div>';
    }).join('') + '</div><p class="muted" style="margin-top:16px;max-width:640px">Clients review by link and don\'t take a seat. This is a demo, so switching plans does not charge anything.</p>';
    return h;
  }

  function relWhen(t) {
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return m + ' min ago';
    if (iso(new Date(t)) === today()) return Math.round(m / 60) + ' h ago';
    return shortWhen(t);
  }
  function actLi(a) { return '<li>' + av(a.who) + '<span><span><b>' + esc(a.who) + '</b> ' + esc(a.text) + '</span><small>' + esc(a.at ? relWhen(a.at) : a.when) + '</small></span></li>'; }

  function vActivity() {
    var h = '<div class="view-head"><h1>Activity</h1><small>Uploads, comments and approvals</small></div>';
    if (!projects().length || !S.activity.length) return h + '<div class="empty"><b>No activity yet</b>Uploads, comments and approvals in this workspace show up here.</div>';
    return h + '<div class="card pad narrow"><ul class="act">' + S.activity.map(actLi).join('') + '</ul></div>';
  }

  function vAccount() {
    var w = ws(), st = store(w), pl = plan();
    return '<div class="narrow"><div class="profile"><button class="mem-ph" data-act="photo-up" title="Change your photo" aria-label="Change your photo">' + av(ME, false, 'xxl') + '<span class="cam">' + ic('camera') + '</span></button>' +
      '<div><h1>' + esc(USER.name) + '</h1><small>' + esc(USER.email) + (myMember() ? ' · ' + esc(myMember().role) + ' in ' + esc(ws().name) : '') + '</small>' +
      '<div class="ph-btns"><button class="btn btn-ghost btn-sm" data-act="photo-up">' + ic('camera') + (USER.photo ? 'Change photo' : 'Add a photo') + '</button>' + (USER.photo ? '<button class="btn btn-ghost btn-sm" data-act="photo-del">Remove</button>' : '') + '</div></div></div>' +
      '<div class="group"><h2>Profile</h2><form class="card fields" data-form="profile"><div><label for="ac-name">Full name</label><input class="input" id="ac-name" name="name" value="' + esc(USER.name) + '" required autocomplete="name"></div><div><label for="ac-email">Email</label><input class="input" id="ac-email" name="email" type="email" value="' + esc(USER.email) + '" required autocomplete="email"></div><div class="foot"><button class="btn btn-primary btn-sm" type="submit">Save changes</button></div></form></div>' +
      '<div class="group"><h2>Plan and storage</h2><div class="card"><div class="kv"><span><b>' + esc(pl.name) + ' plan</b><small>' + pl.price + ' per month · ' + gb(pl.gb) + ' storage</small></span><button class="btn btn-ghost btn-sm" data-go="plans">Change plan</button></div><div class="kv"><span><b>Storage</b><small>' + esc(st.txt) + ' in ' + esc(w.name) + '</small></span><div class="meter"><i' + (st.over ? ' class="over"' : '') + ' style="width:' + st.pct + '%"></i></div></div></div></div>' +
      '<div class="group"><h2>Workspaces</h2><div class="card">' + S.workspaces.map(function (x) {
        return '<div class="kv"><span style="display:flex;align-items:center;gap:10px"><span class="ws-ic ' + (x.cls || '') + '">' + x.letter + '</span><span><b>' + esc(x.name) + '</b><small>' + x.members.length + ' members</small></span></span>' + (x.id === S.ws ? '<span class="muted">Current</span>' : '<button class="btn btn-ghost btn-sm" data-act="ws-set" data-id="' + x.id + '">Switch</button>') + '</div>';
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
    h += '<div class="tabs">' + [['files', 'Files', p.files.length], ['tasks', 'Tasks', tasks.length], ['notes', 'Notes', notesOf(p.id).length], ['activity', 'Activity', ''], ['delivery', 'Delivery', approved.length]].map(function (t) {
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
      var po = tasks.filter(function (t) { return !t.done; }).sort(byDue);
      h += '<div class="card list">' + (po.length ? po.map(function (t) { return taskRow(t, false); }).join('') : '<div class="empty-sm">No open tasks in this project.</div>') + quickAdd(p.id, 'date') + '</div>' +
        doneBlock(tasks.filter(function (t) { return t.done; }));
    } else if (tab === 'notes') {
      h += '<div class="ngrid">' + notesOf(p.id).map(nCard).join('') + addNoteTile(p.id) + '</div>';
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
    view.classList.toggle('fill', r.v === 'home' || r.v === 'team' || r.v === 'calendar');
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
      else if (r.v === 'notes') h = vNotes();
      else if (r.v === 'calendar') h = vCalendar();
      else if (r.v === 'team') h = vTeam();
      else if (r.v === 'activity') h = vActivity();
      else if (r.v === 'plans') h = vPlans();
      else if (r.v === 'account') h = vAccount();
      else h = vHome();
    }
    view.innerHTML = h;
    ui.freshTask = '';
    if (r.v === 'team' && (ui.teamTab || 'chat') === 'chat') bindChat($('.chat-pane'), ui.chatId, true);
    if (r.v === 'team' && ui.teamTab === 'members') renderQR($('#qr-side'), joinUrl());
    if (r.v === 'f') bindReview();
    if (r.v === 'p') bindDrop();
  }
  var shownModal = '';
  function renderModal() {
    if (!ui.modal) {
      var old = $('#layer .scrim'); shownModal = '';
      if (old && !reduceMotion) { old.classList.remove('anim'); old.classList.add('out'); setTimeout(function () { if (!ui.modal) $('#layer').innerHTML = ''; }, 220); }
      else $('#layer').innerHTML = '';
      return;
    }
    var m = ui.modal, h = '', key = m ? m + ':' + (ui.noteId || '') + ':' + (ui.taskId || '') + ':' + (ui.evId || '') : '', anim = !!m && key !== shownModal;
    shownModal = key;
    var cancel = '<button class="btn btn-ghost btn-sm" type="button" data-act="close-modal" data-force="1">Cancel</button>';
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
    } else if (m === 'task') {
      var tk = ui.taskId ? taskById(ui.taskId) : null, tLoc = tk ? tk.project : (ui.preset || ''), tDue = tk ? (tk.due || '') : '';
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="task-full" role="dialog" aria-modal="true" aria-label="' + (tk ? 'Edit task' : 'New task') + '"><h3>' + (tk ? 'Edit task' : 'New task') + '</h3>' +
        '<label for="tf-text">Task</label><input class="input" id="tf-text" name="text" required autocomplete="off" placeholder="e.g. Export the 9x16 teaser" value="' + esc(tk ? tk.text : '') + '">' +
        '<div class="two"><div><label for="tf-loc">Location</label><select class="input" id="tf-loc" name="loc">' + locOptions(tLoc, 'My Tasks') + '</select></div>' +
        '<div><label for="tf-due">Due date</label><input class="input" id="tf-due" name="due" type="date" value="' + esc(tDue) + '"></div></div>' +
        '<div class="qd" role="group" aria-label="Quick dates">' + [['0', 'Today'], ['1', 'Tomorrow'], ['7', 'In a week'], ['', 'No date']].map(function (x) {
          var on = x[0] === '' ? !tDue : tDue === dayOffset(+x[0]);
          return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="qd" data-id="' + x[0] + '">' + x[1] + '</button>';
        }).join('') + '</div>' +
        '<p class="hint">' + ic('inbox') + 'Pick My Tasks when it doesn\'t belong to a project.</p>' +
        '<div class="foot">' + (tk ? '<button class="btn btn-danger btn-sm" type="button" data-act="task-del" data-id="' + tk.id + '" style="margin-right:auto">Delete</button>' : '') + cancel +
        '<button class="btn btn-primary btn-sm" type="submit">' + (tk ? 'Save' : 'Add task') + '</button></div></form></div>';
    } else if (m === 'note-new') {
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="note-new" role="dialog" aria-modal="true" aria-label="New note"><h3>New note</h3>' +
        '<label for="nn-title">Title</label><input class="input" id="nn-title" name="title" autocomplete="off" maxlength="80" placeholder="e.g. Frames for the vertical cut">' +
        '<div class="two"><div><label for="nn-loc">Location</label><select class="input" id="nn-loc" name="loc">' + locOptions(ui.preset || '', 'My Notes') + '</select></div>' +
        '<div><label for="nn-date">Date</label><input class="input" id="nn-date" name="date" type="date" value="' + today() + '"></div></div>' +
        '<p class="hint">' + ic('clip') + 'The note opens like a chat. Write in it and attach images or videos.</p>' +
        '<div class="foot">' + cancel + '<button class="btn btn-primary btn-sm" type="submit">Create note</button></div></form></div>';
    } else if (m === 'note') {
      var nObj = noteById(ui.noteId);
      if (nObj) h = '<div class="scrim chat-scrim" data-act="close-modal"><div class="modal chat" id="chat" role="dialog" aria-modal="true" aria-label="' + esc(nObj.title) + '">' +
        chatHead(nObj) + '<div class="thread" data-thread-body="' + nObj.id + '">' + threadHtml(nObj) + '</div>' + composerHtml(nObj.id, false) + '</div></div>';
      ui.freshEntry = '';
    } else if (m === 'ev') {
      var ev = ui.evId ? evById(ui.evId) : null, eS = ev ? ev.start : (ui.preset || today()), eE = ev ? (ev.end || ev.start) : eS, eT = ev ? ev.type : (ui.evType || 'delivery'), eP = ev ? ev.project : '';
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="ev" role="dialog" aria-modal="true" aria-label="' + (ev ? 'Edit event' : 'New event') + '"><h3>' + (ev ? 'Edit event' : 'New event') + '</h3>' +
        '<label>Type</label><div class="types" role="radiogroup" aria-label="Type">' + Object.keys(EV_TYPES).map(function (k) {
          return '<label class="type-chip t-' + k + '"><input type="radio" name="type" value="' + k + '"' + (k === eT ? ' checked' : '') + '><span><i class="lg"></i>' + EV_TYPES[k] + '</span></label>';
        }).join('') + '</div>' +
        '<label for="ev-title">Title</label><input class="input" id="ev-title" name="title" required autocomplete="off" placeholder="e.g. Northline delivery window" value="' + esc(ev ? ev.title : '') + '">' +
        '<label for="ev-proj">Project</label><select class="input" id="ev-proj" name="project">' + locOptions(eP, 'No project') + '</select>' +
        '<div class="two"><div><label for="ev-s">From</label><input class="input" id="ev-s" name="start" type="date" required value="' + eS + '"></div><div><label for="ev-e">To</label><input class="input" id="ev-e" name="end" type="date" value="' + eE + '"></div></div>' +
        '<p class="hint">' + ic('cal') + 'Use From and To for a delivery window. Keep one day for a finish date or a pay day.</p>' +
        '<div class="foot">' + (ev ? '<button class="btn btn-danger btn-sm" type="button" data-act="ev-del" data-id="' + ev.id + '" style="margin-right:auto">Delete</button>' : '') + cancel +
        '<button class="btn btn-primary btn-sm" type="submit">' + (ev ? 'Save' : 'Add event') + '</button></div></form></div>';
    } else if (m === 'invite') {
      var w0 = ws(), full = w0.members.length >= plan().team, tab = ui.invTab || 'qr', code = wsCode(w0);
      var tabs = [['qr', 'qr', 'QR code'], ['link', 'link', 'Link'], ['email', 'mail', 'Email']];
      h = '<div class="scrim" data-act="close-modal"><div class="modal invite" role="dialog" aria-modal="true" aria-label="Add team member">' +
        '<div class="inv-head"><div><h3>Add people to ' + esc(w0.name) + '</h3><small class="muted">' + w0.members.length + ' of ' + plan().team + ' seats used on the ' + esc(plan().name) + ' plan</small></div><button class="icon-btn" data-act="close-modal" data-force="1" aria-label="Close">' + ic('x') + '</button></div>';
      if (full) h += '<div class="inv-full">' + ic('alert') + '<b>All seats are used</b><p>Upgrade the plan to add more people, or remove someone first.</p><button class="btn btn-primary btn-sm" data-go="plans">See plans</button></div></div></div>';
      else {
        h += '<div class="seg txt big inv-tabs" role="tablist">' + tabs.map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" data-act="inv-tab" data-id="' + t[0] + '" role="tab" aria-selected="' + (tab === t[0]) + '">' + ic(t[1]) + t[2] + '</button>'; }).join('') + '</div>';
        if (tab === 'qr') h += '<div class="inv-qr"><div class="qr big" id="qr-modal"><span class="spin"></span></div><div class="inv-qr-t"><b>Scan to join</b><p>Point a phone camera at the code. It opens Deskspace with the invite to ' + esc(w0.name) + '. New people join as Editor; change it in Members.</p></div></div>' +
          '<div class="code-box"><small>Or enter this code in Deskspace</small><div class="join-code">' + code.split('-').map(function (x) { return '<span>' + x + '</span>'; }).join('<i>–</i>') + '</div>' +
          '<div class="code-acts"><button class="btn btn-ghost btn-sm" data-act="copy-code">' + ic('copy') + 'Copy code</button>' + (isOwner() ? '<button class="btn btn-ghost btn-sm" data-act="new-code">New code</button>' : '') + '</div></div>';
        else if (tab === 'link') h += '<div class="inv-link"><label>Invite link</label><div class="linkbox">' + ic('link') + '<span>' + esc(joinUrl()) + '</span><button data-act="copy-link" aria-label="Copy link">' + ic('copy') + '</button></div><p class="hint">' + ic('key') + 'Anyone with the link can ask to join. Make a new code to turn the old link off.</p></div>';
        else h += '<form class="inv-email" data-form="invite"><div class="two"><div><label for="iv-name">Full name</label><input class="input" id="iv-name" name="name" required autocomplete="off" placeholder="e.g. Nina Petrov"></div>' +
          '<div><label for="iv-email">Email</label><input class="input" id="iv-email" name="email" type="email" required autocomplete="off" placeholder="nina@studio.com"></div></div>' +
          '<div class="two"><div><label for="iv-role">Role</label><select class="input" id="iv-role" name="role">' + ROLES.slice(1).map(function (r) { return '<option' + (r === 'Editor' ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></div>' +
          '<div><label for="iv-job">What they do</label><input class="input" id="iv-job" name="job" autocomplete="off" placeholder="e.g. Sound design"></div></div>' +
          '<div class="foot"><span class="muted" style="margin-right:auto">This demo sends no email.</span><button class="btn btn-primary btn-sm" type="submit">' + ic('send') + 'Send invite</button></div></form>';
        h += '</div></div>';
      }
    } else if (m === 'join') {
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="join" role="dialog" aria-modal="true" aria-label="Join a team"><h3>Join a team</h3>' +
        '<label for="jn-code">Join code</label><input class="input code-in" id="jn-code" name="code" required autocomplete="off" placeholder="ABC-123-XYZ" maxlength="11">' +
        '<p class="hint">' + ic('qr') + 'Ask the team owner for the code, or scan their QR code with your phone.</p>' +
        '<div class="foot">' + cancel + '<button class="btn btn-primary btn-sm" type="submit">Join</button></div></form></div>';
    } else if (m === 'group-new' || m === 'group-add') {
      var gc = m === 'group-add' ? chatById(ui.groupId) : null, pick = activeMembers().filter(function (x) { return !x.me && (!gc || gc.members.indexOf(x.id) < 0); });
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="' + m + '" role="dialog" aria-modal="true" aria-label="' + (gc ? 'Add people' : 'New group') + '"><h3>' + (gc ? 'Add people to ' + esc(gc.name) : 'New group') + '</h3>' +
        (gc ? '' : '<label for="gn-name">Group name</label><input class="input" id="gn-name" name="name" required autocomplete="off" placeholder="e.g. Forma shoot">') +
        '<label>' + (gc ? 'People' : 'Members') + '</label><div class="pick">' + (pick.length ? pick.map(function (x) {
          return '<label class="pick-row"><input type="checkbox" name="m" value="' + x.id + '">' + av(x.name, true) + '<span><b>' + esc(mFull(x)) + '</b><small>' + esc(x.role + (x.job ? ' · ' + x.job : '')) + '</small></span><i class="tick">' + ic('check') + '</i></label>';
        }).join('') : '<div class="empty-sm">Everyone is already in this group.</div>') + '</div>' +
        '<div class="foot">' + cancel + '<button class="btn btn-primary btn-sm" type="submit">' + (gc ? 'Add' : 'Create group') + '</button></div></form></div>';
    } else if (m === 'team-new') {
      var canNew = S.workspaces.length < plan().ws;
      h = '<div class="scrim" data-act="close-modal"><form class="modal" data-form="team-new" role="dialog" aria-modal="true" aria-label="Create team"><h3>Create a team</h3>' +
        (canNew ? '<label for="tn-name">Team name</label><input class="input" id="tn-name" name="name" required autocomplete="off" placeholder="e.g. Halden Social">' +
          '<p class="hint">' + ic('people') + 'You will be the owner. Invite people and give them roles after it is created. ' + S.workspaces.length + ' of ' + plan().ws + ' teams on the ' + esc(plan().name) + ' plan.</p>' +
          '<div class="foot">' + cancel + '<button class="btn btn-primary btn-sm" type="submit">Create team</button></div>' :
          '<p class="hint">' + ic('alert') + 'The ' + esc(plan().name) + ' plan includes ' + plan().ws + ' team' + (plan().ws === 1 ? '' : 's') + ' and all are in use. Team gives you 2, Agency gives you 5.</p><div class="foot">' + cancel + '<button class="btn btn-primary btn-sm" type="button" data-go="plans">See plans</button></div>') + '</form></div>';
    } else if (m === 'share-note') {
      var sn = wsNotes().sort(byRecent);
      h = '<div class="scrim" data-act="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-label="Share a note"><h3>Share a note in the chat</h3><div class="share-list">' +
        (sn.length ? sn.map(function (n) { return nLine(n, 'share-pick'); }).join('') : '<div class="empty-sm">No notes yet. Create one first.</div>') + '</div><div class="foot">' + cancel + '</div></div></div>';
    } else if (m === 'search') {
      h = '<div class="scrim at-top" data-act="close-modal"><div class="modal finder" role="dialog" aria-modal="true" aria-label="Search"><div class="sr-in">' + ic('search') +
        '<input id="sq" type="search" placeholder="Search projects, files, tasks, notes, people…" autocomplete="off" value="' + esc(ui.sq || '') + '" aria-label="Search"><kbd>Esc</kbd></div>' +
        '<div class="sr-list" id="sres">' + searchResultsHtml() + '</div></div></div>';
    }
    if (anim) h = h.replace('class="scrim', 'class="scrim anim');
    $('#layer').innerHTML = h;
    if (m === 'note') bindChat($('#chat'), ui.noteId, anim);
    else if (m === 'invite' && (ui.invTab || 'qr') === 'qr') renderQR($('#qr-modal'), joinUrl());
    if (m === 'note' || m === 'invite') { /* focus handled above */ }
    else { var first = $('#layer input:not([type=file]):not([type=date])'); if (first) first.focus(); }
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
      case 'note-del':
        var dn = noteById(id || ui.noteId);
        if (dn && confirm('Delete “' + dn.title + '” and everything in it?')) {
          S.notes = S.notes.filter(function (n) { return n.id !== dn.id; }); save();
          ui.modal = null; renderModal(); renderView(); renderSide(); toast('Note deleted');
        }
        break;
      case 'note-new': ui.modal = 'note-new'; ui.preset = id || ''; renderModal(); break;
      case 'note-open': ui.modal = 'note'; ui.noteId = id; ui.pend[id] = []; renderModal(); break;
      case 'note-attach': ui.attachFor = el.closest('form').getAttribute('data-thread'); notePicker.click(); break;
      case 'pend-del': var pf = el.closest('[data-pend]').getAttribute('data-pend'); ui.pend[pf] = pendOf(pf).filter(function (m) { return m.id !== id; }); paintPending(pf); break;
      case 'lb':
        var tb = el.closest('[data-thread-body]'), tid = tb && tb.getAttribute('data-thread-body'), ln = tid && threadById(tid);
        var li = ln ? noteMedia(ln).map(function (m) { return m.id; }).indexOf(id) : -1;
        if (li > -1) { ui.lb = { t: tid, i: li }; renderLb(); }
        break;
      case 'lb-nav': lbStep(parseInt(id, 10)); break;
      case 'lb-close': if (ev.target === el || el.getAttribute('data-force')) { ui.lb = null; renderLb(); } break;
      case 'search': openSearch(); break;
      case 'sr-go': srGo(parseInt(id, 10)); break;
      case 'team-tab': ui.teamTab = id; if (route().v === 'team') { renderView(); } else go('team'); break;
      case 'chat-open': ui.bell = false; ui.teamTab = 'chat'; ui.chatId = id; if (route().v === 'team') { renderView(); renderSide(); renderTop(); } else go('team'); break;
      case 'invite': ui.modal = 'invite'; ui.invTab = id === 'email' ? 'email' : (ui.invTab || 'qr'); renderModal(); break;
      case 'inv-tab': ui.invTab = id; renderModal(); break;
      case 'copy-code': copyText(wsCode(), 'Join code copied'); break;
      case 'copy-link': copyText(joinUrl(), 'Invite link copied'); break;
      case 'new-code': ws().code = genCode(); save(); renderModal(); if (route().v === 'team') renderView(); toast('New join code made. The old code no longer works.'); break;
      case 'inv-resend': var ir = memberById(id); if (ir) toast('Invite sent again to ' + ir.email + ' (demo)'); break;
      case 'join': ui.modal = 'join'; renderModal(); break;
      case 'group-new': ui.modal = 'group-new'; renderModal(); break;
      case 'group-add': ui.modal = 'group-add'; ui.groupId = id; renderModal(); break;
      case 'group-del':
        var gd = chatById(id);
        if (gd && confirm('Delete the group “' + gd.name + '” and its messages?')) { S.chats = S.chats.filter(function (c) { return c.id !== id; }); ui.chatId = teamChatId(); save(); renderView(); toast('Group deleted'); }
        break;
      case 'back': goBack(); break;
      case 'bell': ui.bell = !ui.bell; renderTop(); break;
      case 'bell-read': S.seenAt = Date.now(); S.chats.forEach(function (c) { if (c.ws === S.ws) c.unread = 0; }); save(); renderTop(); renderSide(); paintChatList(); break;
      case 'cal-view': ui.calView = id; renderView(); animBody(); break;
      case 'cal-filter': ui.calOff[id] = !ui.calOff[id]; renderView(); break;
      case 'team-new': ui.modal = 'team-new'; renderModal(); break;
      case 'member-del':
        var md = memberById(id);
        if (md && confirm('Remove ' + mFull(md) + ' from ' + ws().name + '?')) {
          ws().members = ws().members.filter(function (m) { return m.id !== id; });
          S.chats = S.chats.filter(function (c) { return c.id !== dmId(id); });
          log(ME, 'removed ' + mFull(md) + ' from the team'); save(); renderView(); renderSide(); toast(mFull(md) + ' was removed');
        }
        break;
      case 'share-note': ui.shareFor = el.closest('form').getAttribute('data-thread'); ui.modal = 'share-note'; renderModal(); break;
      case 'share-pick':
        var sc = threadById(ui.shareFor), sNote = noteById(id);
        if (sc && sNote) {
          var se = { id: 'e' + uid(), who: ME, at: Date.now(), text: '', media: [], noteRef: id };
          sc.entries.push(se); ui.freshEntry = se.id; save();
          ui.modal = null; renderModal(); paintThread(ui.shareFor); paintChatList(); toast('Shared “' + sNote.title + '” in the chat'); simulateReply(ui.shareFor);
        }
        break;
      case 'photo-up': photoPicker.click(); break;
      case 'photo-del': delete USER.photo; saveUser(); render(); toast('Photo removed'); break;
      case 'ev-new': ui.modal = 'ev'; ui.evId = ''; ui.evType = ''; ui.preset = id || today(); renderModal(); break;
      case 'ev-type-new': ui.modal = 'ev'; ui.evId = ''; ui.evType = id; ui.preset = today(); renderModal(); break;
      case 'ev-edit': ui.modal = 'ev'; ui.evId = id; renderModal(); break;
      case 'ev-del':
        var de = evById(id); S.events = S.events.filter(function (e) { return e.id !== id; });
        closeModal(); save(); renderView(); if (de) toast('Deleted: ' + de.title);
        break;
      case 'cal-nav':
        var cm0 = (ui.calMonth || today().slice(0, 7)).split('-'), cd = new Date(+cm0[0], +cm0[1] - 1 + parseInt(id, 10), 1, 12);
        ui.calMonth = iso(cd).slice(0, 7); ui.calDir = parseInt(id, 10); renderView(); animBody(); break;
      case 'cal-today': ui.calDir = (ui.calMonth || today().slice(0, 7)) < today().slice(0, 7) ? 1 : -1; ui.calMonth = ''; renderView(); animBody(); break;
      case 'task-new': ui.modal = 'task'; ui.taskId = ''; ui.preset = id || ''; renderModal(); break;
      case 'task-edit': ui.modal = 'task'; ui.taskId = id; renderModal(); break;
      case 'task-del':
        var dt = taskById(id); S.tasks = S.tasks.filter(function (t) { return t.id !== id; });
        closeModal(); afterTasks(); if (dt) toast('Deleted: ' + dt.text);
        break;
      case 'qd':
        var qf = el.closest('form'); if (qf && qf.elements.due) qf.elements.due.value = id === '' ? '' : dayOffset(parseInt(id, 10));
        [].forEach.call(el.parentNode.children, function (b) { b.classList.toggle('on', b === el); });
        break;
      case 'plan-set':
        if (id !== S.plan) { S.plan = id; save(); render(); toast('You are now on the ' + plan().name + ' plan (demo, nothing is charged)'); }
        break;
      case 'new-version': ui.modal = 'version'; ui.share = false; renderModal(); break;
      case 'close-modal': if (ev.target === el || el.getAttribute('data-force')) closeModal(); break;
      case 'upload': $('#picker').click(); break;
      case 'folder': ui.folder = id; renderView(); break;
      case 'task': completeTask(el.closest('.tk'), id); break;
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
    if (Date.now() - swallow < 400) { e.preventDefault(); return; }
    var g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); $('#app').classList.remove('drawer'); ui.wsOpen = false; ui.acct = false; ui.folder = g.getAttribute('data-go').indexOf('p/') === 0 ? ui.folder : ''; go(g.getAttribute('data-go')); return; }
    var a = e.target.closest('[data-act]');
    if (a) { act(a.getAttribute('data-act'), a.getAttribute('data-id'), a, e); return; }
    if (ui.wsOpen && !e.target.closest('.ws')) { ui.wsOpen = false; renderSide(); }
    if (ui.acct && !e.target.closest('.acct')) { ui.acct = false; renderSide(); }
    if (ui.bell && !e.target.closest('.bell-wrap')) { ui.bell = false; renderTop(); }
    if (ui.share && !e.target.closest('#pop')) { ui.share = false; renderView(); }
    if (e.target.id === 'app' || (e.target.closest('.main') && $('#app').classList.contains('drawer'))) $('#app').classList.remove('drawer');
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-form]'); if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form'), cur = curFile();
    if (kind === 'task') {
      var text = form.elements.text.value.trim(); if (!text) { form.elements.text.focus(); return; }
      var pid = form.elements.loc ? form.elements.loc.value : (form.getAttribute('data-pid') || '');
      var due = form.elements.due ? form.elements.due.value : '';
      if (form.elements.loc) ui.qaLoc = pid;
      var newT = { id: 't' + uid(), text: text, project: pid, ws: S.ws, due: due, done: false };
      S.tasks.push(newT); ui.freshTask = newT.id; afterTasks();
      toast('Added to ' + taskLoc(newT) + (due ? ' · due ' + fmtDay(due) : ''));
      var again = $('[data-form=task] input[name=text]'); if (again) again.focus();
    } else if (kind === 'task-full') {
      var tt = form.elements.text.value.trim(); if (!tt) return;
      var tl = form.elements.loc.value, td = form.elements.due.value, ex = ui.taskId && taskById(ui.taskId);
      if (ex) { ex.text = tt; ex.project = tl; ex.due = td; ex.ws = S.ws; toast('Task saved'); }
      else { var nt2 = { id: 't' + uid(), text: tt, project: tl, ws: S.ws, due: td, done: false }; S.tasks.push(nt2); ui.freshTask = nt2.id; toast('Added to ' + taskLoc(nt2) + (td ? ' · due ' + fmtDay(td) : '')); }
      ui.modal = null; ui.taskId = ''; renderModal(); afterTasks();
    } else if (kind === 'note-new') {
      var title = form.elements.title.value.trim() || 'Untitled note';
      var nn = { id: 'n' + uid(), ws: S.ws, project: form.elements.loc.value, title: title, date: form.elements.date.value || today(), created: Date.now(), entries: [] };
      S.notes.unshift(nn); log(ME, 'created the note “' + title + '”' + (nn.project ? ' in ' + noteLoc(nn) : ''));
      save(); ui.freshNote = nn.id; ui.modal = 'note'; ui.noteId = nn.id; ui.pend[nn.id] = [];
      renderModal(); renderView(); renderSide();
    } else if (kind === 'note-msg') {
      var tid = form.getAttribute('data-thread'), nObj = threadById(tid), ta = form.elements.text, msg = ta.value.trim(), pl = pendOf(tid);
      if (!nObj) return;
      if (ui.reading === tid) { toast('Still preparing the attachments…'); return; }
      if (!msg && !pl.length) { ta.focus(); return; }
      var en = { id: 'e' + uid(), who: ME, at: Date.now(), text: msg, media: pl.slice() };
      nObj.entries.push(en); ui.pend[tid] = []; ui.freshEntry = en.id;
      ta.value = ''; ta.style.height = '';
      save(); paintThread(tid); paintPending(tid);
      if (noteById(tid)) renderView(); else { paintChatList(); simulateReply(tid); }
      ta.focus();
    } else if (kind === 'ev') {
      var et = form.elements.title.value.trim(); if (!et) return;
      var es = form.elements.start.value || today(), ee = form.elements.end.value || es;
      if (ee < es) ee = es;
      var eo = ui.evId && evById(ui.evId), etype = form.elements.type.value || 'delivery', eproj = form.elements.project.value;
      if (eo) { eo.title = et; eo.type = etype; eo.project = eproj; eo.start = es; eo.end = ee; eo.ws = S.ws; toast('Event saved'); }
      else { S.events.push({ id: 'ev' + uid(), ws: S.ws, title: et, type: etype, project: eproj, start: es, end: ee }); log(ME, 'added “' + et + '” to the calendar'); toast(EV_TYPES[etype] + ' added · ' + (es === ee ? fmtDay(es) : fmtDay(es) + ' – ' + fmtDay(ee))); }
      if (route().v === 'calendar') ui.calMonth = es.slice(0, 7);
      ui.modal = null; ui.evId = ''; renderModal(); save(); renderView();
    } else if (kind === 'invite') {
      var iname = form.elements.name.value.trim(), iemail = form.elements.email.value.trim();
      if (!iname || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(iemail)) { toast('Enter a name and a valid email'); return; }
      ws().members.push({ id: 'u-' + uid(), name: iname.split(' ')[0], full: iname, email: iemail, role: form.elements.role.value, job: form.elements.job.value.trim(), pending: true });
      log(ME, 'invited ' + iname + ' as ' + form.elements.role.value);
      ui.modal = null; renderModal(); save(); ui.teamTab = 'members'; if (route().v === 'team') renderView(); else go('team'); renderSide(); toast('Invite sent to ' + iemail + ' (demo, no email is sent)');
    } else if (kind === 'join') {
      var jc = form.elements.code.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      var jw = S.workspaces.filter(function (x) { return x.code && x.code.replace(/-/g, '') === jc; })[0];
      if (!jw) { toast('No team uses that code. Codes look like ABC-123-XYZ.'); form.elements.code.focus(); return; }
      ui.modal = null; renderModal();
      if (jw.id === S.ws) { toast('You are already in ' + jw.name); return; }
      S.ws = jw.id; ui.chatId = ''; save(); toast('Switched to ' + jw.name); if (route().v === 'team') render(); else go('team');
    } else if (kind === 'group-new' || kind === 'group-add') {
      var picked = [].map.call(form.querySelectorAll('input[name=m]:checked'), function (x) { return x.value; });
      if (kind === 'group-new') {
        var gname = form.elements.name.value.trim(); if (!gname) return;
        var gnc = { id: 'grp:' + S.ws + ':' + uid(), ws: S.ws, kind: 'group', name: gname, color: GROUP_COLORS[S.chats.length % GROUP_COLORS.length], members: ['u-me'].concat(picked), entries: [{ id: 'e' + uid(), sys: true, who: ME, at: Date.now(), text: ME + ' created the group' }] };
        S.chats.push(gnc); ui.chatId = gnc.id; toast('Group “' + gname + '” created');
      } else {
        var ga = chatById(ui.groupId); if (!ga) return;
        if (!picked.length) { toast('Pick at least one person'); return; }
        picked.forEach(function (x) { if (ga.members.indexOf(x) < 0) ga.members.push(x); });
        ga.entries.push({ id: 'e' + uid(), sys: true, who: ME, at: Date.now(), text: ME + ' added ' + picked.map(function (x) { return mName(memberById(x)); }).join(', ') });
        ui.chatId = ga.id; toast('Added to ' + ga.name);
      }
      ui.modal = null; renderModal(); save(); ui.teamTab = 'chat'; if (route().v === 'team') renderView(); else go('team');
    } else if (kind === 'team-new') {
      var tname = form.elements.name.value.trim(); if (!tname) return;
      if (S.workspaces.length >= plan().ws) { toast('Your plan has no free team slot'); return; }
      var nw = { id: slug(tname) + uid(), name: tname, letter: tname.charAt(0).toUpperCase(), cls: ['', 'f', 'g', 'o'][S.workspaces.length % 4], usedGb: 0,
        members: [{ id: 'u-me', me: true, name: ME, full: USER.name, email: USER.email, role: 'Owner', job: (myMember() && myMember().job) || '' }] };
      S.workspaces.push(nw); S.ws = nw.id; ui.teamTab = 'members'; ui.chatId = '';
      ui.modal = null; renderModal(); save(); toast('Team “' + tname + '” created. You are the owner.');
      if (route().v === 'team') render(); else go('team');
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
    if (e.target.id === 'chat-q') { ui.chatQ = e.target.value; paintChatList(); }
    if (e.target.id === 'sq') { ui.sq = e.target.value; ui.si = 0; var sr = $('#sres'); if (sr) sr.innerHTML = searchResultsHtml(); }
    if (e.target.classList && e.target.classList.contains('compose')) { e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px'; }
  });
  $('#picker').addEventListener('change', function () { addFiles(this.files); this.value = ''; });
  document.addEventListener('keydown', function (e) {
    if (ui.lb) {
      if (e.key === 'Escape') { ui.lb = null; renderLb(); return; }
      if (e.key === 'ArrowRight') { lbStep(1); return; }
      if (e.key === 'ArrowLeft') { lbStep(-1); return; }
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); return; }
    if (e.key === '/' && !ui.modal && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { e.preventDefault(); openSearch(); return; }
    if (ui.modal === 'search' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      var sn0 = (ui.sres || []).length; if (!sn0) return;
      ui.si = (ui.si + (e.key === 'ArrowDown' ? 1 : -1) + sn0) % sn0;
      var srl = $('#sres'); if (srl) { srl.innerHTML = searchResultsHtml(); var on = srl.querySelector('.sr.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
      return;
    }
    if (ui.modal === 'search' && e.key === 'Enter') { e.preventDefault(); srGo(ui.si); return; }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('compose') && !e.shiftKey && !e.isComposing) { e.preventDefault(); e.target.form.requestSubmit(); return; }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('chat-title')) { e.preventDefault(); e.target.blur(); return; }
    if (e.key === 'Escape') {
      if (ui.modal) closeModal();
      else if (ui.share) { ui.share = false; renderView(); }
      else if (ui.bell) { ui.bell = false; renderTop(); }
      else if (ui.wsOpen || ui.acct) { ui.wsOpen = false; ui.acct = false; renderSide(); }
    }
    if (e.key === ' ' && curFile() && !/INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName)) { e.preventDefault(); setPlaying(!ui.playing); }
  });
  /* swipe a task to the left to complete it */
  var drag = null, swallow = 0;
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var tk = e.target.closest('.tk.open');
    if (!tk || e.target.closest('.check') || tk.classList.contains('leaving')) return;
    drag = { tk: tk, row: tk.querySelector('.row'), x: e.clientX, y: e.clientY, dx: 0, on: false, id: tk.getAttribute('data-id'), pid: e.pointerId };
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (dx < -8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        drag.on = true; drag.row.classList.add('dragging');
        try { drag.row.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      } else { if (Math.abs(dy) > 10 || dx > 10) drag = null; return; }
    }
    drag.dx = Math.min(0, dx);
    drag.row.style.transform = 'translateX(' + drag.dx + 'px)';
    drag.tk.classList.toggle('arm', -drag.dx > drag.row.offsetWidth * 0.3);
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.on) return;
    swallow = Date.now();
    d.row.classList.remove('dragging');
    if (-d.dx > d.row.offsetWidth * 0.3) completeTask(d.tk, d.id);
    else { d.row.style.transform = ''; d.tk.classList.remove('arm'); }
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  document.addEventListener('change', function (e) {
    var mf = e.target.getAttribute && e.target.getAttribute('data-member-field');
    if (mf) {
      var mrow = e.target.closest('[data-mid]'), mem = mrow && memberById(mrow.getAttribute('data-mid'));
      if (!mem) return;
      if (mf === 'role' && !canManage()) return;
      mem[mf] = e.target.value.trim();
      save();
      if (mf === 'role') { log(ME, 'made ' + mFull(mem) + ' ' + mem.role); toast(mFull(mem) + ' is now ' + mem.role); } else toast('Saved');
      return;
    }
    var field = e.target.getAttribute && e.target.getAttribute('data-note-field'); if (!field) return;
    var n = noteById(ui.noteId); if (!n) return;
    var v = e.target.value;
    if (field === 'title') { v = v.trim() || 'Untitled note'; e.target.value = v; }
    n[field] = v; save(); renderView(); renderSide();
    if (field === 'project') toast('Moved to ' + noteLoc(n));
  });
  document.addEventListener('paste', function (e) {
    if (!e.target.classList || !e.target.classList.contains('compose') || !e.clipboardData) return;
    var files = [].slice.call(e.clipboardData.files || []);
    if (files.length) { e.preventDefault(); addPending(files, e.target.form.getAttribute('data-thread')); }
  });
  document.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('tdone')) ui.doneOpen = e.target.open; }, true);
  notePicker.addEventListener('change', function () { addPending(this.files, ui.attachFor); this.value = ''; });
  photoPicker.addEventListener('change', function () {
    var f = this.files[0]; this.value = '';
    if (!f) return;
    squarePhoto(f).then(function (data) {
      if (!data) { toast('That image could not be read'); return; }
      USER.photo = data; saveUser(); render(); toast('Profile photo updated');
    });
  });

  var enterTimer;
  function enter() {
    var v = $('#view'), i = 0;
    clearTimeout(enterTimer);
    v.classList.remove('enter'); void v.offsetWidth;
    [].forEach.call(v.querySelectorAll(':scope > *, .home > *, .tiles > *, .pulse > *, .pgrid > *, .ngrid > *, .home3 > *, .fgrid > *, .plan-grid > *, .cal > *, .members > .mem, .cl-row, .tk, .ag-row'), function (el) {
      el.style.setProperty('--i', Math.min(i++, 18));
    });
    v.classList.add('enter');
    runCounts(v);
    enterTimer = setTimeout(function () { v.classList.remove('enter'); }, 2200);
  }
  addEventListener('hashchange', function () { if (!navBack) { navHist.push(lastPath); if (navHist.length > 50) navHist.shift(); } navBack = false; lastPath = currentPath(); ui.modal = null; ui.bell = false; ui.pend = {}; ui.lb = null; renderLb(); render(); $('#view').scrollTop = 0; enter(); });

  render();
  enter();
})();
