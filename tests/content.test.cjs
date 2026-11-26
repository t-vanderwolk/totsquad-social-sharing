// Render/eligibility tests. Fixtures here are test-only and never deployed.
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict');
const root = require('node:path').join(__dirname, '..');
const { validate, load } = require('../scripts/validate-content.cjs');

// Made-up ideas for the Idea Bank tests (real ideas are private and never in this public repo).
const FIXTURE_IDEAS = [
  { id: 'fx-registry', title: 'Fixture Registry Idea', series: 'registry', credit: ['Taylor'], date: '2026-10-10', summary: 'A made-up registry idea for tests.', titleNote: 'Working title.' },
  { id: 'fx-game', title: 'Fixture Game Show', series: 'game-shows', credit: ['Taylor'], date: '2026-09-02', summary: 'A made-up game show for tests.' },
  { id: 'fx-reel', title: 'Fixture Reel Idea', series: 'reels', credit: ['Kristin'], date: '', summary: 'A made-up Reel idea for tests.' },
  { id: 'fx-hub', title: 'Fixture Hub Idea', series: 'hub', credit: ['Lora'], date: '2026-09-25', summary: 'A made-up hub idea for tests.' }
];
function boot(config, storageFailure = false, stored = new Map([['totsquad-mentor-key','acct.testaccount1.testsecretsecretsecretsecret'],['totsquad-account-name','Taylor Vanderwolk'],['totsquad-account-claim','Taylor']])) {
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: false, addEventListener() {}, classList: { toggle() {} }, replaceChildren() {}, showModal() { this.open = true; } }); return elements.get(id); };
  const storage = { getItem(k) { if (storageFailure) throw Error('blocked'); return stored.get(k) ?? null; }, setItem(k, v) { if (storageFailure) throw Error('blocked'); stored.set(k, String(v)); }, removeItem(k) { if (storageFailure) throw Error('blocked'); stored.delete(k); } };
  const ctx = vm.createContext({ window: {}, document: { querySelector: el, querySelectorAll: () => [], body: { classList: { toggle() {} } }, addEventListener() {} }, URL, URLSearchParams, location: { search: '?embed=1' }, Intl, Date, Map, Set, console, localStorage: storage, FormData: class { constructor(form) { return form.formData || []; } } });
  vm.runInContext(fs.readFileSync(root + '/content.js', 'utf8'), ctx);
  ctx.window.HUB_CONTENT.ideas = FIXTURE_IDEAS.map(i => ({ ...i })); // the real Idea Bank lives in a private sheet
  if (config) Object.assign(ctx.window.HUB_CONTENT, config);
  vm.runInContext(fs.readFileSync(root + '/script.js', 'utf8'), ctx);
  return { ctx, run: s => vm.runInContext(s, ctx), html: id => el(id).innerHTML, el };
}

// Real content renders its empty and placeholder states honestly.
let t = boot();
assert.match(t.html('#casting-projects'), /Meet the Squad, Part 2: Pass the Toy/); // currently casting
assert.match(t.html('#casting-projects'), /Led by Kristin/);
assert.match(t.html('#casting-projects'), /Watch Part 1/);
assert.match(t.html('#project-gallery'), /Meet the Squad/);
assert.doesNotMatch(t.html('#project-gallery'), /Pass the Toy|Details coming/);
assert.equal((t.html('#project-gallery').match(/>Watch ↗</g) || []).length, 4); // four verified Reels
assert.match(t.html('#project-gallery'), /src="images\/meet-the-squad\.jpg"/); // local cover images allowed
assert.equal(t.run("imageUrl('images/../x.jpg')"), ''); // but only plain files in images/
assert.equal(t.run("imageUrl('javascript:alert(1)')"), '');
assert.doesNotMatch(t.html('#idea-grid'), /Pass-the-item intro|>Tot Squad Round Up<|Day in the life/); // published ideas leave the Idea Bank
assert.match(t.html('#idea-grid'), /class="idea-art"><svg/); // series illustration
assert.equal(t.el('#production').hidden, true); // empty production board stays hidden
assert.doesNotMatch(t.html('#resource-links'), /aria-disabled="true"/); // no unconfigured placeholder links
assert.match(t.html('#idea-grid'), /Fixture Registry Idea/);
assert.match(t.html('#idea-filters'), /aria-pressed="true"/);
assert.match(t.html('#squad-grid'), /Kristin/);
assert.match(t.html('#squad-grid'), /class="bio"[^>]*>Mom of three in Holly Springs/);
assert.doesNotMatch(t.html('#squad-grid'), /class="tags"/); // no idea tags on squad cards
assert.equal((t.html('#squad-grid').match(/class="region region-/g) || []).length, 10); // every specialist has a region
assert.match(t.html('#week-events'), /Every Thursday/);
assert.match(t.html('#week-events'), /Dates to come/);
assert.match(t.html('#production-board'), /Nothing in production yet/);
assert.match(t.html('#ways'), /engagement pact/i);
assert.equal(t.el('#welcome').hidden, false);

// Filtering the Idea Bank.
t.run("ideaFilter='registry';renderIdeas()");
assert.match(t.html('#idea-grid'), /Fixture Registry Idea/);
assert.doesNotMatch(t.html('#idea-grid'), /Fixture Game Show/);
t.run("ideaFilter='missing';renderIdeas()");
assert.match(t.html('#idea-grid'), /Fixture Game Show/); // unknown filter falls back to all
t.run("content.ideas[1].stage='casting'");
// My ideas: your ideas by stage, your casting calls, drafts on this device.
t.run("openPanel('my-ideas')"); { const m = t.html('#modal-body');
  assert.match(m, /Every Idea Bank idea credited to you/); assert.match(m, /Fixture Registry Idea/); assert.doesNotMatch(m, /Fixture Hub Idea/);
  assert.match(m, /<span class="stage stage-casting">Casting<\/span>/); assert.match(m, /You haven’t posted a casting call yet/); assert.match(m, /No unsent drafts/); }
t.run("persistDraft('pitch',{title:'Half-baked idea'});openPanel('my-ideas')"); assert.match(t.html('#modal-body'), /Half-baked idea/);
assert.match(t.html('#resource-links'), /My ideas/); assert.doesNotMatch(t.html('#resource-links'), /My drafts/);

// Recurring events land on the right weekday, today or later.
const next = t.run('nextOccurrence(4)');
assert.equal(new Date(next + 'T12:00:00Z').getUTCDay(), 4);
assert.ok(next >= t.run('today()'));

// Escaping and URL safety in every configurable section.
const project = { id: 'fixture', title: 'Fixture <script>', description: 'Testing only', status: 'casting', thumbnail: 'javascript:alert(1)', submissionDeadline: '2099-01-01', instructions: 'Record a short tip', discussionUrl: 'https://example.com/discussion', publishedReelUrl: '', participatingSpecialists: [] };
t = boot({ activeCollaborations: [project], completedCollaborations: [], upcomingDeadlines: [{ id: 'bad', title: 'Invalid', date: '2026-99-99' }] });
assert.match(t.html('#casting-projects'), /Fixture &lt;script&gt;/);
assert.match(t.html('#casting-projects'), /Record a short tip/);
assert.doesNotMatch(t.html('#casting-projects'), /src="javascript:/);
assert.match(t.html('#deadlines'), /2099/);
assert.doesNotMatch(t.html('#deadlines'), /Invalid/);

t = boot({ ideas: [{ id: 'x', title: '<b>Fixture</b>', series: 'reels', credit: ['Tester'] }], featuredSpecialists: [{ name: 'Tester', bio: '<b>Fixture</b> bio', photo: 'javascript:alert(1)' }] });
assert.match(t.html('#idea-grid'), /&lt;b&gt;Fixture/);
assert.match(t.html('#squad-grid'), /&lt;b&gt;Fixture/);
assert.doesNotMatch(t.html('#squad-grid'), /javascript:/);

// Production board.
t = boot({ activeCollaborations: [{ ...project, status: 'filming' }] });
assert.match(t.html('#production-board'), /Filming/);
assert.match(t.html('#production-board'), /Fixture &lt;script&gt;/);

// Eligibility.
t = boot({ activeCollaborations: [{ ...project, submissionDeadline: '2000-01-01' }] });
assert.equal(t.run('openProjects().length'), 0);
t = boot({ completedCollaborations: [{ ...project, status: 'published' }] });
assert.equal(t.run('publishedProjects().length'), 0);
t = boot({ completedCollaborations: [{ ...project, status: 'published', publishedReelUrl: 'https://example.com/reel' }] });
assert.equal(t.run('publishedProjects().length'), 1);
assert.match(t.html('#project-gallery'), />Watch ↗</);

// Drafts: share download only lists fields that exist in the form.
t = boot();
assert.doesNotMatch(t.run("draftText('share',{tone:'Warm invitation'})"), /Public link/);
assert.match(t.run("draftText('pitch',{title:'T',basedOn:'fx-registry'})"), /Building on: Fixture Registry Idea/);

// Storage blocked.
t = boot(null, true);
assert.equal(JSON.stringify(t.run("loadDraft('pitch')")), '{}');
assert.match(t.el('#status').textContent, /storage is unavailable/);
assert.equal(t.run("publicUrl('javascript:alert(1)')"), '');
assert.equal(t.run("dateValid('2026-02-30')"), false);

// Content validation: real content passes, broken content is caught.
assert.deepEqual(validate(load()), []);
const broken = validate({ ...load(), ideas: [{ id: 'a', title: 'A', series: 'nope', date: '2026-02-30' }, { id: 'a', title: 'B', series: 'reels' }], completedCollaborations: [{ id: 'p', title: 'P', status: 'published', participatingSpecialists: [], ideaId: 'zzz' }] });
for (const pattern of [/series "nope"/, /not a real/, /duplicate id/, /no publishedReelUrl/, /does not match an idea/]) assert.ok(broken.some(e => pattern.test(e)), 'expected error ' + pattern);

console.log('PASS: empty states, Idea Bank + filters, squad credits, weekly events, production board, escaping, safe URLs, eligibility, drafts, storage fallback, content validation');

// Upload guidance, safe Disco fallback and autosave (ported from the Nov 18 GitHub updates).
t = boot();
assert.match(t.run('submissionHelp()'), /data-action="upload" data-dest="collab"/); // upload form is on
assert.match(t.run('submissionHelp()'), /Folder instructions in Disco/);
assert.match(t.html('#resource-links'), /data-action="upload" data-dest="collab"/); assert.doesNotMatch(t.html('#resource-links'), /drive\.google|target="_blank"/); // Toolkit stays in the app
t = boot({ uploadEndpoint: '', submissionFolderUrl: 'javascript:alert(1)', submissionInstructionsUrl: 'javascript:alert(1)' });
assert.equal(t.run('submissionHelp()'), '');

const stored = new Map();
t = boot(null, false, stored);
t.el('#flow-form').formData = [['title', 'A useful idea'], ['idea', 'Draft details']];
t.run("activeFlow = 'pitch'; draftDirty = true; stash()");
assert.equal(JSON.parse(stored.get('totsquad-pitch-v2')).title, 'A useful idea');
assert.ok(JSON.parse(stored.get('totsquad-pitch-v2'))._savedAt);
assert.match(t.el('#status').textContent, /saved on this device/);
t.el('#flow-form').formData = [['title', 'Changed but not edited']];
t.run('stash()'); // nothing new typed, nothing rewritten
assert.equal(JSON.parse(stored.get('totsquad-pitch-v2')).title, 'A useful idea');
t = boot(null, false, stored); // new page load recovers the draft
assert.equal(t.run("loadDraft('pitch').title"), 'A useful idea');
t = boot(null, true); // blocked storage keeps an in-memory draft
t.el('#flow-form').formData = [['title', 'Session only']];
t.run("activeFlow = 'pitch'; draftDirty = true; stash()");
assert.equal(t.run("loadDraft('pitch').title"), 'Session only');
assert.match(t.el('#status').textContent, /page session/);

// Instagram handles: normalized, linked, escaped; bad values dropped and caught by the validator.
t = boot({ featuredSpecialists: [{ name: 'Tester', instagram: '@tot.squad_test' }, { name: 'Other', instagram: 'https://www.instagram.com/other.handle/?hl=en' }, { name: 'Bad', instagram: '"><script>' }] });
assert.match(t.html('#squad-grid'), /href="https:\/\/www\.instagram\.com\/tot\.squad_test\/"/);
assert.match(t.html('#squad-grid'), /@other\.handle/);
assert.doesNotMatch(t.html('#squad-grid'), /<script>/);
assert.ok(validate({ ...load(), featuredSpecialists: [{ name: 'Bad', instagram: 'not a handle!' }] }).some(e => /Instagram handle/.test(e)));

// Leader spotlight.
t = boot();
assert.match(t.html('#squad-grid'), /Tot Squad CEO/);
assert.match(t.html('#squad-grid'), /AKA The Queen/);
assert.match(t.html('#squad-grid'), /instagram\.com\/jenbsaxton\//);
assert.equal((t.html('#squad-grid').match(/>Jen</g) || []).length, 1); // Jen only as the leader card
t = boot({ leader: null });
assert.doesNotMatch(t.html('#squad-grid'), /Leader spotlight/);

// Reels tracker link and content calendar.
t = boot();
assert.match(t.html('#resource-links'), /reels\.html\?view=calendar/); // calendar and tracker live on the Reels page
t.run("openPanel('tracker')");
const trk = t.html('#modal-body');
assert.match(trk, /In progress/); assert.match(trk, /Daddy’s Home/);
assert.match(trk, /Intros passing the sunshine toy/); assert.match(trk, /Upload your clips/);
assert.match(trk, /data-action="calendar"/); assert.doesNotMatch(trk, /Edit in Google Sheets|docs\.google|drive\.google/); // Tot Squad's Drive is private
t.run("openPanel('calendar')");
const cal = t.html('#modal-body');
assert.ok(cal.indexOf('Up next') < cal.indexOf('Posted')); assert.doesNotMatch(cal, /Future ideas/); // the public copy has no future ideas: they load live after sign-in
assert.match(cal, /Daddy’s Home/); assert.match(cal, /In edit/); assert.match(cal, /data-action="tracker">Open the Reels tracker/);
assert.ok(validate({ ...load(), contentCalendar: [{ title: 'X', status: 'someday' }] }).some(e => /must be posted/.test(e)));

// Hub links: open inside Disco when embedded (tests boot with ?embed=1), new tab otherwise.
t = boot();
assert.match(t.html('#week-events'), /href="https:\/\/tot-squad-hub\.disco\.co\/events-calendar" target="_top"/);
assert.doesNotMatch(t.html('#resource-links'), /Squad Cup|canva\.com|Referral/); // Disco's sidebar covers these
assert.equal((t.html('#hero-reels').match(/class="hero-reel/g) || []).length, 3); // hero shows three real covers

// Share on a published Reel: link + Copy link + caption.
t = boot();
assert.match(t.html('#project-gallery'), /data-action="reel-share" data-project="meet-the-squad"/);
t.run("openPanel('reel-share',{project:'meet-the-squad'})");
assert.match(t.html('#modal-body'), /value="https:\/\/www\.instagram\.com\/reel\/DdxH92sTWXo\/"/);
assert.match(t.html('#modal-body'), /Copy link/);
assert.match(t.html('#modal-body'), /Copy caption/);
t.run("openPanel('reel-share',{project:'not-published'})"); // unknown ids do nothing

// B-roll library: folders only; a folder's clips show when it's opened.
t = boot();
assert.match(t.html('#broll-folders'), /data-broll-folder="Taylor"/); assert.match(t.html('#broll-folders'), /7 clips/);
assert.equal(t.html('#broll-grid'), ''); assert.equal(t.html('#broll-filters'), ''); // previews hidden until a folder is opened
assert.match(t.el('#broll-summary').textContent, /7 clips/);
assert.match(t.html('#broll-add'), /data-action="upload" data-dest="broll"/); // uploads straight to the B-roll folder
assert.match(t.html('#broll-wanted'), /One-hand stroller fold/);
t.run("brollPerson='Taylor';renderBroll()");
assert.match(t.html('#broll-folders'), /Taylor’s folder/); assert.match(t.html('#broll-folders'), /drive\.google\.com\/drive\/folders\/[\w-]{20,}/);
assert.match(t.html('#broll-folders'), /All folders/);
assert.match(t.html('#broll-grid'), /Inside Target/); assert.match(t.html('#broll-grid'), /images\/broll-wagons\.jpg/);
assert.doesNotMatch(t.html('#broll-grid'), /shot by/);
t.run("brollPerson='';renderBroll()"); assert.equal(t.html('#broll-grid'), ''); // closing hides them again
t.run("brollPerson='Nobody';renderBroll()"); assert.match(t.html('#broll-folders'), /Folders/); assert.equal(t.html('#broll-grid'), '');
t = boot({ brollFolders: [] });
assert.match(t.html('#broll-folders'), /No folders yet/);
t = boot({ brollFolders: [{ name: 'Kristin', url: 'https://drive.google.com/drive/folders/k' }], brollClips: [{ id: 'c1', title: 'Aisle walk <b>', category: 'aisles', url: 'https://drive.google.com/file/d/x', length: '0:08', credit: 'Kristin' }, { id: 'c2', title: 'Fold', category: 'strollers', url: 'javascript:alert(1)', credit: 'Kristin' }] });
t.run("brollPerson='Kristin';renderBroll()");
assert.match(t.html('#broll-grid'), /Aisle walk &lt;b&gt;/);
assert.match(t.html('#broll-grid'), /data-copy="https:\/\/drive\.google\.com\/file\/d\/x"/);
assert.doesNotMatch(t.html('#broll-grid'), /javascript:/);
assert.doesNotMatch(t.html('#broll-filters'), /Feeding/); // only categories that have clips
assert.match(t.html('#broll-grid'), /Open in Drive/); assert.equal(t.el('#broll-access').innerHTML, ''); // signed-in creators open and copy clips
{ const out = boot(undefined, false, new Map()); out.run("brollPerson='Taylor';renderBroll()");
  assert.match(out.html('#broll-add'), /data-action="upload" data-dest="broll"/); // anyone can add footage
  assert.match(out.html('#broll-grid'), /Inside Target/); // previews stay open
  assert.doesNotMatch(out.html('#broll-grid') + out.html('#broll-folders'), /Open in Drive|Open folder in Drive|data-copy|drive\.google/); // but Drive links are for members
  assert.match(out.el('#broll-access').innerHTML, /Creators Club members/); }
console.log('PASS: B-roll: anyone adds, members open and copy');
t.run("brollFilter='strollers';renderBroll()");
assert.doesNotMatch(t.html('#broll-grid'), /Aisle walk/);
t = boot({ brollFolders: [{ name: 'Kristin', url: 'https://drive.google.com/drive/folders/k' }], brollClips: [] });
t.run("brollPerson='Kristin';renderBroll()"); assert.match(t.html('#broll-grid'), /No clips here yet/);
assert.ok(validate({ ...load(), brollFolders: [{ name: '' }] }).some(e => /needs a name/.test(e)));
// Upload form: falls back to Drive links when uploadEndpoint is blank.
t = boot({ uploadEndpoint: '' });
assert.match(t.run('submissionHelp()'), /href="https:\/\/drive\.google\.com\/drive\/folders\/0ADqEscN50JTEUk9PVA"/);
assert.match(t.html('#broll-add'), /href="https:\/\/drive\.google\.com\/drive\/folders\/[\w-]{20,}"/);
assert.doesNotMatch(t.html('#casting-projects'), /data-action="upload"/);
const EP = 'https://script.google.com/macros/s/AKfyc-test_123/exec';
t = boot({ uploadEndpoint: EP });
assert.match(t.html('#broll-add'), /data-action="upload" data-dest="broll"/);
assert.match(t.html('#casting-projects'), /data-action="cast" data-project="meet-the-squad-part-2">Send your video/); // open call: guided video flow
{ const c = load(); c.activeCollaborations = c.activeCollaborations.map(p => ({ ...p, openCall: undefined }));
  const t6 = boot(c); assert.match(t6.html('#casting-projects'), /data-action="upload" data-dest="collab" data-project="meet-the-squad-part-2"/); }
t.run("openPanel('upload',{dest:'collab',project:'meet-the-squad-part-2'})");
const up = t.html('#modal-body');
assert.match(up, /<option value="Meet the Squad, Part 2: Pass the Toy" selected>/); assert.match(up, /Daddy’s Home/);
assert.match(up, /<option>Taylor<\/option>/); assert.match(up, /type="file" accept="video\/\*,image\/\*" multiple/); assert.doesNotMatch(up, /Squad passcode/); // signed-in creators skip the upload passcode
t.run("openPanel('upload',{dest:'broll'})"); assert.match(t.html('#modal-body'), /<option value="broll" selected>B-roll library/);
t.run("openPanel('tracker')"); assert.match(t.html('#modal-body'), /data-action="upload" data-dest="collab" data-project="Daddy’s Home"/);
assert.ok(validate({ ...load(), uploadEndpoint: 'https://example.com/x' }).some(e => /Apps Script/.test(e)));
assert.ok(!validate({ ...load(), uploadEndpoint: EP }).length);
// Pitches: Send pitch when the endpoint is set; Disco copy-and-paste otherwise.
t = boot({ uploadEndpoint: EP });
assert.equal(t.run("sendsPitch('pitch')"), true); assert.equal(t.run("sendsPitch('collab')"), false);
assert.match(t.run('pitchSendBox()'), /id="send-pitch"/); assert.doesNotMatch(t.run('pitchSendBox()'), /passcode/i); assert.match(t.run('pitchSendBox()'), /<option>Kristin<\/option>/);
t = boot({ uploadEndpoint: '' });
assert.equal(t.run("sendsPitch('pitch')"), false);
assert.ok(validate({ ...load(), brollClips: [{ title: 'X', category: 'nope' }] }).some(e => /not in brollCategories/.test(e)));

// Reels page: one shape for live sheet rows and the saved copy; three views; details panel.
t = boot();
assert.equal(t.run("sheetDate('Sunday 10/18', new Date(2026,10,20))"), '2026-10-18');
assert.equal(t.run("sheetDate('1/5', new Date(2026,11,20))"), '2027-01-05'); // closest year wins
assert.equal(t.run("sheetDate('PAST DUE')"), '');
assert.equal(t.run("reelStatus('IN EDIT')"), 'editing'); assert.equal(t.run("reelStatus('POSTED')"), 'posted'); assert.equal(t.run("reelStatus('')"), '');
t.run(`reelsData = buildReels([
  {title:'Pass the Toy', lead:'Kristin', prompt:'Intros passing the sunshine toy', deadline:'PAST DUE', status:'POSTED', folderUrl:'https://drive.google.com/drive/folders/x'},
  {title:"Daddy's Home", lead:'Sarah', prompt:'', briefUrl:'https://docs.google.com/document/d/1-EXu39nUOtxi7YvTaoneQRu6n4L-LgeGpCxvcWUAYAM/edit', deadline:'Sunday 10/25', status:'IN EDIT', folderUrl:''},
  {title:'Pass the Toy - Fall Recruits', lead:'Kristin', prompt:'Intros', deadline:'Friday 11/13', status:'', folderUrl:''},
  {title:'Brand new <Reel>', lead:'Lora', prompt:'', deadline:'', status:'FILMING', folderUrl:''},
  {title:'Trick or Treat', lead:'Taylor', prompt:'', deadline:'', status:'IDEA', folderUrl:''}], true); reelsLive = true;`);
const rd = JSON.parse(t.run('JSON.stringify(reelsData)'));
assert.equal(rd[0].title, 'Meet the Squad (Pass the Toy)'); assert.match(rd[0].url, /instagram\.com\/reel\/DdxH92sTWXo/); assert.equal(rd[0].status, 'posted');
assert.equal(rd[1].status, 'editing'); assert.equal(rd[1].date, '2026-10-25');
assert.equal(rd[2].status, 'casting'); // blank in the sheet, casting in the hub
assert.equal(rd[3].title, 'Brand new <Reel>'); assert.equal(rd[3].status, 'filming');
t.run("reelsView='board'; renderReels()");
assert.match(t.html('#reels-view'), /reel-board/); assert.match(t.html('#reels-view'), /Brand new &lt;Reel&gt;/); assert.match(t.html('#reels-view'), /Ideas/);
t.run("reelsView='list'; renderReels()"); assert.match(t.html('#reels-view'), /In progress/);
t.run("reelsView='calendar'; reelsMonth = new Date(2026,9,1); renderReels()");
assert.match(t.html('#reels-view'), /October 2026/); assert.match(t.html('#reels-view'), /data-reel="r1"/);
assert.match(t.html('#reels-view'), /No date yet/); // Brand new Reel has no deadline
t.run("openPanel('reel',{reel:'r1'})");
assert.match(t.html('#modal-body'), /In edit/); assert.match(t.html('#modal-body'), /Upload your clips/);
assert.match(t.html('#modal-body'), /id="brief-body" data-doc="1-EXu39nUOtxi7YvTaoneQRu6n4L-LgeGpCxvcWUAYAM"/); assert.doesNotMatch(t.html("#modal-body"), /Open in Google Docs|Open the folder/); // brief shows in the app
assert.equal(t.run("briefDocId('https://docs.google.com/document/d/19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA/edit?usp=sharing')"), '19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA');
assert.equal(t.run("briefDocId('https://example.com/x')"), '');
t.run("openPanel('reel',{reel:'r0'})"); assert.match(t.html('#modal-body'), /Watch/); assert.match(t.html('#modal-body'), /data-action="reel-share"/);
t = boot(); assert.match(t.html('#resource-links'), /href="reels\.html\?view=board&amp;embed=1"/); assert.match(t.html('#resource-links'), /reels\.html\?view=calendar/);
assert.ok(validate({ ...load(), resources: [{ label: 'X', page: 'https://evil.com' }] }).some(e => /page in this site/.test(e)));

// Mentor password: nothing renders until it's entered, and every request to the script carries it.
t = boot(undefined, false, new Map());
assert.equal(t.html('#casting-projects'), ''); // still locked
t = boot();
assert.match(t.html('#casting-projects'), /Meet the Squad, Part 2/);
t = boot({ signInRequired: false }, false, new Map());
assert.match(t.html('#casting-projects'), /Meet the Squad, Part 2/); // sign-in switched off, no password screen
assert.ok(validate({ ...load(), mentorPasswordHash: 'ab'.repeat(32) }).some(e => /never holds a password/.test(e))); // not even a hash
assert.ok(validate({ ...load(), ideas: [{ id: 'a', title: 'A', series: 'reels' }] }).some(e => /creators-only/.test(e))); // Idea Bank stays private
assert.equal(validate(load()).length, 0);
{ const pub = ['content.js', 'reels-data.js', 'index.html', 'script.js', 'club.js', 'README.md', 'TESTING.md', 'tests/content.test.cjs', 'tests/apps-script.test.cjs', 'scripts/sync-from-google.cjs', 'scripts/relink-drive.cjs', 'apps-script/upload.gs', 'apps-script/club.gs'].map(f => fs.readFileSync(root + '/' + f, 'utf8')).join('\n');
  assert.doesNotMatch(pub, /[0-9a-f]{64}/); // no password hashes anywhere in the public site
  const reelsFile = fs.readFileSync(root + '/reels-data.js', 'utf8');
  assert.doesNotMatch(reelsFile, /"html"|"status": "IDEA"/); } // no briefs or future ideas in the public copy

// Reels page reads the copy in reels-data.js (scripts/sync-from-google.cjs), not Google.
t = boot();
t.run(`window.HUB_REELS = { updated: '2026-11-20T23:59:00Z', reels: [{ title: 'Tot Squad Round Up #3', lead: 'Kristin', prompt: '', briefUrl: 'https://docs.google.com/document/d/19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA/edit', deadline: 'Sunday 11/8', status: 'FILMING', folderUrl: '' }], briefs: { '19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA': { title: 'Round Ups', html: '<p><strong>Concept</strong>: favorites</p>' } } }; loadReels();`);
assert.match(t.el('#reels-source').textContent, /From the Reels tracker · copied Nov 20/);
assert.match(t.html('#reels-view'), /Tot Squad Round Up #3/); assert.match(t.html('#reels-view'), /Filming/);
const synced = JSON.parse(t.run('JSON.stringify(reelsData)')); t.run(`openPanel('reel',{reel:'${synced[0].id}'})`);
assert.match(t.html('#modal-body'), /brief-body/);
t = boot(); t.run("window.HUB_REELS = undefined; loadReels()"); assert.equal(t.el('#reels-source').textContent, ''); // falls back to content.js

console.log('PASS: upload guidance, connected resources, autosave, draft recovery, blocked-storage autosave');

// Disco profiles on Squad cards, "Message <lead>" on casting and Reel details, chat links after pitch/upload.
{
  const prof = 'https://tot-squad-hub.disco.co/group-directory/X?memberGroupId=1&tab=details&drawerProfileId=abc123&profileSettingsTab=profile';
  const c = load(); c.featuredSpecialists = c.featuredSpecialists.map(p => p.name === 'Kristin' ? { ...p, disco: prof } : p);
  assert.deepEqual(validate(c), []);
  assert.ok(validate({ ...c, leader: { ...c.leader, disco: 'https://example.com/?drawerProfileId=1' } }).some(e => /Disco profile/.test(e)));
  const t2 = boot(c);
  assert.match(t2.html('#squad-grid'), /channel\/Q2hhdENoYW5uZWw6MjAwMDUx\?drawerProfileId=abc123&amp;profileSettingsTab=profile[^>]*>Message on Disco/);
  assert.doesNotMatch(t2.html('#squad-grid'), /memberGroupId/);
  assert.match(t2.html('#casting-projects'), />Message Kristin</);
  assert.doesNotMatch(t2.html('#casting-projects'), /Prepare interest message/);
  assert.equal(t2.run("discoProfile({disco:'https://evil.example/?drawerProfileId=1'})"), '');
}
console.log('PASS: Disco profiles and chat links');


// Apply to join: open to signed-out visitors; no upload passcode anywhere.
{
  const t3 = boot(undefined, false, new Map());
  t3.run("openPanel('apply')");
  assert.match(t3.html('#modal-body'), /id="apply-form"/);
  assert.match(t3.html('#modal-body'), /brand guidelines/);
  const t4 = boot(); t4.run("openPanel('upload',{dest:'broll'})");
  assert.doesNotMatch(t4.html('#modal-body'), /passcode/i);
}
console.log('PASS: apply to join, single password');

// Live ideas: sheet ideas replace content.js, pitched ideas are marked, and signed-in creators get an edit form.
{
  const t5 = boot();
  t5.run(`liveIdeas = [{ id:'pitch-1', title:'Car Seat Speed Round', series:'reels', stage:'idea', summary:'Install race.', status:'Pitched', credit:['Taylor'], date:'2026-11-21' }]; renderIdeas();`);
  assert.match(t5.html('#idea-grid'), /Car Seat Speed Round/); assert.match(t5.html('#idea-grid'), /Just pitched/);
  assert.doesNotMatch(t5.html('#idea-grid'), /Fixture Game Show/);
  t5.run("openPanel('idea',{id:'pitch-1'})"); assert.match(t5.html('#modal-body'), /data-action="idea-edit"/);
  t5.run("openPanel('idea-edit',{id:'pitch-1'})"); assert.match(t5.html('#modal-body'), /id="idea-edit-form"/); assert.match(t5.html('#modal-body'), /value="Car Seat Speed Round"/);
  t5.run("upsertIdea({ id:'pitch-1', title:'Renamed', series:'reels', stage:'idea', summary:'', credit:[], date:'' })"); assert.match(t5.html('#idea-grid'), /Renamed/);
}
console.log('PASS: live ideas, pitched ideas, editing');

// Open casting call: three steps, no password, no Drive links.
{
  const t7 = boot(undefined, false, new Map());
  t7.run("openPanel('cast',{project:'meet-the-squad-part-2'})");
  assert.match(t7.html('#modal-body'), /Find the sunshine toy/); assert.match(t7.html('#modal-body'), /92401823/);
  t7.run("openCast('meet-the-squad-part-2', 2)"); assert.match(t7.html('#modal-body'), /Film your part/);
  t7.run("openCast('meet-the-squad-part-2', 3)"); assert.match(t7.html('#modal-body'), /id="cast-form"/);
  assert.doesNotMatch(t7.html('#modal-body'), /drive\.google/);
}
console.log('PASS: open casting call');

// What's new: creators-only feed, newest first, links ideas in the app.
{
  const t8 = boot();
  t8.run(`activityItems = [{ when: new Date().toISOString(), type:'pitch', who:'Lora', what:'pitched “Car Seat Speed Round”', link:'idea:fx-game' }, { when: '2026-11-01T10:00:00Z', type:'apply', who:'', what:'A new creator application came in', link:'' }]; renderActivity();`);
  assert.match(t8.html('#activity-list'), /<strong>Lora<\/strong> pitched/); assert.match(t8.html('#activity-list'), /data-action="idea" data-id="fx-game"/);
  assert.match(t8.html('#activity-list'), /A new creator application came in/); assert.doesNotMatch(t8.html('#activity-list'), /drive\.google/);
}
console.log('PASS: what’s new feed');

// Idea Bank: expanded concepts, example Reels, Squad build-ons and leads.
{
  const t9 = boot();
  t9.run(`liveIdeas = [{ id:'gotta-have', title:'Gotta Have', series:'reels', stage:'idea', summary:'Sort baby gear into three friendly tiers.', credit:[], date:'', lead:'Kristin',
    buildOns:[{ name:'Kristin', note:'Start with car seats.', date:'2026-11-20T18:00:00Z', lead:true }, { name:'Lora', note:'Add a lightning round.', date:'2026-11-21T18:00:00Z', lead:true }] }]; renderIdeas();`);
  assert.match(t9.html('#idea-grid'), /2 build-ons/);
  t9.run("openPanel('idea',{id:'gotta-have'})"); const d = t9.html('#modal-body');
  assert.match(d, /Original concept/); assert.match(d, /Could Survive Without/); // expanded concept from content.js
  assert.match(d, /class="example-reel" href="https:\/\/www\.instagram\.com\/reel\/DeuxzYWTQhv\/"/);
  assert.ok(d.indexOf('Add a lightning round') < d.indexOf('Start with car seats'), 'newest build-on first');
  assert.match(d, /id="build-form"/); assert.match(d, /Co-lead this idea with Kristin/);
}
console.log('PASS: idea concepts, examples, build-ons');

// Toolkit pages open in a panel over the page, so nobody loses their place.
{
  const t10 = boot();
  const kit = t10.html('#resource-links');
  for (const page of ['ideas.html', 'b-roll.html', 'reels.html?view=board', 'reels.html?view=calendar']) assert.ok(kit.includes(`data-tool-page="${page}"`), page);
  assert.match(t10.html('#nav-menu') + t10.html('#menu-tools'), /data-tool-page="ideas\.html"/);
  t10.run("location.href = 'https://t-vanderwolk.github.io/totsquad-social-sharing/index.html?embed=1'; openTool('reels.html?view=board','Reels tracker')");
  assert.match(t10.html('#modal-body'), /class="tool-frame" src="https:\/\/t-vanderwolk\.github\.io\/totsquad-social-sharing\/reels\.html\?view=board&amp;embed=1&amp;panel=1"/);
  assert.equal(t10.run('toolOpen'), true);
  t10.run("openPanel('brand')"); assert.equal(t10.run('toolOpen'), false); assert.doesNotMatch(t10.html('#modal-body'), /tool-frame/);
}
console.log('PASS: toolkit panel keeps your place');

// New applications: coordinators only (applicants' details stay private), escaped.
{
  assert.doesNotMatch(boot().html('#resource-links'), /data-action="applications"/); // creators don't see applicants
  const t11 = boot(undefined, false, new Map([['totsquad-mentor-key', 'Coord-123'], ['totsquad-coordinator-code', 'Coord-123']]));
  assert.match(t11.html('#resource-links'), /data-action="applications"/);
  const card = t11.run(`applicationCard({ submitted:'2026-11-22T18:00:00Z', name:'Ana <b>', region:'West', instagram:'@ana.babygear', roles:'Be on camera, Film B-roll', camera:'Yes', why:'I love helping families.', example:'javascript:alert(1)', status:'Approved' })`);
  assert.match(card, /Ana &lt;b&gt;/); assert.match(card, /Welcome aboard/); assert.match(card, /instagram\.com\/ana\.babygear/);
  assert.doesNotMatch(card, /javascript:/);
  t11.run(`activityItems = [{ when: new Date().toISOString(), type:'apply', who:'Ana', what:'applied to join the Creators Club', link:'' }]; renderActivity();`);
  assert.match(t11.html('#activity-list'), /data-action="applications">See it/);
}
console.log('PASS: new applications');

// What's new lives in the bell: the badge counts unseen items, and opening it clears the badge.
{
  const t12 = boot();
  t12.run(`activityItems = [{ when: new Date().toISOString(), type:'pitch', who:'Lora', what:'pitched x', link:'' }, { when: new Date(Date.now()-3600e3).toISOString(), type:'apply', who:'Ana', what:'applied', link:'' }]; renderActivity();`);
  assert.equal(t12.el('#nav-new').textContent, 2); assert.equal(t12.el('#nav-new').hidden, false);
  t12.run('markActivitySeen(); renderActivity();'); assert.equal(t12.el('#nav-new').hidden, true);
}
console.log('PASS: bell badge');

// Creators Club 2.0 dashboard (club.js): member view, outsider view, escaping, coordinator tabs.
{
  const t13 = boot(); t13.run(require('node:fs').readFileSync(root + '/club.js', 'utf8'));
  t13.run(`storageSet(UPLOAD_NAME_KEY, 'Ana <i>'); club = { ok:true, settings:{ requiredPosts:1, requiredStories:1, creatorCircleUrl:'' }, roster:['Ana <i>'],
    brief:{ id:'b1', title:'Registry <Mistakes>', theme:'Registry mistakes', weekStart:'2026-11-23', weekEnd:'2026-11-29', format:'Instagram Reel', cta:'Explore Baby Concierge' },
    member:{ name:'Ana <i>', status:'Active', market:'Phoenix', joined:'2026-11-23' }, submissions:[{ id:'s1', submitted:'2026-11-24T10:00:00Z', date:'2026-11-24', kind:'post', briefTitle:'Registry <Mistakes>', url:'https://www.instagram.com/reel/x/', status:'Submitted' }, { id:'s2', submitted:'2026-11-24T11:00:00Z', date:'2026-11-23', kind:'story', url:'', status:'Submitted' }],
    participation:{ standing:'Reminder', missedWeeks:2, missedMonths:0, weeksMet:1, weeksFinished:3, monthsMet:0, monthsFinished:0, thisWeek:{ stories:0, needed:1 }, thisMonth:{ posts:1, needed:1 } } }; renderDashboard();`);
  const d = t13.html('#club-dash');
  assert.match(d, /Registry &lt;Mistakes&gt;/); assert.doesNotMatch(d, /<Mistakes>|<i>/);
  assert.match(d, /data-action="club-submit" data-kind="post"/); assert.match(d, /data-action="club-submit" data-kind="story"/);
  assert.match(d, /Feed post this month<small>[^<]*<\/small><\/div><em>1 of 1/); assert.match(d, /Story this week<small>[^<]*<\/small><\/div><em>0 of 1/);
  assert.match(d, /Friendly reminder: no story for 2 weeks/); assert.match(d, /Feed post · Registry &lt;Mistakes&gt;/); assert.match(d, />Story</);
  assert.match(d, /data-action="guidelines"/); assert.match(d, /stories: 1 of 3 weeks/);
  assert.match(d, /tot-squad-hub\.disco\.co\/channel\/Q2hhdENoYW5uZWw6MjM0ODYw/); // Creator Circle falls back to content.js
  t13.run(`club.member = null; club.application = { status:'Waitlisted' }; renderDashboard();`);
  assert.match(t13.html('#club-dash'), /on the waitlist/); assert.doesNotMatch(t13.html('#club-dash'), /club-submit/);
  assert.doesNotMatch(t13.html('#club-dash'), /data-action="apply"/); // signed-in creators never see Apply to join
  t13.run(`club.application = null; renderDashboard();`); assert.doesNotMatch(t13.html('#club-dash'), /data-action="apply"/); assert.doesNotMatch(t13.html('#club-dash'), /Almost there|club-outside/);
  t13.run(`coord = { applications:[{ id:'a1', name:'Bo', status:'Submitted', notes:'' }], members:[], briefs:[], submissions:[], participation:[], settings:{ requiredPosts:1, requiredStories:1, storyReminderWeeks:2, storyReviewWeeks:4, postReminderMonths:1, postReviewMonths:2, briefEveryWeeks:2 }, analytics:{ activeCreators:0, publishedLinks:0, briefsRun:0, lastWeek:{ met:0, eligible:0, rate:null }, lastMonth:{ month:'2026-10', met:0, eligible:0, rate:null }, thisWeek:{ stories:0, creators:0 }, thisMonth:{ posts:0, creators:0 } }, current:'' };`);
  for (const tab of ['applications','roster','briefs','content','participation','analytics','settings']) { t13.run(`coordTab = '${tab}'; renderCoord();`); assert.ok(t13.html('#modal-body').length > 100, tab); }
  t13.run(`coord.briefs = [{ id:'b1', status:'Published', title:'Gift <Guide>', theme:'Gifts', audios:'Sound X', weekStart:'2026-11-23', weekEnd:'2026-12-06' }, { id:'b2', status:'Draft', title:'Next one' }]; coord.current = 'b1'; coordTab = 'briefs'; briefView = null; briefDraft = null; renderCoord();`);
  let bl = t13.html('#modal-body'); assert.match(bl, /data-coord-preview="b1"/); assert.match(bl, /data-coord-brief-del="b2"/); assert.match(bl, /Gift &lt;Guide&gt;/);
  t13.run(`briefView = { id:'b1', mode:'preview' }; renderCoord();`); bl = t13.html('#modal-body'); assert.match(bl, /Brief preview/); assert.match(bl, /Trending audios/); assert.match(bl, /Sound X/);
  t13.run(`briefView = { id:'b1', mode:'delete' }; renderCoord();`); bl = t13.html('#modal-body'); assert.match(bl, /Creators stop seeing it right away/); assert.match(bl, /data-coord-brief="delete" data-id="b1"/);
  t13.run(`briefView = null; briefDraft = { ...coord.briefs[0] }; renderCoord();`); bl = t13.html('#modal-body'); assert.match(bl, /Save changes/); assert.doesNotMatch(bl, /data-publish/); assert.match(bl, /data-coord-brief-del="b1"/);
  t13.run(`briefDraft = {}; renderCoord();`); bl = t13.html('#modal-body'); assert.match(bl, /Save draft/); assert.match(bl, /data-publish/); assert.doesNotMatch(bl, /data-coord-brief-del/); t13.run('briefDraft = null;');
  // The bi-weekly template: seven parts in order, examples as placeholders, a checklist before publishing, and the next start date.
  t13.run(`briefDraft = { weekStart: nextBriefStart(coord.briefs) }; renderCoord();`); bl = t13.html('#modal-body');
  const parts = ['Brief at a glance', 'Concepts &amp; creative direction', 'Trending audios', 'Hooks &amp; talking points', 'Upcoming launches', 'Deliverables', 'Assets, resources &amp; guidelines'].map(p => bl.indexOf(p));
  assert.ok(parts.every((x, i) => x > 0 && (i === 0 || x > parts[i - 1])), 'template parts in order');
  assert.match(bl, /placeholder="Holiday Registry Rush"/); assert.match(bl, /Leave blank for two weeks/); assert.match(bl, /Before you publish/);
  assert.equal((bl.match(/data-brief-check=/g) || []).length, 7);
  assert.match(bl, /name="weekStart" type="date" maxlength="300" value="2026-12-07"/); // the day after b1 ends
  assert.equal(t13.run(`nextBriefStart([{ weekStart:'2026-11-23' }])`), '2026-12-07'); // no end: two weeks
  t13.run('briefDraft = null;');
  t13.run(`coordTab = 'analytics'; renderCoord();`); assert.match(t13.html('#modal-body'), /aren’t tracked yet/); // no invented reach numbers
}
console.log('PASS: Creators Club dashboard and coordinator tools');

// Own accounts: the shared creator password never stays signed in; bios creators write show on Meet the Squad.
{
  const shared = boot(null, false, new Map([['totsquad-mentor-key', 'shared-test-pass'], ['totsquad-upload-name', 'Kristin']]));
  assert.equal(shared.run('mentorKey()'), ''); assert.equal(shared.run('movingKey'), 'shared-test-pass'); // goes to "Set up your password"
  const coordDevice = boot(null, false, new Map([['totsquad-mentor-key', 'Coord-123'], ['totsquad-coordinator-code', 'Coord-123']]));
  assert.equal(coordDevice.run('mentorKey()'), 'Coord-123'); // coordinators keep their sign-in
  const me = boot(); // signed in as Taylor (see boot)
  assert.equal(me.run('isAccount()'), true); assert.equal(me.run('myName()'), 'Taylor Vanderwolk');
  me.run(`liveBios = [{ name:'taylor vanderwolk', claimed:'Taylor', bio:'Gear nerd <b>' }, { name:'Kristin Smith', claimed:'Kristin', bio:'' }, { name:'Ana Lopez', bio:'New in Phoenix.' }, { name:'Bo Peep', bio:'' }]; renderSquad();`);
  const sq = me.html('#squad-grid');
  assert.match(sq, /Gear nerd &lt;b&gt;/); assert.doesNotMatch(sq, /Scottsdale-based baby gear expert/); // Taylor's own bio wins
  assert.doesNotMatch(sq, /Holly Springs/); // Kristin deleted hers
  assert.match(sq, /Ana Lopez/); assert.doesNotMatch(sq, />Bo Peep</); assert.equal(me.run(`isFullName('Kristin')`), false); assert.equal(me.run(`isFullName('Ana Lopez')`), true); // a new creator with a bio gets a card; an empty one doesn't
  assert.equal((sq.match(/data-action="profile"/g) || []).length, 1); assert.match(sq, /Edit my bio/); // only on your own card
  const out = boot(null, false, new Map()); out.run(`liveBios = [{ name:'Taylor Vanderwolk', claimed:'Taylor', bio:'Gear nerd' }]; renderSquad();`);
  assert.match(out.html('#squad-grid'), /Gear nerd/); assert.doesNotMatch(out.html('#squad-grid'), /data-action="profile"/); // public sees bios, no edit
}
{
  const k = boot(null, false, new Map([['totsquad-mentor-key','acct.testaccount1.testsecretsecretsecretsecret'],['totsquad-account-name','Kristin Smith'],['totsquad-account-claim','Kristin']]));
  k.run(`liveBios = [{ name:'Kristin Smith', claimed:'Kristin', bio:'Claimed bio' }, { name:'Kristin Jones', claimed:'', bio:'Another Kristin' }]; renderSquad();`);
  const sq = k.html('#squad-grid'); assert.match(sq, /Claimed bio/); assert.match(sq, /Kristin Jones/); // the claim decides whose card it is
  assert.equal((sq.match(/data-action="profile"/g) || []).length, 1);
  k.run(`liveIdeas = [{ id:'x', title:'Old', credit:['Kristin'] }];`); assert.equal(k.run(`canEditIdea(ideas()[0])`), true);
}
console.log('PASS: own passwords and bios');

// The Creators Club guidelines: open to everyone in the toolkit, and agreed to on the application and the password set-up.
{
  const g = boot(null, false, new Map()); // signed out
  assert.equal(g.run("PUBLIC_GUIDES.includes('guidelines')"), true);
  assert.match(g.run("toolkitItems().map(t => t.action).join(',')"), /guidelines/);
  g.run("openPanel('guidelines')"); const html = g.html('#modal-body');
  for (const part of ['mutual visibility', 'least one reel, carousel, or collab post per month', 'at least one Instagram story each week', 'Every other week', 'Give as much as you take.', 'Authenticity over obligation.', 'Respect different specialties.', 'Keep participation professional.', 'consistency, not perfection', 'Welcome to the Squad!']) assert.ok(html.includes(part), part);
  assert.match(html, /data-action="apply"/); // signed out: a way to apply
  g.run("openApply()"); assert.match(g.html('#modal-body'), /Read the Creators Club guidelines/); assert.match(g.html('#modal-body'), /1 feed post per month/);
  ['#acct-pw','#acct-claim','#acct-last'].forEach(id => { g.el(id).focus = () => {}; }); g.run("openAccountSetup('x', 'Ana Lopez')"); assert.match(g.html('#modal-body'), /acct-agree/); assert.match(g.html('#modal-body'), /guide-fold/);
}
console.log('PASS: Creators Club guidelines');

// Idea Bank: Edit and Delete show on ideas credited to you, and on every idea for coordinators.
{
  const me = boot(); // signed in as Taylor Vanderwolk
  me.run(`liveIdeas = [{ id:'a', title:'Mine', credit:['Taylor'] }, { id:'b', title:'Hers', credit:['Kristin'] }, { id:'c', title:'Ours', credit:['Kristin','Taylor Vanderwolk'] }];`);
  assert.equal(me.run(`canEditIdea(ideas().find(i => i.id === 'a'))`), true); // first-name credit counts
  assert.equal(me.run(`canEditIdea(ideas().find(i => i.id === 'b'))`), false);
  assert.equal(me.run(`canEditIdea(ideas().find(i => i.id === 'c'))`), true);
  me.run(`openIdea('b')`); assert.doesNotMatch(me.html('#modal-body'), /idea-edit|idea-delete/);
  me.run(`openIdea('a')`); assert.match(me.html('#modal-body'), /data-action="idea-edit"/); assert.match(me.html('#modal-body'), /data-action="idea-delete"/);
  const co = boot(null, false, new Map([['totsquad-mentor-key', 'Coord-123'], ['totsquad-coordinator-code', 'Coord-123']]));
  co.run(`liveIdeas = [{ id:'b', title:'Hers', credit:['Kristin'] }];`);
  assert.equal(co.run(`canEditIdea(ideas()[0])`), true);
  co.el('#ie-title').focus = () => {}; co.run(`openIdeaEdit('')`); assert.match(co.html('#modal-body'), /Add an idea|ie-credit/); assert.match(co.html('#modal-body'), /id="ie-credit"/);
}
console.log('PASS: idea bank permissions');

// Second casting call: Round Up pointing clips + the Round Up questions (no toy step).
{
  const r = boot();
  assert.match(r.html('#casting-projects'), /Tot Squad Round Up: Point &amp; Answer/);
  assert.match(r.html('#casting-projects'), /data-action="cast" data-project="round-up-pointing">Film &amp; answer/);
  r.run(`openCast('round-up-pointing', 1)`); let h = r.html('#modal-body');
  assert.match(h, /1 · Film it/); assert.match(h, /2 · Answer the questions/); assert.match(h, /3 · Send it/); assert.doesNotMatch(h, /Find the toy/);
  assert.match(h, /Tot Squad shirt/); assert.match(h, /doesn’t have to be filmed at Target|home, the office or Target/); assert.match(h, /3 to 5 clips/);
  r.run(`openCast('round-up-pointing', 2)`); h = r.html('#modal-body');
  for (const q of ['Favorite stroller?', 'Favorite car seat?', 'Best baby shower gift?', 'Song you could listen to on repeat?']) assert.ok(h.includes(q), q);
  r.run(`openCast('round-up-pointing', 3)`); h = r.html('#modal-body'); assert.match(h, /accept="video\/\*" multiple/); assert.match(h, /Send my clips &amp; answers/);
  r.run(`openCast('meet-the-squad-part-2', 1)`); assert.match(r.html('#modal-body'), /1 · Find the toy/); // the first call is unchanged
}
console.log('PASS: round up casting call');

// Claimed names replace the first-name placeholders in name pickers.
{
  const n = boot(); n.run(require('node:fs').readFileSync(root + '/club.js', 'utf8'));
  n.run(`squadClaims = [{ claimed:'Taylor', name:'Taylor Vanderwolk' }, { claimed:'Kristin', name:'Kristin Jenkins' }, { claimed:'Jessica', name:'Jessica Crim' }]; club = { roster:['Jen','Kristin Jenkins','Jessica Crim','Taylor Vanderwolk','Lora'] };`);
  const names = n.run('clubNames()');
  for (const x of ['Taylor Vanderwolk', 'Kristin Jenkins', 'Jessica Crim', 'Aly', 'Lora']) assert.ok(names.includes(x), x);
  for (const x of ['Taylor', 'Kristin', 'Jessica']) assert.ok(!names.includes(x), x);
  assert.ok(n.run('baseSquadNames()').includes('Kristin')); // the claim list still shows the Squad by first name
  assert.ok(n.run('squadNames()').includes('Kristin Jenkins') && !n.run('squadNames()').includes('Kristin'));
}
console.log('PASS: claimed names replace placeholders');

// Meet the Squad shows the full name on a claimed card; the coordinator checklist includes approved applicants.
{
  const q = boot(); q.run(`squadClaims = [{ claimed:'Kristin', name:'Kristin Jenkins' }]; renderSquad();`);
  assert.match(q.html('#squad-grid'), /<h3>Kristin Jenkins<\/h3>/); assert.match(q.html('#squad-grid'), /<h3>Aly<\/h3>/);
  q.run(require('node:fs').readFileSync(root + '/club.js', 'utf8'));
  const html = q.run(`coordClaims({ accounts:[{ name:'Kristin Jenkins', claimed:'Kristin', hasPassword:true }], members:[{ name:'Kristin Jenkins', status:'Active' }, { name:'Dana Park', status:'Active' }, { name:'Old Timer', status:'Alumni' }] })`);
  assert.match(html, /Dana Park/); assert.doesNotMatch(html, /Old Timer/); assert.equal((html.match(/Kristin Jenkins/g) || []).length, 1);
}
console.log('PASS: claimed cards and applicants');

// Casting calls creators post: who each is for, the poster can edit, the cast steps work, and the post form.
{
  const c = boot(), calls = `[{ id:'call-a', title:'Stroller Fold Race', audience:'network', description:'Fastest fold wins.', instructions:'Film one fold.', steps:['Hold the phone upright'], questions:['Which stroller?'], deadline:'', lead:'Kristin Jenkins', open:true, status:'open', review:'', mine:false, responses:2 },
    { id:'call-b', title:'Car Seat Myths', audience:'public', description:'One myth, busted.', instructions:'Say the myth, then the truth.', steps:[], questions:[], deadline:'', lead:'Taylor Vanderwolk', open:true, status:'open', review:'waiting', mine:true, responses:0 },
    { id:'call-c', title:'Closed One', audience:'network', description:'x', instructions:'y', steps:[], questions:[], deadline:'', lead:'Taylor Vanderwolk', open:false, status:'closed', review:'', mine:true, responses:1 }]`;
  c.run(`liveCalls = ${calls}; renderCasting();`);
  const h = c.html('#casting-projects');
  assert.match(h, /Stroller Fold Race/); assert.match(h, /Posted by Kristin Jenkins/); assert.match(h, /Creators Club only/);
  assert.match(h, /Creators Club for now · public once approved/); assert.doesNotMatch(h, /Closed One/);
  assert.match(h, /data-action="call-edit" data-call="call-b"/); assert.doesNotMatch(h, /data-call="call-a"/); // only your own calls
  assert.match(h, /data-action="cast" data-project="call-a">Film &amp; answer/);
  c.run("openPanel('cast',{project:'call-a'})"); assert.match(c.html('#modal-body'), /Hold the phone upright/);
  c.run("openCast('call-a', 2)"); assert.match(c.html('#modal-body'), /Which stroller\?/);
  c.run("openPanel('call-edit',{call:'call-b'})"); { const f = c.html('#modal-body');
    assert.match(f, /id="call-form"/); assert.match(f, /value="Car Seat Myths"/); assert.match(f, /value="public" checked/); assert.match(f, /Close call/); }
  c.run("openPanel('call-new',{idea:'fx-registry'})"); { const f = c.html('#modal-body');
    assert.match(f, /For your idea “Fixture Registry Idea”/); assert.match(f, /value="network" checked/); assert.match(f, /once Taylor, Sarah or Linden approves it/); }
  c.run("openPanel('my-ideas')"); { const m = c.html('#modal-body');
    assert.match(m, /Car Seat Myths/); assert.match(m, /Waiting for approval/); assert.match(m, /Closed One/); assert.doesNotMatch(m, /Stroller Fold Race/); }
  // Signed out: approved public calls carry the open label (the script sends no others).
  const o = boot(undefined, false, new Map());
  o.run(`liveCalls = [{ id:'call-p', title:'Bath Time Tips', audience:'public', description:'One tip.', instructions:'Film it.', steps:[], questions:[], deadline:'', lead:'Lora' }]; renderCasting();`);
  assert.match(o.html('#casting-projects'), /Bath Time Tips/); assert.match(o.html('#casting-projects'), /Open to every specialist, no sign-in/); assert.doesNotMatch(o.html('#casting-projects'), /call-edit/);
  // Dashboard card and coordinator review (club.js).
  c.run(require('node:fs').readFileSync(root + '/club.js', 'utf8'));
  { const card = c.run('myIdeasCard()'); assert.match(card, /2 ideas/); assert.match(card, /1 casting call open, 1 waiting for public approval/); assert.match(card, /data-action="my-ideas"/); }
  // Casting calls live on the dashboard once signed in: every open call, with its action and Edit for your own.
  { const cc = c.run('castingCard()'); assert.match(cc, /id="dash-casting"/); assert.match(cc, /Stroller Fold Race/); assert.match(cc, /Car Seat Myths/); assert.doesNotMatch(cc, /Closed One/);
    assert.match(cc, /Meet the Squad, Part 2/); assert.match(cc, /data-action="call-edit" data-call="call-b"/); assert.match(cc, /data-action="call-new"/); }
  // Signed in, the public sections (casting, published Reels, Meet the Squad, the path) are hidden.
  { const html = require('node:fs').readFileSync(root + '/index.html', 'utf8');
    for (const id of ['casting', 'made', 'squad']) assert.match(html, new RegExp(`<section class="section" id="${id}"[^>]*data-public>`), id);
    assert.match(html, /<section class="path[^"]*"[^>]*data-public>/); assert.match(html, /Submit B-roll anytime/); assert.doesNotMatch(html, /permission to use the footage/); assert.match(html, /<li data-mentor><a href="#dash-casting">Casting calls<\/a><\/li>/); }
  { const tab = c.run(`coordCalls({ calls: ${calls} })`); assert.match(tab, /Approve for the public page/); assert.match(tab, /data-coord-call="call-b" data-decision="club"/); assert.match(tab, /data-coord-call="call-c" data-decision="open">Reopen/); }
}
console.log('PASS: creator casting calls, My ideas');

// Idea Bank while the sheet loads: placeholders, never the empty "Pitch an idea" state; a failed load says so.
{
  const L = boot({ ideas: [] });
  L.run("globalThis.fetch = () => new Promise(() => {}); liveIdeas = null; ideasState = 'loading'; renderIdeas();");
  assert.match(L.html('#idea-grid'), /idea-loading/); assert.doesNotMatch(L.html('#idea-grid'), /The Idea Bank is open/); assert.equal(L.html('#idea-filters'), '');
  L.run("ideasState = 'failed'; renderIdeas();"); assert.match(L.html('#idea-grid'), /didn’t load/); assert.match(L.html('#idea-grid'), /data-ideas-retry/);
  L.run("ideasState = 'done'; renderIdeas();"); assert.match(L.html('#idea-grid'), /The Idea Bank is open/); // loaded and truly empty
}
console.log('PASS: Idea Bank loading state');

// Social templates: a public resource that opens Tot Squad's Canva templates (no template photos on the site).
{
  const T = boot(); T.run('renderGuides()');
  assert.match(T.html('#public-guides'), /data-action="templates"/); assert.match(T.html('#resource-links'), /Social templates/);
  T.run("openPanel('templates')"); const m = T.html('#modal-body');
  assert.match(m, /href="https:\/\/canva\.link\/ifqvvtay28yrfmk"/); assert.match(m, /This or That/); assert.doesNotMatch(m, /<img/);
}
console.log('PASS: social templates');
