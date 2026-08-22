import { assetUrl } from "../utils/assets";

const MUSIC_KEY = "happy-alphabet-music-v1";
const NORMAL_VOLUME = 0.12;
const DUCK_VOLUME = 0.05;
const MUSIC_SRC = "/audio/music/background.wav";

class BackgroundMusicManager {
  private audio: HTMLAudioElement | null = null;
  private enabled = true;
  private started = false;
  private ducking = false;
  private fadeTimer: number | null = null;
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

  private targetVolume(): number {
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
      audio.volume = this.targetVolume();
      this.audio = audio;
    }
    return this.audio;
  }

  private fadeTo(target: number, ms = 320): void {
    if (!this.audio) {
      return;
    }
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    const audio = this.audio;
    const start = audio.volume;
    if (Math.abs(start - target) < 0.004) {
      audio.volume = target;
      return;
    }
    const steps = Math.max(6, Math.round(ms / 32));
    let step = 0;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const t = step / steps;
      const eased = t * t * (3 - 2 * t);
      audio.volume = start + (target - start) * eased;
      if (step >= steps) {
        audio.volume = target;
        if (this.fadeTimer !== null) {
          window.clearInterval(this.fadeTimer);
          this.fadeTimer = null;
        }
      }
    }, 32);
  }

  startFromGesture(): void {
    if (this.started && this.audio && !this.audio.paused) {
      return;
    }
    this.started = true;
    if (!this.enabled) {
      return;
    }
    const audio = this.ensureAudio();
    if (!audio.paused && !audio.ended) {
      return;
    }
    audio.volume = this.targetVolume();
    void audio.play().catch(() => {
      // Autoplay can still fail; next gesture retries.
    });
  }

  duck(): void {
    this.ducking = true;
    this.fadeTo(this.targetVolume(), 280);
  }

  unduck(): void {
    this.ducking = false;
    this.fadeTo(this.targetVolume(), 420);
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
      this.fadeTo(this.targetVolume(), 240);
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
