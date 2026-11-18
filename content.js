/* Public content only. See README.md before adding links, credits or dates.
   Run `node scripts/validate-content.cjs` after editing. */
window.HUB_CONTENT = {
  // A date-only deadline expires at the end of that day in this timezone.
  timeZone: 'America/Phoenix',
  appUrl: 'https://tot-squad-hub.disco.co/page-app/UHJvZHVjdEFwcDozODQzNTg=?u=8d8e2732-9268-481e-9d53-1363df5e83ca&drawerTab=analytics',
  discoUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx',
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
     stage (idea|filming|editing|published), lead, dueDate, discussionUrl */
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
    { id: 'tot-squad-round-up', title: 'Tot Squad Round Up', series: 'reels', credit: ['Kristin'], date: '',
      summary: 'Short pointing clips from across the Squad, built on a shared list of about 14 questions.' },
    { id: 'pass-the-item', title: 'Pass-the-item intro', series: 'reels', credit: ['Lora'], date: '',
      summary: 'Specialists pass an item from clip to clip to introduce the Squad.',
      notes: ['It became the pass-the-sun Reel, which the Squad filmed.'],
      variations: [{ title: 'Watch the Squad Grow', text: 'A redo of the pass-the-sun Reel.', credit: ['Taylor'], date: '2026-11-06' }] },
    { id: 'day-in-the-life', title: 'Day in the life, hour by hour', series: 'reels', credit: [], date: '',
      summary: 'A specialist’s day, told hour by hour.' },
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

  // status: idea, casting, filming, editing, published; null = unverified
  activeCollaborations: [],
  // These are known project titles, not verified completion or publication claims.
  completedCollaborations: [
    { id: 'meet-the-squad', ideaId: 'pass-the-item', title: 'Meet the Squad', status: 'published',
      description: 'A sunny introduction to the Tot Squad Baby Specialists and their free registry appointments at Target and online.',
      thumbnail: 'images/meet-the-squad.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DdxH92sTWXo/',
      submissionDeadline: '', instructions: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=44d569be-13ea-47f5-b927-749d09323ad0-paGvAFsgM4iy3UR6LCJ3-',
      participatingSpecialists: ['Kristin', 'Lora', 'Constance', 'Atiba', 'Aly', 'Taylor'] },
    { id: 'tot-squad-round-up', ideaId: 'tot-squad-round-up', title: 'Tot Squad Round Up: Strollers', status: 'published',
      description: 'The Squad answers “What’s your go-to stroller?” There’s no one-size-fits-all registry.',
      thumbnail: 'images/round-up-strollers.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DeIYf50zTwr/',
      submissionDeadline: '', instructions: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=a92626f1-e32b-4c90-8cb2-d1fb97be5d93-L1Q8bG670t7qveiyVI5RD',
      participatingSpecialists: ['Kristin', 'Sarah', 'Lora', 'Constance', 'Aly', 'Taylor'] },
    { id: 'tot-squad-round-up-favorites', ideaId: 'tot-squad-round-up', title: 'Tot Squad Round Up: Registry Favorites', status: 'published',
      description: 'The Squad answers “What’s one registry item you couldn’t live without?”',
      thumbnail: 'images/round-up-registry-favorites.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DeuxzYWTQhv/',
      submissionDeadline: '', instructions: '', discussionUrl: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=a92626f1-e32b-4c90-8cb2-d1fb97be5d93-L1Q8bG670t7qveiyVI5RD',
      participatingSpecialists: [] },
    { id: 'day-in-the-life', ideaId: 'day-in-the-life', title: 'A Day in the Life, Hour by Hour', status: 'published',
      description: 'The Squad sent photos all day to show how different our days are, from Target stores to virtual appointments.',
      thumbnail: 'images/day-in-the-life.jpg', publishedReelUrl: 'https://www.instagram.com/reel/DeUnaELy3Er/',
      submissionDeadline: '', instructions: '', discussionUrl: '',
      participatingSpecialists: ['Sarah', 'Lora', 'Atiba', 'Taylor', 'Kristin'] }
  ],
  upcomingDeadlines: [],

  // weekday: 0 Sunday … 6 Saturday, or null when the schedule isn't set. time is optional text.
  recurringEvents: [
    { id: 'mentor-huddle', title: 'Mentor Huddle', weekday: 3, time: '', description: '', url: '' },
    { id: 'pop-ins', title: 'Pop-Ins takeover', weekday: 4, time: '', description: 'A specialist takes over Pop-Ins, answering anonymous follower questions.', url: '' },
    { id: 'lunch-and-learn', title: 'Lunch & Learn', weekday: null, scheduleNote: 'Dates to come', description: 'Certified specialists take turns teaching a skill. Grew from Taylor’s babywearing idea (Nov 14).', url: '' }
  ],

  waysOfWorking: [
    { id: 'one-lead', title: 'One lead per idea', text: 'Every idea gets one lead who keeps it moving.', credit: [] },
    { id: 'engagement-pact', title: 'The engagement pact', text: 'Post your Reel in the chat. Everyone watches, likes and reshares.', credit: ['Taylor'], date: '2026-11-13' },
    { id: 'reels-tracker', title: 'Reels tracker and concept template', text: 'Track every Reel in one place and shape new concepts with a shared template.', credit: ['Kristin'], date: '2026-10-20' },
    { id: 'ideas-doc', title: 'One shared home for ideas', text: 'So newer specialists can find a place to start. The Idea Bank is that home.', credit: ['Lindsay'], date: '2026-11-07' },
    { id: 'b-roll', title: 'Shared b-roll library', text: 'Clips anyone can reuse, kept in the shared Drive.', credit: [] }
  ],

  // Leader spotlight, shown above the squad cards. Same optional fields as specialists, plus title and aka.
  leader: { name: 'Jen', title: 'Tot Squad CEO', aka: 'AKA The Queen', instagram: 'jenbsaxton',
    spotlight: 'Cast as the MotherFunder in Fund or No Fund.' },

  // Approved first names. Contributions are listed automatically from idea credits.
  // Optional: expertise, location, photo (https), spotlight, link (https), instagram ('handle', '@handle' or profile link).
  featuredSpecialists: [
    { name: 'Kristin', instagram: 'kristinbabyregistryspecialist' }, { name: 'Taylor', instagram: 'taylormadebabyco' }, { name: 'Lora', instagram: 'lora_thebabyspecialist' }, { name: 'Lindsay', instagram: 'northdenverbabyspecialist' }, { name: 'Aly', instagram: 'alygbabygoto' },
    { name: 'Jessica', instagram: 'registrywithjessica' }, { name: 'Constance', instagram: 'constance_babygearspecialist' }, { name: 'Sarah', instagram: 'sarahcarlislestewart' },
    { name: 'Linden', expertise: 'Tot Squad team', instagram: 'totsquad' },
    { name: 'Atiba', expertise: 'Central Mentor', instagram: 'tiba.cooper' },
    { name: 'Melissa', expertise: 'Eastern Mentor', instagram: 'melissababyconcierge' }
  ],

  resources: [
    { label: 'Social & Sharing chat', url: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx' },
    { label: 'Submission folder instructions in Disco', url: 'https://tot-squad-hub.disco.co/channel/Q2hhdENoYW5uZWw6MjAwMDUx?streamMsgId=44d569be-13ea-47f5-b927-749d09323ad0-HDjH-thn3qn3ddof_GUCA' },
    { label: 'Specialist social templates', url: 'https://www.canva.com/design/DAG1czWO5Y0/j7Vm_P-c6yyRmcjj0JtB-Q/view' },
    { label: 'Specialist resource library', url: 'https://tot-squad-hub.disco.co/collection/Q29sbGVjdGlvbjozOTA3Nw==' },
    { label: 'B-roll library', url: '', unavailableLabel: 'Link via a members-only Disco page' },
    { label: 'Reels tracker', url: '', unavailableLabel: 'Not configured' },
    { label: 'Content calendar', url: '', unavailableLabel: 'Awaiting approval' }
  ]
};
