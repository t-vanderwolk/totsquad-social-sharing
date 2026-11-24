/* Public content only. See README.md before adding links, credits or dates.
   Run `node scripts/validate-content.cjs` after editing. */
window.HUB_CONTENT = {
  // A date-only deadline expires at the end of that day in this timezone.
  timeZone: 'America/Phoenix',
  appUrl: 'https://tot-squad-hub.disco.co/page-app/UHJvZHVjdEFwcDozODQzNTg=?u=8d8e2732-9268-481e-9d53-1363df5e83ca&drawerTab=analytics',
  discoUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx',
  // The Squad's open Instagram group chat (invite link). Shown on the landing page and the member dashboard.
  squadChatUrl: 'https://ig.me/j/hTZzg7b07ZRFT3eU/',
  // Private Creator Circle channel in Disco (coordinators can override it in Coordinator tools > Settings).
  creatorCircleUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjM0ODYw',
  submissionFolderUrl: 'https://drive.google.com/drive/folders/0ADqEscN50JTEUk9PVA',
  // Mentor password screen: SHA-256 of the lowercase password (see README). Leave blank to turn the screen off.
  // Keep it in step with MENTOR_PASSCODE in the Creators Club script, which pitches still check.
  mentorPasswordHash: 'e9bb17bbee033d2cee200d8e50793aa350a04a68367bda9a334fedaa4f7cc0a1',
  // Upload form (apps-script/upload.gs). Leave blank to send people to the Drive folders instead.
  uploadEndpoint: 'https://script.google.com/macros/s/AKfycbyJrEWbDp0vWGU__88IlgRf7HXfGXYt6Em1lWOcjFgQhOVY5NGBjjYriE12qVsmXbxMBw/exec',
  submissionInstructionsUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=44d569be-13ea-47f5-b927-749d09323ad0-HDjH-thn3qn3ddof_GUCA',

  // Idea Bank groups. color: plum, teal, peach or linen.
  series: [
    { id: 'game-shows', label: 'Game Shows & Series', color: 'peach' },
    { id: 'reels', label: 'Content & Reels', color: 'teal' },
    { id: 'registry', label: 'Registry & Client Experience', color: 'plum' },
    { id: 'hub', label: 'Hub Improvements', color: 'linen' }
  ],

  /* Idea Bank. Source: Squad chat, Sep 2 – Nov 17, 2026. Leave date/credit blank when unknown.
     Fields: id, title, series, credit [names], date, summary, titleNote, howItWorks [],
     guidance [], variations [{title, text, credit, date}], notes [], altNames [], questions [],
     stage (idea|filming|editing|published), lead, dueDate, discussionUrl,
     image (optional photo in images/; otherwise the series illustration shows). Published ideas move to completedCollaborations. */
  // Ideas now live in the "Creators Club ideas" sheet (Creators Club folder) and are edited in the app.
  // This list is only the fallback if the sheet can't be reached.
  // Expanded concepts for the Idea Bank. They fill in an idea's concept, steps and filming tips until someone edits
  // that idea in the app. Creators' build-on notes are kept separately, so the original concept is never overwritten.
  ideaConcepts: {
    'baby-gear-game-shows': { concept: 'A recurring series that turns big baby-gear decisions into quick, playful game-show episodes. Each format puts real products in the spotlight, so families learn what matters while laughing along. One decision and one clear takeaway per episode.',
      howItWorks: ['Pick a format: Fund or No Fund, The Stroller Dating Game, Say Yes to the Stroller or a new one.', 'Choose one gear decision families struggle with.', 'Film a 30–60 second episode in store or on a call, ending with the specialist’s pick.', 'Post under one series name so episodes are easy to binge.'] },
    'fund-or-no-fund': { concept: 'A Deal or No Deal–style game. A contestant faces a lineup of covered gear while Jen, as the MotherFunder, calls in with offers. Every reveal teaches why an item is worth funding or not.',
      howItWorks: ['Line up 4–6 covered items.', 'The contestant opens them one at a time while a specialist explains what each one does.', 'Jen calls in as the MotherFunder: fund this item, or keep playing?', 'End with the final pick and why it’s worth it.'],
      guidance: ['Use display or demo items, and keep other shoppers out of the shot.'] },
    'stroller-dating-game': { concept: 'Three strollers are the contestants and a parent-to-be asks the questions. Each stroller “answers” in character through a specialist voice-over or on-screen text, and the parent picks a match for their lifestyle.',
      howItWorks: ['Pick three strollers with different strengths: travel, jogging and everyday.', 'Write three questions parents really ask, like fold, storage and weight.', 'Each stroller answers in character.', 'Reveal the match and why it fits.'] },
    'say-yes-to-the-stroller': { concept: 'A Say Yes to the Dress–style show. A family arrives with a wish list, the specialist pulls options, and the big moment is finding the one. The fun is in the reactions; the value is in the why.',
      howItWorks: ['Open with the family’s must-haves in one line.', 'Show 2–3 options with one quick test each: fold, push, fit in the trunk.', 'Capture the “yes” moment.', 'Close with the specialist’s reason it fits.'],
      guidance: ['Get permission from anyone on camera, and keep babies’ faces out of the shot.'] },
    'like-box-buzzers': { concept: 'Target’s “like” boxes become game-show buzzers. Specialists race to buzz in and answer baby-gear questions, giving the game-show series an easy in-store prop.',
      howItWorks: ['Set up two specialists, each with a box.', 'Ask quick-fire gear questions.', 'First to buzz answers; a wrong answer passes the turn.', 'Keep score on screen and crown a winner.'] },
    'registry-court': { concept: 'Registry choices go on trial. A specialist plays the judge, the item is the defendant, and the evidence is what families actually use. The verdict: keep it on the registry, or case dismissed.',
      howItWorks: ['Pick one item families debate.', 'Make the case for it, then the case against.', 'The judge delivers a verdict in one line.', 'Invite followers to appeal in the comments.'] },
    'love-is-blind-stroller': { concept: 'A Love Is Blind–style format: the parent hears about strollers before seeing them and chooses on features alone. Then the reveal shows whether the look and the specs still match.',
      howItWorks: ['Describe 2–3 strollers by features only, with the product hidden.', 'The parent picks one based on what matters to them.', 'Reveal the stroller.', 'Talk through whether the choice holds up in person.'] },
    'explains-it-all': { concept: 'A Clarissa Explains It All–style showcase. One specialist talks straight to camera about a single topic with a playful 90s feel. Short, punchy explainers families will want to save.',
      howItWorks: ['Pick one question families ask a lot.', 'Explain it straight to camera in under 60 seconds.', 'Add one prop or on-screen list to make it stick.', 'End with a quick tip or a “save this” prompt.'] },
    'anonymous-questions': { example: 'tot-squad-round-up', concept: 'Followers send questions anonymously and the Squad answers them on camera. It makes it easier for families to ask what they really want to know, and it gives the game-show formats a steady supply of questions.',
      howItWorks: ['Collect questions through an anonymous question box.', 'Pick the best few each week.', 'A specialist reads and answers each one in under 30 seconds.', 'Tag the specialist so families can book with them.'],
      guidance: ['Remove names or details that could identify the person who asked.'] },
    'stroll-with-us': { example: 'tot-squad-round-up', concept: 'A walk-and-talk series. A specialist pushes a stroller down the aisle or around the neighborhood and shares what they love about it, and what they don’t. It feels like strolling with a friend who knows gear.',
      howItWorks: ['Pick one stroller and one route.', 'Film vertical while walking, with the stroller in frame.', 'Share three real-life observations as you go.', 'Tag it #StrollWithUs so the series is easy to find.'] },
    'on-duty-off-duty': { example: 'day-in-the-life', concept: 'A carousel pairing each specialist’s on-duty look, in store and ready to help, with a glimpse of their off-duty life. It shows families the real people behind the expertise.',
      howItWorks: ['Each specialist sends two photos: one on duty, one off duty.', 'Add one line about what they love on and off the clock.', 'Build a carousel with one specialist per slide.', 'Tag everyone so families can find them.'] },
    'controversial-items-poll': { concept: 'The baby items people argue about most go to a vote, then specialists weigh in on the results. It sparks comments and helps families decide who an item is really for.',
      howItWorks: ['Choose 3–5 items families disagree on.', 'Run a poll in Stories.', 'Share the results in a Reel or carousel.', 'Add a specialist take on each: who it’s for, and who can skip it.'] },
    'trick-or-treat': { concept: 'A Halloween Reel with a gear twist: tricks are common myths or mistakes, and treats are favorite hacks and must-haves. Playful, seasonal and easy to film in costume.',
      howItWorks: ['List 2–3 tricks and 2–3 treats.', 'Film each as a quick cut, alternating trick and treat.', 'Add costumes or seasonal props if you like.', 'Post in October to ride the season.'] },
    'gotta-have': { example: 'tot-squad-round-up-favorites', concept: 'Baby gear sorted into three friendly tiers: Gotta Have, Nice to Have and Could Survive Without. It helps families prioritize without judgment and invites friendly debate in the comments.' },
    'twas-the-night-before': { concept: 'A cozy holiday montage narrated as a rhyme in the style of ’Twas the Night Before Christmas, about the night before Welcome Hours: specialists getting ready, families on their way, and the gear that makes it magic.',
      howItWorks: ['Write a short rhyming script about the night before Welcome Hours.', 'Each specialist films one line or one moment.', 'Cut it together as a montage.', 'Post in December.'] },
    'registry-not-roast': { concept: 'A kind take on registry reviews. Real registries are screen-shared on a group call and specialists sort each item into KEEP, SWAP or SKIP. Helpful and honest, never mean.' },
    'virtual-to-in-store': { concept: 'The full journey in one Reel: a family starts with a virtual appointment, then a specialist hands them off to an in-store visit to test what they shortlisted. It shows how virtual and in-store help work together.',
      howItWorks: ['Film a short moment from the virtual call.', 'Show the shortlist the family leaves with.', 'Film the in-store follow-up as they test those items.', 'End with the family’s final pick.'],
      guidance: ['Get the family’s permission, and keep babies’ faces, names and order details out.'] },
    'two-specialist-welcome-hours': { concept: 'Welcome Hours co-hosted by two specialists, each bringing their own strengths. Families get two perspectives, and specialists get to collaborate and cross-promote.',
      howItWorks: ['Pair specialists with different strengths.', 'Split the session into topics each one leads.', 'Take questions together.', 'Share a joint recap afterward.'] },
    'event-style-welcome-hours': { concept: 'Welcome Hours run as an event, with a theme, a simple schedule and something to look forward to, like a demo station or a live Q&A.',
      howItWorks: ['Pick a theme and a date.', 'Plan 2–3 segments, like a demo, a Q&A and a specialist spotlight.', 'Promote it a week ahead in the Hub and on social.', 'Capture clips during the event for a recap Reel.'] },
    'tipping-option': { concept: 'An easy way for families to say thank you: an optional tip in the survey they receive after an appointment.',
      howItWorks: ['Add an optional tip question to the post-appointment survey.', 'Keep it clearly optional, with a few preset amounts.', 'Send tips to the specialist who led the appointment.'] },
    'social-sharing-channel': { concept: 'One home for the Squad’s content work, which used to be spread across the Instagram chat, a Google Drive and the Hub. The Creators Club is the first version.',
      howItWorks: ['Pitch and browse ideas in the Idea Bank.', 'Join casting calls and upload clips in one place.', 'Track every Reel from casting to posted.'] },
    'specialist-finder': { concept: 'A way to find specialists by city or store, right in the Hub, so families and fellow specialists can connect with someone nearby.',
      howItWorks: ['Each specialist adds their city and store.', 'Search or filter by location.', 'Open a profile and message them directly.'] },
    'faster-notifications': { concept: 'Make sure Hub posts get noticed the day they go up, so time-sensitive asks like casting calls and deadlines aren’t missed.',
      howItWorks: ['Agree on which posts are time-sensitive.', 'Use push notifications or an @mention for those.', 'Post a short weekly recap of what’s new.'] }
  },
  ideas: [
    // Game Shows & Series — mostly from the Sep 2 founding brainstorm
    { id: 'baby-gear-game-shows', title: 'Baby Gear Game Shows', series: 'game-shows', credit: ['Taylor'], date: '2026-09-02',
      summary: 'The umbrella for the Squad’s game-show formats, including Fund or No Fund, The Stroller Dating Game and Say Yes to the Stroller.' },
    { id: 'fund-or-no-fund', title: 'Fund or No Fund', series: 'game-shows', credit: ['Taylor'], date: '2026-09-02',
      summary: 'A Deal or No Deal–style game, with Jen as the MotherFunder (the banker).' },
    { id: 'stroller-dating-game', title: 'The Stroller Dating Game', series: 'game-shows', credit: ['Taylor'], date: '2026-09-02',
      summary: 'A dating-game format with strollers as the contestants.' },
    { id: 'say-yes-to-the-stroller', title: 'Say Yes to the Stroller', series: 'game-shows', credit: ['Taylor'], date: '2026-09-02',
      summary: 'A Say Yes to the Dress–style show about finding the right stroller.' },
    { id: 'like-box-buzzers', title: 'Target “like”-box buzzers', series: 'game-shows', credit: ['Sarah'], date: '2026-09-02',
      summary: 'Use Target “like” boxes as game-show buzzers.' },
    { id: 'registry-court', title: 'Registry Court', series: 'game-shows', credit: ['Aly'], date: '',
      summary: 'Registry choices put on trial.', notes: ['This grew into Registry NOT Roast.'] },
    { id: 'love-is-blind-stroller', title: 'Love Is Blind: Stroller Edition', series: 'game-shows', credit: ['Kristin'], date: '',
      summary: 'A Love Is Blind–style format for choosing a stroller.' },
    { id: 'explains-it-all', title: 'Clarissa Explains It All showcase', series: 'game-shows', credit: [], date: '',
      summary: 'A Clarissa Explains It All–style showcase.' },
    { id: 'anonymous-questions', title: 'Anonymous follower questions', series: 'game-shows', credit: [], date: '2026-09-02',
      summary: 'Use anonymous questions from followers as the question source.',
      notes: ['Revived on Nov 16 as the question source for Pop-Ins.'] },

    // Content & Reels
    { id: 'stroll-with-us', title: '#StrollWithUs', series: 'reels', credit: ['Kristin'], date: '', summary: '' },
    { id: 'on-duty-off-duty', title: 'On-Duty vs Off-Duty', series: 'reels', credit: [], date: '',
      summary: 'A carousel comparing specialists on duty and off duty.' },
    { id: 'controversial-items-poll', title: 'Controversial-items poll', series: 'reels', credit: ['Constance'], date: '',
      summary: 'A poll on the baby items people disagree about most.' },
    { id: 'trick-or-treat', title: 'Trick or Treat', series: 'reels', credit: [], date: '', summary: 'A Halloween-season Reel.' },
    { id: 'gotta-have', title: 'Gotta Have / Nice to Have / Could Survive Without', series: 'reels', credit: [], date: '2026-11-07',
      summary: 'Sort baby gear into three friendly tiers.',
      howItWorks: ['Gotta have', 'Nice to have', 'Could survive without'],
      notes: ['Started as “Buy This, Not That” and was softened on Nov 7.'] },
    { id: 'twas-the-night-before', title: '’Twas the Night Before Welcome Hours', series: 'reels', credit: ['Kristin'], date: '2026-11-15',
      summary: 'A holiday montage about Welcome Hours.' },

    // Registry & Client Experience — the flagship
    { id: 'registry-not-roast', title: 'Registry NOT Roast', series: 'registry', credit: ['Taylor'], date: '2026-10-10',
      titleNote: 'Working title. The final name is still open.',
      summary: 'Real registries screen-shared on a group call and sorted into KEEP, SWAP or SKIP.',
      howItWorks: ['Screen-share a real registry on a group call.', 'Sort each item into KEEP, SWAP or SKIP.'],
      guidance: ['Get the family’s permission before showing their registry, and hide names, addresses and order details.'],
      variations: [
        { title: 'Shark Tank version', credit: ['Jessica'] },
        { title: 'Spotlight recap', credit: ['Taylor'] },
        { title: 'Long-form first, then slice it', text: 'Record the full session, then cut it into short clips.', credit: [] }
      ],
      notes: ['Started as Registry Roast on Oct 10, grown from Registry Court.', 'Kristin found a creator asking for exactly this.', '“Roast” was flagged twice. Taylor landed on “Registry NOT Roast” on Nov 2.'],
      altNames: ['Hot Takes with the Squad', 'Registry Refresh', 'The Registry Edit'] },
    { id: 'virtual-to-in-store', title: 'Virtual to in-store handoff', series: 'registry', credit: [], date: '',
      summary: 'Start with a virtual appointment, then hand the family off to an in-store visit.' },
    { id: 'two-specialist-welcome-hours', title: 'Two-specialist Welcome Hours', series: 'registry', credit: [], date: '',
      summary: 'Welcome Hours led by two specialists together.' },
    { id: 'event-style-welcome-hours', title: 'Event-style Welcome Hours', series: 'registry', credit: [], date: '',
      summary: 'Welcome Hours run as an event.' },
    { id: 'tipping-option', title: 'Tipping in the post-appointment survey', series: 'registry', credit: [], date: '',
      summary: 'Add an option to tip in the post-appointment survey.' },

    // Hub Improvements
    { id: 'social-sharing-channel', title: 'A better Social & Sharing channel', series: 'hub', credit: ['Taylor'], date: '2026-11-15',
      summary: 'One home for the Squad’s content work, which is spread across the Instagram chat, a Google Drive and the Hub.',
      notes: ['This page is the first version.'] },
    { id: 'specialist-finder', title: 'Specialist finder', series: 'hub', credit: ['Lora'], date: '2026-09-25',
      summary: 'A way to find specialists by city or store in the Hub.',
      notes: ['Lora had to work through a store list by hand.', 'Specialist locations are member data, so this belongs in Disco’s member directory, not on this public page.'] },
    { id: 'faster-notifications', title: 'Faster notifications', series: 'hub', credit: ['Kristin', 'Linden'], date: '2026-10-27',
      summary: 'Make sure Hub posts get noticed the day they go up.',
      notes: ['Hub posts get noticed days late, which is why brainstorming moved to Instagram.'] }
  ],

  // status: idea, casting, filming, editing, published; null = unverified. Optional: lead, exampleReelUrl.
  activeCollaborations: [
    { id: 'meet-the-squad-part-2', title: 'Meet the Squad, Part 2: Pass the Toy', status: 'casting', lead: 'Kristin',
      description: 'Welcome to our newest specialists! Introduce yourself by passing the sunshine toy, just like the original Meet the Squad.',
      instructions: 'A short clip: catch the sunshine toy, smile for a second, and pass it the other way. No talking needed.',
      thumbnail: 'images/meet-the-squad.jpg', exampleReelUrl: 'https://www.instagram.com/reel/DdxH92sTWXo/',
      submissionDeadline: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=44d569be-13ea-47f5-b927-749d09323ad0-HDjH-thn3qn3ddof_GUCA',
      publishedReelUrl: '', participatingSpecialists: [],
      // Open call: anyone can send a video from the casting card, no password (also listed in OPEN_CASTING in the script).
      openCall: {
        toy: { name: 'Sun Plush Stuffed Animal – Yellow – Cloud Island™', note: 'The little yellow sun with arms and legs, about 6.5" tall and about $10. Look in the Cloud Island baby toys.',
          item: '92401823', url: 'https://www.target.com/p/sun-plush-stuffed-animal-yellow-cloud-island-8482/-/A-92401823', photo: 'images/meet-the-squad.jpg' },
        steps: [
          'Prop your phone up vertically (9:16) at chest height, in good light. The baby aisle makes a great backdrop.',
          'Start with your hands empty, then catch the sun as it comes in from one side of the frame, like someone just passed it to you.',
          'Hold it and smile at the camera for a second. No talking needed.',
          'Pass it the other way, out the opposite side of the frame.',
          'Keep it to about 5 seconds. Film two or three takes and send your favorite.'
        ],
        dont: 'No music or text on the video, and keep shoppers’ and babies’ faces out of the shot.'
      } }
  ],
  // These are known project titles, not verified completion or publication claims.
  completedCollaborations: [
    { id: 'meet-the-squad', title: 'Meet the Squad', status: 'published',
      description: 'A sunny introduction to the Tot Squad Baby Specialists and their free registry appointments at Target and online.',
      thumbnail: 'images/meet-the-squad.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DdxH92sTWXo/',
      submissionDeadline: '', instructions: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=44d569be-13ea-47f5-b927-749d09323ad0-paGvAFsgM4iy3UR6LCJ3-',
      participatingSpecialists: ['Kristin', 'Lora', 'Constance', 'Atiba', 'Aly', 'Taylor'] },
    { id: 'tot-squad-round-up', title: 'Tot Squad Round Up: Strollers', status: 'published',
      description: 'The Squad answers “What’s your go-to stroller?” There’s no one-size-fits-all registry.',
      thumbnail: 'images/round-up-strollers.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DeIYf50zTwr/',
      submissionDeadline: '', instructions: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=a92626f1-e32b-4c90-8cb2-d1fb97be5d93-L1Q8bG670t7qveiyVI5RD',
      participatingSpecialists: ['Kristin', 'Sarah', 'Lora', 'Constance', 'Aly', 'Taylor'] },
    { id: 'tot-squad-round-up-favorites', title: 'Tot Squad Round Up: Registry Favorites', status: 'published',
      description: 'The Squad answers “What’s one registry item you couldn’t live without?”',
      thumbnail: 'images/round-up-registry-favorites.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DeuxzYWTQhv/',
      submissionDeadline: '', instructions: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=a92626f1-e32b-4c90-8cb2-d1fb97be5d93-L1Q8bG670t7qveiyVI5RD',
      participatingSpecialists: [] },
    { id: 'day-in-the-life', title: 'A Day in the Life, Hour by Hour', status: 'published',
      description: 'The Squad sent photos all day to show how different our days are, from Target stores to virtual appointments.',
      thumbnail: 'images/day-in-the-life.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DeUnaELy3Er/',
      submissionDeadline: '', instructions: '', discussionUrl: '',
      participatingSpecialists: ['Sarah', 'Lora', 'Atiba', 'Taylor', 'Kristin'] }
  ],
  upcomingDeadlines: [],

  /* Content calendar + Reels tracker, copied from the Reels – Status Report (updated Nov 18, 2026).
     status: posted, editing, filming, casting, scheduled, idea. date: YYYY-MM-DD or '' when unknown.
     prompt: the sheet's prompt text. briefUrl: the prompt doc, if there is one. Uploads go to submissionFolderUrl.
     The Reels page (reels.html) reads the sheet live and falls back to this copy. sheetTitle: the row's title in the sheet,
     so live rows pick up this entry's nicer title, Watch link and project (cover and featured specialists). */
  reelsTrackerUrl: 'https://docs.google.com/spreadsheets/d/1jg1-socr0cbV6Gt9LdaNtJ1hNLq9pfN_vBVAPVBYMus/edit',
  contentCalendar: [
    { title: 'Meet the Squad (Pass the Toy)', sheetTitle: 'Pass the Toy', project: 'meet-the-squad', lead: 'Kristin', date: '2026-09-26', status: 'posted', prompt: 'Intros passing the sunshine toy', url: 'https://www.instagram.com/reel/DdxH92sTWXo/' },
    { title: 'Tot Squad Round Up #1: Strollers', sheetTitle: 'Tot Squad Round Up #1', project: 'tot-squad-round-up', lead: 'Kristin', date: '', status: 'posted', briefUrl: 'https://docs.google.com/document/d/1eiYurPKEKicMuBICFw52AjagtawhmNP_JL6sGaPT41Q/edit?usp=sharing', url: 'https://www.instagram.com/reel/DeIYf50zTwr/' },
    { title: 'Day in the Life', sheetTitle: 'Day in the Life', project: 'day-in-the-life', lead: 'Sarah', date: '', status: 'posted', prompt: 'Send photos throughout your day', url: 'https://www.instagram.com/reel/DeUnaELy3Er/' },
    { title: 'Tot Squad Round Up #2: Registry Favorites', sheetTitle: 'Tot Squad Round Up #2', project: 'tot-squad-round-up-favorites', lead: 'Kristin', date: '2026-10-18', status: 'posted', briefUrl: 'https://docs.google.com/document/d/1eiYurPKEKicMuBICFw52AjagtawhmNP_JL6sGaPT41Q/edit?usp=sharing', url: 'https://www.instagram.com/reel/DeuxzYWTQhv/' },
    { title: 'Daddy’s Home', sheetTitle: "Daddy's Home", lead: 'Sarah', date: '2026-10-25', status: 'editing', briefUrl: 'https://docs.google.com/document/d/1abzRnKbHdlLk1Himey9XHMZgq-7YdRcRVhVWYo3PF4I/edit?usp=sharing', url: '' },
    { title: 'Tot Squad Round Up #3', sheetTitle: 'Tot Squad Round Up #3', lead: 'Kristin', date: '2026-11-08', status: 'scheduled', briefUrl: 'https://docs.google.com/document/d/1eiYurPKEKicMuBICFw52AjagtawhmNP_JL6sGaPT41Q/edit?usp=sharing', url: '' },
    { title: 'Meet the Squad, Part 2: Pass the Toy (Fall Recruits)', sheetTitle: 'Pass the Toy - Fall Recruits', project: 'meet-the-squad-part-2', lead: 'Kristin', date: '2026-11-13', status: 'casting', prompt: 'Intros passing the sunshine toy', url: '' },
    { title: 'My “Why” carousel', sheetTitle: 'My "Why" - Carousel', lead: 'Kristin', date: '', status: 'idea', briefUrl: 'https://docs.google.com/document/d/1fgHTbjhL1w2xZuPffDQRrm0-FWhuxVFYkfuE3gr79KM/edit?usp=sharing', url: '' },
    { title: 'Registry Roast on Google Meet', sheetTitle: 'Registry Roast Google Meet', lead: 'Taylor', date: '', status: 'idea', url: '' },
    { title: 'Trick or Treat', sheetTitle: 'Trick or Treat', lead: 'Taylor', date: '', status: 'idea', url: '' }
  ],

  // weekday: 0 Sunday … 6 Saturday, or null when the schedule isn't set. time is optional text.
  eventsCalendarUrl: 'https://tot-squad-hub.disco.co/events-calendar',
  recurringEvents: [
    { id: 'mentor-huddle', title: 'Squad Cup Mentor Huddle', weekday: 3, time: '1:30–2:00 PM MST', description: '', url: 'https://tot-squad-hub.disco.co/events-calendar' },
    { id: 'pop-ins', title: 'Pop In With Us', weekday: 4, time: '1:00–1:30 PM MST', description: 'A specialist takes over Pop-Ins, answering anonymous follower questions.', url: 'https://tot-squad-hub.disco.co/events-calendar' },
    { id: 'lunch-and-learn', title: 'Lunch & Learn', weekday: null, scheduleNote: 'Dates to come', description: 'Certified specialists take turns teaching a skill. Grew from Taylor’s babywearing idea (Nov 14).', url: 'https://tot-squad-hub.disco.co/events-calendar' }
  ],

  waysOfWorking: [
    { id: 'one-lead', title: 'One lead per idea', text: 'Every idea gets one lead who keeps it moving.', credit: [] },
    { id: 'engagement-pact', title: 'The engagement pact', text: 'Post your Reel in the chat. Everyone watches, likes and reshares.', credit: ['Taylor'], date: '2026-11-13' },
    { id: 'reels-tracker', title: 'Reels tracker and concept template', text: 'Track every Reel in one place and shape new concepts with a shared template.', credit: ['Kristin'], date: '2026-10-20' },
    { id: 'ideas-doc', title: 'One shared home for ideas', text: 'So newer specialists can find a place to start. The Idea Bank is that home.', credit: ['Lindsay'], date: '2026-11-07' },
    { id: 'b-roll', title: 'Shared b-roll library', text: 'Clips anyone can reuse, kept in the shared Drive.', credit: [] }
  ],

  // Leader spotlight, shown above the squad cards. Same optional fields as specialists, plus title and aka.
  leader: { name: 'Jen', photo: 'images/squad-jen.jpg', title: 'Tot Squad CEO', aka: 'AKA The Queen', instagram: 'jenbsaxton' },

  // Approved first names.
  // region: East, Central or West (from the Squad Cup mentor sub-groups).
  // Optional: bio (one or two sentences), expertise, location, photo (https or images/ file), spotlight, link (https), instagram.
  // fullName: their first and last name, so the bio they write in the app lands on this card even if two people share a first name.
  // disco: the link from their Disco profile (open the profile in Disco, copy the address bar). Adds a "Disco profile" button
  // and "Message <name>" on the Reels they lead.
  featuredSpecialists: [
    { name: 'Kristin', region: 'East', photo: 'images/squad-kristin.jpg', 
      bio: 'Mom of three in Holly Springs, NC, and a former reality TV producer. Loves baking, all things Disney and musicals.',
      instagram: 'kristinbabyregistryspecialist',
      disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzQzMDk5NzQ0MDUxNDMzNDkx&profileSettingsTab=profile' }, { name: 'Taylor', region: 'West', photo: 'images/squad-taylor.jpg', 
      bio: 'Scottsdale-based baby gear expert with hands-on experience from Strolleria and Pottery Barn Kids. Certified Babywearing Educator and CPST, and the force behind Squad Cup.',
      instagram: 'taylormadebabyco', disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzE4OTcyMTMwODE4MTE1MzA4&profileSettingsTab=profile' }, { name: 'Lora', region: 'East', photo: 'images/squad-lora.jpg', 
      bio: 'East Coast mentor, mom of four boys, esthetician and former birth doula who loves helping families navigate their registries.',
      instagram: 'lora_thebabyspecialist', disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzI4MDAwODk4NzY0NzM2NTUx&profileSettingsTab=profile' }, { name: 'Lindsay', region: 'Central', photo: 'images/squad-lindsay.jpg', 
      bio: 'Serves North Denver-area Target stores, bringing social work, healthcare and postpartum-advocacy experience to zero-judgment registry help.',
      instagram: 'northdenverbabyspecialist',
      disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzUzMDE2MzU3ODQwOTA3MTI4&profileSettingsTab=profile' }, { name: 'Aly', region: 'West', photo: 'images/squad-aly.jpg', 
      bio: 'Redmond, WA mom of three, including twins, with a background in medical support. Loves music, nature and shopping.',
      instagram: 'alygbabygoto',
      disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzMzODExNDk0MDM2NDIzMjEw&profileSettingsTab=profile' },
    { name: 'Jessica', region: 'East', photo: 'images/squad-jessica.jpg',
      bio: 'Greenville, SC-area mom of a fun 3-year-old with a lifelong customer service background. Loves helping local families navigate new parenthood.',
      instagram: 'registrywithjessica', disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzE5MTM0MjEyMzIzNDIzODUx&profileSettingsTab=profile' }, { name: 'Constance', region: 'East', photo: 'images/squad-constance.jpg', 
      bio: 'Charlotte, NC-based former critical care nurse who now runs a virtual practice for infant sleep and registry guidance. Certified CPST.',
      instagram: 'constance_babygearspecialist', disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzI4NTYzNTc1Nzc2MDYyMTQ1&profileSettingsTab=profile' }, { name: 'Sarah', region: 'West', photo: 'images/squad-sarah.jpg', 
      bio: 'San Diego-based creator of The Modern Nanny and the Nanny Census Report, building community for domestic workers with humor and heart.',
      instagram: 'sarahcarlislestewart',
      disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzMzNjYzMDAxNTQ5MzU5Mzcw&profileSettingsTab=profile' },
    { name: 'Atiba', region: 'Central', photo: 'images/squad-atiba.jpg',
      bio: 'St. Louis-area mom and former pre-K through 3rd grade teacher with a degree in early childhood education. One of the Squad’s most active specialists on social.',
      instagram: 'tiba.cooper', disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzI4NTk2OTQzMjk5NDU2Mjg2&profileSettingsTab=profile' },
    { name: 'Melissa', region: 'East', photo: 'images/squad-melissa.jpg', 
      bio: 'Mom of many, full-spectrum doula, newborn care specialist and pediatric sleep consultant who also co-owns a baby clothing brand.',
      instagram: 'melissababyconcierge',
      disco: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?drawerProfileId=VXNlcjozNzQzODAxMTk4ODEyOTYwNDkw&profileSettingsTab=profile' }
  ],

  /* B-roll library (b-roll.html). brollFolderUrl: the shared Drive folder for clips (blank = the submission folder).
     brollClips: { id, title, category, url (Drive file link), thumbnail ('images/…' or https), length ('0:08'), credit (first name) }.
     brollWanted is a starter shot list; edit it freely. */
  brollFolderUrl: 'https://drive.google.com/drive/folders/1Q6fuKOaiTbkB2vTT7koOgHbDQcNTSx5c',
  // One Drive folder per specialist who has sent clips. Clips show in a folder when their credit matches its name.
  brollFolders: [
    { name: 'Taylor', url: 'https://drive.google.com/drive/folders/1SCiEs_VRfE0UbxVWFoMmftbynu2iUo0O' }
  ],
  brollCategories: [
    { id: 'aisles', label: 'In-store & aisles' }, { id: 'strollers', label: 'Strollers' }, { id: 'car-seats', label: 'Car seats' },
    { id: 'nursery', label: 'Nursery & sleep' }, { id: 'feeding', label: 'Feeding' }, { id: 'babywearing', label: 'Babywearing' },
    { id: 'registry', label: 'Registry moments' }, { id: 'squad', label: 'Squad life' }
  ],
  brollClips: [
    { id: 'entrance', title: 'Store entrance in a Tot Squad shirt', category: 'squad', url: 'https://drive.google.com/file/d/1zbObm8ndEbcXwoTNOD_CVLRyvkfVqM53/view', thumbnail: 'images/broll-entrance.jpg', length: '0:11', credit: 'Taylor' },
    { id: 'inside-target', title: 'Inside Target', category: 'aisles', url: 'https://drive.google.com/file/d/1gXyDBhfwkddNP9Tsp1-aCku1RJOKGYrS/view', thumbnail: 'images/broll-inside-target.jpg', length: '0:13', credit: 'Taylor' },
    { id: 'lost', title: 'Lost in the aisles', category: 'aisles', url: 'https://drive.google.com/file/d/1IunScZssJOyYg9IhdMldf6EMJXveSu1j/view', thumbnail: 'images/broll-lost.jpg', length: '0:21', credit: 'Taylor' },
    { id: 'wagons', title: 'Wagons', category: 'strollers', url: 'https://drive.google.com/file/d/1Nb8Zx3XdhOICtMyGzFwa2nKFnNEdNYvR/view', thumbnail: 'images/broll-wagons.jpg', length: '0:11', credit: 'Taylor' },
    { id: 'halo', title: 'Halo bassinet', category: 'nursery', url: 'https://drive.google.com/file/d/1DQjM1YkaqhQmph-arTAFOKo2QGOb_blj/view', thumbnail: 'images/broll-halo.jpg', length: '0:06', credit: 'Taylor' },
    { id: 'lalo-bibs', title: 'Lalo long-sleeve bibs', category: 'feeding', url: 'https://drive.google.com/file/d/1vJbjstmLvluY3I8qpZmRfbDvodwsE4Zp/view', thumbnail: 'images/broll-lalo-bibs.jpg', length: '0:09', credit: 'Taylor' },
    { id: 'live-demo', title: 'Live demo', category: 'squad', url: 'https://drive.google.com/file/d/1cGZpmq45VzpuwDM5RDcdK-LbnWxIGVaW/view', thumbnail: 'images/broll-live-demo.jpg', length: '1:06', credit: 'Taylor' }
  ],
  brollWanted: [
    { title: 'Slow walk down the baby aisle, wide', category: 'aisles' },
    { title: 'One-hand stroller fold, close-up', category: 'strollers' },
    { title: 'Car seat clicking into its base', category: 'car-seats' },
    { title: 'Scanning an item with the Target app', category: 'registry' },
    { title: 'Bassinet or crib, wide and still', category: 'nursery' },
    { title: 'Bottles and pumps on the shelf', category: 'feeding' },
    { title: 'Putting on a carrier in a mirror', category: 'babywearing' },
    { title: 'A specialist waving hello', category: 'squad' }
  ],

  // Only links that aren't already in Disco's sidebar.
  // Extra Toolkit tiles (the built-in ones are Brand & voice, Starter guide, Before you share, Upload clips, B-roll library, My drafts).
  // Pages in this site only, so everything stays in the app. desc: one short line. icon: board, calendar, film, palette, spark, check, upload, draft.
  resources: [
    { label: 'Reels tracker', page: 'reels.html?view=board', desc: 'Every Reel, from casting to posted', icon: 'board' },
    { label: 'Content calendar', page: 'reels.html?view=calendar', desc: 'What’s posting and when', icon: 'calendar' }
  ]
};
