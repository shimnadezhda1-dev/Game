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

function googleTtsUrl(text: string): string {
  const query = new URLSearchParams({
    ie: "UTF-8",
    tl: "ru",
    client: "tw-ob",
    q: text
  });
  return `https://translate.google.com/translate_tts?${query.toString()}`;
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
  private currentAudio: HTMLAudioElement | null = null;
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
    if (!this.enabled) {
      return;
    }

    this.stop();
    const spoken = softenText(text);
    const audio = new Audio(googleTtsUrl(spoken));
    audio.preload = "auto";
    this.currentAudio = audio;

    let usedFallback = false;
    const fallback = () => {
      if (usedFallback || this.currentAudio !== audio) {
        return;
      }
      usedFallback = true;
      this.speakNative(spoken);
    };

    const timeoutId = window.setTimeout(() => {
      if (audio.readyState < 2) {
        fallback();
      }
    }, 1200);

    audio.addEventListener("playing", () => window.clearTimeout(timeoutId));
    audio.addEventListener("error", fallback);
    const playResult = audio.play();
    if (playResult) {
      playResult.catch(fallback);
    }
  }

  playSuccess(): void {
    this.playChime([523, 659, 784], 0.12);
  }

  playTryAgain(): void {
    this.playChime([392, 349], 0.14);
  }

  private speakNative(text: string): void {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
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
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  cheer(): void {
    this.speak("Молодец!");
  }
}

export const audioManager = new AudioManager();
