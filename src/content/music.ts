export interface Track {
  /** Stable, for logic (the iPod's drawn cover); `title` is copy and may change. */
  id: string;
  title: string;
  artist: string;
  /** iTunes track id; when missing the build looks the song up by title and artist. */
  itunesId?: number;
}

/** Songs on the iPod, the LCD and the top-bar player. Previews are resolved from iTunes at build time. */
export const playlist: Track[] = [
  { id: 'detonate', title: 'Detonate', artist: 'Charli XCX', itunesId: 1513162584 },
  { id: 'you-lose', title: 'You Lose!', artist: 'Magdalena Bay', itunesId: 1636364834 },
  { id: 'ipod-touch', title: 'iPod Touch', artist: 'Ninajirachi', itunesId: 1817553617 },
  {
    id: 'drunk-drivers',
    title: 'Drunk Drivers/Killer Whales',
    artist: 'Car Seat Headrest',
    itunesId: 1589252486,
  },
  { id: 'all-the-time', title: 'All The Time', artist: 'The Strokes' },
  { id: 'under-pressure', title: 'Under Pressure', artist: 'Queen' },
  { id: 'feel-good-inc', title: 'Feel Good Inc.', artist: 'Gorillaz', itunesId: 850583586 },
  { id: 'not-strong-enough', title: 'Not Strong Enough', artist: 'boygenius', itunesId: 1666138718 },
];

/** The top-bar player's words. */
export const player = {
  play: 'Play',
  track: (t: Track) => `${t.title}, ${t.artist}`,
} as const;
