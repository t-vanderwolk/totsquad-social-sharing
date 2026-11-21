/**
 * Tot Squad Creators Club: upload helper.
 *
 * The Creators Club page asks this script for a one-time Google Drive upload link,
 * then sends the file straight to Drive from the browser. Files land in:
 *   B-roll:         B-Roll Library / <Name>
 *   Collaborations: Content submission folder / <Collaboration> / <Name>
 *
 * Setup (once per Google account):
 *   1. Project Settings > Script properties: add MENTOR_PASSCODE (the creator password the Creators Club
 *      signs in with; not case-sensitive). Uploads, pitches and the Reels data all use it.
 *   2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *   3. Put the web app URL in content.js as uploadEndpoint.
 * Uploads are owned by, and use the storage of, the account that deploys this script.
 *
 * The Reels page reads the Reels – Status Report sheet through doGet (?action=reels),
 * and each Reel's brief doc through doGet (?action=brief&id=…), limited to docs linked in that sheet.
 * Pitches ("Pitch an idea") are added as rows to the "Creators Club pitches" sheet.
 * The sheet is created next to the B-Roll Library the first time someone sends a pitch.
 * Applications ("Apply to join", no password) go to the "Creators Club applications" sheet, created the same way.
 */
// Everything was copied into Creators Club (For Baby Specialists) on Nov 21, 2026. moved() swaps an original ID for its copy.
function moved(id) { return PropertiesService.getScriptProperties().getProperty('C_' + id) || id; }
function movedUrl(u) { return String(u || '').replace(/[-\w]{25,}/g, id => moved(id)); }
const ROOTS = {
  broll: moved('1Nl5OGfhaRJ1ltRYNNrJGiAFTia-lnYHS'),  // B-Roll Library
  collab: moved('1tc9a6ur6K3QKAreSI_z0JYpG9ZHEmuKd')   // Content submission folder (now Creators Club (For Baby Specialists))
};
const ORIGINS = ['https://t-vanderwolk.github.io', 'http://localhost:4174'];
const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB per file

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.action === 'pitch') return isMentor(req.key) ? savePitch(req) : locked(); // pitches need the mentor password, not the upload passcode
    if (req.action === 'apply') return saveApplication(req); // open to anyone: it's how people ask to join
    if (req.action === 'squad-pitch') return saveSquadPitch(req); // open to anyone: ideas for Sarah to review
    if (req.action === 'cast-start') return startCastUpload(req); // open casting calls: video only, no password
    if (!isMentor(req.key)) return locked(); // everything else needs the creator password
    if (req.action === 'idea-save') return saveIdea(req);
    if (req.action === 'ideas-seed') return seedIdeas(req);
    if (req.action === 'check') return reply({ ok: true });
    if (req.action !== 'start') return reply({ ok: false, error: 'Unknown request.' });

    const name = clean(req.name);
    const dest = req.dest === 'broll' ? 'broll' : 'collab';
    const project = clean(req.project);
    const type = String(req.type || '');
    const size = Number(req.size);
    if (!name) return reply({ ok: false, error: 'Choose your name first.' });
    if (dest === 'collab' && !project) return reply({ ok: false, error: 'Choose what you’re uploading for.' });
    if (!/^(video|image)\//.test(type)) return reply({ ok: false, error: 'Only videos and photos can be uploaded here.' });
    if (!(size > 0 && size <= MAX_BYTES)) return reply({ ok: false, error: 'Files can be up to 2 GB each.' });

    let folder = DriveApp.getFolderById(ROOTS[dest]);
    if (dest === 'collab') folder = childFolder(folder, project);
    folder = childFolder(folder, name);

    const origin = ORIGINS.indexOf(req.origin) >= 0 ? req.origin : ORIGINS[0];
    const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(size), Origin: origin },
      payload: JSON.stringify({ name: cleanFile(req.fileName), parents: [folder.getId()], description: 'Uploaded by ' + name + ' from the Tot Squad Creators Club' }),
      muteHttpExceptions: true
    });
    const headers = res.getHeaders();
    const uploadUrl = headers.Location || headers.location;
    if (res.getResponseCode() !== 200 || !uploadUrl) return reply({ ok: false, error: 'Drive didn’t accept the upload. Try again in a minute.' });
    return reply({ ok: true, uploadUrl: uploadUrl, folderUrl: folder.getUrl(), folderName: folder.getName() });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: 'The upload couldn’t start. Try again in a minute.' });
  }
}

const PITCH_COLUMNS = [
  ['submitted', 'Sent'], ['name', 'From'], ['title', 'Working title'], ['series', 'Series'], ['audience', 'Who it’s for'],
  ['idea', 'Idea'], ['hook', 'Hook'], ['takeaway', 'Takeaway'], ['shots', 'Shot list'], ['format', 'Format'],
  ['lead', 'Wants to lead?'], ['support', 'Help wanted'], ['basedOn', 'Building on'], ['status', 'Status'], ['notes', 'Notes']
];
function savePitch(req) {
  const name = clean(req.name);
  const p = req.pitch || {};
  if (req.website) return reply({ ok: true }); // hidden field only bots fill in
  if (!name) return reply({ ok: false, error: 'Choose your name first.' });
  if (!text(p.title) || !text(p.idea)) return reply({ ok: false, error: 'Add a working title and your idea first.' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = pitchSheet();
    const row = PITCH_COLUMNS.map(([key]) => key === 'submitted' ? new Date() : key === 'name' ? name : key === 'status' ? 'New' : key === 'notes' ? '' : text(p[key]));
    sheet.appendRow(row);
    // Every pitch also lands in the Idea Bank right away.
    const idea = cleanIdea({ title: p.title, series: p.series, summary: p.idea, credit: [name], date: Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd'), status: 'Pitched', basedOn: p.basedOn,
      howItWorks: String(p.shots || '').split('\n'), notes: [p.hook && 'Hook: ' + p.hook, p.takeaway && 'Takeaway: ' + p.takeaway, p.audience && 'Who it’s for: ' + p.audience, p.format && 'Format: ' + p.format, p.lead && 'Wants to lead: ' + p.lead, p.support && 'Help wanted: ' + p.support].filter(Boolean) });
    idea.id = 'pitch-' + Date.now().toString(36);
    ideasSheet().appendRow(ideaRow(idea, name));
    return reply({ ok: true, idea: idea });
  } finally { lock.releaseLock(); }
}
function pitchSheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PITCH_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Creators Club pitches');
  const sheet = ss.getSheets()[0];
  sheet.setName('Pitches');
  sheet.appendRow(PITCH_COLUMNS.map(c => c[1]));
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, PITCH_COLUMNS.length).setFontWeight('bold').setBackground('#f3eaf1');
  sheet.getRange(2, 14, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Love it', 'In the Idea Bank', 'Casting', 'Not now'], true).build());
  const parents = DriveApp.getFolderById(ROOTS.broll).getParents();
  if (parents.hasNext()) DriveApp.getFileById(ss.getId()).moveTo(parents.next());
  props.setProperty('PITCH_SHEET_ID', ss.getId());
  return sheet;
}
/* "Apply to join": one row per application. Taylor sets Status; approved people go in Disco's Creators group. */
const APPLY_COLUMNS = [['submitted','Submitted'],['name','Name in Disco'],['region','Region'],['instagram','Instagram'],['roles','How they’d like to help'],['camera','On camera'],['why','Why they want to join'],['example','Example link'],['agreed','Agreed to guidelines'],['status','Status'],['notes','Notes']];
function saveApplication(req) {
  if (req.website) return reply({ ok: true }); // hidden field only bots fill in
  const a = req.application || {};
  if (!text(a.name) || !text(a.why)) return reply({ ok: false, error: 'Add your name and why you’d like to join.' });
  if (a.agreed !== true) return reply({ ok: false, error: 'Check the box about the brand guidelines first.' });
  const cache = CacheService.getScriptCache(), count = Number(cache.get('apply-count') || 0);
  if (count >= 40) return reply({ ok: false, error: 'We’re getting a lot of applications right now. Try again in an hour.' });
  cache.put('apply-count', String(count + 1), 3600);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const row = APPLY_COLUMNS.map(([key]) => key === 'submitted' ? new Date() : key === 'status' ? 'New' : key === 'notes' ? '' : key === 'agreed' ? 'Yes' : text(a[key]).slice(0, 1000));
    applySheet().appendRow(row);
    return reply({ ok: true });
  } finally { lock.releaseLock(); }
}
function applySheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('APPLY_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Creators Club applications');
  const sheet = ss.getSheets()[0];
  sheet.setName('Applications');
  sheet.appendRow(APPLY_COLUMNS.map(c => c[1]));
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, APPLY_COLUMNS.length).setFontWeight('bold').setBackground('#f3eaf1');
  sheet.getRange(2, APPLY_COLUMNS.findIndex(c => c[0] === 'status') + 1, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Approved', 'Declined'], true).build());
  const parents = DriveApp.getFolderById(ROOTS.broll).getParents();
  if (parents.hasNext()) DriveApp.getFileById(ss.getId()).moveTo(parents.next());
  props.setProperty('APPLY_SHEET_ID', ss.getId());
  return sheet;
}
/* Idea Bank: one row per idea in "Creators Club ideas" (Creators Club folder). Anyone with the creator password can edit
   from the app; pitches are added as new ideas. The sheet's visible columns win over the details column, so edits made
   right in Google Sheets show up too. */
const IDEA_COLUMNS = [['id','ID'],['title','Title'],['series','Series'],['stage','Stage'],['lead','Lead'],['summary','Summary'],['credit','Suggested by'],['date','Date'],['status','Status'],['updated','Last edited'],['updatedBy','Edited by'],['json','Details (leave as is)']];
const IDEA_LISTS = ['howItWorks','guidance','notes','questions','altNames'];
function ideasSheet() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('IDEAS_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Creators Club ideas'), sheet = ss.getSheets()[0];
  sheet.setName('Ideas'); sheet.appendRow(IDEA_COLUMNS.map(c => c[1])); sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, IDEA_COLUMNS.length).setFontWeight('bold').setBackground('#f3eaf1');
  DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(ROOTS.collab));
  props.setProperty('IDEAS_SHEET_ID', ss.getId());
  return sheet;
}
function cleanIdea(raw, base) {
  const i = Object.assign({}, base || {}), r = raw || {};
  ['title','series','stage','lead','summary','titleNote','date','status','basedOn'].forEach(k => { if (k in r) i[k] = text(r[k]).slice(0, 1500); });
  IDEA_LISTS.forEach(k => { if (k in r) i[k] = (Array.isArray(r[k]) ? r[k] : String(r[k] || '').split('\n')).map(x => text(x).slice(0, 500)).filter(Boolean).slice(0, 30); });
  if ('credit' in r) i.credit = (Array.isArray(r.credit) ? r.credit : String(r.credit || '').split(',')).map(clean).filter(Boolean).slice(0, 10);
  if (['idea','casting','filming','editing','published'].indexOf(i.stage) < 0) i.stage = 'idea';
  return i;
}
function ideaRow(i, by) { return IDEA_COLUMNS.map(([k]) => k === 'json' ? JSON.stringify(i).slice(0, 45000) : k === 'credit' ? (i.credit || []).join(', ') : k === 'updated' ? new Date() : k === 'updatedBy' ? (by || '') : text(i[k] || '')); }
function readIdeas() {
  const rows = ideasSheet().getDataRange().getValues(), out = [], col = k => IDEA_COLUMNS.findIndex(c => c[0] === k);
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; if (!row[col('id')]) continue;
    let i = {}; try { i = JSON.parse(row[col('json')] || '{}'); } catch (e) {}
    ['id','title','series','stage','lead','summary','status'].forEach(k => { i[k] = String(row[col(k)] || ''); });
    i.credit = String(row[col('credit')] || '').split(',').map(s => s.trim()).filter(Boolean);
    const d = row[col('date')]; i.date = d instanceof Date ? Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd') : String(d || '');
    out.push(i);
  }
  return out;
}
function saveIdea(req) {
  const by = clean(req.name); if (!by) return reply({ ok: false, error: 'Choose your name first.' });
  const raw = req.idea || {}; if (!text(raw.title)) return reply({ ok: false, error: 'Give the idea a title.' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = ideasSheet(), ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues().map(r => String(r[0]));
    const id = String(raw.id || '').replace(/[^\w-]/g, '').slice(0, 80), at = id ? ids.indexOf(id) : -1;
    const idea = cleanIdea(raw, at > 0 ? readIdeas().find(x => x.id === id) : {});
    idea.id = at > 0 ? id : (id || 'idea-' + Date.now().toString(36));
    if (at > 0) sheet.getRange(at + 1, 1, 1, IDEA_COLUMNS.length).setValues([ideaRow(idea, by)]);
    else sheet.appendRow(ideaRow(idea, by));
    return reply({ ok: true, idea: idea });
  } finally { lock.releaseLock(); }
}
function seedIdeas(req) {
  const sheet = ideasSheet(); if (sheet.getLastRow() > 1) return reply({ ok: false, error: 'The Ideas sheet already has ideas.' });
  const rows = (req.ideas || []).slice(0, 300).map(r => {
    const i = cleanIdea(r); i.id = String(r.id || '').replace(/[^\w-]/g, '').slice(0, 80) || 'idea-' + Math.random().toString(36).slice(2, 8);
    ['image','discussionUrl','dueDate'].forEach(k => { if (r[k]) i[k] = text(r[k]).slice(0, 500); });
    if (Array.isArray(r.variations)) i.variations = r.variations.slice(0, 20).map(v => ({ title: text(v.title), text: text(v.text), credit: (v.credit || []).map(clean) }));
    return ideaRow(i, 'Imported');
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, IDEA_COLUMNS.length).setValues(rows);
  return reply({ ok: true, count: rows.length });
}
/* "Pitch an idea to the Squad": open to anyone, no password. Rows go to "Squad pitches for review" for Sarah. */
const SQUAD_PITCH_COLUMNS = [['submitted','Sent'],['name','Name'],['contact','How to reach them'],['title','Idea title'],['series','Series'],['idea','The idea'],['status','Status'],['notes','Notes']];
function saveSquadPitch(req) {
  if (req.website) return reply({ ok: true }); // hidden field only bots fill in
  const p = req.pitch || {};
  if (!clean(p.name) || !text(p.title) || !text(p.idea)) return reply({ ok: false, error: 'Add your name, an idea title and your idea.' });
  const cache = CacheService.getScriptCache(), count = Number(cache.get('squad-pitch-count') || 0);
  if (count >= 60) return reply({ ok: false, error: 'We’re getting a lot of ideas right now. Try again in an hour.' });
  cache.put('squad-pitch-count', String(count + 1), 3600);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    squadPitchSheet().appendRow(SQUAD_PITCH_COLUMNS.map(([k]) => k === 'submitted' ? new Date() : k === 'status' ? 'New' : k === 'notes' ? '' : k === 'name' ? clean(p.name) : text(p[k]).slice(0, 2000)));
    return reply({ ok: true });
  } finally { lock.releaseLock(); }
}
function squadPitchSheet() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('SQUAD_PITCH_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Squad pitches for review'), sheet = ss.getSheets()[0];
  sheet.setName('Pitches'); sheet.appendRow(SQUAD_PITCH_COLUMNS.map(c => c[1])); sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, SQUAD_PITCH_COLUMNS.length).setFontWeight('bold').setBackground('#f3eaf1');
  sheet.getRange(2, SQUAD_PITCH_COLUMNS.findIndex(c => c[0] === 'status') + 1, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Added to Idea Bank', 'Not now'], true).build());
  DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(ROOTS.collab));
  props.setProperty('SQUAD_PITCH_SHEET_ID', ss.getId());
  return sheet;
}
/* Open casting calls: anyone can send a video, no password. Only these projects, videos only, no folder link sent back. */
const OPEN_CASTING = ['Meet the Squad, Part 2: Pass the Toy'];
function startCastUpload(req) {
  const name = clean(req.name), project = clean(req.project), type = String(req.type || ''), size = Number(req.size);
  if (OPEN_CASTING.indexOf(project) < 0) return reply({ ok: false, error: 'This casting call isn’t taking videos right now.' });
  if (!name) return reply({ ok: false, error: 'Add your name first.' });
  if (req.agreed !== true) return reply({ ok: false, error: 'Check the box first.' });
  if (!/^video\//.test(type)) return reply({ ok: false, error: 'Choose a video file.' });
  if (!(size > 0 && size <= MAX_BYTES)) return reply({ ok: false, error: 'Videos can be up to 2 GB.' });
  const cache = CacheService.getScriptCache(), count = Number(cache.get('cast-count') || 0);
  if (count >= 60) return reply({ ok: false, error: 'Lots of videos are coming in right now. Try again in an hour.' });
  cache.put('cast-count', String(count + 1), 3600);
  const folder = childFolder(childFolder(DriveApp.getFolderById(ROOTS.collab), project), name);
  const origin = ORIGINS.indexOf(req.origin) >= 0 ? req.origin : ORIGINS[0];
  const contact = text(req.contact).slice(0, 120);
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'post', contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(size), Origin: origin },
    payload: JSON.stringify({ name: cleanFile(req.fileName), parents: [folder.getId()], description: 'Sent by ' + name + ' for ' + project + ' (open casting call)' + (contact ? '. Reach them at: ' + contact : '') }),
    muteHttpExceptions: true
  });
  const headers = res.getHeaders(), uploadUrl = headers.Location || headers.location;
  if (res.getResponseCode() !== 200 || !uploadUrl) return reply({ ok: false, error: 'Drive didn’t accept the upload. Try again in a minute.' });
  return reply({ ok: true, uploadUrl: uploadUrl }); // no folder link: submissions stay private
}
// Plain text only, and never a formula.
function text(s) { const t = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, 3000); return /^[=+\-@]/.test(t) ? "'" + t : t; }

/* GET ?action=reels: the Reels – Status Report sheet as JSON for the Reels page (cached for 2 minutes). */
const REELS_SHEET_ID = moved('1onXGs-dUEvschflMisc0GW0ozzqsRimchQuYtzxbtfg');
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action && !isMentor(e.parameter.key)) return locked();
  if (action === 'gate') return reply({ ok: true });
  if (action === 'ideas') return reply({ ok: true, ideas: readIdeas() });
  if (action === 'drivemap') { const all = PropertiesService.getScriptProperties().getProperties(), map = {}; Object.keys(all).filter(k => k.indexOf('C_') === 0).forEach(k => { map[k.slice(2)] = all[k]; }); return reply({ ok: true, map: map }); } // old Drive ID -> copy, for scripts/relink-drive.cjs
  if (action === 'brief') return briefReply(String(e.parameter.id || ''));
  if (action !== 'reels') return reply({ ok: true, service: 'Tot Squad Creators Club uploads' });
  try {
    const cache = CacheService.getScriptCache();
    const hit = cache.get('reels');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const out = JSON.stringify({ ok: true, updated: new Date().toISOString(), reels: readReels() });
    cache.put('reels', out, 120);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: 'Couldn’t read the Reels sheet.' });
  }
}
/* GET ?action=brief&id=DOC_ID: a brief doc as HTML. Only docs linked in the Reels sheet can be read. */
function briefReply(id) {
  if (!/^[\w-]{20,}$/.test(id)) return reply({ ok: false, error: 'Unknown brief.' });
  try {
    const cache = CacheService.getScriptCache();
    const hit = cache.get('brief:' + id);
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const allowed = readReels().some(r => docId(r.briefUrl) === id);
    if (!allowed) return reply({ ok: false, error: 'That brief isn’t on the Reels sheet.' });
    const res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '/export?mimeType=text/html', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return reply({ ok: false, error: 'Couldn’t open that brief.' });
    const title = DriveApp.getFileById(id).getName();
    const out = JSON.stringify({ ok: true, title: title, html: res.getContentText() });
    if (out.length < 90000) cache.put('brief:' + id, out, 600);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: 'Couldn’t open that brief.' });
  }
}
function docId(url) { const m = String(url || '').match(/\/document\/d\/([\w-]+)/); return m ? m[1] : ''; }
function readReels() {
  const sheet = SpreadsheetApp.openById(REELS_SHEET_ID).getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const links = sheet.getDataRange().getRichTextValues();
  const reels = []; let ideas = false;
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const title = String(row[0] || '').trim();
    if (!title) continue;
    if (/^future ideas/i.test(title)) { ideas = true; continue; }
    const link = c => { const v = String(row[c] || '').trim(); if (/^https?:\/\//.test(v)) return v; const rt = links[r][c]; return (rt && rt.getLinkUrl()) || ''; };
    const promptCell = String(row[2] || '').trim();
    reels.push({
      title: title, lead: String(row[1] || '').trim(),
      prompt: /^https?:\/\//.test(promptCell) ? '' : promptCell,
      briefUrl: movedUrl(/^https?:\/\//.test(promptCell) ? promptCell : link(2)),
      deadline: String(row[3] || '').trim(), status: ideas ? 'IDEA' : String(row[4] || '').trim(),
      folderUrl: movedUrl(link(5)), row: r + 1
    });
  }
  return reels;
}



// The creator password on the Creators Club's sign-in. Every request from the page carries it.
function isMentor(key) {
  const want = PropertiesService.getScriptProperties().getProperty('MENTOR_PASSCODE');
  return !!want && String(key || '').trim().toLowerCase() === want.trim().toLowerCase();
}
function locked() { return reply({ ok: false, locked: true, error: 'That mentor password doesn’t match.' }); }

function childFolder(parent, name) {
  const found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}
function clean(s) { return String(s || '').replace(/[^\p{L}\p{N} '’&.,#:()!?-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80); }
function cleanFile(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim().slice(0, 120) || 'clip'; }
function reply(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
