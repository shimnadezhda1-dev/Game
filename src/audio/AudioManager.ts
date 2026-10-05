import { assetUrl } from "../utils/assets";
import { getLetterPronunciation } from "../data/letterRegistry";
import { backgroundMusic } from "./BackgroundMusicManager";
import { resolveRuVoicePath } from "./ruVoiceBank";
import { VOICE_FILES, type VoiceKey } from "./voiceCatalog";

export interface SpeakOptions {
  key?: VoiceKey | string;
  path?: string;
  onEnd?: () => void;
  allowTts?: boolean;
}

function voiceLog(event: string, path?: string): void {
  if (!import.meta.env.DEV) {
    return;
  }
  console.info(path ? `${event} ${path}` : event);
}

function softenText(text: string): string {
  return text.replace(/[А-ЯЁ]/g, (letter) => getLetterPronunciation(letter) ?? letter);
}

function splitChunks(text: string): string[] {
  return text
    .split(/(?<=[!?…])\s+|\n+|(?<=\.)\s+(?=[А-ЯA-Z])/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export const RUSSIAN_TTS = {
  lang: "ru-RU",
  rate: 0.92,
  pitch: 1.06,
  volume: 1
} as const;

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const russian = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ru"));
  return russian.find((voice) => voice.default) ?? null;
}

class AudioManager {
  private enabled = true;
  private voice: SpeechSynthesisVoice | null = null;
  private audioContext: AudioContext | null = null;
  private clip: HTMLAudioElement | null = null;
  private voiceBusy = false;
  private missing = new Set<string>();
  private endTimer: number | null = null;
  private chunkTimer: number | null = null;
  private token = 0;
  private finishedToken = -1;
  private startedTts = -1;
  private voicesReady: Promise<void> = Promise.resolve();
  private lastVoicePath = "";

  constructor() {
    if ("speechSynthesis" in window) {
      this.voicesReady = new Promise((resolve) => {
        const apply = () => {
          const voices = window.speechSynthesis.getVoices();
          if (!voices.length) {
            return;
          }
          this.voice = pickVoice(voices);
          resolve();
        };
        apply();
        window.speechSynthesis.addEventListener("voiceschanged", apply);
      });
    }
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) {
      this.stopSpeaking();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  lastPlayedPath(): string {
    return this.lastVoicePath;
  }

  isVoiceBusy(): boolean {
    return this.voiceBusy;
  }

  playVoice(path: string, onEnd?: () => void): void {
    this.speak("", { path, onEnd });
  }

  playVoiceAndWait(path: string): Promise<void> {
    return new Promise((resolve) => {
      this.speak("", {
        path,
        onEnd: () => resolve()
      });
    });
  }

  speak(text: string, options: SpeakOptions = {}): void {
    if (!this.enabled) {
      options.onEnd?.();
      return;
    }
    this.stopSpeaking();
    const token = ++this.token;
    backgroundMusic.duck();
    const resolved = resolveRuVoicePath(options.key, options.path);
    const fallbackListed = options.key ? VOICE_FILES[options.key as VoiceKey] : undefined;
    const path = resolved ?? fallbackListed;
    if (path && !this.missing.has(path)) {
      this.playVoiceFile(path, token, options.onEnd);
      return;
    }
    if (options.allowTts) {
      this.speakTts(text, token, options.onEnd);
      return;
    }
    voiceLog("VOICE SKIP (no mp3, tts disabled)", options.key ?? options.path);
    this.finish(options.onEnd);
  }

  private detachVoiceHandlers(audio: HTMLAudioElement): void {
    audio.onended = null;
    audio.onerror = null;
    audio.onpause = null;
  }

  private resetVoiceElement(): void {
    const audio = this.clip;
    if (!audio) {
      return;
    }
    this.detachVoiceHandlers(audio);
    audio.pause();
    audio.removeAttribute("src");
    try {
      audio.load();
    } catch {
      // Ignore reset errors on detached elements.
    }
    this.clip = null;
  }

  private playVoiceFile(path: string, token: number, onEnd?: () => void): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.resetVoiceElement();
    const audio = new Audio();
    audio.preload = "auto";
    this.clip = audio;
    this.lastVoicePath = path;
    this.voiceBusy = true;
    voiceLog("VOICE PLAY", path);

    const fail = () => {
      if (token !== this.token) {
        return;
      }
      this.missing.add(path);
      this.voiceBusy = false;
      voiceLog("VOICE ERROR", path);
      this.finish(onEnd);
    };

    audio.onended = () => {
      if (token !== this.token) {
        return;
      }
      voiceLog("VOICE ENDED", path);
      this.voiceBusy = false;
      this.finish(onEnd);
    };
    audio.onerror = fail;

    let started = false;
    const startPlayback = () => {
      if (started || token !== this.token) {
        return;
      }
      started = true;
      window.setTimeout(() => {
        if (token !== this.token) {
          return;
        }
        void audio.play().catch(fail);
      }, 40);
    };

    this.endTimer = window.setTimeout(() => {
      if (token !== this.token) {
        return;
      }
      this.voiceBusy = false;
      voiceLog("VOICE TIMEOUT", path);
      this.finish(onEnd);
    }, 12000);

    audio.addEventListener("canplaythrough", startPlayback, { once: true });
    audio.addEventListener("canplay", startPlayback, { once: true });
    audio.src = assetUrl(path);
    audio.load();
  }

  private speakTts(text: string, token: number, onEnd?: () => void): void {
    if (this.startedTts === token) {
      return;
    }
    this.startedTts = token;
    if (!("speechSynthesis" in window)) {
      if (token === this.token) {
        this.finish(onEnd);
      }
      return;
    }
    const chunks = splitChunks(text);
    if (!chunks.length) {
      this.finish(onEnd);
      return;
    }
    const voiceWait = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 800);
    });
    void Promise.race([this.voicesReady, voiceWait]).then(() => {
      if (token === this.token) {
        this.speakTtsChunk(chunks, 0, token, onEnd);
      }
    });
  }

  private speakTtsChunk(chunks: string[], index: number, token: number, onEnd?: () => void): void {
    if (token !== this.token) {
      return;
    }
    if (index >= chunks.length) {
      this.finish(onEnd);
      return;
    }
    if (this.endTimer !== null) {
      window.clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    const utterance = new SpeechSynthesisUtterance(softenText(chunks[index]));
    utterance.lang = RUSSIAN_TTS.lang;
    utterance.rate = RUSSIAN_TTS.rate;
    utterance.pitch = RUSSIAN_TTS.pitch;
    utterance.volume = RUSSIAN_TTS.volume;
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang || RUSSIAN_TTS.lang;
    }
    utterance.onend = () => {
      if (token !== this.token) {
        return;
      }
      const pause = index + 1 < chunks.length ? 380 : 40;
      this.chunkTimer = window.setTimeout(() => {
        this.speakTtsChunk(chunks, index + 1, token, onEnd);
      }, pause);
    };
    utterance.onerror = () => {
      // Interrupted or cancelled utterances should not end the whole line.
    };
    window.speechSynthesis.speak(utterance);
    const estimated = Math.min(5000, Math.max(1200, softenText(chunks[index]).length * 95));
    this.endTimer = window.setTimeout(() => {
      if (token === this.token && index === chunks.length - 1) {
        this.finish(onEnd);
      } else if (token === this.token) {
        this.speakTtsChunk(chunks, index + 1, token, onEnd);
      }
    }, estimated + 450);
  }

  private finish(onEnd?: () => void): void {
    if (this.finishedToken === this.token) {
      return;
    }
    this.finishedToken = this.token;
    if (this.endTimer !== null) {
      window.clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    if (this.chunkTimer !== null) {
      window.clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    backgroundMusic.unduck();
    onEnd?.();
  }

  playSuccess(): void {
    this.playChime([523, 659, 784], 0.1);
  }

  playTryAgain(): void {
    this.playChime([392, 349], 0.12);
  }

  private playChime(freqs: number[], duration: number): void {
    if (!this.enabled) {
      return;
    }
    try {
      this.audioContext ??= new AudioContext();
      const ctx = this.audioContext;
      void ctx.resume();
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const start = ctx.currentTime + index * duration;
        gain.gain.exponentialRampToValueAtTime(0.06, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + 0.08);
        osc.start(start);
        osc.stop(start + duration + 0.1);
      });
    } catch {
      // Ignore audio context errors on locked browsers.
    }
  }

  stopSpeaking(): void {
    this.token += 1;
    this.voiceBusy = false;
    voiceLog("VOICE STOP");
    if (this.endTimer !== null) {
      window.clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    if (this.chunkTimer !== null) {
      window.clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    this.resetVoiceElement();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    backgroundMusic.unduck();
  }
}

export const audioManager = new AudioManager();

export function speakRussian(text: string, options: SpeakOptions = {}): void {
  audioManager.speak(text, options);
}

export function playVoice(path: string, onEnd?: () => void): void {
  audioManager.playVoice(path, onEnd);
}

export function playVoiceAndWait(path: string): Promise<void> {
  return audioManager.playVoiceAndWait(path);
}
