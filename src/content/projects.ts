export type ProjectStatus = 'active' | 'building' | 'done';

export interface Project {
  id: string;
  name: string;
  /** Which object it is on the shelf (ink mode). Pixel mode draws every project as a cartridge. */
  object: 'notebook' | 'box' | 'sketchbook' | 'spiral';
  status: ProjectStatus;
  /** Short, so the caption under the shelf stays on one or two lines. */
  caption: string;
  meta: string;
  body: string[];
  link?: { label: string; href: string };
  note?: string;
  /** What fills the detail panel's side column. */
  visual?: 'prefetch-photo' | 'pipeline-drawing';
}

export const statusLabel: Record<ProjectStatus, string> = {
  active: 'Active',
  building: 'Building',
  done: 'Done',
};

export const projectsCopy = {
  heading: 'Projects',
  intro: 'Things I keep coming back to. Pick one up.',
  prefetchPhoto: {
    alt: 'The Prefetch V team standing with their project at NUST Open House',
    caption: 'The team at Open House.',
  },
  pipelineDrawingLabel:
    'Line drawing of a stack of tickets, the top one checked, and one set aside and crossed out',
  /** A sample session shown as a terminal in pixel mode. */
  pipelineDemo: {
    label: 'Example run of agent-pipeline',
    lines: [
      { kind: 'you', text: '> run the next ticket' },
      { kind: 'log', text: 'planning 4 tickets' },
      { kind: 'ok', text: 'ticket 1 passed review, kept' },
      { kind: 'ok', text: 'ticket 2 passed review, kept' },
      { kind: 'ask', text: 'ticket 3 needs you: two ways to migrate' },
      { kind: 'you', text: '> the second one' },
      { kind: 'ok', text: 'ticket 3 passed review, kept' },
    ],
  },
} as const;

export const projects: Project[] = [
  {
    id: 'pipeline',
    name: 'agent-pipeline',
    object: 'box',
    status: 'active',
    caption: 'Works tickets, keeps what passes review.',
    meta: 'Claude Code plugin, 2026',
    body: [
      'Plans a batch of tickets, works them one at a time, and only keeps changes that pass a review with evidence.',
    ],
    link: {
      label: 'github.com/abdulla-sid/agent-pipeline',
      href: 'https://github.com/abdulla-sid/agent-pipeline',
    },
    visual: 'pipeline-drawing',
  },
  {
    id: 'frontdesk',
    name: 'Frontdesk Agent',
    object: 'spiral',
    status: 'building',
    caption: 'A clinic receptionist that books appointments.',
    meta: 'Web and iPhone. Not deployed yet.',
    body: [
      "An agent that answers a clinic's patients and books their appointments, with a booking app for staff on the web and iPhone.",
    ],
  },
  {
    id: 'tinydesktop',
    name: 'tinydesktop.me',
    object: 'sketchbook',
    status: 'active',
    caption: 'This site, mid-redesign.',
    meta: 'Astro and TypeScript.',
    body: ["My corner of the internet. It used to be a pixel desktop; this is the version you're scrolling."],
    note: "you're looking at it",
  },
  {
    id: 'prefetch',
    name: 'Prefetch V',
    object: 'notebook',
    status: 'done',
    caption: 'A RISC-V core that fetches before it is asked.',
    meta: 'Final-year project, 2025',
    body: [
      'We taught a CPU to guess what it was about to need: a RISC-V core built from scratch, with a prefetcher that spots a constant stride and fetches ahead. On an FPGA it beat the plain core on every benchmark.',
      'Second-best electrical engineering project, NUST Open House 2025.',
    ],
    visual: 'prefetch-photo',
  },
];
