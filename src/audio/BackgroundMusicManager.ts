import { assetUrl } from "../utils/assets";
import {
  clearCustomTrack,
  displayMusicName,
  loadCustomTrack,
  saveCustomTrack,
  type CustomTrack
} from "./customMusicStore";
import {
  DEFAULT_MUSIC_VOLUME,
  loadMusicSettings,
  saveMusicSettings,
  type MusicMode,
  type MusicSettings
} from "./musicSettings";

const BUILTIN_SRC = "/audio/music/background.wav";
const DUCK_RATIO = 0.35;

class BackgroundMusicManager {
  private audio: HTMLAudioElement | null = null;
  private settings: MusicSettings = loadMusicSettings();
  private lastActiveMode: MusicMode = this.settings.mode === "off" ? "builtin" : this.settings.mode;
  private started = false;
  private ducking = false;
  private fadeTimer: number | null = null;
  private blobUrl: string | null = null;
  private loadedSrc: string | null = null;
  private customTrack: CustomTrack | null = null;
  private persistWarning: string | null = null;
  private formatError: string | null = null;
  private listeners = new Set<() => void>();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.restoreCustom();
  }

  private async restoreCustom(): Promise<void> {
    const track = await loadCustomTrack();
    if (track) {
      this.customTrack = track;
      this.settings = {
        ...this.settings,
        customName: displayMusicName(track.name),
        customPersist: this.settings.customPersist ?? "indexeddb"
      };
    } else if (this.settings.mode === "custom") {
      this.persistWarning =
        "Выбранный файл недоступен. Можно выбрать его снова — он хранится только на этом устройстве.";
    }
    this.notify();
  }

  isEnabled(): boolean {
    return this.settings.mode !== "off";
  }

  getMode(): MusicMode {
    return this.settings.mode;
  }

  getVolume(): number {
    return this.settings.volume;
  }

  getCustomName(): string | null {
    return this.settings.customName;
  }

  getPersistWarning(): string | null {
    return this.persistWarning;
  }

  getFormatError(): string | null {
    return this.formatError;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private persist(): void {
    saveMusicSettings(this.settings);
  }

  private duckVolume(): number {
    return this.settings.volume * DUCK_RATIO;
  }

  private targetVolume(): number {
    if (this.settings.mode === "off") {
      return 0;
    }
    return this.ducking ? this.duckVolume() : this.settings.volume;
  }

  private currentSrc(): string | null {
    if (this.settings.mode === "off") {
      return null;
    }
    if (this.settings.mode === "custom") {
      if (!this.customTrack) {
        return null;
      }
      if (!this.blobUrl) {
        this.blobUrl = URL.createObjectURL(this.customTrack.blob);
      }
      return this.blobUrl;
    }
    return assetUrl(BUILTIN_SRC);
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = this.targetVolume();
      audio.addEventListener("error", () => {
        if (this.settings.mode === "custom") {
          this.formatError = "Этот файл не удалось воспроизвести. Попробуйте MP3, M4A, AAC или WAV.";
          this.notify();
        }
      });
      this.audio = audio;
    }
    return this.audio;
  }

  private applySource(): void {
    const audio = this.ensureAudio();
    const src = this.currentSrc();
    if (!src) {
      audio.pause();
      return;
    }
    if (this.loadedSrc !== src) {
      audio.pause();
      audio.src = src;
      audio.loop = true;
      this.loadedSrc = src;
      audio.load();
    }
    audio.volume = this.targetVolume();
  }

  private fadeTo(target: number, ms: number): void {
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
    this.started = true;
    if (this.settings.mode === "off") {
      return;
    }
    void this.ready.then(() => {
      this.applySource();
      const audio = this.audio;
      if (!audio || this.settings.mode === "off") {
        return;
      }
      if (!this.currentSrc()) {
        return;
      }
      if (!audio.paused && !audio.ended) {
        this.fadeTo(this.targetVolume(), 240);
        return;
      }
      audio.volume = this.targetVolume();
      void audio.play().catch(() => {
        // Autoplay can still fail; next gesture retries. Do not log as an error.
      });
    });
  }

  duck(): void {
    this.ducking = true;
    this.fadeTo(this.targetVolume(), 280);
  }

  unduck(): void {
    this.ducking = false;
    this.fadeTo(this.targetVolume(), 480);
  }

  setMode(mode: MusicMode): void {
    if (mode !== "off") {
      this.lastActiveMode = mode;
    }
    this.settings = { ...this.settings, mode };
    this.persist();
    this.formatError = null;
    if (mode === "off") {
      this.audio?.pause();
      this.fadeTo(0, 240);
      this.notify();
      return;
    }
    this.applySource();
    if (this.started) {
      this.startFromGesture();
    }
    this.notify();
  }

  setVolume(volume: number): void {
    this.settings = {
      ...this.settings,
      volume: Math.min(1, Math.max(0, volume))
    };
    this.persist();
    this.fadeTo(this.targetVolume(), 160);
    this.notify();
  }

  async setCustomFile(file: File): Promise<void> {
    const track: CustomTrack = {
      name: displayMusicName(file.name) || "melody",
      type: file.type || "audio/mpeg",
      blob: file
    };
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.customTrack = track;
    this.formatError = null;
    const persist = await saveCustomTrack(track);
    this.settings = {
      ...this.settings,
      mode: "custom",
      customName: track.name,
      customPersist: persist
    };
    this.persistWarning =
      persist === "session"
        ? "Браузер не смог надолго сохранить файл. Музыка играет в этой сессии; после закрытия вкладки её нужно выбрать снова."
        : null;
    this.persist();
    this.applySource();
    if (this.started) {
      this.startFromGesture();
    }
    this.notify();
  }

  async clearCustomFile(): Promise<void> {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.customTrack = null;
    await clearCustomTrack();
    this.settings = { ...this.settings, customName: null, customPersist: null };
    if (this.settings.mode === "custom") {
      this.settings = { ...this.settings, mode: "builtin" };
    }
    this.persistWarning = null;
    this.persist();
    this.applySource();
    if (this.started && this.settings.mode !== "off") {
      this.startFromGesture();
    }
    this.notify();
  }

  toggle(): void {
    this.setMode(this.settings.mode === "off" ? "builtin" : "off");
  }

  setEnabled(value: boolean): void {
    this.setMode(value ? this.lastActiveMode : "off");
  }

  pause(): void {
    this.audio?.pause();
  }
}

export const backgroundMusic = new BackgroundMusicManager();
export { DEFAULT_MUSIC_VOLUME };
