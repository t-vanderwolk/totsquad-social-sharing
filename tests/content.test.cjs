// Render/eligibility tests. Fixtures here are test-only and never deployed.
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict');
const root = require('node:path').join(__dirname, '..');
const { validate, load } = require('../scripts/validate-content.cjs');

function boot(config, storageFailure = false, stored = new Map([['totsquad-mentor-key','test-key']])) {
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: false, addEventListener() {}, classList: { toggle() {} }, replaceChildren() {}, showModal() { this.open = true; } }); return elements.get(id); };
  const storage = { getItem(k) { if (storageFailure) throw Error('blocked'); return stored.get(k) ?? null; }, setItem(k, v) { if (storageFailure) throw Error('blocked'); stored.set(k, String(v)); }, removeItem(k) { if (storageFailure) throw Error('blocked'); stored.delete(k); } };
  const ctx = vm.createContext({ window: {}, document: { querySelector: el, querySelectorAll: () => [], body: { classList: { toggle() {} } }, addEventListener() {} }, URL, URLSearchParams, location: { search: '?embed=1' }, Intl, Date, Map, Set, console, localStorage: storage, FormData: class { constructor(form) { return form.formData || []; } } });
  vm.runInContext(fs.readFileSync(root + '/content.js', 'utf8'), ctx);
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
assert.match(t.html('#idea-grid'), /Registry NOT Roast/);
assert.match(t.html('#idea-filters'), /aria-pressed="true"/);
assert.match(t.html('#squad-grid'), /Kristin/);
assert.match(t.html('#squad-grid'), /class="bio">Mom of three in Holly Springs/);
assert.doesNotMatch(t.html('#squad-grid'), /class="tags"/); // no idea tags on squad cards
assert.equal((t.html('#squad-grid').match(/class="region region-/g) || []).length, 10); // every specialist has a region
assert.match(t.html('#week-events'), /Every Thursday/);
assert.match(t.html('#week-events'), /Dates to come/);
assert.match(t.html('#production-board'), /Nothing in production yet/);
assert.match(t.html('#ways'), /engagement pact/i);
assert.equal(t.el('#welcome').hidden, false);

// Filtering the Idea Bank.
t.run("ideaFilter='registry';renderIdeas()");
assert.match(t.html('#idea-grid'), /Registry NOT Roast/);
assert.doesNotMatch(t.html('#idea-grid'), /Fund or No Fund/);
t.run("ideaFilter='missing';renderIdeas()");
assert.match(t.html('#idea-grid'), /Fund or No Fund/); // unknown filter falls back to all

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
assert.match(t.run("draftText('pitch',{title:'T',basedOn:'registry-not-roast'})"), /Building on: Registry NOT Roast/);

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
assert.match(t.html('#resource-links'), /Content submission folder/);
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
assert.match(trk, /In progress/); assert.match(trk, /Daddy’s Home/); assert.match(trk, /Read the brief/);
assert.match(trk, /Intros passing the sunshine toy/); assert.match(trk, /Upload your clips/);
assert.match(trk, /data-action="calendar"/); assert.match(trk, /Edit in Google Sheets/);
t.run("openPanel('calendar')");
const cal = t.html('#modal-body');
assert.ok(cal.indexOf('Up next') < cal.indexOf('Posted') && cal.indexOf('Posted') < cal.indexOf('Future ideas'));
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
assert.match(t.html('#broll-folders'), /Taylor’s folder/); assert.match(t.html('#broll-folders'), /1BebMeyvEhZp7e0XBVur5nPPwpho_SOwQ/);
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
t.run("brollFilter='strollers';renderBroll()");
assert.doesNotMatch(t.html('#broll-grid'), /Aisle walk/);
t = boot({ brollFolders: [{ name: 'Kristin', url: 'https://drive.google.com/drive/folders/k' }], brollClips: [] });
t.run("brollPerson='Kristin';renderBroll()"); assert.match(t.html('#broll-grid'), /No clips here yet/);
assert.ok(validate({ ...load(), brollFolders: [{ name: '' }] }).some(e => /needs a name/.test(e)));
// Upload form: falls back to Drive links when uploadEndpoint is blank.
t = boot({ uploadEndpoint: '' });
assert.match(t.run('submissionHelp()'), /href="https:\/\/drive\.google\.com\/drive\/folders\/1tc9a6ur6K3QKAreSI_z0JYpG9ZHEmuKd"/);
assert.match(t.html('#broll-add'), /href="https:\/\/drive\.google\.com\/drive\/folders\/1Nl5OG/);
assert.doesNotMatch(t.html('#casting-projects'), /data-action="upload"/);
const EP = 'https://script.google.com/macros/s/AKfyc-test_123/exec';
t = boot({ uploadEndpoint: EP });
assert.match(t.html('#broll-add'), /data-action="upload" data-dest="broll"/);
assert.match(t.html('#casting-projects'), /data-action="upload" data-dest="collab" data-project="meet-the-squad-part-2"/);
t.run("openPanel('upload',{dest:'collab',project:'meet-the-squad-part-2'})");
const up = t.html('#modal-body');
assert.match(up, /<option value="Meet the Squad, Part 2: Pass the Toy" selected>/); assert.match(up, /Daddy’s Home/);
assert.match(up, /<option>Taylor<\/option>/); assert.match(up, /type="file" accept="video\/\*,image\/\*" multiple/); assert.match(up, /Squad passcode/);
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
assert.match(t.html('#modal-body'), /id="brief-body" data-doc="1-EXu39nUOtxi7YvTaoneQRu6n4L-LgeGpCxvcWUAYAM"/); assert.match(t.html('#modal-body'), /Open in Google Docs/); // brief shows in the app
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
t = boot({ mentorPasswordHash: '' }, false, new Map());
assert.match(t.html('#casting-projects'), /Meet the Squad, Part 2/); // no password set, no password screen
assert.ok(validate({ ...load(), mentorPasswordHash: 'footpop' }).some(e => /SHA-256/.test(e))); // never the password itself

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
  assert.match(t2.html('#squad-grid'), /channel\/Q2hhdENoYW5uZWw6MjAwMDUx\?drawerProfileId=abc123&amp;profileSettingsTab=profile[^>]*>Disco profile/);
  assert.doesNotMatch(t2.html('#squad-grid'), /memberGroupId/);
  assert.match(t2.html('#casting-projects'), />Message Kristin</);
  assert.doesNotMatch(t2.html('#casting-projects'), /Prepare interest message/);
  assert.equal(t2.run("discoProfile({disco:'https://evil.example/?drawerProfileId=1'})"), '');
}
console.log('PASS: Disco profiles and chat links');

