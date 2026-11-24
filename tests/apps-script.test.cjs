// Creators Club 2.0 backend (apps-script/upload.gs + club.gs) against an in-memory Google Sheets.
// Covers: apply -> review -> approve -> brief -> submit -> participation -> pause -> coordinator gate.
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');

function fakeGoogle(props) {
  const books = new Map(); let n = 0;
  const range = (sheet, r, c, nr = 1, nc = 1) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ((sheet.rows[r - 1 + i] || [])[c - 1 + j] ?? ''))),
    setValues(v) { v.forEach((row, i) => row.forEach((x, j) => sheet.set(r + i, c + j, x))); return this; },
    setValue(x) { sheet.set(r, c, x); return this; },
    setFontWeight() { return this; }, setBackground() { return this; }, setDataValidation() { return this; }
  });
  const makeSheet = name => {
    const sheet = { name, rows: [],
      set(r, c, x) { while (this.rows.length < r) this.rows.push([]); const row = this.rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = x; },
      getName() { return this.name; }, setName(x) { this.name = x; },
      getLastRow() { let i = this.rows.length; while (i && !this.rows[i - 1].some(v => v !== '')) i--; return i; },
      getLastColumn() { return Math.max(0, ...this.rows.map(r => { let j = r.length; while (j && r[j - 1] === '') j--; return j; })); },
      getMaxRows() { return 1000; }, setFrozenRows() {}, appendRow(v) { const r = this.getLastRow() + 1; v.forEach((x, j) => this.set(r, j + 1, x)); },
      getRange(r, c, nr, nc) { return range(this, r, c, nr, nc); }, getDataRange() { return range(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
    };
    return sheet;
  };
  const makeBook = title => { const id = 'book' + (++n), book = { id, title, sheets: [makeSheet('Sheet1')],
    getId: () => id, getSheets() { return this.sheets; }, getSheetByName(x) { return this.sheets.find(s => s.name === x) || null; },
    insertSheet(x) { const s = makeSheet(x); this.sheets.push(s); return s; }, setSpreadsheetTimeZone() {} }; books.set(id, book); return book; };
  const folders = new Map(), made = [];
  const folder = (id, name = id) => { if (!folders.has(id)) folders.set(id, { id, name, kids: new Map(), getId() { return this.id; }, getName() { return this.name; }, getUrl() { return 'https://drive.google.com/drive/folders/' + this.id; },
    getParents: () => ({ hasNext: () => false }), getFoldersByName(n) { const f = this.kids.get(n); return { hasNext: () => !!f, next: () => f }; },
    createFolder(n) { const f = folder(this.id + '/' + n, n); this.kids.set(n, f); made.push(f.id); return f; } }); return folders.get(id); };
  const validation = { requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return {}; } };
  const store = new Map(Object.entries(props));
  const cache = new Map();
  return { books, made,
    SpreadsheetApp: { create: makeBook, openById: id => { const b = books.get(id); if (!b) throw Error('missing'); return b; }, newDataValidation: () => validation },
    DriveApp: { getFileById: () => ({ moveTo() {} }), getFolderById: id => folder(id) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => store.get(k) ?? null, setProperty: (k, v) => store.set(k, v), getProperties: () => Object.fromEntries(store) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: k => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
    Utilities: { formatDate: (d, tz, f) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map(x => [x.type, x.value])); return f === 'yyyy-MM-dd' ? `${p.year}-${p.month}-${p.day}` : d.toISOString(); } },
    ContentService: { createTextOutput: s => ({ setMimeType() { return JSON.parse(s); } }), MimeType: { JSON: 'json' } },
    UrlFetchApp: { fetch: (url, opts) => { made.push(JSON.parse(opts.payload).parents[0]); return { getHeaders: () => ({ Location: 'https://upload.example/x' }), getResponseCode: () => 200 }; } }, ScriptApp: { getOAuthToken: () => "" }, Session: {}, console: { log: console.log, error() {} }
  };
}
function boot(props = { MENTOR_PASSCODE: 'footpop', COORDINATOR_PASSCODE: 'Coord-123' }) {
  const g = fakeGoogle(props), ctx = vm.createContext({ ...g, Date, Math, JSON, Intl, String, Number, Object, Array, Set, Map, RegExp, Error, isFinite, isNaN });
  for (const f of ['upload.gs', 'club.gs']) vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', f), 'utf8'), ctx, { filename: f });
  const post = body => ctx.doPost({ postData: { contents: JSON.stringify(body) } });
  const get = p => ctx.doGet({ parameter: p });
  return { ctx, g, post, get };
}
// Dates in Phoenix time, like the script (todayIso).
const iso = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix' }).format(d), day = n => iso(new Date(Date.now() + n * 864e5));
const key = 'footpop', coord = { key, coordKey: 'Coord-123', coordName: 'Taylor' };

const t = boot();
// Workflow: specialist applies (no password needed).
let r = t.post({ action: 'apply', application: { name: 'Ana Lopez', region: 'West', market: 'Phoenix', instagram: 'ana.babygear', roles: 'On-camera creator, Editor', camera: 'Love it', why: 'I love teaching.', capacity: '1–2 posts a week', interests: 'Car seats', experience: 'Beginner', agreed: true } });
assert.equal(r.ok, true);
// Creators see it (no notes), status Submitted.
r = t.get({ action: 'applications', key }); assert.equal(r.applications.length, 1); assert.equal(r.applications[0].status, 'Submitted'); assert.equal(r.applications[0].notes, undefined);
// Locked without the password; admin needs the coordinator code too.
assert.equal(t.get({ action: 'club', name: 'Ana Lopez' }).locked, true);
assert.equal(t.post({ action: 'admin-data', key }).coordLocked, true);
assert.equal(t.post({ action: 'admin-data', key, coordKey: 'nope' }).coordLocked, true);
assert.equal(t.post({ action: 'admin-data', coordKey: 'Coord-123' }).locked, true); // coordinator code alone isn't enough
// Not a member yet: club shows the application status, no submissions allowed.
r = t.get({ action: 'club', key, name: 'Ana Lopez' }); assert.equal(r.member, null); assert.equal(r.application.status, 'Submitted');
assert.equal(t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'flexible', url: 'https://instagram.com/p/x' }).ok, false);
// Admin reviews and approves.
r = t.post({ action: 'admin-data', ...coord }); assert.equal(r.ok, true); const appId = r.applications[0].id; assert.ok(appId);
r = t.post({ action: 'admin-app', ...coord, id: appId, status: 'Under Review', notes: 'Lovely energy' }); assert.equal(r.applications[0].status, 'Under Review'); assert.equal(r.applications[0].notes, 'Lovely energy');
r = t.post({ action: 'admin-app', ...coord, id: appId, status: 'Approved' });
const ana = r.members.find(m => m.name === 'Ana Lopez'); assert.equal(ana.status, 'Active'); assert.equal(ana.market, 'Phoenix'); assert.equal(r.applications[0].reviewedBy, 'Taylor');
// Seed the current Squad; no duplicates.
r = t.post({ action: 'admin-seed', ...coord, members: [{ name: 'Kristin', market: 'East' }, { name: 'Ana Lopez' }] }); assert.equal(r.members.length, 2);
// New members are only held to weeks after they joined; backdate both so the earlier weeks count in this test.
vm.runInContext(`(() => { const sh = clubSheet('Members'); readTable(sh, CLUB_TABS['Members']).forEach(m => writeRow(sh, CLUB_TABS['Members'], { joined: '${day(-30)}' }, m._row)); })()`, t.ctx);
r = t.post({ action: 'admin-data', ...coord }); assert.equal(r.participation.find(p => p.name === 'Kristin').weeksFinished, 0); // no briefs yet
// Brief manager: create, publish a past week and the current week, duplicate, archive.
r = t.post({ action: 'admin-brief', ...coord, brief: { title: 'Registry Mistakes', theme: 'Registry Mistakes', format: 'Instagram Reel', length: '15–30 seconds', weekStart: day(-14), weekEnd: day(-8), cta: 'Explore the free Baby Concierge service.' } });
const past = r.savedId; assert.equal(r.briefs.find(b => b.id === past).status, 'Draft');
r = t.post({ action: 'admin-brief', ...coord, op: 'publish', brief: { id: past } });
r = t.post({ action: 'admin-brief', ...coord, op: 'duplicate', brief: { id: past } }); const mid = r.savedId; assert.equal(r.briefs.find(b => b.id === mid).weekStart, day(-7));
r = t.post({ action: 'admin-brief', ...coord, op: 'publish', brief: { id: mid } });
r = t.post({ action: 'admin-brief', ...coord, brief: { title: 'Stroller Myths', weekStart: day(-1), weekEnd: day(5) } }); const cur = r.savedId;
r = t.post({ action: 'admin-brief', ...coord, op: 'publish', brief: { id: cur } }); assert.equal(r.current, cur);
r = t.post({ action: 'admin-brief', ...coord, op: 'duplicate', brief: { id: cur } }); const extra = r.savedId;
r = t.post({ action: 'admin-brief', ...coord, op: 'archive', brief: { id: extra } }); assert.equal(r.briefs.find(b => b.id === extra).status, 'Archived');
// Approved creator sees this week's brief and submits a published link.
r = t.get({ action: 'club', key, name: 'ana lopez' }); assert.equal(r.brief.id, cur); assert.equal(r.member.status, 'Active'); assert.equal(r.member.notes, undefined);
assert.equal(t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'themed', briefId: cur, url: 'javascript:alert(1)' }).ok, false);
r = t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'themed', briefId: cur, url: 'https://www.instagram.com/reel/abc/' }); assert.equal(r.ok, true);
r = t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'themed', briefId: past, url: 'https://www.instagram.com/reel/old/' }); assert.equal(r.ok, true);
// Admin reviews completion; participation: Kristin missed 2 finished weeks -> Needs review; Ana met the earlier week but missed the last one -> Reminder.
r = t.post({ action: 'admin-data', ...coord });
const sub = r.submissions.find(s => s.briefId === cur); r = t.post({ action: 'admin-sub', ...coord, id: sub.id, status: 'Counted' }); assert.equal(r.submissions.find(s => s.id === sub.id).status, 'Counted');
const pk = r.participation.find(p => p.name === 'Kristin'), pa = r.participation.find(p => p.name === 'Ana Lopez');
assert.equal(pk.standing, 'Needs review'); assert.equal(pk.missedInARow, 2);
assert.equal(pa.standing, 'Reminder'); assert.equal(pa.weeksMet, 1);
assert.equal(r.analytics.activeCreators, 2); assert.equal(r.analytics.thisWeek.themedPosts, 1); assert.equal(r.analytics.lastWeek.rate, 0); assert.equal(r.analytics.publishedLinks, 2);
// Creator requests a pause; status stays Active until a coordinator changes it.
assert.equal(t.post({ action: 'club-request', key, name: 'Kristin', type: 'pause', until: day(20), note: 'Family trip' }).ok, true);
r = t.post({ action: 'admin-data', ...coord }); let k = r.members.find(m => m.name === 'Kristin'); assert.equal(k.request, 'Pause'); assert.equal(k.status, 'Active');
r = t.post({ action: 'admin-member', ...coord, name: 'Kristin', status: 'Paused', clearRequest: true }); k = r.members.find(m => m.name === 'Kristin');
assert.equal(k.status, 'Paused'); assert.equal(k.request, ''); assert.equal(r.participation.find(p => p.name === 'Kristin').standing, 'Paused');
assert.equal(t.post({ action: 'club-submit', key, name: 'Kristin', kind: 'flexible', url: 'https://example.com/x' }).ok, false); // paused: no submissions
// Settings are adjustable and validated.
r = t.post({ action: 'admin-settings', ...coord, settings: { requiredFlexible: '0', reviewAfter: '3', creatorCircleUrl: 'https://tot-squad-hub.disco.co/channel/abc' } });
assert.equal(r.settings.requiredFlexible, 0); assert.equal(r.settings.reviewAfter, 3); assert.equal(r.participation.find(p => p.name === 'Ana Lopez').standing, 'Reminder');
assert.equal(t.post({ action: 'admin-settings', ...coord, settings: { creatorCircleUrl: 'javascript:x' } }).ok, false);
// Declined/Waitlisted stay off the creators' list; Idea Bank is open; nothing was deleted.
t.post({ action: 'apply', application: { name: 'Bo', why: 'Hi', agreed: true } });
r = t.post({ action: 'admin-data', ...coord }); t.post({ action: 'admin-app', ...coord, id: r.applications.find(a => a.name === 'Bo').id, status: 'Waitlisted' });
assert.deepEqual(t.get({ action: 'applications', key }).applications.map(a => a.name), ['Ana Lopez']);
assert.equal(t.get({ action: 'ideas' }).locked, true); assert.equal(t.get({ action: 'ideas', key }).ok, true); // Idea Bank: creators only
assert.equal(t.post({ action: 'admin-data', ...coord }).briefs.length, 4);
// Coordinator tools stay off until COORDINATOR_PASSCODE is set.
assert.equal(boot({ MENTOR_PASSCODE: 'footpop' }).post({ action: 'admin-data', key }).coordLocked, true);
// Older application rows (before 2.0) still read, get an ID, and "New" reads as Submitted.
const t2 = boot(); const sh = t2.ctx.applySheet(); sh.appendRow([new Date(), 'Old Timer', 'East', '', '', '', 'Because', '', 'Yes', 'New', '']);
r = t2.post({ action: 'admin-data', ...coord }); assert.equal(r.applications[0].status, 'Submitted'); assert.ok(r.applications[0].id);
// Without the script property, the code can live on the Settings tab instead, and it's never sent to the browser.
const t3 = boot({ MENTOR_PASSCODE: 'footpop' });
assert.equal(t3.post({ action: 'admin-data', key }).coordLocked, true);
vm.runInContext(`(() => { clubSettings(); const sh = clubSheet('Settings'); const r = readTable(sh, CLUB_TABS['Settings']).find(x => x.key === 'coordinatorCode'); writeRow(sh, CLUB_TABS['Settings'], { value: 'bossy' }, r._row); })()`, t3.ctx);
assert.equal(t3.post({ action: 'admin-data', key, coordKey: 'nope' }).coordLocked, true);
r = t3.post({ action: 'admin-data', key, coordKey: 'bossy' }); assert.equal(r.ok, true); assert.equal(r.settings.coordinatorCode, undefined);
assert.equal(t3.get({ action: 'club', key, name: 'x' }).settings.coordinatorCode, undefined);
t3.post({ action: 'admin-settings', key, coordKey: 'bossy', settings: { coordinatorCode: 'hacked' } }); assert.equal(t3.post({ action: 'admin-data', key, coordKey: 'bossy' }).ok, true);
// Signing in with the coordinator password: it works as a creator password too, and the check is rate-limited.
assert.equal(t.post({ action: 'coord-login', code: 'nope' }).ok, false);
assert.equal(t.post({ action: 'coord-login', code: 'Coord-123' }).ok, true);
assert.equal(t.get({ action: 'ideas', key: 'Coord-123' }).ok, true); // coordinators are creators too
assert.equal(t.post({ action: 'admin-data', key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Sarah' }).ok, true);
for (let i = 0; i < 25; i++) t.post({ action: 'coord-login', code: 'guess' + i });
assert.match(t.post({ action: 'coord-login', code: 'Coord-123' }).error || '', /Too many tries/);
// B-roll from any specialist (no password) and from creators both land in "B-roll to review", never straight in the library.
const t4 = boot();
assert.equal(t4.post({ action: 'broll-start', name: 'Pat', type: 'video/mp4', size: 1000, fileName: 'a.mp4' }).ok, false); // needs the permission box
assert.equal(t4.post({ action: 'broll-start', name: 'Pat', agreed: true, type: 'application/pdf', size: 1000, fileName: 'a.pdf' }).ok, false);
r = t4.post({ action: 'broll-start', name: 'Pat', agreed: true, type: 'video/mp4', size: 1000, fileName: 'a.mp4' }); assert.equal(r.ok, true); assert.equal(r.folderUrl, undefined);
assert.ok(t4.g.made.includes('0ADqEscN50JTEUk9PVA/B-roll to review/Pat')); assert.ok(!t4.g.made.some(id => id.startsWith(vm.runInContext('ROOTS.broll', t4.ctx))));
r = t4.post({ action: 'start', key, name: 'Kristin', dest: 'broll', type: 'image/jpeg', size: 10, fileName: 'b.jpg' }); assert.equal(r.ok, true);
assert.ok(t4.g.made.includes('0ADqEscN50JTEUk9PVA/B-roll to review/Kristin'));
console.log('PASS: Creators Club 2.0 backend workflows');
