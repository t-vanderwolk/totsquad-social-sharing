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
    getParents: () => ({ hasNext: () => false }), isTrashed: () => false, getFoldersByName(n) { const f = this.kids.get(n); return { hasNext: () => !!f, next: () => f }; },
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
function boot(props = { MENTOR_PASSCODE: 'shared-test-pass', COORDINATOR_PASSCODE: 'Coord-123' }) {
  const g = fakeGoogle(props), ctx = vm.createContext({ ...g, Date, Math, JSON, Intl, String, Number, Object, Array, Set, Map, RegExp, Error, isFinite, isNaN });
  for (const f of ['upload.gs', 'club.gs']) vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', f), 'utf8'), ctx, { filename: f });
  const post = body => ctx.doPost({ postData: { contents: JSON.stringify(body) } });
  const get = p => ctx.doGet({ parameter: p });
  return { ctx, g, post, get };
}
// Dates in Phoenix time, like the script (todayIso).
const iso = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix' }).format(d), day = n => iso(new Date(Date.now() + n * 864e5));
// The shared creator password is never a key: members use their own sign-in. Most checks below act with the
// coordinator password as the key (like the old shared key, it carries no account name).
const key = 'Coord-123', coord = { key, coordKey: 'Coord-123', coordName: 'Taylor' };

const t = boot();
// Workflow: specialist applies (no password needed).
let r = t.post({ action: 'apply', application: { name: 'Ana Lopez', region: 'West', market: 'Phoenix', instagram: 'ana.babygear', roles: 'On-camera creator, Editor', camera: 'Love it', why: 'I love teaching.', capacity: '1–2 posts a week', interests: 'Car seats', experience: 'Beginner', agreed: true } });
assert.equal(r.ok, true);
// The shared creator password opens nothing by itself.
for (const a of ['ideas', 'club', 'activity', 'applications', 'reels', 'drivemap', 'gate']) assert.equal(t.get({ action: a, key: 'shared-test-pass' }).locked, true, a);
for (const a of ['idea-save', 'club-submit', 'pitch', 'start', 'admin-data', 'account-me']) assert.equal(t.post({ action: a, key: 'shared-test-pass', coordKey: 'nope' }).locked, true, a);
// Applicants' details: coordinators only (no notes), status Submitted.
assert.equal(t.get({ action: 'applications', key }).locked, true);
r = t.get({ action: 'applications', key, coord: 'Coord-123' }); assert.equal(r.applications.length, 1); assert.equal(r.applications[0].status, 'Submitted'); assert.equal(r.applications[0].notes, undefined);
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
// Whole weeks and months after joining count; backdate both members so there's history to check.
vm.runInContext(`(() => { const sh = clubSheet('Members'); readTable(sh, CLUB_TABS['Members']).forEach(m => writeRow(sh, CLUB_TABS['Members'], { joined: '${day(-70)}' }, m._row)); })()`, t.ctx);
r = t.post({ action: 'admin-data', ...coord }); assert.ok(r.participation.find(p => p.name === 'Kristin').weeksFinished >= 8);
assert.equal(r.settings.requiredPosts, 1); assert.equal(r.settings.requiredStories, 1); assert.equal(r.settings.briefEveryWeeks, 2); assert.equal(r.settings.requiredThemed, undefined);
// Briefs come every other week: a brief runs two weeks, and duplicating one moves it two weeks on.
r = t.post({ action: 'admin-brief', ...coord, brief: { title: 'Registry Mistakes', theme: 'Registry Mistakes', audios: 'Trending sound: “Oh no”', launches: 'New Nuna stroller', format: 'Instagram Reel', length: '15–30 seconds', weekStart: day(-28), cta: 'Explore the free Baby Concierge service.' } });
const past = r.savedId; assert.equal(r.briefs.find(b => b.id === past).status, 'Draft'); assert.equal(r.briefs.find(b => b.id === past).weekEnd, day(-15)); assert.equal(r.briefs.find(b => b.id === past).audios, 'Trending sound: “Oh no”');
r = t.post({ action: 'admin-brief', ...coord, op: 'publish', brief: { id: past } });
r = t.post({ action: 'admin-brief', ...coord, op: 'duplicate', brief: { id: past } }); const mid = r.savedId; assert.equal(r.briefs.find(b => b.id === mid).weekStart, day(-14));
r = t.post({ action: 'admin-brief', ...coord, op: 'publish', brief: { id: mid } });
r = t.post({ action: 'admin-brief', ...coord, brief: { title: 'Stroller Myths', weekStart: day(-1) } }); const cur = r.savedId;
r = t.post({ action: 'admin-brief', ...coord, op: 'publish', brief: { id: cur } }); assert.equal(r.current, cur);
r = t.post({ action: 'admin-brief', ...coord, op: 'duplicate', brief: { id: cur } }); const extra = r.savedId;
r = t.post({ action: 'admin-brief', ...coord, op: 'archive', brief: { id: extra } }); assert.equal(r.briefs.find(b => b.id === extra).status, 'Archived');
// Save & publish in one step (needs a start date), edit a live brief, and delete.
assert.match(t.post({ action: 'admin-brief', ...coord, publish: true, brief: { title: 'No date yet' } }).error, /start date/);
assert.equal(t.post({ action: 'admin-data', ...coord }).briefs.find(b => b.title === 'No date yet'), undefined); // nothing half-saved
r = t.post({ action: 'admin-brief', ...coord, publish: true, brief: { title: 'Holiday gifting', weekStart: day(30) } }); const gift = r.savedId; assert.equal(r.briefs.find(b => b.id === gift).status, 'Published');
r = t.post({ action: 'admin-brief', ...coord, brief: { id: gift, hooks: 'Gifts under $50' } }); assert.equal(r.briefs.find(b => b.id === gift).hooks, 'Gifts under $50'); assert.equal(r.briefs.find(b => b.id === gift).status, 'Published');
const before = r.briefs.length; r = t.post({ action: 'admin-brief', ...coord, op: 'delete', brief: { id: gift } });
assert.equal(r.ok, true); assert.equal(r.briefs.length, before - 1); assert.equal(r.briefs.find(b => b.id === gift), undefined); assert.equal(r.current, cur);
assert.equal(t.post({ action: 'admin-brief', ...coord, op: 'delete', brief: { id: gift } }).ok, false);
assert.equal(t.post({ action: 'admin-brief', key, op: 'delete', brief: { id: cur } }).coordLocked, true); // creators can't
// A creator logs a feed post (link required) and a story (link optional: stories disappear).
r = t.get({ action: 'club', key, name: 'ana lopez' }); assert.equal(r.brief.id, cur); assert.equal(r.member.status, 'Active'); assert.equal(r.member.notes, undefined); assert.equal(r.settings.requiredStories, 1);
assert.equal(t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'post', url: 'javascript:alert(1)' }).ok, false);
assert.equal(t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'post', url: '' }).ok, false);
r = t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'post', briefId: cur, url: 'https://www.instagram.com/reel/abc/' }); assert.equal(r.ok, true);
r = t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'story', note: 'Car seat check day' }); assert.equal(r.ok, true);
assert.equal(t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'story', date: day(3) }).ok, false); // not in the future
assert.equal(t.post({ action: 'club-submit', key, name: 'Ana Lopez', kind: 'story', date: day(-60) }).ok, false); // too long ago to self-report
// History: Ana shared a story every week until three weeks ago and a feed post every month; Kristin shared nothing.
const monday = d => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const plus = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const seed = []; for (let w = monday(day(-70)); w <= plus(monday(day(0)), -21); w = plus(w, 7)) seed.push(['story', plus(w, 2)]);
for (let d = -70; d <= -1; d += 10) seed.push(['post', day(d)]);
vm.runInContext(`(() => { const sh = clubSheet('Submissions'); ${JSON.stringify(seed)}.forEach(([kind, date], i) => writeRow(sh, CLUB_TABS['Submissions'], { id: 'seed' + i, submitted: new Date(), date: date, name: 'Ana Lopez', kind: kind, url: kind === 'post' ? 'https://www.instagram.com/p/' + i : '', status: 'Submitted' }, 0)); })()`, t.ctx);
r = t.post({ action: 'admin-data', ...coord });
const sub = r.submissions.find(s => s.briefId === cur); r = t.post({ action: 'admin-sub', ...coord, id: sub.id, status: 'Counted' }); assert.equal(r.submissions.find(s => s.id === sub.id).status, 'Counted');
const pk = r.participation.find(p => p.name === 'Kristin'), pa = r.participation.find(p => p.name === 'Ana Lopez');
assert.equal(pk.standing, 'Needs review'); assert.ok(pk.missedWeeks >= 4); assert.ok(pk.missedMonths >= 1);
assert.equal(pa.standing, 'Reminder'); assert.equal(pa.missedWeeks, 2); assert.equal(pa.missedMonths, 0); assert.equal(pa.thisWeek.stories, 1); assert.ok(pa.thisMonth.posts >= 1); assert.equal(pa.monthsMet, pa.monthsFinished);
assert.equal(r.analytics.activeCreators, 2); assert.equal(r.analytics.thisWeek.stories, 1); assert.equal(r.analytics.thisWeek.creators, 1); assert.equal(r.analytics.lastWeek.eligible, 2); assert.equal(r.analytics.lastWeek.rate, 0);
assert.ok(r.analytics.thisMonth.posts >= 1); assert.equal(r.analytics.briefsRun, 3);
// A story marked "Needs changes" stops counting.
const todays = r.submissions.find(s => s.kind === 'story' && s.date === day(0)); r = t.post({ action: 'admin-sub', ...coord, id: todays.id, status: 'Needs changes' });
assert.equal(r.participation.find(p => p.name === 'Ana Lopez').thisWeek.stories, 0);
// Older rows from the weekly model ("themed"/"flexible") read as feed posts.
vm.runInContext(`writeRow(clubSheet('Submissions'), CLUB_TABS['Submissions'], { id: 'old1', submitted: new Date(), name: 'Kristin', kind: 'themed', url: 'https://www.instagram.com/p/old', status: 'Submitted' }, 0)`, t.ctx);
r = t.post({ action: 'admin-data', ...coord }); assert.equal(r.submissions.find(s => s.id === 'old1').kind, 'post'); assert.equal(r.participation.find(p => p.name === 'Kristin').thisMonth.posts, 1);
// Creator requests a pause; status stays Active until a coordinator changes it.
assert.equal(t.post({ action: 'club-request', key, name: 'Kristin', type: 'pause', until: day(20), note: 'Family trip' }).ok, true);
r = t.post({ action: 'admin-data', ...coord }); let k = r.members.find(m => m.name === 'Kristin'); assert.equal(k.request, 'Pause'); assert.equal(k.status, 'Active');
r = t.post({ action: 'admin-member', ...coord, name: 'Kristin', status: 'Paused', clearRequest: true }); k = r.members.find(m => m.name === 'Kristin');
assert.equal(k.status, 'Paused'); assert.equal(k.request, ''); assert.equal(r.participation.find(p => p.name === 'Kristin').standing, 'Paused');
assert.equal(t.post({ action: 'club-submit', key, name: 'Kristin', kind: 'post', url: 'https://example.com/x' }).ok, false); // paused: nothing to log
// Settings are adjustable and validated: with no story requirement, Kristin's missing feed post is a reminder.
t.post({ action: 'admin-member', ...coord, name: 'Kristin', status: 'Active' });
vm.runInContext(`(() => { const sh = clubSheet('Submissions'); const r = readTable(sh, CLUB_TABS['Submissions']).find(x => x.id === 'old1'); writeRow(sh, CLUB_TABS['Submissions'], { status: 'Needs changes' }, r._row); })()`, t.ctx);
r = t.post({ action: 'admin-settings', ...coord, settings: { requiredStories: '0', postReviewMonths: '9', creatorCircleUrl: 'https://tot-squad-hub.disco.co/channel/abc' } });
assert.equal(r.settings.requiredStories, 0); assert.equal(r.settings.postReviewMonths, 9); assert.equal(r.participation.find(p => p.name === 'Kristin').standing, 'Reminder');
assert.equal(t.post({ action: 'admin-settings', ...coord, settings: { creatorCircleUrl: 'javascript:x' } }).ok, false);
assert.equal(t.post({ action: 'admin-settings', ...coord, settings: { requiredPosts: '-1' } }).ok, false);
// Declined/Waitlisted stay off the creators' list; Idea Bank is open; nothing was deleted.
assert.match(t.post({ action: 'apply', application: { name: 'Bo', why: 'Hi', agreed: true } }).error, /email or your Instagram/); // we need a way to reply
t.post({ action: 'apply', application: { name: 'Bo', email: 'bo@example.com', why: 'Hi', agreed: true } });
r = t.post({ action: 'admin-data', ...coord }); t.post({ action: 'admin-app', ...coord, id: r.applications.find(a => a.name === 'Bo').id, status: 'Waitlisted' });
assert.deepEqual(t.get({ action: 'applications', key, coord: 'Coord-123' }).applications.map(a => a.name), ['Ana Lopez']);
assert.equal(t.post({ action: 'admin-data', ...coord }).applications.find(a => a.name === 'Bo').email, 'bo@example.com');
assert.equal(t.get({ action: 'ideas' }).locked, true); assert.equal(t.get({ action: 'ideas', key }).ok, true); // Idea Bank: creators only
assert.equal(t.post({ action: 'admin-data', ...coord }).briefs.length, 4);
// Coordinator tools stay off until COORDINATOR_PASSCODE is set.
assert.equal(boot({ MENTOR_PASSCODE: 'shared-test-pass' }).post({ action: 'admin-data', key }).locked, true); // no coordinator code set up: nothing opens
// Older application rows (before 2.0) still read, get an ID, and "New" reads as Submitted.
const t2 = boot(); const sh = t2.ctx.applySheet(); sh.appendRow([new Date(), 'Old Timer', 'East', '', '', '', 'Because', '', 'Yes', 'New', '']);
r = t2.post({ action: 'admin-data', ...coord }); assert.equal(r.applications[0].status, 'Submitted'); assert.ok(r.applications[0].id);
// Without the script property, the code can live on the Settings tab instead, and it's never sent to the browser.
const t3 = boot({ MENTOR_PASSCODE: 'shared-test-pass' });
assert.equal(t3.post({ action: 'admin-data', key }).locked, true); // no coordinator code yet
vm.runInContext(`(() => { clubSettings(); const sh = clubSheet('Settings'); const r = readTable(sh, CLUB_TABS['Settings']).find(x => x.key === 'coordinatorCode'); writeRow(sh, CLUB_TABS['Settings'], { value: 'bossy' }, r._row); })()`, t3.ctx);
assert.equal(t3.post({ action: 'admin-data', key: 'bossy', coordKey: 'nope' }).coordLocked, true);
r = t3.post({ action: 'admin-data', key: 'bossy', coordKey: 'bossy' }); assert.equal(r.ok, true); assert.equal(r.settings.coordinatorCode, undefined);
assert.equal(t3.get({ action: 'club', key: 'bossy', name: 'x' }).settings.coordinatorCode, undefined);
t3.post({ action: 'admin-settings', key: 'bossy', coordKey: 'bossy', settings: { coordinatorCode: 'hacked' } }); assert.equal(t3.post({ action: 'admin-data', key: 'bossy', coordKey: 'bossy' }).ok, true);
// Coordinators can change the shared creator password; it's never sent back to the browser.
assert.equal(t3.post({ action: 'admin-settings', key: 'bossy', coordKey: 'bossy', creatorPassword: 'short' }).ok, false);
assert.equal(t3.post({ action: 'admin-settings', key: 'bossy', coordKey: 'bossy', creatorPassword: 'bossy' }).ok, false);
r = t3.post({ action: 'admin-settings', key: 'bossy', coordKey: 'bossy', creatorPassword: 'New-Creator-2026' }); assert.equal(r.ok, true); assert.doesNotMatch(JSON.stringify(r), /New-Creator-2026/);
assert.equal(t3.post({ action: 'account-claimable', key: 'shared-test-pass' }).locked, true); // the old one stops working
r = t3.post({ action: 'account-claimable', key: 'new-creator-2026' }); assert.equal(r.ok, true); assert.equal(r.shared, true); // not case-sensitive
assert.equal(t3.post({ action: 'account-claimable', key: 'bossy' }).shared, false); // coordinators can open set-up too, but it isn't the shared one
// Wrong set-up passwords are capped.
for (let i = 0; i < 30; i++) t3.post({ action: 'account-claimable', key: 'guess' + i });
assert.match(t3.post({ action: 'account-claimable', key: 'guess-x' }).error, /Too many tries/);
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
const t6 = boot(), shared = 'shared-test-pass';
r = t6.post({ action: 'account-setup', agreed: true, key: 'nope', name: 'Kristin Smith', password: 'sunshine-toy-9' }); assert.equal(r.locked, true);
assert.match(t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin Smith', password: 'short' }).error, /8 characters/);
assert.match(t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin Smith', password: 'SHARED-TEST-PASS' }).error, /yours/);
assert.match(t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin Smith', password: 'Coord-123' }).error, /yours/);
assert.equal(t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin', password: 'sunshine-toy-9' }).fullName, true); // first name alone isn't enough
assert.match(t6.post({ action: 'account-setup', key: shared, name: 'Kristin Smith', password: 'sunshine-toy-9' }).error, /guidelines/); // has to agree to the guidelines
assert.equal(t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin 2', password: 'sunshine-toy-9' }).fullName, true);
r = t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin Smith', password: 'sunshine-toy-9' });
assert.equal(r.ok, true); assert.equal(r.name, 'Kristin Smith'); assert.match(r.key, /^acct\.[\w-]+\.[\w-]+$/); const kKey = r.key;
// The sheet never holds the password or the device key.
const acctSheet = JSON.stringify(t6.g.books.get(vm.runInContext("PropertiesService.getScriptProperties().getProperty('CLUB_SHEET_ID')", t6.ctx)).getSheetByName('Accounts').rows);
assert.ok(!acctSheet.includes('sunshine-toy-9')); assert.ok(!acctSheet.includes(kKey.split('.')[2]));
// Someone else can't take the name once it has a password.
r = t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'kristin smith', password: 'another-pass-1' }); assert.equal(r.ok, false); assert.equal(r.taken, true);
// The device key works everywhere the creator password does, and you act as yourself.
assert.equal(t6.get({ action: 'gate', key: kKey }).ok, true);
assert.equal(t6.get({ action: 'gate', key: kKey.slice(0, -2) + 'zz' }).locked, true);
// Sign in on another device.
assert.equal(t6.post({ action: 'account-login', name: 'Kristin Smith', password: 'wrong-password' }).wrong, true);
assert.equal(t6.post({ action: 'account-login', name: 'Kristin', password: 'sunshine-toy-9' }).fullName, true);
r = t6.post({ action: 'account-login', name: 'KRISTIN SMITH', password: 'sunshine-toy-9' }); assert.equal(r.ok, true); const kKey2 = r.key; assert.notEqual(kKey2, kKey);
// Bio: create, read (public), update, delete.
assert.deepEqual(t6.get({ action: 'bios' }).bios, []);
assert.equal(t6.post({ action: 'bio-save', key: shared, bio: 'Hi' }).locked, true); // the shared password alone can't write a bio
assert.equal(t6.post({ action: 'bio-save', key: kKey, bio: '   ' }).ok, false);
r = t6.post({ action: 'bio-save', key: kKey, bio: 'Mom of three in Holly Springs, NC.\nFormer TV producer.' }); assert.equal(r.ok, true); assert.equal(r.bio, 'Mom of three in Holly Springs, NC. Former TV producer.');
assert.deepEqual(t6.get({ action: 'bios' }).bios, [{ name: 'Kristin Smith', claimed: '', bio: 'Mom of three in Holly Springs, NC. Former TV producer.' }]);
r = t6.post({ action: 'account-me', key: kKey2 }); assert.equal(r.bio, 'Mom of three in Holly Springs, NC. Former TV producer.'); assert.equal(r.bioSet, true);
assert.equal(t6.post({ action: 'bio-save', key: kKey2, bio: 'x'.repeat(900) }).bio.length, 400);
r = t6.post({ action: 'bio-delete', key: kKey }); assert.equal(r.bio, ''); assert.deepEqual(t6.get({ action: 'bios' }).bios, [{ name: 'Kristin Smith', claimed: '', bio: '' }]);
// Change password: the other device is signed out.
assert.equal(t6.post({ action: 'account-password', key: kKey, current: 'nope-nope', password: 'new-password-2' }).ok, false);
r = t6.post({ action: 'account-password', key: kKey, current: 'sunshine-toy-9', password: 'new-password-2' }); assert.equal(r.ok, true);
assert.equal(t6.get({ action: 'gate', key: kKey2 }).locked, true); assert.equal(t6.get({ action: 'gate', key: kKey }).ok, true);
assert.equal(t6.post({ action: 'account-login', name: 'Kristin Smith', password: 'sunshine-toy-9' }).ok, false);
assert.equal(t6.post({ action: 'account-login', name: 'Kristin Smith', password: 'new-password-2' }).ok, true);
// Club actions use the signed-in name, not whatever name is sent; a first-name-only roster entry still matches.
t6.post({ action: 'admin-seed', key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Sarah', members: [{ name: 'Kristin' }, { name: 'Lora' }] });
r = t6.get({ action: 'club', key: kKey, name: 'Somebody Else' }); assert.equal(r.ok, true); assert.equal(r.member.name, 'Kristin');
assert.equal(vm.runInContext("rosterName('Lora Jones')", t6.ctx), 'Lora'); assert.equal(vm.runInContext("rosterName('Ana Lopez')", t6.ctx), 'Ana Lopez');
// Coordinators see accounts, can take a bio down and reset a password; the creator then sets a new one with the creator password.
const tc = { key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Sarah' };
r = t6.post({ action: 'admin-data', ...tc }); assert.equal(r.accounts[0].name, 'Kristin Smith'); assert.equal(r.accounts[0].hasPassword, true); assert.equal(r.accounts[0].hash, undefined);
r = t6.post({ action: 'admin-account', ...tc, name: 'Kristin Smith', op: 'reset' }); assert.equal(r.accounts[0].hasPassword, false);
assert.equal(t6.get({ action: 'gate', key: kKey }).locked, true);
assert.equal(t6.post({ action: 'account-setup', agreed: true, key: shared, name: 'Kristin Smith', password: 'fresh-start-3' }).ok, true);
// Sign out forgets this device's key.
r = t6.post({ action: 'account-login', name: 'Kristin Smith', password: 'fresh-start-3' }); assert.equal(t6.post({ action: 'account-signout', key: r.key }).ok, true); assert.equal(t6.get({ action: 'gate', key: r.key }).locked, true);
// Too many wrong tries are slowed down.
for (let i = 0; i < 10; i++) t6.post({ action: 'account-login', name: 'Kristin Smith', password: 'guess-' + i });
assert.match(t6.post({ action: 'account-login', name: 'Kristin Smith', password: 'fresh-start-3' }).error, /Too many/);
// Idea Bank: creators edit and delete the ideas credited to them; coordinators add, edit and delete any idea.
{
  const t7 = boot(), ck = { key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Sarah' };
  t7.post({ action: 'admin-seed', ...ck, members: [{ name: 'Kristin' }, { name: 'Lora' }] });
  const acct = (name, pw) => t7.post({ action: 'account-setup', agreed: true, key: 'shared-test-pass', name, password: pw }).key;
  const kris = acct('Kristin Smith', 'kristin-pass-1'), lora = acct('Lora Jones', 'lora-pass-123'), ana = acct('Ana Lopez', 'ana-pass-1234');
  r = t7.post({ action: 'pitch', key: kris, name: 'Somebody', pitch: { title: 'Car seat myths', idea: 'Three myths in 30 seconds' } });
  const kid = r.idea.id; assert.deepEqual(r.idea.credit, ['Kristin']); // credited to the signed-in creator, by roster name
  const ideasNow = () => t7.get({ action: 'ideas', key: kris }).ideas, one = id => ideasNow().find(i => i.id === id);
  // Someone else can't change or delete it; the shared password alone can't either.
  assert.match(t7.post({ action: 'idea-save', key: lora, idea: { id: kid, title: 'Mine now' } }).error, /credited to you/);
  assert.match(t7.post({ action: 'idea-delete', key: lora, id: kid }).error, /credited to you/);
  assert.equal(t7.post({ action: 'idea-save', key: 'shared-test-pass', idea: { id: kid, title: 'x' } }).locked, true);
  assert.equal(one(kid).title, 'Car seat myths');
  // The creator edits their own idea; credit stays as it was.
  r = t7.post({ action: 'idea-save', key: kris, idea: { id: kid, title: 'Car seat myths, busted', summary: 'Updated', credit: ['Lora'] } });
  assert.equal(r.ok, true); assert.equal(one(kid).title, 'Car seat myths, busted'); assert.deepEqual(one(kid).credit, ['Kristin']);
  // A creator adding an idea gets the credit.
  r = t7.post({ action: 'idea-save', key: ana, idea: { title: 'Registry roast', credit: ['Taylor'] } }); const aid = r.idea.id;
  assert.deepEqual(one(aid).credit, ['Ana Lopez']); assert.notEqual(aid, '');
  // Coordinators can edit any idea, including its credit, and add their own.
  r = t7.post({ action: 'idea-save', ...ck, idea: { id: kid, credit: ['Kristin', 'Lora'], stage: 'casting' } }); assert.equal(r.ok, true);
  assert.deepEqual(one(kid).credit, ['Kristin', 'Lora']); assert.equal(one(kid).stage, 'casting');
  assert.equal(t7.post({ action: 'idea-save', key: lora, idea: { id: kid, title: 'Co-credited now' } }).ok, true); // Lora is credited now
  r = t7.post({ action: 'idea-save', ...ck, idea: { title: 'Holiday gift guide', credit: ['Taylor', 'Sarah'] } }); const cid = r.idea.id;
  assert.deepEqual(one(cid).credit, ['Taylor', 'Sarah']);
  assert.equal(t7.post({ action: 'idea-delete', ...ck, id: aid }).ok, true); assert.equal(one(aid), undefined);
  // Building on an idea stays open to every signed-in creator.
  assert.equal(t7.post({ action: 'idea-build', key: ana, id: cid, note: 'Add a stocking stuffer round' }).ok, true);
  // The creator deletes their own idea.
  assert.equal(t7.post({ action: 'idea-delete', key: kris, id: kid }).ok, true); assert.equal(one(kid), undefined);
  assert.equal(t7.post({ action: 'idea-delete', key: kris, id: kid }).ok, false);
}
// Before launch: each current Squad member claims their first name, adds their last name and a password; the roster syncs.
{
  const t8 = boot(), ck = { key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Taylor' };
  t8.post({ action: 'admin-seed', ...ck, members: [{ name: 'Kristin', market: 'East' }, { name: 'Lora' }] });
  vm.runInContext(`writeRow(clubSheet('Submissions'), CLUB_TABS['Submissions'], { id: 'k1', submitted: new Date(), date: todayIso(), name: 'Kristin', kind: 'story', status: 'Submitted' }, 0)`, t8.ctx);
  const setup = (name, claim, pw = 'squad-pass-1') => t8.post({ action: 'account-setup', agreed: true, key: 'shared-test-pass', name, claim, password: pw });
  assert.deepEqual(t8.get({ action: 'claimed' }).claimed, []); // public: no password needed
  assert.match(setup('Kris Smith', 'Kristin').error, /start with Kristin/);
  r = setup('Kristin Smith', 'Kristin'); assert.equal(r.ok, true); assert.equal(r.claimed, 'Kristin'); const kk = r.key;
  assert.deepEqual(t8.get({ action: 'claimed' }).claimed, ['Kristin']);
  assert.deepEqual(t8.get({ action: 'claimed' }).claims, [{ claimed: 'Kristin', name: 'Kristin Smith' }]);
  assert.match(setup('Kristin Jones', 'Kristin').error, /already claimed by Kristin Smith/); // one claim per name
  // The roster row and her logged story moved to her full name; market and status are kept.
  r = t8.post({ action: 'admin-data', ...ck });
  const km = r.members.find(m => m.name === 'Kristin Smith'); assert.ok(km); assert.equal(km.market, 'East'); assert.equal(km.status, 'Active');
  assert.equal(r.members.some(m => m.name === 'Kristin'), false); assert.equal(r.submissions.find(s => s.id === 'k1').name, 'Kristin Smith');
  assert.equal(r.accounts.find(a => a.name === 'Kristin Smith').claimed, 'Kristin');
  r = t8.post({ action: 'admin-seed', ...ck, members: [{ name: 'Kristin' }, { name: 'Atiba' }] }); assert.equal(r.members.some(m => m.name === 'Kristin'), false); assert.ok(r.members.some(m => m.name === 'Atiba')); // no duplicate for a claimed name
  assert.equal(t8.get({ action: 'club', key: kk }).member.name, 'Kristin Smith'); // her dashboard follows
  // Someone on the Squad list but not yet on the roster is added as an Active founding member.
  r = setup('Melissa Grant', 'Melissa'); assert.equal(r.ok, true);
  assert.equal(t8.post({ action: 'admin-data', ...ck }).members.find(m => m.name === 'Melissa Grant').status, 'Active');
  // Ideas credited to "Kristin" are hers to edit.
  const idea = t8.post({ action: 'idea-save', ...ck, idea: { title: 'Old idea', credit: ['Kristin'] } }).idea;
  assert.equal(t8.post({ action: 'idea-save', key: kk, idea: { id: idea.id, title: 'Old idea, updated' } }).ok, true);
  // New creators who aren't on the list just use their full name; nothing is claimed.
  r = setup('Ana Lopez', ''); assert.equal(r.ok, true); assert.equal(r.claimed, '');
  assert.deepEqual(t8.get({ action: 'claimed' }).claimed.sort(), ['Kristin', 'Melissa']);
  // Accounts made before claiming existed: a coordinator links them, or they're linked on their next sign-in.
  vm.runInContext(`(() => { const sh = accountsSheet(); ['Taylor Vanderwolk', 'Lora Bell'].forEach((n, i) => { const salt = 'salt' + i; writeRow(sh, ACCOUNT_COLS, { id: 'aold000000000' + i, name: n, salt: salt, hash: pwHash('old-pass-12' + i, salt), tokens: '' }, 0); }); })()`, t8.ctx);
  t8.post({ action: 'admin-seed', ...ck, members: [{ name: 'Taylor' }] });
  assert.match(t8.post({ action: 'admin-account', ...ck, name: 'Taylor Vanderwolk', op: 'claim', claim: 'Kristin' }).error, /doesn’t start with Kristin/);
  r = t8.post({ action: 'admin-account', ...ck, name: 'Taylor Vanderwolk', op: 'claim', claim: 'Taylor' }); assert.equal(r.ok, true);
  assert.equal(r.accounts.find(a => a.name === 'Taylor Vanderwolk').claimed, 'Taylor'); assert.ok(r.members.some(m => m.name === 'Taylor Vanderwolk')); assert.equal(r.members.some(m => m.name === 'Taylor'), false);
  r = t8.post({ action: 'account-login', name: 'Lora Bell', password: 'old-pass-121' }); assert.equal(r.ok, true); assert.equal(r.claimed, 'Lora'); // Lora is on the roster, so she's linked
  assert.ok(t8.post({ action: 'admin-data', ...ck }).members.some(m => m.name === 'Lora Bell'));
  // Approved applicants: on the roster by their full name, they claim it the same way with the creator password.
  t8.post({ action: 'apply', application: { name: 'Dana Park', email: 'dana@example.com', why: 'Love it', agreed: true } });
  r = t8.post({ action: 'admin-data', ...ck }); t8.post({ action: 'admin-app', ...ck, id: r.applications.find(a => a.name === 'Dana Park').id, status: 'Approved' });
  assert.equal(t8.post({ action: 'account-claimable', key: 'nope' }).locked, true);
  let cl = t8.post({ action: 'account-claimable', key: 'shared-test-pass' }).names; assert.ok(cl.includes('Dana Park')); assert.ok(!cl.includes('Kristin Smith')); assert.ok(!cl.includes('Lora Bell'));
  r = setup('Dana Park', 'Dana Park'); assert.equal(r.ok, true); assert.equal(r.claimed, 'Dana Park');
  assert.ok(!t8.post({ action: 'account-claimable', key: 'shared-test-pass' }).names.includes('Dana Park'));
  assert.equal(t8.post({ action: 'admin-data', ...ck }).members.filter(m => m.name === 'Dana Park').length, 1); // no duplicate roster row
}
// Round Up casting call: answers land in the answers sheet, one column per question.
{
  const t9 = boot(), A = q => ({ q, a: 'x' });
  assert.equal(t9.post({ action: 'cast-answers', name: 'Pat Lee', project: 'Nope', answers: [A('Favorite stroller?')] }).ok, false);
  assert.equal(t9.post({ action: 'cast-answers', name: 'Pat Lee', project: 'Tot Squad Round Up: Point & Answer', answers: [] }).ok, false);
  r = t9.post({ action: 'cast-answers', name: 'Pat Lee', contact: '@pat', project: 'Tot Squad Round Up: Point & Answer', answers: [{ q: 'Favorite stroller?', a: 'Bugaboo Fox 5' }, { q: 'Coffee order?', a: '=HYPERLINK("x")' }] });
  assert.equal(r.ok, true);
  t9.post({ action: 'cast-answers', name: 'Sam Day', project: 'Tot Squad Round Up: Point & Answer', answers: [{ q: 'Favorite car seat?', a: 'Nuna Pipa' }, { q: 'Favorite stroller?', a: 'UPPAbaby Vista' }] });
  const sh = t9.g.books.get(vm.runInContext("PropertiesService.getScriptProperties().getProperty('ANSWERS_SHEET_ID')", t9.ctx)).getSheets()[0];
  assert.deepEqual(sh.rows[0], ['Sent', 'Name', 'How to reach them', 'Casting call', 'Favorite stroller?', 'Coffee order?', 'Favorite car seat?']);
  assert.equal(sh.rows[1][1], 'Pat Lee'); assert.equal(sh.rows[1][4], 'Bugaboo Fox 5'); assert.equal(sh.rows[1][5][0], "'"); // never a formula
  assert.equal(sh.rows[2][4], 'UPPAbaby Vista'); assert.equal(sh.rows[2][6], 'Nuna Pipa');
  assert.equal(t9.post({ action: 'cast-start', name: 'Pat Lee', project: 'Tot Squad Round Up: Point & Answer', agreed: true, type: 'video/mp4', size: 100, fileName: 'p.mp4' }).ok, true);
}
// Casting calls any creator can post: Creators Club calls are live at once; public calls wait for a coordinator.
{
  const t10 = boot(), ck = { key: 'Coord-123', coordKey: 'Coord-123', coordName: 'Sarah' };
  t10.post({ action: 'admin-seed', ...ck, members: [{ name: 'Kristin' }, { name: 'Lora' }] });
  const acct = (name, claim) => t10.post({ action: 'account-setup', agreed: true, key: 'shared-test-pass', name, claim, password: 'squad-pass-1' }).key;
  const kk = acct('Kristin Smith', 'Kristin'), lk = acct('Lora Bell', 'Lora');
  const book = () => t10.g.books.get(vm.runInContext("PropertiesService.getScriptProperties().getProperty('CLUB_SHEET_ID')", t10.ctx));
  // Reading before anything is posted creates nothing.
  assert.deepEqual(t10.get({ action: 'casting' }).calls, []); assert.equal(book().getSheetByName('Casting calls'), null);
  // Signed out, or with the shared password: no posting.
  assert.equal(t10.post({ action: 'call-save', call: { title: 'X' } }).locked, true);
  assert.equal(t10.post({ action: 'call-save', key: 'shared-test-pass', call: { title: 'X' } }).locked, true);
  assert.match(t10.post({ action: 'call-save', key: kk, call: { title: 'Stroller Fold Race', description: 'Fastest fold wins.' } }).error, /film/);
  assert.match(t10.post({ action: 'call-save', key: kk, call: { title: 'Stroller Fold Race', description: 'x', instructions: 'y', deadline: '2020-01-01' } }).error, /passed/);
  assert.match(t10.post({ action: 'call-save', key: kk, call: { title: 'Meet the Squad, Part 2: Pass the Toy', description: 'x', instructions: 'y' } }).error, /already uses/);
  // A Creators Club call: live for signed-in creators, never shown signed out.
  r = t10.post({ action: 'call-save', key: kk, call: { title: 'Stroller Fold Race', description: 'Fastest fold wins.', instructions: 'Film one fold, start to finish.', steps: 'Hold the phone upright\nStart with the stroller open', questions: ['Which stroller?'], deadline: day(10), audience: 'network', ideaId: 'fx-1' } });
  assert.equal(r.ok, true); assert.equal(r.call.audience, 'network'); assert.equal(r.call.lead, 'Kristin Smith'); assert.deepEqual(r.call.steps, ['Hold the phone upright', 'Start with the stroller open']); assert.equal(r.call.review, '');
  const net = r.call.id;
  assert.deepEqual(t10.get({ action: 'casting' }).calls, []);
  assert.equal(t10.get({ action: 'casting', key: lk }).calls.find(c => c.id === net).mine, false);
  assert.equal(t10.get({ action: 'casting', key: kk }).calls.find(c => c.id === net).mine, true);
  assert.equal(book().getSheetByName('Casting calls').rows[1].includes('Kristin Smith'), true); // the poster's account, so only they can edit it
  // Uploads: a Creators Club call needs a sign-in; signed in, the video is filed under the poster's call by the uploader's name.
  const vid = { project: 'Stroller Fold Race', agreed: true, type: 'video/mp4', size: 100, fileName: 'fold.mp4' };
  assert.equal(t10.post({ action: 'cast-start', name: 'Pat Lee', ...vid }).ok, false);
  assert.equal(t10.post({ action: 'cast-start', name: 'Pat Lee', key: lk, ...vid }).ok, true);
  assert.ok(t10.g.made.some(f => /Stroller Fold Race\/Lora Bell$/.test(f)));
  assert.equal(t10.post({ action: 'cast-answers', key: lk, project: 'Stroller Fold Race', answers: [{ q: 'Which stroller?', a: 'Vista' }] }).ok, true);
  assert.equal(t10.get({ action: 'casting', key: kk }).calls.find(c => c.id === net).responses, 1);
  assert.match(t10.post({ action: 'call-save', key: kk, call: { id: net, title: 'Renamed', description: 'x', instructions: 'y' } }).error, /title can’t change/);
  // Only the poster (or a coordinator) edits or closes it.
  assert.match(t10.post({ action: 'call-save', key: lk, call: { id: net, title: 'Stroller Fold Race', description: 'Mine now', instructions: 'y' } }).error, /you posted/);
  assert.match(t10.post({ action: 'call-status', key: lk, id: net, status: 'closed' }).error, /you posted/);
  r = t10.post({ action: 'call-status', key: kk, id: net, status: 'closed' }); assert.equal(r.call.status, 'closed'); assert.equal(r.call.open, false);
  assert.equal(t10.get({ action: 'casting', key: lk }).calls.some(c => c.id === net), false); // closed: gone for others
  assert.equal(t10.get({ action: 'casting', key: kk }).calls.some(c => c.id === net), true);  // still listed for its poster
  assert.equal(t10.post({ action: 'cast-start', name: 'Lora', key: lk, ...vid }).ok, false);
  assert.equal(t10.post({ action: 'call-status', key: kk, id: net, status: 'open' }).call.open, true);
  // A public call waits: live for the Club, not on the public page, until a coordinator approves it.
  r = t10.post({ action: 'call-save', key: lk, call: { title: 'Car Seat Myths', description: 'One myth, busted.', instructions: 'Say the myth, then the truth.', audience: 'public' } });
  const pub = r.call.id; assert.equal(r.call.review, 'waiting');
  assert.deepEqual(t10.get({ action: 'casting' }).calls, []);
  assert.equal(t10.post({ action: 'cast-start', name: 'Pat Lee', ...vid, project: 'Car Seat Myths' }).ok, false);
  assert.ok(t10.get({ action: 'casting', key: kk }).calls.some(c => c.id === pub));
  assert.equal(t10.post({ action: 'admin-call', key: lk, coordKey: 'nope', id: pub, decision: 'approve' }).coordLocked, true);
  r = t10.post({ action: 'admin-data', ...ck }); assert.equal(r.calls.find(c => c.id === pub).review, 'waiting');
  r = t10.post({ action: 'admin-call', ...ck, id: pub, decision: 'approve' }); assert.equal(r.calls.find(c => c.id === pub).review, 'approved');
  let open = t10.get({ action: 'casting' }).calls; assert.equal(open.length, 1); assert.equal(open[0].title, 'Car Seat Myths');
  assert.equal(open[0].lead, 'Lora'); assert.equal(open[0].responses, undefined); assert.equal(open[0].reviewNote, undefined); assert.ok(!JSON.stringify(open).includes('Lora Bell')); // no account names in public
  assert.equal(t10.post({ action: 'cast-start', name: 'Pat Lee', ...vid, project: 'Car Seat Myths' }).ok, true); // anyone, no sign-in
  // Changing only the due date keeps the approval; changing the wording sends it back.
  r = t10.post({ action: 'call-save', key: lk, call: { id: pub, title: 'Car Seat Myths', description: 'One myth, busted.', instructions: 'Say the myth, then the truth.', audience: 'public', deadline: day(5) } });
  assert.equal(r.call.review, 'approved');
  r = t10.post({ action: 'call-save', key: lk, call: { id: pub, title: 'Car Seat Myths', description: 'Two myths, busted.', instructions: 'Say the myth, then the truth.', audience: 'public' } });
  assert.equal(r.call.review, 'waiting'); assert.deepEqual(t10.get({ action: 'casting' }).calls, []); // public cache cleared
  // Keep it in the Club: it stays live for creators, with a note for the poster.
  r = t10.post({ action: 'admin-call', ...ck, id: pub, decision: 'club', note: 'Great for us first' });
  const kept = t10.get({ action: 'casting', key: lk }).calls.find(c => c.id === pub); assert.equal(kept.audience, 'network'); assert.match(kept.reviewNote, /Kept in the Creators Club: Great for us first/);
  // Posting from your own idea moves it from Idea to Casting; someone else's idea stays where it is.
  const myIdea = t10.post({ action: 'idea-save', key: kk, idea: { title: 'Diaper Bag Dump', summary: 'What’s inside' } }).idea;
  const lorasIdea = t10.post({ action: 'idea-save', key: lk, idea: { title: 'Swaddle Speed Run', summary: 'Go' } }).idea;
  t10.post({ action: 'call-save', key: kk, call: { title: 'Diaper Bag Dump', description: 'x', instructions: 'y', ideaId: myIdea.id } });
  t10.post({ action: 'call-save', key: kk, call: { title: 'Swaddle Speed Run', description: 'x', instructions: 'y', ideaId: lorasIdea.id } });
  const stages = Object.fromEntries(t10.get({ action: 'ideas', key: kk }).ideas.map(i => [i.id, i.stage]));
  assert.equal(stages[myIdea.id], 'casting'); assert.equal(stages[lorasIdea.id], 'idea');
  // A coordinator's own public call is approved as posted; formulas never reach the sheet.
  r = t10.post({ action: 'call-save', ...ck, call: { title: 'Bath Time Tips', description: '=IMPORTXML("x")', instructions: 'Film one tip.', audience: 'public' } });
  assert.equal(r.call.review, 'approved'); assert.equal(r.call.description[0], "'");
}
console.log('PASS: Creators Club 2.0 backend workflows');

// B-roll library sync: approved folders only, signed-in creators only, no client-chosen folders, paging and a short cache.
{
  const LIB_OLD = '1Nl5OGfhaRJ1ltRYNNrJGiAFTia-lnYHS', LIB = '1Q6fuKOaiTbkB2vTT7koOgHbDQcNTSx5c', TAYLOR = '1SCiEs_VRfE0UbxVWFoMmftbynu2iUo0O', SARAH = '1GN0ZXqA2881MHN5dcLrNMI8c4AZ-YXls';
  const t = boot({ MENTOR_PASSCODE: 'shared-test-pass', COORDINATOR_PASSCODE: 'Coord-123', ['C_' + LIB_OLD]: LIB });
  const REVIEW = vm.runInContext('brollReviewFolder().getId()', t.ctx);
  const drive = new Map([ // parent → items
    [LIB, [{ id: SARAH, name: 'Sarah', mimeType: 'application/vnd.google-apps.folder' }, { id: TAYLOR, name: 'Taylor', mimeType: 'application/vnd.google-apps.folder' },
      { id: 'stray-review', name: 'B-roll to review (old)', mimeType: 'application/vnd.google-apps.folder' }]],
    [SARAH, [{ id: 'sv1', name: 'Bugaboo fold.mov', mimeType: 'video/quicktime', webViewLink: 'https://drive.google.com/file/d/sv1/view', thumbnailLink: 'https://lh3.googleusercontent.com/t1=s220', videoMediaMetadata: { durationMillis: '9400' } },
      { id: 'sv2', name: 'Vista uppababy fold & walk.mov', mimeType: 'video/quicktime', webViewLink: 'https://drive.google.com/file/d/sv2/view' },
      { id: 'sdoc', name: 'notes.txt', mimeType: 'text/plain' }]],
    [TAYLOR, Array.from({ length: 205 }, (_, i) => ({ id: 'tv' + i, name: i === 0 ? 'B-roll - Halo' : i === 1 ? 'Lost' : 'strollers_one-hand-fold-' + i + '.mov', mimeType: 'video/mp4' }))],
    [REVIEW, [{ id: 'pending1', name: 'Unreviewed.mov', mimeType: 'video/mp4' }]],
    ['stray-review', [{ id: 'pending2', name: 'Old pending.mov', mimeType: 'video/mp4' }]]
  ]);
  const asked = [];
  t.ctx.UrlFetchApp = { fetch: url => {
    const u = new URL(url), q = u.searchParams.get('q'), parent = q.match(/'([^']+)' in parents/)[1]; asked.push(parent);
    assert.equal(u.searchParams.get('supportsAllDrives'), 'true'); assert.equal(u.searchParams.get('includeItemsFromAllDrives'), 'true');
    let items = (drive.get(parent) || []).filter(f => /mimeType = 'application\/vnd.google-apps.folder'/.test(q) ? f.mimeType === 'application/vnd.google-apps.folder' : /video\//.test(q) ? /^video\//.test(f.mimeType) : true);
    const start = Number(u.searchParams.get('pageToken') || 0), page = items.slice(start, start + 200);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ files: page, nextPageToken: start + 200 < items.length ? String(start + 200) : undefined }) };
  } };
  // Signed out, a wrong key, or the shared creator password: nothing.
  for (const k of [undefined, '', 'acct.fake.key', 'shared-test-pass']) assert.equal(t.get({ action: 'broll-library', key: k }).locked, true, String(k));
  assert.equal(asked.length, 0);
  // Signed in: Taylor's and Sarah's approved folders, Sarah's two videos (not her text file), no review folders.
  t.post({ action: 'admin-seed', key, coordKey: 'Coord-123', coordName: 'Sarah', members: [{ name: 'Sarah' }] });
  const sk = t.post({ action: 'account-setup', agreed: true, key: 'shared-test-pass', name: 'Sarah Stewart', claim: 'Sarah', password: 'stroller-fold-9' }).key;
  let r = t.get({ action: 'broll-library', key: sk });
  assert.equal(r.ok, true); assert.deepEqual(r.folders.map(f => f.name), ['Sarah', 'Taylor']);
  assert.ok(!JSON.stringify(r).includes('pending')); assert.ok(!asked.includes(REVIEW) && !asked.includes('stray-review'));
  const sarah = r.folders.find(f => f.name === 'Sarah');
  assert.equal(sarah.count, 2); assert.equal(sarah.url, 'https://drive.google.com/drive/folders/' + SARAH);
  assert.deepEqual(sarah.clips.map(c => [c.title, c.category]), [['Bugaboo fold', 'strollers'], ['Vista uppababy fold & walk', 'strollers']]);
  assert.equal(sarah.clips[0].url, 'https://drive.google.com/file/d/sv1/view'); assert.equal(sarah.clips[0].length, '0:09'); assert.match(sarah.clips[0].thumbnail, /=s400$/);
  const taylor = r.folders.find(f => f.name === 'Taylor'); assert.equal(taylor.count, 205); // paged past 200
  assert.deepEqual(taylor.clips.slice(0, 3).map(c => [c.title, c.category]), [['Halo', 'nursery'], ['Lost', 'other'], ['One hand fold 2', 'strollers']]); // unclear names stay "other"
  assert.equal(r.total, 207); assert.ok(!('key' in r) && !JSON.stringify(r).includes('Coord-123'));
  // Coordinators too. Cached: a second request doesn't go back to Drive; a coordinator refresh does.
  const before = asked.length; assert.equal(t.get({ action: 'broll-library', key: 'Coord-123' }).ok, true); assert.equal(asked.length, before);
  drive.get(SARAH).push({ id: 'sv3', name: 'car-seats_click.mov', mimeType: 'video/mp4' });
  assert.equal(t.get({ action: 'broll-library', key: sk }).folders.find(f => f.name === 'Sarah').count, 2); // still cached
  assert.equal(t.post({ action: 'admin-broll', key, coordKey: 'Sarah-wrong', coordName: 'Sarah' }).coordLocked, true);
  assert.equal(t.post({ action: 'admin-broll', key, coordKey: 'Coord-123', coordName: 'Sarah' }).refreshed, true);
  r = t.get({ action: 'broll-library', key: sk }); const s3 = r.folders.find(f => f.name === 'Sarah'); assert.equal(s3.count, 3); assert.equal(s3.clips[2].category, 'car-seats');
  // Moved out of the folder: gone after the cache clears.
  drive.set(SARAH, drive.get(SARAH).filter(f => f.id !== 'sv1')); vm.runInContext('brollRefresh()', t.ctx);
  assert.deepEqual(t.get({ action: 'broll-library', key: sk }).folders.find(f => f.name === 'Sarah').clips.map(c => c.id), ['sv2', 'sv3']);
  // A folder ID in the request is ignored: there is no way to ask for another folder.
  vm.runInContext('brollRefresh()', t.ctx); const n = asked.length;
  r = t.get({ action: 'broll-library', key: sk, folder: REVIEW, id: 'pending1', parent: REVIEW }); assert.ok(!JSON.stringify(r).includes('pending')); assert.ok(!asked.slice(n).includes(REVIEW));
  // Extra approved folders (outside the library) come from the coordinators' list only, never the review folder.
  assert.throws(() => vm.runInContext("addBrollFolder('Brollreview2026x', 'Sneaky')", t.ctx), /review folder/); // (the fake folder is named after its ID)
  assert.throws(() => vm.runInContext(`addBrollFolder(${JSON.stringify(REVIEW)}, 'Sneaky')`, t.ctx));
  drive.set('elsewhere01', [{ id: 'ev1', name: 'feeding_bottle-prep.mov', mimeType: 'video/mp4' }]);
  vm.runInContext("addBrollFolder('elsewhere01', 'Kristin')", t.ctx);
  r = t.get({ action: 'broll-library', key: sk }); const k = r.folders.find(f => f.name === 'Kristin'); assert.equal(k.count, 1); assert.equal(k.clips[0].category, 'feeding');
  vm.runInContext("removeBrollFolder('elsewhere01')", t.ctx); assert.ok(!t.get({ action: 'broll-library', key: sk }).folders.some(f => f.name === 'Kristin'));
  // A Drive error is reported, not cached.
  t.ctx.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 500, getContentText: () => '{}' }) }; vm.runInContext('brollRefresh()', t.ctx);
  assert.match(t.get({ action: 'broll-library', key: sk }).error, /couldn’t load/);
  // Uploads still land in the review folder, never the library.
  t.ctx.UrlFetchApp = { fetch: (url, opts) => { t.g.made.push(JSON.parse(opts.payload).parents[0]); return { getHeaders: () => ({ Location: 'https://upload.example/x' }), getResponseCode: () => 200 }; } };
  assert.equal(t.post({ action: 'broll-start', name: 'Pat', fileName: 'x.mov', type: 'video/mp4', size: 10, agreed: true }).ok, true);
  assert.match(t.g.made[t.g.made.length - 1], /B-roll to review\/Pat$/);
}
console.log('PASS: B-roll library sync');
