/* Public content only. See README.md before adding links, credits or dates.
   Run `node scripts/validate-content.cjs` after editing. */
window.HUB_CONTENT = {
  // A date-only deadline expires at the end of that day in this timezone.
  timeZone: 'America/Phoenix',
  appUrl: 'https://tot-squad-hub.disco.co/page-app/UHJvZHVjdEFwcDozODQzNTg=?u=8d8e2732-9268-481e-9d53-1363df5e83ca&drawerTab=analytics',
  discoUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx',
  submissionFolderUrl: 'https://drive.google.com/drive/folders/1tc9a6ur6K3QKAreSI_z0JYpG9ZHEmuKd',
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
      instructions: 'A short intro clip: catch the sunshine toy, say hi, and pass it on.',
      thumbnail: 'images/meet-the-squad.jpg', exampleReelUrl: 'https://www.instagram.com/reel/DdxH92sTWXo/',
      submissionDeadline: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=44d569be-13ea-47f5-b927-749d09323ad0-HDjH-thn3qn3ddof_GUCA',
      publishedReelUrl: '', participatingSpecialists: [] }
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
  reelsTrackerUrl: 'https://docs.google.com/spreadsheets/d/1onXGs-dUEvschflMisc0GW0ozzqsRimchQuYtzxbtfg/edit',
  contentCalendar: [
    { title: 'Meet the Squad (Pass the Toy)', sheetTitle: 'Pass the Toy', project: 'meet-the-squad', lead: 'Kristin', date: '2026-09-26', status: 'posted', prompt: 'Intros passing the sunshine toy', url: 'https://www.instagram.com/reel/DdxH92sTWXo/' },
    { title: 'Tot Squad Round Up #1: Strollers', sheetTitle: 'Tot Squad Round Up #1', project: 'tot-squad-round-up', lead: 'Kristin', date: '', status: 'posted', briefUrl: 'https://docs.google.com/document/d/19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA/edit?usp=sharing', url: 'https://www.instagram.com/reel/DeIYf50zTwr/' },
    { title: 'Day in the Life', sheetTitle: 'Day in the Life', project: 'day-in-the-life', lead: 'Sarah', date: '', status: 'posted', prompt: 'Send photos throughout your day', url: 'https://www.instagram.com/reel/DeUnaELy3Er/' },
    { title: 'Tot Squad Round Up #2: Registry Favorites', sheetTitle: 'Tot Squad Round Up #2', project: 'tot-squad-round-up-favorites', lead: 'Kristin', date: '2026-10-18', status: 'posted', briefUrl: 'https://docs.google.com/document/d/19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA/edit?usp=sharing', url: 'https://www.instagram.com/reel/DeuxzYWTQhv/' },
    { title: 'Daddy’s Home', sheetTitle: "Daddy's Home", lead: 'Sarah', date: '2026-10-25', status: 'editing', briefUrl: 'https://docs.google.com/document/d/1-EXu39nUOtxi7YvTaoneQRu6n4L-LgeGpCxvcWUAYAM/edit?usp=sharing', url: '' },
    { title: 'Tot Squad Round Up #3', sheetTitle: 'Tot Squad Round Up #3', lead: 'Kristin', date: '2026-11-08', status: 'scheduled', briefUrl: 'https://docs.google.com/document/d/19PoztAtuAcvGucJom_4FdvsOs8IAD7axp9e1LTLZgHA/edit?usp=sharing', url: '' },
    { title: 'Meet the Squad, Part 2: Pass the Toy (Fall Recruits)', sheetTitle: 'Pass the Toy - Fall Recruits', project: 'meet-the-squad-part-2', lead: 'Kristin', date: '2026-11-13', status: 'casting', prompt: 'Intros passing the sunshine toy', url: '' },
    { title: 'My “Why” carousel', sheetTitle: 'My "Why" - Carousel', lead: 'Kristin', date: '', status: 'idea', briefUrl: 'https://docs.google.com/document/d/1ZN9aw2mrgF4l_hVMWMszxsyGcyyb7peBQWL2RS9tMGg/edit?usp=sharing', url: '' },
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
  featuredSpecialists: [
    { name: 'Kristin', region: 'East', photo: 'images/squad-kristin.jpg', 
      bio: 'Mom of three in Holly Springs, NC, and a former reality TV producer. Loves baking, all things Disney and musicals.',
      instagram: 'kristinbabyregistryspecialist' }, { name: 'Taylor', region: 'West', photo: 'images/squad-taylor.jpg', 
      bio: 'Scottsdale-based baby gear expert with hands-on experience from Strolleria and Pottery Barn Kids. Certified Babywearing Educator and CPST, and the force behind Squad Cup.',
      instagram: 'taylormadebabyco' }, { name: 'Lora', region: 'East', photo: 'images/squad-lora.jpg', 
      bio: 'East Coast mentor, mom of four boys, esthetician and former birth doula who loves helping families navigate their registries.',
      instagram: 'lora_thebabyspecialist' }, { name: 'Lindsay', region: 'Central', photo: 'images/squad-lindsay.jpg', 
      bio: 'Serves North Denver-area Target stores, bringing social work, healthcare and postpartum-advocacy experience to zero-judgment registry help.',
      instagram: 'northdenverbabyspecialist' }, { name: 'Aly', region: 'West', photo: 'images/squad-aly.jpg', 
      bio: 'Redmond, WA mom of three, including twins, with a background in medical support. Loves music, nature and shopping.',
      instagram: 'alygbabygoto' },
    { name: 'Jessica', region: 'East', photo: 'images/squad-jessica.jpg', instagram: 'registrywithjessica' }, { name: 'Constance', region: 'East', photo: 'images/squad-constance.jpg', 
      bio: 'Charlotte, NC-based former critical care nurse who now runs a virtual practice for infant sleep and registry guidance. Certified CPST.',
      instagram: 'constance_babygearspecialist' }, { name: 'Sarah', region: 'West', photo: 'images/squad-sarah.jpg', 
      bio: 'San Diego-based creator of The Modern Nanny and the Nanny Census Report, building community for domestic workers with humor and heart.',
      instagram: 'sarahcarlislestewart' },
    { name: 'Atiba', region: 'Central', photo: 'images/squad-atiba.jpg', instagram: 'tiba.cooper' },
    { name: 'Melissa', region: 'East', photo: 'images/squad-melissa.jpg', 
      bio: 'Mom of many, full-spectrum doula, newborn care specialist and pediatric sleep consultant who also co-owns a baby clothing brand.',
      instagram: 'melissababyconcierge' }
  ],

  /* B-roll library (b-roll.html). brollFolderUrl: the shared Drive folder for clips (blank = the submission folder).
     brollClips: { id, title, category, url (Drive file link), thumbnail ('images/…' or https), length ('0:08'), credit (first name) }.
     brollWanted is a starter shot list; edit it freely. */
  brollFolderUrl: 'https://drive.google.com/drive/folders/1Nl5OGfhaRJ1ltRYNNrJGiAFTia-lnYHS',
  // One Drive folder per specialist who has sent clips. Clips show in a folder when their credit matches its name.
  brollFolders: [
    { name: 'Taylor', url: 'https://drive.google.com/drive/folders/1BebMeyvEhZp7e0XBVur5nPPwpho_SOwQ' }
  ],
  brollCategories: [
    { id: 'aisles', label: 'In-store & aisles' }, { id: 'strollers', label: 'Strollers' }, { id: 'car-seats', label: 'Car seats' },
    { id: 'nursery', label: 'Nursery & sleep' }, { id: 'feeding', label: 'Feeding' }, { id: 'babywearing', label: 'Babywearing' },
    { id: 'registry', label: 'Registry moments' }, { id: 'squad', label: 'Squad life' }
  ],
  brollClips: [
    { id: 'entrance', title: 'Store entrance in a Tot Squad shirt', category: 'squad', url: 'https://drive.google.com/file/d/1hrp-G2XIptrFtsP5HYzL0zurrKAe5laq/view', thumbnail: 'images/broll-entrance.jpg', length: '0:11', credit: 'Taylor' },
    { id: 'inside-target', title: 'Inside Target', category: 'aisles', url: 'https://drive.google.com/file/d/10Vzy2zAKTHpN_iaM97bY03POKmpwjBbt/view', thumbnail: 'images/broll-inside-target.jpg', length: '0:13', credit: 'Taylor' },
    { id: 'lost', title: 'Lost in the aisles', category: 'aisles', url: 'https://drive.google.com/file/d/1buSOy4X66ElswPvV3CstQgvRqD6rcHrT/view', thumbnail: 'images/broll-lost.jpg', length: '0:21', credit: 'Taylor' },
    { id: 'wagons', title: 'Wagons', category: 'strollers', url: 'https://drive.google.com/file/d/1koQoJGAvew6_8ceIB8fpbafgOeQ-2UnA/view', thumbnail: 'images/broll-wagons.jpg', length: '0:11', credit: 'Taylor' },
    { id: 'halo', title: 'Halo bassinet', category: 'nursery', url: 'https://drive.google.com/file/d/1OKKgTFABstkurTo2bguFnEkzjH_ws58p/view', thumbnail: 'images/broll-halo.jpg', length: '0:06', credit: 'Taylor' },
    { id: 'lalo-bibs', title: 'Lalo long-sleeve bibs', category: 'feeding', url: 'https://drive.google.com/file/d/1iUiFf0PBdjTzBPsW4XmZgHabKU5MQ5lq/view', thumbnail: 'images/broll-lalo-bibs.jpg', length: '0:09', credit: 'Taylor' },
    { id: 'live-demo', title: 'Live demo', category: 'squad', url: 'https://drive.google.com/file/d/1_3KQCSbGwbZ03SWC3ydBkwt9vuTqg1Rm/view', thumbnail: 'images/broll-live-demo.jpg', length: '1:06', credit: 'Taylor' }
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
  resources: [
    { label: 'Content submission folder', url: 'https://drive.google.com/drive/folders/1tc9a6ur6K3QKAreSI_z0JYpG9ZHEmuKd' },
    { label: 'Reels tracker', page: 'reels.html?view=board' },
    { label: 'Content calendar', page: 'reels.html?view=calendar' }
  ]
};
