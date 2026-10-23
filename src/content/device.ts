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
    say: (cups: number) => `Coffee: ${cups} today. Tap the screen to add one.`,
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
