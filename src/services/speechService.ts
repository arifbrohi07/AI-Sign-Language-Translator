export class SpeechService {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;

  public static isSupported(): boolean {
    return this.synth !== null;
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public static speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onEnd?: () => void;
    } = {}
  ): boolean {
    if (!this.synth || !text || !text.trim()) {
      return false;
    }

    try {
      this.synth.cancel(); // Cancel any existing speech

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      if (options.voiceURI) {
        const voices = this.getVoices();
        const selected = voices.find((v) => v.voiceURI === options.voiceURI);
        if (selected) {
          utterance.voice = selected;
        }
      }

      if (options.onEnd) {
        utterance.onend = options.onEnd;
      }

      this.synth.speak(utterance);
      return true;
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      return false;
    }
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
