# Tot Squad Social & Sharing

A public, buildless GitHub Pages hub for Tot Squad Baby Specialists: one home for the Squad's ideas, collaborations and content, instead of spreading them across the Instagram chat, a Google Drive and the Hub. No backend, database, upload service or automatic submissions are used.

## Files
- `index.html`: Creators Club home: hero with the newest published Reel covers, the four-step “How a Reel comes together” path, Casting now, This week + Toolkit, Made by the Squad, Meet the Squad and a closing call to action. Ideas live only on `ideas.html`.
- `b-roll.html`: the B-roll library: clips by category with Open in Drive and Copy link, most-wanted shots and upload rules. Configure `brollFolderUrl`, `brollClips` and `brollWanted` in `content.js`.
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
- **Toolkit:** tiles that all open inside the Creators Club (Brand & voice, Starter guide, Before you share, Upload clips, B-roll library, My drafts, plus `resources` in `content.js`). Add pages in this site only (`page`) with a short `desc` and an `icon`; outside links don't belong in the Toolkit.
- **Reels tracker & content calendar:** `reelsTrackerUrl` links the Reels – Status Report sheet. `contentCalendar` is a copy of its rows (title, lead, date, status, Reel link) shown in the Content calendar panel; update it when the sheet changes.
- **Drive home:** everything lives in **Creators Club (For Baby Specialists)** (copied from Tot Squad Social Media on Nov 21, 2026). The Creators Club script swaps any original Drive ID for its copy (`moved()`), and `MENTOR_KEY=… node scripts/relink-drive.cjs` does the same for the site's links.
- **Reels page data (`reels-data.js`):** the Reels page and its briefs read this file, not Google. Refresh it with `MENTOR_KEY=<mentor password> node scripts/sync-from-google.cjs`, or add the `MENTOR_KEY` repository secret and `.github/workflows/sync.yml` refreshes it every hour. Videos stay in Drive; uploads and pitches still go to the Creators Club script.
- **Idea Bank:** ideas live in the "Creators Club ideas" sheet in the Creators Club folder. Signed-in creators edit them in the app (Open idea → Edit idea), and every pitch is added there right away marked "Just pitched" (it also still goes to the pitches sheet). Edits made directly in the sheet's visible columns show up too. `ideas` in `content.js` is only the fallback.
- **What’s new (creators only):** the landing page’s What’s new list shows the latest pitches, idea edits, finished videos and B-roll, pitch-box ideas and applications (no names). It reads the "Creators Club activity" sheet in the Creators Club folder; delete a row there to remove it from the feed.
- **Open casting call (Send your video):** a project with `openCall` in `content.js` gets a guided, no-password Find the toy → Film it → Send it flow on its casting card. The script only accepts videos for titles listed in `OPEN_CASTING` (apps-script/upload.gs), saves them to that project's folder under the sender's name, and never returns a Drive link. To open or close a call, update both.
- **Pitch an idea to the Squad:** the landing page's "Got an idea for a Squad Reel?" box (signed-out visitors, no password) adds a row to the "Squad pitches for review" sheet in the Creators Club folder for Sarah and Taylor to review. These don't appear in the Idea Bank until someone adds them (Status: Added to Idea Bank).
- **Apply to join:** the landing page's "Apply to join" form (no password) adds a row to the "Creators Club applications" sheet in the Tot Squad Social Media folder. Set Status to Approved, then add the person to Disco's Creators group and send them the creator password.
- **Creator password** (called the mentor password in the code): the landing page is open to everyone (hero Reels, Casting now, Made by the Squad, Meet the Squad). Mark mentor-only parts of `index.html` with `data-mentor` and signed-out-only parts with `data-public`; signed-out clicks on actions ask for the password. The Idea Bank, B-roll and Reels pages stay behind the password screen. `mentorPasswordHash` in `content.js` is the SHA-256 of the lowercase password (`printf '%s' newpassword | shasum -a 256`). Change `MENTOR_PASSCODE` in the script to match; it's the only password (uploads no longer use a separate Squad passcode). The screen keeps casual visitors out; it is not security, because the repo and `reels-data.js` are public.
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

Embed mode switches to Disco's white background, hides the header, breadcrumb and footer Disco already shows, and uses the full column width. Links to tot-squad-hub.disco.co open inside Disco (`target="_top"`); other links open a new tab. The page lives in Disco as the Creators Club Custom Page (sidebar stays open). In its 723px column the home page is about 4,300px tall and the Idea Bank about 5,300px; set the embed height to fit the home page.

## Preview and verify
Run `python3 -m http.server 4173` from this directory, then open http://127.0.0.1:4173/ and http://127.0.0.1:4173/?embed=1. Check 1440px, 768px and 375px widths, the four flows, Idea Bank filters, idea dialogs, Build on this, save/reload, copy/download, Escape/focus return and a real iframe. Use test-only fixtures locally; never commit fictional campaigns into `content.js`.

## Deploy
GitHub Pages deploys from `main` at `/ (root)`. No build step. Push to `main`, wait for Pages and the Checks workflow, then verify the live page (use `?v=COMMIT` to bypass a cached version).

## Public-data boundary
Everything in this repository and page is public. Idea details and first-name credits are shown by decision of the hub owner. Never add client information, specialist locations or contact details, private mentor information, internal scoring, confidential planning, confidential folder URLs, API keys or credentials. Draft contents stay in the browser until the user copies or downloads them.

## Creators Club 2.0 (Nov 2026)

Two levels: **the Squad** (open to every specialist: casting, guides, B-roll, Made by the Squad, no sign-in; the Idea Bank is for signed-in creators) and **the Creators Club** (by application, weekly brief and commitment).

- **Front end:** `club.js` adds the member dashboard (this week's brief, submit a published link, my week, contributions, pause/rejoin requests) and Coordinator tools (Applications, Roster, Weekly briefs, Content, Participation, Analytics, Settings). The expanded Apply form lives in `script.js`.
- **Back end:** `apps-script/club.gs` (add it next to `upload.gs` in the same Apps Script project). Data is in the **Creators Club program** spreadsheet in the shared drive (tabs: Members, Weekly briefs, Submissions, Settings), created on first use. Applications stay in **Creators Club applications**; new columns were appended after Notes. Nothing is ever deleted: statuses change, rows stay.
- **Sign-in:** one box on the landing page. The creator password signs in a creator; the coordinator password (the `coordinatorCode` row on the Settings tab of the program sheet, or `COORDINATOR_PASSCODE` in Script properties) signs in a coordinator, who is also a creator and also sees Coordinator tools. The page never holds the coordinator password's value or hash: the script checks it (`coord-login`) and again on every coordinator action.
- **Statuses:** applications Submitted / Under Review / Approved / Waitlisted / Declined; members Active / Paused / Needs Check-In / Inactive / Alumni; briefs Draft / Published / Archived; submissions Submitted / Counted / Needs changes.
- **Participation:** a week is met when themed posts reach the required number. Standing (On track / Reminder / Needs review) is a suggestion; only coordinators change a member's status.
- **Tests:** `node tests/apps-script.test.cjs` runs the backend workflows against in-memory sheets.
