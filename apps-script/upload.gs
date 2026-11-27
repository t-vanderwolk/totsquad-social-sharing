/**
 * Tot Squad Creators Club: upload helper.
 *
 * The Creators Club page asks this script for a one-time Google Drive upload link,
 * then sends the file straight to Drive from the browser. Files land in:
 *   B-roll:         B-Roll Library / <Name>
 *   Collaborations: Content submission folder / <Collaboration> / <Name>
 *
 * Setup (once per Google account):
 *   1. Project Settings > Script properties: add MENTOR_PASSCODE (the creator password; not case-sensitive).
 *      It only opens "Set up your password" for new members: it never signs anyone in or reads any data.
 *      Coordinators can change it from Coordinator tools > Settings. Never put it in this repo: the repo is public.
 *   2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *   3. Put the web app URL in content.js as uploadEndpoint.
 * Uploads land in the Tot Squad shared drive, so Tot Squad owns them and they use its storage.
 *
 * The Reels page reads the Reels – Status Report sheet through doGet (?action=reels),
 * and each Reel's brief doc through doGet (?action=brief&id=…), limited to docs linked in that sheet.
 * Pitches ("Pitch an idea") are added as rows to the "Creators Club pitches" sheet.
 * The sheet is created next to the B-Roll Library the first time someone sends a pitch.
 * Applications ("Apply to join", no password) go to the "Creators Club applications" sheet, created the same way.
 */
// Everything was copied into Creators Club (For Baby Specialists) on Nov 21, 2026. moved() swaps an original ID for its copy.
// On Nov 23, 2026 everything moved (same IDs) into the Tot Squad shared drive "Creators Club (for Baby Specialists)"; new uploads land there too.
function moved(id) { return PropertiesService.getScriptProperties().getProperty('C_' + id) || id; }
function movedUrl(u) { return String(u || '').replace(/[-\w]{25,}/g, id => moved(id)); }
const ROOTS = {
  broll: moved('1Nl5OGfhaRJ1ltRYNNrJGiAFTia-lnYHS'),  // B-Roll Library
  collab: '0ADqEscN50JTEUk9PVA'   // Creators Club (for Baby Specialists) shared drive, owned by Tot Squad (moved in on Nov 23, 2026)
};
const ORIGINS = ['https://t-vanderwolk.github.io', 'http://localhost:4174'];
const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB per file

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.action === 'pitch') { if (!isMentor(req.key)) return locked(); const by = accountName(req.key); if (by) req.name = rosterName(by); return savePitch(req); } // pitches need a creator sign-in
    if (req.action === 'account-setup') return accountSetup(req); // creator password -> your own password (club.gs)
    if (req.action === 'account-login') return accountLogin(req); // your name + your own password (club.gs)
    if (req.action === 'account-claimable') return claimableRoster(req); // roster names still to claim, for the set-up form (club.gs)
    if (req.action === 'apply') return saveApplication(req); // open to anyone: it's how people ask to join
    if (req.action === 'squad-pitch') return saveSquadPitch(req); // open to anyone: ideas for Sarah to review
    if (req.action === 'cast-start') return startCastUpload(req); // casting calls: video only. Public calls need no password; Creators Club calls need a sign-in
    if (req.action === 'cast-answers') return saveCastAnswers(req); // casting calls: answers to its questions, same rule
    if (req.action === 'broll-start') return startBrollUpload(req); // B-roll from any specialist, no password: lands in "B-roll to review"
    if (req.action === 'upload-done') return uploadDone(req); // logs finished uploads for What's new
    if (req.action === 'coord-login') return coordLogin(req); // sign-in with the coordinator password (club.gs)
    if (!isMentor(req.key)) return locked(); // everything else needs the creator password
    const signedIn = accountName(req.key); if (signedIn) req.name = rosterName(signedIn); // signed in with your own password: you act as yourself
    if (/^(account-(me|password|signout)|bio-(save|delete))$/.test(String(req.action))) return accountReply(req, signedIn); // club.gs
    if (req.action === 'idea-save') return saveIdea(req);
    if (req.action === 'idea-delete') return deleteIdea(req);
    if (req.action === 'idea-build') return buildOnIdea(req);
    if (req.action === 'call-save') return saveCall(req); // post or edit a casting call
    if (req.action === 'call-status') return setCallStatus(req); // close or reopen your casting call
    if (req.action === 'club-submit') return saveSubmission(req);
    if (req.action === 'club-request') return saveRequest(req);
    if (/^admin-/.test(String(req.action))) return adminReply(req); // coordinators only (club.gs)
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

    let folder = dest === 'broll' ? brollReviewFolder() : DriveApp.getFolderById(ROOTS[dest]); // B-roll waits for review before it joins the library
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
    idea.id = newId('pitch');
    ideasSheet().appendRow(ideaRow(idea, name));
    logActivity('pitch', name, 'pitched “' + idea.title + '”', 'idea:' + idea.id);
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
/* "Apply to join": one row per application. Coordinators set Status (in the app's coordinator tools or right here).
   Columns after Notes were added for Creators Club 2.0; older rows simply leave them blank. Approving adds the
   person to the Members tab of the Creators Club program sheet (club.gs). */
const APPLY_COLUMNS = [['submitted','Submitted'],['name','Name in Disco'],['region','Region'],['instagram','Instagram'],['roles','How they’d like to help'],['camera','On camera'],['why','Why they want to join'],['example','Example link'],['agreed','Agreed to guidelines'],['status','Status'],['notes','Notes'],
  ['market','Home market'],['interests','Content interests'],['experience','Creative experience'],['capacity','Availability & weekly capacity'],['id','ID'],['reviewedBy','Reviewed by'],['reviewed','Reviewed'],['email','Email']];
function saveApplication(req) {
  if (req.website) return reply({ ok: true }); // hidden field only bots fill in
  const a = req.application || {};
  if (!text(a.name) || !text(a.why)) return reply({ ok: false, error: 'Add your name and why you’d like to join.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(a.email)) && !text(a.instagram)) return reply({ ok: false, error: 'Add an email or your Instagram handle so we can reply.' });
  if (a.agreed !== true) return reply({ ok: false, error: 'Check the box about the Creators Club guidelines first.' });
  const cache = CacheService.getScriptCache(), count = Number(cache.get('apply-count') || 0);
  if (count >= 40) return reply({ ok: false, error: 'We’re getting a lot of applications right now. Try again in an hour.' });
  cache.put('apply-count', String(count + 1), 3600);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const row = { submitted: new Date(), status: 'Submitted', agreed: 'Yes', id: newId('a') };
    ['name','region','instagram','roles','camera','why','example','market','interests','experience','capacity','email'].forEach(k => { row[k] = text(a[k]).slice(0, 1000); });
    writeRow(applySheet(), APPLY_COLUMNS, row, 0); // not in What's new: only coordinators see who applied
    return reply({ ok: true });
  } finally { lock.releaseLock(); }
}
// For coordinators: newest applications first. Declined ones and the Notes column stay out.
function readApplications() {
  return readTable(applySheet(), APPLY_COLUMNS).filter(r => r.name).reverse()
    .filter(r => ['Submitted', 'Under Review', 'Approved'].indexOf(appStatus(r.status)) >= 0).slice(0, 60) // waitlisted and declined stay private
    .map(r => ({ submitted: isoTime(r.submitted), name: r.name, region: r.market || r.region, instagram: r.instagram, roles: r.roles, camera: r.camera, why: r.why, example: r.example, interests: r.interests, status: appStatus(r.status) }));
}
function applySheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('APPLY_SHEET_ID');
  if (id) { try { const s = SpreadsheetApp.openById(id).getSheets()[0]; if (ensureHeaders(s, APPLY_COLUMNS)) statusList(s, APPLY_COLUMNS, 'status', APP_STATUSES); return s; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Creators Club applications');
  const sheet = ss.getSheets()[0];
  sheet.setName('Applications');
  sheet.appendRow(APPLY_COLUMNS.map(c => c[1]));
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, APPLY_COLUMNS.length).setFontWeight('bold').setBackground('#f3eaf1');
  statusList(sheet, APPLY_COLUMNS, 'status', APP_STATUSES);
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
  ['title','series','stage','lead','summary','concept','titleNote','date','status','basedOn'].forEach(k => { if (k in r) i[k] = text(r[k]).slice(0, 1500); });
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
    ['id','title','series','stage','lead','summary','status'].forEach(k => { i[k] = String(row[col(k)] || '').trim(); });
    i.credit = String(row[col('credit')] || '').split(',').map(s => s.trim()).filter(Boolean);
    const d = row[col('date')]; i.date = d instanceof Date ? Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd') : String(d || '');
    out.push(i);
  }
  return out;
}
/* Who can change an idea: coordinators can add, edit and delete any idea; a creator signed in with their own
   password can edit and delete the ideas credited to them (pitches are credited to whoever sent them). Anyone signed
   in can still build on any idea (buildOnIdea). */
function ideaEditor(req) {
  if (isCoordinator(req.coordKey)) return { coord: true, name: clean(req.name) || clean(req.coordName) || 'Coordinator' };
  const full = accountName(req.key); if (!full) return null;
  return { coord: false, name: full, roster: rosterName(full), claimed: claimOf(findAccount(full)) };
}
// Credited by full name, roster name, or the first name they claimed ("Kristin" on older ideas).
function creditedTo(idea, ed) { return (idea && idea.credit || []).some(c => sameName(c, ed.name) || sameName(c, ed.roster) || (ed.claimed && sameName(c, ed.claimed))); }
function ideaRowAt(id) {
  const sheet = ideasSheet(), ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues().map(r => String(r[0]));
  return { sheet: sheet, at: id ? ids.indexOf(id) : -1 };
}
function saveIdea(req) {
  const ed = ideaEditor(req); if (!ed) return reply({ ok: false, error: 'Sign in with your own name and password to add or edit ideas.' });
  const raw = Object.assign({}, req.idea || {});
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = String(raw.id || '').replace(/[^\w-]/g, '').slice(0, 80), found = ideaRowAt(id), sheet = found.sheet, at = found.at;
    const before = at > 0 ? readIdeas().find(x => x.id === id) : null;
    if (before && !ed.coord && !creditedTo(before, ed)) return reply({ ok: false, error: 'You can edit the ideas credited to you. Ask a coordinator about this one.' });
    if (!ed.coord) { if (before) delete raw.credit; else raw.credit = [ed.roster || ed.name]; } // only coordinators change credit
    else if (!before && !raw.credit) raw.credit = [ed.name];
    const idea = cleanIdea(raw, before || {});
    if (!text(idea.title)) return reply({ ok: false, error: 'Give the idea a title.' });
    if (!before) { idea.date = idea.date || Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd'); }
    idea.id = before ? id : newId('idea');
    if (before) sheet.getRange(at + 1, 1, 1, IDEA_COLUMNS.length).setValues([ideaRow(idea, ed.name)]);
    else sheet.appendRow(ideaRow(idea, ed.name));
    logActivity('edit', ed.roster || ed.name, (before ? 'updated “' : 'added “') + idea.title + '”', 'idea:' + idea.id);
    return reply({ ok: true, idea: idea });
  } finally { lock.releaseLock(); }
}
// POST idea-delete { id }: removes the idea's row from the ideas sheet (Google Sheets keeps version history).
function deleteIdea(req) {
  const ed = ideaEditor(req); if (!ed) return reply({ ok: false, error: 'Sign in with your own name and password to delete ideas.' });
  const id = String(req.id || '').replace(/[^\w-]/g, '').slice(0, 80);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const found = ideaRowAt(id), idea = found.at > 0 ? readIdeas().find(x => x.id === id) : null;
    if (!idea) return reply({ ok: false, error: 'That idea wasn’t found. Refresh the page and try again.' });
    if (!ed.coord && !creditedTo(idea, ed)) return reply({ ok: false, error: 'You can delete the ideas credited to you. Ask a coordinator about this one.' });
    found.sheet.deleteRow(found.at + 1);
    return reply({ ok: true, id: id });
  } finally { lock.releaseLock(); }
}
/* "Build on this idea": any creator adds notes on top of the original concept (the concept itself is never changed),
   and can take the lead. A second person to take the lead becomes a co-lead. */
function buildOnIdea(req) {
  const by = clean(req.name); if (!by) return reply({ ok: false, error: 'Choose your name first.' });
  const note = text(req.note).slice(0, 1500); if (!note) return reply({ ok: false, error: 'Add your notes first.' });
  const id = String(req.id || '').replace(/[^\w-]/g, '').slice(0, 80);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = ideasSheet(), ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues().map(r => String(r[0]));
    const at = id ? ids.indexOf(id) : -1; if (at < 1) return reply({ ok: false, error: 'That idea wasn’t found. Refresh the page and try again.' });
    const idea = readIdeas().find(x => x.id === id);
    const leads = String(idea.lead || '').split(/\s*&\s*/).map(s => s.trim()).filter(Boolean);
    const lead = !!req.lead && leads.indexOf(by) < 0;
    if (lead) { leads.push(by); idea.lead = leads.join(' & '); }
    idea.buildOns = (Array.isArray(idea.buildOns) ? idea.buildOns : []).concat([{ name: by, note: note, date: new Date().toISOString(), lead: lead }]).slice(-50);
    sheet.getRange(at + 1, 1, 1, IDEA_COLUMNS.length).setValues([ideaRow(idea, by)]);
    logActivity('build', by, (lead ? (leads.length > 1 ? 'is co-leading “' : 'is leading “') : 'built on “') + idea.title + '”', 'idea:' + id);
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
    logActivity('review', '', 'A new idea came in through the pitch box: “' + text(p.title).slice(0, 80) + '”', '');
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
const OPEN_CASTING = ['Meet the Squad, Part 2: Pass the Toy', 'Tot Squad Round Up: Point & Answer'];
/* Answers from an open casting call (the Round Up questions): one row per person in "Tot Squad Round Up answers",
   one column per question. New questions add a column at the end; nothing is overwritten. */
function answersSheet() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('ANSWERS_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Tot Squad Round Up answers'), sheet = ss.getSheets()[0];
  sheet.setName('Answers'); sheet.appendRow(['Sent', 'Name', 'How to reach them', 'Casting call']); sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f3eaf1');
  DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(ROOTS.collab));
  props.setProperty('ANSWERS_SHEET_ID', ss.getId());
  return sheet;
}
function saveCastAnswers(req) {
  const me = accountName(req.key), name = me ? rosterName(me) : clean(req.name), project = clean(req.project);
  if (!castOpenFor(project, req.key)) return reply({ ok: false, error: 'This casting call isn’t taking answers right now.' });
  if (!name) return reply({ ok: false, error: 'Add your name first.' });
  const answers = (Array.isArray(req.answers) ? req.answers : []).slice(0, 30).map(x => ({ q: text(x && x.q).slice(0, 200), a: text(x && x.a).slice(0, 500) })).filter(x => x.q && x.a);
  if (!answers.length) return reply({ ok: false, error: 'Answer at least one question.' });
  const cache = CacheService.getScriptCache(), count = Number(cache.get('answers-count') || 0);
  if (count >= 60) return reply({ ok: false, error: 'Lots of answers are coming in right now. Try again in an hour.' });
  cache.put('answers-count', String(count + 1), 3600);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = answersSheet(), width = Math.max(sheet.getLastColumn(), 4), head = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
    answers.forEach(x => { if (head.indexOf(x.q) < 0) { head.push(x.q); sheet.getRange(1, head.length).setValue(x.q).setFontWeight('bold').setBackground('#f3eaf1'); } });
    const row = head.map(h => h === 'Sent' ? new Date() : h === 'Name' ? name : h === 'How to reach them' ? text(req.contact).slice(0, 120) : h === 'Casting call' ? project : ((answers.find(x => x.q === h) || {}).a || ''));
    sheet.appendRow(row);
    countCallResponse(project);
    logActivity('video', name, 'answered the questions for ' + project, '');
    return reply({ ok: true });
  } finally { lock.releaseLock(); }
}
function startCastUpload(req) {
  const me = accountName(req.key), name = me ? rosterName(me) : clean(req.name), project = clean(req.project), type = String(req.type || ''), size = Number(req.size);
  if (!castOpenFor(project, req.key)) return reply({ ok: false, error: 'This casting call isn’t taking videos right now.' });
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
/* B-roll uploads, from creators and from any specialist, land in "B-roll to review" (private to the shared drive's
   members). The B-Roll Library itself is link-viewable, so clips only move there once a coordinator has checked them
   for faces, client details and permission. */
/* ---------- Casting calls posted by creators ("Casting calls" tab of the Creators Club program sheet) ----------
   Any creator signed in with their own password, or a coordinator, can post one.
   Creators Club calls are live right away for signed-in creators. Public calls are live for the Creators Club right
   away and show on the public page only after a coordinator approves them. A creator's edit to an approved public
   call's wording sends it back for approval. Videos go to a folder named after the call, like every casting call. */
const CALL_TAB = 'Casting calls';
const callCols = () => CLUB_TABS[CALL_TAB];
// Reads without creating anything: a page view must never make a sheet or a tab.
function callSheetIfAny() {
  const id = PropertiesService.getScriptProperties().getProperty('CLUB_SHEET_ID'); if (!id) return null;
  try { return SpreadsheetApp.openById(id).getSheetByName(CALL_TAB); } catch (err) { console.error(err); return null; }
}
function callRows() { const sh = callSheetIfAny(); return sh ? readTable(sh, callCols()).filter(r => r.id && r.title) : []; }
const callLines = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
const listOf = (v, n, max) => (Array.isArray(v) ? v : String(v || '').split('\n')).map(x => text(x).slice(0, max)).filter(Boolean).slice(0, n);
function callOpen(r) { const due = isoDay(r.deadline); return sameName(r.status, 'Open') && (!due || due >= todayIso()); }
function callPublic(r) { return callOpen(r) && sameName(r.audience, 'Public') && sameName(r.review, 'Approved'); }
function callOut(r, full) {
  const o = { id: r.id, title: r.title, audience: sameName(r.audience, 'Public') ? 'public' : 'network', description: r.description, instructions: r.instructions,
    steps: callLines(r.steps), questions: callLines(r.questions), deadline: isoDay(r.deadline), lead: full ? r.lead : String(r.lead || '').split(/\s+/)[0] }; // first name only in public
  if (full) Object.assign(o, { open: callOpen(r), status: sameName(r.status, 'Closed') ? 'closed' : 'open', review: sameName(r.review, 'Approved') ? 'approved' : sameName(r.review, 'Waiting') ? 'waiting' : '',
    reviewNote: r.reviewNote, ideaId: r.ideaId, responses: Number(r.responses) || 0, posted: isoTime(r.posted), updated: isoTime(r.updated) });
  return o;
}
function allCalls() { return callRows().map(r => callOut(r, true)).reverse(); }
const ownsCall = (r, me) => !!me && sameName(r.owner, me);
/* GET ?action=casting. Signed out: approved public calls only (no contact details, cached for 2 minutes).
   Signed in: every open call, plus your own closed ones. Coordinators: every call. */
function castingReply(p) {
  const coord = isCoordinator(p.coord) || isCoordinator(p.key), me = accountName(p.key);
  if (!coord && !me) {
    const cache = CacheService.getScriptCache(), hit = cache.get('calls-public');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const out = JSON.stringify({ ok: true, calls: callRows().filter(callPublic).map(r => callOut(r, false)) });
    cache.put('calls-public', out, 120);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
  return reply({ ok: true, calls: callRows().filter(r => coord || callOpen(r) || ownsCall(r, me)).map(r => Object.assign(callOut(r, true), { mine: coord || ownsCall(r, me) })).reverse() });
}
// Casting calls in content.js (OPEN_CASTING) take videos from anyone; posted calls follow their own audience.
function castOpenFor(project, key) {
  if (OPEN_CASTING.indexOf(project) >= 0) return true;
  const r = callRows().find(x => sameName(x.title, project) && callOpen(x)); if (!r) return false;
  return callPublic(r) || isMentor(key);
}
function countCallResponse(project) {
  try {
    const sh = callSheetIfAny(); if (!sh) return;
    const r = readTable(sh, callCols()).find(x => x.id && sameName(x.title, project)); if (!r) return;
    writeRow(sh, callCols(), { responses: (Number(r.responses) || 0) + 1 }, r._row);
  } catch (err) { console.error(err); }
}
function callEditor(req) {
  if (isCoordinator(req.coordKey) || isCoordinator(req.key)) return { coord: true, name: clean(req.coordName) || 'Coordinator', full: '' };
  const full = accountName(req.key); return full ? { coord: false, name: rosterName(full), full: full } : null;
}
// POST call-save { call: { id?, title, description, instructions, steps, questions, deadline, audience: 'network'|'public', ideaId? } }
function saveCall(req) {
  const ed = callEditor(req); if (!ed) return reply({ ok: false, error: 'Sign in with your own name and password to post a casting call.' });
  const c = req.call || {}, title = clean(c.title), description = text(c.description).slice(0, 600), instructions = text(c.instructions).slice(0, 300);
  if (!title) return reply({ ok: false, error: 'Give your casting call a title.' });
  if (!description) return reply({ ok: false, error: 'Say what the video is about.' });
  if (!instructions) return reply({ ok: false, error: 'Say what people should film.' });
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(c.deadline || '')) ? String(c.deadline) : '';
  if (deadline && deadline < todayIso()) return reply({ ok: false, error: 'Pick a due date that hasn’t passed.' });
  const audience = c.audience === 'public' ? 'Public' : 'Creators Club';
  const fields = { title: title, description: description, instructions: instructions, steps: listOf(c.steps, 8, 200).join('\n'), questions: listOf(c.questions, 10, 200).join('\n'), deadline: deadline, audience: audience };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = clubSheet(CALL_TAB), rows = readTable(sheet, callCols()).filter(r => r.id);
    const id = String(c.id || '').replace(/[^\w-]/g, '').slice(0, 60), before = id ? rows.find(r => r.id === id) : null;
    if (id && !before) return reply({ ok: false, error: 'That casting call wasn’t found. Refresh the page and try again.' });
    if (before && !ed.coord && !ownsCall(before, ed.full)) return reply({ ok: false, error: 'You can edit the casting calls you posted. Ask a coordinator about this one.' });
    if (rows.some(r => r.id !== id && sameName(r.title, title)) || OPEN_CASTING.some(x => sameName(x, title))) return reply({ ok: false, error: 'Another casting call already uses that title. Try a different one.' });
    if (before && (Number(before.responses) || 0) > 0 && !sameName(before.title, title)) return reply({ ok: false, error: 'People have already sent videos for this call, so its title can’t change. Its videos are filed under it.' });
    // Public calls: a coordinator's own call is approved; a creator's waits. Changing only the due date keeps an approval.
    const wording = ['title', 'description', 'instructions', 'steps', 'questions'].some(k => !before || String(before[k]) !== fields[k]);
    fields.review = audience !== 'Public' ? '' : ed.coord ? 'Approved' : before && sameName(before.audience, 'Public') && sameName(before.review, 'Approved') && !wording ? 'Approved' : 'Waiting';
    if (fields.review === 'Approved' && ed.coord) fields.reviewedBy = ed.name;
    if (audience === 'Public' && fields.review === 'Waiting') fields.reviewNote = '';
    Object.assign(fields, { updated: new Date(), updatedBy: ed.name });
    let row;
    if (before) row = writeRow(sheet, callCols(), fields, before._row);
    else {
      const ideaId = String(c.ideaId || '').replace(/[^\w-]/g, '').slice(0, 80);
      Object.assign(fields, { id: newId('call'), status: 'Open', lead: ed.name, owner: ed.full, ideaId: ideaId, responses: 0, posted: new Date() });
      row = writeRow(sheet, callCols(), fields, 0);
      if (ideaId) moveIdeaToCasting(ideaId, ed);
    }
    CacheService.getScriptCache().remove('calls-public');
    const saved = readTable(sheet, callCols()).find(r => r._row === row);
    if (!before) logActivity('cast', ed.name, 'posted a casting call: “' + title + '”' + (audience === 'Public' ? ' (public once a coordinator approves it)' : ''), 'call:' + saved.id);
    return reply({ ok: true, call: Object.assign(callOut(saved, true), { mine: true }) });
  } finally { lock.releaseLock(); }
}
// A call posted from an idea moves that idea from Idea to Casting, when the poster can edit it (credited or leading).
function moveIdeaToCasting(id, ed) {
  try {
    const found = ideaRowAt(id); if (found.at < 1) return;
    const idea = readIdeas().find(x => x.id === id); if (!idea || idea.stage !== 'idea') return;
    const leads = String(idea.lead || '').split(/\s*&\s*/).map(x => x.trim());
    const mine = ed.coord || creditedTo(idea, { name: ed.full, roster: ed.name, claimed: ed.full ? claimOf(findAccount(ed.full)) : '' }) || leads.some(l => sameName(l, ed.name));
    if (!mine) return;
    idea.stage = 'casting';
    found.sheet.getRange(found.at + 1, 1, 1, IDEA_COLUMNS.length).setValues([ideaRow(idea, ed.name)]);
  } catch (err) { console.error(err); }
}
// POST call-status { id, status: 'open'|'closed' }: the poster or a coordinator closes or reopens a call.
function setCallStatus(req) {
  const ed = callEditor(req); if (!ed) return reply({ ok: false, error: 'Sign in with your own name and password first.' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = clubSheet(CALL_TAB), r = readTable(sheet, callCols()).find(x => x.id && x.id === String(req.id || ''));
    if (!r) return reply({ ok: false, error: 'That casting call wasn’t found. Refresh the page and try again.' });
    if (!ed.coord && !ownsCall(r, ed.full)) return reply({ ok: false, error: 'You can close the casting calls you posted.' });
    const open = req.status === 'open';
    if (open && isoDay(r.deadline) && isoDay(r.deadline) < todayIso()) return reply({ ok: false, error: 'Its due date has passed. Edit the call and pick a new date to reopen it.' });
    writeRow(sheet, callCols(), { status: open ? 'Open' : 'Closed', updated: new Date(), updatedBy: ed.name }, r._row);
    CacheService.getScriptCache().remove('calls-public');
    const saved = readTable(sheet, callCols()).find(x => x._row === r._row);
    return reply({ ok: true, call: Object.assign(callOut(saved, true), { mine: true }) });
  } finally { lock.releaseLock(); }
}
// Coordinator tools (club.gs adminReply): decision approve | club (keep it in the Creators Club) | close | open.
function adminCall(req, who) {
  const sheet = clubSheet(CALL_TAB), r = readTable(sheet, callCols()).find(x => x.id && x.id === String(req.id || ''));
  if (!r) throw new Error('That casting call wasn’t found. Refresh and try again.');
  const note = text(req.note).slice(0, 300), patch = { reviewedBy: who, updated: new Date(), updatedBy: who };
  if (req.decision === 'approve') Object.assign(patch, { audience: 'Public', review: 'Approved', reviewNote: note });
  else if (req.decision === 'club') Object.assign(patch, { audience: 'Creators Club', review: '', reviewNote: 'Kept in the Creators Club' + (note ? ': ' + note : '') });
  else if (req.decision === 'close' || req.decision === 'open') patch.status = req.decision === 'open' ? 'Open' : 'Closed';
  else throw new Error('Unknown decision.');
  writeRow(sheet, callCols(), patch, r._row);
  CacheService.getScriptCache().remove('calls-public');
}
const BROLL_REVIEW = 'B-roll to review';
function brollReviewFolder() { return childFolder(DriveApp.getFolderById(ROOTS.collab), BROLL_REVIEW); }
function startBrollUpload(req) {
  const name = clean(req.name), type = String(req.type || ''), size = Number(req.size);
  if (!name) return reply({ ok: false, error: 'Add your name first.' });
  if (req.agreed !== true) return reply({ ok: false, error: 'Check the permission box first.' });
  if (!/^(video|image)\//.test(type)) return reply({ ok: false, error: 'Only videos and photos can be uploaded here.' });
  if (!(size > 0 && size <= MAX_BYTES)) return reply({ ok: false, error: 'Files can be up to 2 GB each.' });
  const cache = CacheService.getScriptCache(), count = Number(cache.get('broll-count') || 0);
  if (count >= 120) return reply({ ok: false, error: 'Lots of clips are coming in right now. Try again in an hour.' });
  cache.put('broll-count', String(count + 1), 3600);
  const folder = childFolder(brollReviewFolder(), name);
  const origin = ORIGINS.indexOf(req.origin) >= 0 ? req.origin : ORIGINS[0];
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'post', contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(size), Origin: origin },
    payload: JSON.stringify({ name: cleanFile(req.fileName), parents: [folder.getId()], description: 'B-roll from ' + name + ' (sent from the B-roll library page, not yet reviewed)' }),
    muteHttpExceptions: true
  });
  const headers = res.getHeaders(), uploadUrl = headers.Location || headers.location;
  if (res.getResponseCode() !== 200 || !uploadUrl) return reply({ ok: false, error: 'Drive didn’t accept the upload. Try again in a minute.' });
  return reply({ ok: true, uploadUrl: uploadUrl }); // no folder link: clips stay private until reviewed
}
/* Activity feed ("What's new" in the app, creators only): one row per event in "Creators Club activity". */
function activitySheet() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('ACTIVITY_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { console.error(err); } }
  const ss = SpreadsheetApp.create('Creators Club activity'), sheet = ss.getSheets()[0];
  sheet.setName('Activity'); sheet.appendRow(['When', 'Type', 'Who', 'What', 'Link']); sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3eaf1');
  DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(ROOTS.collab));
  props.setProperty('ACTIVITY_SHEET_ID', ss.getId());
  return sheet;
}
function logActivity(type, who, what, link) { try { activitySheet().appendRow([new Date(), type, clean(who), text(what).slice(0, 300), String(link || '').slice(0, 300)]); } catch (err) { console.error(err); } }
function readActivity() {
  const sheet = activitySheet(), last = sheet.getLastRow(); if (last < 2) return [];
  const start = Math.max(2, last - 39);
  return sheet.getRange(start, 1, last - start + 1, 5).getValues().reverse().map(r => ({ when: r[0] instanceof Date ? r[0].toISOString() : String(r[0]), type: String(r[1]), who: String(r[2]), what: String(r[3]), link: String(r[4]) }));
}
// Called by the page after a video or clip finishes uploading. Only logs files that really are new in the Squad's folders.
function uploadDone(req) {
  const id = String(req.fileId || '').replace(/[^\w-]/g, ''); if (!id) return reply({ ok: false });
  const cache = CacheService.getScriptCache(); if (cache.get('done-' + id)) return reply({ ok: true }); cache.put('done-' + id, '1', 21600);
  let file; try { file = DriveApp.getFileById(id); } catch (err) { return reply({ ok: false }); }
  if (Date.now() - file.getDateCreated().getTime() > 3 * 3600 * 1000) return reply({ ok: false });
  const person = file.getParents().hasNext() ? file.getParents().next() : null; if (!person) return reply({ ok: false });
  const up = person.getParents().hasNext() ? person.getParents().next() : null; if (!up) return reply({ ok: false });
  const top = up.getParents().hasNext() ? up.getParents().next() : null;
  if (up.getId() === ROOTS.broll) logActivity('broll', person.getName(), 'added B-roll: ' + file.getName(), file.getUrl());
  else if (up.getName() === BROLL_REVIEW && top && top.getId() === ROOTS.collab) logActivity('broll', person.getName(), 'sent B-roll for review: ' + file.getName(), ''); // private until reviewed
  else if (top && top.getId() === ROOTS.collab) { logActivity('video', person.getName(), 'sent a video for ' + up.getName(), file.getUrl()); countCallResponse(up.getName()); castVideosRefresh(); }
  else return reply({ ok: false });
  return reply({ ok: true });
}
// Plain text only, and never a formula.
function text(s) { const t = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, 3000); return /^[=+\-@]/.test(t) ? "'" + t : t; }

/* GET ?action=reels: the Reels – Status Report sheet as JSON for the Reels page (cached for 2 minutes). */
const REELS_SHEET_ID = moved('1onXGs-dUEvschflMisc0GW0ozzqsRimchQuYtzxbtfg');
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'bios') return reply({ ok: true, bios: readBios() }); // public: the bios creators wrote for Meet the Squad
  if (action === 'claimed') return reply({ ok: true, claimed: claimedNames(), claims: claimedPairs() }); // public: Squad names already claimed, with the full names (club.gs)
  if (action === 'casting') return castingReply(e.parameter); // public calls for everyone; Creators Club calls only with a sign-in
  if (action && !isMentor(e.parameter.key)) return locked();
  if (action === 'ideas') return reply({ ok: true, ideas: readIdeas() }); // creators only
  if (action === 'broll-library') return brollLibraryReply(e.parameter); // creators only: approved B-roll, synced from Drive
  if (action === 'cast-videos') return castVideosReply(e.parameter); // creators only: videos sent in for each casting call
  if (action === 'club') { const me = accountName(e.parameter.key); return reply(clubForCreator(me ? rosterName(me) : clean(e.parameter.name))); }
  if (action === 'gate') return reply({ ok: true });
  if (action === 'activity') return reply({ ok: true, activity: readActivity() });
  if (action === 'applications') { if (!isCoordinator(e.parameter.coord)) return locked(); return reply({ ok: true, applications: readApplications() }); } // applicants' details: coordinators only
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



// Who can use the members' tools: a creator signed in with their own password, or a coordinator.
// The shared creator password (MENTOR_PASSCODE) is NOT a key: it only opens "Set up your password" (club.gs).
function isMentor(key) {
  return !!String(key || '').trim() && (isCoordinator(key) || !!accountName(key));
}
function locked() { return reply({ ok: false, locked: true, error: 'That mentor password doesn’t match.' }); }

function childFolder(parent, name) {
  const found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}
function clean(s) { return String(s || '').replace(/[^\p{L}\p{N} '’&.,#:()!?-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80); }
function cleanFile(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim().slice(0, 120) || 'clip'; }
function reply(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- B-roll library sync (b-roll.html, creators only) ----------
   GET ?action=broll-library&key=…  Signed-in creators and coordinators only (doGet checks isMentor before this runs,
   and this checks again). It lists APPROVED clips only:
     - every folder directly inside the B-Roll Library (ROOTS.broll), one per specialist, and
     - folders a coordinator added with addBrollFolder() (script property BROLL_EXTRA_FOLDERS), for approved
       footage kept somewhere else in the shared drive.
   Never "B-roll to review", which is where new uploads wait (it lives at the shared drive's top level, and any
   folder named like it is skipped). The request takes no folder ID, so nobody can ask for another folder.
   Approving a clip = moving it, in Drive, from B-roll to review / <Name> into B-Roll Library / <Name>.
   The answer is cached for 3 minutes; brollRefresh() (or Coordinator tools > admin-broll) clears it. */
const BROLL_CACHE = 'broll-library-v1', BROLL_TTL = 180, BROLL_MAX_FOLDERS = 60, BROLL_MAX_CLIPS = 300;
const BROLL_CATS = ['aisles', 'strollers', 'car-seats', 'nursery', 'feeding', 'babywearing', 'registry', 'squad'];
// Filename words → category. Conservative on purpose: anything unclear is "other" rather than a wrong label.
const BROLL_WORDS = [
  ['strollers', /\b(strollers?|wagons?|bugaboo|uppababy|vista|cruz|minu|joolz|nuna\s+(mixx|trvl|swiv)|bob\s+gear)\b/i],
  ['car-seats', /\b(car[\s-]?seats?|carseats?|car seat base|isofix|latch)\b/i],
  ['nursery', /\b(nursery|crib|bassinet|halo|sleep|swaddle|mattress|glider)\b/i],
  ['feeding', /\b(feeding|bottles?|bibs?|pump(ing)?|high[\s-]?chair|formula|nursing pillow)\b/i],
  ['babywearing', /\b(babywearing|carriers?|ergo|wrap|sling)\b/i],
  ['registry', /\b(registry|scan(ning)?|target app)\b/i],
  ['aisles', /\b(aisles?|inside target|store walk|shelf|shelves)\b/i],
  ['squad', /\b(squad|tot squad shirt|totsquad shirt|entrance)\b/i]
];
function brollCategory(name, description) {
  const tag = String(description || '').match(/#([a-z-]+)/i); if (tag && BROLL_CATS.indexOf(tag[1].toLowerCase()) >= 0) return tag[1].toLowerCase(); // a coordinator's #tag in the file's Drive description wins
  const base = String(name || '').replace(/\.[a-z0-9]{2,4}$/i, ''), prefix = base.split('_')[0].toLowerCase().replace(/\s+/g, '-');
  if (base.indexOf('_') > 0 && BROLL_CATS.indexOf(prefix) >= 0) return prefix; // the naming rule on the page: category_what.mov
  const hits = BROLL_WORDS.filter(([, re]) => re.test(base.replace(/[_-]+/g, ' '))).map(([c]) => c);
  return hits.length === 1 ? hits[0] : 'other'; // two different matches is a guess, so it isn't labelled
}
function brollTitle(name) {
  let t = String(name || '').replace(/\.[a-z0-9]{2,4}$/i, '');
  t = t.replace(/^(b[\s-]?roll)\s*[-–:]\s*/i, ''); // "B-roll - Halo" → "Halo"
  const cat = t.split('_')[0].toLowerCase(); if (t.indexOf('_') > 0 && BROLL_CATS.indexOf(cat.replace(/\s+/g, '-')) >= 0) t = t.slice(t.indexOf('_') + 1);
  t = t.replace(/[_]+/g, ' ').replace(/\s+-\s+/g, ' · ').replace(/(\w)-(?=\w)/g, '$1 ').replace(/\s+/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Clip';
}
const brollLength = ms => { const s = Math.round(Number(ms) / 1000); return s > 0 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : ''; };
// Drive API v3 list with paging (shared drives included).
function driveList(q, fields, limit) {
  const out = []; let page = '';
  do {
    const url = 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=200&orderBy=name'
      + '&q=' + encodeURIComponent(q) + '&fields=' + encodeURIComponent('nextPageToken,files(' + fields + ')') + (page ? '&pageToken=' + encodeURIComponent(page) : '');
    const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Drive list failed (' + res.getResponseCode() + ')');
    const data = JSON.parse(res.getContentText()); (data.files || []).forEach(f => out.push(f)); page = data.nextPageToken || '';
  } while (page && out.length < limit);
  return out.slice(0, limit);
}
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const isReviewFolder = name => /review/i.test(String(name || '')) || String(name || '').trim() === BROLL_REVIEW;
function brollExtraFolders() { try { const v = JSON.parse(PropertiesService.getScriptProperties().getProperty('BROLL_EXTRA_FOLDERS') || '[]'); return Array.isArray(v) ? v.filter(f => f && /^[\w-]{10,}$/.test(String(f.id))) : []; } catch (err) { return []; } }
// The approved specialist folders: children of the B-Roll Library plus the coordinators' extra list. Never the review folder.
function brollApprovedFolders() {
  const review = (() => { try { const r = DriveApp.getFolderById(ROOTS.collab).getFoldersByName(BROLL_REVIEW); return r.hasNext() ? r.next().getId() : ''; } catch (err) { return ''; } })(); // look it up, never create it
  const kids = driveList("'" + ROOTS.broll + "' in parents and mimeType = '" + FOLDER_MIME + "' and trashed = false", 'id,name', BROLL_MAX_FOLDERS)
    .filter(f => f.id !== review && !isReviewFolder(f.name)).map(f => ({ id: f.id, name: f.name }));
  brollExtraFolders().forEach(x => {
    const id = moved(String(x.id)); if (id === review || id === ROOTS.collab || id === ROOTS.broll || kids.some(k => k.id === id)) return;
    try { const f = DriveApp.getFolderById(id); if (!f.isTrashed() && !isReviewFolder(f.getName())) kids.push({ id: id, name: clean(x.name) || f.getName() }); } catch (err) { console.error('B-roll folder not found: ' + id); }
  });
  return kids.slice(0, BROLL_MAX_FOLDERS);
}
function readBrollLibrary() {
  let total = 0;
  const folders = brollApprovedFolders().map(f => {
    const files = total >= BROLL_MAX_CLIPS ? [] : driveList("'" + f.id + "' in parents and trashed = false and mimeType contains 'video/'", 'id,name,mimeType,description,webViewLink,thumbnailLink,videoMediaMetadata(durationMillis)', BROLL_MAX_CLIPS - total);
    total += files.length;
    return { id: f.id, name: clean(f.name), url: 'https://drive.google.com/drive/folders/' + f.id, count: files.length,
      clips: files.map(x => ({ id: x.id, title: brollTitle(x.name), mimeType: x.mimeType, url: x.webViewLink || 'https://drive.google.com/file/d/' + x.id + '/view',
        category: brollCategory(x.name, x.description), thumbnail: x.thumbnailLink ? x.thumbnailLink.replace(/=s\d+$/, '=s400') : '', length: brollLength(x.videoMediaMetadata && x.videoMediaMetadata.durationMillis) })) };
  });
  return { ok: true, updated: new Date().toISOString(), libraryUrl: 'https://drive.google.com/drive/folders/' + ROOTS.broll, total: total, folders: folders };
}
function brollLibraryReply(params) {
  if (!isMentor(params && params.key)) return locked(); // checked again here: never list clips without a sign-in
  try {
    const cache = CacheService.getScriptCache(), hit = cache.get(BROLL_CACHE);
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const out = JSON.stringify(readBrollLibrary());
    if (out.length < 95000) cache.put(BROLL_CACHE, out, BROLL_TTL); // CacheService holds up to 100 KB per key
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) { console.error(err); return reply({ ok: false, error: 'The B-roll library couldn’t load from Drive. Try again in a minute.' }); }
}
function brollRefresh() { CacheService.getScriptCache().remove(BROLL_CACHE); }
// Coordinators: run from the editor to show approved footage kept outside the B-Roll Library, e.g. addBrollFolder('FOLDER_ID', 'Sarah').
function addBrollFolder(id, name) {
  id = String(id || '').trim(); if (!/^[\w-]{10,}$/.test(id)) throw new Error('Use the folder ID from its Drive link.');
  const f = DriveApp.getFolderById(moved(id)); if (isReviewFolder(f.getName())) throw new Error('That looks like a review folder. Only approved folders can be listed.');
  const list = brollExtraFolders().filter(x => x.id !== id); list.push({ id: id, name: clean(name) || f.getName() });
  PropertiesService.getScriptProperties().setProperty('BROLL_EXTRA_FOLDERS', JSON.stringify(list)); brollRefresh(); return list;
}
function removeBrollFolder(id) { const list = brollExtraFolders().filter(x => x.id !== String(id)); PropertiesService.getScriptProperties().setProperty('BROLL_EXTRA_FOLDERS', JSON.stringify(list)); brollRefresh(); return list; }
// Read-only check to run from the editor after deploying: which folders and how many clips the page will show.
function checkBrollLibrary() {
  const lib = readBrollLibrary();
  console.log('B-Roll Library: ' + DriveApp.getFolderById(ROOTS.broll).getName() + ' (' + ROOTS.broll + ')');
  lib.folders.forEach(f => console.log(f.name + ': ' + f.count + ' clips · ' + f.clips.map(c => c.title + ' [' + c.category + ']').join(', ')));
  return lib.folders.map(f => ({ name: f.name, count: f.count }));
}

/* ---------- Casting call videos (index.html casting cards, creators only) ----------
   GET ?action=cast-videos&key=…  Signed-in creators and coordinators only (doGet checks isMentor first; this checks again).
   Lists the videos sent in for each casting call: the shared drive's top-level folder named after the call
   (OPEN_CASTING and every call on the Casting calls tab), then one folder per sender inside it. Only folders whose
   name matches a casting call are read, so "B-roll to review", the B-Roll Library, sheets and other folders never show.
   Taylor's decision (Nov 27, 2026): every signed-in creator can watch every call's videos, so each call folder is
   shared "anyone with the link can view" (like the B-Roll Library); only signed-in creators get the links.
   The answer is cached for 3 minutes; castVideosRefresh() (or Coordinator tools > admin-cast-videos) clears it. */
const CAST_CACHE = 'cast-videos-v1', CAST_TTL = 180, CAST_MAX_VIDEOS = 300;
function castTitles() {
  const titles = OPEN_CASTING.slice();
  callRows().forEach(r => { if (!titles.some(t => sameName(clean(t), clean(r.title)))) titles.push(r.title); });
  return titles;
}
// Link viewing for one call folder. Remembered in a script property, so Drive is asked once per folder.
function shareCastFolder(id) {
  const props = PropertiesService.getScriptProperties(), memo = 'CAST_SHARED_' + id;
  if (props.getProperty(memo)) return true;
  const res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '/permissions?supportsAllDrives=true&sendNotificationEmail=false', {
    method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ role: 'reader', type: 'anyone', allowFileDiscovery: false }), muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) { console.error('Couldn’t share casting folder ' + id + ': ' + res.getContentText().slice(0, 300)); return false; }
  props.setProperty(memo, new Date().toISOString()); return true;
}
function readCastVideos() {
  const titles = castTitles(), reviewName = String(BROLL_REVIEW);
  const tops = driveList("'" + ROOTS.collab + "' in parents and mimeType = '" + FOLDER_MIME + "' and trashed = false", 'id,name', 400)
    .filter(f => f.id !== ROOTS.broll && f.name !== reviewName && !isReviewFolder(f.name));
  let total = 0;
  const calls = titles.map(t => {
    const folder = tops.find(f => sameName(f.name, clean(t))); if (!folder) return null;
    const shared = shareCastFolder(folder.id);
    const people = driveList("'" + folder.id + "' in parents and mimeType = '" + FOLDER_MIME + "' and trashed = false", 'id,name', 200);
    const videos = [];
    [{ id: folder.id, name: '' }].concat(people).forEach(person => {
      if (total >= CAST_MAX_VIDEOS) return;
      driveList("'" + person.id + "' in parents and trashed = false and mimeType contains 'video/'", 'id,name,createdTime,webViewLink,thumbnailLink,videoMediaMetadata(durationMillis)', CAST_MAX_VIDEOS - total).forEach(x => {
        total++;
        videos.push({ id: x.id, title: brollTitle(x.name), from: clean(person.name), sent: x.createdTime || '', url: x.webViewLink || 'https://drive.google.com/file/d/' + x.id + '/view',
          thumbnail: x.thumbnailLink ? x.thumbnailLink.replace(/=s\d+$/, '=s400') : '', length: brollLength(x.videoMediaMetadata && x.videoMediaMetadata.durationMillis) });
      });
    });
    videos.sort((a, b) => String(b.sent).localeCompare(String(a.sent))); // newest first
    return { title: t, url: 'https://drive.google.com/drive/folders/' + folder.id, shared: shared, count: videos.length, videos: videos };
  }).filter(Boolean);
  return { ok: true, updated: new Date().toISOString(), total: total, calls: calls };
}
function castVideosReply(params) {
  if (!isMentor(params && params.key)) return locked(); // checked again here: never list videos without a sign-in
  try {
    const cache = CacheService.getScriptCache(), hit = cache.get(CAST_CACHE);
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const out = JSON.stringify(readCastVideos());
    if (out.length < 95000) cache.put(CAST_CACHE, out, CAST_TTL);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) { console.error(err); return reply({ ok: false, error: 'The casting videos couldn’t load from Drive. Try again in a minute.' }); }
}
function castVideosRefresh() { CacheService.getScriptCache().remove(CAST_CACHE); }
// Read-only check to run from the editor after deploying (it does share call folders it finds, as the page would).
function checkCastVideos() {
  const r = readCastVideos();
  r.calls.forEach(c => console.log(c.title + ': ' + c.count + ' videos' + (c.shared ? '' : ' (folder NOT link-viewable)') + ' · ' + c.videos.map(v => v.from + ': ' + v.title).join(', ')));
  return r.calls.map(c => ({ title: c.title, count: c.count, shared: c.shared }));
}
