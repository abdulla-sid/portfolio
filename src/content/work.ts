export type City = 'lahore' | 'islamabad';

export interface WorkEntry {
  id: string;
  tab: string;
  role: string;
  meta: string;
  body: string[];
  note?: string;
  /** Where the pin goes on the map. */
  pin: { lng: number; lat: number; label: string; city: City };
  /** A line under the city name on the map while this entry is selected. */
  citySub?: string;
}

export const work: WorkEntry[] = [
  {
    id: 'day54',
    tab: 'Day54',
    role: 'Forward Deployed Engineer',
    meta: 'Day54, Oct 2026 to now, remote',
    body: [
      'Built Moments Staff, an iOS app for hospice staff, and took it through TestFlight to App Store delivery. Staff file requests and upload documents, and each one lands in Zendesk as a ticket.',
      'Now planning the move off Zendesk to an in-house system.',
    ],
    pin: { lng: 74.33, lat: 31.52, label: 'Day54 (remote)', city: 'lahore' },
    citySub: 'for a U.S. team',
  },
  {
    id: 'fch',
    tab: 'FCH',
    role: 'Full Stack Software Engineer',
    meta: 'Carbonteq for First Class Healthcare, Jun 2025 to Nov 2026',
    body: [
      'Software for US correctional healthcare, used across 11 facilities. I own the unglamorous middle: how carts get stocked, how an intake gets processed, how a controlled-substance count reconciles at the end of a shift.',
      "I also built the team's Claude Code setup, which works through tickets one by one and stops when a person needs to decide.",
    ],
    note: 'it has to match. every shift.',
    pin: { lng: 74.423, lat: 31.4683, label: 'Carbonteq', city: 'lahore' },
  },
  {
    id: 'hemaidx',
    tab: 'HemAIDx',
    role: 'Machine Learning Engineer',
    meta: 'HemAIDx, part-time, Mar to Jun 2025',
    body: [
      'Taught a model to stain blood smears that were never stained. Trained it on microscopy images, measured the results, and exported it toward running on a Raspberry Pi.',
    ],
    pin: { lng: 74.3, lat: 31.49, label: 'HemAIDx', city: 'lahore' },
  },
  {
    id: 'cdc',
    tab: 'Chip Centre',
    role: 'Associate Researcher',
    meta: 'Chip Design Centre, NUST, Jun to Aug 2024',
    body: [
      "Mostly I read papers on what modern processors and their prefetchers actually do. Then I designed a memory system of my own to see if I'd understood any of it. A year later it became my final-year project.",
    ],
    pin: { lng: 72.9979, lat: 33.6461, label: 'Chip Design Centre', city: 'islamabad' },
  },
  {
    id: 'nust',
    tab: 'NUST',
    role: 'BEng Electrical Engineering',
    meta: 'NUST, 2021 to 2025',
    body: [
      "The best years of my life. All-nighters in C2, sneaking into Islamabad at 1am. What carried over is caring about whatever sits one layer under the thing I'm building.",
    ],
    pin: { lng: 72.9918, lat: 33.6448, label: 'NUST', city: 'islamabad' },
  },
];

export const workCopy = {
  heading: 'Work',
  tabsLabel: "Where I've worked",
  mapLabel: "Map of the places I've worked. Pins switch the tab.",
  loading: 'Loading the map',
  failed: 'The map could not load. The tabs still work.',
  caption: 'Tap a pin to switch places.',
};

export const cities: Record<City, { name: string; zoom: number; tiles: string }> = {
  lahore: { name: 'Lahore', zoom: 11.2, tiles: '/map/lahore.pmtiles' },
  islamabad: { name: 'Islamabad', zoom: 13.2, tiles: '/map/islamabad.pmtiles' },
};

export const travel = {
  toIslamabad: 'to Islamabad, 270 km up the motorway',
  toLahore: '270 km back down the motorway',
};
