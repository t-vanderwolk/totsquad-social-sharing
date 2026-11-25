#!/usr/bin/env node
/*
 * Points the site's Google Drive links at the copies in Creators Club (For Baby Specialists).
 * The Creators Club script keeps the list of original -> copy IDs; this swaps them in content.js and reels-data.js.
 *
 *   MENTOR_KEY='<coordinator password>' node scripts/relink-drive.cjs
 *
 * Never write a password into this repo: it's public.
 *
 * Safe to run more than once: IDs that were already swapped are left alone.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const key = process.env.MENTOR_KEY || process.argv[2] || '';
const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), ctx);
const endpoint = ctx.window.HUB_CONTENT.uploadEndpoint;
if (!endpoint || !key) { console.error("Run it as: MENTOR_KEY='<coordinator password>' node scripts/relink-drive.cjs"); process.exit(1); }

(async () => {
  const res = await fetch(`${endpoint}?action=drivemap&key=${encodeURIComponent(key)}`);
  const data = await res.json();
  if (data.locked) throw new Error('The coordinator password was refused.');
  if (!data.ok || !data.map || !Object.keys(data.map).length) throw new Error('The script didn’t return the list of copies.');
  const pairs = Object.entries(data.map).filter(([from, to]) => from && to && from !== to);
  let total = 0;
  for (const file of ['content.js', 'reels-data.js']) {
    const p = path.join(root, file); if (!fs.existsSync(p)) continue;
    let text = fs.readFileSync(p, 'utf8'), count = 0;
    for (const [from, to] of pairs) { const parts = text.split(from); if (parts.length > 1) { count += parts.length - 1; text = parts.join(to); } }
    if (count) fs.writeFileSync(p, text);
    console.log(`${file}: ${count} link${count === 1 ? '' : 's'} updated`);
    total += count;
  }
  console.log(total ? 'Done. Now run the sync, then push.' : 'Nothing to change; the links already point at the copies.');
})().catch(e => { console.error(e.message); process.exit(1); });
