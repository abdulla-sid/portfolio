import { playlist } from '../../content/music';
import { music, skipTarget, TRACK_SECONDS } from './store';

/*
  Plays the playlist through one shared <audio>. Preview URLs were resolved at build time and sit in the
  #music-previews JSON block that MusicData.astro writes. A track without a preview (or whose preview fails) still
  "plays": its position advances on a timer, so every screen behaves the same.
*/

let audio: HTMLAudioElement | undefined;
let loaded = -1;
let simTimer = 0;
let previews: (string | null)[] | undefined;

const previewOf = (track: number): string | null => {
  previews ??= JSON.parse(document.getElementById('music-previews')?.textContent || '[]');
  return previews?.[track] ?? null;
};

function element(): HTMLAudioElement {
  if (audio) return audio;
  const a = new Audio();
  a.preload = 'none';
  a.addEventListener('timeupdate', () => {
    if (music.get().playing) music.set({ position: a.currentTime });
  });
  a.addEventListener('ended', () => skip(1));
  a.addEventListener('error', () => {
    if (music.get().playing) simulate();
  });
  audio = a;
  return a;
}

function simulate(): void {
  clearInterval(simTimer);
  simTimer = window.setInterval(() => {
    const position = music.get().position + 0.25;
    if (position >= TRACK_SECONDS) skip(1);
    else music.set({ position });
  }, 250);
}

function start(): void {
  const { track, position } = music.get();
  const src = previewOf(track);
  clearInterval(simTimer);
  audio?.pause();
  if (!src) {
    simulate();
    return;
  }
  const a = element();
  if (loaded !== track) {
    a.src = src;
    loaded = track;
  }
  a.currentTime = position;
  a.play().catch(() => {
    // blocked or unreachable: keep the screens moving anyway
    if (music.get().playing && a.paused) simulate();
  });
}

function announce(): void {
  if (!('mediaSession' in navigator)) return;
  const t = playlist[music.get().track];
  if (t) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist });
  navigator.mediaSession.setActionHandler('play', () => play());
  navigator.mediaSession.setActionHandler('pause', pause);
  navigator.mediaSession.setActionHandler('nexttrack', () => skip(1));
  navigator.mediaSession.setActionHandler('previoustrack', () => skip(-1));
}

/** Plays the current track, or `track` from its start. Call from a user gesture so the browser allows sound. */
export function play(track = music.get().track): void {
  if (track !== music.get().track) music.set({ track, position: 0 });
  music.set({ playing: true });
  start();
  announce();
}

function pause(): void {
  clearInterval(simTimer);
  audio?.pause();
  music.set({ playing: false });
}

export const toggle = (): void => (music.get().playing ? pause() : play());

/** Next or previous track; previous restarts the current one when it is a few seconds in. Keeps playing if it was. */
export function skip(delta: 1 | -1): void {
  music.set(skipTarget(music.get(), delta, playlist.length));
  if (music.get().playing) play();
}

/** Jumps to `seconds` into the current track. */
export function seek(seconds: number): void {
  const position = Math.min(Math.max(0, seconds), TRACK_SECONDS - 1);
  music.set({ position });
  if (audio && loaded === music.get().track) audio.currentTime = position;
}
