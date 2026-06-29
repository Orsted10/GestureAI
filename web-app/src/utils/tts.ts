import { TextToSpeech } from '@capacitor-community/text-to-speech';

export class TTSManager {
  private bestVoiceIdx: number | undefined = undefined;

  constructor() {
    this.pickBestVoice();
  }

  /** On native Android/iOS: pick the highest-quality English voice available */
  private async pickBestVoice() {
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      if (!voices || voices.length === 0) return;

      const english = voices.filter(v =>
        v.lang?.toLowerCase().startsWith('en')
      );

      if (english.length === 0) return;

      // Priority order: WaveNet / Neural > Enhanced > Premium > Google > first en
      const priorities = [
        /wavenet/i, /neural/i, /enhanced/i, /premium/i, /google/i,
      ];

      let best: any = null;
      for (const pattern of priorities) {
        best = english.find(v => pattern.test(v.name));
        if (best) break;
      }
      if (!best) best = english[0];

      this.bestVoiceIdx = voices.indexOf(best);
      console.log(`[TTS] Using voice: "${best.name}" (index ${this.bestVoiceIdx})`);
    } catch {
      // Not running on native — web fallback will be used
    }
  }

  public async speak(text: string) {
    if (!text) return;
    try {
      const params: Parameters<typeof TextToSpeech.speak>[0] = {
        text,
        lang: 'en-US',
        rate:   0.88,   // Slightly slower = more natural
        pitch:  0.92,   // Slightly lower = warmer, less robotic
        volume: 1.0,
      };
      if (this.bestVoiceIdx !== undefined) {
        (params as any).voice = this.bestVoiceIdx;
      }
      await TextToSpeech.speak(params);
    } catch {
      // Native TTS unavailable (web browser) — use Web Speech API
      this.webSpeak(text);
    }
  }

  /** High-quality Web Speech API fallback for desktop browsers */
  private webSpeak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any in-progress utterance first
    window.speechSynthesis.cancel();

    const utter  = new SpeechSynthesisUtterance(text);
    utter.lang   = 'en-US';
    utter.rate   = 0.88;
    utter.pitch  = 0.92;
    utter.volume = 1.0;

    // Pick the best available voice in the browser
    const voices  = window.speechSynthesis.getVoices();
    const english = voices.filter(v => v.lang.startsWith('en'));

    const priority = [
      /google us english/i,
      /google uk english/i,
      /samantha/i,
      /karen/i,
      /daniel/i,
      /google/i,
      /premium/i,
      /enhanced/i,
      /wavenet/i,
    ];

    let best: SpeechSynthesisVoice | undefined;
    for (const p of priority) {
      best = english.find(v => p.test(v.name));
      if (best) break;
    }
    if (!best) best = english[0] || voices[0];
    if (best) utter.voice = best;

    window.speechSynthesis.speak(utter);
  }

  public stop() {
    try { TextToSpeech.stop(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }
}
