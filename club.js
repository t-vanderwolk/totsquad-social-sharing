/* Creators Club 2.0 in the app: the member dashboard, briefs (every other week), logged posts and stories, pause requests
   and coordinator tools. Loaded after script.js on the landing page; uses its helpers ($, body, showModal…).
   Data comes from apps-script/club.gs through the same web app (content.uploadEndpoint). Creators sign in with
   their own name and password (script.js), so the dashboard is theirs; coordinators sign in with the coordinator
   password, pick their name here, and the script checks the code for every coordinator action. */
let club = null, clubBusy = false, coord = null, coordTab = 'applications', coordFilter = 'open', briefDraft = null, briefView = null;

const clubName = () => storageGet(UPLOAD_NAME_KEY) || '';
const firstName = n => String(n || '').split(/\s+/)[0];
const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
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
// Roster names win: a placeholder first name ("Taylor") drops out once the roster has someone's full name ("Taylor Vanderwolk").
function clubNames() {
  const roster = (club && club.roster) || [], first = n => String(n).trim().split(/\s+/)[0];
  const placeholder = n => !/\s/.test(String(n).trim()) && roster.some(r => /\s/.test(String(r).trim()) && sameName(first(r), n) && squadClaims.some(c => sameName(c.claimed, n)));
  return [...new Set([...squadNames(), ...roster])].filter(n => !placeholder(n)).sort();
}
function namePickerHTML(id, label) {
  if (typeof isAccount === 'function' && isAccount()) return `<p class="club-who"><span>Signed in as</span><button type="button" class="text-button" data-action="profile">${escapeHTML(clubName())}</button></p>`;
  const saved = clubName();
  return `<label class="club-who" for="${id}"><span>${escapeHTML(label)}</span><select id="${id}" data-club-name><option value="">Choose your name</option>${clubNames().map(n => `<option${n === saved ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select></label>`;
}
function renderDashboard() {
  if (!has('#club-dash')) return; const box = $('#club-dash');
  if (!club) { box.innerHTML = `<p class="quiet">${clubBusy ? 'Loading your Creators Club…' : ''}</p>`; return; }
  if (!club.ok) { box.innerHTML = '<p class="quiet">Your Creators Club dashboard couldn’t load right now. Try again in a minute.</p>'; return; }
  const name = clubName(), m = club.member, b = club.brief;
  const quick = `<div class="club-quick" role="group" aria-label="Quick actions"><button class="button" type="button" data-action="pitch">Pitch an idea</button><button class="button secondary" type="button" data-action="call-new">Post a casting call</button>${UPLOAD_ON() ? '<button class="button secondary" type="button" data-action="upload" data-dest="collab">Upload clips</button>' : ''}</div>`;
  const head = `<div class="club-head"><div><h2 id="dash-title">${name ? `Hi, ${escapeHTML(firstName(name))}!` : 'Your Creators Club'}</h2><p>${m ? escapeHTML(memberLine(m)) : 'Your brief, casting calls, ideas and standing, all in one place.'}</p></div>${namePickerHTML('club-name', name ? 'Not you?' : 'Who are you?')}</div>${name ? quick : ''}`;
  if (!name) { box.innerHTML = head + `<p class="quiet">Choose your name to see the current brief and your commitments.</p>`; return; }
  if (!m || ['Inactive', 'Alumni'].includes(m.status)) { box.innerHTML = head + outsiderCard(m) + `<div class="club-stack">${castingCard()}${myIdeasCard()}</div>`; return; }
  const part = club.participation || {}, week = part.thisWeek || { stories: 0 }, month = part.thisMonth || { posts: 0 };
  const req = club.settings || {}, need = n => Math.max(0, Number(n) || 0);
  const paused = m.status === 'Paused';
  box.innerHTML = head + `<div class="club-grid"><div class="club-main">
    <article class="club-card brief-card">${b ? `
      <p class="club-kicker">Current brief${weekRange(b) ? ` · ${escapeHTML(weekRange(b))}` : ''}</p>
      <h3>${escapeHTML(b.title || b.theme)}</h3>
      ${b.theme && b.title && b.theme !== b.title ? `<p class="brief-theme">${escapeHTML(b.theme)}</p>` : ''}
      <dl class="brief-facts">${[['Format', b.format], ['Length', b.length], ['Publish', b.window], ['CTA', b.cta]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>
      ${b.direction ? `<p class="brief-direction">${escapeHTML(b.direction.length > 220 ? b.direction.slice(0, 220).trim() + '…' : b.direction)}</p>` : ''}
      <div class="button-row"><button class="button" type="button" data-action="club-brief">Read the full brief</button></div>`
      : `<p class="club-kicker">Brief</p><h3>Coming soon</h3><p>A new brief with trending audios, hooks and ideas lands here every other week. Meanwhile, pick an idea from the Idea Bank or join a casting call.</p>`}
    </article>
    ${castingCard()}
    ${myIdeasCard()}
    </div><div class="club-side">
    <article class="club-card club-commit">
      <p class="club-kicker">My commitments</p>
      ${paused ? `<p class="standing standing-paused">Paused${m.requestUntil ? ` until ${escapeHTML(shortDate(m.requestUntil))}` : ''}</p><p>Your history is saved. Come back whenever you’re ready.</p><div class="button-row"><button class="button secondary" type="button" data-action="club-request" data-type="resume">I’m back</button></div>` : `
      <ul class="club-progress">
        ${need(req.requiredPosts) ? progressItem(month.posts, need(req.requiredPosts), 'Feed post this month', 'reel, carousel or collab') : ''}
        ${need(req.requiredStories) ? progressItem(week.stories, need(req.requiredStories), 'Story this week', 'Monday to Sunday') : ''}
      </ul>
      ${standingNote(part, m)}
      <div class="button-row"><button class="button" type="button" data-action="club-submit" data-kind="post">Log a feed post</button><button class="button secondary" type="button" data-action="club-submit" data-kind="story">Log a story</button></div>`}
      ${m.request ? `<p class="quiet">Your “${escapeHTML(m.request.toLowerCase())}” request is with the coordinators.</p>` : paused ? '' : `<p class="quiet club-pause"><button class="text-button" type="button" data-action="club-request" data-type="pause">Need a break? Request a pause</button></p>`}
    </article>
    <article class="club-card club-contrib">
      <p class="club-kicker">My contributions</p>
      ${(club.submissions || []).length ? `<ul class="club-subs">${club.submissions.slice(0, 5).map(subRow).join('')}</ul>` : '<p class="quiet">Nothing yet. Your published links show up here once you submit them.</p>'}
      ${part.weeksFinished || part.monthsFinished ? `<p class="quiet">${[part.monthsFinished ? `Feed posts: ${part.monthsMet} of ${plural(part.monthsFinished, 'month')}` : '', part.weeksFinished ? `stories: ${part.weeksMet} of ${plural(part.weeksFinished, 'week')}` : ''].filter(Boolean).join(' · ')} since you joined.</p>` : ''}
      <p class="quiet"><button class="text-button" type="button" data-action="guidelines">Read the Creators Club guidelines</button></p>
    </article>
    <article class="club-card club-links">
      <p class="club-kicker">Around the Club</p>
      <a href="${escapeHTML(pageUrl('ideas.html'))}" data-tool-page="ideas.html" data-label="Idea Bank"><span aria-hidden="true">💡</span><span><strong>Idea Bank</strong>Every Squad idea, ready to lead or build on</span></a>
      <a href="#toolkit"><span aria-hidden="true">🧰</span><span><strong>Creator resources</strong>Footage, templates and guides</span></a>
      ${clubCircle() ? `<a href="${escapeHTML(clubCircle())}" target="_top"><span aria-hidden="true">🔒</span><span><strong>Creator Circle</strong>Our private channel in Disco</span></a>` : ''}
      ${publicUrl(content.squadChatUrl) ? `<a href="${escapeHTML(publicUrl(content.squadChatUrl))}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💬</span><span><strong>Squad group chat</strong>Our open Instagram chat</span></a>` : ''}
      <button type="button" data-action="profile"><span aria-hidden="true">🙋</span><span><strong>Edit my bio</strong>How the Squad sees you</span></button>
    </article>
  </div></div>${(club.upcoming || []).length ? `<p class="quiet club-next">Coming up: ${club.upcoming.map(u => `${escapeHTML(u.title || u.theme)} (${escapeHTML(weekRange(u))})`).join(' · ')}</p>` : ''}`;
}
// Casting calls for you: every open call (the Squad's and those creators posted), with its action right here.
function castingCard() {
  if (typeof castingProjects !== 'function') return '';
  const list = castingProjects();
  const row = p => `<li class="cast-row"><div><span class="cast-who">${whoLabel(p)}</span><strong>${escapeHTML(p.title)}</strong>
      <span class="quiet">${escapeHTML([p.lead ? `${p.posted ? 'Posted' : 'Led'} by ${p.lead}` : '', dateValid(p.submissionDeadline) ? 'Due ' + shortDate(p.submissionDeadline) : ''].filter(Boolean).join(' · '))}</span>
      ${p.instructions ? `<span class="cast-what">${escapeHTML(p.instructions)}</span>` : ''}</div>
    <div class="cast-acts">${p.openCall && UPLOAD_ON() ? `<button class="button" type="button" data-action="cast" data-project="${escapeHTML(p.id)}">${(p.openCall.questions || []).length ? 'Film &amp; answer' : 'Send your video'}</button>` : `<button class="button" type="button" data-action="collab" data-project="${escapeHTML(p.id)}">I’m interested</button>`}${p.posted && p.call.mine ? `<button class="text-button" type="button" data-action="call-edit" data-call="${escapeHTML(p.id)}">Edit</button>` : ''}</div></li>`;
  return `<article class="club-card club-casting" id="dash-casting">
    <div class="card-head"><p class="club-kicker">Casting calls${list.length ? ` <span class="count">${list.length}</span>` : ''}</p><button class="text-button" type="button" data-action="call-new">Post a casting call</button></div>
    ${list.length ? `<ul class="cast-list">${list.map(row).join('')}</ul>` : '<p class="quiet">No calls are open right now. Post one to find creators for your idea.</p>'}
  </article>`;
}
// My ideas on the dashboard: your ideas by stage and your casting calls, with the full list one tap away (script.js).
function myIdeasCard() {
  if (typeof isMine !== 'function') return '';
  const mine = ideas().filter(isMine), calls = myCalls().filter(c => c.status !== 'closed' && c.open !== false);
  const waiting = calls.filter(c => c.audience === 'public' && c.review === 'waiting').length, responses = calls.reduce((n, c) => n + (c.responses || 0), 0);
  return `<article class="club-card club-ideas" id="dash-ideas">
    <div class="club-ideas-head"><div><p class="club-kicker">My ideas</p><h3>${mine.length ? plural(mine.length, 'idea') : 'Your ideas live here'}</h3>
      <p>${mine.length ? 'Credited to you or led by you, from first spark to published Reel.' : liveIdeas ? 'Pitch an idea, or take the lead on one in the Idea Bank, and it shows up here.' : 'Loading your ideas…'}</p></div>
      <div class="button-row"><button class="button secondary" type="button" data-action="my-ideas">Open My ideas</button></div></div>
    <ol class="stage-track" aria-label="Your ideas by stage">${STAGE_ORDER.map(st => `<li class="stage-step stage-step-${st}"><b>${mine.filter(i => stageKey(i.stage) === st).length}</b><span>${STAGES[st]}</span></li>`).join('')}</ol>
    <p class="quiet">${calls.length ? `You have ${plural(calls.length, 'casting call')} open${waiting ? `, ${waiting} waiting for public approval` : ''} · ${plural(responses, 'response')} so far.` : 'You have no casting calls open. Post one to find creators for your idea.'}</p>
  </article>`;
}
function memberLine(m) {
  const bits = [m.status === 'Active' ? 'Creators Club member' : m.status === 'Needs Check-In' ? 'Creators Club member · check-in pending' : `Creators Club · ${m.status}`, m.market, m.joined ? `since ${shortDate(m.joined)}` : ''];
  return bits.filter(Boolean).join(' · ');
}
function progressItem(n, need, label, hint) {
  const done = n >= need;
  return `<li class="${done ? 'done' : ''}"><span>${done ? '✓' : ''}</span><div>${escapeHTML(label)}<small>${escapeHTML(hint)}</small></div><em>${Math.min(n, need)} of ${need}</em></li>`;
}
function standingNote(part, m) {
  const s = part && part.standing;
  if (m.status === 'Needs Check-In') return `<p class="standing standing-review">A coordinator will check in with you soon. If life got busy, that’s okay: just let us know.</p>`;
  if (s === 'Needs review') return `<p class="standing standing-review">It’s been a while since your last ${part.missedMonths >= part.missedWeeks / 4 && part.missedMonths ? 'feed post' : 'story'}. A coordinator will check in, or request a pause if you need time away.</p>`;
  if (s === 'Reminder') return `<p class="standing standing-reminder">Friendly reminder: ${part.missedMonths ? 'last month didn’t get a feed post' : `no story for ${plural(part.missedWeeks, 'week')}`}. No stress: consistency, not perfection.</p>`;
  return `<p class="standing standing-good">You’re on track. Thanks for showing up!</p>`;
}
const subLabel = s => s.kind === 'story' ? 'Story' : s.briefTitle ? `Feed post · ${s.briefTitle}` : 'Feed post';
function subRow(s) {
  const st = { Counted: 'counted', 'Needs changes': 'changes' }[s.status] || 'sent';
  return `<li><span class="sub-dot sub-${st}" aria-hidden="true"></span><span><strong>${escapeHTML(subLabel(s))}</strong>${escapeHTML(shortDate(s.date || (s.submitted || '').slice(0, 10)))} · ${escapeHTML(s.status)}</span>${externalLink(s.url, 'View', 'text-button')}</li>`;
}
function outsiderCard(m) {
  const a = club.application;
  if (m) return `<div class="club-card club-outside"><h3>Welcome back anytime</h3><p>You’re listed as ${escapeHTML(m.status.toLowerCase())}. Your history is saved, and the Idea Bank, casting calls and resources are always open to you.</p><div class="button-row">${m.request ? `<p class="quiet">Your rejoin request is with the coordinators.</p>` : `<button class="button" type="button" data-action="club-request" data-type="rejoin">Ask to rejoin</button>`}</div></div>`;
  // Signed in with the creator password, so no "Apply to join" here: just where they stand.
  if (!a) return ''; // not on the roster and no application: nothing to nag about
  const line = !a ? ''
    : { 'Submitted': 'Your application is in. A coordinator will review it soon.', 'Under Review': 'Your application is being reviewed. A coordinator will reach out in Disco.', 'Waitlisted': 'You’re on the waitlist. We’ll reach out as soon as a spot opens.', 'Declined': 'Your application wasn’t approved this round. Reach out to a coordinator anytime.', 'Approved': 'You’re approved! Your dashboard appears as soon as a coordinator adds you to the roster.' }[a.status] || '';
  return `<div class="club-card club-outside"><p class="club-kicker">${a ? `Application · ${escapeHTML(a.status)}` : 'Almost there'}</p><p>${escapeHTML(line)}</p><div class="button-row"><a class="button secondary" href="#dash-casting">Casting calls</a><a class="button secondary" href="#toolkit">Toolkit</a></div></div>`;
}

/* ---------- Brief, submissions and requests ---------- */
function openClubAction(action, data) {
  if (action === 'club-brief') return openClubBrief();
  if (action === 'club-submit') return openClubSubmit(data.kind, !!data.brief);
  if (action === 'club-request') return openClubRequest(data.type);
  if (action === 'coordinator') return openCoordinator();
}
function briefSections(b) {
  return [['Theme', b.theme], ['Trending audios', b.audios], ['Hooks & talking points', b.hooks], ['Creative direction', b.direction], ['Upcoming launches', b.launches], ['Format', [b.format, b.length].filter(Boolean).join(' · ')], ['Deliverables', b.deliverables], ['Publishing window', b.window], ['Call to action', b.cta], ['Assets & resources', b.resources], ['Brand & product guidelines', b.guidelines]]
    .filter(x => x[1]).map(([k, v]) => `<section class="brief-part"><h3>${k}</h3><p>${richText(v)}</p></section>`).join('');
}
function openClubBrief() {
  const b = club && club.brief; if (!b) return;
  title.textContent = b.title || b.theme;
  body.innerHTML = `<p class="club-kicker">${escapeHTML(weekRange(b))} · Brief</p>${briefSections(b)}
    <p class="flow-note">For inspiration: use any hooks, ideas, templates or B-roll shared with the group, in your own voice. Post it as your feed post for the month if it fits.</p>
    <div class="button-row">${isMember(club.member) ? `<button class="button" type="button" data-action="club-submit" data-kind="post" data-brief="1">Log a feed post</button>` : ''}${uploadButton('Upload clips', 'collab', b.title || b.theme, 'button secondary')}</div>`;
  showModal();
}
// Log a feed post (the link is required) or a story (stories disappear after a day, so the link is optional).
function openClubSubmit(kind = 'post', fromBrief = false) {
  const b = club && club.brief, name = clubName(), k = kind === 'story' ? 'story' : 'post', today = new Date().toLocaleDateString('en-CA');
  title.textContent = k === 'story' ? 'Log a story' : 'Log a feed post';
  if (!isMember(club && club.member)) { body.innerHTML = '<p>Logging posts is for active Creators Club members.</p>'; return showModal(); }
  body.innerHTML = `<form id="club-submit-form" novalidate>
      <fieldset class="choices"><legend>What did you share?</legend>
        <label class="check"><input type="radio" name="cs-kind" value="post"${k === 'post' ? ' checked' : ''}>A feed post: a reel, carousel or collab post</label>
        <label class="check"><input type="radio" name="cs-kind" value="story"${k === 'story' ? ' checked' : ''}>An Instagram story</label>
      </fieldset>
      <label for="cs-date">When did it go up?</label>
      <input id="cs-date" type="date" max="${today}" value="${today}">
      <label for="cs-url" id="cs-url-label">${k === 'story' ? 'Link to the story (optional)' : 'Link to your post'}</label>
      <input id="cs-url" type="url" inputmode="url" maxlength="500" placeholder="https://www.instagram.com/${k === 'story' ? 'stories' : 'reel'}/…">
      ${b ? `<label class="check" id="cs-brief-row"${k === 'story' ? ' hidden' : ''}><input type="checkbox" id="cs-brief"${fromBrief ? ' checked' : ''}>It’s for the brief “${escapeHTML(b.title || b.theme)}”</label>` : ''}
      <label for="cs-note">Anything the coordinators should know? (optional)</label>
      <textarea id="cs-note" maxlength="500" placeholder="For example: collab with Lora, or a story about car seat checks."></textarea>
      <p class="quiet">Logging as ${escapeHTML(name)}. It counts as soon as you send it.</p>
      <div class="form-actions"><button class="button" type="submit" id="cs-go">Log it</button></div>
    </form>`;
  const kindNow = () => (document.querySelector('input[name="cs-kind"]:checked') || {}).value || 'post';
  document.querySelectorAll('input[name="cs-kind"]').forEach(r => { r.onchange = () => {
    const story = kindNow() === 'story'; title.textContent = story ? 'Log a story' : 'Log a feed post';
    document.getElementById('cs-url-label').textContent = story ? 'Link to the story (optional)' : 'Link to your post';
    document.getElementById('cs-url').placeholder = `https://www.instagram.com/${story ? 'stories' : 'reel'}/…`;
    const row = document.getElementById('cs-brief-row'); if (row) row.hidden = story;
  }; });
  $('#club-submit-form').onsubmit = async ev => {
    ev.preventDefault();
    const kindVal = kindNow(), url = document.getElementById('cs-url').value.trim(), date = document.getElementById('cs-date').value || today;
    if (kindVal === 'post' && !/^https:\/\/\S+$/.test(url)) { status.textContent = 'Paste the full link to your post. It starts with https://'; return document.getElementById('cs-url').focus(); }
    if (url && !/^https:\/\/\S+$/.test(url)) { status.textContent = 'Links start with https://'; return document.getElementById('cs-url').focus(); }
    const briefBox = document.getElementById('cs-brief');
    const go = document.getElementById('cs-go'); go.disabled = true; go.textContent = 'Sending…'; status.textContent = '';
    try {
      const res = await uploadRequest({ action: 'club-submit', name, kind: kindVal, date, briefId: kindVal === 'post' && b && briefBox && briefBox.checked ? b.id : '', url, note: document.getElementById('cs-note').value.trim() });
      if (!res.ok) throw new Error(res.error || '');
      body.innerHTML = `<p><strong>Logged, thank you!</strong> Your ${kindVal === 'story' ? 'story' : 'feed post'} counts toward your ${kindVal === 'story' ? 'week' : 'month'}. While you’re here, go cheer on a few other creators: real comments and story replies make the Club work.</p>`;
      loadClub();
    } catch (err) { status.textContent = err.message || 'That didn’t send. Try again in a minute.'; go.disabled = false; go.textContent = 'Log it'; }
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
const COORD_TABS = [['applications', 'Applications'], ['roster', 'Roster'], ['briefs', 'Briefs'], ['calls', 'Casting calls'], ['content', 'Content'], ['participation', 'Participation'], ['analytics', 'Analytics'], ['settings', 'Settings']];
function renderCoord() {
  const c = coord; if (!c) return;
  const openApps = c.applications.filter(a => ['Submitted', 'Under Review'].includes(a.status)).length;
  const flags = c.participation.filter(p => p.standing === 'Needs review').length + c.members.filter(m => m.request).length;
  const waitingCalls = (c.calls || []).filter(x => x.audience === 'public' && x.review === 'waiting' && x.status !== 'closed').length;
  const badge = { applications: openApps, participation: flags, calls: waitingCalls };
  body.innerHTML = `<nav class="flow-nav coord-tabs" aria-label="Coordinator tools">${COORD_TABS.map(([id, label]) => `<button type="button" class="flow-tab${coordTab === id ? ' selected' : ''}" data-coord-tab="${id}"${coordTab === id ? ' aria-current="true"' : ''}>${label}${badge[id] ? ` <span class="nav-badge">${badge[id]}</span>` : ''}</button>`).join('')}</nav>
    <div class="coord-body">${({ applications: coordApps, roster: coordRoster, briefs: coordBriefs, calls: coordCalls, content: coordContent, participation: coordParticipation, analytics: coordAnalytics, settings: coordSettings })[coordTab](c)}</div>`;
}
const selectHTML = (attr, list, value) => `<select ${attr}>${list.map(x => `<option${x === value ? ' selected' : ''}>${escapeHTML(x)}</option>`).join('')}</select>`;
function coordApps(c) {
  const filters = [['open', 'To review'], ['Waitlisted', 'Waitlisted'], ['Approved', 'Approved'], ['Declined', 'Declined'], ['all', 'All']];
  const list = c.applications.filter(a => coordFilter === 'all' ? true : coordFilter === 'open' ? ['Submitted', 'Under Review'].includes(a.status) : a.status === coordFilter);
  return `<div class="view-switch">${filters.map(([id, l]) => `<button type="button" aria-selected="${coordFilter === id}" data-coord-filter="${id}">${l}</button>`).join('')}</div>
    ${list.length ? list.map(a => `<form class="coord-card" data-coord-form="app" data-id="${escapeHTML(a.id)}">
      <div class="app-top"><strong>${escapeHTML(a.name)}</strong><span class="quiet">${escapeHTML([a.market || a.region, a.submitted ? 'applied ' + shortDate(a.submitted.slice(0, 10)) : ''].filter(Boolean).join(' · '))}</span></div>
      <dl class="coord-facts">${[['Roles', a.roles], ['Interests', a.interests], ['Experience', a.experience], ['On camera', a.camera], ['Capacity', a.capacity], ['Why', a.why]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>
      <div class="trk-links">${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || '') ? `<a class="text-button" href="mailto:${escapeHTML(a.email)}">${escapeHTML(a.email)}</a>` : ''}${instagramLink(a.instagram)}${externalLink(a.example, 'Their work', 'text-button')}</div>
      <div class="coord-row"><label>Status ${selectHTML('name="status"', ['Submitted', 'Under Review', 'Approved', 'Waitlisted', 'Declined'], a.status)}</label><label class="grow">Notes (coordinators only)<input name="notes" type="text" maxlength="1000" value="${escapeHTML(a.notes || '')}"></label><button class="button" type="submit">Save</button></div>
      ${a.reviewedBy ? `<p class="quiet">Last reviewed by ${escapeHTML(a.reviewedBy)}</p>` : ''}
    </form>`).join('') : '<p class="quiet">Nothing here right now.</p>'}
    <p class="quiet">Approving adds the person to the roster as Active. Follower count is never a factor.</p>`;
}
function coordRoster(c) {
  const part = n => c.participation.find(p => p.name === n) || {};
  const seed = baseSquadNames().filter(n => !c.members.some(m => m.name.toLowerCase() === n.toLowerCase()) && !(c.accounts || []).some(a => a.hasPassword && sameName(a.claimed, n)));
  return `${coordClaims(c)}${seed.length ? `<div class="flow-note"><strong>${c.members.length ? 'Add the rest of the current Squad?' : 'Start the roster'}</strong><p>${escapeHTML(seed.join(', '))} ${seed.length === 1 ? 'isn’t' : 'aren’t'} on the roster yet. Add them as Active founding members?</p><button class="button" type="button" data-coord-seed>Add ${plural(seed.length, 'founding member')}</button></div>` : ''}
    ${c.members.map(m => `<form class="coord-card" data-coord-form="member" data-name="${escapeHTML(m.name)}">
      <div class="app-top"><strong>${escapeHTML(m.name)}</strong><span class="stage ${standingClass(part(m.name).standing)}">${escapeHTML(part(m.name).standing || m.status)}</span></div>
      <p class="quiet">${escapeHTML([m.market, m.roles, m.joined ? 'joined ' + shortDate(m.joined) : ''].filter(Boolean).join(' · '))}</p>
      ${m.request ? `<p class="coord-request"><strong>${escapeHTML(m.request)} requested</strong>${m.requestUntil ? ` until ${escapeHTML(shortDate(m.requestUntil))}` : ''}${m.requestNote ? `: “${escapeHTML(m.requestNote)}”` : ''} <button class="text-button" type="button" data-coord-request="${escapeHTML(m.name)}" data-to="${m.request === 'Pause' ? 'Paused' : 'Active'}">${m.request === 'Pause' ? 'Approve pause' : 'Set Active'}</button><button class="text-button" type="button" data-coord-request="${escapeHTML(m.name)}" data-to="">Dismiss</button></p>` : ''}
      <div class="coord-row"><label>Status ${selectHTML('name="status"', ['Active', 'Paused', 'Needs Check-In', 'Inactive', 'Alumni'], m.status)}</label><label class="grow">Notes (coordinators only)<input name="notes" type="text" maxlength="1000" value="${escapeHTML(m.notes || '')}"></label><button class="button" type="submit">Save</button></div>
    </form>`).join('') || '<p class="quiet">No members yet.</p>'}
    ${coordAccounts(c)}
    <form class="coord-card coord-add" data-coord-form="member-new"><label class="grow">Add someone to the roster<input name="name" type="text" maxlength="80" placeholder="Name as it appears in Disco" required></label><button class="button secondary" type="submit">Add</button></form>
    <p class="quiet">Nobody is removed automatically. Inactive members and alumni keep their history and the open Social & Sharing resources.</p>`;
}
// Creators' own passwords and bios: a coordinator can reset a forgotten password or take a bio down.
// Before launch: who on the current Squad list has claimed their name and set their password.
function coordClaims(c) {
  const list = c.accounts || [], base = baseSquadNames();
  const holder = n => list.find(a => a.hasPassword && (sameName(a.claimed, n) || sameName(a.name, n)));
  // The current Squad by first name, plus everyone else on the roster (approved applicants) by the name they applied with.
  const isBaseClaim = m => base.some(b => sameName(b, m) || (holder(b) && sameName(holder(b).name, m)));
  const squad = [...base, ...c.members.filter(m => !['Inactive', 'Alumni'].includes(m.status) && !isBaseClaim(m.name)).map(m => m.name)];
  const done = squad.filter(holder).length;
  return `<div class="coord-card claims"><div class="app-top"><h3>Profiles claimed</h3><span class="stage ${done === squad.length ? 'stage-published' : 'stage-filming'}">${done} of ${squad.length}</span></div>
    <p class="quiet">Everyone on the roster, including approved applicants, signs in once with the creator password, claims their name (adding their last name if it’s missing) and sets a password. Their roster row switches to their full name.</p>
    <ul class="claim-list">${squad.map(n => { const a = holder(n), match = !a && list.find(x => x.hasPassword && !x.claimed && sameName(String(x.name).split(/\s+/)[0], n));
      return `<li class="${a ? 'done' : ''}"><span aria-hidden="true">${a ? '✓' : ''}</span><strong>${escapeHTML(n)}</strong>${a ? `<span class="quiet">${escapeHTML(a.name) + (a.bioSet && a.bio ? ' · bio added' : ' · no bio yet')}</span>`
        : match ? `<button class="text-button" type="button" data-coord-account="claim" data-name="${escapeHTML(match.name)}" data-claim="${escapeHTML(n)}">Link ${escapeHTML(match.name)}</button>` : '<span class="quiet">Not yet</span>'}</li>`; }).join('')}</ul></div>`;
}
function coordAccounts(c) {
  const list = c.accounts || []; if (!list.length) return '';
  return `<div class="coord-card"><h3>Passwords and bios</h3><p class="quiet">Creators set up their own password with the creator password. If someone forgets theirs, reset it and they set a new one the same way.</p>
    <ul class="acct-list">${list.map(a => `<li><span><strong>${escapeHTML(a.name)}</strong><span class="quiet">${escapeHTML([a.hasPassword ? (a.lastSignIn && dateValid(a.lastSignIn.slice(0, 10)) ? 'last signed in ' + shortDate(a.lastSignIn.slice(0, 10)) : 'password set') : 'reset, waiting for a new password', a.bioSet ? (a.bio ? 'wrote a bio' : 'deleted their bio') : ''].filter(Boolean).join(' · '))}</span>${a.bio ? `<span class="acct-bio">“${escapeHTML(a.bio)}”</span>` : ''}</span>
      <span class="acct-actions">${a.hasPassword ? `<button class="text-button" type="button" data-coord-account="reset" data-name="${escapeHTML(a.name)}">Reset password</button>` : ''}${a.bio ? `<button class="text-button danger" type="button" data-coord-account="clear-bio" data-name="${escapeHTML(a.name)}">Take bio down</button>` : ''}</span></li>`).join('')}</ul></div>`;
}
const standingClass = s => ({ 'On track': 'stage-published', 'Reminder': 'stage-filming', 'Needs review': 'stage-casting stage-alert', 'Paused': 'stage-idea' })[s] || 'stage-idea';
/* The bi-weekly brief template: every brief has the same parts, in this order, each with what to write and an example.
   [key, label, type, example (placeholder), what to write (hint)] */
const BRIEF_PARTS = [
  ['Brief at a glance', 'These show at the top of the brief and on each creator’s dashboard card: a creator should get the whole idea from them alone.', [
    ['title', 'Brief title', 'text', 'Holiday Registry Rush', 'A short campaign name, 2–5 words'],
    ['theme', 'Theme or concept', 'text', 'Help families sort what’s worth registering for before the holidays', 'One sentence: the idea and who it helps'],
    ['weekStart', 'Starts', 'date', '', 'The Monday the brief begins, right after the last brief ends'],
    ['weekEnd', 'Ends', 'date', '', 'Leave blank for two weeks'],
    ['format', 'Format', 'text', 'Reel or carousel', 'Reel, carousel or story'],
    ['length', 'Length', 'text', 'About 15–30 seconds', 'A target runtime or slide count'],
    ['window', 'Publishing window', 'text', 'Anytime these two weeks', 'When to post within the two weeks'],
    ['cta', 'Call to action', 'text', 'Explore the free Baby Concierge service', 'One action, tied to the theme']]],
  ['Concepts & creative direction', 'Two or three ways into the theme, one per line, plus what a strong post looks like. The first 220 characters show on the dashboard card, so lead with the best concept. Keep babies’ faces, clients’ details and other shoppers out of frame.', [
    ['direction', 'Concepts & creative direction', 'textarea', '1. “Register for this, skip that”: one swap per clip.\n2. Your three must-haves under $50, in-store.\n3. Answer the registry question you hear most this month.\nGood looks like a friendly expert in the aisle: real products, quick reasons, no hard sell.']]],
  ['Trending audios', 'Two to four audios, one per line. Check each link opens and the audio is available to the account creators post from (some aren’t available to business accounts).', [
    ['audios', 'Trending audios', 'textarea', 'Audio name — link — how to use it with the theme']]],
  ['Hooks & talking points', 'Three to five hooks for the first three seconds, written the way someone would say them out loud, then two or three talking points checked against the brand’s own materials.', [
    ['hooks', 'Hooks & talking points', 'textarea', 'Hook: “Three things I’d never put on my registry.”\nHook: “A baby gear specialist’s holiday registry rules.”\nTalking point: a checked fact or tip']]],
  ['Upcoming launches', 'Only launches that are already public, each with a date and a source link. Leave blank when there’s nothing to share.', [
    ['launches', 'Upcoming launches', 'textarea', 'Product — launch date — why it matters to families — source link']]],
  ['Deliverables', 'What a post from this brief looks like and how it fits the commitments: one feed post a month, one story a week. Briefs are inspiration, so word it as an option, not an assignment.', [
    ['deliverables', 'Deliverables', 'textarea', 'A reel or carousel from this brief can be your feed post for the month. For a story, share one registry swap with a poll sticker. Log either one from your dashboard once it’s live.']]],
  ['Assets, resources & guidelines', 'Only links Creators Club members can open. Product and brand rules go in guidelines. Never promise payment, brand deals, exposure or acceptance.', [
    ['resources', 'Assets & resources (links welcome)', 'textarea', 'B-roll library → Registry clips; Brand & voice guide'],
    ['guidelines', 'Brand or product guidelines', 'textarea', 'Use product names exactly as the brand writes them; share prices only from the retailer’s current listing.']]]
];
const BRIEF_FIELDS = BRIEF_PARTS.flatMap(p => p[2]);
// Checked before Save & publish (not saved anywhere; it's a last look).
const BRIEF_CHECKS = ['Title, theme, dates, format, length, window and call to action are filled in', 'The start date follows the last brief’s end, with no gap or overlap', 'Every audio and resource link opens for a Creators Club member', 'Launches are public and have a source', 'No babies’ faces, client details or private information in examples or assets', 'No promises of payment, brand deals, exposure or acceptance', 'Previewed: it reads well as creators will see it'];
const isoPlus = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
// A new brief starts the day after the latest brief ends (a brief with no end runs two weeks), else next Monday.
function nextBriefStart(briefs) {
  const ends = (briefs || []).filter(b => b.weekStart).map(b => b.weekEnd || isoPlus(b.weekStart, 13)).sort();
  if (ends.length) return isoPlus(ends[ends.length - 1], 1);
  const t = new Date().toLocaleDateString('en-CA'), dow = new Date(t + 'T12:00:00Z').getUTCDay();
  return isoPlus(t, ((8 - dow) % 7) || 7);
}
function briefField([k, label, type, ph, hint], b, solo = false) {
  const id = 'bf-' + k, hid = hint ? ` aria-describedby="${id}-h"` : '', place = ph ? ` placeholder="${escapeHTML(ph)}"` : '';
  const control = type === 'textarea' ? `<textarea id="${id}" name="${k}" maxlength="3000"${place}${hid}>${escapeHTML(b[k] || '')}</textarea>`
    : `<input id="${id}" name="${k}" type="${type}" maxlength="300" value="${escapeHTML(b[k] || '')}"${place}${hid}>`;
  return `<div class="${type === 'textarea' ? 'wide' : ''}"><label for="${id}"${solo ? ' class="sr-only"' : ''}>${label}</label>${control}${hint ? `<span class="brief-hint" id="${id}-h">${escapeHTML(hint)}</span>` : ''}</div>`;
}
// Briefs: create, preview, edit, duplicate, publish/unpublish, archive and delete.
const briefStage = (b, c) => `<span class="stage ${b.status === 'Published' ? 'stage-published' : b.status === 'Draft' ? 'stage-filming' : 'stage-idea'}">${b.id === c.current ? 'Current' : escapeHTML(b.status)}</span>`;
function coordBriefs(c) {
  if (briefDraft) {
    const b = briefDraft, live = b.status === 'Published';
    return `<form class="coord-card brief-editor" data-coord-form="brief"><h3>${b.id ? `Edit “${escapeHTML(b.title || b.theme || 'brief')}”` : 'New brief'}</h3>
      <p class="quiet">Every brief follows this template, so creators always know where to look. Give direction, not a script: same strategy, room for each creator’s voice. Leave a part blank rather than writing “TBD”; blank parts don’t show to creators.${live ? ' This brief is live: changes show to creators as soon as you save.' : ''}</p>
      ${BRIEF_PARTS.map(([name, about, fields], i) => `<fieldset class="brief-part-edit"><legend><span class="brief-step">${i + 1}</span>${escapeHTML(name)}</legend>${fields.length > 1 ? `<p class="brief-about">${escapeHTML(about)}</p>` : ''}
        <div class="brief-fields">${fields.map(f => fields.length > 1 ? briefField(f, b) : briefField([f[0], f[1], f[2], f[3], about], b, true)).join('')}</div></fieldset>`).join('')}
      ${live ? '' : `<fieldset class="brief-part-edit brief-checks"><legend>Before you publish</legend>${BRIEF_CHECKS.map((x, i) => `<label class="check"><input type="checkbox" data-brief-check="${i}"><span>${escapeHTML(x)}</span></label>`).join('')}</fieldset>`}
      <div class="form-actions"><button class="button" type="submit">${live ? 'Save changes' : 'Save draft'}</button>${live ? '' : '<button class="button secondary" type="submit" data-publish>Save &amp; publish</button>'}<button class="button secondary" type="button" data-coord-cancel>Cancel</button>${b.id ? `<button class="text-button danger" type="button" data-coord-brief-del="${escapeHTML(b.id)}">Delete</button>` : ''}</div></form>`;
  }
  const v = briefView && c.briefs.find(b => b.id === briefView.id);
  if (v && briefView.mode === 'preview') return `<div class="coord-card brief-preview"><div class="app-top"><p class="club-kicker">${escapeHTML(weekRange(v) || 'No dates yet')} · Brief preview</p>${briefStage(v, c)}</div>
      <h3>${escapeHTML(v.title || v.theme || 'Untitled')}</h3>${briefSections(v) || '<p class="quiet">Nothing in this brief yet.</p>'}
      <div class="button-row"><button class="button" type="button" data-coord-edit="${escapeHTML(v.id)}">Edit</button><button class="button secondary" type="button" data-coord-back>Back to briefs</button></div></div>`;
  return `<div class="button-row"><button class="button" type="button" data-coord-new-brief>New brief</button></div>
    ${c.briefs.length ? `<ul class="coord-list">${c.briefs.map(b => {
      const confirm = briefView && briefView.mode === 'delete' && briefView.id === b.id;
      return `<li class="coord-card"><div class="app-top"><strong>${escapeHTML(b.title || b.theme || 'Untitled')}</strong>${briefStage(b, c)}</div>
      <p class="quiet">${escapeHTML([weekRange(b) || 'No dates yet', b.format, b.updatedBy ? 'updated by ' + b.updatedBy : ''].filter(Boolean).join(' · '))}</p>
      ${confirm ? `<div class="coord-confirm"><p><strong>Delete “${escapeHTML(b.title || b.theme || 'this brief')}”?</strong> It comes out of the app and the program sheet.${b.status === 'Published' ? ' Creators stop seeing it right away.' : ''} Posts already logged for it keep its name.</p>
        <div class="button-row"><button class="button danger" type="button" data-coord-brief="delete" data-id="${escapeHTML(b.id)}">Delete</button><button class="button secondary" type="button" data-coord-back>Keep it</button></div></div>`
      : `<div class="trk-links"><button class="text-button" type="button" data-coord-preview="${escapeHTML(b.id)}">Preview</button><button class="text-button" type="button" data-coord-edit="${escapeHTML(b.id)}">Edit</button><button class="text-button" type="button" data-coord-brief="duplicate" data-id="${escapeHTML(b.id)}">Duplicate for the next brief</button>${b.status === 'Published' ? `<button class="text-button" type="button" data-coord-brief="unpublish" data-id="${escapeHTML(b.id)}">Unpublish</button>` : `<button class="text-button" type="button" data-coord-brief="publish" data-id="${escapeHTML(b.id)}">Publish</button>`}${b.status !== 'Archived' ? `<button class="text-button" type="button" data-coord-brief="archive" data-id="${escapeHTML(b.id)}">Archive</button>` : ''}<button class="text-button danger" type="button" data-coord-brief-del="${escapeHTML(b.id)}">Delete</button></div>`}</li>`; }).join('')}</ul>`
      : emptyState('No briefs yet.', 'Create the first brief: trending audios, hooks, concepts or upcoming launches. One every other week; it stays a draft until you publish it.', '', ICON.spark)}
    <p class="quiet">You can also edit briefs right in the “Creators Club program” sheet in the shared drive.</p>`;
}
/* Casting calls creators posted. Public ones wait here: approve them for the public page, or keep them in the Creators Club. */
function coordCalls(c) {
  const calls = c.calls || [], waits = x => x.audience === 'public' && x.review === 'waiting' && x.status !== 'closed';
  const card = x => { const [cls, label] = callState(x); return `<li class="coord-card">
    <div class="app-top"><strong>${escapeHTML(x.title)}</strong><span class="quiet">${escapeHTML([x.lead ? 'Posted by ' + x.lead : '', x.posted ? shortDate(x.posted.slice(0, 10)) : ''].filter(Boolean).join(' · '))}</span></div>
    <p>${escapeHTML(x.description)}</p>
    <dl class="coord-facts">${[['What to film', x.instructions], ['How to film', (x.steps || []).join(' / ')], ['Questions', (x.questions || []).join(' / ')], ['Due', x.deadline ? shortDate(x.deadline) : ''], ['Responses', String(x.responses || 0)]].filter(f => f[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>
    ${waits(x) ? `<div class="coord-row"><label class="grow">Note to ${escapeHTML(String(x.lead || 'the poster').split(/\s+/)[0])} (optional)<input type="text" maxlength="300" data-call-note="${escapeHTML(x.id)}"></label></div>
      <div class="button-row"><button class="button" type="button" data-coord-call="${escapeHTML(x.id)}" data-decision="approve">Approve for the public page</button><button class="button secondary" type="button" data-coord-call="${escapeHTML(x.id)}" data-decision="club">Keep it in the Creators Club</button></div>`
      : `<div class="coord-row"><span class="call-state call-${cls}">${label}</span><button class="text-button" type="button" data-action="call-edit" data-call="${escapeHTML(x.id)}">Edit</button><button class="text-button" type="button" data-coord-call="${escapeHTML(x.id)}" data-decision="${x.status === 'closed' ? 'open' : 'close'}">${x.status === 'closed' ? 'Reopen' : 'Close'}</button></div>`}
  </li>`; };
  const waiting = calls.filter(waits), rest = calls.filter(x => !waits(x));
  return `<p class="quiet">Any creator can post a casting call. Creators Club calls go live right away; public calls wait here until one of you approves them.</p>
    <h3 class="cal-head">Waiting for public approval</h3>${waiting.length ? `<ul class="coord-list">${waiting.map(card).join('')}</ul>` : '<p class="quiet">Nothing waiting.</p>'}
    <h3 class="cal-head">All casting calls</h3>${rest.length ? `<ul class="coord-list">${rest.map(card).join('')}</ul>` : '<p class="quiet">No casting calls posted yet.</p>'}`;
}
function coordContent(c) {
  return c.submissions.length ? `<ul class="coord-list">${c.submissions.map(s => `<li class="coord-card coord-sub"><div class="app-top"><strong>${escapeHTML(s.name)}</strong><span class="quiet">${escapeHTML(shortDate(s.date || s.submitted.slice(0, 10)))}</span></div>
      <p>${escapeHTML(subLabel(s))}${s.note ? ` · “${escapeHTML(s.note)}”` : ''}</p>
      <div class="coord-row">${externalLink(s.url, 'Open the post', 'text-button')}<label>Status ${selectHTML(`data-coord-sub="${escapeHTML(s.id)}"`, ['Submitted', 'Counted', 'Needs changes'], s.status)}</label></div></li>`).join('')}</ul>`
    : emptyState('Nothing logged yet.', 'Feed posts and stories creators log show up here.', '', ICON.play);
}
function coordParticipation(c) {
  const order = { 'Needs review': 0, 'Reminder': 1, 'On track': 2, 'Paused': 3 }, st = c.settings;
  const rows = c.participation.slice().sort((a, b) => (order[a.standing] ?? 4) - (order[b.standing] ?? 4));
  const dots = (list, label, tip) => list.length ? `<p class="week-dots" aria-label="${label}"><span class="dots-label">${label}</span>${list.slice().reverse().map(h => `<span class="${!h.finished ? 'now' : h.met ? 'met' : 'miss'}" title="${escapeHTML(tip(h) + ': ' + (h.finished ? (h.met ? 'met' : 'missed') : 'in progress'))}">${!h.finished ? '…' : h.met ? '✓' : '·'}</span>`).join('')}</p>` : '';
  return `<p class="quiet">From the guidelines: ${plural(st.requiredPosts, 'feed post')} a month and ${plural(st.requiredStories, 'story', 'stories')} a week. Reminder after ${plural(st.storyReminderWeeks, 'week')} without a story or ${plural(st.postReminderMonths, 'month')} without a feed post; check-in after ${st.storyReviewWeeks} weeks or ${st.postReviewMonths} months. Suggestions only: nothing changes until you update someone on the Roster tab.</p>
    ${rows.length ? `<ul class="coord-list">${rows.map(p => `<li class="coord-card"><div class="app-top"><strong>${escapeHTML(p.name)}</strong><span class="stage ${standingClass(p.standing)}">${escapeHTML(p.standing)}</span></div>
      <p class="quiet">${[p.monthsFinished ? `feed posts ${p.monthsMet} of ${plural(p.monthsFinished, 'month')}` : '', p.weeksFinished ? `stories ${p.weeksMet} of ${plural(p.weeksFinished, 'week')}` : '', p.missedMonths ? `no feed post for ${plural(p.missedMonths, 'month')}` : '', p.missedWeeks ? `no story for ${plural(p.missedWeeks, 'week')}` : ''].filter(Boolean).join(' · ') || 'No finished weeks yet'}</p>
      ${dots(p.months || [], 'Months', h => h.month)}${dots(p.weeks || [], 'Weeks', h => 'Week of ' + shortDate(h.weekStart))}
      ${p.standing === 'Needs review' && p.status !== 'Needs Check-In' ? `<button class="text-button" type="button" data-coord-request="${escapeHTML(p.name)}" data-to="Needs Check-In" data-keep>Mark “Needs Check-In”</button>` : ''}</li>`).join('')}</ul>` : '<p class="quiet">Add members on the Roster tab to start tracking.</p>'}`;
}
function coordAnalytics(c) {
  const a = { lastWeek: {}, lastMonth: {}, thisWeek: {}, thisMonth: {}, ...c.analytics }, tile = (n, label, note = '') => `<div class="stat-tile"><strong>${n}</strong><span>${label}</span>${note ? `<em>${note}</em>` : ''}</div>`;
  const pct = r => r && r.rate != null ? r.rate + '%' : '—';
  const monthName = ym => ym ? new Date(ym + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'long' }) : '';
  return `<div class="stat-grid">
    ${tile(a.activeCreators, 'Active creators')}
    ${tile(pct(a.lastWeek), 'Shared a story last week', a.lastWeek.eligible ? `${a.lastWeek.met} of ${a.lastWeek.eligible}` : 'No finished weeks yet')}
    ${tile(pct(a.lastMonth), `Posted to their feed in ${escapeHTML(monthName(a.lastMonth.month))}`, a.lastMonth.eligible ? `${a.lastMonth.met} of ${a.lastMonth.eligible}` : 'No finished months yet')}
    ${tile(a.thisWeek.stories, 'Stories this week', `${plural(a.thisWeek.creators, 'creator')} so far`)}
    ${tile(a.thisMonth.posts, 'Feed posts this month', `${plural(a.thisMonth.creators, 'creator')} so far`)}
    ${tile(a.publishedLinks, 'Links shared')}
    ${tile(publishedProjects().length, 'Squad Reels published', 'From Made by the Squad')}
    ${tile(a.briefsRun, 'Briefs sent')}
  </div>
  <p class="flow-note"><strong>Reach and engagement aren’t tracked yet.</strong> They need a verified source (like Instagram insights shared by each creator). Until then, nothing here estimates or invents them. Community engagement (comments, likes, story replies) isn’t tracked either.</p>`;
}
function coordSettings(c) {
  const s = c.settings, num = (k, label) => `<label>${label}<input name="${k}" type="number" min="0" max="20" value="${escapeHTML(String(s[k]))}"></label>`;
  return `<form class="coord-card" data-coord-form="settings"><h3>Commitments</h3><p class="quiet">Set from the Creators Club guidelines. Changes apply right away.</p>
    <div class="brief-fields">${num('requiredPosts', 'Feed posts each month')}${num('requiredStories', 'Stories each week')}${num('storyReminderWeeks', 'Weeks without a story before a reminder')}${num('storyReviewWeeks', 'Weeks without a story before a check-in')}${num('postReminderMonths', 'Months without a feed post before a reminder')}${num('postReviewMonths', 'Months without a feed post before a check-in')}${num('briefEveryWeeks', 'Weeks between briefs')}
    <label class="wide">Creator Circle link<input name="creatorCircleUrl" type="url" value="${escapeHTML(s.creatorCircleUrl || content.creatorCircleUrl || '')}" placeholder="https://tot-squad-hub.disco.co/channel/…"></label></div>
    <div class="form-actions"><button class="button" type="submit">Save settings</button></div></form>
    <form class="coord-card" data-coord-form="creator-password"><h3>Creator password</h3><p class="quiet">The shared password new and reset members use once, to set up their own. It can’t sign anyone in or open any data by itself. Changing it doesn’t affect anyone who already has their own password.</p>
    <div class="brief-fields"><label class="wide">New creator password<input name="creatorPassword" type="text" minlength="8" maxlength="60" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="At least 8 characters"></label></div>
    <div class="form-actions"><button class="button" type="submit">Change the creator password</button></div></form>
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
    const t = e.target.closest && e.target.closest('[data-coord-call],[data-coord-tab],[data-coord-filter],[data-coord-seed],[data-coord-request],[data-coord-new-brief],[data-coord-edit],[data-coord-brief],[data-coord-cancel],[data-coord-account],[data-coord-preview],[data-coord-brief-del],[data-coord-back]');
    if (!t || !coord) return;
    const d = t.dataset;
    if (d.coordCall) { const note = document.querySelector(`[data-call-note="${CSS.escape(d.coordCall)}"]`); refreshCoord('admin-call', { id: d.coordCall, decision: d.decision, note: note ? note.value : '' }, { approve: 'Approved. It’s on the public page now.', club: 'Kept in the Creators Club. It stays live for creators.', close: 'Closed.', open: 'Reopened.' }[d.decision] || 'Saved.').then(() => { if (typeof loadCalls === 'function') loadCalls(); }); return; }
    if (d.coordTab) { coordTab = d.coordTab; briefDraft = null; briefView = null; status.textContent = ''; renderCoord(); return; }
    if (d.coordFilter) { coordFilter = d.coordFilter; renderCoord(); return; }
    if ('coordSeed' in d) { const people = [content.leader, ...(content.featuredSpecialists || [])].filter(p => p && p.name).map(p => ({ name: p.name, market: p.region || '', instagram: p.instagram || '' })); refreshCoord('admin-seed', { members: people }, 'Roster updated.'); return; }
    if ('coordRequest' in d) { refreshCoord('admin-member', { name: d.coordRequest, ...(d.to ? { status: d.to } : {}), ...('keep' in d ? {} : { clearRequest: true }) }, 'Saved.'); return; }
    if ('coordNewBrief' in d) { briefDraft = { weekStart: nextBriefStart(coord.briefs) }; briefView = null; renderCoord(); return; }
    if (d.coordEdit) { briefDraft = { ...(coord.briefs.find(b => b.id === d.coordEdit) || {}) }; briefView = null; renderCoord(); return; }
    if ('coordCancel' in d || 'coordBack' in d) { briefDraft = null; briefView = null; status.textContent = ''; renderCoord(); return; }
    if (d.coordPreview) { briefView = { id: d.coordPreview, mode: 'preview' }; renderCoord(); return; }
    if (d.coordBriefDel) { briefDraft = null; briefView = { id: d.coordBriefDel, mode: 'delete' }; renderCoord(); return; }
    if (d.coordAccount) { refreshCoord('admin-account', { name: d.name, op: d.coordAccount, claim: d.claim || '' }, d.coordAccount === 'reset' ? `Password reset. ${d.name} can set a new one with the creator password.` : d.coordAccount === 'claim' ? `${d.name} now has ${d.claim} on the roster.` : 'Bio taken down.'); return; }
    if (d.coordBrief) { briefView = null; refreshCoord('admin-brief', { op: d.coordBrief, brief: { id: d.id } }, { duplicate: 'Copied as a draft for the next brief.', publish: 'Published. Creators see it now.', unpublish: 'Back to draft.', archive: 'Archived.', delete: 'Brief deleted.' }[d.coordBrief]); return; }
  });
  document.addEventListener('submit', async e => {
    const f = e.target.closest && e.target.closest('[data-coord-form]'); if (!f) return;
    e.preventDefault(); const v = formData(f), kind = f.dataset.coordForm;
    if (kind === 'app') refreshCoord('admin-app', { id: f.dataset.id, status: v.status, notes: v.notes }, v.status === 'Approved' ? 'Approved and added to the roster.' : 'Saved.');
    if (kind === 'member') refreshCoord('admin-member', { name: f.dataset.name, status: v.status, notes: v.notes }, 'Saved.');
    if (kind === 'member-new') refreshCoord('admin-member', { name: v.name, status: 'Active' }, 'Added.');
    if (kind === 'settings') refreshCoord('admin-settings', { settings: v }, 'Settings saved.');
    if (kind === 'creator-password') { if (String(v.creatorPassword || '').length < 8) return toast('Use at least 8 characters.'); refreshCoord('admin-settings', { settings: {}, creatorPassword: v.creatorPassword }, 'Creator password changed. Share the new one privately, like in the Creator Circle.'); }
    if (kind === 'brief') { const publish = !!(e.submitter && 'publish' in e.submitter.dataset), live = briefDraft && briefDraft.status === 'Published';
      if (publish) { const open = [...f.querySelectorAll('[data-brief-check]')].find(x => !x.checked); if (open) { status.textContent = 'Check each item under “Before you publish” first, or save it as a draft.'; open.focus(); return; } }
      const res = await refreshCoord('admin-brief', { op: 'save', publish, brief: { ...v, id: briefDraft && briefDraft.id || '' } }, publish ? 'Saved and published. Creators see it now.' : live ? 'Saved. Creators see the changes now.' : 'Saved as a draft. Publish it when it’s ready.');
      if (res) { briefDraft = null; briefView = null; renderCoord(); } }
  });
}
if (typeof modal !== 'undefined' && modal.addEventListener) modal.addEventListener('close', () => modal.classList.toggle('coord', false));
if (has('#club-dash')) loadClub();
