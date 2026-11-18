// Checks content.js before it goes live. Usage: node scripts/validate-content.cjs
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const STAGES = ['idea', 'casting', 'filming', 'editing', 'published'];
const TINTS = ['plum', 'teal', 'peach', 'linen'];

function load(file = path.join(__dirname, '..', 'content.js')) {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  return ctx.window.HUB_CONTENT;
}

function validate(c) {
  if (!c || typeof c !== 'object') return ['content.js did not define window.HUB_CONTENT'];
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const isDate = v => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return false; const d = new Date(v + 'T12:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v; };
  const isUrl = v => { try { return ['https:', 'http:'].includes(new URL(v).protocol); } catch { return false; } };
  const optDate = (w, v) => { if (v && !isDate(v)) err(w, `"${v}" is not a real YYYY-MM-DD date`); };
  const optImage = (w, v) => {
    if (/^images\//.test(v || '')) { if (!/^images\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(v) || !require('node:fs').existsSync(require('node:path').join(__dirname, '..', v))) err(w, `"${v}" is not in the images folder`); }
    else optUrl(w, v);
  };
  const optUrl = (w, v) => { if (v && !isUrl(v)) err(w, `"${v}" must be a full https:// link`); };
  const list = name => { const v = c[name]; if (v === undefined) return []; if (!Array.isArray(v)) { err(name, 'must be a list'); return []; } return v; };
  const names = (w, v) => { if (v !== undefined && (!Array.isArray(v) || v.some(n => typeof n !== 'string' || !n.trim()))) err(w, 'credit must be a list of names'); };

  try { new Intl.DateTimeFormat('en-US', { timeZone: c.timeZone }); } catch { err('timeZone', 'is not a valid time zone'); }
  optUrl('discoUrl', c.discoUrl);

  const seriesIds = new Set();
  list('series').forEach((s, i) => {
    const w = `series[${i}]`;
    if (!s.id) err(w, 'needs an id'); else if (seriesIds.has(s.id)) err(w, `duplicate id "${s.id}"`);
    seriesIds.add(s.id);
    if (!s.label) err(w, 'needs a label');
    if (!TINTS.includes(s.color)) err(w, `color must be one of ${TINTS.join(', ')}`);
  });

  const ideaIds = new Set();
  list('ideas').forEach((x, i) => {
    const w = `ideas[${i}] (${x.id || x.title || '?'})`;
    if (!x.id) err(w, 'needs an id'); else if (ideaIds.has(x.id)) err(w, 'duplicate id');
    ideaIds.add(x.id);
    if (!x.title) err(w, 'needs a title');
    if (!seriesIds.has(x.series)) err(w, `series "${x.series}" is not in the series list`);
    if (x.stage && !STAGES.includes(x.stage)) err(w, `stage must be one of ${STAGES.join(', ')}`);
    names(w, x.credit);
    optDate(w + ' date', x.date); optDate(w + ' dueDate', x.dueDate); optUrl(w + ' discussionUrl', x.discussionUrl);
    (x.variations || []).forEach((v, j) => { const vw = `${w} variations[${j}]`; if (!v.title) err(vw, 'needs a title'); names(vw, v.credit); optDate(vw + ' date', v.date); });
  });

  const projectIds = new Set();
  [...list('activeCollaborations').map(p => ['activeCollaborations', p]), ...list('completedCollaborations').map(p => ['completedCollaborations', p])].forEach(([group, p]) => {
    const w = `${group} (${p.id || p.title || '?'})`;
    if (!p.id) err(w, 'needs an id'); else if (projectIds.has(p.id)) err(w, `id "${p.id}" is used twice`);
    projectIds.add(p.id);
    if (!p.title) err(w, 'needs a title');
    if (p.status != null && !STAGES.includes(p.status)) err(w, `status must be null or one of ${STAGES.join(', ')}`);
    optDate(w + ' submissionDeadline', p.submissionDeadline);
    if (/^images\//.test(p.thumbnail || '')) { if (!require('node:fs').existsSync(require('node:path').join(__dirname, '..', p.thumbnail))) err(w + ' thumbnail', `"${p.thumbnail}" is not in the images folder`); }
    else optUrl(w + ' thumbnail', p.thumbnail); optUrl(w + ' discussionUrl', p.discussionUrl); optUrl(w + ' publishedReelUrl', p.publishedReelUrl); optUrl(w + ' exampleReelUrl', p.exampleReelUrl);
    if (p.status === 'published' && !p.publishedReelUrl) err(w, 'is published but has no publishedReelUrl');
    if (p.status === 'casting' && !p.instructions) err(w, 'is casting but has no filming instructions');
    if (p.ideaId && !ideaIds.has(p.ideaId)) err(w, `ideaId "${p.ideaId}" does not match an idea`);
    if (!Array.isArray(p.participatingSpecialists)) err(w, 'participatingSpecialists must be a list');
  });

  list('upcomingDeadlines').forEach((d, i) => {
    const w = `upcomingDeadlines[${i}]`;
    if (!d.id || !d.title) err(w, 'needs an id and title');
    if (!isDate(d.date)) err(w, `date "${d.date}" is not a real YYYY-MM-DD date`);
    optUrl(w + ' url', d.url);
  });

  list('recurringEvents').forEach((e, i) => {
    const w = `recurringEvents[${i}]`;
    if (!e.title) err(w, 'needs a title');
    if (e.weekday != null && !(Number.isInteger(e.weekday) && e.weekday >= 0 && e.weekday <= 6)) err(w, 'weekday must be 0 (Sunday) to 6 (Saturday), or null');
    optUrl(w + ' url', e.url);
  });

  list('waysOfWorking').forEach((x, i) => { const w = `waysOfWorking[${i}]`; if (!x.title) err(w, 'needs a title'); names(w, x.credit); optDate(w + ' date', x.date); });

  const people = new Set();
  if (c.leader) {
    const l = c.leader;
    if (!l.name) err('leader', 'needs a name');
    optImage('leader photo', l.photo); optUrl('leader link', l.link);
    if (l.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(String(l.instagram).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, ''))) err('leader instagram', `"${l.instagram}" is not a valid Instagram handle`);
  }
  list('ideas').forEach(i => { if (i && i.image) optImage(`ideas (${i.id}) image`, i.image); });
  optUrl('reelsTrackerUrl', c.reelsTrackerUrl);
  list('contentCalendar').forEach((x, i) => {
    const w = `contentCalendar[${i}]`;
    if (!x || !x.title) err(w, 'needs a title');
    if (x && !['posted','editing','filming','casting','scheduled','idea'].includes(x.status)) err(w, `status "${x && x.status}" must be posted, editing, filming, casting, scheduled or idea`);
    if (x && x.date) optDate(w + ' date', x.date);
    if (x) optUrl(w + ' url', x.url);
  });
  list('featuredSpecialists').forEach((p, i) => {
    const w = `featuredSpecialists[${i}]`;
    const n = typeof p === 'string' ? p : p && p.name;
    if (!n) { err(w, 'needs a name'); return; }
    if (people.has(n.toLowerCase())) err(w, `"${n}" is listed twice`);
    people.add(n.toLowerCase());
    if (p && p.region && !['East', 'Central', 'West'].includes(p.region)) err(w + ' region', `"${p.region}" must be East, Central or West`);
    if (typeof p === 'object') { optImage(w + ' photo', p.photo); optUrl(w + ' link', p.link); }
    if (p && p.instagram) {
      const h = String(p.instagram).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
      if (!/^[A-Za-z0-9._]{1,30}$/.test(h)) err(w + ' instagram', `"${p.instagram}" is not a valid Instagram handle`);
    }
  });

  list('resources').forEach((r, i) => { if (!r.label) err(`resources[${i}]`, 'needs a label'); optUrl(`resources[${i}] url`, r.url); });
  return errors;
}

module.exports = { validate, load };

if (require.main === module) {
  const errors = validate(load());
  if (errors.length) { console.error(`content.js has ${errors.length} problem(s):\n- ${errors.join('\n- ')}`); process.exit(1); }
  console.log('content.js looks good.');
}
