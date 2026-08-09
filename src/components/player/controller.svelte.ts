import type { PlaylistEntry, ResolvedTrack } from "./itunes";
import { nextPlayableIndex } from "./playlist";

type PlayerTrack = PlaylistEntry & Partial<ResolvedTrack>;

interface PlayerControllerOptions {
  playlist: PlaylistEntry[];
  resolve: (entry: PlaylistEntry) => Promise<ResolvedTrack>;
  createAudio?: () => HTMLAudioElement;
}

export function createPlayerController({
  playlist,
  resolve,
  createAudio = () => new Audio(),
}: PlayerControllerOptions) {
  const tracks = $state<PlayerTrack[]>(playlist.map((track) => ({ ...track })));
  let current = $state(0);
  let touched = false;
  let playing = $state(false);
  let audible = $state(false);
  let listOpen = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let failedAll = $state(false);
  let audio: HTMLAudioElement | undefined;
  let initialized = false;
  let disposed = false;
  let generation = 0;

  const onPlay = () => (playing = true);
  const onPause = () => {
    playing = false;
    audible = false;
  };
  const onPlaying = () => (audible = true);
  const onWaiting = () => (audible = false);
  const onTimeUpdate = () => {
    if (audio) currentTime = audio.currentTime;
  };
  const onLoadedMetadata = () => {
    if (audio) duration = audio.duration || 30;
  };
  const onEnded = () => step(1);

  function initialize() {
    if (initialized || disposed) return;
    initialized = true;
    const instance = createAudio();
    audio = instance;
    instance.preload = "metadata";
    instance.addEventListener("play", onPlay);
    instance.addEventListener("pause", onPause);
    instance.addEventListener("playing", onPlaying);
    instance.addEventListener("waiting", onWaiting);
    instance.addEventListener("timeupdate", onTimeUpdate);
    instance.addEventListener("loadedmetadata", onLoadedMetadata);
    instance.addEventListener("ended", onEnded);

    const run = ++generation;
    const settled = tracks.map(() => false);

    const selectFirstPlayable = () => {
      if (touched) return;
      const first = tracks.findIndex((track) => track.preview);
      if (first < 0) return;
      current = first;
      if (settled.every((done, index) => index >= first || done)) warm(first);
    };

    for (const [index, entry] of tracks.entries()) {
      resolve(entry).then(
        (resolved) => {
          if (disposed || run !== generation) return;
          settled[index] = true;
          tracks[index] = { ...entry, ...resolved };
          failedAll = false;
          selectFirstPlayable();
        },
        () => {
          if (disposed || run !== generation) return;
          settled[index] = true;
          if (!touched && tracks.every((track) => !track.preview)) {
            failedAll = true;
          }
          selectFirstPlayable();
        },
      );
    }
  }

  function warm(index: number) {
    const track = tracks[index];
    if (!audio || touched || !track?.preview) return;
    if (audio.src !== track.preview) audio.src = track.preview;
  }

  function load(index: number, autoplay: boolean) {
    const track = tracks[index];
    if (!audio || !track?.preview) return;
    const warmed = !touched && audio.src === track.preview;
    touched = true;
    current = index;
    if (!warmed) {
      audio.src = track.preview;
      currentTime = 0;
      duration = 0;
      audible = false;
    }
    if (autoplay) void audio.play().catch(() => {});
  }

  function togglePlay() {
    if (!audio || !controller.ready) return;
    if (!touched) load(current, true);
    else if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }

  function pause() {
    audio?.pause();
  }

  function step(direction: 1 | -1) {
    if (!controller.ready) return;
    const next = nextPlayableIndex(
      tracks.map((track) => Boolean(track.preview)),
      current,
      direction,
    );
    if (next !== null) load(next, true);
  }

  function seek(fraction: number) {
    if (!audio?.duration) return;
    audio.currentTime = Math.min(1, Math.max(0, fraction)) * audio.duration;
  }

  function selectTrack(index: number, closeList = false) {
    load(index, true);
    if (closeList) listOpen = false;
  }

  function reset() {
    audio?.pause();
    audio?.removeAttribute("src");
    current = 0;
    touched = false;
    playing = false;
    audible = false;
    listOpen = false;
    currentTime = 0;
    duration = 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    generation += 1;
    if (!audio) return;
    audio.removeEventListener("play", onPlay);
    audio.removeEventListener("pause", onPause);
    audio.removeEventListener("playing", onPlaying);
    audio.removeEventListener("waiting", onWaiting);
    audio.removeEventListener("timeupdate", onTimeUpdate);
    audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    audio.removeEventListener("ended", onEnded);
    audio.pause();
    audio.removeAttribute("src");
    audio = undefined;
  }

  const controller = {
    initialize,
    dispose,
    pause,
    reset,
    togglePlay,
    step,
    seek,
    selectTrack,
    get tracks() {
      return tracks;
    },
    get current() {
      return current;
    },
    get playing() {
      return playing;
    },
    get buffering() {
      return playing && !audible;
    },
    get listOpen() {
      return listOpen;
    },
    set listOpen(value: boolean) {
      listOpen = value;
    },
    get currentTime() {
      return currentTime;
    },
    get duration() {
      return duration;
    },
    get ready() {
      return tracks.some((track) => track.preview);
    },
    get title() {
      return failedAll
        ? "preview unavailable"
        : (tracks[current]?.title ?? "loading…");
    },
    get artist() {
      return failedAll
        ? "check your connection"
        : (tracks[current]?.artist ?? "");
    },
    get progress() {
      return duration ? currentTime / duration : 0;
    },
    get counter() {
      return `${String(current + 1).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")}`;
    },
  };

  return controller;
}

export type PlayerController = ReturnType<typeof createPlayerController>;
