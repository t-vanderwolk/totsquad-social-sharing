# Verification — November 18, 2026

Automated (also run by GitHub Checks on every push):
- `node --check script.js && node --check content.js`
- `node scripts/validate-content.cjs` — content.js looks good (checks dates, links, ids, regions, Instagram handles and that every `images/` file exists).
- `node tests/content.test.cjs` — empty states, Idea Bank + filters + illustrations, squad bios and region badges, leader spotlight, published Reels, escaping, safe URLs, eligibility, drafts, autosave, storage fallback, submission folder, content validation.

Browser (1440, 1280, 1200, 1100, 1000, 960, 900, 768, 600 and 375px; home and `ideas.html`, with and without `?embed=1`):
- Home: casting + six newest ideas beside the sidebar, then full-width bands: 4 Reels in one row, Jen's spotlight + 10 squad cards in even rows, closing call to action. In production stays hidden while empty.
- Idea Bank page: 23 ideas with illustrations and filters, How we work, links back home keep `?embed=1`.
- No Instagram handle is cut off at any width.
- Pitch, Join, Submit and Share dialogs open; idea dialogs open; Escape closes.
- Submit shows the Google Drive submission folder and the Disco instructions.
- No script errors, no broken images, no horizontal overflow at any width.

Not checked here: Disco's own iframe sizing on the saved parent page.
