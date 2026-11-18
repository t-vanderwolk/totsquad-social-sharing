# Tot Squad Social & Sharing

A public, buildless GitHub Pages hub for Tot Squad Baby Specialists: one home for the Squad's ideas, collaborations and content, instead of spreading them across the Instagram chat, a Google Drive and the Hub. No backend, database, upload service or automatic submissions are used.

## Files
- `index.html`: home page: hero, getting-started steps, action cards, Currently casting, a row of schedule/toolkit/links boxes, then full-width bands for Made by the Squad and Meet the Squad. Ideas live only on `ideas.html`.
- `ideas.html`: the full Idea Bank with series filters, idea details and How we work. Links between the two pages keep `?embed=1`.
- `styles.css`: one token-based stylesheet (brand tokens, series tints, components, embed mode, responsive rules).
- `content.js`: all ideas, projects, events, people, deadlines and resources. **Edit this file for content changes.**
- `script.js`: rendering, eligibility, Idea Bank filters, dialogs, separate local drafts, review/copy/download and Disco handoff.
- `scripts/validate-content.cjs`: checks `content.js` for mistakes. Run it after every edit.
- `tests/content.test.cjs`: renderer/eligibility tests with isolated fixtures.
- `.github/workflows/checks.yml`: runs the syntax check, validator and tests on every push and pull request.
- `BRAND-GUIDELINES.md`: website-derived brand and styling rules.

## Page sections
| Section | Driven by |
|---|---|
| Currently casting | `activeCollaborations` with `status: 'casting'` and a deadline that hasn't passed |
| Idea Bank | `ideas`, grouped and filtered by `series` |
| In production | `activeCollaborations` with status `idea`, `filming` or `editing`, plus `ideas` with stage `filming` or `editing` |
| Made by the Squad | `completedCollaborations` |
| Meet the Squad | `leader` (spotlight card on top: `name`, `title`, `aka`, `spotlight`, `instagram`) and `featuredSpecialists` (photo, `region` badge: East/Central/West, short `bio`, Instagram) |
| This week in the Squad | `recurringEvents` |
| On the horizon | collaboration deadlines plus `upcomingDeadlines` |
| How we work | `waysOfWorking` |

## Add an idea
Add an object to `ideas`. Only `id`, `title` and `series` are required. Leave anything you don't know blank; never guess a date or credit.

```js
{
  id: 'unique-idea-id',
  title: 'Idea title',
  series: 'reels',             // must match an id in `series`
  credit: ['First name'],      // who suggested it; [] if unknown
  date: '2026-11-18',          // when it was suggested; '' if unknown
  summary: 'One or two sentences.',
  titleNote: '',               // e.g. 'Working title'
  howItWorks: [],              // numbered steps
  guidance: [],                // "Before you film" rules (privacy, permissions)
  variations: [{ title: '', text: '', credit: [], date: '' }],
  notes: [],                   // "From the conversation"
  altNames: [],                // other names considered
  questions: [],               // question bank, each with a Copy button
  stage: '',                   // idea, filming, editing, published ('' = idea)
  lead: '',                    // one lead per idea
  dueDate: '',
  discussionUrl: ''            // Disco discussion for this idea
}
```

Ideas dated after a visitor's previous visit get a **New** badge (stored in their browser only).

## Add a collaboration
Add an object to `activeCollaborations`:

```js
{
  id: 'unique-project-id',
  ideaId: '',                   // optional: links the project to an idea ("See the format")
  title: 'Approved project title',
  description: 'Approved public description',
  status: 'idea',               // idea, casting, filming, editing, published; null = unverified
  thumbnail: '',                // approved public HTTPS image URL; blank shows a placeholder
  submissionDeadline: '',       // YYYY-MM-DD
  instructions: '',             // what contributors need to film (required for casting)
  discussionUrl: '',            // project-specific Disco discussion
  publishedReelUrl: '',         // verified public Reel URL
  participatingSpecialists: []  // approved public names
}
```

Project IDs must be unique across both lists. Use `casting` only when a project actually accepts participants. Casting with a past deadline is hidden automatically. A blank deadline shows "Deadline not announced." Dates are calendar days in `timeZone` (America/Phoenix), and a deadline stays open through that date.

## Publish a completed Reel
Move the project to `completedCollaborations`, set `status: 'published'` and add its verified `publishedReelUrl`. Both are required before the Published label, Watch the Reel link and Share flow appear. Use the plain Reel link (`https://www.instagram.com/reel/CODE/`) without the `?utm_source=…` tracking part.

For the cover, save a 4:5 image (e.g. 448×560 JPG) in `images/` and set `thumbnail: 'images/your-file.jpg'`. Don't hotlink Instagram image URLs; they expire. The validator flags a missing file. Set `ideaId` to link the card to its Idea Bank format.

## Events, people and resources
- **Recurring events:** `weekday` is 0 (Sunday) to 6 (Saturday); the next date is calculated automatically. Use `weekday: null` with a `scheduleNote` when there's no fixed day. `time` is free text, e.g. `'12 pm MST'`.
- **Featured specialists:** first names only, as approved. Optional `expertise`, `location`, `photo` (https), `spotlight`, `link` and `instagram` (`'handle'`, `'@handle'` or an instagram.com profile link; shown as an @handle link on the squad card). Add a handle only with that specialist's OK. Matching is by name against idea and `waysOfWorking` credits.
- **Deadlines:** for approved public events, add `{ id, title, date: 'YYYY-MM-DD', url: '' }` to `upcomingDeadlines`.
- **Resources:** empty URLs stay labeled unavailable. Never add a confidential Drive folder, tracker or planning doc to this public repo; link through a members-only Disco page instead.
- **Reels tracker & content calendar:** `reelsTrackerUrl` links the Reels – Status Report sheet. `contentCalendar` is a copy of its rows (title, lead, date, status, Reel link) shown in the Content calendar panel; update it when the sheet changes.
- **Submissions:** `submissionFolderUrl` is the Google Drive folder the Submit form and the resources list link to.
- **Disco:** `discoUrl` is the Social & Sharing chat channel; `appUrl` keeps the embedded-app URL; `submissionInstructionsUrl` is the Disco message with upload-folder instructions. Review screens route to the project's or idea's `discussionUrl` when one is set. Nothing is ever submitted automatically.

## Check your edits
```sh
node scripts/validate-content.cjs   # catches bad dates, links, duplicate ids, unknown series
node tests/content.test.cjs
```
GitHub runs both on every push. If the check fails, the error says which entry to fix.

## Drafts and sharing
- **Pitch** uses a concept template (hook, shot list, series, lead) and can start from an Idea Bank idea ("Build on this").
- **Join** shows eligible casting projects.
- **Submit** supports a project or general content, with link, caption (2,200-character counter), credits, accessibility notes and a permission check.
- **Share** builds messages only for verified published projects.

Each flow is two steps: Write, then Review & copy. Drafts save automatically as you type, and the saved-drafts panel shows each draft's title and save time. Submit links to `submissionInstructionsUrl` for upload-folder instructions. The review screen links to the project's or idea's discussion (falling back to the Social & Sharing chat) with a three-step paste-and-send handoff; nothing is submitted automatically. Each workflow has its own localStorage key; older drafts remain accessible. If storage is blocked (e.g. in an iframe), drafts stay in memory for the session and copy/download still work.

## Embed in Disco
Standalone URL: https://t-vanderwolk.github.io/totsquad-social-sharing/

Embed URL: https://t-vanderwolk.github.io/totsquad-social-sharing/?embed=1

```html
<iframe
  src="https://t-vanderwolk.github.io/totsquad-social-sharing/?embed=1"
  title="Tot Squad Social & Sharing"
  width="100%"
  height="2400"
  style="display:block;width:100%;height:2400px;border:0;"
  loading="lazy"
></iframe>
```

Embed mode switches to Disco's white background, hides the header, breadcrumb and footer Disco already shows, and uses the full column width. Links to tot-squad-hub.disco.co open inside Disco (`target="_top"`); other links open a new tab. In Disco's 703px column the home page is about 6,400px tall and the Idea Bank about 5,400px, so set the iframe height to match to avoid an inner scrollbar.

## Preview and verify
Run `python3 -m http.server 4173` from this directory, then open http://127.0.0.1:4173/ and http://127.0.0.1:4173/?embed=1. Check 1440px, 768px and 375px widths, the four flows, Idea Bank filters, idea dialogs, Build on this, save/reload, copy/download, Escape/focus return and a real iframe. Use test-only fixtures locally; never commit fictional campaigns into `content.js`.

## Deploy
GitHub Pages deploys from `main` at `/ (root)`. No build step. Push to `main`, wait for Pages and the Checks workflow, then verify the live page (use `?v=COMMIT` to bypass a cached version).

## Public-data boundary
Everything in this repository and page is public. Idea details and first-name credits are shown by decision of the hub owner. Never add client information, specialist locations or contact details, private mentor information, internal scoring, confidential planning, confidential folder URLs, API keys or credentials. Draft contents stay in the browser until the user copies or downloads them.
