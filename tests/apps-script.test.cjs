// Creators Club 2.0 backend (apps-script/upload.gs + club.gs) against an in-memory Google Sheets.
// Covers: apply -> review -> approve -> brief -> submit -> participation -> pause -> coordinator gate.
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');

function fakeGoogle(props) {
  const books = new Map(); let n = 0;
  const range = (sheet, r, c, nr = 1, nc = 1) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ((sheet.rows[r - 1 + i] || [])[c - 1 + j] ?? ''))),
    setValues(v) { v.forEach((row, i) => row.forEach((x, j) => sheet.set(r + i, c + j, x))); return this; },
    setValue(x) { sheet.set(r, c, x); delete sheet.links[r + ',' + c]; return this; },
    getDisplayValues() { return this.getValues().map(row => row.map(v => v instanceof Date ? (sheet.formats[r + ',' + c] || '').includes('yyyy') ? `${v.getMonth() + 1}/${v.getDate()}/${v.getFullYear()}` : `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][v.getDay()]} ${v.getMonth() + 1}/${v.getDate()}` : String(v))); },
    getRichTextValues() { return Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ({ getLinkUrl: () => sheet.links[(r + i) + ',' + (c + j)] || null }))); },
    setRichTextValue(v) { sheet.set(r, c, v.text); sheet.links[r + ',' + c] = v.link; return this; },
    setNumberFormat(f) { sheet.formats[r + ',' + c] = f; return this; },
    setFontWeight() { return this; }, setBackground() { return this; }, setDataValidation() { return this; }
  });
  const makeSheet = name => {
    const sheet = { name, rows: [], links: {}, formats: {},
      shift(at, by) { const move = o => Object.fromEntries(Object.entries(o).flatMap(([k, v]) => { const [rr, cc] = k.split(',').map(Number); if (rr < at) return [[k, v]]; if (by < 0 && rr === at) return []; return [[(rr + by) + ',' + cc, v]]; })); this.links = move(this.links); this.formats = move(this.formats); },
      insertRowBefore(at) { this.shift(at, 1); this.rows.splice(at - 1, 0, []); }, deleteRow(at) { this.shift(at, -1); this.rows.splice(at - 1, 1); },
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
    SpreadsheetApp: { create: makeBook, openById: id => { const b = books.get(id); if (!b) throw Error('missing'); return b; }, newDataValidation: () => validation,
      newRichTextValue: () => { const v = {}; return { setText(t) { v.text = t; return this; }, setLinkUrl(l) { v.link = l; return this; }, build: () => v }; } },
    DriveApp: { getFileById: () => ({ moveTo() {} }), getFolderById: id => folder(id) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => store.get(k) ?? null, setProperty: (k, v) => store.set(k, v), getProperties: () => Object.fromEntries(store) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: k => cache.get(k) ?? null, put: (k, v) => cache.set(k, v), remove: k => cache.delete(k) }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, getUuid: () => require('node:crypto').randomUUID(),
      computeDigest: (alg, v) => [...require('node:crypto').createHash(alg).update(String(v), 'utf8').digest()].map(x => x > 127 ? x - 256 : x),
      computeHmacSha256Signature: (v, k) => [...require('node:crypto').createHmac('sha256', String(k)).update(String(v), 'utf8').digest()].map(x => x > 127 ? x - 256 : x),
      formatDate: (d, tz, f) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map(x => [x.type, x.value])); return f === 'yyyy-MM-dd' ? `${p.year}-${p.month}-${p.day}` : d.toISOString(); } },
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
// Reels tracker + content calendar: coordinators create, read, update, move and delete rows on the Reels sheet.
const t5 = boot();
const reelsBook = t5.g.SpreadsheetApp.create('Reels – Status Report'); t5.g.books.set(vm.runInContext('REELS_SHEET_ID', t5.ctx), reelsBook);
const rs = reelsBook.getSheets()[0];
[['Reel', 'Lead', 'Prompt', 'Deadline', 'Status', 'Folder'], ['Pass the Toy', 'Kristin', 'Intros', 'PAST DUE', 'POSTED', 'Folder'], ['Round Up #3', 'Kristin', 'Weekly recap', 'Sunday 11/8', '', ''],
 ['Future ideas'], ['Trick or Treat', 'Taylor', '', '', 'IDEA', '']].forEach(row => rs.appendRow(row));
rs.links['2,6'] = 'https://drive.google.com/drive/folders/abc'; rs.links['3,3'] = 'https://docs.google.com/document/d/BRIEF1234567890abcdefgh/edit';
const reels = () => t5.get({ action: 'reels', key }).reels;
const rc = { key, coordKey: 'Coord-123', coordName: 'Taylor' };
assert.equal(reels().length, 3);
// Creators can read but not change the tracker.
assert.equal(t5.post({ action: 'admin-reel', key, op: 'create', reel: { title: 'Nope' } }).coordLocked, true);
// Create: goes in above "Future ideas" with a real date the sheet shows as "Weekday m/d".
const soon = new Date(Date.now() + 10 * 864e5), soonIso = iso(soon);
r = t5.post({ action: 'admin-reel', ...rc, op: 'create', reel: { title: 'Car Seat Check', lead: 'Sarah', status: 'filming', deadline: soonIso, prompt: 'Show the pinch test', briefUrl: 'https://docs.google.com/document/d/NEWBRIEF1234567890abcd/edit' } });
assert.equal(r.ok, true); assert.equal(r.row, 4);
let cs = r.reels.find(x => x.title === 'Car Seat Check');
assert.equal(cs.status, 'FILMING'); assert.equal(cs.prompt, 'Show the pinch test'); assert.equal(cs.briefUrl, 'https://docs.google.com/document/d/NEWBRIEF1234567890abcd/edit'); assert.match(cs.deadline, /^[A-Z][a-z]+day \d{1,2}\/\d{1,2}$/);
assert.equal(reels().length, 4); // the cached copy was cleared
// Update: only changed cells are written ("PAST DUE" and the folder's "Folder" link survive a status change).
const pt = reels().find(x => x.title === 'Pass the Toy');
r = t5.post({ action: 'admin-reel', ...rc, op: 'update', row: pt.row, was: 'Pass the Toy', orig: { ...pt, status: 'posted' }, reel: { ...pt, status: 'editing', lead: 'Karina' } });
assert.equal(r.ok, true); assert.equal(rs.rows[1][3], 'PAST DUE'); assert.equal(rs.rows[1][5], 'Folder'); assert.equal(rs.links['2,6'], 'https://drive.google.com/drive/folders/abc');
assert.equal(r.reels.find(x => x.title === 'Pass the Toy').status, 'IN EDIT'); assert.equal(r.reels.find(x => x.title === 'Pass the Toy').lead, 'Karina');
// A stale row (someone else changed the sheet) is refused, never written to the wrong Reel.
assert.equal(t5.post({ action: 'admin-reel', ...rc, op: 'update', row: pt.row, was: 'Something else', orig: pt, reel: pt }).ok, false);
assert.equal(t5.post({ action: 'admin-reel', ...rc, op: 'create', reel: { title: '' } }).ok, false);
// Move an idea up into the schedule, and a Reel down into Future ideas.
const tt = reels().find(x => x.title === 'Trick or Treat');
r = t5.post({ action: 'admin-reel', ...rc, op: 'update', row: tt.row, was: tt.title, orig: { ...tt, status: 'idea' }, reel: { ...tt, status: 'casting' } });
assert.equal(r.reels.find(x => x.title === 'Trick or Treat').status, 'CASTING');
assert.ok(r.reels.findIndex(x => x.title === 'Trick or Treat') < r.reels.findIndex(x => x.status === 'IDEA') || !r.reels.some(x => x.status === 'IDEA'));
const ru = r.reels.find(x => x.title === 'Round Up #3');
r = t5.post({ action: 'admin-reel', ...rc, op: 'update', row: ru.row, was: ru.title, orig: { ...ru, status: 'upcoming' }, reel: { ...ru, status: 'idea' } });
assert.equal(r.reels.find(x => x.title === 'Round Up #3').status, 'IDEA'); assert.equal(r.reels.find(x => x.title === 'Round Up #3').briefUrl, 'https://docs.google.com/document/d/BRIEF1234567890abcdefgh/edit');
assert.equal(rs.rows.filter(x => x[0] === 'Future ideas').length, 1);
// Delete.
cs = r.reels.find(x => x.title === 'Car Seat Check');
r = t5.post({ action: 'admin-reel', ...rc, op: 'delete', row: cs.row, was: cs.title }); assert.equal(r.ok, true);
assert.ok(!reels().some(x => x.title === 'Car Seat Check')); assert.equal(reels().length, 3);
// Formulas and odd links are neutralised.
r = t5.post({ action: 'admin-reel', ...rc, op: 'create', reel: { title: '=IMPORTXML("x")', status: 'upcoming', folderUrl: 'javascript:alert(1)' } });
assert.equal(r.reels.find(x => x.title.includes('IMPORTXML')).title[0], "'"); assert.equal(r.reels.find(x => x.title.includes('IMPORTXML')).folderUrl, '');
// Creator accounts: the shared password only sets up your own; then you sign in with your name and password, and own your bio.
const t6 = boot(), shared = 'footpop';
r = t6.post({ action: 'account-setup', key: 'nope', name: 'Kristin', password: 'sunshine-toy-9' }); assert.equal(r.locked, true);
assert.match(t6.post({ action: 'account-setup', key: shared, name: 'Kristin', password: 'short' }).error, /8 characters/);
assert.match(t6.post({ action: 'account-setup', key: shared, name: 'Kristin', password: 'FOOTPOP' }).error, /yours/);
assert.match(t6.post({ action: 'account-setup', key: shared, name: 'Kristin', password: 'Coord-123' }).error, /yours/);
r = t6.post({ action: 'account-setup', key: shared, name: 'Kristin', password: 'sunshine-toy-9' });
assert.equal(r.ok, true); assert.equal(r.name, 'Kristin'); assert.match(r.key, /^acct\.[\w-]+\.[\w-]+$/); const kKey = r.key;
// The sheet never holds the password or the device key.
const acctSheet = JSON.stringify(t6.g.books.get(vm.runInContext("PropertiesService.getScriptProperties().getProperty('CLUB_SHEET_ID')", t6.ctx)).getSheetByName('Accounts').rows);
assert.ok(!acctSheet.includes('sunshine-toy-9')); assert.ok(!acctSheet.includes(kKey.split('.')[2]));
// Someone else can't take the name once it has a password.
r = t6.post({ action: 'account-setup', key: shared, name: 'kristin', password: 'another-pass-1' }); assert.equal(r.ok, false); assert.equal(r.taken, true);
// The device key works everywhere the creator password does, and you act as yourself.
assert.equal(t6.get({ action: 'gate', key: kKey }).ok, true);
assert.equal(t6.get({ action: 'gate', key: kKey.slice(0, -2) + 'zz' }).locked, true);
// Sign in on another device.
assert.equal(t6.post({ action: 'account-login', name: 'Kristin', password: 'wrong-password' }).wrong, true);
r = t6.post({ action: 'account-login', name: 'KRISTIN', password: 'sunshine-toy-9' }); assert.equal(r.ok, true); const kKey2 = r.key; assert.notEqual(kKey2, kKey);
// Bio: create, read (public), update, delete.
assert.deepEqual(t6.get({ action: 'bios' }).bios, []);
assert.equal(t6.post({ action: 'bio-save', key: shared, bio: 'Hi' }).noAccount, true); // the shared password alone can't write a bio
assert.equal(t6.post({ action: 'bio-save', key: kKey, bio: '   ' }).ok, false);
r = t6.post({ action: 'bio-save', key: kKey, bio: 'Mom of three in Holly Springs, NC.\nFormer TV producer.' }); assert.equal(r.ok, true); assert.equal(r.bio, 'Mom of three in Holly Springs, NC. Former TV producer.');
assert.deepEqual(t6.get({ action: 'bios' }).bios, [{ name: 'Kristin', bio: 'Mom of three in Holly Springs, NC. Former TV producer.' }]);
r = t6.post({ action: 'account-me', key: kKey2 }); assert.equal(r.bio, 'Mom of three in Holly Springs, NC. Former TV producer.'); assert.equal(r.bioSet, true);
assert.equal(t6.post({ action: 'bio-save', key: kKey2, bio: 'x'.repeat(900) }).bio.length, 400);
r = t6.post({ action: 'bio-delete', key: kKey }); assert.equal(r.bio, ''); assert.deepEqual(t6.get({ action: 'bios' }).bios, [{ name: 'Kristin', bio: '' }]);
// Change password: the other device is signed out.
assert.equal(t6.post({ action: 'account-password', key: kKey, current: 'nope-nope', password: 'new-password-2' }).ok, false);
r = t6.post({ action: 'account-password', key: kKey, current: 'sunshine-toy-9', password: 'new-password-2' }); assert.equal(r.ok, true);
assert.equal(t6.get({ action: 'gate', key: kKey2 }).locked, true); assert.equal(t6.get({ action: 'gate', key: kKey }).ok, true);
assert.equal(t6.post({ action: 'account-login', name: 'Kristin', password: 'sunshine-toy-9' }).ok, false);
assert.equal(t6.post({ action: 'account-login', name: 'Kristin', password: 'new-password-2' }).ok, true);
// Club actions use the signed-in name, not whatever name is sent.
r = t6.get({ action: 'club', key: kKey, name: 'Somebody Else' }); assert.equal(r.ok, true);
// Coordinators see accounts, can take a bio down and reset a password; the creator then sets a new one with the creator password.
const tc = { key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Sarah' };
r = t6.post({ action: 'admin-data', ...tc }); assert.equal(r.accounts[0].name, 'Kristin'); assert.equal(r.accounts[0].hasPassword, true); assert.equal(r.accounts[0].hash, undefined);
r = t6.post({ action: 'admin-account', ...tc, name: 'Kristin', op: 'reset' }); assert.equal(r.accounts[0].hasPassword, false);
assert.equal(t6.get({ action: 'gate', key: kKey }).locked, true);
assert.equal(t6.post({ action: 'account-setup', key: shared, name: 'Kristin', password: 'fresh-start-3' }).ok, true);
// Sign out forgets this device's key.
r = t6.post({ action: 'account-login', name: 'Kristin', password: 'fresh-start-3' }); assert.equal(t6.post({ action: 'account-signout', key: r.key }).ok, true); assert.equal(t6.get({ action: 'gate', key: r.key }).locked, true);
// Too many wrong tries are slowed down.
for (let i = 0; i < 10; i++) t6.post({ action: 'account-login', name: 'Kristin', password: 'guess-' + i });
assert.match(t6.post({ action: 'account-login', name: 'Kristin', password: 'fresh-start-3' }).error, /Too many/);
console.log('PASS: Creators Club 2.0 backend workflows');
