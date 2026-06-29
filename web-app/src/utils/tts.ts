/**
 * TTSManager — uses the Web Speech API as PRIMARY for best voice quality.
 * Android WebView / Chrome both have access to Google's neural TTS voices via
 * the standard speechSynthesis API. Capacitor TTS is only a fallback.
 */
export class TTSManager {
  private voice: SpeechSynthesisVoice | null = null;
  private ready = false;

  constructor() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    // Voices may not be loaded immediately — try now, then re-try on event
    this.selectBestVoice();
    window.speechSynthesis.onvoiceschanged = () => this.selectBestVoice();
  }

  private selectBestVoice() {
    const all = window.speechSynthesis?.getVoices() ?? [];
    if (!all.length) return;

    const en = all.filter(v => v.lang.startsWith('en'));

    // Ordered preference list — Chrome/Android WebView → best Google neural voices
    const patterns = [
      /google us english/i,        // Chrome desktop  — best quality
      /en-us-wavenet/i,            // WaveNet neural
      /en-us-neural/i,
      /google uk english female/i,
      /google.*english/i,
      /samantha/i,                  // macOS premium voice
      /karen/i,
      /moira/i,
      /en-us/i,
      /en-gb/i,
    ];

    for (const pat of patterns) {
      const match = en.find(v => pat.test(v.name));
      if (match) { this.voice = match; break; }
    }

    if (!this.voice) this.voice = en[0] ?? all[0] ?? null;
    this.ready = true;
    console.log('[TTS] Voice selected:', this.voice?.name, this.voice?.lang);
  }

  public async speak(text: string): Promise<void> {
    if (!text) return;

    // ── Primary: Web Speech API (Google neural voices in Chrome + WebView) ──
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        await this.webSpeak(text);
        return;
      } catch {
        // fall through to Capacitor fallback
      }
    }

    // ── Fallback: Capacitor native TTS plugin ─────────────────────────────
    try {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      await TextToSpeech.speak({ text, lang: 'en-US', rate: 1.0, pitch: 1.0, volume: 1.0 });
    } catch { /* ignore */ }
  }

  private webSpeak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const synth = window.speechSynthesis;
      synth.cancel(); // stop anything already playing

      const utter      = new SpeechSynthesisUtterance(text);
      utter.lang       = 'en-US';
      utter.rate       = 0.95;  // very close to natural speed
      utter.pitch      = 1.0;   // normal pitch — avoid robotic low pitch
      utter.volume     = 1.0;

      // Attach the best voice we found
      if (!this.ready) this.selectBestVoice(); // retry if voices just loaded
      if (this.voice) utter.voice = this.voice;

      utter.onend   = () => resolve();
      utter.onerror = e => {
        // 'interrupted' is not a real error — just cancelled by a new utterance
        if (e.error === 'interrupted') resolve(); else reject(e);
      };

      synth.speak(utter);
    });
  }

  public stop() {
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
  }
}
