# Verification — November 16, 2026

- Syntax checks: script.js and content.js passed.
- Renderer tests: empty content, configured casting, escaped text, unsafe URL rejection, expired/invalid dates, missing Reel URL, verified publication, blocked storage read passed.
- Browser layouts: 1440px, 768px and 375px checked; no horizontal document overflow.
- Hero markup compared with previous commit: identical. Existing hero styles retained.
- Pitch: guided form, review, clipboard copy, text-file download, save/reload recovery, clear draft verified.
- Submit: content link, caption, credits, transcript, permission check and review verified; general Disco handoff shown.
- Join: actual empty state verified; temporary local casting fixture generated an interest draft with project-specific discussion link.
- Share: actual unpublished state verified; temporary local published fixture generated a message with project title, credits and verified fixture URL.
- Gallery: three supplied titles and explicit placeholders verified. Local fixture enabled Watch the Reel only with published status plus HTTP(S) URL.
- Keyboard: Escape closed modal and returned focus to the originating card; Shift+Tab stayed inside modal.
- Embed: real 375px iframe with ?embed=1 hid the header, fit the dialog within its viewport and preserved content.
- Storage fallback: sandboxed iframe without same-origin storage access displayed the fallback message and recovered the in-memory draft after closing/reopening. Copy/download remain available.
- No private data or real submissions used. Local fixture pages are ignored and excluded from deployment.

This verifies a local iframe, not a change to Disco's own editor sizing. Set the iframe height in Disco and check the saved parent-page layout. No auto-resize is assumed.
