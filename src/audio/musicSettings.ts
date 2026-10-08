export type MusicMode = "builtin" | "custom" | "off";

export interface MusicSettings {
  mode: MusicMode;
  volume: number;
  customName: string | null;
  customPersist: "indexeddb" | "session" | null;
}

export const MUSIC_SETTINGS_KEY = "happy-alphabet-music-settings-v1";
export const LEGACY_MUSIC_KEY = "happy-alphabet-music-v1";

export const DEFAULT_MUSIC_VOLUME = 0.2;

export const defaultMusicSettings: MusicSettings = {
  mode: "builtin",
  volume: DEFAULT_MUSIC_VOLUME,
  customName: null,
  customPersist: null
};

function clampVolume(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_MUSIC_VOLUME;
  }
  return Math.min(1, Math.max(0, value));
}

function validMode(value: unknown): value is MusicMode {
  return value === "builtin" || value === "custom" || value === "off";
}

export function loadMusicSettings(): MusicSettings {
  try {
    const raw = localStorage.getItem(MUSIC_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MusicSettings>;
      return {
        mode: validMode(parsed.mode) ? parsed.mode : defaultMusicSettings.mode,
        volume: clampVolume(parsed.volume),
        customName: typeof parsed.customName === "string" ? parsed.customName : null,
        customPersist:
          parsed.customPersist === "indexeddb" || parsed.customPersist === "session"
            ? parsed.customPersist
            : null
      };
    }
    const legacy = localStorage.getItem(LEGACY_MUSIC_KEY);
    if (legacy === "off") {
      return { ...defaultMusicSettings, mode: "off" };
    }
    return { ...defaultMusicSettings };
  } catch {
    return { ...defaultMusicSettings };
  }
}

export function saveMusicSettings(settings: MusicSettings): void {
  try {
    localStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(LEGACY_MUSIC_KEY, settings.mode === "off" ? "off" : "on");
  } catch {
    // Ignore quota / private-mode failures.
  }
}
