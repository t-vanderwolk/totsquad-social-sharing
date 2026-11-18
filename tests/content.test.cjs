// Render/eligibility tests. Fixtures here are test-only and never deployed.
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict');
const root = require('node:path').join(__dirname, '..');
const { validate, load } = require('../scripts/validate-content.cjs');

function boot(config, storageFailure = false, stored = new Map()) {
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: false, addEventListener() {}, classList: { toggle() {} }, replaceChildren() {}, showModal() { this.open = true; } }); return elements.get(id); };
  const storage = { getItem(k) { if (storageFailure) throw Error('blocked'); return stored.get(k) ?? null; }, setItem(k, v) { if (storageFailure) throw Error('blocked'); stored.set(k, String(v)); }, removeItem(k) { if (storageFailure) throw Error('blocked'); stored.delete(k); } };
  const ctx = vm.createContext({ window: {}, document: { querySelector: el, body: { classList: { toggle() {} } }, addEventListener() {} }, URL, URLSearchParams, location: { search: '?embed=1' }, Intl, Date, Map, Set, console, localStorage: storage, FormData: class { constructor(form) { return form.formData || []; } } });
  vm.runInContext(fs.readFileSync(root + '/content.js', 'utf8'), ctx);
  if (config) Object.assign(ctx.window.HUB_CONTENT, config);
  vm.runInContext(fs.readFileSync(root + '/script.js', 'utf8'), ctx);
  return { ctx, run: s => vm.runInContext(s, ctx), html: id => el(id).innerHTML, el };
}

// Real content renders its empty and placeholder states honestly.
let t = boot();
assert.match(t.html('#casting-projects'), /Something fun is in the works/);
assert.match(t.html('#project-gallery'), /Meet the Squad/);
assert.doesNotMatch(t.html('#project-gallery'), /Pass the Toy|Details coming/);
assert.equal((t.html('#project-gallery').match(/Watch the Reel/g) || []).length, 4); // four verified Reels
assert.match(t.html('#project-gallery'), /src="images\/meet-the-squad\.jpg"/); // local cover images allowed
assert.equal(t.run("imageUrl('images/../x.jpg')"), ''); // but only plain files in images/
assert.equal(t.run("imageUrl('javascript:alert(1)')"), '');
assert.match(t.html('#project-gallery'), /See the format/); // Round Up links to its idea
assert.match(t.html('#resource-links'), /aria-disabled="true"/);
assert.match(t.html('#idea-grid'), /Registry NOT Roast/);
assert.match(t.html('#idea-filters'), /aria-pressed="true"/);
assert.match(t.html('#squad-grid'), /Kristin/);
assert.match(t.html('#squad-grid'), /data-id="tot-squad-round-up"/); // contributions computed from credits
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

t = boot({ ideas: [{ id: 'x', title: '<b>Fixture</b>', series: 'reels', credit: ['Tester'] }], featuredSpecialists: [{ name: 'Tester', photo: 'javascript:alert(1)' }] });
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
assert.match(t.html('#project-gallery'), /Watch the Reel/);

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
assert.match(t.run('submissionHelp()'), /Open folder instructions in Disco/);
assert.match(t.html('#resource-links'), /Specialist social templates/);
assert.match(t.html('#project-gallery'), /See the format/);
t = boot({ submissionInstructionsUrl: 'javascript:alert(1)' });
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
assert.match(t.html('#squad-leader'), /Tot Squad CEO/);
assert.match(t.html('#squad-leader'), /AKA The Queen/);
assert.match(t.html('#squad-leader'), /instagram\.com\/jenbsaxton\//);
assert.doesNotMatch(t.html('#squad-grid'), />Jen</);
t = boot({ leader: null });
assert.equal(t.html('#squad-leader'), '');

console.log('PASS: upload guidance, connected resources, autosave, draft recovery, blocked-storage autosave');
