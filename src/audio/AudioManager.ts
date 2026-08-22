import { assetUrl } from "../utils/assets";
import { backgroundMusic } from "./BackgroundMusicManager";
import { VOICE_FILES, type VoiceKey } from "./voiceCatalog";

const LETTER_SOUNDS: Record<string, string> = {
  А: "а",
  Б: "бэ",
  В: "вэ",
  Г: "гэ",
  Д: "дэ"
};

export interface SpeakOptions {
  key?: VoiceKey | string;
  onEnd?: () => void;
}

function softenText(text: string): string {
  return text.replace(/[АБВГД]/g, (letter) => LETTER_SOUNDS[letter] ?? letter);
}

function isFemaleVoice(name: string): boolean {
  return /irina|milena|elena|oksana|katya|alena|anna|tanya|maria|marina|female|женск|google/i.test(
    name
  );
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const russian = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ru"));
  const pool = russian.length ? russian : voices;
  const female = pool.find((voice) => isFemaleVoice(voice.name));
  if (female) {
    return female;
  }
  return pool.find((voice) => /neural|natural|premium/i.test(voice.name)) ?? pool[0] ?? null;
}

class AudioManager {
  private enabled = true;
  private voice: SpeechSynthesisVoice | null = null;
  private audioContext: AudioContext | null = null;
  private clip: HTMLAudioElement | null = null;
  private missing = new Set<string>();
  private endTimer: number | null = null;
  private token = 0;
  private lastText = "";
  private finishedToken = -1;
  private startedTts = -1;
  private skipVoiceFiles = false;

  constructor() {
    if ("speechSynthesis" in window) {
      const apply = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length) {
          this.voice = pickVoice(voices);
        }
      };
      apply();
      window.speechSynthesis.addEventListener("voiceschanged", apply);
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

  speak(text: string, options: SpeakOptions = {}): void {
    if (!this.enabled) {
      options.onEnd?.();
      return;
    }
    this.stopSpeaking();
    this.lastText = text;
    const token = ++this.token;
    backgroundMusic.duck();
    const key = options.key;
    if (key && !this.skipVoiceFiles && !this.missing.has(key)) {
      this.playVoiceFile(key, token, options.onEnd);
      return;
    }
    this.speakTts(text, token, options.onEnd);
  }

  private playVoiceFile(key: string, token: number, onEnd?: () => void): void {
    const listed = VOICE_FILES[key as VoiceKey];
    const path = listed ?? `/audio/voice/${key}.mp3`;
    const audio = new Audio(assetUrl(path));
    this.clip = audio;
    audio.onended = () => {
      if (token === this.token) {
        this.finish(onEnd);
      }
    };
    audio.onerror = () => {
      this.missing.add(key);
      this.skipVoiceFiles = true;
      this.clip = null;
      if (token === this.token) {
        this.speakTts(this.lastText, token, onEnd);
      }
    };
    void audio.play().catch(() => {
      this.missing.add(key);
      this.skipVoiceFiles = true;
      if (token === this.token) {
        this.speakTts(this.lastText, token, onEnd);
      }
    });
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
    const utterance = new SpeechSynthesisUtterance(softenText(text));
    utterance.lang = "ru-RU";
    utterance.rate = 0.78;
    utterance.pitch = 1.08;
    utterance.volume = 1;
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang || "ru-RU";
    }
    utterance.onend = () => {
      if (token === this.token) {
        this.finish(onEnd);
      }
    };
    utterance.onerror = () => {
      if (token === this.token) {
        this.finish(onEnd);
      }
    };
    window.speechSynthesis.speak(utterance);
    const estimated = Math.min(8000, Math.max(2200, softenText(text).length * 90));
    this.endTimer = window.setTimeout(() => {
      if (token === this.token) {
        this.finish(onEnd);
      }
    }, estimated + 400);
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
    backgroundMusic.unduck();
    onEnd?.();
  }

  playSuccess(): void {
    this.playChime([523, 659, 784], 0.12);
  }

  playTryAgain(): void {
    this.playChime([392, 349], 0.14);
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
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + 0.08);
        osc.start(start);
        osc.stop(start + duration + 0.1);
      });
    } catch {
      // Ignore audio context errors on locked browsers.
    }
  }

  stopSpeaking(): void {
    if (this.endTimer !== null) {
      window.clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    if (this.clip) {
      this.clip.pause();
      this.clip.src = "";
      this.clip = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    backgroundMusic.unduck();
  }
}

export const audioManager = new AudioManager();
