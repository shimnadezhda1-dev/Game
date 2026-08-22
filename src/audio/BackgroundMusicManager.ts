import { assetUrl } from "../utils/assets";

const MUSIC_KEY = "happy-alphabet-music-v1";
const NORMAL_VOLUME = 0.12;
const DUCK_VOLUME = 0.035;
const MUSIC_SRC = "/audio/music/background.wav";

class BackgroundMusicManager {
  private audio: HTMLAudioElement | null = null;
  private enabled = true;
  private started = false;
  private ducking = false;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      this.enabled = localStorage.getItem(MUSIC_KEY) !== "off";
    } catch {
      this.enabled = true;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private currentVolume(): number {
    if (!this.enabled) {
      return 0;
    }
    return this.ducking ? DUCK_VOLUME : NORMAL_VOLUME;
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const audio = new Audio(assetUrl(MUSIC_SRC));
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = this.currentVolume();
      this.audio = audio;
    }
    return this.audio;
  }

  startFromGesture(): void {
    this.started = true;
    if (!this.enabled) {
      return;
    }
    const audio = this.ensureAudio();
    audio.volume = this.currentVolume();
    void audio.play().catch(() => {
      // Autoplay can still fail; next gesture retries.
    });
  }

  duck(): void {
    this.ducking = true;
    if (this.audio) {
      this.audio.volume = this.currentVolume();
    }
  }

  unduck(): void {
    this.ducking = false;
    if (this.audio) {
      this.audio.volume = this.currentVolume();
    }
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    try {
      localStorage.setItem(MUSIC_KEY, value ? "on" : "off");
    } catch {
      // ignore
    }
    if (!this.audio && value && this.started) {
      this.startFromGesture();
      this.notify();
      return;
    }
    if (this.audio) {
      this.audio.volume = this.currentVolume();
      if (value && this.started) {
        void this.audio.play().catch(() => undefined);
      } else {
        this.audio.pause();
      }
    }
    this.notify();
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  pause(): void {
    this.audio?.pause();
  }
}

export const backgroundMusic = new BackgroundMusicManager();
