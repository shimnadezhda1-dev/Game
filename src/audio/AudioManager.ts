const FEMALE_HINTS = [
  "irina",
  "milena",
  "katya",
  "elena",
  "alena",
  "aliona",
  "anna",
  "tanya",
  "tatyana",
  "natalia",
  "oksana",
  "marina",
  "svetlana",
  "dasha",
  "female",
  "woman",
  "girl"
];

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  if (lang.startsWith("ru")) score += 20;
  if (lang === "ru-ru") score += 8;
  if (FEMALE_HINTS.some((hint) => name.includes(hint))) score += 25;
  if (voice.localService) score += 4;
  if (name.includes("google")) score += 3;
  if (name.includes("microsoft")) score += 2;
  if (name.includes("premium") || name.includes("neural") || name.includes("natural")) score += 6;
  if (name.includes("male") || name.includes("dmitri") || name.includes("yuri") || name.includes("pavel")) {
    score -= 20;
  }

  return score;
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return ranked[0] ?? null;
}

class AudioManager {
  private enabled = true;
  private voice: SpeechSynthesisVoice | null = null;
  private voicesReady: Promise<void>;

  constructor() {
    this.voicesReady = this.loadVoices();
  }

  private loadVoices(): Promise<void> {
    if (!("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    const apply = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        this.voice = pickVoice(voices);
      }
    };

    apply();

    return new Promise((resolve) => {
      if (this.voice) {
        resolve();
        return;
      }

      const onReady = () => {
        apply();
        window.speechSynthesis.removeEventListener("voiceschanged", onReady);
        resolve();
      };

      window.speechSynthesis.addEventListener("voiceschanged", onReady);
      window.setTimeout(onReady, 700);
    });
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  speak(text: string): void {
    if (!this.enabled || !("speechSynthesis" in window)) {
      return;
    }

    void this.voicesReady.then(() => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = 0.82;
      utterance.pitch = 1.22;
      utterance.volume = 1;
      if (this.voice) {
        utterance.voice = this.voice;
        utterance.lang = this.voice.lang || "ru-RU";
      }

      window.setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 40);
    });
  }

  cheer(): void {
    this.speak("Молодец!");
  }
}

export const audioManager = new AudioManager();
