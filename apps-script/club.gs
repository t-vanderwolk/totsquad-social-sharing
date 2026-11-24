/* =====================================================================================================
   Tot Squad Creators Club 2.0: applications review, members, weekly creative briefs, submissions,
   participation and coordinator tools. Works alongside upload.gs (same Apps Script project).

   Data lives in the "Creators Club program" spreadsheet in the Tot Squad shared drive, created the first
   time it's needed, with tabs Members, Weekly briefs, Submissions and Settings. Coordinators can edit the
   sheet directly too: the app reads columns by their header, so adding or reordering columns is safe.

   Coordinator-only actions need COORDINATOR_PASSCODE (Project Settings > Script properties) on top of the
   creator password. Nothing here deletes anything: statuses change, rows stay.
   ===================================================================================================== */
const CLUB_TABS = {
  'Members': [['name','Name'],['status','Status'],['roles','Roles'],['market','Home market'],['instagram','Instagram'],['interests','Content interests'],['joined','Joined'],['request','Request'],['requestUntil','Request until'],['requestNote','Request note'],['notes','Coordinator notes'],['updated','Last updated'],['updatedBy','Updated by']],
  'Weekly briefs': [['id','ID'],['status','Status'],['weekStart','Week starts'],['weekEnd','Week ends'],['title','Campaign title'],['theme','Weekly theme'],['format','Format'],['length','Length'],['direction','Creative direction'],['hooks','Hooks & talking points'],['deliverables','Deliverables'],['window','Publishing window'],['cta','CTA'],['resources','Assets & resources'],['guidelines','Brand guidelines'],['updated','Last updated'],['updatedBy','Updated by']],
  'Submissions': [['id','ID'],['submitted','Submitted'],['name','Creator'],['briefId','Brief ID'],['briefTitle','Brief'],['kind','Kind'],['url','Link'],['note','Note'],['status','Status'],['reviewedBy','Reviewed by'],['reviewed','Reviewed']],
  'Settings': [['key','Setting'],['value','Value'],['about','What it does']]
};
const CLUB_DEFAULTS = [
  ['requiredThemed', '1', 'Themed posts required each week (the weekly brief)'],
  ['requiredFlexible', '1', 'Flexible contributions each week: another post, a production task or another approved deliverable'],
  ['reminderAfter', '1', 'Missed weeks in a row before a friendly reminder'],
  ['reviewAfter', '2', 'Missed weeks in a row before a coordinator review'],
  ['creatorCircleUrl', '', 'Link to the private Creator Circle channel in Disco'],
  ['coordinators', 'Taylor, Sarah, Linden', 'Who reviews applications and publishes briefs'],
  ['coordinatorCode', '', 'The code coordinators enter to open Coordinator tools. Type it in the Value column. Only people who can open this sheet see it.']
];
const CLUB_NUMBERS = ['requiredThemed', 'requiredFlexible', 'reminderAfter', 'reviewAfter'];
const MEMBER_STATUSES = ['Active', 'Paused', 'Needs Check-In', 'Inactive', 'Alumni'];
const APP_STATUSES = ['Submitted', 'Under Review', 'Approved', 'Waitlisted', 'Declined'];
const BRIEF_STATUSES = ['Draft', 'Published', 'Archived'];
const SUB_STATUSES = ['Submitted', 'Counted', 'Needs changes'];

/* ---------- Sheet helpers ---------- */
function clubBook() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('CLUB_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Creators Club program');
  ss.setSpreadsheetTimeZone(CLUB_TZ);
  DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(ROOTS.collab));
  props.setProperty('CLUB_SHEET_ID', ss.getId());
  return ss;
}
function clubSheet(tab) {
  const ss = clubBook(); let sheet = ss.getSheetByName(tab), fresh = false;
  if (!sheet) {
    const first = ss.getSheets()[0];
    if (first && first.getLastRow() === 0 && first.getName() === 'Sheet1') { sheet = first; sheet.setName(tab); } else sheet = ss.insertSheet(tab);
    fresh = true;
  }
  ensureHeaders(sheet, CLUB_TABS[tab]);
  if (fresh) {
    sheet.setFrozenRows(1);
    const list = { 'Members': MEMBER_STATUSES, 'Weekly briefs': BRIEF_STATUSES, 'Submissions': SUB_STATUSES }[tab];
    if (list) statusList(sheet, CLUB_TABS[tab], 'status', list);
    if (tab === 'Settings') CLUB_DEFAULTS.forEach(r => sheet.appendRow(r));
  }
  return sheet;
}
// Adds any missing header at the end of row 1. Never moves or removes columns.
function ensureHeaders(sheet, cols) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const have = sheet.getLastRow() ? sheet.getRange(1, 1, 1, width).getValues()[0].map(String) : [];
  const missing = cols.map(c => c[1]).filter(label => have.indexOf(label) < 0);
  if (!missing.length) return false;
  const used = have.filter(String).length ? have.length : 0;
  sheet.getRange(1, used + 1, 1, missing.length).setValues([missing]).setFontWeight('bold').setBackground('#f3eaf1');
  return true;
}
function statusList(sheet, cols, key, values) {
  const at = headerIndex(sheet, cols)[key]; if (!at) return;
  sheet.getRange(2, at, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(true).build());
}
function headerIndex(sheet, cols) {
  const width = Math.max(sheet.getLastColumn(), 1), head = sheet.getRange(1, 1, 1, width).getValues()[0].map(String), out = {};
  cols.forEach(([key, label]) => { const i = head.indexOf(label); if (i >= 0) out[key] = i + 1; });
  return out;
}
function readTable(sheet, cols) {
  const idx = headerIndex(sheet, cols), last = sheet.getLastRow(), width = Math.max(sheet.getLastColumn(), 1);
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, width).getValues().map((r, i) => {
    const o = { _row: i + 2 };
    cols.forEach(([key]) => { const v = idx[key] ? r[idx[key] - 1] : ''; o[key] = v instanceof Date ? v : String(v == null ? '' : v).trim(); });
    return o;
  });
}
// Writes only the given keys, by header. row = 0 appends a new row.
function writeRow(sheet, cols, obj, row) {
  const idx = headerIndex(sheet, cols);
  if (!row) row = sheet.getLastRow() + 1;
  Object.keys(obj).forEach(k => { if (idx[k]) sheet.getRange(row, idx[k]).setValue(obj[k]); });
  return row;
}
const CLUB_TZ = 'America/Phoenix';
function isoDay(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CLUB_TZ, 'yyyy-MM-dd');
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
  const d = new Date(v); return v && !isNaN(d) ? Utilities.formatDate(d, CLUB_TZ, 'yyyy-MM-dd') : '';
}
const isoTime = v => v instanceof Date ? v.toISOString() : String(v || '');
const todayIso = () => Utilities.formatDate(new Date(), CLUB_TZ, 'yyyy-MM-dd');
const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const pick = (value, list, fallback) => list.find(x => x.toLowerCase() === String(value || '').trim().toLowerCase()) || fallback;
const byWeek = (a, b) => a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0;
function newId(prefix) { return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ---------- Reading ---------- */
function clubSettings() {
  const out = {}, sheet = clubSheet('Settings'), rows = readTable(sheet, CLUB_TABS['Settings']);
  CLUB_DEFAULTS.forEach(r => { out[r[0]] = r[1]; if (!rows.some(x => x.key === r[0])) sheet.appendRow(r); }); // settings added later show up in the sheet too
  rows.forEach(r => { if (r.key) out[r.key] = String(r.value); });
  delete out.coordinatorCode; // never sent to the browser
  CLUB_NUMBERS.forEach(k => { const n = Math.round(Number(out[k])); out[k] = String(out[k]).trim() !== '' && isFinite(n) && n >= 0 ? n : Number(CLUB_DEFAULTS.find(d => d[0] === k)[1]); });
  out.coordinators = String(out.coordinators || '').split(',').map(s => s.trim()).filter(Boolean);
  out.creatorCircleUrl = /^https:\/\/\S+$/.test(out.creatorCircleUrl) ? out.creatorCircleUrl : '';
  return out;
}
function briefOut(b) {
  const o = {};
  CLUB_TABS['Weekly briefs'].forEach(([k]) => { o[k] = k === 'weekStart' || k === 'weekEnd' ? isoDay(b[k]) : k === 'updated' ? isoTime(b[k]) : String(b[k] || ''); });
  o.status = pick(o.status, BRIEF_STATUSES, 'Draft');
  if (o.weekStart && !o.weekEnd) { const d = new Date(o.weekStart + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 6); o.weekEnd = d.toISOString().slice(0, 10); }
  return o;
}
function allBriefs() { return readTable(clubSheet('Weekly briefs'), CLUB_TABS['Weekly briefs']).filter(b => b.id).map(briefOut); }
// This week's brief: the published one whose week includes today, else the next published one, else the most recent.
function currentBrief(briefs) {
  const today = todayIso(), live = briefs.filter(b => b.status === 'Published' && b.weekStart).sort(byWeek);
  return live.find(b => b.weekStart <= today && b.weekEnd >= today) || live.find(b => b.weekStart > today) || live[live.length - 1] || null;
}
function subOut(s) { return { id: s.id, submitted: isoTime(s.submitted), name: s.name, briefId: s.briefId, briefTitle: s.briefTitle, kind: s.kind === 'themed' ? 'themed' : 'flexible', url: s.url, note: s.note, status: pick(s.status, SUB_STATUSES, 'Submitted'), reviewedBy: s.reviewedBy }; }
function allSubmissions() { return readTable(clubSheet('Submissions'), CLUB_TABS['Submissions']).filter(s => s.id).map(subOut); }
function memberOut(m, withNotes) {
  const o = { name: m.name, status: pick(m.status, MEMBER_STATUSES, 'Active'), roles: m.roles, market: m.market, instagram: m.instagram, interests: m.interests, joined: isoDay(m.joined), request: m.request, requestUntil: isoDay(m.requestUntil), requestNote: m.requestNote };
  if (withNotes) { o.notes = m.notes; o.updatedBy = m.updatedBy; o.updated = isoTime(m.updated); }
  return o;
}
function allMembers(withNotes) { return readTable(clubSheet('Members'), CLUB_TABS['Members']).filter(m => m.name).map(m => memberOut(m, withNotes)); }
const appStatus = s => !String(s || '').trim() || /^new$/i.test(String(s).trim()) ? 'Submitted' : pick(s, APP_STATUSES, 'Submitted');

/* Participation: for each member, every published brief week since they joined.
   A week is met when themed posts reach requiredThemed (Needs-changes submissions don't count).
   Standing is a suggestion for coordinators: nothing changes a member's status on its own. */
function participation(members, briefs, subs, settings) {
  const today = todayIso(), weeks = briefs.filter(b => b.status !== 'Draft' && b.weekStart).sort(byWeek);
  return members.map(m => {
    const history = weeks.filter(b => !m.joined || b.weekEnd >= m.joined).map(b => {
      const mine = subs.filter(s => sameName(s.name, m.name) && s.briefId === b.id && s.status !== 'Needs changes');
      const themed = mine.filter(s => s.kind === 'themed').length, flexible = mine.length - themed;
      return { briefId: b.id, title: b.title || b.theme, weekStart: b.weekStart, weekEnd: b.weekEnd, themed: themed, flexible: flexible,
        met: themed >= settings.requiredThemed, complete: themed >= settings.requiredThemed && flexible >= settings.requiredFlexible, finished: b.weekEnd < today };
    });
    let missed = 0;
    for (let i = history.length - 1; i >= 0; i--) { if (!history[i].finished) continue; if (history[i].met) break; missed++; }
    const standing = m.status === 'Paused' ? 'Paused' : ['Inactive', 'Alumni'].indexOf(m.status) >= 0 ? m.status
      : settings.reviewAfter && missed >= settings.reviewAfter ? 'Needs review' : settings.reminderAfter && missed >= settings.reminderAfter ? 'Reminder' : 'On track';
    const finished = history.filter(h => h.finished);
    return { name: m.name, status: m.status, missedInARow: missed, standing: standing, weeksMet: finished.filter(h => h.met).length, weeksFinished: finished.length, history: history.slice(-8).reverse() };
  });
}
function clubAnalytics(members, briefs, subs, part) {
  const active = members.filter(m => m.status === 'Active' || m.status === 'Needs Check-In'), isActive = n => active.some(m => sameName(m.name, n));
  const finished = briefs.filter(b => b.status !== 'Draft' && b.weekStart && b.weekEnd < todayIso()).sort(byWeek);
  const last = finished[finished.length - 1], cur = currentBrief(briefs);
  const counted = subs.filter(s => s.status !== 'Needs changes' && /^https:\/\//.test(s.url));
  const lastRows = last ? part.filter(p => isActive(p.name) && p.history.some(h => h.briefId === last.id)) : [];
  const metLast = last ? lastRows.filter(p => p.history.some(h => h.briefId === last.id && h.met)).length : 0;
  const thisWeek = cur ? counted.filter(s => s.briefId === cur.id && s.kind === 'themed') : [];
  return {
    activeCreators: active.length,
    lastWeek: last ? { title: last.title || last.theme, weekStart: last.weekStart, met: metLast, eligible: lastRows.length, rate: lastRows.length ? Math.round(100 * metLast / lastRows.length) : null } : null,
    thisWeek: cur ? { title: cur.title || cur.theme, themedPosts: thisWeek.length, creatorsPosted: new Set(thisWeek.map(s => s.name.toLowerCase())).size } : null,
    publishedLinks: counted.length,
    repeatCreators: part.filter(p => p.weeksMet >= 2).length,
    weeksRun: finished.length
  };
}

/* ---------- Creator side (creator password) ---------- */
function clubForCreator(name) {
  const settings = clubSettings(), briefs = allBriefs(), brief = currentBrief(briefs);
  const member = name ? allMembers(false).find(m => sameName(m.name, name)) || null : null;
  const subs = name ? allSubmissions().filter(s => sameName(s.name, name)) : [];
  const upcoming = brief ? briefs.filter(b => b.status === 'Published' && b.weekStart > brief.weekStart).sort(byWeek).slice(0, 2).map(b => ({ id: b.id, title: b.title, theme: b.theme, weekStart: b.weekStart, weekEnd: b.weekEnd })) : [];
  return {
    ok: true,
    settings: { requiredThemed: settings.requiredThemed, requiredFlexible: settings.requiredFlexible, creatorCircleUrl: settings.creatorCircleUrl, coordinators: settings.coordinators },
    brief: brief, upcoming: upcoming, member: member, application: name ? applicationFor(name) : null,
    submissions: subs.slice(-30).reverse(), participation: member ? participation([member], briefs, subs, settings)[0] : null,
    roster: allMembers(false).filter(m => m.status !== 'Alumni').map(m => m.name)
  };
}
function applicationFor(name) {
  const rows = readTable(applySheet(), APPLY_COLUMNS).filter(r => sameName(r.name, name));
  const a = rows[rows.length - 1]; if (!a) return null;
  return { status: appStatus(a.status), submitted: isoTime(a.submitted) };
}
function saveSubmission(req) {
  const name = clean(req.name), kind = req.kind === 'themed' ? 'themed' : 'flexible', url = String(req.url || '').trim();
  if (!name) return reply({ ok: false, error: 'Choose your name first.' });
  if (!/^https:\/\/\S+$/.test(url) || url.length > 500) return reply({ ok: false, error: 'Paste the link to your published post. It starts with https://' });
  const member = allMembers(false).find(m => sameName(m.name, name));
  if (!member || ['Active', 'Needs Check-In'].indexOf(member.status) < 0) return reply({ ok: false, error: 'Submissions are for active Creators Club members. Apply to join, or ask a coordinator to switch you back to Active.' });
  const brief = allBriefs().find(b => b.id === String(req.briefId || '') && b.status !== 'Draft') || null;
  if (kind === 'themed' && !brief) return reply({ ok: false, error: 'There’s no published brief for a themed post yet.' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = newId('s');
    writeRow(clubSheet('Submissions'), CLUB_TABS['Submissions'], { id: id, submitted: new Date(), name: member.name, briefId: brief ? brief.id : '', briefTitle: brief ? (brief.title || brief.theme) : '', kind: kind, url: url, note: text(req.note).slice(0, 500), status: 'Submitted' }, 0);
    logActivity('post', member.name, kind === 'themed' ? 'shared their post for “' + (brief.title || brief.theme) + '”' : 'shared a flexible contribution', url);
    return reply({ ok: true, id: id });
  } finally { lock.releaseLock(); }
}
// Pause, back-from-pause or rejoin requests. They wait for a coordinator; nothing changes on its own.
function saveRequest(req) {
  const name = clean(req.name), type = ({ pause: 'Pause', resume: 'Back from pause', rejoin: 'Rejoin' })[req.type];
  if (!name || !type) return reply({ ok: false, error: 'Choose your name first.' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = clubSheet('Members'), cols = CLUB_TABS['Members'], m = readTable(sheet, cols).find(r => sameName(r.name, name));
    if (!m) return reply({ ok: false, error: type === 'Rejoin' ? 'We couldn’t find you on the roster. Apply to join instead.' : 'You’re not on the Creators Club roster yet.' });
    writeRow(sheet, cols, { request: type, requestUntil: req.until ? isoDay(req.until) : '', requestNote: text(req.note).slice(0, 500), updated: new Date(), updatedBy: m.name }, m._row);
    return reply({ ok: true });
  } finally { lock.releaseLock(); }
}

/* ---------- Coordinator side (creator password + COORDINATOR_PASSCODE) ---------- */
// The coordinator code: COORDINATOR_PASSCODE in Script properties, or the coordinatorCode row on the Settings tab.
function coordinatorCode() {
  const prop = PropertiesService.getScriptProperties().getProperty('COORDINATOR_PASSCODE');
  if (prop && prop.trim()) return prop.trim();
  const row = readTable(clubSheet('Settings'), CLUB_TABS['Settings']).find(r => r.key === 'coordinatorCode');
  return row ? String(row.value).trim() : '';
}
function isCoordinator(code) { const want = coordinatorCode(); return !!want && String(code || '').trim() === want; }
// Sign-in check for the landing page. A few tries per minute at most, so the code can't be guessed by brute force.
function coordLogin(req) {
  const cache = CacheService.getScriptCache(), tries = Number(cache.get('coord-login') || 0);
  if (tries >= 20) return reply({ ok: false, error: 'Too many tries. Wait a minute and try again.' });
  cache.put('coord-login', String(tries + 1), 60);
  return reply({ ok: isCoordinator(req.code) });
}
function adminReply(req) {
  if (!coordinatorCode()) return reply({ ok: false, coordLocked: true, error: 'Coordinator tools aren’t switched on yet. Add a coordinator code on the Settings tab of the Creators Club program sheet.' });
  if (!isCoordinator(req.coordKey)) return reply({ ok: false, coordLocked: true, error: 'That coordinator code doesn’t match.' });
  const who = clean(req.coordName) || 'Coordinator';
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    let savedId = '';
    if (req.action === 'admin-check') return reply({ ok: true });
    if (req.action === 'admin-reel') return reply(adminReel(req)); // Reels tracker + content calendar
    if (req.action === 'admin-app') adminApplication(req, who);
    else if (req.action === 'admin-member') adminMember(req, who);
    else if (req.action === 'admin-seed') adminSeed(req, who);
    else if (req.action === 'admin-brief') savedId = adminBrief(req, who);
    else if (req.action === 'admin-sub') adminSubmission(req, who);
    else if (req.action === 'admin-settings') adminSettings(req);
    else if (req.action === 'admin-account') adminAccount(req, who); // reset a password or take a bio down
    else if (req.action !== 'admin-data') return reply({ ok: false, error: 'Unknown request.' });
    return reply(Object.assign(adminData(), { savedId: savedId }));
  } catch (err) { console.error(err); return reply({ ok: false, error: String(err && err.message || err) }); }
  finally { lock.releaseLock(); }
}
function adminData() {
  const settings = clubSettings(), briefs = allBriefs(), subs = allSubmissions(), members = allMembers(true);
  const part = participation(members, briefs, subs, settings);
  return { ok: true, accounts: allAccounts(), settings: settings, applications: allApplications(), members: members, briefs: briefs.slice().sort(byWeek).reverse(), current: (currentBrief(briefs) || {}).id || '',
    submissions: subs.slice(-300).reverse(), participation: part, analytics: clubAnalytics(members, briefs, subs, part) };
}
function allApplications() {
  const sheet = applySheet(), rows = readTable(sheet, APPLY_COLUMNS), idx = headerIndex(sheet, APPLY_COLUMNS);
  return rows.filter(r => r.name).map(r => {
    if (!r.id && idx.id) { r.id = newId('a'); sheet.getRange(r._row, idx.id).setValue(r.id); } // older rows get an ID the first time they're read
    const o = {}; APPLY_COLUMNS.forEach(([k]) => { o[k] = k === 'submitted' || k === 'reviewed' ? isoTime(r[k]) : String(r[k] || ''); });
    o.status = appStatus(r.status); return o;
  }).reverse();
}
function adminApplication(req, who) {
  const sheet = applySheet(), a = readTable(sheet, APPLY_COLUMNS).find(r => r.id && r.id === String(req.id || ''));
  if (!a) throw new Error('That application wasn’t found. Refresh and try again.');
  const status = pick(req.status, APP_STATUSES, ''), patch = { reviewedBy: who, reviewed: new Date() };
  if (status) patch.status = status;
  if (typeof req.notes === 'string') patch.notes = text(req.notes).slice(0, 1000);
  writeRow(sheet, APPLY_COLUMNS, patch, a._row);
  if (status !== 'Approved') return;
  const msheet = clubSheet('Members'), cols = CLUB_TABS['Members'], m = readTable(msheet, cols).find(r => sameName(r.name, a.name));
  const base = { status: 'Active', roles: a.roles, market: a.market || a.region, instagram: a.instagram, interests: a.interests, request: '', requestUntil: '', requestNote: '', updated: new Date(), updatedBy: who };
  if (m) writeRow(msheet, cols, base, m._row);
  else writeRow(msheet, cols, Object.assign(base, { name: clean(a.name), joined: todayIso() }), 0);
  if (!m || pick(m.status, MEMBER_STATUSES, 'Active') !== 'Active') logActivity('join', clean(a.name), 'joined the Creators Club', '');
}
function adminMember(req, who) {
  const sheet = clubSheet('Members'), cols = CLUB_TABS['Members'], name = clean(req.name);
  if (!name) throw new Error('Add a name.');
  const m = readTable(sheet, cols).find(r => sameName(r.name, name)), patch = { updated: new Date(), updatedBy: who };
  if (req.status) patch.status = pick(req.status, MEMBER_STATUSES, 'Active');
  if (typeof req.notes === 'string') patch.notes = text(req.notes).slice(0, 1000);
  if (req.clearRequest) { patch.request = ''; patch.requestUntil = ''; patch.requestNote = ''; }
  ['roles', 'market', 'instagram', 'interests'].forEach(k => { if (typeof req[k] === 'string') patch[k] = text(req[k]).slice(0, 300); });
  if (m) writeRow(sheet, cols, patch, m._row);
  else writeRow(sheet, cols, Object.assign({ name: name, status: 'Active', joined: todayIso() }, patch), 0);
}
// Adds the current Squad as founding members. Skips anyone already on the roster.
function adminSeed(req, who) {
  const sheet = clubSheet('Members'), cols = CLUB_TABS['Members'], have = readTable(sheet, cols);
  (Array.isArray(req.members) ? req.members : []).slice(0, 60).forEach(p => {
    const name = clean(p && p.name); if (!name || have.some(r => sameName(r.name, name))) return;
    writeRow(sheet, cols, { name: name, status: 'Active', market: text(p.market).slice(0, 80), instagram: text(p.instagram).slice(0, 60), joined: todayIso(), notes: 'Founding member', updated: new Date(), updatedBy: who }, 0);
    have.push({ name: name });
  });
}
function adminBrief(req, who) {
  const sheet = clubSheet('Weekly briefs'), cols = CLUB_TABS['Weekly briefs'], rows = readTable(sheet, cols), op = String(req.op || 'save');
  const b = req.brief || {}, found = rows.find(r => r.id && r.id === String(b.id || ''));
  if (op === 'duplicate') {
    if (!found) throw new Error('That brief wasn’t found.');
    const src = briefOut(found), shift = d => { if (!d) return ''; const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 7); return x.toISOString().slice(0, 10); };
    const copy = Object.assign({}, src, { id: newId('b'), status: 'Draft', weekStart: shift(src.weekStart), weekEnd: shift(src.weekEnd), updated: new Date(), updatedBy: who });
    writeRow(sheet, cols, copy, 0); return copy.id;
  }
  if (op === 'publish' || op === 'archive' || op === 'unpublish') {
    if (!found) throw new Error('That brief wasn’t found.');
    const status = { publish: 'Published', archive: 'Archived', unpublish: 'Draft' }[op];
    if (status === 'Published' && !isoDay(found.weekStart)) throw new Error('Add the week’s start date before publishing.');
    writeRow(sheet, cols, { status: status, updated: new Date(), updatedBy: who }, found._row);
    if (status === 'Published') logActivity('brief', '', 'New weekly brief: “' + (found.title || found.theme) + '”', '');
    return found.id;
  }
  const patch = {};
  cols.forEach(([k]) => { if (['id', 'status', 'updated', 'updatedBy'].indexOf(k) < 0 && typeof b[k] === 'string') patch[k] = k === 'weekStart' || k === 'weekEnd' ? isoDay(b[k]) : text(b[k]).slice(0, 3000); });
  if (!found && !patch.title && !patch.theme) throw new Error('Give the brief a title or a theme.');
  patch.updated = new Date(); patch.updatedBy = who;
  if (found) { writeRow(sheet, cols, patch, found._row); return found.id; }
  const id = newId('b'); writeRow(sheet, cols, Object.assign({ id: id, status: 'Draft' }, patch), 0); return id;
}
function adminSubmission(req, who) {
  const sheet = clubSheet('Submissions'), cols = CLUB_TABS['Submissions'], s = readTable(sheet, cols).find(r => r.id && r.id === String(req.id || ''));
  if (!s) throw new Error('That submission wasn’t found.');
  writeRow(sheet, cols, { status: pick(req.status, SUB_STATUSES, 'Submitted'), reviewedBy: who, reviewed: new Date() }, s._row);
}
function adminSettings(req) {
  const sheet = clubSheet('Settings'), cols = CLUB_TABS['Settings'], rows = readTable(sheet, cols), next = req.settings || {};
  CLUB_DEFAULTS.forEach(([k, , about]) => {
    if (next[k] == null || k === 'coordinatorCode') return; // the code is only changed in the sheet
    let v = String(next[k]).trim();
    if (CLUB_NUMBERS.indexOf(k) >= 0) { const n = Math.round(Number(v)); if (v === '' || !isFinite(n) || n < 0 || n > 20) throw new Error('Weekly numbers need to be between 0 and 20.'); v = String(n); }
    if (k === 'creatorCircleUrl' && v && !/^https:\/\/\S+$/.test(v)) throw new Error('The Creator Circle link needs to start with https://');
    const r = rows.find(x => x.key === k);
    if (r) writeRow(sheet, cols, { value: text(v) }, r._row); else writeRow(sheet, cols, { key: k, value: text(v), about: about }, 0);
  });
}

/* Reels tracker and content calendar (reels.html): coordinators add, edit, move and delete Reels right on the
   Reels – Status Report sheet. Columns: Title | Lead | Prompt (linked to the brief doc) | Deadline | Status | Folder.
   Rows under the "Future ideas" row are ideas. Only the cells that changed are written, so a coordinator's edit
   never overwrites someone else's formatting or links in the other cells. */
const REEL_STATUS_TEXT = { casting: 'CASTING', filming: 'FILMING', editing: 'IN EDIT', upcoming: 'SCHEDULED', posted: 'POSTED', idea: 'IDEA' };
function reelsSheet() { return SpreadsheetApp.openById(REELS_SHEET_ID).getSheets()[0]; }
function reelIdeasRow(sheet) {
  const last = sheet.getLastRow(); if (last < 2) return 0;
  const v = sheet.getRange(1, 1, last, 1).getDisplayValues();
  for (let i = 1; i < v.length; i++) if (/^future ideas/i.test(String(v[i][0]).trim())) return i + 1;
  return 0;
}
function httpsUrl(u) { const s = String(u || '').trim(); return /^https:\/\/[^\s"<>]+$/.test(s) ? s.slice(0, 500) : ''; }
function reelFields(x) {
  x = x || {};
  const status = Object.prototype.hasOwnProperty.call(REEL_STATUS_TEXT, x.status) ? x.status : 'upcoming';
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(x.deadline || '')) ? x.deadline : text(x.deadline).slice(0, 40);
  return { title: text(x.title).slice(0, 120), lead: clean(x.lead), status: status, deadline: deadline,
    prompt: text(x.prompt).slice(0, 600), briefUrl: httpsUrl(x.briefUrl), folderUrl: httpsUrl(x.folderUrl) };
}
function writeReelDeadline(range, value) {
  if (!value) return range.setValue('');
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return range.setValue(value); // free text such as "PAST DUE"
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const near = Math.abs(d.getTime() - Date.now()) < 150 * 864e5; // the sheet shows "Sunday 11/30"; far-off dates keep their year
  range.setValue(d).setNumberFormat(near ? 'dddd m/d' : 'dddd m/d/yyyy');
}
function adminReel(req) {
  const op = String(req.op || ''), sheet = reelsSheet();
  if (['create', 'update', 'delete'].indexOf(op) < 0) throw new Error('Unknown request.');
  let row = 0;
  if (op !== 'create') {
    row = Math.floor(Number(req.row));
    const now = row > 1 && row <= sheet.getLastRow() ? String(sheet.getRange(row, 1, 1, 1).getDisplayValues()[0][0]).trim() : '';
    if (!now || now !== String(req.was || '').trim()) throw new Error('That Reel changed on the sheet since this page loaded. Reload and try again.');
  }
  if (op === 'delete') { sheet.deleteRow(row); return reelsDone(0); }
  const next = reelFields(req.reel), was = op === 'create' ? null : reelFields(req.orig);
  if (!next.title) throw new Error('Give the Reel a title.');
  if (/^future ideas/i.test(next.title)) throw new Error('Pick a different title.');
  const ideas = reelIdeasRow(sheet), wasIdea = !!(row && ideas && row > ideas), idea = next.status === 'idea';
  let fresh = op === 'create';
  if (row && wasIdea !== idea) { sheet.deleteRow(row); row = 0; fresh = true; } // moving between Reels and Future ideas
  if (!row) {
    const marker = reelIdeasRow(sheet);
    if (idea) {
      if (!marker) sheet.getRange(sheet.getLastRow() + 1, 1, 1, 1).setValue('Future ideas');
      row = sheet.getLastRow() + 1;
    } else if (marker) { sheet.insertRowBefore(marker); row = marker; }
    else row = Math.max(sheet.getLastRow(), 1) + 1;
  }
  const changed = k => fresh || next[k] !== was[k];
  const cell = c => sheet.getRange(row, c, 1, 1);
  if (changed('title')) cell(1).setValue(next.title);
  if (changed('lead')) cell(2).setValue(next.lead);
  if (changed('prompt') || changed('briefUrl')) {
    if (next.prompt && next.briefUrl) cell(3).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(next.prompt).setLinkUrl(next.briefUrl).build());
    else cell(3).setValue(next.prompt || next.briefUrl);
  }
  if (changed('deadline')) writeReelDeadline(cell(4), next.deadline);
  if (changed('status')) cell(5).setValue(REEL_STATUS_TEXT[next.status]);
  if (changed('folderUrl')) cell(6).setValue(next.folderUrl);
  return reelsDone(row);
}
function reelsDone(row) {
  CacheService.getScriptCache().remove('reels');
  return { ok: true, row: row, updated: new Date().toISOString(), reels: readReels() };
}

/* ---------- Creator accounts: your own password, and your bio ----------
   The shared creator password (MENTOR_PASSCODE) is only for setting up: a creator picks their name and a password of
   their own, then signs in with those. Passwords are never stored, only a salted, stretched hash. Each signed-in
   device gets a random key; only its hash is kept (the last 5 devices). Coordinators can reset a password from the
   Roster tab, and the creator sets a new one with the creator password. Bios show on Meet the Squad. */
const ACCOUNT_COLS = CLUB_TABS['Accounts'] = [['id', 'Account ID'], ['name', 'Name'], ['bio', 'Bio'], ['bioUpdated', 'Bio updated'], ['hash', 'Password hash'], ['salt', 'Salt'], ['tokens', 'Signed-in devices'], ['created', 'Created'], ['lastSignIn', 'Last sign-in'], ['resetBy', 'Reset by']];
const BIO_MAX = 400;
function hexOf(bytes) { return bytes.map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
function sha(s) { return hexOf(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)); }
function pwHash(password, salt) {
  let h = String(password);
  for (let i = 0; i < 400; i++) h = hexOf(Utilities.computeHmacSha256Signature(h + String(password), String(salt)));
  return h;
}
function accountsSheet() { return clubSheet('Accounts'); }
function allAccountRows() { return readTable(accountsSheet(), ACCOUNT_COLS).filter(a => a.name); }
function findAccount(name) { return allAccountRows().find(a => sameName(a.name, name)) || null; }
const tokenList = a => String(a.tokens || '').split(',').filter(Boolean);
function forgetTokens(hashes) { const c = CacheService.getScriptCache(); hashes.forEach(h => c.remove('acct:' + h)); }
// "acct.<account id>.<secret>" -> the creator's name, or '' (cached for 10 minutes).
function accountName(key) {
  const m = String(key || '').match(/^acct\.([\w-]{8,40})\.([\w-]{20,80})$/); if (!m) return '';
  const cache = CacheService.getScriptCache(), th = sha(m[2]), hit = cache.get('acct:' + th);
  if (hit) return hit === '-' ? '' : hit;
  const a = allAccountRows().find(r => String(r.id) === m[1]);
  const name = a && a.hash && tokenList(a).indexOf(th) >= 0 ? String(a.name) : '';
  cache.put('acct:' + th, name || '-', 600);
  return name;
}
function issueKey(a) {
  const secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''), keep = tokenList(a);
  const dropped = keep.length >= 5 ? keep.slice(0, keep.length - 4) : [];
  writeRow(accountsSheet(), ACCOUNT_COLS, { tokens: keep.slice(-4).concat(sha(secret)).join(','), lastSignIn: new Date() }, a._row);
  forgetTokens(dropped);
  return 'acct.' + a.id + '.' + secret;
}
function sharedPassword(key) {
  const want = PropertiesService.getScriptProperties().getProperty('MENTOR_PASSCODE');
  return !!want && String(key || '').trim().toLowerCase() === want.trim().toLowerCase();
}
function passwordProblem(pw, name) {
  pw = String(pw || '');
  if (sharedPassword(pw) || isCoordinator(pw)) return 'Pick a password that’s yours, not the shared one.';
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (pw.length > 200) return 'That password is too long.';
  if (sameName(pw, name)) return 'Don’t use your name as your password.';
  return '';
}
function accountOut(a, key) {
  return { ok: true, key: key || undefined, name: String(a.name), bio: String(a.bio || ''), bioSet: !!a.bioUpdated };
}
// POST account-setup { key: the creator password, name, password }
function accountSetup(req) {
  if (!sharedPassword(req.key) && !isCoordinator(req.key)) return locked();
  const name = clean(req.name);
  if (!name) return reply({ ok: false, error: 'Choose your name first.' });
  const problem = passwordProblem(req.password, name); if (problem) return reply({ ok: false, error: problem });
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = accountsSheet(); let a = findAccount(name);
    if (a && a.hash) return reply({ ok: false, taken: true, error: name + ' already has a password. Sign in with your name and your own password, or ask a coordinator to reset it.' });
    const salt = Utilities.getUuid(), patch = { salt: salt, hash: pwHash(req.password, salt), tokens: '', resetBy: '' };
    if (a) writeRow(sheet, ACCOUNT_COLS, patch, a._row);
    else writeRow(sheet, ACCOUNT_COLS, Object.assign(patch, { id: 'a' + Utilities.getUuid().replace(/-/g, '').slice(0, 15), name: name, created: new Date() }), 0);
    a = findAccount(name);
    return reply(accountOut(a, issueKey(a)));
  } finally { lock.releaseLock(); }
}
// POST account-login { name, password }: a few tries per name every 15 minutes.
function accountLogin(req) {
  const name = clean(req.name), pw = String(req.password || '');
  if (!name || !pw) return reply({ ok: false, wrong: true, error: 'Enter your name and your password.' });
  const cache = CacheService.getScriptCache(), k = 'login:' + name.toLowerCase(), tries = Number(cache.get(k) || 0);
  if (tries >= 10) return reply({ ok: false, error: 'Too many tries. Wait 15 minutes and try again, or ask a coordinator to reset your password.' });
  const a = findAccount(name);
  if (!a || !a.hash || pwHash(pw, a.salt) !== String(a.hash)) {
    cache.put(k, String(tries + 1), 900);
    return reply({ ok: false, wrong: true, noAccount: !a || !a.hash, error: 'That name and password don’t match.' });
  }
  cache.remove(k);
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try { return reply(accountOut(a, issueKey(findAccount(name)))); } finally { lock.releaseLock(); }
}
// Signed-in creators: read their account, change their password, sign out, and save or delete their bio.
function accountReply(req, name) {
  if (!name) return reply({ ok: false, noAccount: true, error: 'Sign in with your own password to do that.' });
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = accountsSheet(), a = findAccount(name), mine = sha(String(req.key).split('.')[2] || '');
    if (!a) return reply({ ok: false, noAccount: true, error: 'Sign in with your own password to do that.' });
    if (req.action === 'account-password') {
      if (pwHash(String(req.current || ''), a.salt) !== String(a.hash)) return reply({ ok: false, error: 'Your current password doesn’t match.' });
      const problem = passwordProblem(req.password, name); if (problem) return reply({ ok: false, error: problem });
      const salt = Utilities.getUuid();
      writeRow(sheet, ACCOUNT_COLS, { salt: salt, hash: pwHash(req.password, salt), tokens: mine }, a._row); // other devices are signed out
      forgetTokens(tokenList(a).filter(h => h !== mine));
    } else if (req.action === 'account-signout') {
      writeRow(sheet, ACCOUNT_COLS, { tokens: tokenList(a).filter(h => h !== mine).join(',') }, a._row);
      forgetTokens([mine]);
      return reply({ ok: true });
    } else if (req.action === 'bio-save') {
      const bio = text(req.bio).replace(/\s+/g, ' ').slice(0, BIO_MAX);
      if (!bio) return reply({ ok: false, error: 'Write your bio first, or delete it instead.' });
      writeRow(sheet, ACCOUNT_COLS, { bio: bio, bioUpdated: new Date() }, a._row);
      CacheService.getScriptCache().remove('bios');
    } else if (req.action === 'bio-delete') {
      writeRow(sheet, ACCOUNT_COLS, { bio: '', bioUpdated: new Date() }, a._row);
      CacheService.getScriptCache().remove('bios');
    }
    return reply(accountOut(findAccount(name)));
  } finally { lock.releaseLock(); }
}
// GET bios (public): every bio a creator has written or deleted. An empty bio means "show no bio".
function readBios() {
  const cache = CacheService.getScriptCache(), hit = cache.get('bios');
  if (hit) return JSON.parse(hit);
  const out = allAccountRows().filter(a => a.bioUpdated).map(a => ({ name: String(a.name), bio: String(a.bio || '').replace(/^'/, '') }));
  cache.put('bios', JSON.stringify(out), 120);
  return out;
}
function allAccounts() {
  return allAccountRows().map(a => ({ name: String(a.name), hasPassword: !!a.hash, bio: String(a.bio || ''), bioSet: !!a.bioUpdated, lastSignIn: isoTime(a.lastSignIn) }));
}
// Coordinators: reset a creator's password (they set a new one with the creator password), or take a bio down.
function adminAccount(req, who) {
  const a = findAccount(req.name); if (!a) throw new Error('No account for that name.');
  if (req.op === 'reset') { writeRow(accountsSheet(), ACCOUNT_COLS, { hash: '', salt: '', tokens: '', resetBy: who }, a._row); forgetTokens(tokenList(a)); }
  else if (req.op === 'clear-bio') { writeRow(accountsSheet(), ACCOUNT_COLS, { bio: '', bioUpdated: new Date() }, a._row); CacheService.getScriptCache().remove('bios'); }
  else throw new Error('Unknown request.');
}
