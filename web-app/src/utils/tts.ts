import { TextToSpeech } from '@capacitor-community/text-to-speech';

export class TTSManager {
  constructor() {
    // No initialization needed for the native plugin
  }

  public async speak(text: string) {
    try {
      await TextToSpeech.speak({
        text: text,
        lang: 'en-US',
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
      });
    } catch (e) {
      console.error('[GestureAI] Native TTS failed:', e);
      // Fallback to Web Speech API if native fails (e.g. running in web browser)
      this.webFallbackSpeak(text);
    }
  }

  private webFallbackSpeak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}
