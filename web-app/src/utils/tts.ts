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

  public async speak(text: string, voicePref: 'female' | 'male' = 'female'): Promise<void> {
    if (!text) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        await this.webSpeak(text, voicePref);
        return;
      } catch (e) {
        console.log('[TTS] Web Speech failed', e);
      }
    }
  }

  private webSpeak(text: string, voicePref: 'female' | 'male'): Promise<void> {
    return new Promise((resolve, reject) => {
      const synth = window.speechSynthesis;
      synth.cancel(); 

      const utter      = new SpeechSynthesisUtterance(text);
      utter.lang       = 'en-IN';
      utter.rate       = 0.90;  
      utter.pitch      = voicePref === 'female' ? 1.2 : 0.8;   
      utter.volume     = 1.0;

      const voices = synth.getVoices();
      let best = voices.find(v => v.lang.startsWith('en-IN') && v.name.toLowerCase().includes(voicePref));
      if (!best) best = voices.find(v => v.lang.startsWith('en-IN'));
      if (!best) best = voices.find(v => v.lang.startsWith('en'));

      if (best) utter.voice = best;

      utter.onend   = () => resolve();
      utter.onerror = e => {
        if (e.error === 'interrupted') resolve(); else reject(e);
      };

      synth.speak(utter);
    });
  }

  public stop() {
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
  }
}
