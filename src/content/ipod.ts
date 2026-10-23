/** Words on and around the iPod. Its screen uses the LCD's 3x5 font (see content/device.ts). */
export const ipod = {
  label: 'iPod with a few favourite songs',
  screen: 'iPod screen. Arrow keys scroll, Enter picks.',
  keys: { menu: 'Menu', next: 'Next song', prev: 'Previous song', play: 'Play or pause', centre: 'Select' },
  songs: 'Songs',
  nowPlaying: 'Now playing',
  /** "3 of 8" on Now Playing. */
  position: (n: number, count: number) => `${n} of ${count}`,
  /** Screen-reader text as the wheel moves through the list, and when a song starts or stops. */
  sayRow: (n: number, count: number, title: string, artist: string) =>
    `${n} of ${count}: ${title}, ${artist}`,
  sayPlaying: (title: string, artist: string, playing: boolean) =>
    `${title} by ${artist}, ${playing ? 'playing' : 'paused'}.`,
} as const;
