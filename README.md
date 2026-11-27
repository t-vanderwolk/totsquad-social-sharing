# Tot Squad Social & Sharing

A public, buildless GitHub Pages hub for Tot Squad Baby Specialists: one home for the Squad's ideas, collaborations and content, instead of spreading them across the Instagram chat, a Google Drive and the Hub. No backend, database, upload service or automatic submissions are used.

## Files
- `index.html`: Creators Club home: hero with the newest published Reel covers, the four-step “How a Reel comes together” path, Casting now, This week + Toolkit, Made by the Squad, Meet the Squad and a closing call to action. Ideas live only on `ideas.html`.
- `b-roll.html`: the B-roll library: one folder per specialist, clips by category with Open in Drive and Copy link, most-wanted shots and upload rules. Signed-in creators see the approved clips live from Drive (see "B-roll library sync" below); signed-out visitors see the public preview stills in `brollClips` and can still send clips. `content.js` holds no Drive links for B-roll.
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
  lead: '',                    // the lead; co-leads joined with ' & '
  dueDate: '',
  discussionUrl: '',           // Production discussion: the Creator Circle thread's Disco link
  reelUrl: ''                  // the published Instagram Reel
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
- **Reels page data (`reels-data.js`):** a public copy of the Reels – Status Report sheet (titles, leads, status, dates) for the public pages. It never holds briefs or "Future ideas" rows: signed-in creators read those live from the Creators Club script. Refresh it with `MENTOR_KEY='<coordinator password>' node scripts/sync-from-google.cjs`. Videos stay in Drive.
- **Idea Bank (creators only):** ideas live in the "Creators Club ideas" sheet and load only after sign-in. Signed-in creators edit the ideas credited to them; coordinators edit every idea; every pitch is added there right away marked "Just pitched". Keep `ideas` in `content.js` empty: that file is public (the validator checks).
- **What’s new (creators only):** the landing page’s What’s new list shows the latest pitches, idea edits, finished videos and B-roll and pitch-box ideas. Applications aren’t listed: only coordinators see applicants. It reads the "Creators Club activity" sheet in the Creators Club folder; delete a row there to remove it from the feed.
- **Open casting call (Send your video):** a project with `openCall` in `content.js` gets a guided, no-password Find the toy → Film it → Send it flow on its casting card. The script only accepts videos for titles listed in `OPEN_CASTING` (apps-script/upload.gs), saves them to that project's folder under the sender's name, and never returns a Drive link. To open or close a call, update both.
- **Casting calls creators post:** any creator signed in with their own password (or a coordinator) can post a casting call from Casting now, My ideas or an idea in the Idea Bank. Calls live on the “Casting calls” tab of the Creators Club program sheet (`call-save`, `call-status`, `?action=casting` in apps-script/upload.gs). *Creators Club only* calls are live right away for signed-in creators and take uploads only with a sign-in. *Public* calls are live for the Club right away and appear on the public page (no-password uploads) only after a coordinator approves them in Coordinator tools → Casting calls; a creator’s edit to the wording sends an approved call back for approval. Posting from your own idea moves it from Idea to Casting. Signed-out visitors get approved public calls only, with the poster’s first name; reading never creates a sheet or tab.
- **My ideas:** replaces My drafts. Ideas credited to you or led by you, grouped by stage, your casting calls with their status and response counts, and pitches saved on this device. A summary card sits on the dashboard.
- **Pitch an idea to the Squad:** the landing page's "Got an idea for a Squad Reel?" box (signed-out visitors, no password) adds a row to the "Squad pitches for review" sheet in the Creators Club folder for Sarah and Taylor to review. These don't appear in the Idea Bank until someone adds them (Status: Added to Idea Bank).
- **Apply to the Creators Club:** the landing page's form (no password) adds a row to the "Creators Club applications" sheet. Applicants give an email or Instagram handle so a coordinator can reply; only coordinators can read applications (Coordinator tools > Applications). Set Status to Approved (that adds them to the roster), add them to the Creator Circle in Disco and send them the creator password privately. Applying never grants access by itself.
- **Sign-in and the creator password:** the landing page is open to everyone. Mark member-only parts of `index.html` with `data-mentor` and signed-out-only parts with `data-public`, but remember hiding is not protection: anything private must come from the Creators Club script after sign-in, never from a file in this repo (the repo and site are public). Members sign in with their full name and their own password. The shared creator password (`MENTOR_PASSCODE` in Script properties) only opens "Set up your password" for new or reset members; it can't sign anyone in or read any data, wrong guesses are capped, and coordinators change it in Coordinator tools > Settings. Never put a password, or a hash of one, in this repo.
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

Two levels: **the Squad** (open to every specialist: casting, guides, B-roll, Made by the Squad, no sign-in; the Idea Bank is for signed-in creators) and **the Creators Club** (by application; commitments from the Creators Club guidelines in `content.js` → `clubGuidelines`: at least 1 feed post a month and 1 story a week, plus a brief every other week).

- **Front end:** `club.js` adds the member dashboard (current brief, log a feed post or a story, my commitments, contributions, pause/rejoin requests) and Coordinator tools (Applications, Roster, Briefs, Content, Participation, Analytics, Settings). The expanded Apply form lives in `script.js`.
- **Back end:** `apps-script/club.gs` (add it next to `upload.gs` in the same Apps Script project). Data is in the **Creators Club program** spreadsheet in the shared drive (tabs: Members, Weekly briefs, Submissions, Settings), created on first use. Applications stay in **Creators Club applications**; new columns were appended after Notes. Nothing is ever deleted: statuses change, rows stay.
- **Claiming names (before launch):** each current Squad member signs in once with the creator password, picks their first name from the Squad list, adds their last name and sets a password. That claim is stored on the Accounts tab; their Members row (and posts logged under the first name) switch to the full name, and ideas credited to the first name become theirs to edit. Coordinator tools → Roster shows who has claimed.
- **Guidelines:** a toolkit panel anyone can read; applicants and creators setting up their password agree to them.
- **Sign-in:** one box on the landing page: full name + own password. The shared creator password only sets up a creator's own password (and their bio for Meet the Squad); the coordinator password (the `coordinatorCode` row on the Settings tab of the program sheet, or `COORDINATOR_PASSCODE` in Script properties) signs in a coordinator, who is also a creator and also sees Coordinator tools. The page never holds the coordinator password's value or hash: the script checks it (`coord-login`) and again on every coordinator action.
- **Statuses:** applications Submitted / Under Review / Approved / Waitlisted / Declined; members Active / Paused / Needs Check-In / Inactive / Alumni; briefs Draft / Published / Archived; submissions Submitted / Counted / Needs changes.
- **Participation:** a month is met with `requiredPosts` feed posts (reel, carousel or collab) and a week (Monday–Sunday) with `requiredStories` stories. Only whole weeks/months after joining count. Reminder/check-in thresholds are on the Settings tab. Older `themed`/`flexible` submissions read as feed posts. Standing (On track / Reminder / Needs review) is a suggestion; only coordinators change a member's status.
- **Tests:** `node tests/apps-script.test.cjs` runs the backend workflows against in-memory sheets.

## Idea Bank: writers' room and production room

The Idea Bank is the writers' room; the private Creator Circle in Disco is the production room. Opening an idea shows:

- **💡 Original concept**: the creator's summary, credit and date. Only the credited creator or a coordinator can change it.
- **🎬 Production**: who had the idea, the lead, the stage (Idea, Casting, Filming, Editing, Published), and only the links that work: the
  creative discussion, the Creator Circle thread, the linked casting call and the published Reel. At the Idea stage with no thread it says
  "Still in the writers' room!".
- **✍️ Working concept**: the evolving hook, steps, filming rules and notes. The credited creator, the lead(s) and coordinators edit it.
- **💬 Creative discussion**: threaded comments. Members post, reply, reply to replies, edit and delete their own, and
  show or hide reply groups. Threads are newest first, 20 at a time ("Show earlier conversations"). Deep threads stop indenting
  (after three levels, two on phones) and show "↳ Name" instead. Unsent text survives errors and re-renders.

**Backend** (`apps-script/upload.gs`, POST, signed-in creators and coordinators only):
`discussion-list` { ideaId, cursor }, `discussion-add` { ideaId, parentId, body, requestId }, `discussion-edit` { id, body, expect },
`discussion-delete` { id }, and `idea-lead` { id }. Comments are rows in the private **Creators Club discussions** sheet
(created next to the other Creators Club sheets on the first comment). The author always comes from the sign-in.
Replies must point at a comment on the same idea. Deleting is a soft delete, so replies stay. Coordinators can remove any comment.
A repeated `requestId` never posts twice. `GET ?action=ideas` also returns `counts` (live comments per idea).

**Earlier build-ons** (`buildOns` on an idea) are never deleted. They show as top-level comments with stable IDs (`bo-…`) and can be
replied to. The first comment copies them into the discussions sheet. Running it again (`runMigrateBuildOns()` in the editor, or
Coordinator tools `admin-discussion-migrate`) adds nothing. Older pages' `idea-build` now posts a comment, and commenting never makes anyone the lead.
Leading is its own button ("Lead this idea" / "Co-lead this idea").

**Production threads** are made by hand. Disco has no thread API here, and nothing syncs.
1. Name the thread `🎬 PRODUCTION | <Reel title>` in the Creator Circle. The idea's **Set up the production thread** copies the name and a
   starter message that links back to the idea (`ideas.html#idea=<id>`) and its casting call (`index.html#call=<id>`).
2. In Disco, open the message's ⋮ menu, choose **Copy link** (`…/channel/<id>?streamMsgId=…`), and paste it into **Production discussion link**
   with Edit idea. Only Tot Squad Disco links are accepted, and the script checks again. A channel link without a message opens the Creator Circle
   and names the thread to look for.
3. The link is kept through every stage change, including when a casting call moves the idea to Casting.

Deep links open the site itself, not the Disco page around it. In Disco the embed always opens its own start page, so links in
threads go to the standalone site, where members sign in once on that browser.

Open casting calls are for every Tot Squad specialist, so their filming directions must stay complete on the casting call itself.
Private thread content is never copied to the public page. Videos still go through the casting call's upload.

## B-roll library sync

The B-roll page lists approved clips straight from Google Drive, so nothing in this repo changes when a clip is approved.

- **Endpoint:** `GET ?action=broll-library&key=…` in `apps-script/upload.gs`. Signed-in creators (their own password) and coordinators only; anything else gets `locked`. The request takes no folder ID.
- **What it reads:** every folder directly inside the **B-Roll Library** folder in the Creators Club shared drive (`ROOTS.broll`, resolved with `moved()`), one per specialist, plus any folder a coordinator adds with `addBrollFolder('FOLDER_ID', 'Name')` in the Apps Script editor (for approved footage kept elsewhere; `removeBrollFolder` takes it off). Video files only, with paging. **B-roll to review** is never read: it sits at the shared drive's top level, and any folder named like it is skipped.
- **Approving a clip:** in Drive, move the file from `B-roll to review / <Name>` into `B-Roll Library / <Name>` (make the specialist's folder there if it's their first approved clip). It shows on the page within 3 minutes, or right away with **Refresh from Drive** on the B-roll page (coordinators).
- **Titles and categories:** the file name, tidied (`B-roll - Halo.mov` → `Halo`). Category comes from a `#category` tag in the file's Drive description, then the `category_what.mov` naming rule, then a few clear words in the name; anything unclear is **Other footage**.
- **Thumbnails:** Drive's own short-lived thumbnails, sent only to signed-in creators. If one doesn't load (no access, or expired), the card shows its category illustration.
- **Access:** listing a clip doesn't share it. Clips open in Drive only for Google accounts the shared drive already allows; the page tells creators to contact Sarah or Taylor if Drive asks them to request access. Sharing settings are never changed by the site.
- **Check after deploying:** run `checkBrollLibrary` in the Apps Script editor (read-only); the log lists each folder, its clip count and categories.



## Casting call videos

Signed-in creators see, under each casting call on their dashboard, how many videos have been sent in, and can watch them
(`apps-script/upload.gs`: `GET ?action=cast-videos&key=…`, creators and coordinators only).

- It reads only the shared drive's top-level folders named after a casting call (the two open calls plus every call on the
  Casting calls tab), then one folder per sender inside each. "B-roll to review", the B-Roll Library and anything else is never read.
- Each call folder is shared "anyone with the link can view" the first time it's listed (Taylor's decision, Nov 27, 2026), so
  every creator can play the videos in Drive. The site only hands those links to signed-in creators. The send form tells
  senders that Creators Club members can watch what they send.
- The list is cached for 3 minutes. A finished upload clears it, and coordinators have "Refresh from Drive" in the videos dialog.
- To check after deploying, run `checkCastVideos()` in the Apps Script editor. It logs each call, its video count and
  whether its folder is link-viewable.