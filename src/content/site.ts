/** Who the site is about, and where else to find Abdullah. */
export const site = {
  title: 'Abdullah Siddiqui',
  domain: 'tinydesktop.me',
  name: ['Abdullah', 'Siddiqui'],
  /** Also the page's meta description. */
  lede: 'Full-stack and mobile engineer in Lahore. I build healthcare software, and the tools that help me ship it.',
  timeZone: 'Asia/Karachi',
  city: 'Lahore',
  links: [
    { label: 'GitHub', href: 'https://github.com/abdulla-sid' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abdullah-siddiqui-dev' },
  ],
} as const;

/** The top bar's controls, and the skip link before them. */
export const chrome = {
  skip: 'Skip to work',
  /** The mode switch offers the other mode: its label in each mode, and what pressing it does. */
  modeSwitch: {
    ink: { label: 'Pixelate', action: 'Pixelate the page' },
    pixel: { label: 'Ink', action: 'Back to ink' },
  },
} as const;

export const contact = {
  heading: 'Say hi.',
  clock: "It's {time} in {city}, so I am probably {where}.",
  asleep: 'asleep',
  awake: 'at my desk',
  /** The postcard: the visitor writes the message side and fills in the address side. */
  card: {
    to: site.title,
    toPlace: 'Lahore, Pakistan',
    message: { label: 'Message', placeholder: "What's on your mind?" },
    name: { label: 'From', placeholder: 'your name' },
    email: { label: 'Reply to', placeholder: 'your email' },
    track: { label: 'On repeat', placeholder: 'a song (optional)' },
    /** How full the card is, from the share of the message limit used: the last entry that applies wins. */
    room: [
      { from: 0, say: 'plenty of room' },
      { from: 0.5, say: 'room for a little more' },
      { from: 0.9, say: 'squeeze it in' },
      { from: 1, say: "that's the whole card" },
    ],
    send: 'Post it',
    again: 'Write another',
  },
  /** What the line under the card says while sending, and when something is wrong. */
  status: {
    sending: 'Posting…',
    sent: "Posted. I'll write back to {email}.",
    name: "Who's it from?",
    email: 'I need an address to write back to.',
    emailShape: 'That email looks off.',
    message: 'The card is blank.',
    tooLong: "That's longer than the card holds.",
    checking: 'Checking you are not a robot. Try again in a second.',
    failed: "It didn't go through. Try again in a minute.",
    closed: 'The postbox is closed right now. Find me on LinkedIn instead.',
  },
  elsewhere: 'Or find me on',
} as const;

export const about = {
  heading: 'About',
  paragraphs: [
    'Tech guy, wannabe artist. I spend as much time deciding what to build as building it, and most of my free time on graphics and game engines.',
    'Off the clock I paint, sketch, skate, and drink more coffee than my budget should allow. If you have a song I should hear, send it.',
  ],
  portraitAlt: 'Abdullah, smiling, in a portrait photo',
  portraitCaption: 'Lahore, late',
  ipodNote: 'spin the wheel for a few songs I love',
} as const;
