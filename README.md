# Tot Squad Social & Sharing

A public, buildless GitHub Pages dashboard for Tot Squad Baby Specialists. The existing branded hero and responsive visual system are preserved. No backend, database, upload service or automatic submissions are used.

## Files
- `index.html`: semantic page structure and unchanged hero.
- `styles.css`: existing Tot Squad visual system plus responsive components and embed mode.
- `content.js`: all project, deadline and resource configuration.
- `script.js`: rendering, project eligibility, dialogs, separate local drafts, review/copy/download and Disco handoff.
- `BRAND-GUIDELINES.md`: website-derived brand and styling rules.
- `tests/content.test.cjs`: isolated renderer/eligibility checks; no real campaigns are invented by the tests.

## Add a collaboration
Edit only `content.js`. Add an object to `activeCollaborations` with this shape:

```js
{
  id: 'unique-project-id',
  title: 'Approved project title',
  description: 'Approved public description',
  status: 'idea', // idea, casting, filming, editing, published; null = unverified
  thumbnail: '', // approved public HTTPS image URL; blank shows a labeled placeholder
  submissionDeadline: '', // YYYY-MM-DD, e.g. a real approved deadline
  instructions: '', // what contributors need to film
  discussionUrl: '', // approved project-specific Disco discussion
  publishedReelUrl: '', // verified public Reel URL
  participatingSpecialists: [] // approved public names, or {name: 'Public name'}
}
```

IDs must be unique across both lists. Use `casting` only when a project actually accepts participants. Casting with a past deadline is excluded automatically. A blank deadline is shown as “Deadline not announced.” Dates are interpreted as calendar days in `timeZone` (America/Phoenix by default). A deadline stays open through that date.

## Publish a completed Reel
Move the project to `completedCollaborations`, set `status: 'published'`, and add its verified `publishedReelUrl`. Both are required before the Published label, Watch the Reel link and share-message flow appear. Add the real thumbnail, description and approved contributor names separately. The initial Meet the Squad, Pass the Toy and Tot Squad Round Up records contain only known titles; placement in this list does not verify completion. Their status remains null until confirmed.

## Deadlines
Collaboration submission deadlines appear automatically. For other approved public events, add `{ id, title, date: 'YYYY-MM-DD', url: '' }` to `upcomingDeadlines`. Invalid and past dates are omitted. Use the same ID/date as a collaboration to avoid duplicate entries. Do not invent dates.

## Configure Disco and resources
`discoUrl` points to the Social & Sharing chat channel for draft handoffs. `appUrl` retains the supplied embedded-app URL separately. Each gallery card links to its verified project discussion. Set each collaboration's `discussionUrl` to its actual project discussion so the Join and Submit review screens route appropriately. Without one, the interface offers the general channel when configured; it never claims this submits the draft.

Edit `resources` for sidebar links. Empty URLs remain labeled unavailable. A local resource can use `action: 'guide'` or `action: 'brand'`. Only http/https external URLs are accepted. The submission-folder resource opens the authenticated Disco message containing the folder instructions. Social templates and the specialist resource library are connected. The content calendar remains unconfigured. Do not add a confidential folder URL or private planning document to this public repository. Use a member-authenticated Disco page to route users to restricted resources instead. `featuredSpecialists` is reserved for optional future presentation and is not currently displayed.

## Drafts and sharing
Pitch retains the guided form. Join shows eligible casting projects. Submit supports a project or general content, with content URL, caption, credits, accessibility notes and reviewer notes. Share generates messages only for verified published projects.

Users review, copy/download and manually paste into Disco. No personal data is sent by these forms. Each workflow uses its own localStorage key; older saved drafts remain accessible. If storage is blocked (including iframe restrictions), the current page retains the draft in memory and offers copy/download. This does not persist after reload. Clipboard restrictions fall back to selecting the text for manual copying. Clear draft removes only that workflow's stored draft.

## Embed in Disco
Standalone URL: https://t-vanderwolk.github.io/totsquad-social-sharing/

Embed URL: https://t-vanderwolk.github.io/totsquad-social-sharing/?embed=1

```html
<iframe
  src="https://t-vanderwolk.github.io/totsquad-social-sharing/?embed=1"
  title="Tot Squad Social & Sharing"
  width="100%"
  height="1800"
  style="display:block;width:100%;height:1800px;border:0;"
  loading="lazy"
></iframe>
```

Embed mode hides the redundant site header and reduces outer padding. Begin with 1800px height on desktop; narrow/mobile single-column galleries may need 2600–3200px or normal internal scrolling. Do not disable scrolling. The parent Disco editor may override dimensions; adjust its resize handle and save. The iframe does not automatically resize. Dialogs scroll inside the iframe viewport, support Escape, trap keyboard focus with native `<dialog>`, and return focus to their trigger. Outbound links open a new tab.

## Preview and verify
Run `python3 -m http.server 4173` from this directory, then open http://127.0.0.1:4173/ and http://127.0.0.1:4173/?embed=1.

Run `node --check script.js` and `node tests/content.test.cjs`. Check 1440px desktop, 768px tablet and 375px mobile. Verify the four cards, native required-field validation, save/reload, copy/download, empty states, configured project links, Escape/focus return and a real iframe. Use test-only fixtures locally; never commit fictional active campaigns into `content.js`.

## Deploy
GitHub Pages already deploys from `main` at `/ (root)`. No build step or deployment setting change is needed. Commit the HTML, CSS, JS and documentation together, push to `main`, and wait for the Pages workflow to succeed. Verify the live page; if an older version is cached, use a one-time `?v=COMMIT` parameter (or `?embed=1&v=COMMIT`). The normal embed URL remains valid.

## Public-data boundary
Everything in this repository and page is publicly accessible. Never add client information, private mentor information, internal scoring, confidential planning, confidential submission-folder URLs, API keys or credentials. Public branding assets/fonts load from Tot Squad's official asset hosts. Submitted draft contents stay in the browser until the user explicitly copies/downloads them and chooses where to share.
