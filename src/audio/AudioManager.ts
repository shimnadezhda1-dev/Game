class AudioManager {
  private enabled = true;

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) {
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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  cheer(): void {
    this.speak("Молодец!");
  }
}

export const audioManager = new AudioManager();
