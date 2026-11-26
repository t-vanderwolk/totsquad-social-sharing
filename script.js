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
/* Ideas come live from the Creators Club ideas sheet once a creator is signed in (loadIdeas); content.js is the fallback. */
let liveIdeas = null;
// The Idea Bank lives in a sheet: until it answers, show a loading state, never the empty "Add an idea" state.
let ideasState = 'idle'; // idle | loading | done | failed
const ideasPending = () => !liveIdeas && ['idle','loading'].includes(ideasState) && UPLOAD_ON() && !!mentorKey() && typeof fetch === 'function';
// Expanded concepts from content.js fill in whatever an idea doesn't have yet (edits in the app always win).
const withConcept = i => { const x = (content.ideaConcepts || {})[i.id]; if (!x) return i; const o = {...i};
  if (!o.concept && x.concept) o.concept = x.concept;
  if (!o.example && x.example) o.example = x.example;
  ['howItWorks','guidance'].forEach(k => { if (!(Array.isArray(o[k]) && o[k].length) && Array.isArray(x[k])) o[k] = x[k]; });
  return o; };
const ideas = () => (liveIdeas || content.ideas || []).map(withConcept);
const leadsOf = i => String(i.lead || '').split(/\s*&\s*/).map(s => s.trim()).filter(Boolean);
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
const instagramLink = value => { const h = instagramHandle(value); return h ? `<a class="text-button insta" href="https://www.instagram.com/${h}/" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML('@'+h+' on Instagram')}" title="${escapeHTML('@'+h)}"><svg class="ig" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg><span>@${escapeHTML(h)}</span></a>` : ''; };
const initials = name => name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
function byline(item) { const who = credits(item.credit); return [who.length ? 'Suggested by '+who.join(' & ') : '', shortDate(item.date)].filter(Boolean).join(' · '); }
/* Hub links open in the hub itself when the page is embedded in Disco; everything else opens a new tab. */
const HUB_HOST = 'tot-squad-hub.disco.co';
const inHub = url => { try { return new URL(url).host === HUB_HOST; } catch { return false; } };
function externalLink(url,label,cls='button') {
  const safe = publicUrl(url); if (!safe) return '';
  const embedded = new URLSearchParams(location.search).get('embed') === '1';
  return embedded && inHub(safe)
    ? `<a class="${cls}" href="${escapeHTML(safe)}" target="_top" data-mentor>${escapeHTML(label)}</a>`
    : `<a class="${cls}" href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>`;
}
function emptyState(heading,text,actions='',icon=ICON.spark) { return `<div class="empty-state"><span class="empty-art">${icon}</span><div><strong>${escapeHTML(heading)}</strong>${text?`<p>${escapeHTML(text)}</p>`:''}${actions?`<div class="button-row">${actions}</div>`:''}</div></div>`; }
function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key,value) { try { localStorage.setItem(key,value); return true; } catch { return false; } }
function submissionHelp() {
  const folder = UPLOAD_ON() ? uploadButton('Upload your clips','collab') : externalLink(content.submissionFolderUrl,'Open the submission folder','button');
  const steps = externalLink(content.submissionInstructionsUrl,'Folder instructions in Disco','button secondary');
  return folder || steps ? `<div class="flow-note"><strong>Have footage to upload?</strong><p>${UPLOAD_ON() ? 'Upload your clips here. They go straight into the Squad’s Drive, so there’s no link to paste.' : 'Upload your content to the submission folder, then paste its shareable link below. Check that the reviewer can open it.'}</p><div class="button-row">${folder}${steps}</div></div>` : '';
}

/* "New" badges: ideas dated after this browser's previous visit. */
const lastVisit = storageGet('totsquad-last-visit') || '';
const isNew = d => !!lastVisit && dateValid(d) && d > lastVisit;

/* Two pages share this script: index.html and ideas.html. Links between them keep ?embed=1. */
const EMBED = new URLSearchParams(location.search).get('embed') === '1';
// panel=1: this page is open inside the toolkit panel on top of the Creators Club (see openTool).
const PANEL = new URLSearchParams(location.search).get('panel') === '1';
const pageUrl = file => file + (EMBED ? (file.includes('?') ? '&' : '?') + 'embed=1' + (PANEL ? '&panel=1' : '') : '');
const IDEAS_URL = pageUrl('ideas.html');
const has = sel => !!document.querySelector(sel);

/* ---------- Page sections ---------- */
/* Disco profiles: `disco` on a Squad member is the link copied from their Disco profile (it has drawerProfileId in it).
   The profile opens over the Social & Sharing chat, where Disco's Message button starts a DM. */
function discoProfile(person) {
  const raw = person && publicUrl(person.disco); if (!raw || !inHub(raw)) return '';
  const id = new URL(raw).searchParams.get('drawerProfileId'); if (!id) return '';
  const base = publicUrl(content.discoUrl) && inHub(content.discoUrl) ? new URL(content.discoUrl) : new URL(raw);
  base.search = ''; base.hash = ''; base.searchParams.set('drawerProfileId', id); base.searchParams.set('profileSettingsTab', 'profile');
  return base.href;
}
function squadPerson(name) {
  const first = String(name || '').trim().split(/\s+/)[0].toLowerCase(); if (!first) return null;
  return [content.leader, ...(content.featuredSpecialists || [])].find(p => p && typeof p === 'object' && String(p.name || '').toLowerCase() === first) || null;
}
const messageLead = (name, cls = 'button secondary') => { const url = discoProfile(squadPerson(name)); return url ? externalLink(url, `Message ${String(name).trim().split(/\s+/)[0]}`, cls) : ''; };
const chatLink = (url, cls = 'text-button') => externalLink(publicUrl(url) || content.discoUrl, 'Tell the Squad in chat', cls);

/* ---------- Casting calls posted by creators (apps-script/upload.gs: ?action=casting, call-save, call-status) ----------
   Creators Club calls show only to signed-in creators. Public calls show to everyone once a coordinator approves them. */
let liveCalls = [];
const callProject = c => ({ id: c.id, title: c.title, lead: c.lead, description: c.description, instructions: c.instructions, status: 'casting', submissionDeadline: c.deadline, posted: true, call: c,
  openCall: { filmTitle: 'Film your part', steps: (c.steps || []).length ? c.steps : [c.instructions].filter(Boolean), questions: c.questions || [] } });
const callProjects = () => liveCalls.filter(c => c.open !== false).map(callProject);
const castingProjects = () => [...openProjects(), ...callProjects()];
const projectById = id => allProjects.find(p => p.id === id) || liveCalls.map(callProject).find(p => p.id === id);
const myCalls = () => liveCalls.filter(c => c.mine);
async function loadCalls() {
  if (!UPLOAD_ON() || typeof fetch !== 'function') return;
  const key = mentorKey(), coord = isCoord() ? storageGet(COORD_CODE_KEY) : '';
  try {
    const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=casting${key ? '&key=' + encodeURIComponent(key) : ''}${coord ? '&coord=' + encodeURIComponent(coord) : ''}`); const data = await res.json();
    if (data.ok && Array.isArray(data.calls)) { liveCalls = data.calls; rerenderCalls(); }
  } catch {}
}
function rerenderCalls() {
  if (has('#casting-projects')) renderCasting();
  if (typeof renderDashboard === 'function' && has('#club-dash')) renderDashboard(); // club.js
  if (modal.open && title.textContent === 'My ideas') openMyIdeas();
}
function upsertCall(c) { const at = liveCalls.findIndex(x => x.id === c.id); if (at >= 0) liveCalls[at] = c; else liveCalls.unshift(c); rerenderCalls(); }
// Who each call is for, in the words a specialist would use.
function whoLabel(p) {
  const open = '<span class="who who-open">Open to Tot Squad specialists · no sign-in</span>', member = t => `<span class="who who-member">${t}</span>`;
  if (!p.posted) return p.openCall ? open : member('Creators Club members');
  if (p.call.audience !== 'public') return member('Creators Club only');
  return p.call.review === 'waiting' ? member('Creators Club for now · public once approved') : open;
}
// The first sentence of a longer note: casting cards show one line of what to film; the call itself has the rest.
const firstSentence = t => { const m = String(t || '').trim().match(/^.+?[.!?](?=\s|$)/); return m ? m[0] : String(t || '').trim(); };
/* Illustrations for the public page (one style: 3px round strokes in the card's ink colour, white fills, a dashed
   9:16 guide where framing matters). All decorative: every direction they show is also written out as text. */
const svgArt = (vb, inner, cls = '') => `<svg class="art ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const artGuide = (x, y, w = 72, h = 128) => `<rect class="art-guide" x="${x}" y="${y}" width="${w}" height="${h}" rx="9" stroke-width="2.5" stroke-dasharray="7 6"/>`;
// A specialist from the chest up, inside a phone frame at (x, y), 72×128. pose: arms; face: mouth.
function artFigure(x, y, { arms = '', face = 'smile', shirt = true } = {}) {
  const cx = x + 36, hy = y + 70;
  const mouth = { smile: `M${cx - 5} ${hy + 4}q5 5 10 0`, grin: `M${cx - 6} ${hy + 3}q6 8 12 0z`, oh: '' }[face] ?? '';
  return `<g>
    <path d="M${x + 12} ${y + 128}v-12q0-22 24-24q24 2 24 24v12" fill="#fff"/>
    ${shirt ? `<path d="M${cx - 6} ${y + 93}l6 7 6-7" stroke-width="2.5"/>` : ''}
    <circle cx="${cx}" cy="${hy}" r="13" fill="#fff"/>
    <circle cx="${cx - 4.5}" cy="${hy - 2}" r="1.6" fill="currentColor" stroke="none"/><circle cx="${cx + 4.5}" cy="${hy - 2}" r="1.6" fill="currentColor" stroke="none"/>
    ${face === 'oh' ? `<circle cx="${cx}" cy="${hy + 6}" r="2.6" stroke-width="2.5"/>` : `<path d="${mouth}" stroke-width="2.5"${face === 'grin' ? ' fill="currentColor"' : ''}/>`}
    ${arms}</g>`;
}
const artSun = (x, y, r = 9) => `<g class="art-sun"><circle cx="${x}" cy="${y}" r="${r}" fill="#f7d36b" stroke="#a8781a" stroke-width="2.5"/><path d="M${x - 3} ${y - 1}h.01M${x + 3} ${y - 1}h.01M${x - 3} ${y + 3}q3 3 6 0" stroke="#a8781a" stroke-width="2"/>${[0,1,2,3,4,5,6,7].map(i => { const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `<path d="M${(x + c * (r + 3)).toFixed(1)} ${(y + s * (r + 3)).toFixed(1)}L${(x + c * (r + 7)).toFixed(1)} ${(y + s * (r + 7)).toFixed(1)}" stroke="#a8781a" stroke-width="2"/>`; }).join('')}</g>`;
const artPhone = (x, y) => `<rect x="${x}" y="${y}" width="72" height="128" rx="10" fill="#ffffff66" stroke-width="2.5"/>`;
const artChevron = (x, y) => `<path d="M${x} ${y - 7}l7 7-7 7" stroke-width="3"/>`;
const ART2 = {
  // Pass the Toy: catch it from one side, smile, pass it out the other side.
  passToy: svgArt('0 0 300 150', `
    ${artPhone(12, 11)}${artFigure(12, 11, { arms: `<path d="M30 112 L24 82"/><circle cx="23" cy="78" r="3.5" fill="#fff" stroke-width="2.5"/>` })}${artSun(18, 66)}<path d="M2 58h-0M4 52h6M2 64h8M4 76h6" stroke-width="2.5"/>
    ${artChevron(92, 75)}
    ${artPhone(114, 11)}${artFigure(114, 11, { face: 'grin', arms: `<path d="M134 128 L138 116"/><path d="M166 128 L162 116"/>` })}${artSun(150, 110, 9)}<circle cx="139" cy="114" r="3.5" fill="#fff" stroke-width="2.5"/><circle cx="161" cy="114" r="3.5" fill="#fff" stroke-width="2.5"/>
    ${artChevron(194, 75)}
    ${artPhone(216, 11)}${artFigure(216, 11, { arms: `<path d="M268 112 L280 84"/><circle cx="281" cy="80" r="3.5" fill="#fff" stroke-width="2.5"/>` })}${artSun(292, 68)}<path d="M296 58h2M294 64h6M296 76h2" stroke-width="2.5"/>`),
  // Point & Answer: leave space above your head; point up a few different ways.
  pointUp: svgArt('0 0 300 150', [
      [12, `<path d="M58 104 L62 52"/><path d="M62 52 l-1 -8" stroke-width="2.5"/>`, 'smile'],
      [114, `<path d="M128 104 L122 54"/><path d="M122 54 l1 -8" stroke-width="2.5"/><path d="M172 104 L178 54"/><path d="M178 54 l-1 -8" stroke-width="2.5"/>`, 'oh'],
      [216, `<path d="M232 104 L226 56"/><path d="M226 56 l2 -8" stroke-width="2.5"/><path d="M234 102 L244 60"/><path d="M244 60 l2 -7" stroke-width="2.5"/>`, 'grin']
    ].map(([x, arms, face], i) => `${artPhone(x, 11)}<rect x="${x + 16}" y="19" width="40" height="22" rx="7" stroke-width="2.5" stroke-dasharray="5 5"/><path d="M${x + 30} 30h12" stroke-width="2.5"/>${artFigure(x, 11, { arms, face })}${i < 2 ? artChevron(x + 80, 75) : ''}`).join('')),
  callGeneric: svgArt('0 0 300 150', `${artPhone(114, 11)}<rect x="128" y="48" width="44" height="34" rx="5" fill="#fff"/><path d="M128 48l6-12h38l-6 12M142 36l-6 12M156 36l-6 12M168 36l-6 12"/><path d="M145 58v14l12-7z" fill="currentColor" stroke="none"/><path d="M136 100h28M140 110h20" stroke-width="2.5"/>`),
  // Wanted B-roll: the shot, with the 9:16 framing guide.
  aisle: svgArt('0 0 240 140', `
    <path d="M14 6v128M14 6l86 40v44l-86 44" fill="#ffffff80"/><path d="M14 38l86 22M14 70l86 14M14 102l86 4" stroke-width="2.5"/>
    <path d="M226 6v128M226 6l-86 40v44l86 44" fill="#ffffff80"/><path d="M226 38l-86 22M226 70l-86 14M226 102l-86 4" stroke-width="2.5"/>
    <path d="M100 90h40M100 46h40" stroke-width="2.5"/><path d="M24 30h10M44 38h10M30 62h12M58 70h8M26 94h12M52 98h10M206 30h10M186 38h10M198 62h12M174 70h8M202 94h12M178 98h10" stroke-width="4"/>
    <path d="M114 14h12M106 24h28" stroke-width="2.5"/>${artGuide(84, 6)}`),
  strollerFold: svgArt('0 0 240 140', `
    <path d="M88 32 L118 108" /><path d="M80 28h16" stroke-width="5"/>
    <path d="M118 108 L168 70" /><path d="M134 96 L176 112"/>
    <path d="M110 76 Q 116 42 150 44 L 164 64 Z" fill="#fff"/><path d="M106 84h52" stroke-width="2.5"/>
    <circle cx="118" cy="114" r="12" fill="#fff"/><circle cx="118" cy="114" r="3" fill="currentColor"/><circle cx="178" cy="116" r="9" fill="#fff"/><circle cx="178" cy="116" r="2.5" fill="currentColor"/>
    <path d="M76 20 q2-6 8-6h8q6 0 7 6l1 10q0 4-4 4H80q-4 0-4-4z" fill="#fff" stroke-width="2.5"/><path d="M84 18v10M90 18v10M96 20v8" stroke-width="2"/><path d="M78 32 q-6 4-8 12" stroke-width="2.5"/>
    <path d="M58 70 q-8 26 18 40" stroke-width="2.5"/><path d="M72 112l6-2-2-6" stroke-width="2.5"/>${artGuide(52, 6)}`),
  seatBase: svgArt('0 0 240 140', `
    <path d="M70 126h108l-7-18H80z" fill="#fff"/><path d="M88 117h72" stroke-width="2.5"/>
    <path d="M74 48 Q 60 100 100 106 H 160 Q 180 104 178 86 L 176 78 Q 146 84 122 74 Q 98 64 94 48 Z" fill="#fff"/>
    <path d="M86 58 Q 80 92 104 96 H 156" stroke-width="2.5"/>
    <path d="M70 54 Q 72 24 104 22 Q 118 24 118 36" fill="#fff" stroke-width="2.5"/>
    <path d="M106 80 Q 130 6 158 84"/><circle cx="106" cy="80" r="3.5" fill="#fff" stroke-width="2.5"/><circle cx="158" cy="84" r="3.5" fill="#fff" stroke-width="2.5"/>
    <path d="M64 108l-8-3M62 116h-9M184 108l8-3M186 116h9" stroke-width="2.5"/>${artGuide(84, 6)}`),
  gearDemo: svgArt('0 0 240 140', `
    <path d="M12 118h216" stroke-width="2.5"/><rect x="176" y="70" width="30" height="48" rx="8" fill="#fff"/><path d="M182 70v-8h18v8M180 86h22" stroke-width="2.5"/>
    <rect x="84" y="6" width="72" height="128" rx="10" fill="#fff"/><path d="M110 12h20" stroke-width="2.5"/>
    <rect x="106" y="48" width="28" height="44" rx="7"/><path d="M111 48v-7h18v7M110 62h20" stroke-width="2.5"/><circle cx="146" cy="22" r="3" fill="#c2453a" stroke="none"/>
    <path d="M84 104 q-14 4-14 16v14M156 104 q14 4 14 16v14" stroke-width="2.5"/>`),
  // Community
  chat: svgArt('0 0 240 100', `
    <path d="M40 18h96a12 12 0 0 1 12 12v26a12 12 0 0 1-12 12H76l-18 14V68H40a12 12 0 0 1-12-12V30a12 12 0 0 1 12-12z" fill="#fff"/>
    <circle cx="66" cy="43" r="3" fill="currentColor" stroke="none"/><circle cx="88" cy="43" r="3" fill="currentColor" stroke="none"/><circle cx="110" cy="43" r="3" fill="currentColor" stroke="none"/>
    <path d="M124 46h76a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12h-8v10l-14-10h-54a12 12 0 0 1-12-12V58a12 12 0 0 1 12-12z" fill="#fff"/>
    <path d="M160 74c-8-5-12-9-12-13 0-3 2-5 5-5 3 0 5 2 7 4 2-2 4-4 7-4 3 0 5 2 5 5 0 4-4 8-12 13z" fill="currentColor" stroke="none"/>`),
  circle: svgArt('0 0 240 100', `
    <circle cx="120" cy="50" r="34" stroke-dasharray="6 7" stroke-width="2.5"/>
    ${[0, 1, 2, 3, 4, 5].map(i => { const a = -Math.PI / 2 + i * Math.PI / 3, x = (120 + Math.cos(a) * 36).toFixed(1), y = (50 + Math.sin(a) * 36).toFixed(1); return `<circle cx="${x}" cy="${y}" r="11" fill="#fff"/><path d="M${x - 4} ${+y + 2}q4 4 8 0" stroke-width="2"/>`; }).join('')}
    <path d="M120 40c.8 6 2.6 8.4 8 10-5.4 1.6-7.2 4-8 10-.8-6-2.6-8.4-8-10 5.4-1.6 7.2-4 8-10z" fill="currentColor" stroke="none"/>`),
};
// Route icons (24px line style, as in the toolkit)
const ROUTE_SVG = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
const ROUTE_ICON = {
  choose: ROUTE_SVG('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8.5l1.6 1.6L12.5 7M14.5 9H16M8 14h8M8 17.5h5"/>'),
  film: ROUTE_SVG('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><circle cx="12" cy="11" r="2.6"/><path d="M10.5 18.5h3"/>'),
  send: ROUTE_SVG('<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>'),
  upload: ROUTE_SVG('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  review: ROUTE_SVG('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20M8 10.5l1.8 1.8 3.2-3.3"/>'),
  library: ROUTE_SVG('<rect x="3" y="4" width="7.5" height="7" rx="1.5"/><rect x="13.5" y="4" width="7.5" height="7" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7" rx="1.5"/>')
};

// Everything a specialist needs before sending: who can join, the deadline, the full filming directions and how to send.
// The card's one-line summary never replaces these; the same facts open the "Film it" step of the cast flow.
function castFacts(p) {
  const who = whoLabel(p).replace(/<[^>]+>/g, '');
  return `<dl class="cast-facts"><div><dt>Who can join</dt><dd>${escapeHTML(who)}</dd></div><div><dt>Due</dt><dd>${dateValid(p.submissionDeadline) ? `<time datetime="${p.submissionDeadline}">${dateLabel(p.submissionDeadline)} · ${escapeHTML(content.timeZone)}</time>` : 'Not announced'}</dd></div></dl>`;
}
function howToSend(p) {
  if (p.openCall && UPLOAD_ON()) return `Use ${(p.openCall.questions || []).length ? 'Film &amp; answer' : 'Send your video'} on this call. It walks you through filming, then you upload your clip here.`;
  return p.lead ? `Message ${escapeHTML(String(p.lead).trim().split(/\s+/)[0])} to take part.` : 'Use the button on this call to take part.';
}
function callDetails(p) {
  const steps = (p.openCall && p.openCall.steps) || [];
  return `<details class="call-more"><summary>Full details</summary><div class="call-more-body">${castFacts(p)}
    ${p.description ? `<p>${escapeHTML(p.description)}</p>` : ''}
    ${p.instructions ? `<p><strong>What to film:</strong> ${escapeHTML(p.instructions)}</p>` : ''}
    ${steps.length && !(steps.length === 1 && steps[0] === p.instructions) ? `<ol class="cast-howto">${steps.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ol>` : ''}
    ${p.openCall && p.openCall.dont ? `<p>${escapeHTML(p.openCall.dont)}</p>` : ''}
    <p><strong>How to send:</strong> ${howToSend(p)}</p></div></details>`;
}
// Casting cards show Reel previews; filming instructions stay in Full details.
function callArt(p, i = 0) {
  const a = p.cardArt || {}; const photo = imageUrl(a.photo || p.thumbnail);
  if (!photo) return '';
  return `<div class="call-art tint-${a.tint || TINTS[(i + 1) % TINTS.length]}"><img class="call-art-photo" src="${escapeHTML(photo)}" alt="${escapeHTML(a.photoAlt || p.title + ' preview')}" loading="lazy"></div>`;
}
function renderCasting() {
  const casting = castingProjects();
  $('#casting-projects').innerHTML = casting.length ? `<div class="call-grid">${casting.map((p, ci) => {
    const primary = p.openCall && UPLOAD_ON() ? `<button class="button" data-action="cast" data-project="${escapeHTML(p.id)}">${(p.openCall.questions || []).length ? 'Film &amp; answer' : 'Send your video'}</button>`
      : messageLead(p.lead, 'button') || `<button class="button" data-action="collab" data-project="${escapeHTML(p.id)}">Prepare interest message</button>`;
    const more = [p.posted && p.call.mine ? `<button class="text-button" type="button" data-action="call-edit" data-call="${escapeHTML(p.id)}">Edit</button>` : '',
      p.openCall && UPLOAD_ON() ? messageLead(p.lead, 'text-button') : UPLOAD_ON() ? uploadButton('Upload your clips','collab',p.id,'text-button') : '',
      externalLink(p.exampleReelUrl, 'Watch an example', 'text-button'), externalLink(p.discussionUrl, 'Project discussion', 'text-button')].filter(Boolean).join('');
    const what = firstSentence(p.instructions) || firstSentence(p.description);
    return `<article class="call-card">${callArt(p, ci)}${whoLabel(p).replace('class="who', 'class="badge who')}<h3>${escapeHTML(p.title)}</h3>
    <dl class="call-meta">${p.lead ? `<div><dt>${p.posted ? 'Posted by' : 'Led by'}</dt><dd>${escapeHTML(p.lead)}</dd></div>` : ''}<div><dt>Due</dt><dd>${dateValid(p.submissionDeadline) ? `<time datetime="${p.submissionDeadline}">${dateLabel(p.submissionDeadline)} · ${escapeHTML(content.timeZone)}</time>` : 'Not announced'}</dd></div></dl>
    ${what ? `<p class="call-what"><span>Film:</span> ${escapeHTML(what)}</p>` : ''}
    ${callDetails(p)}
    <div class="call-actions">${primary}${more ? `<div class="call-links">${more}</div>` : ''}</div></article>`; }).join('')}</div>`
    : emptyState('No calls are open right now.', '', uploadButton('Submit B-roll','broll'), ICON.people);
}

/* Idea Bank art: one original illustration per series. An idea's own `image` (images/ file) replaces it. */
const SVG = (inner) => `<svg viewBox="0 0 240 120" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const SPARKS = '<g stroke-width="2.5"><path d="M30 28v10M25 33h10"/><path d="M208 84v8M204 88h8"/><circle cx="206" cy="30" r="2.5" fill="currentColor"/><circle cx="40" cy="92" r="2" fill="currentColor"/></g>';
const ART = {
  carseat: '<path d="M88 30c18-4 34 6 38 24l8 34H92c-8 0-14-6-14-14V44c0-7 4-12 10-14z"/><path d="M78 92h84M92 92l-8 14M148 92l8 14M126 54h20c8 0 14 6 14 14v6"/>',
  bottle: '<path d="M108 20h24v10h-24zM104 30h32l4 12H100z"/><rect x="98" y="42" width="44" height="62" rx="10"/><path d="M110 60h10M110 74h10M110 88h10"/>',
  buzzer: '<path d="M92 92h56M100 92l6-26h28l6 26"/><path d="M104 66c0-18 32-18 32 0"/><circle cx="120" cy="50" r="5" fill="currentColor"/><path d="M70 40l-12-10M170 40l12-10M66 60H50M174 60h16"/>',
  mic: '<rect x="106" y="18" width="28" height="48" rx="14"/><path d="M94 58c0 18 12 28 26 28s26-10 26-28M120 86v16M104 102h32"/><path d="M112 34h16M112 44h16"/>',
  trophy: '<path d="M96 22h48v22c0 16-10 28-24 28s-24-12-24-28z"/><path d="M96 30H82c0 14 6 20 16 20M144 30h14c0 14-6 20-16 20M120 72v14M102 100h36l-4-14h-28z"/>',
  stroller: '<path d="M78 40h44v34H86c-6 0-8-4-8-8z"/><path d="M122 40c22 0 36 14 36 34h-36z"/><path d="M78 40l-8-12h-10M86 74l-6 16M150 74l6 16"/><circle cx="88" cy="96" r="8"/><circle cx="148" cy="96" r="8"/>',
  heart: '<path d="M120 98C94 80 80 66 80 50c0-12 9-20 20-20 9 0 16 6 20 13 4-7 11-13 20-13 11 0 20 8 20 20 0 16-14 30-40 48z"/><path d="M104 50c0-4 3-7 7-7"/>',
  question: '<path d="M70 28h100a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10h-60l-18 14V84H70a10 10 0 0 1-10-10V38a10 10 0 0 1 10-10z"/><path d="M110 46c0-6 5-10 10-10s10 4 10 9c0 8-10 8-10 15"/><circle cx="120" cy="70" r="2.5" fill="currentColor"/>',
  phone: '<rect x="98" y="16" width="44" height="88" rx="9"/><path d="M114 48v24l20-12z" fill="currentColor"/><path d="M112 96h16"/><path d="M68 44c-8 10-8 22 0 32M172 44c8 10 8 22 0 32"/>',
  clapper: '<rect x="76" y="50" width="88" height="52" rx="6"/><path d="M76 50l4-20 84 0-4 20M96 30l-6 20M118 30l-6 20M140 30l-6 20"/><path d="M112 66v20l16-10z" fill="currentColor"/>',
  clock: '<circle cx="120" cy="60" r="38"/><path d="M120 36v24l16 10"/><path d="M120 22v6M120 92v6M82 60h6M152 60h6"/>',
  moon: '<path d="M134 24a38 38 0 1 0 20 64 32 32 0 0 1-20-64z"/><path d="M158 34v10M153 39h10M168 58v6M165 61h6"/>',
  tiers: '<rect x="72" y="22" width="96" height="22" rx="6"/><rect x="72" y="50" width="96" height="22" rx="6"/><rect x="72" y="78" width="96" height="22" rx="6"/><path d="M82 33h6M82 61h6M82 89h6M96 33h50M96 61h40M96 89h28"/>',
  poll: '<path d="M70 100h100"/><rect x="82" y="64" width="18" height="36" rx="3"/><rect x="111" y="36" width="18" height="64" rx="3"/><rect x="140" y="52" width="18" height="48" rx="3"/>',
  gift: '<rect x="84" y="50" width="72" height="50" rx="5"/><path d="M80 38h80v12H80zM120 38v62"/><path d="M120 38c-6-14-26-16-24-4 1 6 14 6 24 4zM120 38c6-14 26-16 24-4-1 6-14 6-24 4z"/>',
  checklist: '<rect x="86" y="18" width="68" height="88" rx="8"/><path d="M106 18v-4h28v4"/><path d="M98 42l6 6 10-10M98 64l6 6 10-10M98 86l6 6 10-10M122 46h20M122 68h20M122 90h20"/>',
  store: '<path d="M70 50l8-24h84l8 24"/><path d="M70 50c0 8 6 12 12 12s12-4 12-12c0 8 6 12 12 12s12-4 12-12c0 8 6 12 12 12s12-4 12-12c0 8 6 12 12 12s12-4 12-12"/><path d="M78 62v38h84V62M108 100V76h24v24"/>',
  people: '<circle cx="98" cy="46" r="13"/><path d="M72 98c2-18 12-28 26-28s24 10 26 28"/><circle cx="146" cy="50" r="11"/><path d="M128 72c4-2 10-4 18-4 12 0 22 10 22 28"/>',
  coin: '<circle cx="120" cy="60" r="34"/><circle cx="120" cy="60" r="24"/><path d="M120 46v28M112 52c0-4 4-6 8-6s8 2 8 6-4 6-8 6-8 2-8 6 4 6 8 6 8-2 8-6"/>',
  chat: '<path d="M70 30h70a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H96l-16 12v-12h-10a10 10 0 0 1-10-10V40a10 10 0 0 1 10-10z"/><path d="M162 54h8a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-6v10l-14-10h-20a10 10 0 0 1-8-4"/><circle cx="90" cy="53" r="3" fill="currentColor"/><circle cx="105" cy="53" r="3" fill="currentColor"/><circle cx="120" cy="53" r="3" fill="currentColor"/>',
  pin: '<path d="M120 102s-32-30-32-54a32 32 0 0 1 64 0c0 24-32 54-32 54z"/><circle cx="120" cy="48" r="11"/>',
  bell: '<path d="M90 82V58a30 30 0 0 1 60 0v24l8 10H82z"/><path d="M110 96a10 10 0 0 0 20 0M120 22v6"/><path d="M164 40c4 6 4 14 0 20M76 40c-4 6-4 14 0 20"/>'
};
/* Matched by keywords in the title/summary first, then rotated within the series so neighbours differ. */
const ART_RULES = [[/game show/i,'buzzer'],[/love is blind|dating/i,'heart'],[/night before|holiday|trick or treat|halloween/i,'moon'],[/stroller/i,'stroller'],[/fund|bank|deal/i,'coin'],[/buzzer/i,'buzzer'],[/question|q&a|explains/i,'question'],[/court|poll|controversial/i,'poll'],[/hour by hour|day in the life|on-duty/i,'clock'],[/gotta have|tier/i,'tiers'],[/tipping|survey/i,'coin'],[/two-specialist|event-style/i,'people'],[/in-store|store/i,'store'],[/roast|registry/i,'checklist'],[/finder|city/i,'pin'],[/notif/i,'bell'],[/channel|social/i,'chat']];
const SERIES_ART = {'game-shows':['buzzer','trophy','mic'],'reels':['phone','clapper','mic'],'registry':['gift','checklist','store'],'hub':['chat','bell','pin']};
const artKey = i => { const hit = ART_RULES.find(([re]) => re.test(i.title||'')) || ART_RULES.find(([re]) => re.test(i.summary||'')); if (hit) return hit[1]; const pool = SERIES_ART[i.series] || SERIES_ART.hub; const n = [...String(i.id)].reduce((a,c) => a + c.charCodeAt(0), 0); return pool[n % pool.length]; };
const ideaArt = i => { const img = imageUrl(i.image); return `<div class="idea-art">${img ? `<img src="${escapeHTML(img)}" alt="" loading="lazy">` : SVG(SPARKS+ART[artKey(i)])}</div>`; };
function ideaCard(i) {
  const img = imageUrl(i.image);
  const art = `<span class="idea-art">${img ? `<img src="${escapeHTML(img)}" alt="" loading="lazy">` : SVG(ART[artKey(i)])}</span>`;
  return `<button type="button" class="idea-tile tint-${tintFor(i)}" data-action="idea" data-id="${escapeHTML(i.id)}">${art}
    <span class="idea-body"><strong>${escapeHTML(i.title)}</strong><span class="idea-sum">${escapeHTML(i.summary || 'Details to come. Ask about it in Disco.')}</span>
    <span class="reel-card-meta">${[i.status === 'Pitched' ? '<span class="new">Just pitched</span>' : isNew(i.date) ? '<span class="new">New</span>' : '', i.lead ? `Led by ${escapeHTML(i.lead)}` : '', (i.buildOns || []).length ? `💬 ${(i.buildOns || []).length} ${(i.buildOns || []).length === 1 ? 'build-on' : 'build-ons'}` : '', byline(i) ? escapeHTML(byline(i)) : ''].filter(Boolean).join(' · ')}</span></span>
  </button>`;
}
function renderIdeas() {
  const all = ideas();
  if (!all.length && ideasPending()) { // still loading: placeholder groups, no filters, no empty state
    $('#idea-summary').textContent = ''; $('#idea-filters').innerHTML = '';
    $('#idea-grid').innerHTML = `<p class="sr-only" role="status">Loading the Idea Bank…</p>${[3, 2, 1].map(n => `<div class="idea-group idea-loading" aria-hidden="true"><span class="sk sk-head"></span><div class="idea-list">${'<span class="sk sk-tile"></span>'.repeat(n)}</div></div>`).join('')}`;
    return;
  }
  if (!all.length && ideasState === 'failed') {
    $('#idea-summary').textContent = ''; $('#idea-filters').innerHTML = '';
    $('#idea-grid').innerHTML = emptyState('The Idea Bank didn’t load.', 'Check your connection and try again in a minute.', '<button class="button" type="button" data-ideas-retry>Try again</button>', ICON.bulb);
    return;
  }
  const count = id => id === 'all' ? all.length : all.filter(i => i.series === id).length;
  const people = new Set(all.flatMap(i => credits(i.credit)));
  $('#idea-summary').textContent = all.length ? `${all.length} ideas from ${people.size} specialists.` : '';
  if (ideaFilter !== 'all' && !count(ideaFilter)) ideaFilter = 'all';
  const filters = [{id:'all',label:'All'}, ...SERIES.filter(s => count(s.id))];
  $('#idea-filters').innerHTML = all.length ? filters.map(f => `<button type="button" data-filter="${escapeHTML(f.id)}" aria-pressed="${ideaFilter === f.id}">${escapeHTML(f.label)} <span class="count">${count(f.id)}</span></button>`).join('') : '';
  const groups = (ideaFilter === 'all' ? SERIES : SERIES.filter(s => s.id === ideaFilter)).map(s => ({ s, list: all.filter(i => i.series === s.id) })).filter(g => g.list.length);
  const other = ideaFilter === 'all' ? all.filter(i => !seriesById(i.series)) : [];
  if (other.length) groups.push({ s: { id: 'other', label: 'More ideas' }, list: other });
  $('#idea-grid').innerHTML = groups.length
    ? groups.map(({s, list}) => `<section class="idea-group tint-${tintFor(list[0])}" aria-label="${escapeHTML(s.label)}"><h2><span class="dot" aria-hidden="true"></span>${escapeHTML(s.label)}<span class="count">${list.length}</span></h2>${s.description ? `<p class="quiet">${escapeHTML(s.description)}</p>` : ''}<div class="idea-list">${list.map(ideaCard).join('')}</div></section>`).join('')
    : emptyState('The Idea Bank is open.','Add an idea and it shows up here right away for the Squad to build on.','<button class="button" type="button" data-action="idea-new">Add an idea</button>', ICON.bulb);
}

// My ideas (and the dashboard card): ideas credited to you or led by you, by stage.
const STAGE_ORDER = ['idea','casting','filming','editing','published'];
const myNames = () => [myName(), myClaim(), isCoord() ? storageGet(UPLOAD_NAME_KEY) : ''].filter(Boolean);
const isMe = n => myNames().some(x => sameName(n, x)); // full name, or the Squad name you claimed ("Kristin")
const isMine = i => credits(i.credit).some(isMe) || leadsOf(i).some(isMe);

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
  const section = $('#production'); if (section) section.hidden = !items.length;
  $('#production-board').innerHTML = items.length
    ? `<div class="board">${lanes.map(([key,label]) => { const list = items.filter(x => x.stage === key); return `<section class="lane" aria-label="${label}"><h3>${label} <span>${list.length}</span></h3>${list.length ? list.map(laneItem).join('') : '<p class="lane-empty">Nothing here yet.</p>'}</section>`; }).join('')}</div>`
    : emptyState('Nothing in production yet.','Pick an idea from the Idea Bank and raise your hand to lead it. It will show up here as it moves from planning to filming to editing.',`<a class="button secondary" href="${IDEAS_URL}" data-tool-page="ideas.html" data-label="Idea Bank">Find an idea to lead</a>`);
}

function poster(p,label) {
  const src = imageUrl(p.thumbnail);
  const url = isPublished(p) ? publicUrl(p.publishedReelUrl) : '';
  const inner = `${src ? `<img src="${escapeHTML(src)}" alt="" loading="lazy">` : ''}${url || !src ? `<span class="play">${ICON.play}</span>` : ''}<span class="chip">${escapeHTML(label)}</span>`;
  return url ? `<a class="poster" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML('Watch '+p.title+' on Instagram')}">${inner}</a>` : `<div class="poster">${inner}</div>`;
}
function renderGallery() {
  const gallery = content.completedCollaborations;
  $('#project-gallery').innerHTML = gallery.length ? gallery.map((p,i) => {
    const linked = ideas().find(x => x.id === p.ideaId);
    const tint = linked ? tintFor(linked) : TINTS[i % TINTS.length];
    const label = isPublished(p) ? 'Published' : (p.status && p.status !== 'published' ? STAGES[stageKey(p.status)] : 'Details coming');
    const who = credits(p.participatingSpecialists);
    return `<article class="project-card tint-${tint}">${poster(p,label)}<h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description || 'Project description to come.')}</p><p class="quiet">${who.length ? 'Featuring '+escapeHTML(who.join(', ')) : 'Contributor credits to come.'}</p><div class="button-row">${isPublished(p) ? externalLink(p.publishedReelUrl,'Watch')+`<button class="button secondary" data-action="reel-share" data-project="${escapeHTML(p.id)}">Share</button>` : ''}${linked ? `<button class="text-button" data-action="idea" data-id="${escapeHTML(linked.id)}">See the format</button>` : ''}</div></article>`;
  }).join('') : emptyState('Squad projects will appear here.','Finished collaborations show up once their details are ready.');
}

const REGIONS = ['East','Central','West'];
const regionBadge = r => REGIONS.includes(r) ? `<span class="region region-${r.toLowerCase()}">${r}</span>` : '';
function renderSquad() {
  const featured = (content.featuredSpecialists || []).map(p => typeof p === 'string' ? {name:p} : p).filter(p => p && p.name);
  const leader = content.leader && content.leader.name ? [{ ...content.leader, leader:true }] : [];
  const people = [...leader, ...featured.map(p => ({ ...p, bio: bioFor(p) })), // bios creators wrote themselves win over content.js
    ...(liveBios || []).filter(b => b.bio && !featured.some(p => ownsCard(p, b.name, b.claimed)) && !(content.leader && ownsCard(content.leader, b.name, b.claimed))).map(b => ({ name: b.name, bio: b.bio }))]
    .sort((x, y) => shownName(x).localeCompare(shownName(y), 'en', { sensitivity:'base' })); // alphabetical by first name
  const me = myName();
  $('#squad-grid').innerHTML = people.length ? people.map((p,i) => {
    const photo = imageUrl(p.photo); const role = p.leader ? p.title : [p.expertise, p.location].filter(Boolean).join(' · ');
    return `<article class="person tint-${TINTS[i % TINTS.length]}${p.leader ? ' person-lead' : ''}">${photo ? `<img class="avatar" src="${escapeHTML(photo)}" alt="" loading="lazy">` : `<span class="avatar" aria-hidden="true">${escapeHTML(initials(p.name))}</span>`}
      <div class="person-head"><h3>${escapeHTML(shownName(p))}</h3>${regionBadge(p.region)}</div>${role ? `<p class="role">${escapeHTML(role)}</p>` : ''}
      <div class="person-more">${p.leader ? `<span class="chip">Leader spotlight</span>${p.aka ? `<p class="aka">${escapeHTML(p.aka)}</p>` : ''}` : ''}${p.bio ? `<p class="bio" id="bio-${i}">${escapeHTML(p.bio)}</p>` : ''}${p.leader && p.spotlight ? `<p class="bio">${escapeHTML(p.spotlight)}</p>` : ''}
      <div class="person-links">${externalLink(discoProfile(p),'Message on Disco','text-button')}${instagramLink(p.instagram)}${externalLink(p.link,'Profile','text-button')}${!p.leader && ownsCard(p, me, myClaim()) ? `<button type="button" class="text-button" data-action="profile">${p.bio ? 'Edit my bio' : 'Add my bio'}</button>` : ''}</div></div></article>`;
  }).join('') : emptyState('Specialist spotlights are coming soon.','');
  const more = document.getElementById?.('squad-toggle'); if (more) more.closest('.squad-more').hidden = people.length <= 6;
}
// "Meet the whole Squad": the six previews open in place to everyone, with full bios, in the same order.
function setupSquadToggle() {
  const btn = document.getElementById?.('squad-toggle'), grid = document.getElementById?.('squad-grid'); if (!btn || !grid) return;
  btn.onclick = () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Show fewer' : 'Meet the whole Squad';
    grid.classList.toggle('is-preview', !open);
    if (!open) document.getElementById('squad')?.scrollIntoView?.({ block:'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
  };
}
const reduceMotion = () => !!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

function nextOccurrence(weekday) {
  const d = new Date(today()+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0,10);
}
/* ---------- B-roll library (b-roll.html) ---------- */
let brollFilter = 'all'; let brollPerson = '';
const BROLL_ART = {aisles:'store',strollers:'stroller','car-seats':'carseat',nursery:'moon',feeding:'bottle',babywearing:'heart',registry:'checklist',squad:'people'};
const brollCats = () => content.brollCategories || [];
const brollLabel = id => (brollCats().find(c => c.id === id) || {}).label || (id === 'other' ? 'Other footage' : 'Clip');
const brollTint = id => TINTS[Math.max(0, brollCats().findIndex(c => c.id === id)) % TINTS.length];
function brollFolder() { return publicUrl(brollLive && brollLive.libraryUrl) || publicUrl(content.brollFolderUrl) || publicUrl(content.submissionFolderUrl); }
/* Signed-in creators: folders and clips come live from the approved Drive folders (apps-script ?action=broll-library).
   Signed out: the public preview stills in content.js, with no Drive links. */
let brollLive = null, brollState = 'idle';
async function loadBroll(force) {
  if (LOCKED() || !UPLOAD_ON() || typeof fetch !== 'function' || (brollState === 'loading' && !force)) return;
  brollState = 'loading'; if (has('#broll-folders')) renderBroll();
  try {
    const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=broll-library&key=${encodeURIComponent(mentorKey())}`); const d = await res.json();
    if (d && d.ok && Array.isArray(d.folders)) { brollLive = d; brollState = 'done'; }
    else brollState = d && d.locked ? 'signin' : 'failed';
  } catch { brollState = 'failed'; }
  if (has('#broll-folders')) renderBroll();
}
const brollLiveFolders = () => ((brollLive && brollLive.folders) || []).filter(f => f && f.name).map(f => ({ name: f.name, url: f.url, count: f.count, clips: (f.clips || []).map(c => ({ ...c, credit: f.name, live: true })) }));
function clipCard(x, inFolder) {
  const thumb = imageUrl(x.thumbnail); const url = x.live && !LOCKED() ? publicUrl(x.url) : ''; // Drive links: only clips the signed-in creators' endpoint sent
  return `<article class="clip-card tint-${brollTint(x.category)}"><div class="clip-thumb" data-art="${escapeHTML(BROLL_ART[x.category] || 'phone')}">${thumb ? `<img src="${escapeHTML(thumb)}" alt="" loading="lazy"${x.live ? ' referrerpolicy="no-referrer"' : ''}>` : SVG(ART[BROLL_ART[x.category]] || ART.phone)}${x.length ? `<span class="clip-length">${escapeHTML(x.length)}</span>` : ''}</div>
    <h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(brollLabel(x.category))}${x.credit && !inFolder ? ' · shot by '+escapeHTML(x.credit) : ''}</p>
    ${url ? `<div class="button-row">${externalLink(url,'Open in Drive','button secondary')}<button class="text-button" type="button" data-copy="${escapeHTML(url)}" data-done="Clip link copied.">Copy link</button></div>` : ''}</article>`; // Open in Drive and Copy link: signed-in creators only
}
const brollFolders = () => (content.brollFolders || []).filter(f => f && f.name);
function personPhoto(name) { const p = [content.leader, ...(content.featuredSpecialists || [])].find(x => x && x.name === name); return p ? imageUrl(p.photo) : ''; }
function folderAvatar(name) { const photo = personPhoto(name); return photo ? `<img class="folder-avatar" src="${escapeHTML(photo)}" alt="">` : `<span class="folder-avatar" aria-hidden="true">${escapeHTML(name.charAt(0))}</span>`; }
const clipCount = n => n === 1 ? '1 clip' : `${n} clips`;
function folderTile(f, clips, label) {
  const mine = clips.filter(x => x.credit === f.name);
  const peek = mine.map(x => imageUrl(x.thumbnail)).filter(Boolean).slice(0,3);
  const note = label || clipCount(mine.length); // while loading, a folder never claims to be empty
  return `<button type="button" class="folder-tile" data-broll-folder="${escapeHTML(f.name)}" aria-label="${escapeHTML(`Open ${f.name}’s folder, ${note}`)}">
    <span class="folder-back"><span class="folder-peek">${peek.map(src => `<img src="${escapeHTML(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('')}</span></span>
    <span class="folder-front">${folderAvatar(f.name)}<span><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(note)}</small></span></span></button>`;
}
function renderBroll() {
  const member = !LOCKED() && UPLOAD_ON(), live = member && brollState === 'done', waiting = member && !live;
  const folders = live ? brollLiveFolders() : brollFolders();
  const allClips = live ? folders.flatMap(f => f.clips) : (content.brollClips || []).filter(x => x && x.title).map(({ url, ...x }) => x); // no Drive links without a sign-in
  const open = folders.find(f => f.name === brollPerson); if (!open) brollPerson = '';
  const clips = open ? allClips.filter(x => x.credit === open.name) : allClips;
  const count = id => id === 'all' ? clips.length : clips.filter(x => x.category === id).length;
  const folder = (live && open && publicUrl(open.url)) || (live ? brollFolder() : '');
  const tileNote = f => waiting ? (brollState === 'loading' ? 'Loading clips…' : 'Clips unavailable') : live ? '' : (allClips.some(x => x.credit === f.name) ? '' : 'Clips for members');
  if (has('#broll-add')) $('#broll-add').innerHTML = uploadButton('Add your clips','broll'); // anyone can add footage
  if (has('#broll-access')) $('#broll-access').innerHTML = LOCKED() ? `Anyone can add clips. Opening clips in Drive and copying links is for Creators Club members: <a href="${escapeHTML(pageUrl('index.html'))}#mentor-signin">sign in</a>.`
    : `Clips open in Google Drive with the Google account the Squad shares the library with. If Drive asks you to request access, contact Sarah or Taylor.${isCoord() && live ? ' <button type="button" class="text-button" data-broll-refresh>Refresh from Drive</button>' : ''}`;
  if (has('#broll-summary')) $('#broll-summary').textContent = live ? (brollLive.total ? `${clipCount(brollLive.total)} in the library.` : '') : waiting ? '' : allClips.length ? `${clipCount(allClips.length)} to preview.` : '';
  const status = brollState === 'loading' ? `<p class="broll-status" role="status">Loading the latest clips from Drive…</p>`
    : brollState === 'failed' ? `<div class="broll-status broll-error" role="alert"><p>The library couldn’t load from Drive just now.</p><button type="button" class="button secondary" data-broll-retry>Try again</button></div>`
    : brollState === 'signin' ? `<div class="broll-status broll-error" role="alert"><p>Your sign-in has expired. <a href="${escapeHTML(pageUrl('index.html'))}#mentor-signin">Sign in again</a> to open clips.</p></div>` : '';
  if (has('#broll-folders')) $('#broll-folders').innerHTML = open
    ? `<div class="folder-open"><button type="button" class="text-button folder-back-link" data-broll-folder="">← All folders</button>
        <div class="folder-open-head">${folderAvatar(open.name)}<div><h2>${escapeHTML(open.name)}’s folder</h2><p>${waiting ? escapeHTML(tileNote(open)) : clipCount(clips.length)}</p></div>${live ? externalLink(open.url,'Open folder in Drive','button secondary') : ''}</div></div>${status}`
    : folders.length ? `<h2 class="broll-head">Folders</h2><p class="folder-note">Open a folder to ${live ? 'see' : 'preview'} its clips.</p>${status}<div class="folder-grid">${folders.map(f => folderTile(f, allClips, tileNote(f))).join('')}</div>`
    : live ? emptyState('No folders yet.', 'Approved clips show up here once a coordinator moves them into the B-Roll Library.', uploadButton('Add your clips','broll'), ICON.play)
    : waiting ? status : emptyState('No folders yet.', 'When a specialist sends clips, their folder shows up here.', uploadButton('Add your clips','broll'), ICON.play);
  if (!open || waiting) { $('#broll-filters').innerHTML = ''; $('#broll-grid').innerHTML = ''; } // previews stay hidden until a folder is opened (and loaded)
  else {
    const usedCats = [...brollCats(), { id:'other', label:'Other footage' }].filter(c => count(c.id));
    if (brollFilter !== 'all' && !count(brollFilter)) brollFilter = 'all';
    $('#broll-filters').innerHTML = !usedCats.length ? '' : [{id:'all',label:'All'}, ...usedCats].map(f => `<button type="button" class="filter" data-broll="${escapeHTML(f.id)}" aria-pressed="${brollFilter === f.id}">${escapeHTML(f.label)} <span class="count">${count(f.id)}</span></button>`).join('');
    const shown = brollFilter === 'all' ? clips : clips.filter(x => x.category === brollFilter);
    $('#broll-grid').innerHTML = shown.length ? shown.map(x => clipCard(x, !!open)).join('')
      : emptyState(clips.length ? 'No clips in this category yet.' : 'No approved clips here yet.', live ? `Approved clips in ${open.name}’s Drive folder show up here within a few minutes.` : `Creators Club members can open ${open.name}’s clips after signing in.`, live ? externalLink(folder,'Open folder in Drive') : uploadButton('Add your clips','broll'), ICON.play);
  }
  if (has('#broll-wanted')) $('#broll-wanted').innerHTML = (content.brollWanted || []).map(w => `<li><span class="wanted-mark" aria-hidden="true"></span><div><strong>${escapeHTML(w.title)}</strong><span>${escapeHTML(brollLabel(w.category))}</span></div></li>`).join('');
  // Opened from the landing page's "See wanted shots": go to the list once the clips above it have drawn.
  if (!renderBroll.jumped && location.hash === '#most-wanted' && has('#most-wanted')) { renderBroll.jumped = true; setTimeout(() => document.getElementById('most-wanted').scrollIntoView({ block: 'start' }), 0); }
}
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('error', e => {
  const img = e.target; if (!img || img.tagName !== 'IMG' || !img.closest) return;
  const thumb = img.closest('.clip-thumb'); if (thumb) { img.remove(); if (!thumb.querySelector('svg')) thumb.insertAdjacentHTML('afterbegin', SVG(ART[thumb.dataset.art] || ART.phone)); return; }
  if (img.closest('.folder-peek')) img.remove();
}, true); // a Drive thumbnail that doesn't load (no access, or expired) shows the category illustration instead
function toast(msg) { const t = document.getElementById ? document.getElementById('toast') : null; if (!t || !msg) return; t.textContent = msg; t.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2600); }

/* Landing page: Wanted B-roll. Three shots from the B-roll page's list, plus "something else useful".
   The cards are examples only: Submit B-roll opens the usual form, and nothing records which shot a clip is for. */
const WANTED_OTHER = { title:'Something else useful', tip:'Gear, aisles or a quick demo.', art:'gearDemo' };
const WANTED_STILLS = { aisles: 'inside-target', strollers: 'wagons', 'car-seats': 'lost' };
function renderWanted() {
  const shots = (content.brollWanted || []).filter(w => w && w.tip).slice(0,3).concat(WANTED_OTHER);
  $('#wanted-shots').innerHTML = shots.map(w => {
    const clip = (content.brollClips || []).find(c => c.id === (WANTED_STILLS[w.category] || 'live-demo'));
    const src = clip && imageUrl(clip.thumbnail);
    const still = src ? `<figure class="shot-still"><img src="${escapeHTML(src)}" alt="${escapeHTML(clip.title + ' — library reference still')}" loading="lazy" width="320" height="480"><figcaption>Library still · ${escapeHTML(clip.title)}</figcaption></figure>` : '';
    return `<li class="shot tint-${w.category ? brollTint(w.category) : 'linen'}">${still}<h3>${escapeHTML(w.title)}</h3><p>${escapeHTML(w.tip)}</p></li>`;
  }).join('');
  if (has('#wanted-actions')) $('#wanted-actions').innerHTML = `${uploadButton('Submit B-roll','broll')}<a class="text-button" href="${escapeHTML(pageUrl('b-roll.html'))}#most-wanted" data-tool-page="b-roll.html#most-wanted" data-label="B-roll library">See wanted shots</a>`;
}

/* Hero: the three newest published Reel covers, fanned like phones. */
function renderHero() {
  const covers = publishedProjects().filter(p => imageUrl(p.thumbnail)).slice(0,3);
  $('#hero-reels').innerHTML = covers.map((p,i) => `<a class="hero-reel r${i}" href="${escapeHTML(publicUrl(p.publishedReelUrl))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML('Watch '+p.title+' on Instagram')}"><img src="${escapeHTML(imageUrl(p.thumbnail))}" alt=""></a>`).join('');
  document.querySelectorAll?.('[data-broll-submit]').forEach(b => { if (!UPLOAD_ON()) b.outerHTML = uploadButton('Submit B-roll','broll'); });
  const second = $('#hero-secondary');
  if (second && openProjects().length) { second.textContent = 'See what’s casting'; second.href = '#casting'; second.removeAttribute?.('data-tool-page'); }
}
function renderWeek() {
  const events = content.recurringEvents || [];
  $('#week-events').innerHTML = events.length ? events.map(e => {
    const weekly = Number.isInteger(e.weekday) && e.weekday >= 0 && e.weekday <= 6;
    const next = weekly ? nextOccurrence(e.weekday) : '';
    const when = weekly ? `<time datetime="${next}">${next === today() ? 'Today' : fmt(next,{weekday:'short',month:'short',day:'numeric'})}</time>` : escapeHTML(e.scheduleNote || 'Schedule to come');
    return `<div class="event"><div class="event-head"><strong>${escapeHTML(e.title)}</strong><span class="event-when">${when}</span></div>${weekly ? `<p>Every ${WEEKDAYS[e.weekday]}${e.time ? ' · '+escapeHTML(e.time) : ''}</p>` : ''}${e.description ? `<p>${escapeHTML(e.description)}</p>` : ''}${externalLink(e.url,'RSVP in Events','text-button')}</div>`;
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

const TOOL_ICON = { frame:'🖼️', heart:'💜', palette:'🎨', spark:'✨', check:'✅', upload:'📤', film:'🎬', board:'📋', calendar:'📅', draft:'📝', bulb:'💡', wave:'👋' };
// One line-icon style for toolkit and resource tiles (24px, 1.8 stroke, like ICON). Emoji stay only as a fallback for custom resources.
const LINE = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const TOOL_LINE = {
  frame: LINE('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 18"/><circle cx="15.5" cy="8.5" r="1.5"/>'),
  heart: LINE('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  palette: LINE('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.2-1-1.5-1-2.6 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
  spark: LINE('<path d="M12 3c.7 5 2.3 7.3 7 9-4.7 1.7-6.3 4-7 9-.7-5-2.3-7.3-7-9 4.7-1.7 6.3-4 7-9z"/>'),
  check: LINE('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
  upload: LINE('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  film: LINE('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'),
  board: LINE('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>'),
  calendar: LINE('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  draft: LINE('<path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 4v5h5M9 13h6M9 17h4"/>'),
  bulb: LINE('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
  wave: LINE('<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 6 17.5L4.3 14a1.5 1.5 0 0 1 2.6-1.5L8 14"/>')
};
// Toolkit: everything opens inside the Creators Club (panels or pages in this site), never an outside link.
function toolkitItems() {
  return [
    { label:'Brand & voice', action:'brand', desc:'Colors, fonts and how we sound', icon:'palette' },
    { label:'Starter guide', action:'guide', desc:'Turn a spark into a Reel', icon:'spark' },
    { label:'Before you share', action:'checklist', desc:'A quick final check', icon:'check' },
    ...(publicUrl(content.socialTemplatesUrl) ? [{ label:'Social templates', action:'templates', desc:'Tot Squad’s Canva posts, ready for your photo', icon:'frame' }] : []),
    { label:'Creators Club guidelines', action:'guidelines', desc:'Our purpose, expectations and community', icon:'heart' },
    ...(UPLOAD_ON() ? [{ label:'Upload clips', action:'upload', dest:'collab', desc:'Send footage straight to the Squad’s Drive', icon:'upload' }] : []),
    { label:'Idea Bank', page:'ideas.html', desc:'Every Squad idea, ready to lead or build on', icon:'bulb' },
    { label:'B-roll library', page:'b-roll.html', desc:'Add clips anytime; members open them in Drive', icon:'film' },
    ...(UPLOAD_ON() && isCoord() ? [{ label:'New applications', action:'applications', desc:'Meet the creators who want to join', icon:'wave' }] : []), // applicants' details: coordinators only
    ...(content.resources || []).filter(r => r && r.label && (r.page || r.action)),
    { label:'My ideas', action:'my-ideas', desc:'Your ideas by stage, casting calls and drafts', icon:'draft' }
  ];
}
function toolTile(r) {
  const inner = `<span class="tool-icon" aria-hidden="true">${TOOL_LINE[r.icon] || TOOL_ICON[r.icon] || '📌'}</span><span class="tool-text"><strong>${escapeHTML(r.label)}</strong>${r.desc ? `<span>${escapeHTML(r.desc)}</span>` : ''}</span>`;
  return r.page ? `<a class="tool" href="${escapeHTML(pageUrl(r.page))}" data-tool-page="${escapeHTML(r.page)}" data-label="${escapeHTML(r.label)}">${inner}</a>`
    : `<button type="button" class="tool" data-action="${escapeHTML(r.action)}"${r.dest ? ` data-dest="${escapeHTML(r.dest)}"` : ''}>${inner}</button>`;
}
// The three guides anyone can read on the landing page, no password.
const PUBLIC_GUIDES = ['brand','guide','checklist','templates','guidelines'];
const PUBLIC_PAGES = ['b-roll.html']; // the Idea Bank is for signed-in creators
const isPublicTool = r => PUBLIC_GUIDES.includes(r.action) || PUBLIC_PAGES.includes(r.page);
// Public resource tiles show a small preview of what's inside instead of an icon.
const SWATCHES = ['#875782', '#f3eaf1', '#6fc9ba', '#f8f1e9'];
const GUIDE_PREVIEW = {
  brand: () => `<span class="pv pv-brand" aria-hidden="true"><span class="pv-swatches">${SWATCHES.map(c => `<i style="background:${c}"></i>`).join('')}</span><span class="pv-type"><b>Aa</b><span>Aa</span></span></span>`,
  guide: () => `<span class="pv pv-story" aria-hidden="true">${svgArt('0 0 180 60', `<rect x="6" y="6" width="48" height="48" rx="6" fill="#fff"/><circle cx="30" cy="26" r="8" fill="#fff"/><path d="M20 44q10-8 20 0M40 14l6-4M44 20h6" stroke-width="2.5"/><rect x="66" y="6" width="48" height="48" rx="6" fill="#fff"/><rect x="80" y="18" width="20" height="26" rx="4"/><path d="M84 18v-4h12v4" stroke-width="2.5"/><rect x="126" y="6" width="48" height="48" rx="6" fill="#fff"/><path d="M150 42c-8-5-12-9-12-13 0-3 2-5 5-5 3 0 5 2 7 4 2-2 4-4 7-4 3 0 5 2 5 5 0 4-4 8-12 13z" fill="currentColor" stroke="none"/>`)}</span>`,
  checklist: () => `<span class="pv pv-check" aria-hidden="true">${svgArt('0 0 180 60', [10, 26, 42].map((y, i) => `<rect x="50" y="${y - 6}" width="12" height="12" rx="3" fill="#fff" stroke-width="2.5"/><path d="M53 ${y}l2.5 2.5 4.5-5" stroke-width="2.5"/><path d="M70 ${y}h${[60, 46, 54][i]}" stroke-width="4"/>`).join(''))}</span>`,
  templates: () => `<span class="pv pv-templates" aria-hidden="true">${svgArt('0 0 180 60', `<rect x="20" y="4" width="42" height="52" rx="4" fill="#fff"/><circle cx="41" cy="22" r="9" stroke-width="2.5"/><path d="M30 40h22M33 47h16" stroke-width="2.5"/><rect x="69" y="4" width="42" height="52" rx="4" fill="#fff"/><path d="M78 20q0-6 6-7M88 20q0-6 6-7" stroke-width="3"/><path d="M78 32h24M78 39h20M78 46h14" stroke-width="2.5"/><rect x="118" y="4" width="42" height="52" rx="4" fill="#fff"/><rect x="123" y="12" width="14" height="22" rx="3" stroke-width="2.5"/><rect x="141" y="12" width="14" height="22" rx="3" stroke-width="2.5"/><path d="M128 44h22" stroke-width="2.5"/>`)}</span>`,
  guidelines: () => `<span class="pv pv-guidelines" aria-hidden="true">${svgArt('0 0 180 60', `<path d="M60 10h28v44H60q-6 0-6-6V16q0-6 6-6zM92 10h28q6 0 6 6v32q0 6-6 6H92z" fill="#fff" stroke-width="2.5"/><path d="M90 40c-6-4-9-7-9-10 0-2 2-4 4-4s3 1 5 3c2-2 3-3 5-3s4 2 4 4c0 3-3 6-9 10z" fill="currentColor" stroke="none"/>`)}</span>`,
  'b-roll.html': () => `<span class="pv pv-film" aria-hidden="true">${['broll-inside-target', 'broll-wagons', 'broll-halo'].map(n => `<img src="images/${n}.jpg" alt="" loading="lazy" width="54" height="80">`).join('')}</span>`
};
function guideTile(r) {
  const pv = GUIDE_PREVIEW[r.action || r.page]; if (!pv) return toolTile(r);
  return toolTile(r).replace(/<span class="tool-icon"[^>]*>[\s\S]*?<\/span><span class="tool-text">/, `${pv()}<span class="tool-text">`).replace('class="tool"', 'class="tool tool-preview"');
}
function renderGuides() { $('#public-guides').innerHTML = toolkitItems().filter(isPublicTool).map(guideTile).join(''); }
function renderResources() { $('#resource-links').innerHTML = toolkitItems().map(toolTile).join(''); }
// Hamburger menu: every section plus every tool, in one dropdown.
function menuItem(r) {
  const inner = `<span aria-hidden="true">${TOOL_ICON[r.icon] || '📌'}</span>${escapeHTML(r.label)}`;
  return r.page ? `<a href="${escapeHTML(pageUrl(r.page))}" data-tool-page="${escapeHTML(r.page)}" data-label="${escapeHTML(r.label)}">${inner}</a>`
    : `<button type="button" data-action="${escapeHTML(r.action)}"${r.dest ? ` data-dest="${escapeHTML(r.dest)}"` : ''}>${inner}</button>`;
}
function renderMenu() {
  const items = toolkitItems();
  if (has('#menu-tools')) $('#menu-tools').innerHTML = items.map(menuItem).join('');
  if (has('#menu-guides')) $('#menu-guides').innerHTML = items.filter(isPublicTool).map(menuItem).join('');
}
function setupMenu() {
  const btn = document.getElementById && document.getElementById('menu-btn'), menu = document.getElementById && document.getElementById('nav-menu');
  if (!btn || !menu || btn.dataset.ready) return; btn.dataset.ready = '1';
  const setOpen = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.classList.toggle('open', open); };
  btn.addEventListener('click', e => { e.stopPropagation(); const open = menu.hidden; setOpen(open); if (open) menu.querySelector('a:not([hidden]),button')?.focus({preventScroll:true}); });
  menu.addEventListener('click', e => { if (e.target.closest('a,button')) setOpen(false); });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('.menu-wrap')) setOpen(false); }, true); // capture: the bell stops its own clicks
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); } });
}
// Bell: What's new drops down from the nav. Opening it marks everything as seen; new items keep their dot until it closes.
function setupBell() {
  const btn = document.getElementById && document.getElementById('bell-btn'), panel = document.getElementById && document.getElementById('bell-panel');
  if (!btn || !panel || btn.dataset.ready) return; btn.dataset.ready = '1';
  const setOpen = open => {
    panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.classList.toggle('open', open);
    if (open) markActivitySeen();
    else renderActivity();
  };
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(panel.hidden); });
  panel.addEventListener('click', e => { if (e.target.closest('[data-action],a[href]')) setOpen(false); });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('.bell-wrap')) setOpen(false); }, true); // capture: the menu button stops its own clicks
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
}

function renderContent() {
  document.body.classList.toggle('embed', EMBED);
  document.body.classList.toggle('panel', PANEL);
  (document.querySelectorAll ? [...document.querySelectorAll('[data-squad-chat]')] : []).forEach(a => { const u = publicUrl(content.squadChatUrl); if (u) a.href = u; else a.hidden = true; }); // Instagram group chat invite
  if (EMBED) document.querySelectorAll('a[href="ideas.html"], a[href="index.html"], a[href="b-roll.html"], a[href="reels.html"]').forEach(a => a.setAttribute('href', pageUrl(a.getAttribute('href'))));
  if (has('#welcome')) $('#welcome').hidden = storageGet('totsquad-welcome-dismissed') === '1';
  const sections = [['#hero-reels',renderHero],['#casting-projects',renderCasting],['#idea-grid',renderIdeas],['#production-board',renderProduction],['#project-gallery',renderGallery],['#squad-grid',renderSquad],['#wanted-shots',renderWanted],['#week-events',renderWeek],['#ways',renderWays],['#broll-grid',renderBroll],['#reels-view',loadReels],['#deadlines',renderDeadlines],['#resource-links',renderResources],['#public-guides',renderGuides],['#nav-menu',renderMenu]];
  for (const [sel,render] of sections) if (has(sel)) render();
  if (has('#broll-grid') && !LOCKED() && brollState === 'idle') loadBroll(); // B-roll page, signed in: folders and clips from Drive
  storageSet('totsquad-last-visit', today());
  if (typeof loadClub === 'function' && typeof club !== 'undefined' && !club && !clubBusy) loadClub(); // club.js, after signing in
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
function showModal() { placeModal(); if (!modal.open) modal.showModal(); placeModal(); modal.scrollTop = 0; }

/* ---------- Keep everyone's place ----------
   In Disco this page sits in a frame as tall as the whole page, and Disco scrolls around it, so a dialog
   centred in the frame could open thousands of pixels from where someone is reading. This watches which
   slice of the page is on screen and opens dialogs, the toolkit panel and toasts right there. */
let toolOpen = false;
let onScreen = null; // { top, bottom } of the slice on screen, in page pixels; null when the page scrolls itself
function watchScreen() {
  if (typeof IntersectionObserver === 'undefined' || !document.createElement || !document.body || !document.body.append) return;
  // Thin strips down the frame: as Disco scrolls, the strips at the top and bottom edges of the screen change how
  // much of them shows, which tells us where the screen is (one tall strip would show the same amount everywhere).
  const STRIP = 80, seen = new Map(), steps = Array.from({ length: 81 }, (_, i) => i / 80);
  let io = null, strips = [];
  const update = entries => {
    entries.forEach(e => seen.set(e.target, e.isIntersecting ? e.intersectionRect : null));
    let top = Infinity, bottom = -Infinity;
    seen.forEach(r => { if (r && r.height > 0) { top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); } });
    onScreen = bottom > top && bottom - top < innerHeight - 40 ? { top, bottom } : null;
    if (modal.open) placeModal(); const sd = signinDialog(); if (sd && sd.open) placeModal(sd);
    placeToast();
  };
  const build = () => {
    if (io) io.disconnect(); strips.forEach(s => s.remove()); seen.clear();
    io = new IntersectionObserver(update, { threshold: steps });
    strips = Array.from({ length: Math.ceil(innerHeight / STRIP) }, (_, i) => {
      const s = document.createElement('div'); s.className = 'screen-probe'; s.setAttribute('aria-hidden', 'true');
      s.style.top = (i * STRIP) + 'px'; s.style.height = STRIP + 'px';
      document.body.append(s); io.observe(s); return s;
    });
  };
  build();
  // Re-centre when a dialog grows or shrinks (next step of a form, a list loading in).
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { if (modal.open && onScreen) placeModal(); }).observe(modal);
  let last = innerHeight, timer;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { if (Math.abs(innerHeight - last) > STRIP / 2) { last = innerHeight; build(); } }, 200); });
}
function placeModal(d = modal) {
  const st = d.style; if (!st) return; const tool = d === modal && toolOpen;
  if (!onScreen) { ['margin-top','margin-bottom','max-height','height'].forEach(k => st.removeProperty(k)); return; }
  const h = Math.max(240, onScreen.bottom - onScreen.top - 24);
  st.maxHeight = Math.round(h) + 'px'; st.marginBottom = 'auto';
  if (tool) st.height = Math.round(h) + 'px'; else st.removeProperty('height');
  // Centred in the part of the page on screen (short dialogs), or pinned to its top (tall ones and the toolkit panel).
  const own = d.open && !tool && d.offsetHeight ? Math.min(d.offsetHeight, h) : h;
  st.marginTop = Math.round(onScreen.top + 12 + (h - own) / 2) + 'px';
}
function placeToast() {
  const t = document.getElementById ? document.getElementById('toast') : null; if (!t || !t.style) return;
  if (onScreen) { t.style.top = Math.round(onScreen.bottom - 72) + 'px'; t.style.bottom = 'auto'; }
  else { t.style.removeProperty('top'); t.style.removeProperty('bottom'); }
}

/* Idea Bank, B-roll library, Reels tracker and Content calendar open in a panel on top of the page,
   so closing it puts people right back where they were. */
function openTool(page, label) {
  stash(); activeFlow = null; status.textContent = ''; castProject = '';
  const u = new URL(page, location.href); u.searchParams.set('embed', '1'); u.searchParams.set('panel', '1');
  title.textContent = label || 'Creators Club';
  body.innerHTML = `<iframe class="tool-frame" src="${escapeHTML(u.href)}" title="${escapeHTML(label || 'Creators Club tool')}"></iframe>`;
  toolOpen = true; modal.classList.toggle('wide', true);
  showModal();
}
function closeTool() { toolOpen = false; modal.classList.toggle('wide', false); if (modal.style) modal.style.removeProperty('height'); if (body.querySelector && body.querySelector('.tool-frame')) body.replaceChildren(); }
// Inside the panel, "Back to Creators Club" (any link to the landing page) just closes the panel.
if (PANEL && typeof window !== 'undefined' && window.parent && window.parent !== window) {
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
    let u; try { u = new URL(a.href, location.href); } catch { return; }
    if (u.origin !== location.origin || !/(\/|index\.html)$/.test(u.pathname)) return;
    e.preventDefault(); window.parent.postMessage({ type: 'creators-club-close-tool', hash: u.hash }, location.origin);
  }, true);
}
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data || e.data.type !== 'creators-club-close-tool') return;
  if (modal.open) modal.close();
  const target = e.data.hash && e.data.hash.length > 1 && document.getElementById(decodeURIComponent(e.data.hash.slice(1)));
  if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start' });
});
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

/* ---------- My ideas: ideas credited to you or led by you (by stage), your casting calls, and unsent drafts ---------- */
let myIdeasAsked = false;
function draftCards() {
  return Object.entries(flows).map(([k,v]) => {
    const d = loadDraft(k); if (!hasDraft(k,d)) return '';
    const saved = d._savedAt ? new Date(d._savedAt) : null;
    const note = saved && Number.isFinite(saved.getTime()) ? 'Saved '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(saved) : 'Draft in progress';
    return `<button class="draft-card" data-action="${k}"><strong>${escapeHTML(v.title)}</strong><span class="draft-name">${escapeHTML(String(d.title || '').trim() || 'Untitled draft')}</span><span>${escapeHTML(note)}</span></button>`;
  }).filter(Boolean);
}
function callState(c) {
  if (c.status === 'closed' || c.open === false) return ['closed', c.status === 'closed' ? 'Closed' : 'Past due'];
  if (c.audience === 'public') return c.review === 'approved' ? ['public', 'Public'] : ['waiting', 'Waiting for approval'];
  return ['club', 'Creators Club'];
}
function callRow(c) {
  const [cls, label] = callState(c);
  return `<li class="my-call"><div><strong>${escapeHTML(c.title)}</strong><span class="quiet">${[c.deadline ? 'Due ' + shortDate(c.deadline) : 'No due date', `${c.responses || 0} ${c.responses === 1 ? 'response' : 'responses'}`].join(' · ')}</span>${c.reviewNote ? `<span class="quiet">${escapeHTML(c.reviewNote)}</span>` : ''}</div>
    <span class="call-state call-${cls}">${label}</span><button type="button" class="text-button" data-action="call-edit" data-call="${escapeHTML(c.id)}">Edit</button></li>`;
}
function openMyIdeas() {
  title.textContent = 'My ideas';
  const signedIn = myNames().length > 0;
  if (signedIn && !liveIdeas && !myIdeasAsked && UPLOAD_ON()) { myIdeasAsked = true; loadIdeas(); }
  const mine = ideas().filter(isMine), calls = myCalls(), drafts = draftCards();
  const role = i => [credits(i.credit).some(isMe) ? 'Your idea' : '', leadsOf(i).some(isMe) ? 'You lead' : ''].filter(Boolean).join(' · ');
  const stages = STAGE_ORDER.map(st => [st, mine.filter(i => stageKey(i.stage) === st)]);
  body.innerHTML = `<div class="my-ideas">
    <p>${signedIn ? 'Every Idea Bank idea credited to you or led by you, by stage.' : 'Sign in with your own name and password to see the ideas credited to you.'}</p>
    ${signedIn ? `<ol class="stage-track" aria-label="Your ideas by stage">${stages.map(([st, list]) => `<li class="stage-step stage-step-${st}"><b>${list.length}</b><span>${STAGES[st]}</span></li>`).join('')}</ol>
    ${mine.length ? stages.filter(([, list]) => list.length).map(([st, list]) => `<h3 class="cal-head"><span class="stage stage-${st}">${STAGES[st]}</span></h3>
      <ul class="my-list">${list.map(i => `<li><button type="button" class="my-idea tint-${tintFor(i)}" data-action="idea" data-id="${escapeHTML(i.id)}"><strong>${escapeHTML(i.title)}</strong><span>${escapeHTML([role(i), (seriesById(i.series) || {}).label, (i.buildOns || []).length ? `${(i.buildOns || []).length} build-on${(i.buildOns || []).length === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · '))}</span></button></li>`).join('')}</ul>`).join('')
      : `<p class="quiet">${liveIdeas ? 'No ideas credited to you yet. Pitch one, or take the lead on an idea in the Idea Bank, and it shows up here.' : 'Loading your ideas…'}</p>`}` : ''}
    ${signedIn || isCoord() ? `<h3>My casting calls</h3>
    ${calls.length ? `<ul class="my-calls">${calls.map(callRow).join('')}</ul>` : '<p class="quiet">You haven’t posted a casting call yet. Post one to find creators for your idea.</p>'}` : ''}
    <h3>Drafts on this device</h3>
    ${drafts.length ? `<p class="quiet">Saved in this browser until you send them.</p><div class="draft-grid">${drafts.join('')}</div>` : '<p class="quiet">No unsent drafts on this device.</p>'}
    <div class="button-row">${signedIn || isCoord() ? '<button class="button" type="button" data-action="idea-new">Add an idea</button><button class="button secondary" type="button" data-action="call-new">Post a casting call</button>' : '<button class="button secondary" type="button" data-action="pitch">Pitch an idea</button>'}<a class="button secondary" href="${escapeHTML(pageUrl('ideas.html'))}">Open the Idea Bank</a></div>
  </div>`;
  showModal();
}

/* ---------- Post or edit a casting call ---------- */
function openCallForm(id = '', ideaId = '') {
  const c = id ? liveCalls.find(x => x.id === id) : null;
  if (id && !c) return;
  if (!myNames().length && !isCoord()) { title.textContent = 'Post a casting call'; body.innerHTML = '<p>Sign in with your own name and password to post a casting call.</p>'; return showModal(); }
  const idea = !c && ideaId ? ideas().find(i => i.id === ideaId) : null;
  const v = c || { title: idea ? idea.title : '', description: idea ? idea.summary || '' : '', instructions: '', steps: [], questions: [], deadline: '', audience: 'network' };
  const approved = c && c.audience === 'public' && c.review === 'approved';
  title.textContent = c ? 'Edit casting call' : 'Post a casting call';
  body.innerHTML = `<form id="call-form" novalidate>
    ${idea ? `<p class="quiet">For your idea “${escapeHTML(idea.title)}”. Posting it moves the idea to Casting.</p>` : '<p class="quiet">Find creators for a Reel. They film their part and send it right here.</p>'}
    <label for="cf-title">Title</label>
    <input id="cf-title" type="text" maxlength="80" value="${escapeHTML(v.title)}" required aria-describedby="cf-title-h"${c && c.responses ? ' readonly' : ''}>
    <p class="hint" id="cf-title-h">${c && c.responses ? 'Videos are filed under this title, so it stays as it is.' : 'Videos are filed under this title in the Squad’s Drive.'}</p>
    <label for="cf-desc">What’s the Reel about?</label>
    <textarea id="cf-desc" maxlength="600" required>${escapeHTML(v.description)}</textarea>
    <label for="cf-what">What should people film?</label>
    <input id="cf-what" type="text" maxlength="300" value="${escapeHTML(v.instructions)}" placeholder="For example: one 10-second clip folding your favorite stroller" required>
    <label for="cf-steps">How to film it <span class="quiet">(optional, one step per line)</span></label>
    <textarea id="cf-steps" maxlength="1600" placeholder="Hold the phone upright&#10;Film in good light">${escapeHTML((v.steps || []).join('\n'))}</textarea>
    <label for="cf-qs">Questions to answer <span class="quiet">(optional, one per line)</span></label>
    <textarea id="cf-qs" maxlength="2000">${escapeHTML((v.questions || []).join('\n'))}</textarea>
    <label for="cf-due">Due <span class="quiet">(optional)</span></label>
    <input id="cf-due" type="date" value="${escapeHTML(v.deadline || '')}" min="${today()}">
    <fieldset class="call-audience"><legend>Who can answer?</legend>
      <label class="check"><input type="radio" name="cf-aud" value="network"${v.audience !== 'public' ? ' checked' : ''}><span><strong>Creators Club only</strong>Live right away for signed-in creators.</span></label>
      <label class="check"><input type="radio" name="cf-aud" value="public"${v.audience === 'public' ? ' checked' : ''}><span><strong>Public: every Tot Squad specialist</strong>${isCoord() ? 'Goes on the public page right away, since you’re a coordinator.' : 'Live for the Creators Club right away. It shows on the public page once Taylor, Sarah or Linden approves it.'}</span></label>
    </fieldset>
    ${approved && !isCoord() ? '<p class="flow-note">This call is public. Changing its wording sends it back for approval; changing only the due date doesn’t.</p>' : ''}
    <div class="form-actions"><button class="button" type="submit" id="cf-go">${c ? 'Save changes' : 'Post casting call'}</button>${c ? `<button class="button secondary" type="button" id="cf-status">${c.status === 'closed' ? 'Reopen call' : 'Close call'}</button>` : ''}</div>
  </form>`;
  const val = x => document.getElementById(x).value.trim();
  $('#call-form').onsubmit = async ev => {
    ev.preventDefault();
    const call = { id: c ? c.id : '', ideaId: idea ? idea.id : '', title: val('cf-title'), description: val('cf-desc'), instructions: val('cf-what'), steps: val('cf-steps'), questions: val('cf-qs'), deadline: val('cf-due'),
      audience: (document.querySelector('input[name="cf-aud"]:checked') || {}).value || 'network' };
    const miss = [['cf-title', call.title, 'Give your casting call a title.'], ['cf-desc', call.description, 'Say what the Reel is about.'], ['cf-what', call.instructions, 'Say what people should film.']].find(x => !x[1]);
    if (miss) { status.textContent = miss[2]; return document.getElementById(miss[0]).focus(); }
    const go = $('#cf-go'), label = go.textContent; go.disabled = true; go.textContent = 'Saving…'; status.textContent = '';
    try {
      const res = await ideaRequest({ action:'call-save', call });
      if (!res.ok) throw new Error(res.error || '');
      upsertCall(res.call);
      if (idea) { const at = ideas().find(i => i.id === idea.id); if (at && stageKey(at.stage) === 'idea' && (isMine(at) || isCoord())) upsertIdea({ ...at, stage: 'casting' }); }
      const pub = res.call.audience === 'public', waiting = pub && res.call.review === 'waiting';
      title.textContent = c ? 'Casting call saved' : 'Your casting call is up';
      body.innerHTML = `<div class="cast-done"><h3>${escapeHTML(res.call.title)}</h3><p>${waiting ? 'It’s live for the Creators Club now. Taylor, Sarah or Linden will look it over before it goes on the public page.' : pub ? 'It’s live for every Tot Squad specialist, signed in or not.' : 'It’s live for signed-in Creators Club members.'} Videos people send land in the Squad’s Drive under its title.</p>
        <div class="button-row"><a class="button" href="${escapeHTML(pageUrl('index.html'))}#dash-casting">See it on your dashboard</a><button class="button secondary" type="button" data-action="my-ideas">My ideas</button></div></div>`;
      loadActivity();
    } catch (err) { status.textContent = err.message || 'That didn’t save. Check your connection and try again.'; go.disabled = false; go.textContent = label; }
  };
  if (c) $('#cf-status').onclick = async () => {
    const b = $('#cf-status'); b.disabled = true; status.textContent = 'Saving…';
    try { const res = await ideaRequest({ action:'call-status', id: c.id, status: c.status === 'closed' ? 'open' : 'closed' }); if (!res.ok) throw new Error(res.error || ''); upsertCall(res.call); status.textContent = res.call.status === 'closed' ? 'Closed. It no longer takes videos.' : 'Reopened.'; openCallForm(c.id); }
    catch (err) { status.textContent = err.message || 'That didn’t save. Try again in a minute.'; b.disabled = false; }
  };
  showModal();
}

const CAL_STATUS = {posted:['published','Posted'],editing:['editing','In edit'],filming:['filming','Filming'],casting:['casting','Casting'],scheduled:['idea','Scheduled'],idea:['idea','Idea']};
function calendarRow(x) {
  const [cls,label] = CAL_STATUS[x.status] || CAL_STATUS.idea;
  const when = dateValid(x.date) ? `<time datetime="${x.date}"><b>${fmt(x.date,{month:'short'})}</b>${fmt(x.date,{day:'numeric'})}</time>` : '<time class="tbd"><b>Date</b>TBD</time>';
  return `<li class="cal-row">${when}<div><strong>${escapeHTML(x.title)}</strong><span>${x.lead ? 'Led by '+escapeHTML(x.lead) : ''}</span></div><span class="stage stage-${cls}">${label}</span>${x.status === 'posted' ? externalLink(x.url,'Watch','text-button') : ''}</li>`;
}
function openCalendar() {
  const all = (content.contentCalendar || []).filter(x => x && x.title);
  const byDate = (a,b) => (a.date || '9999').localeCompare(b.date || '9999');
  const groups = [
    ['Up next', all.filter(x => !['posted','idea'].includes(x.status)).sort(byDate)],
    ['Posted', all.filter(x => x.status === 'posted').sort((a,b) => (b.date || '').localeCompare(a.date || ''))],
    ['Future ideas', all.filter(x => x.status === 'idea')]
  ].filter(([,list]) => list.length);
  title.textContent = 'Content calendar';
  body.innerHTML = (groups.length ? groups.map(([h,list]) => `<h3 class="cal-head">${h}</h3><ul class="cal-list">${list.map(calendarRow).join('')}</ul>`).join('') : '<p>No content is scheduled yet.</p>')
    + `<p class="quiet">From the Reels tracker. Dates are deadlines.</p><div class="button-row"><button class="button secondary" type="button" data-action="tracker">Open the Reels tracker</button></div>`;
  showModal();
}

function trackerRow(x) {
  const [cls,label] = CAL_STATUS[x.status] || CAL_STATUS.idea;
  const due = dateValid(x.date) ? (x.status === 'posted' ? '' : 'Due ')+fmt(x.date,{month:'short',day:'numeric'}) : (['idea','posted'].includes(x.status) ? '' : 'Date TBD');
  const meta = [x.lead ? 'Led by '+x.lead : '', due].filter(Boolean).join(' · ');
  const doc = briefDocId(x.briefUrl), synced = doc && (!LOCKED() || !!(syncedReels() && window.HUB_REELS.briefs && window.HUB_REELS.briefs[doc])); // briefs are for signed-in creators
  const links = [synced ? `<button type="button" class="text-button" data-action="brief" data-doc="${escapeHTML(doc)}" data-project="${escapeHTML(x.title)}">Read the brief</button>` : '',
    x.status === 'posted' ? externalLink(x.url,'Watch','text-button') : x.status !== 'idea' ? (UPLOAD_ON() ? `<button type="button" class="text-button" data-action="upload" data-dest="collab" data-project="${escapeHTML(x.title)}">Upload your clips</button>` : externalLink(content.submissionFolderUrl,'Upload your clips','text-button')) : ''].filter(Boolean).join('');
  return `<li class="trk-row"><div class="trk-top"><strong>${escapeHTML(x.title)}</strong><span class="stage stage-${cls}">${label}</span></div>${meta ? `<span class="trk-meta">${escapeHTML(meta)}</span>` : ''}${x.prompt ? `<p class="trk-prompt">${escapeHTML(x.prompt)}</p>` : ''}${links ? `<div class="trk-links">${links}</div>` : ''}</li>`;
}
function openTracker() {
  const all = (content.contentCalendar || []).filter(x => x && x.title);
  const byDate = (a,b) => (a.date || '9999').localeCompare(b.date || '9999');
  const groups = [
    ['In progress', all.filter(x => !['posted','idea'].includes(x.status)).sort(byDate)],
    ['Posted', all.filter(x => x.status === 'posted').sort((a,b) => (b.date || '').localeCompare(a.date || ''))],
    ['Future ideas', all.filter(x => x.status === 'idea')]
  ].filter(([,list]) => list.length);
  title.textContent = 'Reels tracker';
  body.innerHTML = (groups.length ? groups.map(([h,list]) => `<h3 class="cal-head">${h} <span class="quiet">${list.length}</span></h3><ul class="trk-list">${list.map(trackerRow).join('')}</ul>`).join('') : '<p>No Reels are on the tracker yet.</p>')
    + `<p class="quiet">Upload each Reel’s clips right here in the Creators Club. Dates are deadlines.</p><div class="button-row"><button class="button secondary" type="button" data-action="calendar">See it as a calendar</button></div>`;
  showModal();
}

// A published Squad Reel that shows the idea in action, linked straight to its Instagram video.
function exampleReel(i) {
  const p = allProjects.find(x => x.id === i.example); const url = p && isPublished(p) ? publicUrl(p.publishedReelUrl) : '';
  if (!url) return '';
  const src = imageUrl(p.thumbnail);
  return `<a class="example-reel" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${src ? `<img src="${escapeHTML(src)}" alt="" loading="lazy">` : ''}<span><small>See a Squad example</small><strong>${escapeHTML(p.title)}</strong><em>Watch on Instagram ↗</em></span></a>`;
}
function openIdea(id) {
  const i = ideas().find(x => x.id === id); if (!i) return;
  const s = seriesById(i.series); const stage = stageKey(i.stage);
  const list = (arr,tag='ul') => `<${tag}>${arr.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</${tag}>`;
  const has = arr => Array.isArray(arr) && arr.length;
  const variations = (i.variations || []).map(v => `<li><strong>${escapeHTML(v.title)}</strong>${v.text ? ' — '+escapeHTML(v.text) : ''}${byline(v) ? ` <span class="quiet">(${escapeHTML(byline(v))})</span>` : ''}</li>`).join('');
  const project = allProjects.find(p => p.ideaId === i.id);
  title.textContent = i.title;
  const leads = leadsOf(i), builds = (i.buildOns || []).slice().reverse();
  const names = squadNames(), savedName = storageGet(UPLOAD_NAME_KEY) || '';
  body.innerHTML = `<div class="detail tint-${tintFor(i)}">
    <div class="detail-meta"><span class="chip series">${escapeHTML(s ? s.label : 'Idea')}</span><span class="stage stage-${stage}">${STAGES[stage]}</span>${i.status === 'Pitched' ? '<span class="chip new">Just pitched</span>' : ''}${leads.length ? `<span class="chip lead">${leads.length > 1 ? 'Co-led' : 'Led'} by ${escapeHTML(leads.join(' & '))}</span>` : ''}</div>
    ${i.titleNote ? `<p class="idea-note">${escapeHTML(i.titleNote)}</p>` : ''}
    <section class="concept-base" aria-label="Original concept">
      <p class="concept-label">Original concept${byline(i) ? ` · ${escapeHTML(byline(i))}` : ''}</p>
      <p class="lede">${escapeHTML(i.summary || 'Details to come. Ask about it in Disco.')}</p>
      ${i.concept && i.concept !== i.summary ? `<p class="concept-text">${escapeHTML(i.concept)}</p>` : ''}
      ${exampleReel(i)}
    </section>
    ${has(i.howItWorks) ? '<h3>How it works</h3>'+list(i.howItWorks,'ol') : ''}
    ${has(i.guidance) ? `<h3>Before you film</h3><div class="guidance">${i.guidance.map(escapeHTML).join('<br>')}</div>` : ''}
    ${variations ? `<h3>Variations</h3><ul>${variations}</ul>` : ''}
    ${has(i.notes) ? '<h3>From the conversation</h3>'+list(i.notes) : ''}
    ${has(i.altNames) ? `<h3>Other names considered</h3><p>${escapeHTML(i.altNames.join(' · '))}</p>` : ''}
    ${has(i.questions) ? `<h3>Question bank</h3>${i.questions.map(q => `<div class="question"><span>${escapeHTML(q)}</span><button type="button" class="text-button" data-copy="${escapeHTML(q)}">Copy</button></div>`).join('')}` : ''}
    ${project ? `<h3>On this page</h3><p>${escapeHTML(project.title)} is in Made by the Squad${isPublished(project) ? ' and has a published Reel' : '; details are coming'}.</p>` : ''}
    <section class="buildons" aria-labelledby="bo-title">
      <h3 id="bo-title">Built on by the Squad${builds.length ? ` <span class="quiet">${builds.length}</span>` : ''}</h3>
      ${builds.length ? builds.map(n => `<div class="buildon"><div class="buildon-head"><strong>${escapeHTML(n.name)}</strong>${n.lead ? '<span class="chip lead">Took the lead</span>' : ''}<time datetime="${escapeHTML(n.date || '')}">${escapeHTML(timeAgo(n.date))}</time></div><p>${escapeHTML(n.note)}</p></div>`).join('')
        : `<p class="quiet">No notes yet. ${leads.length ? 'Add yours below.' : 'Be the first to build on it, and take the lead if you’d like.'}</p>`}
    </section>
    ${liveIdeas && !LOCKED() ? `<form id="build-form" class="build-form" novalidate>
      <h3>Build on this idea</h3>
      <p class="quiet">Add your take: a twist, a hook, a shot idea, who you’d film with. The original concept stays as it is.</p>
      <label for="bo-name">Your name</label>
      <select id="bo-name" required><option value="">Choose your name</option>${names.map(n => `<option${n === savedName ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select>
      <label for="bo-note">Your notes</label>
      <textarea id="bo-note" maxlength="1500" required placeholder="What would you add or change?"></textarea>
      <label class="check" id="bo-lead-row"><input type="checkbox" id="bo-lead"${leads.length ? '' : ' checked'}><span>${leads.length ? `Co-lead this idea with ${escapeHTML(leads.join(' & '))}` : 'Make me the lead on this idea'}</span></label>
      <div class="form-actions"><button class="button" type="submit" id="bo-go">Add my notes</button></div>
    </form>` : '<p class="quiet">Building on ideas works when the Idea Bank is connected. Try again in a moment.</p>'}
    <div class="button-row">${liveIdeas && !LOCKED() && ['idea','casting'].includes(stage) && (isMine(i) || isCoord()) ? `<button class="button" type="button" data-action="call-new" data-idea="${escapeHTML(i.id)}">Post a casting call</button>` : ''}${canEditIdea(i) ? `<button class="button secondary" data-action="idea-edit" data-id="${escapeHTML(i.id)}">Edit idea</button><button class="text-button danger" type="button" data-action="idea-delete" data-id="${escapeHTML(i.id)}">Delete idea</button>` : ''}${externalLink(i.discussionUrl || content.discoUrl, i.discussionUrl ? 'Idea discussion' : 'Talk about it in Disco','button secondary')}</div>
  </div>`;
  const form = body.querySelector ? body.querySelector('#build-form') : null; // (has() is shadowed in this function)
  if (form) {
    const nameSel = $('#bo-name'), leadRow = $('#bo-lead-row');
    const syncLead = () => { leadRow.hidden = leads.includes(nameSel.value); };
    nameSel.onchange = syncLead; syncLead();
    form.onsubmit = async ev => {
      ev.preventDefault();
      const name = nameSel.value, note = $('#bo-note').value.trim();
      if (!name) { status.textContent = 'Choose your name first.'; return nameSel.focus(); }
      if (!note) { status.textContent = 'Add your notes first.'; return $('#bo-note').focus(); }
      const go = $('#bo-go'); go.disabled = true; go.textContent = 'Adding…'; status.textContent = '';
      try {
        const res = await uploadRequest({ action:'idea-build', id: i.id, name, note, lead: !leadRow.hidden && $('#bo-lead').checked });
        if (!res.ok) throw new Error(res.error || '');
        storageSet(UPLOAD_NAME_KEY, name); upsertIdea(res.idea); openIdea(res.idea.id);
        status.textContent = leadsOf(res.idea).includes(name) && !leads.includes(name) ? `Added. You’re ${leadsOf(res.idea).length > 1 ? 'co-leading' : 'leading'} this idea now!` : 'Added. Thanks for building on it!';
        loadActivity();
      } catch (err) { status.textContent = err.message || 'That didn’t save. Check your connection and try again.'; go.disabled = false; go.textContent = 'Add my notes'; }
    };
  }
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
    body.innerHTML = nav+emptyState(collab ? 'Something fun is in the works!' : 'Good things are worth sharing.', collab ? 'No collaborations are accepting participants right now. Check back soon, or browse the Idea Bank for one to lead.' : 'Shareable messages will be available when a completed project has a verified published Reel link.', collab ? `<a class="button secondary" href="${IDEAS_URL}" data-tool-page="ideas.html" data-label="Idea Bank">Browse the Idea Bank</a>` : '')+'<div id="previous-draft"></div>';
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
    <section id="review" hidden><p>${action === 'share' ? 'Here’s your message. Copy it and share it wherever you like.' : sendsPitch(action) ? 'Check your pitch, then send it. It goes straight into the Idea Bank, and Sarah and Taylor review new pitches.' : 'Check your draft, copy it, then paste it into the right Disco discussion.'}</p>
      <textarea id="review-output" aria-label="${action === 'share' ? 'Shareable message' : 'Draft preview'}" readonly></textarea>
      ${sendsPitch(action) ? pitchSendBox() : ''}
      <div class="form-actions"><button class="button${sendsPitch(action) ? ' secondary' : ''}" type="button" id="copy-review">Copy ${label}</button><button class="button secondary" type="button" id="edit-draft">← Edit</button><button class="button secondary" type="button" id="download-review">Download</button><span id="disco-handoff"></span></div>
      ${action === 'share' ? '<p class="quiet">Copy your message, then paste it wherever you want to share the Reel. Nothing is posted automatically.</p>' : sendsPitch(action) ? '' : '<ol class="handoff-steps"><li>Review and copy your draft.</li><li>Open the Disco discussion.</li><li>Paste your draft, check it, and send it in Disco.</li></ol><p class="quiet">Opening Disco does not submit your draft. Your text stays here until you copy and post it.</p>'}
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
    $('#disco-handoff').innerHTML = action === 'share' || sendsPitch(action) ? '' : externalLink(discussion || content.discoUrl, discussion ? 'Open the discussion' : 'Open Social & Sharing chat');
    setStep(true);
    status.textContent = 'Ready for your review. Nothing has been sent.';
  };
  $('#edit-draft').onclick = () => { setStep(false); form.querySelector('input:not([type=hidden]),textarea,select')?.focus(); status.textContent = ''; };
  $('#save-draft').onclick = saveDraft;
  $('#download-draft').onclick = () => downloadText(draftText(action,values()),'tot-squad-'+action+'-draft.txt');
  $('#copy-review').onclick = () => copyText(output.value, output, action === 'share' ? 'Message copied. Paste it where you want to share the Reel.' : 'Draft copied. Open the Disco discussion, paste it, and send it there.');
  $('#download-review').onclick = () => downloadText(output.value,'tot-squad-'+action+'.txt');
  if (sendsPitch(action)) $('#send-pitch').onclick = () => sendPitch(values(), () => {
    memoryDrafts.delete(action); try { localStorage.removeItem('totsquad-'+action+'-v2'); } catch {}
    draftDirty = false;
  });
  $('#clear-draft').onclick = () => {
    memoryDrafts.delete(action);
    try { localStorage.removeItem('totsquad-'+action+'-v2'); status.textContent = 'Draft cleared from this device.'; } catch { status.textContent = 'Current form cleared; browser storage could not be cleared.'; }
    draftDirty = false; form.reset(); showBase(); context(); counters(); setStep(false);
  };
  showModal();
}

/* Quick share for a published Reel: the link with Copy link, a ready caption, and the phone share sheet when available. */
/* ---------- Reels page (reels.html): calendar, board and list, live from the Reels – Status Report sheet ---------- */
const REEL_STAGES = [
  ['casting','Casting'], ['filming','Filming'], ['editing','In edit'], ['upcoming','Up next'], ['posted','Posted'], ['idea','Ideas']
];
const REEL_STAGE_CLASS = { casting:'casting', filming:'filming', editing:'editing', upcoming:'idea', posted:'published', idea:'idea' };
const reelStageLabel = k => k === 'idea' ? 'Idea' : (REEL_STAGES.find(s => s[0] === k) || REEL_STAGES[3])[1];
let reelsData = null, reelsLive = false, reelsUpdated = '', reelsView = 'board', reelsMonth = null;
const normTitle = t => String(t || '').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function reelStatus(raw) {
  const t = String(raw || '').trim().toLowerCase();
  if (!t) return '';
  if (/post|publish|live/.test(t)) return 'posted';
  if (/edit/.test(t)) return 'editing';
  if (/film|shoot/.test(t)) return 'filming';
  if (/cast/.test(t)) return 'casting';
  if (/idea/.test(t)) return 'idea';
  if (/sched|next|soon/.test(t)) return 'upcoming';
  return 'upcoming';
}
// "Sunday 10/18", "11/13", "2026-11-13" → YYYY-MM-DD; the year is whichever puts it closest to today.
function sheetDate(raw, today = new Date()) {
  const t = String(raw || '').trim();
  const iso = t.match(/(\d{4})-(\d{2})-(\d{2})/); if (iso) return iso[0];
  const md = t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/); if (!md) return '';
  const m = +md[1], d = +md[2]; if (m < 1 || m > 12 || d < 1 || d > 31) return '';
  const pad = n => String(n).padStart(2,'0');
  if (md[3]) { const y = md[3].length === 2 ? 2000 + +md[3] : +md[3]; return `${y}-${pad(m)}-${pad(d)}`; }
  const y0 = today.getFullYear();
  const best = [y0 - 1, y0, y0 + 1].map(y => [y, Math.abs(new Date(y, m - 1, d) - today)]).sort((a,b) => a[1] - b[1])[0][0];
  return `${best}-${pad(m)}-${pad(d)}`;
}
function hubReel(sheetTitle) {
  const key = normTitle(sheetTitle);
  return (content.contentCalendar || []).find(x => x && (normTitle(x.sheetTitle) === key || normTitle(x.title) === key));
}
// One shape for both sources: live sheet rows, or the copy in content.js.
function buildReels(rows, live) {
  return rows.map((r, i) => {
    const hub = live ? hubReel(r.title) : r;
    const project = hub && hub.project ? allProjects.find(p => p.id === hub.project) : null;
    const status = (live ? reelStatus(r.status) : reelStatus(r.status === 'scheduled' ? 'upcoming' : r.status)) || (hub && reelStatus(hub.status === 'scheduled' ? 'upcoming' : hub.status)) || 'upcoming';
    const date = (live ? sheetDate(r.deadline) : '') || (hub && dateValid(hub.date) ? hub.date : '');
    return {
      id: 'r'+i, title: (hub && hub.title) || r.title, lead: r.lead || (hub && hub.lead) || '',
      status, date, pastDue: live && status !== 'posted' && /past due/i.test(r.deadline || ''),
      prompt: r.prompt || (hub && hub.prompt) || '', briefUrl: publicUrl(r.briefUrl) || publicUrl(hub && hub.briefUrl),
      folderUrl: publicUrl(r.folderUrl) || (status !== 'idea' ? publicUrl(content.submissionFolderUrl) : ''),
      url: publicUrl(hub && hub.url) || publicUrl(project && project.publishedReelUrl),
      image: imageUrl(project && project.thumbnail), people: (project && project.participatingSpecialists) || [],
      projectId: project && isPublished(project) ? project.id : '',
      row: live && r.row ? r.row : 0, raw: live ? r : null // the sheet row, for coordinators' edits
    };
  });
}
// The Reels tracker copied into the site by scripts/sync-from-google.cjs (reels-data.js); content.js is the fallback.
const syncedReels = () => (typeof window !== 'undefined' && window.HUB_REELS && Array.isArray(window.HUB_REELS.reels) && window.HUB_REELS.reels.length) ? window.HUB_REELS : null;
function loadReels() {
  const synced = syncedReels();
  reelsData = synced ? buildReels(synced.reels, true) : buildReels((content.contentCalendar || []).filter(x => x && x.title), false);
  reelsLive = !!synced; reelsUpdated = synced ? synced.updated || '' : '';
  renderReels();
  refreshReelsLive();
}
// Signed in: swap the copy for the sheet as it is right now (and the row numbers coordinators edit by).
let reelsFresh = false;
async function refreshReelsLive() {
  if (!UPLOAD_ON() || !mentorKey() || !has('#reels-view')) return;
  try {
    const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=reels&key=${encodeURIComponent(mentorKey())}`);
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.reels)) setLiveReels(data);
  } catch {}
}
function setLiveReels(data) { reelsData = buildReels(data.reels, true); reelsLive = true; reelsFresh = true; reelsUpdated = data.updated || ''; renderReels(); }

/* Coordinators: add, edit, move and delete Reels from the tracker and the calendar (apps-script/club.gs → admin-reel).
   Every change goes straight into the Reels – Status Report sheet. */
const isCoord = () => !!storageGet(COORD_CODE_KEY);
const REEL_FORM_STAGES = [['casting','Casting'],['filming','Filming'],['editing','In edit'],['upcoming','Scheduled'],['posted','Posted'],['idea','Future idea']];
function reelValues(r) {
  if (!r) return { title:'', lead:'', status:'upcoming', deadline:'', prompt:'', briefUrl:'', folderUrl:'' };
  const raw = r.raw || {};
  return { title: raw.title || r.title, lead: raw.lead || '', status: r.status, deadline: raw.deadline || '', prompt: raw.prompt || '', briefUrl: raw.briefUrl || '', folderUrl: raw.folderUrl || '' };
}
function openReelForm(rid, preset = {}) {
  const r = rid ? (reelsData || []).find(x => x.id === rid) : null;
  if (rid && (!r || !r.row)) { title.textContent = 'Edit Reel'; body.innerHTML = '<p>This Reel is still loading from the sheet. Close this and try again in a few seconds.</p>'; return showModal(); }
  const v = reelValues(r), date = r ? r.date : (dateValid(preset.date) ? preset.date : ''), stage = r ? r.status : (REEL_STAGE_CLASS[preset.stage] ? preset.stage : 'upcoming');
  title.textContent = r ? 'Edit Reel' : 'Add a Reel';
  body.innerHTML = `<p>${r ? 'Changes go straight into the Reels – Status Report sheet.' : 'It goes straight into the Reels – Status Report sheet and shows on the tracker and the calendar.'}</p>
    <form id="reel-form" class="reel-form" novalidate>
      <label for="rf-title">Title</label><input id="rf-title" type="text" maxlength="120" required value="${escapeHTML(v.title)}">
      <label for="rf-lead">Lead</label><input id="rf-lead" type="text" maxlength="80" list="rf-leads" value="${escapeHTML(v.lead)}"><datalist id="rf-leads">${squadNames().map(n => `<option value="${escapeHTML(n)}">`).join('')}</datalist>
      <div class="form-row">
        <div><label for="rf-status">Stage</label><select id="rf-status">${REEL_FORM_STAGES.map(([k,l]) => `<option value="${k}"${k === stage ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label for="rf-date">Deadline</label><input id="rf-date" type="date" value="${escapeHTML(date)}">${r && !date && v.deadline ? `<span class="quiet">On the sheet: ${escapeHTML(v.deadline)}</span>` : ''}</div>
      </div>
      <label for="rf-prompt">Prompt</label><textarea id="rf-prompt" rows="3" maxlength="600" placeholder="What should specialists film?">${escapeHTML(v.prompt)}</textarea>
      <label for="rf-brief">Brief (Google Doc link)</label><input id="rf-brief" type="url" inputmode="url" placeholder="https://docs.google.com/document/d/…" value="${escapeHTML(v.briefUrl)}">
      <label for="rf-folder">Drive folder link <span class="quiet">(optional)</span></label><input id="rf-folder" type="url" inputmode="url" placeholder="https://drive.google.com/drive/folders/…" value="${escapeHTML(v.folderUrl)}">
      <div class="form-actions"><button class="button" type="submit" id="rf-save">${r ? 'Save changes' : 'Add Reel'}</button>${r ? `<button type="button" class="button secondary" data-reel="${r.id}">Cancel</button><button type="button" class="text-button danger" data-action="reel-delete" data-rid="${r.id}">Delete this Reel</button>` : ''}</div>
    </form>`;
  $('#reel-form').onsubmit = ev => { ev.preventDefault(); saveReel(r, date); };
  showModal();
  $('#rf-title').focus();
}
async function reelRequest(payload) {
  return uploadRequest({ action:'admin-reel', coordKey: storageGet(COORD_CODE_KEY) || '', coordName: storageGet(UPLOAD_NAME_KEY) || 'Coordinator', ...payload });
}
function reelError(res) {
  if (res && res.coordLocked) return 'Coordinator tools need the coordinator password. Sign out, then sign in again with it.';
  return (res && res.error) || 'That didn’t save. Try again in a minute.';
}
async function saveReel(r, loadedDate) {
  const val = id => $(id).value.trim(), btn = $('#rf-save');
  const was = reelValues(r), date = $('#rf-date').value;
  const next = { title: val('#rf-title'), lead: val('#rf-lead'), status: $('#rf-status').value, prompt: val('#rf-prompt'), briefUrl: val('#rf-brief'), folderUrl: val('#rf-folder'),
    deadline: r && date === loadedDate ? was.deadline : date }; // an untouched date keeps the sheet's own wording ("PAST DUE", "Sunday 10/18")
  status.textContent = '';
  if (!next.title) { status.textContent = 'Give the Reel a title.'; $('#rf-title').focus(); return; }
  const bad = [['#rf-brief', next.briefUrl], ['#rf-folder', next.folderUrl]].find(([, u]) => u && !/^https:\/\/\S+$/.test(u));
  if (bad) { status.textContent = 'Links need to start with https://'; $(bad[0]).focus(); return; }
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const res = await reelRequest(r ? { op:'update', row: r.row, was: was.title, orig: was, reel: next } : { op:'create', reel: next });
    if (!res || !res.ok) { status.textContent = reelError(res); btn.disabled = false; btn.textContent = r ? 'Save changes' : 'Add Reel'; return; }
    setLiveReels(res);
    const saved = (reelsData || []).find(x => x.row === res.row);
    if (saved) { openReel(saved.id); status.textContent = r ? 'Saved.' : 'Added to the tracker.'; }
    else { modal.close(); toast(r ? 'Saved.' : 'Added to the tracker.'); }
  } catch { status.textContent = 'That didn’t save. Check your connection and try again.'; btn.disabled = false; btn.textContent = r ? 'Save changes' : 'Add Reel'; }
}
function openReelDelete(rid) {
  const r = (reelsData || []).find(x => x.id === rid); if (!r || !r.row) return;
  title.textContent = 'Delete this Reel?';
  body.innerHTML = `<p><strong>${escapeHTML(r.title)}</strong> comes off the tracker and the calendar, and its row is removed from the Reels – Status Report sheet. Its brief and Drive folder aren’t touched.</p>
    <div class="form-actions"><button type="button" class="button danger" id="rd-go">Delete</button><button type="button" class="button secondary" data-reel="${r.id}">Keep it</button></div>`;
  $('#rd-go').onclick = async () => {
    const btn = $('#rd-go'); btn.disabled = true; btn.textContent = 'Deleting…'; status.textContent = '';
    try {
      const res = await reelRequest({ op:'delete', row: r.row, was: reelValues(r).title });
      if (!res || !res.ok) { status.textContent = reelError(res); btn.disabled = false; btn.textContent = 'Delete'; return; }
      setLiveReels(res); modal.close(); toast(`Deleted “${r.title}”.`);
    } catch { status.textContent = 'That didn’t delete. Check your connection and try again.'; btn.disabled = false; btn.textContent = 'Delete'; }
  };
  showModal();
}
const dueLabel = r => r.date ? fmt(r.date,{month:'short',day:'numeric'}) : r.pastDue ? 'Past due' : '';
const overdue = r => r.date && !['posted','idea'].includes(r.status) && !upcoming(r.date);
function reelChip(r, cls='reel-chip') {
  return `<button type="button" class="${cls} stage-${REEL_STAGE_CLASS[r.status]}" data-reel="${r.id}"><span class="reel-chip-title">${escapeHTML(r.title)}</span></button>`;
}
function reelCard(r) {
  const due = dueLabel(r);
  return `<button type="button" class="reel-card" data-reel="${r.id}">${r.image ? `<img src="${escapeHTML(r.image)}" alt="" loading="lazy">` : ''}
    <strong>${escapeHTML(r.title)}</strong>
    <span class="reel-card-meta">${r.lead ? escapeHTML(r.lead) : ''}${r.lead && due ? ' · ' : ''}${due ? `<span class="${overdue(r) ? 'late' : ''}">${escapeHTML(overdue(r) ? 'Was due '+due : (r.status === 'posted' ? due : 'Due '+due))}</span>` : ''}</span></button>`;
}
function reelsCalendar(list) {
  const today = new Date(); const base = reelsMonth || new Date(today.getFullYear(), today.getMonth(), 1);
  reelsMonth = base;
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const iso = d => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const todayIso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push('<div class="cal-cell empty" aria-hidden="true"></div>');
  for (let d = 1; d <= days; d++) {
    const due = list.filter(r => r.date === iso(d));
    const add = isCoord() ? `<button type="button" class="cal-add" data-action="reel-new" data-date="${iso(d)}" aria-label="Add a Reel due ${escapeHTML(first.toLocaleDateString('en-US',{month:'long'}))} ${d}">+</button>` : '';
    cells.push(`<div class="cal-cell${iso(d) === todayIso ? ' today' : ''}${due.length ? ' has' : ''}"><span class="cal-day">${d}${add}</span>${due.map(r => reelChip(r)).join('')}</div>`);
  }
  const monthName = first.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const inMonth = list.filter(r => r.date && r.date.startsWith(iso(1).slice(0,7))).sort((a,b) => a.date.localeCompare(b.date));
  const undated = list.filter(r => !r.date && !['posted','idea'].includes(r.status));
  return `<div class="cal-head-row"><button type="button" class="icon-button" data-month="-1" aria-label="Previous month">‹</button><h2>${monthName}</h2><button type="button" class="icon-button" data-month="1" aria-label="Next month">›</button><button type="button" class="text-button" data-month="0">Today</button></div>
    <div class="cal-grid" role="grid" aria-label="${monthName}">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(w => `<div class="cal-dow" aria-hidden="true">${w}</div>`).join('')}${cells.join('')}</div>
    <div class="cal-agenda"><h3>Due in ${first.toLocaleDateString('en-US',{month:'long'})}</h3>${inMonth.length ? `<ul>${inMonth.map(r => `<li>${reelChip(r,'reel-chip reel-row')}<span>${fmt(r.date,{month:'short',day:'numeric'})}</span></li>`).join('')}</ul>` : '<p class="quiet">Nothing due this month.</p>'}</div>
    ${undated.length ? `<div class="cal-undated"><h3>No date yet</h3><div class="chip-row">${undated.map(r => reelChip(r)).join('')}</div></div>` : ''}`;
}
function reelsBoard(list) {
  const byDate = (a,b) => (a.date || '9999').localeCompare(b.date || '9999');
  return `<div class="reel-board">${REEL_STAGES.map(([k,label]) => {
    const items = list.filter(r => r.status === k).sort(k === 'posted' ? (a,b) => (b.date || '').localeCompare(a.date || '') : byDate);
    return `<section class="reel-col col-${REEL_STAGE_CLASS[k]}" aria-label="${label}"><h2><span class="stage stage-${REEL_STAGE_CLASS[k]}">${label}</span><span class="count">${items.length}</span></h2>${isCoord() ? `<button type="button" class="text-button col-add" data-action="reel-new" data-stage="${k}">+ Add a Reel</button>` : ''}${items.length ? items.map(reelCard).join('') : '<p class="quiet">Nothing here right now.</p>'}</section>`;
  }).join('')}</div>`;
}
function reelsList(list) {
  const byDate = (a,b) => (a.date || '9999').localeCompare(b.date || '9999');
  const groups = [['In progress', list.filter(r => !['posted','idea'].includes(r.status)).sort(byDate)], ['Posted', list.filter(r => r.status === 'posted').sort((a,b) => (b.date || '').localeCompare(a.date || ''))], ['Ideas', list.filter(r => r.status === 'idea')]].filter(([,l]) => l.length);
  return groups.map(([h,l]) => `<h2 class="list-head">${h} <span class="quiet">${l.length}</span></h2><ul class="reel-list">${l.map(r => `<li><button type="button" class="reel-line" data-reel="${r.id}">${r.date ? `<time datetime="${r.date}"><b>${fmt(r.date,{month:'short'})}</b>${fmt(r.date,{day:'numeric'})}</time>` : `<time class="tbd"><b>Date</b>TBD</time>`}<span class="reel-line-text"><strong>${escapeHTML(r.title)}</strong><span>${r.lead ? 'Led by '+escapeHTML(r.lead) : ''}</span></span><span class="stage stage-${REEL_STAGE_CLASS[r.status]}">${reelStageLabel(r.status)}</span></button></li>`).join('')}</ul>`).join('');
}
function renderReels() {
  if (!has('#reels-view')) return;
  const list = reelsData || [];
  const q = new URLSearchParams(location.search).get('view');
  if (!renderReels.started) { renderReels.started = true; if (['calendar','board','list'].includes(q)) reelsView = q; }
  ['calendar','board','list'].forEach(v => { const t = document.getElementById ? document.getElementById('tab-'+v) : null; if (t) { t.setAttribute('aria-selected', String(v === reelsView)); t.tabIndex = v === reelsView ? 0 : -1; } });
  const live = list.filter(r => !['posted','idea'].includes(r.status)).length;
  if (has('#reels-summary')) $('#reels-summary').textContent = list.length ? `${live} in progress, ${list.filter(r => r.status === 'posted').length} posted.` : '';
  if (has('#reels-sheet')) $('#reels-sheet').innerHTML = (isCoord() && UPLOAD_ON() ? '<button type="button" class="button" data-action="reel-new">Add a Reel</button>' : '') + (UPLOAD_ON() ? uploadButton('Upload your clips','collab','','button'+(isCoord() ? ' secondary' : '')) : '');
  if (has('#reels-source')) $('#reels-source').textContent = reelsFresh ? 'Live from the Reels tracker' : reelsLive ? `From the Reels tracker${reelsUpdated ? ' · copied '+new Date(reelsUpdated).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : ''}` : '';
  $('#reels-view').innerHTML = !list.length ? emptyState('No Reels yet.','New Reels show up here as soon as Sarah and Taylor add them.', '', ICON.play)
    : reelsView === 'calendar' ? reelsCalendar(list) : reelsView === 'list' ? reelsList(list) : reelsBoard(list);
}
/* Briefs: the Google Doc linked in the sheet, shown in the Reel's details (apps-script/upload.gs → ?action=brief). */
const briefDocId = url => { const m = String(url || '').match(/\/document\/d\/([\w-]{20,})/); return m ? m[1] : ''; };
function briefLink(href) {
  try { const u = new URL(href); if (u.hostname === 'www.google.com' && u.pathname === '/url' && u.searchParams.get('q')) return publicUrl(u.searchParams.get('q')); } catch {}
  return publicUrl(href);
}
// Upload folders named in a brief: Tot Squad's Drive is private, so they become the in-app upload button.
const DRIVE_FOLDER_RE = /(https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[\w-]+\S*)/;
const isDriveFolder = href => !!href && /^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\//.test(href);
function briefUpload(project) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'text-button'; b.textContent = 'Upload your clips here';
  b.dataset.action = 'upload'; b.dataset.dest = 'collab'; if (project) b.dataset.project = project; return b;
}
// Rebuild the exported doc with a short list of safe elements; everything else is dropped or unwrapped.
function renderBrief(target, html, project = '') {
  target.replaceChildren();
  if (typeof DOMParser === 'undefined') { const p = document.createElement('p'); p.textContent = String(html).replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); target.append(p); return; }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const MAP = { H1:'h3', H2:'h3', H3:'h4', H4:'h4', H5:'h4', H6:'h4', P:'p', UL:'ul', OL:'ol', LI:'li', BR:'br', STRONG:'strong', B:'strong', EM:'em', I:'em', TABLE:'table', TBODY:'tbody', THEAD:'thead', TR:'tr', TD:'td', TH:'th', HR:'hr' };
  const walk = (node, out) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        if (!n.textContent) continue;
        const parts = UPLOAD_ON() ? n.textContent.split(DRIVE_FOLDER_RE) : [n.textContent]; // pasted folder links too
        parts.forEach((part, i) => { if (i % 2) out.append(briefUpload(project)); else if (part) out.append(document.createTextNode(part)); });
        continue;
      }
      if (n.nodeType !== 1 || ['SCRIPT','STYLE','HEAD','META','TITLE','IFRAME','OBJECT','FORM','INPUT','BUTTON','SVG'].includes(n.tagName)) continue;
      const style = (n.getAttribute('style') || '').toLowerCase();
      if (n.tagName === 'A' && UPLOAD_ON() && isDriveFolder(briefLink(n.getAttribute('href')))) { out.append(briefUpload(project)); continue; }
      if (n.tagName === 'A') { const href = briefLink(n.getAttribute('href')); if (href) { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; walk(n, a); out.append(a); } else walk(n, out); continue; }
      if (n.tagName === 'IMG') { const src = n.getAttribute('src') || ''; if (/^https:\/\/[\w.-]*googleusercontent\.com\//.test(src)) { const img = document.createElement('img'); img.src = src; img.alt = ''; img.loading = 'lazy'; img.className = 'brief-img'; out.append(img); } continue; }
      if (n.tagName === 'SPAN' && /font-weight:\s*(700|bold)/.test(style)) { const b = document.createElement('strong'); walk(n, b); out.append(b); continue; }
      if (n.tagName === 'SPAN' && /font-style:\s*italic/.test(style)) { const i = document.createElement('em'); walk(n, i); out.append(i); continue; }
      const tag = MAP[n.tagName];
      if (!tag) { walk(n, out); continue; }
      const el = document.createElement(tag); walk(n, el);
      if (['p','h3','h4','li'].includes(tag) && !el.textContent.trim() && !el.querySelector('img')) continue;
      out.append(el);
    }
  };
  walk(doc.body, target);
  if (!target.textContent.trim() && !target.querySelector('img')) { const p = document.createElement('p'); p.className = 'quiet'; p.textContent = 'This brief is empty.'; target.append(p); }
}
function loadBrief(r) {
  const id = briefDocId(r.briefUrl), box = document.getElementById ? document.getElementById('brief-body') : null;
  if (!id || !box) return;
  const brief = syncedReels() && window.HUB_REELS.briefs && window.HUB_REELS.briefs[id];
  const later = () => { box.innerHTML = `<p class="quiet">The brief is on its way. ${r.lead ? 'Ask '+escapeHTML(r.lead)+' in Disco if you need it sooner.' : ''}</p>`; };
  if (brief) return renderBrief(box, brief.html, r.title);
  if (!UPLOAD_ON() || !mentorKey()) return later();
  // A brief added since the last copy: read it live.
  fetch(`${publicUrl(content.uploadEndpoint)}?action=brief&id=${encodeURIComponent(id)}&key=${encodeURIComponent(mentorKey())}`).then(res => res.json())
    .then(d => { if (d && d.ok && d.html) renderBrief(box, d.html, r.title); else later(); }).catch(later);
}

// A Reel's brief, read in the app (the doc itself is in Tot Squad's private Drive). Signed-in creators read it live:
// briefs are never copied into the public site.
function openBrief(doc, project) {
  const brief = syncedReels() && window.HUB_REELS.briefs && window.HUB_REELS.briefs[doc];
  if (!brief && LOCKED()) return;
  title.textContent = project || (brief && brief.title) || 'The brief';
  body.innerHTML = `<div class="brief-body" id="brief-body"><p class="quiet">Loading the brief…</p></div><div class="button-row"><button type="button" class="button secondary" data-action="tracker">Back to the Reels tracker</button></div>`;
  if (brief) renderBrief(document.getElementById('brief-body'), brief.html, project);
  else loadBrief({ briefUrl: 'https://docs.google.com/document/d/' + doc + '/edit', title: project, lead: '' });
  showModal();
}
function openReel(id) {
  const r = (reelsData || []).find(x => x.id === id); if (!r) return;
  title.textContent = r.title;
  const due = r.date ? (r.status === 'posted' ? 'Posted '+fmt(r.date,{month:'long',day:'numeric'}) : (overdue(r) ? 'Was due ' : 'Due ')+fmt(r.date,{weekday:'long',month:'long',day:'numeric'})) : r.pastDue ? 'Past due' : r.status === 'idea' ? '' : 'Deadline not set';
  const live = !['posted','idea'].includes(r.status);
  body.innerHTML = `${r.image ? `<img class="reel-detail-art" src="${escapeHTML(r.image)}" alt="">` : ''}
    <p class="reel-detail-meta"><span class="stage stage-${REEL_STAGE_CLASS[r.status]}">${reelStageLabel(r.status)}</span>${r.lead ? `<span>Led by ${escapeHTML(r.lead)}</span>` : ''}${due ? `<span>${escapeHTML(due)}</span>` : ''}</p>
    ${r.prompt ? `<h3 class="cal-head">The prompt</h3><p>${escapeHTML(r.prompt)}</p>` : ''}
    ${r.people.length ? `<h3 class="cal-head">Featuring</h3><p>${escapeHTML(r.people.join(', '))}</p>` : ''}
    <div class="button-row">${r.status === 'posted' && r.url ? externalLink(r.url,'Watch','button') : ''}${r.lead && r.status !== 'posted' ? messageLead(r.lead) : ''}${r.projectId ? `<button type="button" class="button secondary" data-action="reel-share" data-project="${escapeHTML(r.projectId)}">Share</button>` : ''}${live ? uploadButton('Upload your clips','collab',r.title) : ''}${!UPLOAD_ON() && live && r.folderUrl ? externalLink(r.folderUrl,'Open the folder','button secondary') : ''}</div>
    ${isCoord() && r.row ? `<div class="coord-row"><span class="quiet">Coordinator</span><button type="button" class="text-button" data-action="reel-edit" data-rid="${r.id}">Edit</button><button type="button" class="text-button danger" data-action="reel-delete" data-rid="${r.id}">Delete</button></div>` : ''}
    ${r.briefUrl && briefDocId(r.briefUrl) ? `<section class="reel-brief" aria-labelledby="brief-head"><div class="reel-brief-top"><h3 class="cal-head" id="brief-head">The brief</h3></div><div class="brief-body" id="brief-body" data-doc="${escapeHTML(briefDocId(r.briefUrl))}"><p class="quiet">Loading the brief…</p></div></section>` : ''}`;
  if (r.briefUrl) loadBrief(r);
  showModal();
}

/* ---------- Send a pitch to the pitch sheet (apps-script/upload.gs) ---------- */
const sendsPitch = action => action === 'pitch' && UPLOAD_ON();
function pitchSendBox() {
  const savedName = storageGet(UPLOAD_NAME_KEY) || '';
  return `<div class="send-box" id="send-box">
    <label for="send-name">Your name</label><select id="send-name"><option value="">Choose your name</option>${squadNames().map(n => `<option${n === savedName ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select>
    <input class="hp" id="send-website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="form-actions"><button class="button" type="button" id="send-pitch">Send pitch</button></div></div>`;
}
async function sendPitch(d, onSent) {
  const name = $('#send-name').value, btn = $('#send-pitch');
  if (!name) { status.textContent = 'Choose your name first.'; $('#send-name').focus(); return; }
  const base = ideas().find(i => i.id === d.basedOn);
  const pitch = { title:d.title, series:d.series, audience:d.audience, idea:d.idea, hook:d.hook, takeaway:d.takeaway, shots:d.shots, format:d.format, lead:d.lead, support:d.support, basedOn: base ? base.title : '' };
  btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
  try {
    const res = await uploadRequest({ action:'pitch', name, pitch, website: $('#send-website').value });
    if (!res.ok) { status.textContent = res.error || 'That didn’t send. Try again in a minute.'; btn.disabled = false; btn.textContent = 'Send pitch'; return; }
    storageSet(UPLOAD_NAME_KEY, name);
    if (res.idea) upsertIdea(res.idea);
    btn.textContent = 'Sent'; status.innerHTML = `Pitch sent! It’s in the Idea Bank now. ${has('#idea-grid') ? '' : `<a class="text-button" href="${escapeHTML(IDEAS_URL)}" data-tool-page="ideas.html" data-label="Idea Bank">See it in the Idea Bank</a> `}${chatLink(content.discoUrl)}`;
    onSent && onSent();
  } catch { status.textContent = 'That didn’t send. Check your connection and try again.'; btn.disabled = false; btn.textContent = 'Send pitch'; }
}

/* ---------- Upload clips straight to Drive (apps-script/upload.gs) ---------- */
const UPLOAD_ON = () => !!publicUrl(content.uploadEndpoint);
// Local design preview only (.qa/preview sets testBackend in its copy of content.js; the published content.js never has it):
// confirmations say plainly that nothing was sent.
const SIMULATED = () => content.testBackend === true;
const simulatedNote = (what = 'This upload was simulated. No file reached Drive.') => SIMULATED() ? `<strong class="simulated">Preview only: ${escapeHTML(what)}</strong> ` : '';
try { localStorage.removeItem('totsquad-upload-passcode'); } catch {} // the old Squad passcode is no longer used
const UPLOAD_NAME_KEY = 'totsquad-upload-name';
function uploadTargets() {
  const live = ['casting','filming','editing','scheduled'];
  const titles = [...content.activeCollaborations.filter(p => p.status !== 'published').map(p => p.title),
    ...(content.contentCalendar || []).filter(x => x && live.includes(x.status) && x.status !== 'casting').map(x => x.title),
    ...(reelsData || []).filter(r => ['filming','editing','upcoming'].includes(r.status)).map(r => r.title)];
  return [...new Set(titles.filter(Boolean))];
}
// Meet the Squad: a card shows the full name once that person has claimed it.
const shownName = p => (squadClaims.find(c => sameName(c.claimed, p.name)) || {}).name || p.name;
function baseSquadNames() { return [...new Set([...(content.featuredSpecialists || []).map(p => p && p.name), content.leader && content.leader.name].filter(Boolean))].sort(); }
/* Once someone claims their Squad name and adds their last name, name pickers show "Kristin Jenkins" instead of the
   "Kristin" placeholder (apps-script ?action=claimed). The claim list and the set-up form still use baseSquadNames(). */
let squadClaims = (() => { try { return JSON.parse(storageGet('totsquad-claims') || '[]'); } catch { return []; } })();
function squadNames() {
  const full = n => (squadClaims.find(c => sameName(c.claimed, n)) || {}).name || n;
  return [...new Set(baseSquadNames().map(full))].sort();
}
async function loadClaims() {
  if (!UPLOAD_ON() || typeof fetch !== 'function') return;
  try {
    const d = await (await fetch(`${publicUrl(content.uploadEndpoint)}?action=claimed`)).json();
    if (!d || !Array.isArray(d.claims)) return;
    const changed = JSON.stringify(d.claims) !== JSON.stringify(squadClaims);
    squadClaims = d.claims; storageSet('totsquad-claims', JSON.stringify(d.claims));
    if (changed && typeof renderDashboard === 'function' && has('#club-dash')) renderDashboard();
    if (changed && has('#squad-grid')) renderSquad();
  } catch {}
}
// Upload button when the form is set up, otherwise a link to the Drive folder.
function uploadButton(label, dest, project, cls='button', fallbackUrl) {
  if (!UPLOAD_ON()) return externalLink(fallbackUrl || (dest === 'broll' ? brollFolder() : content.submissionFolderUrl), label, cls);
  return `<button type="button" class="${escapeHTML(cls)}" data-action="upload" data-dest="${escapeHTML(dest)}"${project ? ` data-project="${escapeHTML(project)}"` : ''}>${escapeHTML(label)}</button>`;
}
const sizeLabel = n => n >= 1e9 ? (n/1e9).toFixed(1)+' GB' : n >= 1e6 ? Math.round(n/1e6)+' MB' : Math.max(1, Math.round(n/1e3))+' KB';
function openUpload(d={}) {
  title.textContent = 'Upload your clips';
  const targets = uploadTargets();
  const project = d.project ? (allProjects.find(p => p.id === d.project) || {}).title || d.project : '';
  const dest = d.dest === 'collab' ? (project || targets[0] || '') : 'broll';
  const savedName = storageGet(UPLOAD_NAME_KEY) || '';
  if (LOCKED()) { // any specialist, no password: B-roll only
    body.innerHTML = `<p>Share clips any specialist can drop into a Squad Reel. A coordinator checks every clip before it joins the library.</p>
      <form id="upload-form" novalidate>
        <label for="up-name">Your name, as it appears in Disco</label>
        <input id="up-name" type="text" autocomplete="name" maxlength="80" value="${escapeHTML(savedName)}" required>
        <input id="up-dest" type="hidden" value="broll">
        <label for="up-files">Videos or photos</label>
        <input id="up-files" type="file" accept="video/*,image/*" multiple required>
        <p class="quiet">Vertical (9:16), 3 to 15 seconds, no talking or music. Up to 2 GB per file.</p>
        <label class="check agree"><input type="checkbox" id="up-agree">Everyone on camera said yes, and there are no babies’ faces, client names, registries or order details.</label>
        <ul class="upload-list" id="upload-list" aria-live="polite"></ul>
        <div class="form-actions"><button class="button" type="submit" id="up-go">Upload</button></div>
      </form>`;
    $('#upload-form').onsubmit = ev => { ev.preventDefault(); runUpload(); };
    return showModal();
  }
  body.innerHTML = `<p>Your clips go straight into the Squad’s Google Drive, in a folder with your name. No Drive link needed.</p>
    <form id="upload-form" novalidate>
      <label for="up-name">Who’s uploading?</label>
      <select id="up-name" required><option value="">Choose your name</option>${squadNames().map(n => `<option${n === savedName ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select>
      <label for="up-dest">What are these for?</label>
      <select id="up-dest"><option value="broll"${dest === 'broll' ? ' selected' : ''}>B-roll library (extra footage for Reels)</option>${targets.map(t => `<option value="${escapeHTML(t)}"${t === dest ? ' selected' : ''}>${escapeHTML(t)}</option>`).join('')}</select>
      <label for="up-files">Videos or photos</label>
      <input id="up-files" type="file" accept="video/*,image/*" multiple required>
      <p class="quiet">Vertical (9:16) is best. Up to 2 GB per file.</p>
      <ul class="upload-list" id="upload-list" aria-live="polite"></ul>
      <div class="form-actions"><button class="button" type="submit" id="up-go">Upload</button></div>
    </form>`;
  $('#upload-form').onsubmit = ev => { ev.preventDefault(); runUpload(); };
  showModal();
}
async function uploadRequest(payload) {
  const res = await fetch(content.uploadEndpoint, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ ...payload, key: mentorKey() }) });
  const data = await res.json(); if (data && data.locked) data.error = 'Your sign-in on this device has expired. Sign out, then sign in again.';
  return data;
}
function putFile(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => { if (xhr.status < 200 || xhr.status >= 300) return reject(new Error('status '+xhr.status)); let id = ''; try { id = JSON.parse(xhr.responseText || '{}').id || ''; } catch {} resolve(id); };
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
}
async function runUpload() {
  const name = $('#up-name').value, destVal = $('#up-dest').value;
  const files = [...($('#up-files').files || [])];
  const list = $('#upload-list'), go = $('#up-go');
  status.textContent = '';
  if (!name.trim()) { status.textContent = LOCKED() ? 'Add your name first.' : 'Choose your name first.'; $('#up-name').focus(); return; }
  const agree = document.getElementById ? document.getElementById('up-agree') : null;
  if (agree && !agree.checked) { status.textContent = 'Check the permission box first.'; agree.focus(); return; }
  if (!files.length) { status.textContent = 'Choose at least one video or photo.'; $('#up-files').focus(); return; }
  const bad = files.find(f => !/^(video|image)\//.test(f.type) || f.size > 2*1024**3);
  if (bad) { status.textContent = `${bad.name} can’t be uploaded. Use videos or photos up to 2 GB.`; return; }
  go.disabled = true; go.textContent = 'Uploading…';
  list.innerHTML = files.map((f,i) => `<li id="up-${i}"><span>${escapeHTML(f.name)} <small>${sizeLabel(f.size)}</small></span><progress max="1" value="0"></progress><small class="up-state">Waiting</small></li>`).join('');
  let done = 0;
  const chatFor = (content.activeCollaborations || []).find(p => p.title === destVal || p.id === destVal)?.discussionUrl || content.discoUrl;
  for (const [i,f] of files.entries()) {
    const row = $('#up-'+i), bar = row.querySelector('progress'), state = row.querySelector('.up-state');
    try {
      state.textContent = 'Starting';
      const start = await uploadRequest(LOCKED() ? { action:'broll-start', name: name.trim(), agreed: true, fileName:f.name, type:f.type, size:f.size, origin: location.origin }
        : { action:'start', name, dest: destVal === 'broll' ? 'broll' : 'collab', project: destVal === 'broll' ? '' : destVal, fileName:f.name, type:f.type, size:f.size, origin: location.origin });
      if (!start.ok) { state.textContent = start.error || 'Couldn’t start'; row.classList.add('failed'); if (start.locked) break; continue; }
      storageSet(UPLOAD_NAME_KEY, name);
      uploadDone(await putFile(start.uploadUrl, f, p => { bar.value = p; state.textContent = Math.round(p*100)+'%'; }));
      bar.value = 1; state.textContent = 'Uploaded'; row.classList.add('done'); done++;
    } catch { state.textContent = 'Upload stopped. Check your connection and try again.'; row.classList.add('failed'); }
  }
  go.disabled = false; go.textContent = 'Upload more';
  if (done) {
    $('#up-files').value = '';
    status.innerHTML = SIMULATED() ? `${simulatedNote()}${done} of ${files.length} test ${files.length === 1 ? 'file' : 'files'} accepted by the test backend.` : `${done === files.length ? 'All set!' : `${done} of ${files.length} uploaded.`} ${done === 1 ? 'Your file is' : 'Your files are'} in the Squad’s Drive.${destVal === 'broll' ? ' A coordinator will check it, and it shows in the library once it’s added.' : ''} ${chatLink(chatFor)}`;
  }
}

function openReelShare(id) {
  const p = publishedProjects().find(x => x.id === id); if (!p) return;
  const url = publicUrl(p.publishedReelUrl);
  const who = credits(p.participatingSpecialists);
  const caption = `${p.title} from the Tot Squad Baby Specialists 💜\n\n${p.description ? p.description+'\n\n' : ''}${who.length ? 'Featuring '+who.join(', ')+'\n\n' : ''}${url}`;
  title.textContent = 'Share this Reel';
  body.innerHTML = `<div class="share-reel">${imageUrl(p.thumbnail) ? `<img src="${escapeHTML(imageUrl(p.thumbnail))}" alt="">` : ''}<div><strong>${escapeHTML(p.title)}</strong><span>${who.length ? 'Featuring '+escapeHTML(who.join(', ')) : 'Made by the Squad'}</span></div></div>
    <label for="share-link">Reel link</label>
    <div class="copy-field"><input id="share-link" type="text" value="${escapeHTML(url)}" readonly><button class="button" type="button" id="copy-link">Copy link</button></div>
    <label for="share-caption">Caption to post with it</label>
    <textarea id="share-caption" readonly>${escapeHTML(caption)}</textarea>
    <div class="button-row"><button class="button secondary" type="button" id="copy-caption">Copy caption</button><button class="button secondary" type="button" id="native-share" hidden>Share…</button>${externalLink(url,'Open on Instagram','button secondary')}</div>`;
  $('#copy-link').onclick = () => copyText(url, $('#share-link'), 'Link copied. Paste it anywhere you share.');
  $('#copy-caption').onclick = () => copyText(caption, $('#share-caption'), 'Caption copied with the link.');
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (nav && nav.share) { const b = $('#native-share'); b.hidden = false; b.onclick = () => nav.share({title:p.title, text:p.title+' from the Tot Squad', url}).catch(() => {}); }
  showModal();
}
function openPanel(action,data={}) {
  stash(); activeFlow = null; status.textContent = ''; body.replaceChildren(); castProject = ''; closeTool();
  if (action === 'drafts' || action === 'my-ideas') return openMyIdeas();
  if (action === 'call-new') return openCallForm('', data.idea || '');
  if (action === 'call-edit') return openCallForm(data.call);
  if (action === 'calendar') return openCalendar();
  if (action === 'tracker') return openTracker();
  if (action === 'reel') return openReel(data.reel);
  if (action === 'profile') return openProfile();
  if (action === 'guidelines') return openGuidelines();
  if (action === 'templates') return openTemplates();
  if (action === 'reel-new') return openReelForm('', data);
  if (action === 'reel-edit') return openReelForm(data.rid);
  if (action === 'reel-delete') return openReelDelete(data.rid);
  if (action === 'brief') return openBrief(data.doc, data.project);
  if (action === 'applications') return openApplications();
  if (typeof openClubAction === 'function' && /^(club-|coordinator)/.test(action)) return openClubAction(action, data); // club.js
  if (action === 'reel-share') return openReelShare(data.project);
  if (action === 'upload') return openUpload(data);
  if (action === 'apply') return openApply();
  if (action === 'cast') return openCast(data.project);
  if (action === 'idea') return openIdea(data.id);
  if (action === 'idea-edit') return openIdeaEdit(data.id);
  if (action === 'idea-new') return openIdeaEdit('');
  if (action === 'idea-delete') return openIdeaDelete(data.id);
  if (flows[action]) return openFlow(action,data);
  const item = info[action]; if (!item) return;
  title.textContent = item[0]; body.innerHTML = item[1]; showModal();
}

/* New applications (coordinators only): who has applied, from the "Creators Club applications" sheet.
   The script leaves out declined applications and the Notes column, and refuses anyone without the coordinator password. */
async function openApplications() {
  title.textContent = 'New applications';
  body.innerHTML = '<p class="quiet">Loading applications…</p>'; showModal();
  let list = null;
  try { const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=applications&key=${encodeURIComponent(mentorKey())}&coord=${encodeURIComponent(storageGet(COORD_CODE_KEY) || '')}`); const data = await res.json(); if (data.ok && Array.isArray(data.applications)) list = data.applications; } catch {}
  if (title.textContent !== 'New applications') return; // they opened something else meanwhile
  if (!list) { body.innerHTML = '<p>Applications couldn’t load right now. Try again in a minute.</p>'; return; }
  body.innerHTML = `<p>Specialists who asked to join the Creators Club, newest first. Say hi in Disco and help them find their first Reel.</p>`
    + (list.length ? `<ul class="app-list">${list.map(applicationCard).join('')}</ul>` : emptyState('No applications yet.','New applications show up here as soon as they come in.','',ICON.people));
}
function applicationCard(a) {
  const when = Date.parse(a.submitted) ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(a.submitted)) : '';
  const approved = /approv/i.test(a.status || '');
  const facts = [a.region, a.camera ? 'On camera: '+a.camera : ''].filter(Boolean).map(escapeHTML).join(' · ');
  return `<li class="app-card"><div class="app-top"><strong>${escapeHTML(a.name)}</strong><span class="stage ${approved ? 'stage-published' : 'stage-casting'}">${approved ? 'Welcome aboard' : 'New'}</span></div>
    <span class="trk-meta">${[when ? 'Applied '+escapeHTML(when) : '', facts].filter(Boolean).join(' · ')}</span>
    ${a.roles ? `<p class="app-roles">${escapeHTML(a.roles)}</p>` : ''}${a.why ? `<p>${escapeHTML(a.why)}</p>` : ''}
    <div class="trk-links">${instagramLink(a.instagram)}${publicUrl(a.example) ? externalLink(a.example,'See their work','text-button') : ''}</div></li>`;
}

/* "Apply to join": open to everyone. Sends to the "Creators Club applications" sheet (apps-script/upload.gs). */
// What Creators Club members agree to (shown on the application and the landing page).
/* The Creators Club guidelines (content.clubGuidelines): a panel in the toolkit, and the full text on the application
   and the password set-up, where creators agree to them. */
function guidelinesHTML() {
  const g = content.clubGuidelines; if (!g) return '';
  const e = escapeHTML, pairs = list => (list || []).map(([k, v]) => `<li><strong>${e(k)}</strong> ${e(v)}</li>`).join('');
  return `<div class="guidelines">
    <p class="guide-purpose">${e(g.purpose)}</p>
    <h3>We’re building a community where we can</h3><ul>${pairs((g.goals || []).map(([k, v]) => [k + ':', v]))}</ul>
    <h3>Membership expectations</h3><p>${e(g.membership)}</p>
    <dl class="guide-expect">${(g.expectations || []).map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>
    <p>${e(g.briefs)}</p>
    <h3>Community guidelines</h3><p>To make this a valuable + welcoming space for everyone, we ask members to follow a few shared community principles:</p><ul>${pairs(g.principles)}</ul>
    <h3>Accountability & membership</h3><p><strong>${e(g.accountability)}</strong></p><ul>${(g.accountabilityPoints || []).map(x => `<li>${e(x)}</li>`).join('')}</ul>
    <h3>Our shared commitment</h3><p>${e(g.commitment)}</p><p><strong>Welcome to the Squad!</strong></p></div>`;
}
/* Tot Squad's social templates in Canva (content.socialTemplatesUrl). Described in words: the templates' sample photos stay in Canva. */
const SOCIAL_TEMPLATES = [
  ['Baby Specialist intro, four styles', 'Your photo, name, store and booking link, with “Book a FREE baby registry consultation.” Pick the photo banner, teal frame, lavender snapshot or round-photo look.'],
  ['Quote card', 'A short, funny line about life with a baby, in a big quote frame. Swap in your own.'],
  ['This or That', 'Two products side by side with a “real mom review” tag. Great for strollers, car seats or carriers.']
];
function openTemplates() {
  title.textContent = 'Social templates';
  body.innerHTML = `<p>Tot Squad’s ready-made Instagram posts (4:5), made in Canva. Make them yours in a few minutes.</p>
    <ul class="template-list">${SOCIAL_TEMPLATES.map(([t, d]) => `<li><strong>${escapeHTML(t)}</strong><span>${escapeHTML(d)}</span></li>`).join('')}</ul>
    <h3>How to use them</h3>
    <ol class="cast-howto"><li>Open the templates. Canva adds your own copy to your account.</li><li>Swap in your headshot, your name and your store location.</li><li>Replace totsquad.com/baby-concierge with your own booking link, so families book with you. Keep the Baby Concierge powered by Tot Squad logo.</li><li>Download it and post it as a feed post or a story.</li></ol>
    <p class="flow-note">Use your own photos: no babies’ faces, clients or other shoppers.</p>
    <div class="button-row">${externalLink(content.socialTemplatesUrl, 'Open the templates in Canva')}<button class="button secondary" type="button" data-action="brand">Brand &amp; voice</button></div>`;
  showModal();
}
function openGuidelines() {
  title.textContent = 'Creators Club guidelines';
  body.innerHTML = guidelinesHTML() + (LOCKED() ? `<div class="button-row"><button class="button" type="button" data-action="apply">Apply to join</button></div>` : '');
  showModal();
}
// Shown on the application and the password set-up: the full guidelines, folded, above the "I agree" box.
const guidelinesFold = () => content.clubGuidelines ? `<details class="guide-fold"><summary>Read the Creators Club guidelines</summary>${guidelinesHTML()}</details>` : '';
const CLUB_EXPECTATIONS = (content.clubGuidelines && content.clubGuidelines.expectations || []).map(([k, v]) => k);
const CLUB_ROLES = ['On-camera creator','Baby gear educator','Editor','Scriptwriter','Creative producer','Photographer','UGC creator','Other creative contributor'];
function openApply() {
  title.textContent = 'Apply to join the Creators Club';
  if (!UPLOAD_ON()) { body.innerHTML = `<p>Applications open soon. In the meantime, say hi in ${externalLink(content.discoUrl,'Social & Sharing','text-button')}.</p>`; return showModal(); }
  const radios = (name, list) => list.map((r,i) => `<label class="check"><input type="radio" name="${name}" value="${escapeHTML(r)}" id="${name}-${i}">${escapeHTML(r)}</label>`).join('');
  body.innerHTML = `<p>The Creators Club is a group of Baby Specialists building visibility, credibility and real relationships together. Beginners are welcome: it’s about consistency, not perfection, and never follower count. It takes about three minutes. A coordinator reads every application and replies by email or Instagram DM.</p>
    <form id="apply-form" novalidate>
      <div class="field-pair">
        <div><label for="ap-name">Your full name</label><input id="ap-name" type="text" autocomplete="name" maxlength="80" required></div>
        <div><label for="ap-email">Email <span class="quiet">(so we can reply)</span></label><input id="ap-email" type="email" autocomplete="email" inputmode="email" maxlength="120" placeholder="you@example.com"></div>
      </div>
      <div class="field-pair">
        <div><label for="ap-market">Home market</label><input id="ap-market" type="text" maxlength="80" placeholder="For example, North Phoenix Target stores"></div>
      </div>
      <div class="field-pair">
        <div><label for="ap-region">Hub region</label><select id="ap-region"><option value="">Choose one</option><option>East</option><option>Central</option><option>West</option></select></div>
        <div><label for="ap-ig">Instagram handle</label><input id="ap-ig" type="text" autocomplete="off" maxlength="40" placeholder="@yourhandle"></div>
      </div>
      <fieldset class="choices"><legend>Which roles interest you? Pick any.</legend>
        ${CLUB_ROLES.map((r,i) => `<label class="check"><input type="checkbox" name="ap-role" value="${escapeHTML(r)}" id="ap-role-${i}">${escapeHTML(r)}</label>`).join('')}
      </fieldset>
      <label for="ap-interests">What do you love making content about?</label>
      <input id="ap-interests" type="text" maxlength="300" placeholder="Car seats, registry tips, day in the life…">
      <label for="ap-exp">Any filming, editing, scripting or other creative experience?</label>
      <textarea id="ap-exp" maxlength="800" placeholder="None yet is a perfectly good answer."></textarea>
      <fieldset class="choices"><legend>How comfortable are you on camera?</legend>${radios('ap-camera',['Not yet, I’d rather stay behind the camera','Getting there','Love it'])}</fieldset>
      <fieldset class="choices"><legend>Can you share at least one feed post a month and one story a week?</legend>${radios('ap-capacity',['Yes','Most weeks','Not sure yet'])}</fieldset>
      <label for="ap-avail">When do you usually have time to film or post? (optional)</label>
      <input id="ap-avail" type="text" maxlength="200" placeholder="Weekday mornings, after shifts…">
      <label for="ap-why">Why would you like to join?</label>
      <textarea id="ap-why" maxlength="800" placeholder="A sentence or two is perfect." required></textarea>
      <label for="ap-example">Link to something you’ve made (optional)</label>
      <input id="ap-example" type="url" inputmode="url" maxlength="300" placeholder="https://">
      <input class="hp" id="ap-website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="flow-note"><strong>Creators Club members agree to:</strong><ul class="club-expect">${CLUB_EXPECTATIONS.map(x => `<li>${escapeHTML(x)}</li>`).join('')}<li>Give as much as you take, keep it authentic and professional, and say so when you need a break</li></ul>${guidelinesFold()}<p class="quiet">It’s voluntary and separate from your role as a specialist. Posts follow the Tot Squad brand guidelines and share families only with their consent.</p></div>
      <label class="check agree"><input type="checkbox" id="ap-agree">I’ve read the Creators Club guidelines and I’m in.</label>
      <div class="flow-note"><strong>What happens next</strong><ul><li>Applying doesn’t make you a member, and it doesn’t add you to any group.</li><li>A coordinator reviews your application and replies by email or Instagram DM.</li><li>If you’re accepted, you’ll get the creator password. Sign in here to set up your own password and claim your profile, and you’re in.</li></ul><p class="quiet">Only coordinators see your application.</p></div>
      <div class="form-actions"><button class="button" type="submit" id="ap-go">Send application</button></div>
    </form>`;
  $('#apply-form').onsubmit = async ev => {
    ev.preventDefault();
    const val = id => document.getElementById(id).value.trim(), radio = n => (document.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
    const application = { name: val('ap-name'), email: val('ap-email'), market: val('ap-market'), region: val('ap-region'), instagram: val('ap-ig').replace(/^@/, ''),
      roles: [...document.querySelectorAll('input[name="ap-role"]:checked')].map(i => i.value).join(', '),
      interests: val('ap-interests'), experience: val('ap-exp'), camera: radio('ap-camera'),
      capacity: [radio('ap-capacity'), val('ap-avail')].filter(Boolean).join(' · '),
      why: val('ap-why'), example: val('ap-example'), agreed: document.getElementById('ap-agree').checked };
    if (!application.name) { status.textContent = 'Add your name first.'; return document.getElementById('ap-name').focus(); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email) && !application.instagram) { status.textContent = 'Add an email or your Instagram handle so we can reply.'; return document.getElementById('ap-email').focus(); }
    if (!application.why) { status.textContent = 'Add a sentence about why you’d like to join.'; return document.getElementById('ap-why').focus(); }
    if (!application.agreed) { status.textContent = 'Check the box to agree to the Creators Club guidelines.'; return document.getElementById('ap-agree').focus(); }
    const go = document.getElementById('ap-go'); go.disabled = true; go.textContent = 'Sending…'; status.textContent = '';
    try {
      const res = await uploadRequest({ action:'apply', application, website: val('ap-website') });
      if (!res.ok) throw new Error(res.error || '');
      if (SIMULATED()) { body.innerHTML = `<p>${simulatedNote('This application went to the test backend. Nothing reached a coordinator.')}</p>`; status.textContent = ''; return; }
      body.innerHTML = `<p><strong>Application sent!</strong> Thanks, ${escapeHTML(application.name.split(/\s+/)[0])}. A coordinator will review it and reply ${application.email ? 'by email' : 'on Instagram'}. You’re not a member until you hear back. In the meantime, the Instagram community, open casting calls and creator resources are open to every specialist.</p>`;
      status.textContent = '';
    } catch (err) { status.textContent = (err instanceof TypeError ? '' : err.message) || 'That didn’t send. Check your connection and try again.'; go.disabled = false; go.textContent = 'Send application'; }
  };
  showModal();
}

/* ---------- Live ideas + editing (apps-script/upload.gs: ?action=ideas, idea-save) ---------- */
function rerenderIdeas() {
  if (has('#idea-grid')) renderIdeas(); if (has('#production-board')) renderProduction();
  if (typeof renderDashboard === 'function' && has('#club-dash')) renderDashboard(); // club.js: My ideas card
  if (modal.open && title.textContent === 'My ideas') openMyIdeas();
}
async function loadIdeas() {
  if (!UPLOAD_ON() || !mentorKey() || typeof fetch !== 'function') return;
  ideasState = 'loading';
  try {
    const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=ideas&key=${encodeURIComponent(mentorKey())}`); const data = await res.json(); // creators only
    if (data.ok && Array.isArray(data.ideas) && data.ideas.length) liveIdeas = data.ideas;
    ideasState = data.ok ? 'done' : 'failed';
  } catch { ideasState = 'failed'; }
  rerenderIdeas();
}
function upsertIdea(idea) {
  if (!idea || !idea.id) return;
  const list = [...ideas()]; const at = list.findIndex(i => i.id === idea.id);
  if (at >= 0) list[at] = idea; else list.push(idea);
  liveIdeas = list; rerenderIdeas();
}
/* Who can change an idea (the script checks again): coordinators, any idea; creators signed in with their own
   password, the ideas credited to them. A first-name credit ("Kristin") counts for that creator's full name. */
function canEditIdea(i) {
  if (!liveIdeas || LOCKED() || !i) return false;
  if (isCoord()) return true;
  const me = myName(); if (!me) return false;
  const claim = myClaim();
  return (i.credit || []).some(c => sameName(c, me) || (!!claim && sameName(c, claim)));
}
const ideaRequest = payload => uploadRequest({ ...payload, coordKey: storageGet(COORD_CODE_KEY) || '', coordName: storageGet(UPLOAD_NAME_KEY) || '' });
function openIdeaEdit(id) {
  const fresh = !id, i = fresh ? { credit: [], stage: 'idea' } : ideas().find(x => x.id === id);
  if (!i || (fresh ? !(isCoord() || isAccount()) : !canEditIdea(i))) return; // any signed-in creator can add an idea; editing stays with its credits and coordinators
  const lines = arr => escapeHTML((Array.isArray(arr) ? arr : []).join('\n'));
  const savedName = storageGet(UPLOAD_NAME_KEY) || '', names = squadNames(), coordHere = isCoord(), askName = !isAccount();
  title.textContent = fresh ? 'Add an idea' : 'Edit idea';
  body.innerHTML = `<form id="idea-edit-form" novalidate>
      <p class="quiet">${fresh ? 'It goes straight into the Idea Bank for everyone to see and build on.' : 'Changes save to the Creators Club ideas sheet and show for everyone right away.'}</p>
      ${askName ? `<label for="ie-name">Who’s editing?</label>
      <select id="ie-name" required><option value="">Choose your name</option>${names.map(n => `<option${n === savedName ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select>` : ''}
      <label for="ie-title">Title</label>
      <input id="ie-title" type="text" maxlength="120" value="${escapeHTML(i.title || '')}" required>
      ${coordHere ? `<label for="ie-credit">Credited to <span class="quiet">(names, separated by commas)</span></label>
      <input id="ie-credit" type="text" maxlength="300" value="${escapeHTML((i.credit || []).join(', '))}" placeholder="Kristin, Lora">` : ''}
      <div class="field-pair">
        <div><label for="ie-series">Series</label><select id="ie-series">${SERIES.map(s => `<option value="${escapeHTML(s.id)}"${s.id === i.series ? ' selected' : ''}>${escapeHTML(s.label)}</option>`).join('')}</select></div>
        ${coordHere || !fresh ? `<div><label for="ie-stage">Stage</label><select id="ie-stage">${Object.entries(STAGES).map(([k,v]) => `<option value="${k}"${k === stageKey(i.stage) ? ' selected' : ''}>${v}</option>`).join('')}</select></div>` : ''}
      </div>
      <label for="ie-lead">Lead</label>
      <select id="ie-lead"><option value="">No lead yet</option>${[...new Set([...names, i.lead].filter(Boolean))].map(n => `<option${n === i.lead ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}</select>
      <label for="ie-summary">The idea</label>
      <textarea id="ie-summary" maxlength="1500">${escapeHTML(i.summary || '')}</textarea>
      <label for="ie-concept">The concept, expanded</label>
      <textarea id="ie-concept" maxlength="1500">${escapeHTML(i.concept || '')}</textarea>
      <label for="ie-how">How it works <span class="quiet">(one step per line)</span></label>
      <textarea id="ie-how" maxlength="4000">${lines(i.howItWorks)}</textarea>
      <label for="ie-guidance">Before you film <span class="quiet">(one per line)</span></label>
      <textarea id="ie-guidance" maxlength="4000">${lines(i.guidance)}</textarea>
      <label for="ie-notes">Notes <span class="quiet">(one per line)</span></label>
      <textarea id="ie-notes" maxlength="4000">${lines(i.notes)}</textarea>
      <label for="ie-questions">Question bank <span class="quiet">(one per line)</span></label>
      <textarea id="ie-questions" maxlength="4000">${lines(i.questions)}</textarea>
      <div class="form-actions"><button class="button" type="submit" id="ie-save">${fresh ? 'Add idea' : 'Save changes'}</button>${fresh ? '' : `<button class="button secondary" type="button" data-action="idea" data-id="${escapeHTML(i.id)}">Cancel</button><button class="text-button danger" type="button" data-action="idea-delete" data-id="${escapeHTML(i.id)}">Delete idea</button>`}</div>
    </form>`;
  $('#idea-edit-form').onsubmit = async ev => {
    ev.preventDefault();
    const val = id => document.getElementById(id).value;
    const name = askName ? val('ie-name') : myName(); if (!name) { status.textContent = 'Choose your name first.'; return document.getElementById('ie-name').focus(); }
    const idea = { id: i.id || '', title: val('ie-title').trim(), series: val('ie-series'), stage: document.getElementById('ie-stage') ? val('ie-stage') : 'idea', lead: val('ie-lead'), summary: val('ie-summary').trim(), concept: val('ie-concept').trim(),
      howItWorks: val('ie-how'), guidance: val('ie-guidance'), notes: val('ie-notes'), questions: val('ie-questions') };
    if (coordHere) idea.credit = val('ie-credit').split(',').map(x => x.trim()).filter(Boolean);
    if (!idea.title) { status.textContent = 'Give the idea a title.'; return document.getElementById('ie-title').focus(); }
    const go = document.getElementById('ie-save'), label = go.textContent; go.disabled = true; go.textContent = 'Saving…'; status.textContent = '';
    try {
      const res = await ideaRequest({ action:'idea-save', name, idea });
      if (!res.ok) throw new Error(res.error || '');
      if (askName) storageSet(UPLOAD_NAME_KEY, name);
      upsertIdea(res.idea); openIdea(res.idea.id); status.textContent = fresh ? 'Added to the Idea Bank.' : 'Saved.';
    } catch (err) { status.textContent = err.message || 'That didn’t save. Check your connection and try again.'; go.disabled = false; go.textContent = label; }
  };
  showModal();
}
function openIdeaDelete(id) {
  const i = ideas().find(x => x.id === id); if (!i || !canEditIdea(i)) return;
  title.textContent = 'Delete this idea?';
  body.innerHTML = `<p><strong>${escapeHTML(i.title)}</strong> comes out of the Idea Bank for everyone, along with ${(i.buildOns || []).length ? 'the notes the Squad added to it' : 'its details'}. Coordinators can restore it from the ideas sheet’s version history if needed.</p>
    <div class="form-actions"><button class="button danger" type="button" id="idel-go">Delete idea</button><button class="button secondary" type="button" data-action="idea" data-id="${escapeHTML(i.id)}">Keep it</button></div>`;
  $('#idel-go').onclick = async () => {
    const go = $('#idel-go'); go.disabled = true; go.textContent = 'Deleting…'; status.textContent = '';
    try {
      const res = await ideaRequest({ action:'idea-delete', id: i.id });
      if (!res.ok) throw new Error(res.error || '');
      liveIdeas = ideas().filter(x => x.id !== i.id); rerenderIdeas(); modal.close(); toast(`Deleted “${i.title}”.`);
    } catch (err) { status.textContent = err.message || 'That didn’t delete. Check your connection and try again.'; go.disabled = false; go.textContent = 'Delete idea'; }
  };
  showModal();
}

/* "Got an idea for a Squad Reel?" on the landing page: open to anyone, goes to Sarah and Taylor's review sheet (not the Idea Bank). */
function setupSquadPitch() {
  const form = document.getElementById ? document.getElementById('sp-form') : null; if (!form) return;
  const section = document.getElementById('squad-pitch');
  if (!UPLOAD_ON()) { if (section) section.hidden = true; return; }
  const series = document.getElementById('sp-series');
  if (series && series.options.length < 2) series.insertAdjacentHTML('beforeend', SERIES.map(s => `<option value="${escapeHTML(s.label)}">${escapeHTML(s.label)}</option>`).join(''));
  form.onsubmit = async ev => {
    ev.preventDefault();
    const val = id => document.getElementById(id).value.trim(), note = document.getElementById('sp-note');
    const pitch = { name: val('sp-name'), contact: val('sp-contact'), title: val('sp-title-in'), series: val('sp-series'), idea: val('sp-idea') };
    const missing = !pitch.name ? 'sp-name' : !pitch.title ? 'sp-title-in' : !pitch.idea ? 'sp-idea' : '';
    if (missing) { note.textContent = 'Add your name, an idea title and your idea.'; return document.getElementById(missing).focus(); }
    const go = document.getElementById('sp-go'); go.disabled = true; go.textContent = 'Sending…'; note.textContent = '';
    try {
      const res = await uploadRequest({ action:'squad-pitch', pitch, website: val('sp-website') });
      if (!res.ok) throw new Error(res.error || '');
      if (SIMULATED()) { form.innerHTML = `<p class="sp-done">${simulatedNote('This pitch went to the test backend. Nothing reached Sarah or Taylor.')}</p>`; return; }
      form.innerHTML = `<p class="sp-done"><strong>Thanks, ${escapeHTML(pitch.name.split(/\s+/)[0])}!</strong> Your idea is with Sarah and Taylor. They’ll reach out if it’s a fit.</p>`;
    } catch (err) { note.textContent = (err instanceof TypeError ? '' : err.message) || 'That didn’t send. Check your connection and try again.'; go.disabled = false; go.textContent = 'Send your idea'; } // a network failure says so plainly
  };
}

/* Open casting call ("Send your video"): a guided, no-password flow. 1 Find the toy · 2 Film it · 3 Send it.
   Videos go to the casting call's Drive folder through the script (cast-start); no Drive links are shown. */
let castStep = 1, castProject = '';
// Open casting calls: Find the toy (if there's one) → Film it → Answer the questions (if any) → Send it.
const castAnswers = {}; // answers typed so far, per casting call, kept while the dialog moves between steps
function castFlow(call) { return [call.toy && 'toy', 'film', (call.questions || []).length && 'questions', 'send'].filter(Boolean); }
const CAST_LABEL = { toy:'Find the toy', film:'Film it', questions:'Answer the questions', send:'Send it' };
function keepCastAnswers(id) {
  const form = document.getElementById ? document.getElementById('cast-q-form') : null; if (!form) return;
  castAnswers[id] = [...form.querySelectorAll('textarea[data-q]')].map(t => ({ q: t.dataset.q, a: t.value.trim() }));
  storageSet('totsquad-cast-answers-' + id, JSON.stringify(castAnswers[id])); // a closed dialog doesn't lose them
}
function savedCastAnswers(id) { if (!castAnswers[id]) { try { castAnswers[id] = JSON.parse(storageGet('totsquad-cast-answers-' + id) || '[]'); } catch { castAnswers[id] = []; } } return castAnswers[id]; }
function openCast(id, step = 1) {
  const p = projectById(id); const call = p && p.openCall; if (!call) return;
  if (castProject === id) keepCastAnswers(id);
  const flow = castFlow(call); step = Math.min(Math.max(step, 1), flow.length); castStep = step;
  const key = flow[step - 1], next = step + 1, back = step - 1;
  const toy = call.toy || {}, steps = call.steps || [], questions = call.questions || [];
  const nav = `<ol class="steps cast-steps">${flow.map((k,i) => `<li${i + 1 === step ? ' aria-current="step"' : ''}>${i + 1} · ${CAST_LABEL[k]}</li>`).join('')}</ol>`;
  const backBtn = back ? `<button class="button secondary" type="button" data-cast-step="${back}">Back</button>` : '';
  title.textContent = p.title;
  if (key === 'toy') body.innerHTML = `${nav}
    <div class="cast-toy">${imageUrl(toy.photo) ? `<img src="${escapeHTML(imageUrl(toy.photo))}" alt="The sunshine toy: a soft yellow sun with a smiling face, little arms and legs">` : ''}
      <div><h3>Find the sunshine toy</h3><p><strong>${escapeHTML(toy.name || '')}</strong></p><p>${escapeHTML(toy.note || '')}</p>
      ${toy.item ? `<p class="quiet">Can’t spot it? Search <strong>${escapeHTML(toy.item)}</strong> in the Target app, or ask a team member to look it up.</p>` : ''}
      ${externalLink(toy.url, 'See it on Target.com', 'text-button')}</div></div>
    <div class="form-actions"><button class="button" type="button" data-cast-step="${next}">I have the toy</button>${p.exampleReelUrl ? externalLink(p.exampleReelUrl,p.exampleLabel || 'Watch Part 1','button secondary') : ''}</div>`;
  if (key === 'film') body.innerHTML = `${nav}
    ${castFacts(p)}<h3>${escapeHTML(call.filmTitle || 'Film your part')}</h3>${p.description && !call.toy ? `<p>${escapeHTML(p.description)}</p>` : ''}${p.instructions && !steps.includes(p.instructions) ? `<p><strong>What to film:</strong> ${escapeHTML(p.instructions)}</p>` : ''}<ol class="cast-howto">${steps.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ol>
    ${call.dont ? `<p class="flow-note">${escapeHTML(call.dont)}</p>` : ''}
    <div class="form-actions"><button class="button" type="button" data-cast-step="${next}">I’ve filmed it</button>${backBtn}${!call.toy && p.exampleReelUrl ? externalLink(p.exampleReelUrl,'See an example','button secondary') : ''}</div>`;
  if (key === 'questions') {
    const saved = savedCastAnswers(id), ans = q => (saved.find(x => x.q === q) || {}).a || '';
    body.innerHTML = `${nav}
    <form id="cast-q-form" novalidate><h3>Answer the questions</h3>${call.questionsIntro ? `<p>${escapeHTML(call.questionsIntro)}</p>` : ''}
      <div class="cast-questions">${questions.map((q,i) => `<label for="cq-${i}">${escapeHTML(q)}</label><textarea id="cq-${i}" rows="1" maxlength="500" data-q="${escapeHTML(q)}">${escapeHTML(ans(q))}</textarea>`).join('')}</div>
      <div class="form-actions"><button class="button" type="button" data-cast-step="${next}">Next</button>${backBtn}</div></form>`;
    $('#cast-q-form').oninput = () => keepCastAnswers(id);
  }
  if (key === 'send') {
    const answered = savedCastAnswers(id).filter(x => x.a).length;
    body.innerHTML = `${nav}
    <form id="cast-form" novalidate>
      <label for="cs-name">Your name</label>
      <input id="cs-name" type="text" autocomplete="name" maxlength="80" value="${escapeHTML(storageGet(ACCOUNT_NAME_KEY) || storageGet(UPLOAD_NAME_KEY) || '')}" required>
      <label for="cs-contact">How can the team reach you? <span class="quiet">(optional)</span></label>
      <input id="cs-contact" type="text" maxlength="120" placeholder="Disco name, email or @handle">
      <label for="cs-file">${questions.length ? 'Your clips' : 'Your video'}</label>
      <input id="cs-file" type="file" accept="video/*"${questions.length ? ' multiple' : ''} required>
      <p class="quiet">Vertical (9:16), up to 2 GB each. ${questions.length ? 'Pick all your clips at once. ' : ''}They go straight to the Squad’s private Drive; only the Creators Club team can see them.</p>
      ${questions.length ? `<p class="quiet">${answered ? `${plural2(answered, 'answer')} ready to send with your clips. ` : 'No answers yet. '}<button type="button" class="text-button" data-cast-step="${back}">${answered ? 'Review answers' : 'Answer the questions'}</button></p>` : ''}
      <label class="check agree"><input type="checkbox" id="cs-agree">Everyone in the video agreed to be filmed, and there are no shoppers’ or babies’ faces in it.</label>
      <ul class="upload-list" id="cast-list" aria-live="polite"></ul>
      <div class="form-actions"><button class="button" type="submit" id="cs-go">${questions.length ? 'Send my clips &amp; answers' : 'Send my video'}</button>${backBtn}</div>
    </form>`;
    $('#cast-form').onsubmit = ev => { ev.preventDefault(); sendCast(p); };
    $('#cast-form').oninput = () => { if (!document.getElementById('cs-go').disabled) status.textContent = ''; };
  }
  castProject = id;
  showModal();
}
const plural2 = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
async function sendCast(p) {
  const val = id => document.getElementById(id).value.trim();
  const name = val('cs-name'), files = [...(document.getElementById('cs-file').files || [])], answers = savedCastAnswers(p.id).filter(x => x.a);
  const asks = (p.openCall.questions || []).length;
  if (!name) { status.textContent = 'Add your name first.'; return document.getElementById('cs-name').focus(); }
  if (!files.length && !answers.length) { status.textContent = asks ? 'Choose your clips, or answer the questions first.' : 'Choose your video.'; return document.getElementById('cs-file').focus(); }
  const bad = files.find(f => !/^video\//.test(f.type) || f.size > 2*1024**3);
  if (bad) { status.textContent = `${bad.name} can’t be sent. Choose videos up to 2 GB.`; return; }
  if (files.length && !document.getElementById('cs-agree').checked) { status.textContent = 'Check the box first.'; return document.getElementById('cs-agree').focus(); }
  const go = document.getElementById('cs-go'), label = go.textContent; go.disabled = true; go.textContent = 'Sending…'; status.textContent = '';
  const list = document.getElementById('cast-list');
  list.innerHTML = files.map((f,i) => `<li id="cast-${i}"><span>${escapeHTML(f.name)} <small>${sizeLabel(f.size)}</small></span><progress max="1" value="0"></progress><small class="up-state">Waiting</small></li>`).join('');
  let sent = 0, failed = '';
  for (const [i, file] of files.entries()) {
    const row = document.getElementById('cast-' + i), bar = row.querySelector('progress'), state = row.querySelector('.up-state');
    try {
      const start = await uploadRequest({ action:'cast-start', name, contact: val('cs-contact'), project: p.title, agreed: true, fileName: file.name, type: file.type, size: file.size, origin: location.origin });
      if (!start.ok) throw new Error(start.error || 'Couldn’t start');
      state.textContent = 'Uploading';
      uploadDone(await putFile(start.uploadUrl, file, f => { bar.value = f; state.textContent = Math.round(f*100)+'%'; }));
      bar.value = 1; state.textContent = 'Sent'; row.classList.add('done'); sent++;
    } catch (err) { state.textContent = 'Didn’t send'; row.classList.add('failed'); failed = /network|status/.test(err.message) ? 'An upload stopped. Check your connection and try again.' : err.message; }
  }
  let answersSent = false;
  if (answers.length && !failed) {
    try { const res = await uploadRequest({ action:'cast-answers', name, contact: val('cs-contact'), project: p.title, answers }); if (!res.ok) throw new Error(res.error || ''); answersSent = true; }
    catch (err) { failed = err.message || 'Your answers didn’t send. Try again in a minute.'; }
  }
  if (failed) { status.textContent = failed; go.disabled = false; go.textContent = 'Try again'; return; }
  storageSet(UPLOAD_NAME_KEY, name); delete castAnswers[p.id]; try { localStorage.removeItem('totsquad-cast-answers-' + p.id); } catch {}
  const what = [sent ? (asks ? plural2(sent, 'clip') : 'your video') : '', answersSent ? 'your answers' : ''].filter(Boolean).join(' and ');
  if (SIMULATED()) { body.innerHTML = `<div class="cast-done"><h3>Simulated upload</h3><p>${simulatedNote('This casting upload was simulated. No video or answers reached Drive.')}</p></div>`; status.textContent = ''; return; }
  body.innerHTML = `<div class="cast-done"><h3>${asks ? 'Got it, thank you!' : 'Your video is in!'}</h3><p>Thanks, ${escapeHTML(name.split(/\s+/)[0])}. We have ${escapeHTML(what)} for ${escapeHTML(p.title)}, safe in the Squad’s private Drive. ${p.lead ? escapeHTML(p.lead)+' and the team will' : 'The team will'} reach out if they need anything.</p></div>`;
  status.textContent = '';
}

/* ---------- What's new (creators only): apps-script ?action=activity ---------- */
const SEEN_KEY = 'totsquad-activity-seen';
let bellSeen = false; // opened this visit: the badge clears, the dots stay until the panel closes
function markActivitySeen() {
  bellSeen = true;
  const nb = document.getElementById ? document.getElementById('nav-new') : null; if (nb) nb.hidden = true;
  if (activityItems[0]) storageSet(SEEN_KEY, activityItems[0].when);
}
const ACTIVITY_ICON = { cast:'📣', build:'🧱', pitch:'💡', edit:'✏️', video:'🎬', broll:'🎞️', review:'📬', apply:'👋', post:'📲', join:'🎉', brief:'🗒️' };
function uploadDone(fileId) { if (fileId && UPLOAD_ON()) uploadRequest({ action:'upload-done', fileId }).catch(() => {}); }
function timeAgo(iso) {
  const t = Date.parse(iso); if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); return d < 7 ? `${d}d ago` : shortDate(new Date(t).toISOString().slice(0,10));
}
let activityItems = [], activityAll = false;
function renderActivity() {
  if (!has('#activity-list')) return; const box = $('#activity-list');
  const seen = Date.parse(storageGet(SEEN_KEY) || '') || Date.now() - 7 * 864e5; // first visit: only the last week counts as new
  const fresh = activityItems.filter(a => Date.parse(a.when) > seen).length;
  const navBadge = has('#nav-new') ? $('#nav-new') : null; if (navBadge) { navBadge.textContent = fresh > 9 ? '9+' : fresh || ''; navBadge.hidden = !fresh || bellSeen; }
  const bell = document.getElementById ? document.getElementById('bell-btn') : null; if (bell) bell.setAttribute('aria-label', fresh && !bellSeen ? `What’s new, ${fresh} new` : 'What’s new');
  const shown = activityAll ? activityItems : activityItems.slice(0, 6);
  box.innerHTML = activityItems.length ? `<ul class="activity">${shown.map(a => {
    const idea = /^idea:/.test(a.link) ? a.link.slice(5) : '', call = /^call:/.test(a.link) && projectById(a.link.slice(5)) ? a.link.slice(5) : '';
    const what = `${a.who ? `<strong>${escapeHTML(a.who)}</strong> ` : ''}${escapeHTML(a.what)}`;
    const open = idea ? `<button type="button" class="text-button" data-action="idea" data-id="${escapeHTML(idea)}">Open</button>` : call ? `<button type="button" class="text-button" data-action="cast" data-project="${escapeHTML(call)}">Open</button>` : a.type === 'apply' ? `<button type="button" class="text-button" data-action="applications">See it</button>` : publicUrl(a.link) ? externalLink(a.link,a.type === 'post' ? 'View' : 'Watch','text-button') : '';
    return `<li class="${Date.parse(a.when) > seen ? 'fresh' : ''}"><span class="activity-icon" aria-hidden="true">${ACTIVITY_ICON[a.type] || '•'}</span><span class="activity-text">${what}<time datetime="${escapeHTML(a.when)}">${timeAgo(a.when)}</time></span>${open}</li>`;
  }).join('')}</ul>${activityItems.length > 6 ? `<button type="button" class="text-button" data-activity-more>${activityAll ? 'Show less' : `Show all ${activityItems.length}`}</button>` : ''}`
    : '<p class="quiet">Nothing yet. New pitches, videos and idea updates will show up here.</p>';
}
async function loadActivity() {
  if (!has('#activity-list') || !UPLOAD_ON() || !mentorKey() || typeof fetch !== 'function') return;
  try {
    const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=activity&key=${encodeURIComponent(mentorKey())}`); const data = await res.json();
    if (!data.ok || !Array.isArray(data.activity)) return;
    activityItems = data.activity; renderActivity();
    // The bell shows how many are new; opening it marks them seen.
    if (document.getElementById && document.getElementById('bell-panel')?.hidden === false) markActivitySeen();
  } catch {}
}

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const tp = t.closest('a[data-tool-page]');
  if (tp && !PANEL && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.button) { e.preventDefault(); if (!modal.open) opener = tp; openTool(tp.dataset.toolPage, tp.dataset.label); return; }
  if (t.closest('[data-activity-more]')) { activityAll = !activityAll; renderActivity(); return; }
  const cs = t.closest('[data-cast-step]');
  if (cs && castProject) { status.textContent = ''; openCast(castProject, +cs.dataset.castStep); return; }
  const more = t.closest('[data-bio]');
  if (more) { const open = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', String(open)); more.textContent = open ? 'Show less' : 'Read more'; more.closest('.person')?.classList.toggle('open', open); return; }
  if (t.closest('[data-ideas-retry]')) { ideasState = 'idle'; renderIdeas(); loadIdeas(); return; }
  const filter = t.closest('[data-filter]');
  if (filter) { ideaFilter = filter.dataset.filter; renderIdeas(); document.querySelector(`[data-filter="${CSS.escape(ideaFilter)}"]`)?.focus(); return; }
  const dismiss = t.closest('[data-dismiss]');
  if (dismiss) { const el = document.getElementById(dismiss.dataset.dismiss); if (el) el.hidden = true; storageSet('totsquad-welcome-dismissed','1'); return; }
  const copy = t.closest('[data-copy]');
  if (copy) { copyText(copy.dataset.copy, null, copy.dataset.done || 'Copied.').then(() => { if (!modal.open) toast(status.textContent); }); return; }
  const bp = t.closest('[data-broll-folder]');
  if (bp) { brollPerson = bp.dataset.brollFolder; brollFilter = 'all'; renderBroll(); const lib = document.getElementById('broll-library'); if (lib && lib.scrollIntoView) lib.scrollIntoView({block:'start'}); const f = document.querySelector(brollPerson ? '.folder-back-link' : `[data-broll-folder="${CSS.escape(bp.dataset.brollFolder || '')}"]`) || document.querySelector('.folder-tile'); if (f) f.focus({preventScroll:true}); return; }
  const rv = t.closest('[data-view]');
  if (rv && has('#reels-view')) { reelsView = rv.dataset.view; renderReels(); document.getElementById('tab-'+reelsView)?.focus(); if (history.replaceState) { const u = new URL(location.href); u.searchParams.set('view', reelsView); history.replaceState(null,'',u); } return; }
  const rm = t.closest('[data-month]');
  if (rm) { const step = +rm.dataset.month; const now = new Date(); reelsMonth = step ? new Date(reelsMonth.getFullYear(), reelsMonth.getMonth() + step, 1) : new Date(now.getFullYear(), now.getMonth(), 1); renderReels(); return; }
  const rr = t.closest('[data-reel]');
  if (rr) { if (!modal.open) opener = rr; openPanel('reel', { reel: rr.dataset.reel }); return; }
  if (t.closest('[data-broll-retry]')) { loadBroll(true); return; }
  const br = t.closest('[data-broll-refresh]');
  if (br) { br.disabled = true; br.textContent = 'Refreshing…'; uploadRequest({ action:'admin-broll', coordKey: storageGet(COORD_CODE_KEY) || '', coordName: storageGet(UPLOAD_NAME_KEY) || 'Coordinator' }).then(() => loadBroll(true)).catch(() => loadBroll(true)); return; } // coordinators: show Drive changes now
  const bf = t.closest('[data-broll]');
  if (bf) { brollFilter = bf.dataset.broll; renderBroll(); document.querySelector(`[data-broll="${CSS.escape(brollFilter)}"]`)?.focus(); return; }
  const action = t.closest('[data-action]');
  if (action) { if (!modal.open) opener = action; openPanel(action.dataset.action, {...action.dataset}); return; }
  if (modal.open && t.closest('a[href^="#"]')) modal.close();
});
$('#modal .close').onclick = () => modal.close();
modal.addEventListener('cancel', stash);
modal.addEventListener('close', () => {
  stash(); closeTool();
  // Back to whatever opened the dialog, without scrolling. A tool picked from the closed menu returns to the menu button.
  if (typeof dashFocus !== 'undefined' && dashFocus && !LOCKED()) return focusDashboard(); // just signed in: on to the dashboard heading
  const back = opener && opener.offsetParent !== null ? opener : document.getElementById && document.getElementById('menu-btn');
  back?.focus({ preventScroll: true });
});
modal.addEventListener('click', e => { if (e.target === modal) { const r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) modal.close(); } });
/* ---------- Mentor password ----------
   The landing page is open to everyone; its mentor-only parts ([data-mentor]) appear after sign-in.
   The other pages stay behind the password screen. Only the script checks passwords: nothing in the page can
   tell whether a password is right. The shared creator password only opens "Set up your password". */
const MENTOR_KEY = 'totsquad-mentor-key';
let mentorMemory = '';
function mentorKey() { return mentorMemory || storageGet(MENTOR_KEY) || ''; }
// Sign out: forget the password on this device and go back to the public landing page.
// Coordinators sign in with the coordinator password; it's kept on the device and checked by the script on every coordinator action.
const COORD_CODE_KEY = 'totsquad-coordinator-code';
function setCoordinator(code) {
  if (code) storageSet(COORD_CODE_KEY, code); else { try { localStorage.removeItem(COORD_CODE_KEY); } catch (e) {} }
  document.documentElement?.classList?.toggle('coordinator', !!code);
}
if (storageGet(COORD_CODE_KEY)) document.documentElement?.classList?.add('coordinator');
function signOut() {
  if (isAccount() && UPLOAD_ON() && typeof fetch === 'function') { try { fetch(content.uploadEndpoint, { method:'POST', keepalive:true, headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'account-signout', key: mentorKey() }) }).catch(() => {}); } catch (e) {} } // forget this device's key
  mentorMemory = '';
  try { localStorage.removeItem(MENTOR_KEY); localStorage.removeItem(COORD_CODE_KEY); localStorage.removeItem(ACCOUNT_NAME_KEY); localStorage.removeItem(ACCOUNT_CLAIM_KEY); localStorage.removeItem('totsquad-coordinator-name'); } catch (e) {}
  document.documentElement.classList.remove('unlocked', 'coordinator');
  location.href = pageUrl('index.html');
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-signout]')) { e.preventDefault(); signOut(); } });
const GATE_ON = () => !!content.signInRequired;
const LANDING = () => !!(document.getElementById && document.getElementById('mentor-signin'));
const LOCKED = () => GATE_ON() && !mentorKey();
// Open to every specialist without signing in: the landing page and the B-roll library. The Idea Bank stays creators-only.
const OPEN_PAGE = () => LANDING() || !!(document.getElementById && document.getElementById('broll-grid'));
// Asks the script whether this is the shared creator password (it also caps wrong guesses).
const isSharedPassword = async key => { if (!UPLOAD_ON()) return {}; try { const r = await accountRequest({ action:'account-claimable', key }); return r && r.ok ? { shared: !!r.shared } : { error: r && /Too many/.test(r.error || '') ? r.error : '' }; } catch (e) { return {}; } };
function unlock() { document.documentElement?.classList.add('unlocked'); document.getElementById?.('gate')?.remove(); }
// Wires a password form. Returns nothing; on a match it saves the key, unlocks and re-renders.
/* Sign-in: your name and your own password. The shared creator password only opens "Set up your password";
   the coordinator password signs Taylor, Sarah and Linden in as coordinators. */
function passwordForm(form, input, note$, go, label, nameEl) {
  if (nameEl && !nameEl.value) nameEl.value = storageGet(ACCOUNT_NAME_KEY) || [storageGet(UPLOAD_NAME_KEY)].find(isFullName) || '';
  form.onsubmit = async ev => {
    ev.preventDefault();
    const key = input.value.trim(), name = nameEl ? nameEl.value.trim() : '';
    if (!key) { note$.textContent = 'Enter your password.'; input.focus(); return; }
    go.disabled = true; go.textContent = 'Checking…'; note$.textContent = '';
    const ready = () => { go.disabled = false; go.textContent = label; };
    try {
      if (isFullName(name) && UPLOAD_ON()) {
        const res = await accountRequest({ action:'account-login', name, password: key });
        if (res && res.ok) { ready(); input.value = ''; return finishSignin(res); }
        if (res && !res.wrong) { note$.textContent = res.error || 'That didn’t work. Try again in a minute.'; return ready(); }
      }
      const setup = await isSharedPassword(key); // first time here: the creator password opens "Set up your password"
      if (setup.shared) { ready(); input.value = ''; if (signinDialog()?.open) { const back = signinOpener; closeSignin(false); back?.focus?.({ preventScroll: true }); } return openAccountSetup(key, name); } // setup takes over from the sign-in dialog
      if (setup.error) { note$.textContent = setup.error; return ready(); }
      if (await coordinatorLogin(key)) { // not yours: maybe the coordinator password
        ready(); input.value = ''; mentorMemory = key; storageSet(MENTOR_KEY, key); setCoordinator(key); unlock(); renderContent(); loadIdeas(); loadCalls(); loadActivity(); goToDashboard(); toast('You’re signed in as a coordinator.'); return;
      }
      note$.textContent = !name ? 'Enter your full name and your password.' : !isFullName(name) ? 'Use your full name, first and last.' : 'That name and password don’t match. First time here? Use the creator password from Sarah or Taylor to set up your own.';
      (isFullName(name) ? input : nameEl || input).focus(); if (isFullName(name)) input.select();
    } catch { note$.textContent = 'This browser couldn’t check the password. Try Chrome or Safari.'; }
    ready();
  };
}
/* ---------- Your own account: password and bio (apps-script/club.gs) ---------- */
const ACCOUNT_NAME_KEY = 'totsquad-account-name', ACCOUNT_CLAIM_KEY = 'totsquad-account-claim';
const myClaim = () => isAccount() ? storageGet(ACCOUNT_CLAIM_KEY) || '' : '';
const isAccount = () => /^acct\./.test(mentorKey());
// Accounts use full names: at least a first and a last name.
const isFullName = n => String(n || '').trim().split(/\s+/).filter(w => /\p{L}/u.test(w)).length >= 2;
// Meet the Squad cards may list a first name only. A card with fullName matches exactly; otherwise the first name does.
// Meet the Squad cards belong to whoever claimed that name (or matches the card's fullName exactly).
const ownsCard = (p, name, claimed = '') => !!name && !!p && ((!!claimed && sameName(p.name, claimed)) || sameName(p.name, name) || (!!p.fullName && sameName(p.fullName, name)));
const myName = () => isAccount() ? storageGet(ACCOUNT_NAME_KEY) || '' : '';
async function accountRequest(payload) {
  const res = await fetch(content.uploadEndpoint, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) });
  return res.json();
}
// Signed in: the landing page (hero, levels, sign-in) is hidden and the page starts at the dashboard.
function goToDashboard() {
  closeSignin(false); // signed in: the sign-in dialog closes first, then the page opens at the dashboard
  const d = document.getElementById ? document.getElementById('dashboard') : null; if (!d || !d.scrollIntoView) return;
  if (history.replaceState && /^#(mentor-signin|squad-pitch|guides)?$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  d.scrollIntoView({ block: 'start' });
  dashFocus = true; focusDashboard();
}
// After signing in, focus goes to the dashboard heading. club.js redraws the dashboard when its data arrives, so it asks again.
let dashFocus = false;
function focusDashboard() {
  if (!dashFocus || (modal && modal.open)) return; // a dialog still open (password setup's last step) keeps focus; its close comes back here
  const h = document.getElementById?.('dash-title') || document.getElementById?.('dashboard'); if (!h || !h.setAttribute) return;
  h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  if (typeof club !== 'undefined' && club) dashFocus = false; // the full dashboard is in: done
}
function finishSignin(res) {
  mentorMemory = res.key; storageSet(MENTOR_KEY, res.key); storageSet(ACCOUNT_NAME_KEY, res.name); storageSet(ACCOUNT_CLAIM_KEY, res.claimed || ''); storageSet(UPLOAD_NAME_KEY, res.name); setCoordinator('');
  if (typeof club !== 'undefined') club = null; // club.js: reload the dashboard for this person
  unlock(); renderContent(); loadIdeas(); loadCalls(); loadActivity(); goToDashboard();
  toast(`You’re signed in. Hi, ${String(res.name).split(/\s+/)[0]}!`);
}
function openAccountSetup(sharedKey, name = '', moving = false) {
  if (!modal.open) opener = document.activeElement;
  status.textContent = '';
  title.textContent = 'Set up your password';
  const squad = baseSquadNames(), words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const pre = squad.find(n => sameName(n, words[0])) || '', preLast = pre && words.length > 1 ? words.slice(1).join(' ') : '';
  body.innerHTML = `<p>${moving ? 'Each creator now has their own password. ' : 'Welcome to the Creators Club! '}Claim your name, add your last name and pick a password only you know. You’ll sign in with these from now on, and you can write your own bio for Meet the Squad.</p>
    <form id="acct-form" novalidate>
      <label for="acct-claim">Your name on the Squad</label>
      <select id="acct-claim"><option value="">Choose your name</option>${squad.map(n => `<option value="${escapeHTML(n)}"${n === pre ? ' selected' : ''}>${escapeHTML(n)}</option>`).join('')}<option value="-">I’m new, my name isn’t here</option></select>
      <div class="field-pair">
        <div id="acct-first-row" hidden><label for="acct-first">First name</label><input id="acct-first" type="text" maxlength="40" autocomplete="given-name" autocapitalize="words"></div>
        <div id="acct-last-row"><label for="acct-last">Last name</label><input id="acct-last" type="text" maxlength="40" autocomplete="family-name" autocapitalize="words" value="${escapeHTML(preLast)}"></div>
      </div>
      <p class="quiet" id="acct-preview" aria-live="polite"></p>
      <label for="acct-pw">New password</label>
      <input id="acct-pw" type="password" autocomplete="new-password" minlength="8" required>
      <p class="quiet">At least 8 characters, and not the shared creator password.</p>
      <label for="acct-pw2">Type it again</label>
      <input id="acct-pw2" type="password" autocomplete="new-password" required>
      ${guidelinesFold()}
      <label class="check agree"><input type="checkbox" id="acct-agree">I agree to the Creators Club guidelines: at least one feed post a month, one story a week, and showing up for each other.</label>
      <div class="form-actions"><button class="button" type="submit" id="acct-go">Save my password</button></div>
    </form>`;
  $('#acct-form').onsubmit = async ev => {
    ev.preventDefault();
    const pick = $('#acct-claim').value, claim = pick === '-' ? '' : pick, nm = fullFromForm(), pw = $('#acct-pw').value, pw2 = $('#acct-pw2').value, go = $('#acct-go');
    status.textContent = '';
    if (!pick) { status.textContent = 'Choose your name, or “I’m new” if it isn’t on the list.'; return $('#acct-claim').focus(); }
    if (claimedNow.some(n => sameName(n, claim))) { status.textContent = `${claim} has already been claimed. If that isn’t you, ask a coordinator.`; return $('#acct-claim').focus(); }
    if (!isFullName(nm)) { status.textContent = claim ? 'Add your last name.' : 'Add your first and last name, as they appear in Disco.'; return $(claim ? '#acct-last' : '#acct-first').focus(); } // a single-word roster name needs a last name too
    if (pw.length < 8) { status.textContent = 'Use at least 8 characters.'; return $('#acct-pw').focus(); }
    if (pw !== pw2) { status.textContent = 'Those passwords don’t match.'; return $('#acct-pw2').focus(); }
    const agree = document.getElementById('acct-agree'); if (agree && !agree.checked) { status.textContent = 'Check the box to agree to the Creators Club guidelines.'; return agree.focus(); }
    go.disabled = true; go.textContent = 'Saving…';
    try {
      const res = await accountRequest({ action:'account-setup', key: sharedKey, name: nm, claim, password: pw, agreed: true });
      if (!res || !res.ok) { status.textContent = res && res.locked ? 'The creator password has changed. Ask Sarah or Taylor for the new one.' : (res && res.error) || 'That didn’t save. Try again in a minute.'; go.disabled = false; go.textContent = 'Save my password'; if (res && res.fullName) $('#acct-last').focus(); return; }
      finishSignin(res);
      title.textContent = 'You’re all set';
      body.innerHTML = `<p>${res.claimed ? (sameName(res.claimed, res.name) ? `You’re on the roster as <strong>${escapeHTML(res.name)}</strong>. ` : `You’ve claimed ${escapeHTML(res.claimed)} and you’re on the roster as <strong>${escapeHTML(res.name)}</strong>. `) : ''}Next time, sign in with <strong>${escapeHTML(res.name)}</strong> and your new password. Your browser can save it for you.</p>
        <p>Last step: add a sentence or two about yourself for Meet the Squad.</p>
        <div class="button-row"><button class="button" type="button" data-action="profile">${res.bio ? 'Edit my bio' : 'Write my bio'}</button><button class="button secondary" type="button" id="acct-done">Done</button></div>`;
      status.textContent = ''; $('#acct-done').onclick = () => modal.close(); body.querySelector('.button-row .button')?.focus();
    } catch { status.textContent = 'That didn’t save. Check your connection and try again.'; go.disabled = false; go.textContent = 'Save my password'; }
  };
  // Who's who: names already claimed can't be picked again; "I'm new" asks for a first name too.
  let claimedNow = [];
  const v = id => String($(id).value || '').trim();
  const fullPick = pick => pick !== '-' && /\s/.test(pick); // a roster name that's already a full name (an approved applicant)
  const fullFromForm = () => { const pick = v('#acct-claim'); if (fullPick(pick)) return pick; const first = pick === '-' ? v('#acct-first') : pick; return [first, v('#acct-last')].filter(Boolean).join(' ').replace(/\s+/g, ' '); };
  const refresh = () => {
    const pick = v('#acct-claim'); $('#acct-first-row').hidden = pick !== '-';
    const lastRow = $('#acct-last-row'); if (lastRow) lastRow.hidden = fullPick(pick);
    const nm = fullFromForm(); $('#acct-preview').textContent = isFullName(nm) ? `You’ll sign in as ${nm}.` : '';
  };
  ['acct-claim', 'acct-first', 'acct-last'].forEach(id => { const el = $('#' + id); el.oninput = el.onchange = refresh; });
  refresh();
  if (UPLOAD_ON() && typeof fetch === 'function') fetch(`${publicUrl(content.uploadEndpoint)}?action=claimed`).then(r => r.json()).then(d => {
    if (!d || !Array.isArray(d.claimed)) return; claimedNow = d.claimed;
    [...document.querySelectorAll('#acct-claim option')].forEach(o => { if (o.value && o.value !== '-' && claimedNow.some(n => sameName(n, o.value))) { o.disabled = true; o.textContent = `${o.value} (claimed)`; if (o.selected) $('#acct-claim').value = ''; } });
    refresh();
  }).catch(() => {});
  // Approved applicants are on the roster by the name they applied with: add them to the list.
  if (UPLOAD_ON()) accountRequest({ action:'account-claimable', key: sharedKey }).then(d => {
    const sel = document.getElementById ? document.getElementById('acct-claim') : null; if (!sel || !d || !Array.isArray(d.names)) return;
    const have = [...sel.options].map(o => o.value), newOpt = sel.querySelector('option[value="-"]');
    d.names.filter(n => !have.some(h => sameName(h, n)) && !baseSquadNames().some(b => sameName(b, n.split(/\s+/)[0]) && squadClaims.some(c => sameName(c.claimed, b))))
      .sort().forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.insertBefore(o, newOpt); });
    const mine = d.names.find(n => sameName(n, name)); if (mine && !v('#acct-claim')) { sel.value = mine; refresh(); }
  }).catch(() => {});
  showModal(); $(pre ? (preLast ? '#acct-pw' : '#acct-last') : '#acct-claim').focus();
}
// The bio on someone's Meet the Squad card: theirs if they've written (or deleted) one, otherwise content.js.
let liveBios = null;
const bioFor = p => { const b = (liveBios || []).find(x => ownsCard(p, x.name, x.claimed)); return b ? b.bio : p.bio; };
const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
async function loadBios() {
  if (!UPLOAD_ON() || typeof fetch !== 'function' || !has('#squad-grid')) return;
  try { const res = await fetch(`${publicUrl(content.uploadEndpoint)}?action=bios`); const d = await res.json(); if (d && d.ok && Array.isArray(d.bios)) { liveBios = d.bios; renderSquad(); } } catch {}
  if (isAccount() && !myClaim()) { // signed in before their name was claimed (or linked by a coordinator): pick it up now
    try { const a = await uploadRequest({ action:'account-me' }); if (a && a.ok && a.claimed) { storageSet(ACCOUNT_CLAIM_KEY, a.claimed); renderSquad(); } } catch {}
  }
}
function setMyBio(name, bio) {
  liveBios = [...(liveBios || []).filter(b => !sameName(b.name, name)), { name, bio }];
  if (has('#squad-grid')) renderSquad();
}
async function openProfile() {
  if (!modal.open) opener = document.activeElement;
  status.textContent = ''; title.textContent = 'My profile';
  if (!isAccount()) {
    body.innerHTML = `<p>${storageGet(COORD_CODE_KEY) ? 'You’re signed in with the coordinator password. ' : ''}To write your bio, sign in with your own name and password. First time? Sign out, then sign in with the creator password and you’ll set one up.</p><div class="button-row"><button class="button secondary" type="button" data-signout>Sign out</button></div>`;
    return showModal();
  }
  body.innerHTML = '<p class="quiet">Loading your profile…</p>'; showModal();
  let a;
  try { a = await uploadRequest({ action:'account-me' }); } catch { a = null; }
  if (!a || !a.ok) { body.innerHTML = `<p>${escapeHTML(a && a.error || 'Your profile couldn’t load. Check your connection and try again.')}</p><div class="button-row"><button class="button secondary" type="button" data-signout>Sign out</button></div>`; return; }
  if (a.claimed) storageSet(ACCOUNT_CLAIM_KEY, a.claimed);
  renderProfile(a);
}
function renderProfile(a, note = '') {
  const card = (content.featuredSpecialists || []).find(p => p && ownsCard(p, a.name, a.claimed));
  const current = a.bioSet ? a.bio : (card && card.bio) || '';
  body.innerHTML = `<p>Signed in as <strong>${escapeHTML(a.name)}</strong>.</p>
    <section class="profile-part" aria-labelledby="bio-head"><h3 class="cal-head" id="bio-head">Your bio</h3>
      <p class="quiet">It shows on your card in Meet the Squad, which anyone can see. A sentence or two: where you’re based, your background, what you love helping families with. Keep clients’ and babies’ details out.</p>
      <label class="sr-only" for="bio-text">Your bio</label>
      <textarea id="bio-text" rows="4" maxlength="400" placeholder="Scottsdale-based mom of two and certified car seat tech who loves…">${escapeHTML(current)}</textarea>
      <p class="quiet bio-count" id="bio-count" aria-live="polite"></p>
      <div class="button-row" id="bio-actions"><button class="button" type="button" id="bio-save">${current ? 'Save bio' : 'Add bio'}</button>${current ? '<button class="text-button danger" type="button" id="bio-del">Delete bio</button>' : ''}</div>
    </section>
    <section class="profile-part" aria-labelledby="pw-head"><h3 class="cal-head" id="pw-head">Change your password</h3>
      <form id="pw-form" novalidate>
        <label for="pw-now">Current password</label><input id="pw-now" type="password" autocomplete="current-password">
        <label for="pw-new">New password</label><input id="pw-new" type="password" autocomplete="new-password" minlength="8">
        <label for="pw-new2">Type it again</label><input id="pw-new2" type="password" autocomplete="new-password">
        <div class="button-row"><button class="button secondary" type="submit" id="pw-go">Change password</button></div>
      </form>
    </section>
    <div class="button-row"><button class="button secondary" type="button" data-signout>Sign out</button></div>`;
  status.textContent = note;
  const ta = $('#bio-text'), count = () => { $('#bio-count').textContent = `${ta.value.length} of 400 characters`; };
  ta.oninput = count; count();
  $('#bio-save').onclick = () => saveBio(a);
  const del = document.getElementById ? document.getElementById('bio-del') : null;
  if (del) del.onclick = () => {
    $('#bio-actions').innerHTML = `<span>Delete your bio? Your card will show without one.</span><button class="button danger" type="button" id="bio-del-go">Delete</button><button class="button secondary" type="button" id="bio-keep">Keep it</button>`;
    $('#bio-keep').onclick = () => renderProfile(a);
    $('#bio-del-go').onclick = () => saveBio(a, true);
  };
  $('#pw-form').onsubmit = ev => { ev.preventDefault(); changePassword(a); };
}
async function saveBio(a, remove = false) {
  const bio = remove ? '' : $('#bio-text').value.trim();
  if (!remove && !bio) { status.textContent = 'Write your bio first, or delete it instead.'; return $('#bio-text').focus(); }
  const btn = $(remove ? '#bio-del-go' : '#bio-save'); btn.disabled = true; btn.textContent = remove ? 'Deleting…' : 'Saving…'; status.textContent = '';
  try {
    const res = await uploadRequest(remove ? { action:'bio-delete' } : { action:'bio-save', bio });
    if (!res || !res.ok) { status.textContent = (res && res.error) || 'That didn’t save. Try again in a minute.'; btn.disabled = false; btn.textContent = remove ? 'Delete' : 'Save bio'; return; }
    setMyBio(res.name, res.bio);
    renderProfile(res, remove ? 'Bio deleted.' : 'Saved. It’s on your card in Meet the Squad.');
  } catch { status.textContent = 'That didn’t save. Check your connection and try again.'; btn.disabled = false; btn.textContent = remove ? 'Delete' : 'Save bio'; }
}
async function changePassword(a) {
  const now = $('#pw-now').value, pw = $('#pw-new').value, pw2 = $('#pw-new2').value, go = $('#pw-go');
  status.textContent = '';
  if (!now) { status.textContent = 'Enter your current password.'; return $('#pw-now').focus(); }
  if (pw.length < 8) { status.textContent = 'Use at least 8 characters for the new one.'; return $('#pw-new').focus(); }
  if (pw !== pw2) { status.textContent = 'The new passwords don’t match.'; return $('#pw-new2').focus(); }
  go.disabled = true; go.textContent = 'Changing…';
  try {
    const res = await uploadRequest({ action:'account-password', current: now, password: pw });
    if (!res || !res.ok) { status.textContent = (res && res.error) || 'That didn’t work. Try again in a minute.'; go.disabled = false; go.textContent = 'Change password'; return; }
    renderProfile(res, 'Password changed. You’re signed out everywhere else.');
  } catch { status.textContent = 'That didn’t work. Check your connection and try again.'; go.disabled = false; go.textContent = 'Change password'; }
}
// Asks the script whether this is the coordinator password. Nothing about it lives in the page.
async function coordinatorLogin(code) {
  if (!UPLOAD_ON() || typeof fetch !== 'function') return false;
  try { const res = await fetch(content.uploadEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'coord-login', code }) }); const data = await res.json(); return !!(data && data.ok); }
  catch { return false; }
}
/* Member sign in: the landing page's sign-in form lives in its own dialog. #mentor-signin links, askSignin and a
   page opened at #mentor-signin all open it. Focus starts on Full name, Esc closes, focus returns to the opener. */
let signinOpener = null;
const signinDialog = () => document.getElementById ? document.getElementById('signin-dialog') : null;
function openSignin(note = '', from) {
  const d = signinDialog(); if (!d || !d.showModal) return;
  const n = document.getElementById('signin-note'); if (n) n.textContent = note;
  if (!d.open) {
    signinOpener = from || document.activeElement;
    // Place it before opening: showModal focuses inside the dialog at once, and in Disco's tall frame a dialog still
    // centred in the frame would make Disco scroll to it. Before the frame knows what's on screen, use its top.
    placeModal(d); if (EMBED && !onScreen && d.style) { d.style.marginTop = '24px'; d.style.marginBottom = 'auto'; }
    d.showModal(); placeModal(d);
  }
  setTimeout(() => document.getElementById('signin-name')?.focus({ preventScroll: true }), 0);
}
function closeSignin(restore = true) {
  const d = signinDialog(); if (!d || !d.open) return;
  if (!restore) signinOpener = null;
  d.close();
}
function setupSignin() {
  const d = signinDialog(); if (!d) return;
  d.querySelector('[data-signin-close]').onclick = () => d.close();
  d.addEventListener('keydown', e => { // Tab stays inside the dialog
    if (e.key !== 'Tab') return;
    const f = [...d.querySelectorAll('button,input,a[href],select,textarea')].filter(x => !x.disabled && x.offsetParent !== null && x.tabIndex >= 0);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  d.addEventListener('close', () => { const back = signinOpener; signinOpener = null; if (back && back.isConnected && back.offsetParent !== null) back.focus({ preventScroll: true }); });
  d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href="#mentor-signin"]');
    if (!a || !LOCKED() || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); document.getElementById('nav-menu')?.hidden === false && document.getElementById('menu-btn')?.click();
    openSignin('', a.closest('#nav-menu') ? document.getElementById('menu-btn') : a);
  });
  if (LOCKED() && location.hash === '#mentor-signin') openSignin();
}
/* Landing page odds and ends: the sticky header's height (it grows with larger text), a brief heading tint where
   the hero and route links land, and the collapsed pitch form opening when a link points at it. */
function setupLanding() {
  const head = document.querySelector?.('.site-header'), root = document.documentElement;
  const fit = () => { // a header taller than a fifth of the screen (very large text) scrolls away instead of sticking
    if (!head) return; head.classList.remove('is-tall'); const tall = head.offsetHeight > innerHeight * 0.2; head.classList.toggle('is-tall', tall);
    root.style.setProperty('--header-h', (tall || document.body.classList.contains('embed') ? 0 : head.offsetHeight) + 'px');
  };
  fit(); if (typeof ResizeObserver !== 'undefined' && head) new ResizeObserver(fit).observe(head); addEventListener('resize', fit);
  const pitch = document.getElementById('pitch-details');
  const openPitch = () => { if (pitch && !pitch.open) pitch.open = true; };
  if (location.hash === '#squad-pitch') openPitch();
  pitch?.addEventListener('toggle', () => { const b = pitch.querySelector('.pitch-open'); if (b) b.textContent = pitch.open ? 'Hide the form' : 'Pitch an idea'; if (pitch.open) setTimeout(() => document.getElementById('sp-name')?.focus({ preventScroll: true }), 0); });
  addEventListener('hashchange', () => { if (location.hash === '#squad-pitch') openPitch(); });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (id === 'squad-pitch') openPitch();
    if (!a.closest('.hero') || reduceMotion()) return;
    const h = document.getElementById(id)?.querySelector('h2'); if (!h) return;
    clearTimeout(h.arriveTimer); h.classList.remove('arrive');
    setTimeout(() => { h.classList.add('arrive'); h.arriveTimer = setTimeout(() => h.classList.remove('arrive'), 450); }, 350);
  });
}
function askSignin(note = 'Sign in as a creator to do that.') {
  const box = document.getElementById('mentor-signin');
  if (!box) { // Idea Bank or B-roll page: point to the landing page, where anyone can pitch or sign in
    if (!modal.open) opener = document.activeElement; title.textContent = 'Creators Club members only';
    body.innerHTML = `<p>${escapeHTML(note)} Anyone can still pitch an idea, no password needed.</p><div class="button-row"><a class="button" href="${escapeHTML(pageUrl('index.html'))}#squad-pitch">Pitch an idea</a><a class="button secondary" href="${escapeHTML(pageUrl('index.html'))}#mentor-signin">Sign in</a><button class="button secondary" type="button" data-action="apply">Apply to join</button></div>`;
    return showModal();
  }
  openSignin(note);
}
function showGate(note = '') {
  if (!document.body || !document.body.append || document.getElementById('gate')) return;
  document.body.classList.toggle('embed', EMBED);
  const gate = document.createElement('div'); gate.id = 'gate'; gate.setAttribute('role','dialog'); gate.setAttribute('aria-modal','true'); gate.setAttribute('aria-labelledby','gate-title');
  gate.innerHTML = `<form class="gate-card" id="gate-form" novalidate>
    <img class="gate-logo" src="https://cdn.prod.website-files.com/5f4a9ffd91010361e130f380/68407ea76a2d0b8be6420f9e_Tot-Squad-Logo-NEW-REG.png" alt="Tot Squad">
    <h1 id="gate-title">Creators Club</h1>
    <p>This page is for Tot Squad creators. Sign in with your full name and password. First time? Use the creator password from Sarah or Taylor.</p>
    <label for="gate-name">Your full name</label>
    <input id="gate-name" type="text" autocomplete="username" autocapitalize="words" maxlength="80" placeholder="First and last name">
    <label for="gate-key">Password</label>
    <input id="gate-key" type="password" autocomplete="current-password" required>
    <button class="button" type="submit" id="gate-go">Come in</button>
    <p class="gate-note" id="gate-note" role="alert">${escapeHTML(note)}</p>
    <a class="gate-back" href="${escapeHTML(pageUrl('index.html'))}">Back to the Creators Club</a>
  </form>`;
  document.body.append(gate);
  const input = gate.querySelector('#gate-key');
  setTimeout(() => (gate.querySelector('#gate-name').value ? input : gate.querySelector('#gate-name')).focus(), 0);
  passwordForm(gate.querySelector('#gate-form'), input, gate.querySelector('#gate-note'), gate.querySelector('#gate-go'), 'Come in', gate.querySelector('#gate-name'));
}
// Signed-out visitors on the landing page: actions other than sharing a published Reel ask for the password.
document.addEventListener('click', e => {
  if (!OPEN_PAGE() || !LOCKED()) return;
  const a = e.target.closest && e.target.closest('[data-action],[data-reel]');
  const brollUpload = a && a.dataset.action === 'upload' && a.dataset.dest === 'broll'; // anyone can send B-roll
  if (a && !brollUpload && !['reel-share','apply','cast',...PUBLIC_GUIDES].includes(a.dataset.action)) { e.preventDefault(); e.stopImmediatePropagation(); askSignin(); }
}, true);
setupMenu();
setupBell();
watchScreen();
// A device still signed in with the shared creator password: it no longer signs anyone in, so set up your own password.
let movingKey = '';
{ const k = storageGet(MENTOR_KEY); if (GATE_ON() && k && !/^acct\./.test(k) && !storageGet(COORD_CODE_KEY)) { movingKey = k; mentorMemory = ''; try { localStorage.removeItem(MENTOR_KEY); } catch (e) {} document.documentElement?.classList?.remove('unlocked'); } }
if (!GATE_ON() || mentorKey()) { unlock(); renderContent(); loadIdeas(); loadActivity(); if (LANDING() && /^#(mentor-signin|squad-pitch|guides)$/.test(location.hash)) goToDashboard(); }
else if (LANDING()) { renderContent(); setupSquadPitch(); setupSquadToggle(); setupSignin(); const f = document.getElementById('signin-form'); passwordForm(f, f.querySelector('#signin-key'), f.querySelector('#signin-note'), f.querySelector('#signin-go'), 'Sign in', f.querySelector('#signin-name')); }
else if (OPEN_PAGE()) renderContent();
else showGate();
if (LANDING()) setupLanding();
loadBios(); loadClaims(); loadCalls();
if (movingKey) isSharedPassword(movingKey).then(r => { if (r.shared) openAccountSetup(movingKey, storageGet(UPLOAD_NAME_KEY) || '', true); }).catch(() => {});
