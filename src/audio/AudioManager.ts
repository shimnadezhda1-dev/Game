const LETTER_SOUNDS: Record<string, string> = {
  А: "а",
  Б: "бэ",
  В: "вэ",
  Г: "гэ",
  Д: "дэ"
};

function softenText(text: string): string {
  return text.replace(/[АБВГД]/g, (letter) => LETTER_SOUNDS[letter] ?? letter);
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const russian = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ru"));
  const pool = russian.length ? russian : voices;
  const preferred = pool.find((voice) => /google/i.test(voice.name));
  return preferred ?? pool.find((voice) => /neural|natural|premium/i.test(voice.name)) ?? pool[0] ?? null;
}

class AudioManager {
  private enabled = true;
  private voice: SpeechSynthesisVoice | null = null;
  private audioContext: AudioContext | null = null;

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
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  speak(text: string): void {
    if (!this.enabled || !("speechSynthesis" in window)) {
      return;
    }
    this.stop();
    const utterance = new SpeechSynthesisUtterance(softenText(text));
    utterance.lang = "ru-RU";
    utterance.rate = 0.92;
    utterance.pitch = 1.04;
    utterance.volume = 1;
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang || "ru-RU";
    }
    window.speechSynthesis.speak(utterance);
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

  private stop(): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioManager = new AudioManager();
