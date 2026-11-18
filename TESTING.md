# Verification — November 18, 2026

Automated (also run by GitHub Checks on every push):
- `node --check script.js && node --check content.js`
- `node scripts/validate-content.cjs` — content.js looks good.
- `node tests/content.test.cjs` — empty states, Idea Bank + filters, squad credits, weekly events, production board, escaping, safe URLs, eligibility, drafts, storage fallback, content validation, upload guidance, connected resources, autosave, draft recovery, blocked-storage autosave.

Browser (1440px desktop, 375px embed):
- 26 ideas and 10 squad cards render; no script errors.
- Submit shows the Disco upload-folder instructions, project context and discussion link.
- Typing autosaves; reload recovers the draft; the drafts panel shows its title and save time; Clear stays cleared after closing.
- Review shows the Disco handoff link (Social & Sharing chat fallback) and three paste-and-send steps.
- No horizontal overflow at 375px with `?embed=1`.

Not checked here: Disco's own iframe sizing on the saved parent page.
