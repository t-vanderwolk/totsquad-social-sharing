/* Creators Club 2.0 in the app: the member dashboard, weekly brief, link submissions, pause requests
   and coordinator tools. Loaded after script.js on the landing page; uses its helpers ($, body, showModal…).
   Data comes from apps-script/club.gs through the same web app (content.uploadEndpoint). Members pick
   their name (the creator password is shared); coordinators also enter the coordinator code, which the
   script checks for every coordinator action. */
let club = null, clubBusy = false, coord = null, coordTab = 'applications', coordFilter = 'open', briefDraft = null;

const clubName = () => storageGet(UPLOAD_NAME_KEY) || '';
const firstName = n => String(n || '').split(/\s+/)[0];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
function weekRange(b) {
  if (!b || !dateValid(b.weekStart)) return '';
  const a = fmt(b.weekStart, { month: 'short', day: 'numeric' });
  return dateValid(b.weekEnd) && b.weekEnd !== b.weekStart ? `${a} – ${fmt(b.weekEnd, b.weekEnd.slice(5, 7) === b.weekStart.slice(5, 7) ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}` : a;
}
// Plain text from the sheet, with line breaks kept and https links made clickable.
function richText(t) {
  return escapeHTML(String(t || '')).replace(/https:\/\/[^\s<]+/g, u => { const safe = publicUrl(u.replace(/&amp;/g, '&')); return safe ? `<a href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer">${u}</a>` : u; }).replace(/\n/g, '<br>');
}
const clubCircle = () => publicUrl((club && club.settings && club.settings.creatorCircleUrl) || content.creatorCircleUrl);
const isMember = m => !!m && ['Active', 'Needs Check-In'].includes(m.status);

/* ---------- Member dashboard ---------- */
async function loadClub() {
  if (!has('#club-dash') || !UPLOAD_ON() || !mentorKey() || typeof fetch !== 'function') return;
  clubBusy = true; renderDashboard();
  try {
    const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=club&key=${encodeURIComponent(mentorKey())}&name=${encodeURIComponent(clubName())}`);
    club = await res.json();
  } catch { club = { ok: false }; }
  clubBusy = false; renderDashboard();
}
function clubNames() { return [...new Set([...squadNames(), ...((club && club.roster) || [])])].sort(); }
function namePickerHTML(id, label) {
  const saved = clubName();
  return `<label class="club-who" for="${id}"><span>${escapeHTML(label)}</span><select id="${id}" data-club-name><option value="">Choose your name</option>${clubNames().map(n => `<option${n === saved ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select></label>`;
}
function renderDashboard() {
  if (!has('#club-dash')) return; const box = $('#club-dash');
  if (!club) { box.innerHTML = `<p class="quiet">${clubBusy ? 'Loading your Creators Club…' : ''}</p>`; return; }
  if (!club.ok) { box.innerHTML = '<p class="quiet">Your Creators Club dashboard couldn’t load right now. Try again in a minute.</p>'; return; }
  const name = clubName(), m = club.member, b = club.brief;
  const head = `<div class="club-head"><div><h2 id="dash-title">${name ? `Hi, ${escapeHTML(firstName(name))}!` : 'Your Creators Club'}</h2><p>${m ? escapeHTML(memberLine(m)) : 'Your weekly brief, posts and standing, all in one place.'}</p></div>${namePickerHTML('club-name', name ? 'Not you?' : 'Who are you?')}</div>`;
  if (!name) { box.innerHTML = head + `<p class="quiet">Choose your name to see this week’s brief and your contributions.</p>`; return; }
  if (!m || ['Inactive', 'Alumni'].includes(m.status)) { box.innerHTML = head + outsiderCard(m); return; }
  const part = club.participation || {}, week = (part.history || []).find(h => b && h.briefId === b.id) || { themed: 0, flexible: 0 };
  const req = club.settings || {}, need = n => Math.max(0, Number(n) || 0);
  const paused = m.status === 'Paused';
  box.innerHTML = head + `<div class="club-grid">
    <article class="club-card brief-card">${b ? `
      <p class="club-kicker">This week’s brief${weekRange(b) ? ` · ${escapeHTML(weekRange(b))}` : ''}</p>
      <h3>${escapeHTML(b.title || b.theme)}</h3>
      ${b.theme && b.title && b.theme !== b.title ? `<p class="brief-theme">${escapeHTML(b.theme)}</p>` : ''}
      <dl class="brief-facts">${[['Format', b.format], ['Length', b.length], ['Publish', b.window], ['CTA', b.cta]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>
      ${b.direction ? `<p class="brief-direction">${escapeHTML(b.direction.length > 220 ? b.direction.slice(0, 220).trim() + '…' : b.direction)}</p>` : ''}
      <div class="button-row">${paused ? '' : `<button class="button" type="button" data-action="club-submit" data-kind="themed">Submit your post</button>`}<button class="button secondary" type="button" data-action="club-brief">Read the full brief</button></div>`
      : `<p class="club-kicker">This week’s brief</p><h3>Coming soon</h3><p>The coordinators will post this week’s theme here. Meanwhile, pick an idea from the Idea Bank or join a casting call.</p>`}
    </article>
    <article class="club-card">
      <p class="club-kicker">My week</p>
      ${paused ? `<p class="standing standing-paused">Paused${m.requestUntil ? ` until ${escapeHTML(shortDate(m.requestUntil))}` : ''}</p><p>Your history is saved. Come back whenever you’re ready.</p><div class="button-row"><button class="button secondary" type="button" data-action="club-request" data-type="resume">I’m back</button></div>` : `
      <ul class="club-progress">
        ${need(req.requiredThemed) ? `<li class="${week.themed >= need(req.requiredThemed) ? 'done' : ''}"><span>${week.themed >= need(req.requiredThemed) ? '✓' : ''}</span>Themed post <em>${Math.min(week.themed, need(req.requiredThemed))} of ${need(req.requiredThemed)}</em></li>` : ''}
        ${need(req.requiredFlexible) ? `<li class="${week.flexible >= need(req.requiredFlexible) ? 'done' : ''}"><span>${week.flexible >= need(req.requiredFlexible) ? '✓' : ''}</span>Flexible contribution <em>${Math.min(week.flexible, need(req.requiredFlexible))} of ${need(req.requiredFlexible)}</em></li>` : ''}
      </ul>
      ${standingNote(part, m)}
      <div class="button-row"><button class="button secondary" type="button" data-action="club-submit" data-kind="flexible">Add a flexible contribution</button></div>`}
      ${m.request ? `<p class="quiet">Your “${escapeHTML(m.request.toLowerCase())}” request is with the coordinators.</p>` : paused ? '' : `<p class="quiet club-pause"><button class="text-button" type="button" data-action="club-request" data-type="pause">Need a break? Request a pause</button></p>`}
    </article>
    <article class="club-card">
      <p class="club-kicker">My contributions</p>
      ${(club.submissions || []).length ? `<ul class="club-subs">${club.submissions.slice(0, 5).map(subRow).join('')}</ul>` : '<p class="quiet">Nothing yet. Your published links show up here once you submit them.</p>'}
      ${part.weeksFinished ? `<p class="quiet">${plural(part.weeksMet, 'week')} met out of ${part.weeksFinished} since you joined.</p>` : ''}
    </article>
    <article class="club-card club-links">
      <p class="club-kicker">Around the Club</p>
      <a href="#casting"><span aria-hidden="true">📣</span><span><strong>Upcoming collaborations</strong>Reels looking for creators</span></a>
      <a href="#toolkit"><span aria-hidden="true">🧰</span><span><strong>Creator resources</strong>Footage, templates and guides</span></a>
      ${clubCircle() ? `<a href="${escapeHTML(clubCircle())}" target="_top"><span aria-hidden="true">🔒</span><span><strong>Creator Circle</strong>Our private channel in Disco</span></a>` : ''}
      <a href="#made"><span aria-hidden="true">🌟</span><span><strong>Community highlights</strong>What the Squad has published</span></a>
      ${publicUrl(content.squadChatUrl) ? `<a href="${escapeHTML(publicUrl(content.squadChatUrl))}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💬</span><span><strong>Squad group chat</strong>Our open Instagram chat</span></a>` : ''}
    </article>
  </div>${(club.upcoming || []).length ? `<p class="quiet club-next">Coming up: ${club.upcoming.map(u => `${escapeHTML(u.title || u.theme)} (${escapeHTML(weekRange(u))})`).join(' · ')}</p>` : ''}`;
}
function memberLine(m) {
  const bits = [m.status === 'Active' ? 'Creators Club member' : m.status === 'Needs Check-In' ? 'Creators Club member · check-in pending' : `Creators Club · ${m.status}`, m.market, m.joined ? `since ${shortDate(m.joined)}` : ''];
  return bits.filter(Boolean).join(' · ');
}
function standingNote(part, m) {
  const s = part && part.standing;
  if (m.status === 'Needs Check-In') return `<p class="standing standing-review">A coordinator will check in with you soon. If life got busy, that’s okay: just let us know.</p>`;
  if (s === 'Needs review') return `<p class="standing standing-review">You’ve missed a couple of weeks. A coordinator will check in, or request a pause if you need time away.</p>`;
  if (s === 'Reminder') return `<p class="standing standing-reminder">Friendly reminder: last week’s brief didn’t get a post. No stress, just share this week’s when you can.</p>`;
  return `<p class="standing standing-good">You’re on track. Thanks for showing up!</p>`;
}
function subRow(s) {
  const st = { Counted: 'counted', 'Needs changes': 'changes' }[s.status] || 'sent';
  return `<li><span class="sub-dot sub-${st}" aria-hidden="true"></span><span><strong>${escapeHTML(s.kind === 'themed' ? (s.briefTitle || 'Themed post') : 'Flexible contribution')}</strong>${escapeHTML(shortDate((s.submitted || '').slice(0, 10)))} · ${escapeHTML(s.status)}</span>${externalLink(s.url, 'View', 'text-button')}</li>`;
}
function outsiderCard(m) {
  const a = club.application;
  if (m) return `<div class="club-card club-outside"><h3>Welcome back anytime</h3><p>You’re listed as ${escapeHTML(m.status.toLowerCase())}. Your history is saved, and the Idea Bank, casting calls and resources are always open to you.</p><div class="button-row">${m.request ? `<p class="quiet">Your rejoin request is with the coordinators.</p>` : `<button class="button" type="button" data-action="club-request" data-type="rejoin">Ask to rejoin</button>`}</div></div>`;
  // Signed in with the creator password, so no "Apply to join" here: just where they stand.
  const line = !a ? 'You’re not on the Creators Club roster yet. Double-check the name you picked, or ask a coordinator to add you.'
    : { 'Submitted': 'Your application is in. A coordinator will review it soon.', 'Under Review': 'Your application is being reviewed. A coordinator will reach out in Disco.', 'Waitlisted': 'You’re on the waitlist. We’ll reach out as soon as a spot opens.', 'Declined': 'Your application wasn’t approved this round. Reach out to a coordinator anytime.', 'Approved': 'You’re approved! Your dashboard appears as soon as a coordinator adds you to the roster.' }[a.status] || '';
  return `<div class="club-card club-outside"><p class="club-kicker">${a ? `Application · ${escapeHTML(a.status)}` : 'Almost there'}</p><p>${escapeHTML(line)}</p><div class="button-row"><a class="button secondary" href="#casting">Casting calls</a><a class="button secondary" href="#toolkit">Toolkit</a></div></div>`;
}

/* ---------- Brief, submissions and requests ---------- */
function openClubAction(action, data) {
  if (action === 'club-brief') return openClubBrief();
  if (action === 'club-submit') return openClubSubmit(data.kind);
  if (action === 'club-request') return openClubRequest(data.type);
  if (action === 'coordinator') return openCoordinator();
}
function briefSections(b) {
  return [['Weekly theme', b.theme], ['Format', [b.format, b.length].filter(Boolean).join(' · ')], ['Creative direction', b.direction], ['Hooks & talking points', b.hooks], ['Deliverables', b.deliverables], ['Publishing window', b.window], ['Call to action', b.cta], ['Assets & resources', b.resources], ['Brand & product guidelines', b.guidelines]]
    .filter(x => x[1]).map(([k, v]) => `<section class="brief-part"><h3>${k}</h3><p>${richText(v)}</p></section>`).join('');
}
function openClubBrief() {
  const b = club && club.brief; if (!b) return;
  title.textContent = b.title || b.theme;
  body.innerHTML = `<p class="club-kicker">${escapeHTML(weekRange(b))} · Community brief</p>${briefSections(b)}
    <p class="flow-note">Same theme, your voice. Bring your own personality, product knowledge and perspective: nobody needs the same script.</p>
    <div class="button-row">${isMember(club.member) ? `<button class="button" type="button" data-action="club-submit" data-kind="themed">Submit your post</button>` : ''}${uploadButton('Upload clips instead', 'collab', b.title || b.theme)}</div>`;
  showModal();
}
function openClubSubmit(kind = 'themed') {
  const b = club && club.brief, name = clubName();
  title.textContent = 'Share your published post';
  if (!isMember(club && club.member)) { body.innerHTML = '<p>Submissions are for active Creators Club members. Choose your name on the dashboard first.</p>'; return showModal(); }
  const k = kind === 'flexible' || !b ? 'flexible' : 'themed';
  body.innerHTML = `<form id="club-submit-form" novalidate>
      <p>Paste the link once it’s live. It counts toward your week as soon as you send it.</p>
      <fieldset class="choices"><legend>What is it?</legend>
        ${b ? `<label class="check"><input type="radio" name="cs-kind" value="themed"${k === 'themed' ? ' checked' : ''}>Themed post for “${escapeHTML(b.title || b.theme)}”</label>` : ''}
        <label class="check"><input type="radio" name="cs-kind" value="flexible"${k === 'flexible' ? ' checked' : ''}>Flexible contribution: another post, a collab task or another approved deliverable</label>
      </fieldset>
      <label for="cs-url">Link to your published post</label>
      <input id="cs-url" type="url" inputmode="url" maxlength="500" placeholder="https://www.instagram.com/reel/…" required>
      <label for="cs-note">Anything the coordinators should know? (optional)</label>
      <textarea id="cs-note" maxlength="500" placeholder="For example: collab with Lora, or the edit I made for the Squad Reel."></textarea>
      <p class="quiet">Sending as ${escapeHTML(name)}.</p>
      <div class="form-actions"><button class="button" type="submit" id="cs-go">Send link</button>${uploadButton('Upload files instead', 'collab', b ? (b.title || b.theme) : '')}</div>
    </form>`;
  $('#club-submit-form').onsubmit = async ev => {
    ev.preventDefault();
    const url = document.getElementById('cs-url').value.trim(), kindVal = (document.querySelector('input[name="cs-kind"]:checked') || {}).value || 'flexible';
    if (!/^https:\/\/\S+$/.test(url)) { status.textContent = 'Paste the full link to your post. It starts with https://'; return document.getElementById('cs-url').focus(); }
    const go = document.getElementById('cs-go'); go.disabled = true; go.textContent = 'Sending…'; status.textContent = '';
    try {
      const res = await uploadRequest({ action: 'club-submit', name, kind: kindVal, briefId: kindVal === 'themed' && b ? b.id : '', url, note: document.getElementById('cs-note').value.trim() });
      if (!res.ok) throw new Error(res.error || '');
      body.innerHTML = `<p><strong>Thank you!</strong> Your ${kindVal === 'themed' ? 'post for this week' : 'contribution'} is in. Go cheer on a few other creators while you’re here.</p>`;
      loadClub();
    } catch (err) { status.textContent = err.message || 'That didn’t send. Try again in a minute.'; go.disabled = false; go.textContent = 'Send link'; }
  };
  showModal();
}
function openClubRequest(type) {
  const name = clubName(), copy = {
    pause: ['Request a pause', 'Take the time you need. Your history stays, and a coordinator will confirm.', true],
    resume: ['Back from your pause?', 'We’ll let the coordinators know you’re ready for the next brief.', false],
    rejoin: ['Ask to rejoin', 'A coordinator will review it and reach out in Disco.', false] }[type];
  if (!copy || !name) return;
  title.textContent = copy[0];
  body.innerHTML = `<form id="club-req-form" novalidate><p>${escapeHTML(copy[1])}</p>
    ${copy[2] ? `<label for="cr-until">Back around (optional)</label><input id="cr-until" type="date">` : ''}
    <label for="cr-note">Note for the coordinators (optional)</label><textarea id="cr-note" maxlength="500"></textarea>
    <div class="form-actions"><button class="button" type="submit" id="cr-go">Send request</button></div></form>`;
  $('#club-req-form').onsubmit = async ev => {
    ev.preventDefault(); const go = document.getElementById('cr-go'); go.disabled = true; status.textContent = '';
    try {
      const res = await uploadRequest({ action: 'club-request', name, type, until: copy[2] ? document.getElementById('cr-until').value : '', note: document.getElementById('cr-note').value.trim() });
      if (!res.ok) throw new Error(res.error || '');
      body.innerHTML = '<p><strong>Sent.</strong> A coordinator will take it from here.</p>'; loadClub();
    } catch (err) { status.textContent = err.message || 'That didn’t send. Try again in a minute.'; go.disabled = false; }
  };
  showModal();
}

/* ---------- Coordinator tools ----------
   Coordinators (Taylor, Sarah, Linden) sign in on the landing page with the coordinator password instead of
   the creator password. That signs them in as creators too, and the script checks it again for every coordinator action. */
const coordCode = () => storageGet(COORD_CODE_KEY) || '';
async function coordRequest(action, extra = {}) {
  const res = await uploadRequest({ action, coordKey: coordCode(), coordName: clubName() || 'Coordinator', ...extra });
  if (res && res.coordLocked) setCoordinator('');
  return res;
}
function openCoordinator() {
  modal.classList.toggle('coord', true);
  if (!coordCode()) return coordGone();
  title.textContent = 'Coordinator tools';
  if (!coord) body.innerHTML = '<p class="quiet">Loading…</p>';
  else renderCoord();
  showModal();
  refreshCoord();
}
async function refreshCoord(action = 'admin-data', extra = {}, done = '') {
  status.textContent = action === 'admin-data' ? '' : 'Saving…';
  try {
    const res = await coordRequest(action, extra);
    if (res.coordLocked) { status.textContent = ''; return coordGone(); }
    if (!res.ok) throw new Error(res.error || '');
    coord = res; if (title.textContent === 'Coordinator tools') renderCoord(); status.textContent = done;
    if (has('#club-dash')) loadClub();
    return res;
  } catch (err) { status.textContent = err.message || 'That didn’t save. Try again in a minute.'; }
}
// The coordinator password changed (or was never entered here): sign out and back in with the new one.
function coordGone() {
  title.textContent = 'Coordinator tools';
  body.innerHTML = `<p>Coordinator tools open when you sign in with the coordinator password. If it changed, sign out and sign back in with the new one.</p><div class="button-row"><button class="button" type="button" data-signout>Sign out</button></div>`;
  if (!modal.open) showModal();
}
const COORD_TABS = [['applications', 'Applications'], ['roster', 'Roster'], ['briefs', 'Weekly briefs'], ['content', 'Content'], ['participation', 'Participation'], ['analytics', 'Analytics'], ['settings', 'Settings']];
function renderCoord() {
  const c = coord; if (!c) return;
  const openApps = c.applications.filter(a => ['Submitted', 'Under Review'].includes(a.status)).length;
  const flags = c.participation.filter(p => p.standing === 'Needs review').length + c.members.filter(m => m.request).length;
  const badge = { applications: openApps, participation: flags };
  body.innerHTML = `<nav class="flow-nav coord-tabs" aria-label="Coordinator tools">${COORD_TABS.map(([id, label]) => `<button type="button" class="flow-tab${coordTab === id ? ' selected' : ''}" data-coord-tab="${id}"${coordTab === id ? ' aria-current="true"' : ''}>${label}${badge[id] ? ` <span class="nav-badge">${badge[id]}</span>` : ''}</button>`).join('')}</nav>
    <div class="coord-body">${({ applications: coordApps, roster: coordRoster, briefs: coordBriefs, content: coordContent, participation: coordParticipation, analytics: coordAnalytics, settings: coordSettings })[coordTab](c)}</div>`;
}
const selectHTML = (attr, list, value) => `<select ${attr}>${list.map(x => `<option${x === value ? ' selected' : ''}>${escapeHTML(x)}</option>`).join('')}</select>`;
function coordApps(c) {
  const filters = [['open', 'To review'], ['Waitlisted', 'Waitlisted'], ['Approved', 'Approved'], ['Declined', 'Declined'], ['all', 'All']];
  const list = c.applications.filter(a => coordFilter === 'all' ? true : coordFilter === 'open' ? ['Submitted', 'Under Review'].includes(a.status) : a.status === coordFilter);
  return `<div class="view-switch">${filters.map(([id, l]) => `<button type="button" aria-selected="${coordFilter === id}" data-coord-filter="${id}">${l}</button>`).join('')}</div>
    ${list.length ? list.map(a => `<form class="coord-card" data-coord-form="app" data-id="${escapeHTML(a.id)}">
      <div class="app-top"><strong>${escapeHTML(a.name)}</strong><span class="quiet">${escapeHTML([a.market || a.region, a.submitted ? 'applied ' + shortDate(a.submitted.slice(0, 10)) : ''].filter(Boolean).join(' · '))}</span></div>
      <dl class="coord-facts">${[['Roles', a.roles], ['Interests', a.interests], ['Experience', a.experience], ['On camera', a.camera], ['Capacity', a.capacity], ['Why', a.why]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>
      <div class="trk-links">${instagramLink(a.instagram)}${externalLink(a.example, 'Their work', 'text-button')}</div>
      <div class="coord-row"><label>Status ${selectHTML('name="status"', ['Submitted', 'Under Review', 'Approved', 'Waitlisted', 'Declined'], a.status)}</label><label class="grow">Notes (coordinators only)<input name="notes" type="text" maxlength="1000" value="${escapeHTML(a.notes || '')}"></label><button class="button" type="submit">Save</button></div>
      ${a.reviewedBy ? `<p class="quiet">Last reviewed by ${escapeHTML(a.reviewedBy)}</p>` : ''}
    </form>`).join('') : '<p class="quiet">Nothing here right now.</p>'}
    <p class="quiet">Approving adds the person to the roster as Active. Follower count is never a factor.</p>`;
}
function coordRoster(c) {
  const part = n => c.participation.find(p => p.name === n) || {};
  const seed = squadNames().filter(n => !c.members.some(m => m.name.toLowerCase() === n.toLowerCase()));
  return `${seed.length ? `<div class="flow-note"><strong>${c.members.length ? 'Add the rest of the current Squad?' : 'Start the roster'}</strong><p>${escapeHTML(seed.join(', '))} ${seed.length === 1 ? 'isn’t' : 'aren’t'} on the roster yet. Add them as Active founding members?</p><button class="button" type="button" data-coord-seed>Add ${plural(seed.length, 'founding member')}</button></div>` : ''}
    ${c.members.map(m => `<form class="coord-card" data-coord-form="member" data-name="${escapeHTML(m.name)}">
      <div class="app-top"><strong>${escapeHTML(m.name)}</strong><span class="stage ${standingClass(part(m.name).standing)}">${escapeHTML(part(m.name).standing || m.status)}</span></div>
      <p class="quiet">${escapeHTML([m.market, m.roles, m.joined ? 'joined ' + shortDate(m.joined) : ''].filter(Boolean).join(' · '))}</p>
      ${m.request ? `<p class="coord-request"><strong>${escapeHTML(m.request)} requested</strong>${m.requestUntil ? ` until ${escapeHTML(shortDate(m.requestUntil))}` : ''}${m.requestNote ? `: “${escapeHTML(m.requestNote)}”` : ''} <button class="text-button" type="button" data-coord-request="${escapeHTML(m.name)}" data-to="${m.request === 'Pause' ? 'Paused' : 'Active'}">${m.request === 'Pause' ? 'Approve pause' : 'Set Active'}</button><button class="text-button" type="button" data-coord-request="${escapeHTML(m.name)}" data-to="">Dismiss</button></p>` : ''}
      <div class="coord-row"><label>Status ${selectHTML('name="status"', ['Active', 'Paused', 'Needs Check-In', 'Inactive', 'Alumni'], m.status)}</label><label class="grow">Notes (coordinators only)<input name="notes" type="text" maxlength="1000" value="${escapeHTML(m.notes || '')}"></label><button class="button" type="submit">Save</button></div>
    </form>`).join('') || '<p class="quiet">No members yet.</p>'}
    <form class="coord-card coord-add" data-coord-form="member-new"><label class="grow">Add someone to the roster<input name="name" type="text" maxlength="80" placeholder="Name as it appears in Disco" required></label><button class="button secondary" type="submit">Add</button></form>
    <p class="quiet">Nobody is removed automatically. Inactive members and alumni keep their history and the open Social & Sharing resources.</p>`;
}
const standingClass = s => ({ 'On track': 'stage-published', 'Reminder': 'stage-filming', 'Needs review': 'stage-casting stage-alert', 'Paused': 'stage-idea' })[s] || 'stage-idea';
const BRIEF_FIELDS = [['title', 'Campaign title', 'text'], ['theme', 'Weekly theme', 'text'], ['weekStart', 'Week starts', 'date'], ['weekEnd', 'Week ends', 'date'], ['format', 'Format', 'text', 'Instagram Reel'], ['length', 'Length', 'text', 'About 15–30 seconds'], ['window', 'Publishing window', 'text', 'Wednesday–Friday'], ['cta', 'Call to action', 'text', 'Explore the free Baby Concierge service'], ['direction', 'Creative direction', 'textarea'], ['hooks', 'Suggested hooks or talking points', 'textarea'], ['deliverables', 'Deliverables', 'textarea'], ['resources', 'Assets & resources (links welcome)', 'textarea'], ['guidelines', 'Brand or product guidelines', 'textarea']];
function coordBriefs(c) {
  if (briefDraft) {
    const b = briefDraft;
    return `<form class="coord-card brief-editor" data-coord-form="brief"><h3>${b.id ? 'Edit brief' : 'New brief'}</h3>
      <div class="brief-fields">${BRIEF_FIELDS.map(([k, label, type, ph]) => `<label class="${type === 'textarea' ? 'wide' : ''}">${label}${type === 'textarea' ? `<textarea name="${k}" maxlength="3000">${escapeHTML(b[k] || '')}</textarea>` : `<input name="${k}" type="${type}" maxlength="300" value="${escapeHTML(b[k] || '')}"${ph ? ` placeholder="${escapeHTML(ph)}"` : ''}>`}</label>`).join('')}</div>
      <p class="quiet">Same strategy, room for each creator’s voice: give direction, not a script.</p>
      <div class="form-actions"><button class="button" type="submit">Save draft</button><button class="button secondary" type="button" data-coord-cancel>Cancel</button></div></form>`;
  }
  return `<div class="button-row"><button class="button" type="button" data-coord-new-brief>New brief</button></div>
    ${c.briefs.length ? `<ul class="coord-list">${c.briefs.map(b => `<li class="coord-card"><div class="app-top"><strong>${escapeHTML(b.title || b.theme || 'Untitled')}</strong><span class="stage ${b.status === 'Published' ? 'stage-published' : b.status === 'Draft' ? 'stage-filming' : 'stage-idea'}">${b.id === c.current ? 'This week' : escapeHTML(b.status)}</span></div>
      <p class="quiet">${escapeHTML([weekRange(b) || 'No dates yet', b.format, b.updatedBy ? 'updated by ' + b.updatedBy : ''].filter(Boolean).join(' · '))}</p>
      <div class="trk-links"><button class="text-button" type="button" data-coord-edit="${escapeHTML(b.id)}">Edit</button><button class="text-button" type="button" data-coord-brief="duplicate" data-id="${escapeHTML(b.id)}">Duplicate for next week</button>${b.status === 'Published' ? `<button class="text-button" type="button" data-coord-brief="unpublish" data-id="${escapeHTML(b.id)}">Unpublish</button>` : `<button class="text-button" type="button" data-coord-brief="publish" data-id="${escapeHTML(b.id)}">Publish</button>`}${b.status !== 'Archived' ? `<button class="text-button" type="button" data-coord-brief="archive" data-id="${escapeHTML(b.id)}">Archive</button>` : ''}</div></li>`).join('')}</ul>`
      : emptyState('No briefs yet.', 'Create the first weekly brief. It stays a draft until you publish it.', '', ICON.spark)}
    <p class="quiet">You can also edit briefs right in the “Creators Club program” sheet in the shared drive.</p>`;
}
function coordContent(c) {
  return c.submissions.length ? `<ul class="coord-list">${c.submissions.map(s => `<li class="coord-card coord-sub"><div class="app-top"><strong>${escapeHTML(s.name)}</strong><span class="quiet">${escapeHTML(shortDate(s.submitted.slice(0, 10)))}</span></div>
      <p>${escapeHTML(s.kind === 'themed' ? 'Themed: ' + (s.briefTitle || 'brief') : 'Flexible contribution')}${s.note ? ` · “${escapeHTML(s.note)}”` : ''}</p>
      <div class="coord-row">${externalLink(s.url, 'Open the post', 'text-button')}<label>Status ${selectHTML(`data-coord-sub="${escapeHTML(s.id)}"`, ['Submitted', 'Counted', 'Needs changes'], s.status)}</label></div></li>`).join('')}</ul>`
    : emptyState('No submissions yet.', 'Published links from creators show up here.', '', ICON.play);
}
function coordParticipation(c) {
  const order = { 'Needs review': 0, 'Reminder': 1, 'On track': 2, 'Paused': 3 };
  const rows = c.participation.slice().sort((a, b) => (order[a.standing] ?? 4) - (order[b.standing] ?? 4));
  return `<p class="quiet">Suggestions only: nothing changes until you update someone on the Roster tab. ${c.settings.reminderAfter ? `Reminder after ${plural(c.settings.reminderAfter, 'missed week')}` : ''}${c.settings.reviewAfter ? `, review after ${c.settings.reviewAfter} in a row.` : '.'}</p>
    ${rows.length ? `<ul class="coord-list">${rows.map(p => `<li class="coord-card"><div class="app-top"><strong>${escapeHTML(p.name)}</strong><span class="stage ${standingClass(p.standing)}">${escapeHTML(p.standing)}</span></div>
      <p class="quiet">${p.weeksFinished ? `${p.weeksMet} of ${plural(p.weeksFinished, 'week')} met` : 'No finished weeks yet'}${p.missedInARow ? ` · missed ${p.missedInARow} in a row` : ''}</p>
      ${p.history.length ? `<p class="week-dots">${p.history.slice().reverse().map(h => `<span class="${!h.finished ? 'now' : h.met ? 'met' : 'miss'}" title="${escapeHTML((h.title || '') + ': ' + (h.finished ? (h.met ? 'met' : 'missed') : 'this week'))}">${!h.finished ? '…' : h.met ? '✓' : '·'}</span>`).join('')}</p>` : ''}
      ${p.standing === 'Needs review' && p.status !== 'Needs Check-In' ? `<button class="text-button" type="button" data-coord-request="${escapeHTML(p.name)}" data-to="Needs Check-In" data-keep>Mark “Needs Check-In”</button>` : ''}</li>`).join('')}</ul>` : '<p class="quiet">Add members on the Roster tab to start tracking.</p>'}`;
}
function coordAnalytics(c) {
  const a = c.analytics, tile = (n, label, note = '') => `<div class="stat-tile"><strong>${n}</strong><span>${label}</span>${note ? `<em>${note}</em>` : ''}</div>`;
  return `<div class="stat-grid">
    ${tile(a.activeCreators, 'Active creators')}
    ${a.lastWeek ? tile(a.lastWeek.rate == null ? '—' : a.lastWeek.rate + '%', 'Participation last week', `${a.lastWeek.met} of ${a.lastWeek.eligible} · ${escapeHTML(a.lastWeek.title || '')}`) : tile('—', 'Participation last week', 'No finished brief weeks yet')}
    ${a.thisWeek ? tile(a.thisWeek.themedPosts, 'Themed posts this week', `${plural(a.thisWeek.creatorsPosted, 'creator')} so far`) : tile('—', 'Themed posts this week', 'No published brief')}
    ${tile(a.publishedLinks, 'Published links shared')}
    ${tile(a.repeatCreators, 'Repeat creators', 'Met 2+ weeks')}
    ${tile(publishedProjects().length, 'Squad Reels published', 'From Made by the Squad')}
    ${tile(a.weeksRun, 'Brief weeks run')}
  </div>
  <p class="flow-note"><strong>Reach and engagement aren’t tracked yet.</strong> They need a verified source (like Instagram insights shared by each creator). Until then, nothing here estimates or invents them.</p>`;
}
function coordSettings(c) {
  const s = c.settings, num = (k, label) => `<label>${label}<input name="${k}" type="number" min="0" max="20" value="${escapeHTML(String(s[k]))}"></label>`;
  return `<form class="coord-card" data-coord-form="settings"><h3>Weekly commitment</h3><p class="quiet">Proposed pilot defaults. Adjust them before launch; changes apply right away.</p>
    <div class="brief-fields">${num('requiredThemed', 'Themed posts each week')}${num('requiredFlexible', 'Flexible contributions each week')}${num('reminderAfter', 'Missed weeks before a friendly reminder')}${num('reviewAfter', 'Missed weeks in a row before coordinator review')}
    <label class="wide">Creator Circle link<input name="creatorCircleUrl" type="url" value="${escapeHTML(s.creatorCircleUrl || content.creatorCircleUrl || '')}" placeholder="https://tot-squad-hub.disco.co/channel/…"></label></div>
    <div class="form-actions"><button class="button" type="submit">Save settings</button></div></form>
    <div class="flow-note"><strong>Coming later: brand partnerships.</strong><p>Briefs are all voluntary community content today. Sponsored campaigns, paid UGC, licensing and compensation would be a separate brief type with its own consent and disclosure steps, and aren’t live.</p></div>
`;
}
const formData = f => Object.fromEntries([...f.querySelectorAll('input[name],select[name],textarea[name]')].map(el => [el.name, el.value.trim()]));
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches && t.matches('[data-club-name]')) { storageSet(UPLOAD_NAME_KEY, t.value); club = null; loadClub(); return; }
    if (t.matches && t.matches('[data-coord-sub]')) refreshCoord('admin-sub', { id: t.dataset.coordSub, status: t.value }, 'Saved.');
  });
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-coord-tab],[data-coord-filter],[data-coord-seed],[data-coord-request],[data-coord-new-brief],[data-coord-edit],[data-coord-brief],[data-coord-cancel]');
    if (!t || !coord) return;
    const d = t.dataset;
    if (d.coordTab) { coordTab = d.coordTab; briefDraft = null; status.textContent = ''; renderCoord(); return; }
    if (d.coordFilter) { coordFilter = d.coordFilter; renderCoord(); return; }
    if ('coordSeed' in d) { const people = [content.leader, ...(content.featuredSpecialists || [])].filter(p => p && p.name).map(p => ({ name: p.name, market: p.region || '', instagram: p.instagram || '' })); refreshCoord('admin-seed', { members: people }, 'Roster updated.'); return; }
    if ('coordRequest' in d) { refreshCoord('admin-member', { name: d.coordRequest, ...(d.to ? { status: d.to } : {}), ...('keep' in d ? {} : { clearRequest: true }) }, 'Saved.'); return; }
    if ('coordNewBrief' in d) { briefDraft = {}; renderCoord(); return; }
    if (d.coordEdit) { briefDraft = { ...(coord.briefs.find(b => b.id === d.coordEdit) || {}) }; renderCoord(); return; }
    if ('coordCancel' in d) { briefDraft = null; renderCoord(); return; }
    if (d.coordBrief) { refreshCoord('admin-brief', { op: d.coordBrief, brief: { id: d.id } }, { duplicate: 'Copied as a draft for the next week.', publish: 'Published. Creators see it now.', unpublish: 'Back to draft.', archive: 'Archived.' }[d.coordBrief]); return; }
  });
  document.addEventListener('submit', async e => {
    const f = e.target.closest && e.target.closest('[data-coord-form]'); if (!f) return;
    e.preventDefault(); const v = formData(f), kind = f.dataset.coordForm;
    if (kind === 'app') refreshCoord('admin-app', { id: f.dataset.id, status: v.status, notes: v.notes }, v.status === 'Approved' ? 'Approved and added to the roster.' : 'Saved.');
    if (kind === 'member') refreshCoord('admin-member', { name: f.dataset.name, status: v.status, notes: v.notes }, 'Saved.');
    if (kind === 'member-new') refreshCoord('admin-member', { name: v.name, status: 'Active' }, 'Added.');
    if (kind === 'settings') refreshCoord('admin-settings', { settings: v }, 'Settings saved.');
    if (kind === 'brief') { const res = await refreshCoord('admin-brief', { op: 'save', brief: { ...v, id: briefDraft && briefDraft.id || '' } }, 'Saved as a draft. Publish it from the list when it’s ready.'); if (res) { briefDraft = null; renderCoord(); } }
  });
}
if (typeof modal !== 'undefined' && modal.addEventListener) modal.addEventListener('close', () => modal.classList.toggle('coord', false));
if (has('#club-dash')) loadClub();
