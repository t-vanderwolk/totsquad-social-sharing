'use strict';
/* Tot Squad Social & Sharing.
   Everything configurable comes from content.js and is always escaped before rendering.
   Only the static toolkit copy in `info` is trusted HTML. */

const content = window.HUB_CONTENT;
const SERIES = content.series || [];
const STAGES = {idea:'Idea', casting:'Casting', filming:'Filming', editing:'Editing', published:'Published'};
const TINTS = ['plum','teal','peach','linen'];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ICON = {
  play:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  spark:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.7 5 2.3 7.3 7 9-4.7 1.7-6.3 4-7 9-.7-5-2.3-7.3-7-9 4.7-1.7 6.3-4 7-9z"/></svg>',
  bulb:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  people:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.6.2 4.4 2 5 4.9"/></svg>'
};

const info = {
  guide:['From a spark to a story.','<p><strong>1. Pick one person.</strong><br>Who do you want to help, and what are they wondering?</p><p><strong>2. Keep one clear takeaway.</strong><br>Choose a useful observation or a simple idea within your expertise.</p><p><strong>3. Make it feel like you.</strong><br>Use plain language, a warm tone, and a real point of view.</p><p><strong>4. Invite a conversation.</strong><br>End with a thoughtful question. Add captions to video and descriptive text to images.</p>'],
  checklist:['A thoughtful final check.','<p>□ Is the idea clear, useful, and within your expertise?</p><p>□ Do you have permission to share the people, stories, and assets featured?</p><p>□ If a client’s registry, home or story appears, do you have their permission, with names and order details hidden?</p><p>□ Have you removed private family or client information?</p><p>□ Are captions, image descriptions, and text easy to read?</p><p>□ Are claims supported and any partnerships disclosed?</p><p>□ Has the team reviewed the content before publication?</p>'],
  brand:['Tot Squad brand & voice','<p>One recognizable Squad, wherever we show up. Use these hub guidelines when preparing community content.</p><div class="brand-swatches"><span style="background:#875782;color:white">Plum · #875782</span><span style="background:#6fc9ba">Teal · #6FC9BA</span><span style="background:#f8f1e9">Linen · #F8F1E9</span><span style="background:#fee2d5">Peach · #FEE2D5</span></div><p><strong>Recognizable by design.</strong><br>Use the Tot Squad logo as supplied, with breathing room. Do not stretch, recolor, or replace it with a homemade wordmark. Use soft serif headings, clear Figtree body text, and plum buttons.</p><p><strong>Expert, warm, and reassuring.</strong><br>Speak with families, not at them. Offer practical help, respect different parenting experiences, and keep language clear and inclusive. Avoid shame, fear, and promises of perfect outcomes.</p><p><strong>Helpful before promotional.</strong><br>Focus on one useful takeaway. Credit creators, use captions and image descriptions, and protect family privacy.</p><p class="quiet">Hub guidance based on Tot Squad’s public website. These working rules are not a substitute for an approved corporate brand manual.</p>']
};

/* Field: [name, label, type, required (or options for select), {max, hint}] */
const flows = {
  pitch:{title:'Pitch an idea',intro:'Turn a spark into something we can create together. The concept template helps the team picture it.',fields:[
    ['title','Working title','text',true],
    ['series','Series','select',[...SERIES.map(s=>s.label),'Something new']],
    ['audience','Who is this for?','text',true],
    ['idea','What’s your idea?','textarea',true],
    ['hook','Hook: the first three seconds','text',false,{max:150,hint:'One line that makes someone stop scrolling.'}],
    ['takeaway','What should a family take away?','textarea',true],
    ['shots','Shot list or structure','textarea',false,{hint:'For example: open on the registry, three quick picks, end with a question.'}],
    ['format','Format','select',['Short video','Carousel','Written post','Live conversation','Not sure yet']],
    ['lead','Would you like to lead it?','select',['Yes, I’d like to lead it','I’d help someone else lead it','I’m just sharing the idea']],
    ['support','What help would you like?','textarea',false]]},
  collab:{title:'Join a collaboration',intro:'Find a way to contribute that feels like you. Prepare your interest message for an open project.',fields:[
    ['title','Your name or professional name','text',true],
    ['expertise','Your expertise','text',true],
    ['role','How would you like to contribute?','select',['Share an expert tip','Co-create a video','Join a conversation','Review educational content','Help with storytelling']],
    ['interest','What would you love to work on?','textarea',true],
    ['availability','Availability or preferred timing','text',false],
    ['portfolio','Portfolio or example link (optional)','url',false]]},
  submit:{title:'Submit your content',intro:'Package your work with the context the team needs to review it.',fields:[
    ['title','Content title','text',true],
    ['format','Content format','select',['Video or Reel','Image or carousel','Written post','Other']],
    ['url','Link to your content','url',true],
    ['caption','Suggested caption','textarea',true,{max:2200,hint:'Instagram captions can be up to 2,200 characters.'}],
    ['credit','Creator credit or social handle','text',true],
    ['alt','Captions, transcript, or image description','textarea',true],
    ['notes','Anything the reviewer should know?','textarea',false]]},
  share:{title:'Share the love',intro:'Celebrate a published Squad project or invite someone into the conversation.',fields:[
    ['tone','Message style','select',['Warm invitation','Helpful resource','Community appreciation']],
    ['personal','Add a personal note (optional)','textarea',false]]}
};

const $ = s => document.querySelector(s);
const modal = $('#modal');
const title = $('#modal-title');
const body = $('#modal-body');
const status = $('#status');
const memoryDrafts = new Map();
let activeFlow = null;
let draftDirty = false;
let opener = null;
let ideaFilter = 'all';
const allProjects = [...content.activeCollaborations, ...content.completedCollaborations];

/* ---------- Helpers ---------- */
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function publicUrl(value) { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
/* Images: a full https:// link, or a file in this repo's images/ folder. */
function imageUrl(value) { const v = String(value || '').trim(); return /^images\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(v) ? v : publicUrl(v); }
function dateValid(value) { if(!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false; const date = new Date(value+'T12:00:00Z'); return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value; }
function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:content.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function upcoming(value) { return dateValid(value) && value >= today(); }
const fmt = (value, opts) => new Intl.DateTimeFormat('en-US',{timeZone:'UTC',...opts}).format(new Date(value+'T12:00:00Z'));
const dateLabel = value => fmt(value,{month:'short',day:'numeric',year:'numeric'});
const shortDate = value => dateValid(value) ? fmt(value,{month:'short',day:'numeric'}) : '';
const isPublished = p => p.status === 'published' && !!publicUrl(p.publishedReelUrl);
const openProjects = () => content.activeCollaborations.filter(p => p.status === 'casting' && (!p.submissionDeadline || upcoming(p.submissionDeadline)));
const publishedProjects = () => allProjects.filter(isPublished);
const ideas = () => content.ideas || [];
const seriesById = id => SERIES.find(s => s.id === id);
const tintOf = color => TINTS.includes(color) ? color : 'linen';
const tintFor = idea => tintOf(seriesById(idea.series)?.color);
const stageKey = s => STAGES[s] ? s : 'idea';
const credits = list => (Array.isArray(list) ? list : []).map(x => typeof x === 'string' ? x : x?.name).filter(Boolean);
/* Accepts 'handle', '@handle' or an instagram.com profile link. Returns the bare handle or ''. */
function instagramHandle(value) {
  const raw = String(value || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(raw) ? raw : '';
}
const instagramLink = value => { const h = instagramHandle(value); return h ? `<a class="text-button insta" href="https://www.instagram.com/${h}/" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML('@'+h+' on Instagram')}">@${escapeHTML(h)} ↗</a>` : ''; };
const initials = name => name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
function byline(item) { const who = credits(item.credit); return [who.length ? 'Suggested by '+who.join(' & ') : '', shortDate(item.date)].filter(Boolean).join(' · '); }
function externalLink(url,label,cls='button') { const safe = publicUrl(url); return safe ? `<a class="${cls}" href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>` : ''; }
function emptyState(heading,text,actions='',icon=ICON.spark) { return `<div class="empty-state"><span class="empty-art">${icon}</span><div><strong>${escapeHTML(heading)}</strong>${text?`<p>${escapeHTML(text)}</p>`:''}${actions?`<div class="button-row">${actions}</div>`:''}</div></div>`; }
function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key,value) { try { localStorage.setItem(key,value); return true; } catch { return false; } }
function submissionHelp() {
  const link = externalLink(content.submissionInstructionsUrl,'Open folder instructions in Disco','button secondary');
  return link ? `<div class="flow-note"><strong>Have footage to upload?</strong><p>Open the folder instructions in Disco, upload your content there, then paste its shareable link below. Check that the reviewer can open it.</p>${link}</div>` : '';
}

/* "New" badges: ideas dated after this browser's previous visit. */
const lastVisit = storageGet('totsquad-last-visit') || '';
const isNew = d => !!lastVisit && dateValid(d) && d > lastVisit;

/* ---------- Page sections ---------- */
function renderCasting() {
  const casting = openProjects();
  $('#casting-projects').innerHTML = casting.length ? casting.map(p => `<article class="casting">
    <div class="casting-art">${imageUrl(p.thumbnail) ? `<img src="${escapeHTML(imageUrl(p.thumbnail))}" alt="">` : ICON.people}</div>
    <div class="casting-copy"><span class="chip">Accepting participants</span><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description || 'Project details to come.')}</p>
    ${dateValid(p.submissionDeadline) ? `<time datetime="${p.submissionDeadline}">Due ${dateLabel(p.submissionDeadline)} · ${escapeHTML(content.timeZone)}</time>` : '<p class="quiet">Deadline not announced</p>'}
    <p><strong>What to film</strong><br>${escapeHTML(p.instructions || 'Filming instructions have not been configured.')}</p>
    <div class="button-row"><button class="button" data-action="collab" data-project="${escapeHTML(p.id)}">Prepare interest message</button>${externalLink(p.discussionUrl,'Project discussion','button secondary')}</div></div></article>`).join('')
    : emptyState('Something fun is in the works!','No collaborations are casting right now. Find an idea to lead, or pitch the next one.','<a class="button secondary" href="#ideas">Browse the Idea Bank</a><button class="button" data-action="pitch">Pitch an idea</button>', ICON.people);
}

function ideaCard(i) {
  const s = seriesById(i.series); const stage = stageKey(i.stage);
  return `<article class="idea-card tint-${tintFor(i)}">
    <div class="idea-top"><span class="chip series">${escapeHTML(s ? s.label : 'Idea')}</span>${isNew(i.date) ? '<span class="chip new">New</span>' : ''}</div>
    <h3>${escapeHTML(i.title)}</h3>${i.titleNote ? `<p class="idea-note">${escapeHTML(i.titleNote)}</p>` : ''}
    <p>${escapeHTML(i.summary || 'Details to come. Ask about it in Disco.')}</p>
    <div class="idea-meta"><span class="stage stage-${stage}">${STAGES[stage]}</span>${byline(i) ? `<span>${escapeHTML(byline(i))}</span>` : ''}</div>
    <button class="text-button" data-action="idea" data-id="${escapeHTML(i.id)}">Open idea <span aria-hidden="true">→</span></button>
  </article>`;
}
function renderIdeas() {
  const all = ideas();
  const count = id => id === 'all' ? all.length : all.filter(i => i.series === id).length;
  const people = new Set(all.flatMap(i => credits(i.credit)));
  $('#idea-summary').textContent = all.length ? `${all.length} ideas from ${people.size} specialists.` : '';
  if (ideaFilter !== 'all' && !count(ideaFilter)) ideaFilter = 'all';
  const filters = [{id:'all',label:'All'}, ...SERIES.filter(s => count(s.id))];
  $('#idea-filters').innerHTML = all.length ? filters.map(f => `<button type="button" class="filter" data-filter="${escapeHTML(f.id)}" aria-pressed="${ideaFilter === f.id}">${escapeHTML(f.label)} <span class="count">${count(f.id)}</span></button>`).join('') : '';
  const shown = ideaFilter === 'all' ? all : all.filter(i => i.series === ideaFilter);
  $('#idea-grid').innerHTML = shown.length ? shown.map(ideaCard).join('') : emptyState('The Idea Bank is open.','Pitch an idea and it can appear here once the team has reviewed it.','<button class="button" data-action="pitch">Pitch an idea</button>', ICON.bulb);
}

function productionItems() {
  const fromProjects = content.activeCollaborations.filter(p => ['idea','filming','editing'].includes(p.status))
    .map(p => ({title:p.title, stage:p.status, who:credits(p.participatingSpecialists), whoLabel:'Team', date:p.submissionDeadline, url:p.discussionUrl}));
  const fromIdeas = ideas().filter(i => ['filming','editing'].includes(i.stage))
    .map(i => ({title:i.title, stage:i.stage, who:i.lead ? [i.lead] : [], whoLabel:'Lead', date:i.dueDate, id:i.id}));
  return [...fromProjects, ...fromIdeas];
}
function laneItem(x) {
  return `<article class="lane-item"><strong>${escapeHTML(x.title)}</strong>${x.who.length ? `<span>${x.whoLabel}: ${escapeHTML(x.who.join(', '))}</span>` : '<span class="quiet">Lead to be confirmed</span>'}${dateValid(x.date) ? `<time datetime="${x.date}">Due ${dateLabel(x.date)}</time>` : ''}${x.id ? `<button class="text-button" data-action="idea" data-id="${escapeHTML(x.id)}">Details</button>` : externalLink(x.url,'Discussion','text-button')}</article>`;
}
function renderProduction() {
  const items = productionItems();
  const lanes = [['idea','Planning'],['filming','Filming'],['editing','Editing']];
  $('#production-board').innerHTML = items.length
    ? `<div class="board">${lanes.map(([key,label]) => { const list = items.filter(x => x.stage === key); return `<section class="lane" aria-label="${label}"><h3>${label} <span>${list.length}</span></h3>${list.length ? list.map(laneItem).join('') : '<p class="lane-empty">Nothing here yet.</p>'}</section>`; }).join('')}</div>`
    : emptyState('Nothing in production yet.','Pick an idea from the Idea Bank and raise your hand to lead it. It will show up here as it moves from planning to filming to editing.','<a class="button secondary" href="#ideas">Find an idea to lead</a>');
}

function poster(p,label) {
  const src = imageUrl(p.thumbnail);
  return `<div class="poster">${src ? `<img src="${escapeHTML(src)}" alt="" loading="lazy">` : `<span class="play">${ICON.play}</span>`}<span class="chip">${escapeHTML(label)}</span></div>`;
}
function renderGallery() {
  const gallery = content.completedCollaborations;
  $('#project-gallery').innerHTML = gallery.length ? gallery.map((p,i) => {
    const linked = ideas().find(x => x.id === p.ideaId);
    const tint = linked ? tintFor(linked) : TINTS[i % TINTS.length];
    const label = isPublished(p) ? 'Published' : (p.status && p.status !== 'published' ? STAGES[stageKey(p.status)] : 'Details coming');
    const who = credits(p.participatingSpecialists);
    return `<article class="project-card tint-${tint}">${poster(p,label)}<h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description || 'Project description to come.')}</p><p class="quiet">${who.length ? 'Featuring '+escapeHTML(who.join(', ')) : 'Contributor credits to come.'}</p><div class="button-row">${isPublished(p) ? externalLink(p.publishedReelUrl,'Watch the Reel')+`<button class="button secondary" data-action="share" data-project="${escapeHTML(p.id)}">Share</button>` : ''}${linked ? `<button class="text-button" data-action="idea" data-id="${escapeHTML(linked.id)}">See the format</button>` : ''}</div></article>`;
  }).join('') : emptyState('Squad projects will appear here.','Finished collaborations show up once their details are ready.');
}

const REGIONS = ['East','Central','West'];
const regionBadge = r => REGIONS.includes(r) ? `<span class="region region-${r.toLowerCase()}">${r}</span>` : '';
function renderLeader() {
  const p = content.leader;
  if (!p || !p.name) { $('#squad-leader').innerHTML = ''; return; }
  const photo = imageUrl(p.photo);
  $('#squad-leader').innerHTML = `<article class="leader">${photo ? `<img class="avatar" src="${escapeHTML(photo)}" alt="">` : `<span class="avatar" aria-hidden="true">${escapeHTML(initials(p.name))}</span>`}
    <div class="leader-copy"><span class="chip">Leader spotlight</span><h3>${escapeHTML(p.name)}</h3>${p.title ? `<p class="role">${escapeHTML(p.title)}</p>` : ''}${p.aka ? `<p class="aka">${escapeHTML(p.aka)}</p>` : ''}${p.bio ? `<p>${escapeHTML(p.bio)}</p>` : ''}${p.spotlight ? `<p>${escapeHTML(p.spotlight)}</p>` : ''}
    <div class="person-links">${instagramLink(p.instagram)}${externalLink(p.link,'Profile','text-button')}</div></div></article>`;
}
function renderSquad() {
  renderLeader();
  const people = (content.featuredSpecialists || []).map(p => typeof p === 'string' ? {name:p} : p).filter(p => p && p.name);
  $('#squad-grid').innerHTML = people.length ? people.map((p,i) => {
    const photo = imageUrl(p.photo); const role = [p.expertise, p.location].filter(Boolean).join(' · ');
    return `<article class="person tint-${TINTS[i % TINTS.length]}">${photo ? `<img class="avatar" src="${escapeHTML(photo)}" alt="">` : `<span class="avatar" aria-hidden="true">${escapeHTML(initials(p.name))}</span>`}
      <div class="person-head"><h3>${escapeHTML(p.name)}</h3>${regionBadge(p.region)}</div>${role ? `<p class="role">${escapeHTML(role)}</p>` : ''}${p.bio ? `<p class="bio">${escapeHTML(p.bio)}</p>` : ''}${p.spotlight ? `<p>${escapeHTML(p.spotlight)}</p>` : ''}
      <div class="person-links">${instagramLink(p.instagram)}${externalLink(p.link,'Profile','text-button')}</div></article>`;
  }).join('') : emptyState('Specialist spotlights are coming soon.','');
}

function nextOccurrence(weekday) {
  const d = new Date(today()+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0,10);
}
function renderWeek() {
  const events = content.recurringEvents || [];
  $('#week-events').innerHTML = events.length ? events.map(e => {
    const weekly = Number.isInteger(e.weekday) && e.weekday >= 0 && e.weekday <= 6;
    const next = weekly ? nextOccurrence(e.weekday) : '';
    const when = weekly ? `<time datetime="${next}">${next === today() ? 'Today' : fmt(next,{weekday:'short',month:'short',day:'numeric'})}</time>` : escapeHTML(e.scheduleNote || 'Schedule to come');
    return `<div class="event"><div class="event-head"><strong>${escapeHTML(e.title)}</strong><span class="event-when">${when}</span></div>${weekly ? `<p>Every ${WEEKDAYS[e.weekday]}${e.time ? ' · '+escapeHTML(e.time) : ''}</p>` : ''}${e.description ? `<p>${escapeHTML(e.description)}</p>` : ''}${externalLink(e.url,'Join in Disco','text-button')}</div>`;
  }).join('') : '<p class="quiet">Recurring Squad events will appear here.</p>';
}

function renderWays() {
  $('#ways').innerHTML = (content.waysOfWorking || []).map(w => `<li><strong>${escapeHTML(w.title)}</strong>${w.text ? `<span>${escapeHTML(w.text)}</span>` : ''}${byline(w) ? `<small>${escapeHTML(byline(w))}</small>` : ''}</li>`).join('');
}

function renderDeadlines() {
  const deadlines = [...content.activeCollaborations.filter(p => p.status !== 'published').map(p => ({id:p.id,title:p.title,date:p.submissionDeadline,url:p.discussionUrl})), ...content.upcomingDeadlines].filter(d => upcoming(d.date)).sort((a,b) => a.date.localeCompare(b.date));
  const unique = deadlines.filter((d,i) => deadlines.findIndex(x => x.id === d.id && x.date === d.date) === i);
  $('#deadlines').innerHTML = unique.length ? unique.map(d => `<div class="deadline-item"><strong>${escapeHTML(d.title)}</strong><time datetime="${d.date}">${dateLabel(d.date)} · ${escapeHTML(content.timeZone)}</time>${externalLink(d.url,'View details','text-button')}</div>`).join('') : '<p class="quiet">No deadlines have been announced. New dates show up here first.</p>';
}

function renderResources() {
  $('#resource-links').innerHTML = content.resources.map(r => r.action
    ? `<button class="linkrow" data-action="${escapeHTML(r.action)}">${escapeHTML(r.label)} <span aria-hidden="true">→</span></button>`
    : publicUrl(r.url) ? externalLink(r.url,r.label,'linkrow')
    : `<div class="linkrow" aria-disabled="true"><span>${escapeHTML(r.label)}</span><small>${escapeHTML(r.unavailableLabel || 'Not configured')}</small></div>`).join('');
}

function renderContent() {
  document.body.classList.toggle('embed', new URLSearchParams(location.search).get('embed') === '1');
  $('#welcome').hidden = storageGet('totsquad-welcome-dismissed') === '1';
  renderCasting(); renderIdeas(); renderProduction(); renderGallery(); renderSquad();
  renderWeek(); renderWays(); renderDeadlines(); renderResources();
  storageSet('totsquad-last-visit', today());
}

/* ---------- Drafts ---------- */
function persistDraft(action,data) {
  const draft = {...data, _savedAt:new Date().toISOString()};
  memoryDrafts.set(action,draft);
  return storageSet('totsquad-'+action+'-v2', JSON.stringify(draft));
}
/* Autosave: called on every edit and whenever the dialog closes or switches flows. */
function stash() {
  const form = $('#flow-form');
  if (!activeFlow || !form || !draftDirty) return;
  const saved = persistDraft(activeFlow, Object.fromEntries(new FormData(form)));
  draftDirty = false;
  status.textContent = saved ? 'Draft saved on this device. Nothing has been submitted.' : 'Browser storage is unavailable. Your draft is kept for this page session; copy or download it before leaving.';
}
function loadDraft(action) {
  if (memoryDrafts.has(action)) return memoryDrafts.get(action);
  try { const d = JSON.parse(localStorage.getItem('totsquad-'+action+'-v2')); return d && typeof d === 'object' ? d : {}; }
  catch { status.textContent = 'Browser storage is unavailable. You can still copy or download your draft.'; return {}; }
}
function values() { return Object.fromEntries(new FormData($('#flow-form'))); }
function saveDraft() { draftDirty = true; stash(); }
function hasDraft(action,d) { return flows[action].fields.some(([id,,type]) => ['text','textarea','url'].includes(type) && String(d[id] || '').trim()); }
function downloadText(text,name) {
  const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Download requested. If nothing downloads, use Copy instead. Nothing has been submitted.';
}
async function copyText(text,fallback,done='Copied.') {
  try { await navigator.clipboard.writeText(text); status.textContent = done; }
  catch { if (fallback) { fallback.focus(); fallback.select(); } status.textContent = 'Automatic copying is unavailable. Select the text and copy it manually.'; }
}
function draftText(action,d) {
  const flow = flows[action]; const p = allProjects.find(p => p.id === d.project); const base = ideas().find(i => i.id === d.basedOn);
  let text = flow.title+' — draft\n\n';
  if (p) text += 'Project: '+p.title+'\n\n';
  if (base) text += 'Building on: '+base.title+'\n\n';
  text += flow.fields.map(([id,label]) => label+':\n'+(String(d[id] || '').trim() || '—')).join('\n\n');
  if (action === 'submit') text += '\n\nPermission and privacy checklist: '+(d.permission ? 'Confirmed' : 'Not yet confirmed');
  return text;
}
function shareText(d) {
  const p = publishedProjects().find(p => p.id === d.project); if (!p) return '';
  const intro = {'Warm invitation':'Take a look at this Squad collaboration: ','Helpful resource':'A resource from the Squad: ','Community appreciation':'Celebrating the Squad behind '};
  const who = credits(p.participatingSpecialists);
  return (intro[d.tone] || intro['Warm invitation'])+p.title+'\n\n'+(d.personal ? d.personal+'\n\n' : '')+(who.length ? 'Featuring '+who.join(', ')+'\n\n' : '')+publicUrl(p.publishedReelUrl);
}

/* ---------- Dialog panels ---------- */
function showModal() { if (!modal.open) modal.showModal(); modal.scrollTop = 0; }
function fieldHTML([id,label,type,req,opts={}]) {
  const required = req === true;
  const hasHint = opts.hint || opts.max;
  const described = hasHint ? ` aria-describedby="h-${id}"` : '';
  const labelHTML = `<label for="f-${id}">${escapeHTML(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>`;
  if (type === 'select') return labelHTML+`<select name="${id}" id="f-${id}">${req.map(x => `<option>${escapeHTML(x)}</option>`).join('')}</select>`;
  const max = opts.max || (type === 'textarea' ? 5000 : 500);
  const control = type === 'textarea'
    ? `<textarea name="${id}" id="f-${id}" maxlength="${max}"${required ? ' required' : ''}${described}></textarea>`
    : `<input name="${id}" id="f-${id}" type="${type}" maxlength="${max}"${required ? ' required' : ''}${described}>`;
  const hint = hasHint ? `<p class="hint" id="h-${id}"><span>${escapeHTML(opts.hint || '')}</span>${opts.max ? `<span class="counter" data-for="f-${id}" data-max="${opts.max}"></span>` : ''}</p>` : '';
  return labelHTML+control+hint;
}
function chooseProject(action,selected) {
  const projects = action === 'collab' ? openProjects() : action === 'share' ? publishedProjects() : allProjects;
  return `<label for="project">${action === 'share' ? 'Published project' : 'Collaboration'}</label><select name="project" id="project" ${action === 'collab' || action === 'share' ? 'required' : ''}>${action === 'submit' ? '<option value="">General content (no project)</option>' : ''}${projects.map(p => `<option value="${escapeHTML(p.id)}" ${selected === p.id ? 'selected' : ''}>${escapeHTML(p.title)}</option>`).join('')}</select><div id="project-context" class="quiet"></div>`;
}

function openDrafts() {
  title.textContent = 'Your creative drafts';
  body.innerHTML = '<p>Each block keeps its own draft in this browser.</p><div class="draft-grid">'+Object.entries(flows).map(([k,v]) => {
    const d = loadDraft(k); const saved = d._savedAt ? new Date(d._savedAt) : null;
    const note = hasDraft(k,d) ? (saved && Number.isFinite(saved.getTime()) ? 'Saved '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(saved) : 'Draft in progress') : 'No draft yet';
    const name = hasDraft(k,d) ? (String(d.title || '').trim() || 'Untitled draft') : '';
    return `<button class="draft-card" data-action="${k}"><strong>${escapeHTML(v.title)}</strong>${name ? `<span class="draft-name">${escapeHTML(name)}</span>` : ''}<span>${escapeHTML(note)}</span></button>`;
  }).join('')+'</div>';
  try { const legacy = JSON.parse(localStorage.getItem('totsquad-creative-draft-v1')); if (legacy) { const p = document.createElement('p'); p.textContent = 'Earlier draft: '+(legacy.title || '')+' — '+(legacy.notes || ''); body.append(p); } } catch {}
  showModal();
}

function openIdea(id) {
  const i = ideas().find(x => x.id === id); if (!i) return;
  const s = seriesById(i.series); const stage = stageKey(i.stage);
  const list = (arr,tag='ul') => `<${tag}>${arr.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</${tag}>`;
  const has = arr => Array.isArray(arr) && arr.length;
  const variations = (i.variations || []).map(v => `<li><strong>${escapeHTML(v.title)}</strong>${v.text ? ' — '+escapeHTML(v.text) : ''}${byline(v) ? ` <span class="quiet">(${escapeHTML(byline(v))})</span>` : ''}</li>`).join('');
  const project = allProjects.find(p => p.ideaId === i.id);
  title.textContent = i.title;
  body.innerHTML = `<div class="detail tint-${tintFor(i)}">
    <div class="detail-meta"><span class="chip series">${escapeHTML(s ? s.label : 'Idea')}</span><span class="stage stage-${stage}">${STAGES[stage]}</span>${byline(i) ? `<span>${escapeHTML(byline(i))}</span>` : ''}</div>
    ${i.titleNote ? `<p class="idea-note">${escapeHTML(i.titleNote)}</p>` : ''}
    <p class="lede">${escapeHTML(i.summary || 'Details to come. Ask about it in Disco.')}</p>
    ${has(i.howItWorks) ? '<h3>How it works</h3>'+list(i.howItWorks,'ol') : ''}
    ${has(i.guidance) ? `<h3>Before you film</h3><div class="guidance">${i.guidance.map(escapeHTML).join('<br>')}</div>` : ''}
    ${variations ? `<h3>Variations</h3><ul>${variations}</ul>` : ''}
    ${has(i.notes) ? '<h3>From the conversation</h3>'+list(i.notes) : ''}
    ${has(i.altNames) ? `<h3>Other names considered</h3><p>${escapeHTML(i.altNames.join(' · '))}</p>` : ''}
    ${has(i.questions) ? `<h3>Question bank</h3>${i.questions.map(q => `<div class="question"><span>${escapeHTML(q)}</span><button type="button" class="text-button" data-copy="${escapeHTML(q)}">Copy</button></div>`).join('')}` : ''}
    ${project ? `<h3>On this page</h3><p>${escapeHTML(project.title)} is in Made by the Squad${isPublished(project) ? ' and has a published Reel' : '; details are coming'}.</p>` : ''}
    <p class="quiet">${i.lead ? 'Lead: '+escapeHTML(i.lead) : 'No lead yet. One lead per idea keeps things moving.'}</p>
    <div class="button-row"><button class="button" data-action="pitch" data-idea="${escapeHTML(i.id)}">${i.lead ? 'Build on this idea' : 'Build on it or lead it'}</button>${externalLink(i.discussionUrl || content.discoUrl, i.discussionUrl ? 'Idea discussion' : 'Talk about it in Disco','button secondary')}</div>
  </div>`;
  showModal();
}

function flowNav(action) {
  return '<div class="flow-nav" aria-label="Creative blocks">'+Object.entries(flows).map(([k,v]) => `<button class="flow-tab ${k === action ? 'selected' : ''}" data-action="${k}" ${k === action ? 'aria-current="page"' : ''}>${escapeHTML(v.title)}</button>`).join('')+'</div>';
}
function openFlow(action,data) {
  activeFlow = action; const flow = flows[action]; title.textContent = flow.title;
  const nav = flowNav(action);
  if ((action === 'collab' && !openProjects().length) || (action === 'share' && !publishedProjects().length)) {
    const collab = action === 'collab';
    body.innerHTML = nav+emptyState(collab ? 'Something fun is in the works!' : 'Good things are worth sharing.', collab ? 'No collaborations are accepting participants right now. Check back soon, or browse the Idea Bank for one to lead.' : 'Shareable messages will be available when a completed project has a verified published Reel link.', collab ? '<a class="button secondary" href="#ideas">Browse the Idea Bank</a>' : '')+'<div id="previous-draft"></div>';
    const saved = loadDraft(action);
    if (hasDraft(action,saved)) { const area = $('#previous-draft'); const p = document.createElement('p'); p.textContent = 'You have an earlier local draft. You can download it for your records.'; const b = document.createElement('button'); b.className = 'button secondary'; b.textContent = 'Download earlier draft'; b.onclick = () => downloadText(draftText(action,saved),'tot-squad-'+action+'-draft.txt'); area.append(p,b); }
    showModal(); return;
  }
  const label = action === 'share' ? 'message' : 'draft';
  body.innerHTML = nav+`<ol class="steps"><li id="step-write" aria-current="step">1 · Write</li><li id="step-review">2 · Review &amp; copy</li></ol>
    <form id="flow-form"><p>${escapeHTML(flow.intro)}</p>
      ${action === 'pitch' ? '<input type="hidden" name="basedOn" value=""><div id="based-on" class="based-on" hidden></div>' : chooseProject(action,data.project)}
      ${action === 'submit' ? submissionHelp() : ''}
      ${flow.fields.map(fieldHTML).join('')}
      ${action === 'submit' ? '<div class="flow-note"><strong>Before you share</strong><p>Use a link the reviewer can access. Credit collaborators and provide captions or an image description. Keep private client information out.</p><label class="check"><input type="checkbox" name="permission" required> I have permission to share this content and have checked it for private information.</label></div>' : ''}
      <div class="form-actions"><button class="button" type="submit">${action === 'share' ? 'Build my message' : 'Review my draft'}</button><button class="button secondary" type="button" id="save-draft">Save draft</button><button class="button secondary" type="button" id="download-draft">Download</button><button class="button secondary" type="button" id="clear-draft">Clear</button></div>
      <p class="quiet">Drafts stay in this browser. Nothing is sent automatically.</p>
    </form>
    <section id="review" hidden><p>${action === 'share' ? 'Here’s your message. Copy it and share it wherever you like.' : 'Check your draft, copy it, then paste it into the right Disco discussion.'}</p>
      <textarea id="review-output" aria-label="${action === 'share' ? 'Shareable message' : 'Draft preview'}" readonly></textarea>
      <div class="form-actions"><button class="button" type="button" id="copy-review">Copy ${label}</button><button class="button secondary" type="button" id="edit-draft">← Edit</button><button class="button secondary" type="button" id="download-review">Download</button><span id="disco-handoff"></span></div>
      ${action === 'share' ? '<p class="quiet">Copy your message, then paste it wherever you want to share the Reel. Nothing is posted automatically.</p>' : '<ol class="handoff-steps"><li>Review and copy your draft.</li><li>Open the Disco discussion.</li><li>Paste your draft, check it, and send it in Disco.</li></ol><p class="quiet">Opening Disco does not submit your draft. Your text stays here until you copy and post it.</p>'}
    </section>`;

  const form = $('#flow-form'); const review = $('#review'); const output = $('#review-output');
  const saved = loadDraft(action);
  for (const el of form.elements) {
    if (!el.name || saved[el.name] == null) continue;
    if (el.type === 'checkbox') el.checked = !!saved[el.name];
    else if (el.tagName !== 'SELECT' || [...el.options].some(o => o.value === saved[el.name])) el.value = saved[el.name];
  }
  if (data.project && form.elements.project && [...form.elements.project.options].some(o => o.value === data.project)) form.elements.project.value = data.project;
  if (data.idea && form.elements.basedOn) {
    const base = ideas().find(i => i.id === data.idea);
    if (base) { form.elements.basedOn.value = base.id; const s = seriesById(base.series); if (s && form.elements.series) form.elements.series.value = s.label; draftDirty = true; stash(); }
  }

  const showBase = () => { const el = $('#based-on'); if (!el) return; const base = ideas().find(i => i.id === form.elements.basedOn.value); el.hidden = !base; el.textContent = base ? 'Building on: '+base.title : ''; };
  const context = () => { const select = form.elements.project; if (!select) return; const p = allProjects.find(p => p.id === select.value); const text = p ? [p.description, p.instructions, dateValid(p.submissionDeadline) ? 'Deadline: '+dateLabel(p.submissionDeadline) : ''].filter(Boolean).join(' · ') : ''; $('#project-context').innerHTML = p ? (text ? `<p>${escapeHTML(text)}</p>` : '')+externalLink(p.discussionUrl,'Read project discussion','text-button') : ''; };
  const counters = () => form.querySelectorAll('.counter').forEach(c => { const n = form.querySelector('#'+c.dataset.for).value.length; const max = Number(c.dataset.max); c.textContent = n.toLocaleString('en-US')+' / '+max.toLocaleString('en-US'); c.classList.toggle('near', n > max * 0.9); });
  const setStep = reviewing => {
    form.hidden = reviewing; review.hidden = !reviewing;
    $('#step-write').toggleAttribute('aria-current', !reviewing); $('#step-review').toggleAttribute('aria-current', reviewing);
    if (reviewing) { $('#step-review').setAttribute('aria-current','step'); output.focus(); } else { $('#step-write').setAttribute('aria-current','step'); }
    modal.scrollTop = 0;
  };
  showBase(); context(); counters();

  form.oninput = () => { draftDirty = true; stash(); context(); counters(); };
  form.onsubmit = e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    for (const el of form.querySelectorAll('[required]:not([type=checkbox])')) if (!el.value.trim()) { el.focus(); status.textContent = 'Complete the required fields.'; return; }
    for (const el of form.querySelectorAll('input[type=url]')) if (el.value && !publicUrl(el.value)) { el.focus(); status.textContent = 'Use a complete https:// or http:// link.'; return; }
    const d = values(); const p = allProjects.find(p => p.id === d.project);
    if (action === 'collab' && !openProjects().some(p => p.id === d.project)) { status.textContent = 'Choose a currently open collaboration.'; return; }
    if (action === 'share' && !publishedProjects().some(p => p.id === d.project)) { status.textContent = 'Choose a published project.'; return; }
    output.value = action === 'share' ? shareText(d) : draftText(action,d);
    const base = ideas().find(i => i.id === d.basedOn);
    const discussion = publicUrl(p?.discussionUrl) || publicUrl(base?.discussionUrl);
    $('#disco-handoff').innerHTML = action === 'share' ? '' : externalLink(discussion || content.discoUrl, discussion ? 'Open the discussion' : 'Open Social & Sharing chat');
    setStep(true);
    status.textContent = 'Ready for your review. Nothing has been sent.';
  };
  $('#edit-draft').onclick = () => { setStep(false); form.querySelector('input:not([type=hidden]),textarea,select')?.focus(); status.textContent = ''; };
  $('#save-draft').onclick = saveDraft;
  $('#download-draft').onclick = () => downloadText(draftText(action,values()),'tot-squad-'+action+'-draft.txt');
  $('#copy-review').onclick = () => copyText(output.value, output, action === 'share' ? 'Message copied. Paste it where you want to share the Reel.' : 'Draft copied. Open the Disco discussion, paste it, and send it there.');
  $('#download-review').onclick = () => downloadText(output.value,'tot-squad-'+action+'.txt');
  $('#clear-draft').onclick = () => {
    memoryDrafts.delete(action);
    try { localStorage.removeItem('totsquad-'+action+'-v2'); status.textContent = 'Draft cleared from this device.'; } catch { status.textContent = 'Current form cleared; browser storage could not be cleared.'; }
    draftDirty = false; form.reset(); showBase(); context(); counters(); setStep(false);
  };
  showModal();
}

function openPanel(action,data={}) {
  stash(); activeFlow = null; status.textContent = ''; body.replaceChildren();
  if (action === 'drafts') return openDrafts();
  if (action === 'idea') return openIdea(data.id);
  if (flows[action]) return openFlow(action,data);
  const item = info[action]; if (!item) return;
  title.textContent = item[0]; body.innerHTML = item[1]; showModal();
}

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const filter = t.closest('[data-filter]');
  if (filter) { ideaFilter = filter.dataset.filter; renderIdeas(); document.querySelector(`[data-filter="${CSS.escape(ideaFilter)}"]`)?.focus(); return; }
  const dismiss = t.closest('[data-dismiss]');
  if (dismiss) { const el = document.getElementById(dismiss.dataset.dismiss); if (el) el.hidden = true; storageSet('totsquad-welcome-dismissed','1'); return; }
  const copy = t.closest('[data-copy]');
  if (copy) { copyText(copy.dataset.copy); return; }
  const action = t.closest('[data-action]');
  if (action) { if (!modal.open) opener = action; openPanel(action.dataset.action, {...action.dataset}); return; }
  if (modal.open && t.closest('a[href^="#"]')) modal.close();
});
$('#modal .close').onclick = () => modal.close();
modal.addEventListener('cancel', stash);
modal.addEventListener('close', () => { stash(); opener?.focus(); });
modal.addEventListener('click', e => { if (e.target === modal) { const r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) modal.close(); } });
renderContent();
