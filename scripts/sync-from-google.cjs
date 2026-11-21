#!/usr/bin/env node
/*
 * Copies the Reels tracker and every brief from Google into the site (reels-data.js),
 * so the Reels page reads the site's own file instead of Google.
 *
 *   MENTOR_KEY=yourpassword node scripts/sync-from-google.cjs
 *
 * Uses the Creators Club script (uploadEndpoint in content.js). Videos stay in Drive.
 * The GitHub workflow .github/workflows/sync.yml runs this every hour when the
 * MENTOR_KEY secret is set.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const key = process.env.MENTOR_KEY || process.argv[2] || '';
const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const endpoint = ctx.window.HUB_CONTENT.uploadEndpoint;

if (!endpoint) { console.error('No uploadEndpoint in content.js.'); process.exit(1); }
if (!key) { console.error('Set MENTOR_KEY to the mentor password, e.g. MENTOR_KEY=footpop node scripts/sync-from-google.cjs'); process.exit(1); }

const get = async (action, extra = '') => {
  const res = await fetch(`${endpoint}?action=${action}&key=${encodeURIComponent(key)}${extra}`);
  const data = await res.json();
  if (data.locked) throw new Error('The mentor password was refused.');
  if (!data.ok) throw new Error(data.error || `Request for ${action} failed.`);
  return data;
};
const docId = url => { const m = String(url || '').match(/\/document\/d\/([\w-]{20,})/); return m ? m[1] : ''; };

// Google Docs HTML → a short list of plain tags. The page cleans it again before showing it.
function cleanBrief(html) {
  let s = String(html).replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '');
  s = s.replace(/<(script|style|head|title|iframe|object|svg|noscript)\b[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<img\b[^>]*>/gi, '');
  s = s.replace(/<span\b[^>]*style="[^"]*font-weight:\s*(?:700|bold)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '<strong>$1</strong>');
  s = s.replace(/<span\b[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '<em>$1</em>');
  const map = { h1: 'h3', h2: 'h3', h3: 'h4', h4: 'h4', h5: 'h4', h6: 'h4', p: 'p', ul: 'ul', ol: 'ol', li: 'li', br: 'br', strong: 'strong', b: 'strong', em: 'em', i: 'em', table: 'table', tbody: 'tbody', thead: 'thead', tr: 'tr', td: 'td', th: 'th', hr: 'hr', a: 'a' };
  s = s.replace(/<(\/?)([a-z0-9]+)\b([^>]*)>/gi, (all, close, tag, attrs) => {
    const t = map[tag.toLowerCase()]; if (!t) return '';
    if (close) return `</${t}>`;
    if (t !== 'a') return `<${t}>`;
    let href = (attrs.match(/href="([^"]*)"/i) || [])[1] || '';
    href = href.replace(/&amp;/g, '&');
    try { const u = new URL(href); if (u.hostname === 'www.google.com' && u.pathname === '/url' && u.searchParams.get('q')) href = u.searchParams.get('q'); } catch { href = ''; }
    return /^https?:\/\//.test(href) ? `<a href="${href.replace(/"/g, '&quot;')}">` : '<a>';
  });
  s = s.replace(/<(strong|em)><\/\1>/g, '').replace(/<\/strong><strong>/g, '').replace(/<\/em><em>/g, '');
  s = s.replace(/<(p|li|h3|h4)>\s*(?:&nbsp;|\s)*<\/\1>/g, '');
  return s.replace(/\n{2,}/g, '\n').trim();
}

(async () => {
  const sheet = await get('reels');
  const briefs = {};
  for (const id of [...new Set(sheet.reels.map(r => docId(r.briefUrl)).filter(Boolean))]) {
    try { const b = await get('brief', `&id=${id}`); briefs[id] = { title: b.title, html: cleanBrief(b.html) }; }
    catch (e) { console.warn(`Skipped a brief (${id}): ${e.message}`); }
  }
  const reels = sheet.reels.map(({ row, ...r }) => r);
  // Keep the old timestamp when nothing changed, so the hourly sync doesn't make empty commits.
  let updated = new Date().toISOString();
  try {
    const prev = vm.createContext({ window: {} }); vm.runInContext(fs.readFileSync(path.join(root, 'reels-data.js'), 'utf8'), prev);
    const old = prev.window.HUB_REELS;
    if (old && JSON.stringify(old.reels) === JSON.stringify(reels) && JSON.stringify(old.briefs) === JSON.stringify(briefs)) updated = old.updated;
  } catch {}
  const data = { updated, reels, briefs };
  const out = `/* Copied from Google by scripts/sync-from-google.cjs. Don't edit by hand: change the Reels – Status Report sheet
   or the brief docs, then run the sync again. */
window.HUB_REELS = ${JSON.stringify(data, null, 1)};
`;
  fs.writeFileSync(path.join(root, 'reels-data.js'), out);
  console.log(`Saved ${data.reels.length} Reels and ${Object.keys(briefs).length} briefs to reels-data.js.`);
})().catch(e => { console.error(e.message); process.exit(1); });
