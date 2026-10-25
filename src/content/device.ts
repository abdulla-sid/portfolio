/**
 * Words on and around the hero device. Text drawn on the LCD uses its 3x5 font: letters (shown as capitals),
 * digits and : . , + - / % ! > ' only. The `say` sentences are what screen readers hear for each app.
 */
export const device = {
  appsLabel: 'Apps',
  next: 'Next app',
  screen: (app: string, tappable: boolean) =>
    `${app} app. ${tappable ? 'Tap to use it.' : 'Tap for the next app.'}`,
  clock: {
    name: 'Clock',
    say: (time: string, city: string) => `Clock: ${time} in ${city}.`,
  },
  coffee: {
    name: 'Coffee',
    when: 'Today',
    more: 'Tap for one more',
    /** The bottom line judges the count: the last entry whose `from` the count reaches wins (28 chars max). */
    verdict: [
      { from: 2, say: 'Productive' },
      { from: 3, say: 'Still productive' },
      { from: 4, say: 'Very productive' },
      { from: 5, say: 'Suspiciously productive' },
      { from: 6, say: 'This is a cry for help' },
      { from: 7, say: 'Hands are vibrating' },
      { from: 8, say: 'The cat is worried' },
    ],
    say: (cups: number, verdict?: string) =>
      `Coffee: ${cups} today.${verdict ? ` ${verdict}.` : ''} Tap the screen to add one.`,
  },
  reading: {
    name: 'Reading',
    page: (page: number, pages: number) => `Page ${page} of ${pages}`,
    say: (title: string, author: string, page: number, pages: number) =>
      `Reading: ${title} by ${author}, page ${page} of ${pages}.`,
  },
  music: {
    name: 'Music',
    playing: 'Playing',
    paused: 'Paused',
    say: (title: string, artist: string, playing: boolean) =>
      `Music: ${title} by ${artist}, ${playing ? 'playing' : 'paused'}. Tap the screen to ${playing ? 'pause' : 'play'}.`,
  },
} as const;
