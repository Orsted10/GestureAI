export class TTSManager {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initVoice();
    
    // Voices might load asynchronously in some browsers
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.initVoice.bind(this);
    }
  }

  private initVoice() {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Prefer high-quality, soothing English voices (Google US English, Microsoft Zira, etc.)
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira',
      'Samantha',
      'Victoria',
      'Karen',
      'Tessa'
    ];

    let selectedVoice = voices.find(v => preferredVoices.some(p => v.name.includes(p)));

    // Fallback to any English female voice if preferred is not found
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Woman')));
    }

    // Fallback to the first available English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }

    this.voice = selectedVoice || voices[0];
  }

  public speak(text: string) {
    if (this.synth.speaking) {
      // Don't interrupt if it's already saying this exact text
      // Or maybe we want to interrupt for fast updates? Let's just avoid overlapping spam
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    // Make it sound more soothing
    utterance.pitch = 1.0; 
    utterance.rate = 0.9;
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }
}
