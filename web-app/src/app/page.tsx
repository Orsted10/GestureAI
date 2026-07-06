'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import {
  Camera, Clipboard, Volume2, Trash2, ExternalLink,
  CheckCheck, Type, Zap, X, BarChart2, Hand, Radio, GraduationCap, MessageSquare,
  Moon, Sun, Activity, Sparkles, Globe, Heart, ChevronDown
} from 'lucide-react';
import { GESTURE_MAP, GESTURE_LIST, type GestureId } from '@/utils/fingerGestures';
import { ISL_MAP, type ISLWordId } from '@/utils/islGestures';
import LearnModePanel from '@/components/LearnModePanel';

// ── Lazy-load Unified Engine (client-only, heavy) ─────────────────────────────
const DetectorEngine = dynamic(() => import('@/components/DetectorEngine'), {
  ssr: false,
  loading: () => (
    <div className="detector-overlay">
      <div className="spinner animate-spin" />
      <p className="overlay-text animate-pulse">Initialising Camera Engine…</p>
    </div>
  ),
});

// ── TTS helper — dynamic import avoids SSR crash ──────────────────────────────
async function speakText(text: string, voicePref: 'female' | 'male' = 'female') {
  if (!text) return;
  try {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    await TextToSpeech.speak({ text, lang: 'en-IN', rate: 0.88, pitch: voicePref === 'female' ? 1.2 : 0.85, volume: 1.0 }); 
  } catch {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter  = new SpeechSynthesisUtterance(text);
    utter.lang   = 'en-IN'; 
    utter.rate   = 0.88;
    utter.pitch  = voicePref === 'female' ? 1.2 : 0.85;
    
    const voices = window.speechSynthesis.getVoices();
    const femaleNames = ['veena', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'zira', 'google us english', 'female', 'woman'];
    const maleNames = ['rishi', 'daniel', 'david', 'mark', 'arthur', 'male', 'man'];
    const targetNames = voicePref === 'female' ? femaleNames : maleNames;

    let best = voices.find(v => v.lang.startsWith('en-IN') && targetNames.some(n => v.name.toLowerCase().includes(n)));
    if (!best) best = voices.find(v => v.lang.startsWith('en') && targetNames.some(n => v.name.toLowerCase().includes(n)));
    if (!best) best = voices.find(v => v.lang.startsWith('en-IN'));
    if (!best) best = voices.find(v => v.lang.startsWith('en'));
    
    if (best) utter.voice = best;
    window.speechSynthesis.speak(utter);
  }
}

const PREDICTIONS: Record<string, string[]> = {
  'HELLO': ['how are you?', 'my friend'],
  'PLEASE': ['help me', 'wait a moment'],
  'SORRY': ['I am late', 'my friend'],
  'THANK YOU': ['so much', 'friend'],
  'TIME': ['to go', 'to eat'],
  'WATER': ['please', 'now'],
  'GOOD': ['morning', 'evening', 'night'],
  'BAD': ['news', 'idea'],
  'YES': [', please'],
  'NO': [', thank you'],
  'HELP': ['me please'],
  'I_LOVE_YOU': ['too'],
  'STOP': ['right now'],
};

type AppMode = 'asl' | 'isl' | 'custom';

export default function Home() {
  const [theme, setTheme]             = useState<'light' | 'dark'>('dark');
  const [mode, setMode]               = useState<AppMode>('asl');
  const [outputMode, setOutputMode]   = useState<'word' | 'sentence'>('sentence');
  const [voicePref, setVoicePref]     = useState<'female' | 'male'>('female');
  const [words, setWords]             = useState<string[]>([]);
  
  // Advanced features state
  const [startTime, setStartTime]     = useState<number | null>(null);
  const [targetLang, setTargetLang]   = useState<'en'|'hi'|'es'>('en');
  const [isLangOpen, setIsLangOpen]   = useState(false);
  const [isPolished, setIsPolished]   = useState(false);

  // Detection mode state
  const [currentSign, setCurrentSign]  = useState('');
  const [confidence, setConfidence]    = useState(0);
  const [commitProgress, setCommitProgress] = useState(0);

  // Custom gesture state
  const [activeGesture, setActiveGesture]    = useState<GestureId>('UNKNOWN');
  const [gestureProgress, setGestureProgress] = useState(0);

  const [copied, setCopied] = useState(false);

  // Learn Mode State
  const [isLearnMode, setIsLearnMode] = useState(false);
  const [aslDict, setAslDict] = useState<string[]>([]);
  const [islDict, setIslDict] = useState<string[]>([]);
  const [challengeWord, setChallengeWord] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [successTrigger, setSuccessTrigger] = useState(false);

  // Fetch Dictionaries on Load
  useEffect(() => {
    fetch('/signs.json')
      .then(async (aslRes) => {
        const aslJson = await aslRes.json();
        setAslDict(Object.values(aslJson));
        
        // Use heuristic map for ISL
        const islWords = Object.values(ISL_MAP)
          .filter(def => !def.isUtility)
          .map(def => def.phrase || def.label);
        setIslDict(islWords);
      })
      .catch(e => console.error(e));
  }, []);

  const getRandomChallenge = useCallback(() => {
    const dict = mode === 'isl' ? islDict : aslDict;
    if (!dict.length) return;
    const randomWord = dict[Math.floor(Math.random() * dict.length)];
    setChallengeWord(randomWord);
  }, [mode, aslDict, islDict]);

  useEffect(() => {
    if (isLearnMode && !challengeWord) getRandomChallenge();
  }, [isLearnMode, challengeWord, getRandomChallenge]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── ASL mode handlers ─────────────────────────────────────────────────────
  const handleWordDetected = useCallback((word: string) => {
    setCurrentSign(word);
    setCommitProgress(0);
    setWords(prev => {
      if (prev.length === 0) setStartTime(Date.now());
      setIsPolished(false);
      
      // Fingerspelling Logic: Stitch single letters together
      if (word.length === 1 && prev.length > 0 && prev[prev.length - 1].length === 1) {
        const lastWord = prev[prev.length - 1];
        // Replace the last single letter with the combined string
        return [...prev.slice(0, -1), lastWord + word];
      }
      
      return [...prev, word];
    });

    // Challenge check
    setChallengeWord(prevChallenge => {
      if (isLearnMode && prevChallenge && word.toLowerCase() === prevChallenge.toLowerCase()) {
        setSuccessTrigger(true);
        setScore(s => s + 100);
        setStreak(s => s + 1);
        setTimeout(() => {
          setSuccessTrigger(false);
          const dict = mode === 'isl' ? islDict : aslDict;
          const nextWord = dict[Math.floor(Math.random() * dict.length)];
          setChallengeWord(nextWord);
        }, 2000);
      } else if (isLearnMode && word) {
        setStreak(0);
      }
      return prevChallenge;
    });
  }, [isLearnMode, mode, islDict, aslDict]);

  const handleSignUpdate = useCallback((sign: string, conf: number, progress: number) => {
    setCurrentSign(sign);
    setConfidence(conf);
    setCommitProgress(progress);
  }, []);

  // ── Custom gesture handlers ───────────────────────────────────────────────
  const handleSentenceDetected = useCallback((phrase: string, gestureId: GestureId) => {
    setGestureProgress(0);

    // Utility gestures — action only, no TTS
    if (gestureId === 'FIST') {
      setWords(prev => prev.slice(0, -1));   // delete last word/phrase
      return;
    }
    if (gestureId === 'BOTH_FISTS') {
      setWords([]);                           // clear all
      return;
    }
    if (gestureId === 'THUMBS_UP') {
      handleReVoice();                        // Trigger Speech
      return;
    }
    if (gestureId === 'PEACE') {
      handlePolish();                         // Trigger Grammar Polish
      return;
    }

    // Phrase gesture — add to builder (TTS is handled inside FingerCountDetector)
    if (phrase) {
      setWords(prev => {
        if (prev.length === 0) setStartTime(Date.now());
        setIsPolished(false);
        return [...prev, phrase];
      });
    }
  }, []);

  const handleGestureUpdate = useCallback((gestureId: GestureId, progress: number) => {
    setActiveGesture(gestureId);
    setGestureProgress(progress);
  }, []);

  // ── Shared controls ───────────────────────────────────────────────────────
  const sentence  = words.join(' ');
  const wordCount = words.length;

  const handleCopy = () => {
    if (!sentence) return;
    navigator.clipboard.writeText(getTranslatedText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleReVoice    = () => speakText(getTranslatedText(), voicePref);
  const handleClear      = () => { setWords([]); setCurrentSign(''); setConfidence(0); setStartTime(null); setIsPolished(false); };
  const handleRemove     = (idx: number) => setWords(prev => prev.filter((_, i) => i !== idx));
  const handleRemoveLast = () => setWords(prev => prev.slice(0, -1));

  const applyPrediction = (pred: string) => {
    setWords(prev => {
      if (prev.length === 0) setStartTime(Date.now());
      const isPunctuation = pred.startsWith(',');
      const newWord = isPunctuation ? pred.trim() : ` ${pred.trim()}`;
      return [...prev, newWord];
    });
  };

  const getPredictions = () => {
    const s = sentence.trim().toUpperCase();
    if (!s) return [];
    
    // Context-Aware Smart Predictions based on Sentiment
    const sentimentObj = getSentiment();
    if (sentimentObj?.label === 'Urgent') {
      return ['call a doctor', 'need assistance', 'right away'];
    }
    if (sentimentObj?.label === 'Positive') {
      return ['how are you', 'have a good day', 'friend'];
    }
    
    // Fallback static predictions
    const keys = Object.keys(PREDICTIONS).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (s.endsWith(k)) return PREDICTIONS[k];
    }
    return [];
  };

  const getSentiment = () => {
    const s = sentence.toUpperCase();
    if (!s) return null;
    if (s.includes('SORRY') || s.includes('BAD')) return { label: 'Empathetic', icon: '😔', color: 'var(--amber)' };
    if (s.includes('GOOD') || s.includes('PERFECT') || s.includes('THANK') || s.includes('LOVE') || s.includes('YES')) return { label: 'Positive', icon: '😊', color: 'var(--emerald)' };
    if (s.includes('HELP') || s.includes('STOP') || s.includes('NO')) return { label: 'Urgent', icon: '🚨', color: 'var(--rose)' };
    return { label: 'Neutral', icon: '💬', color: 'var(--accent)' };
  };

  const handlePolish = () => {
    // Magic polish demo mock
    if (sentence.toUpperCase().includes('WATER') && sentence.toUpperCase().includes('PLEASE')) {
      setWords(['Could I please have some water?']);
    } else if (sentence.toUpperCase().includes('HELLO') && sentence.toUpperCase().includes('FRIEND')) {
      setWords(['Hello there, my friend! How are you doing?']);
    } else {
      // Generic capitalization and spacing fix
      setWords([sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase() + '.']);
    }
    setIsPolished(true);
  };
  
  const getTranslatedText = () => {
    if (targetLang === 'en') return sentence.replace(/ ,/g, ',');
    
    // Mock translations for demo
    const s = sentence.toUpperCase();
    if (targetLang === 'hi') {
      if (s.includes('HELLO')) return 'नमस्ते (Namaste)';
      if (s.includes('WATER PLEASE')) return 'कृपया मुझे पानी दीजिए (Kripya mujhe pani dijiye)';
      if (s.includes('THANK YOU')) return 'धन्यवाद (Dhanyavad)';
      return sentence + ' (Translating...)';
    }
    if (targetLang === 'es') {
      if (s.includes('HELLO')) return 'Hola';
      if (s.includes('WATER PLEASE')) return 'Agua por favor';
      if (s.includes('THANK YOU')) return 'Gracias';
      return sentence + ' (Traduciendo...)';
    }
    return sentence;
  };

  const predictions = getPredictions();
  const sentiment = getSentiment();
  
  // Calculate WPM (Words Per Minute)
  const elapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 0;
  const currentGPM = (elapsedMinutes > 0.05 && wordCount > 0) ? Math.round(wordCount / elapsedMinutes) : 0;

  const switchMode = (m: AppMode) => {
    setMode(m);
    setCurrentSign(''); setConfidence(0); setCommitProgress(0);
    setActiveGesture('UNKNOWN'); setGestureProgress(0);
    setChallengeWord('');
  };

  // Current gesture definition (for display)
  const activeDef = mode === 'isl' 
    ? (ISL_MAP[activeGesture as ISLWordId] ?? ISL_MAP.UNKNOWN)
    : (GESTURE_MAP[activeGesture] ?? GESTURE_MAP.UNKNOWN);

  return (
    <div className="app-wrapper">
      <div className="container">

        {/* ── HEADER ── */}
        <header className="header animate-in">
          <div className="brand">
            <h1 className="brand-name">Gesture<span>AI</span></h1>
            <p className="brand-tag">Real-time ASL Word Recognition</p>
          </div>
          <div className="header-right">
            <div className="badge-offline">
              <span className="badge-dot" />
              100% Offline
            </div>
            <button className="btn-ghost" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} title="Toggle Theme">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <a href="https://github.com/Orsted10/GestureAI" target="_blank" rel="noreferrer" className="btn-ghost" title="GitHub">
              <ExternalLink size={16} />
            </a>
          </div>
        </header>

        {/* ── MODE TOGGLES ── */}
        <div className="top-controls animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center', animationDelay: '0.04s' }}>
          
          {/* Main App Mode Toggle */}
          <div className="mode-toggle">
            <button className={`mode-btn${mode === 'asl' ? ' active' : ''}`} onClick={() => switchMode('asl')}>
              <Radio size={15} />
              ASL
            </button>
          <button className={`mode-btn${mode === 'isl' ? ' active' : ''}`} onClick={() => switchMode('isl')}>
            <Radio size={15} />
            ISL (Indian)
          </button>
          <button className={`mode-btn${mode === 'custom' ? ' active' : ''}`} onClick={() => switchMode('custom')}>
            <Hand size={15} />
            Custom Gestures
          </button>

          <div className="vertical-divider" />
                    <button 
              className={`mode-btn learn-btn${isLearnMode ? ' active' : ''}`} 
              onClick={() => setIsLearnMode(!isLearnMode)}
              disabled={mode === 'custom'}
            >
              <GraduationCap size={15} />
              Learn Mode
            </button>
          </div>

          {/* Output Mode Toggle (only for heuristic modes) */}
          {mode !== 'asl' && !isLearnMode && (
            <div className="mode-toggle" style={{ transform: 'scale(0.9)', marginTop: '-0.2rem' }}>
              <button 
                className={`mode-btn${outputMode === 'word' ? ' active' : ''}`} 
                onClick={() => setOutputMode('word')}
              >
                <Type size={14} />
                Word Mode
              </button>
              <button 
                className={`mode-btn${outputMode === 'sentence' ? ' active' : ''}`} 
                onClick={() => setOutputMode('sentence')}
              >
                <MessageSquare size={14} />
                Sentence Mode
              </button>
            </div>
          )}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="main-grid animate-in" style={{ animationDelay: '0.08s' }}>

          {/* ── Camera Panel ── */}
          <div className="camera-panel">
            <div className="camera-header">
              <span className="camera-label"><span className="live-dot" />Live Camera</span>
              <span className="loading-status">
                <Camera size={13} />
                {mode === 'asl' ? 'MediaPipe Holistic' : 'Gesture Detection'}
              </span>
            </div>

            <div className="camera-body">
              <DetectorEngine 
                mode={mode}
                outputMode={outputMode}
                voicePref={voicePref}
                onWordDetected={handleWordDetected}
                onSignUpdate={handleSignUpdate}
                onSentenceDetected={handleSentenceDetected}
                onGestureUpdate={handleGestureUpdate}
              />
            </div>

            {/* Camera footer */}
            <div className="camera-footer">
              {mode === 'asl' ? (
                <div className="current-sign-strip">
                  <span className="current-sign-label">Detected</span>
                  {currentSign ? (
                    <>
                      <span className="current-sign-word">{currentSign.toUpperCase()}</span>
                      <div className="confidence-bar-wrap">
                        <div className="confidence-bar">
                          <div className="confidence-fill" style={{
                            width: `${commitProgress * 100}%`,
                            background: commitProgress >= 1 ? 'var(--emerald)' : 'var(--grad-accent)',
                            boxShadow: commitProgress >= 1 ? '0 0 10px var(--success-glow)' : '0 0 8px var(--accent-glow)',
                            transition: 'width 0.15s ease, background 0.2s ease',
                          }} />
                        </div>
                        <div className="confidence-pct">
                          {commitProgress >= 1 ? '✓ Locked' : `${confidence}% · ${Math.round(commitProgress * 100)}%`}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="current-sign-word inactive">Hold sign to detect…</span>
                  )}
                </div>
              ) : (
                <div className="current-sign-strip">
                  <span className="current-sign-label">Pose</span>
                  {activeGesture !== 'UNKNOWN' ? (
                    <>
                      <span className="current-sign-word">
                        <span style={{ fontSize: '1.1em' }}>{activeDef.emoji}</span>{' '}
                        {activeDef.label}
                      </span>
                      <div className="confidence-bar-wrap">
                        <div className="confidence-bar">
                          <div className="confidence-fill" style={{
                            width: `${gestureProgress * 100}%`,
                            background: gestureProgress >= 1 ? 'var(--emerald)' : '#f59e0b',
                            boxShadow: gestureProgress >= 1 ? '0 0 10px var(--success-glow)' : '0 0 8px rgba(245,158,11,0.5)',
                            transition: 'width 0.1s ease, background 0.2s ease',
                          }} />
                        </div>
                        <div className="confidence-pct">
                          {gestureProgress >= 1 ? '✓ Done!' : `Hold… ${Math.round(gestureProgress * 100)}%`}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="current-sign-word inactive">Show a gesture…</span>
                  )}
                </div>
              )}
              {words.length > 0 && (
                <button className="icon-btn danger" onClick={handleRemoveLast} title="Undo last">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="right-panel">

            {/* Learn Mode Override */}
            {isLearnMode && (mode === 'asl' || mode === 'isl') ? (
              <LearnModePanel 
                mode={mode}
                dictionary={mode === 'isl' ? islDict : aslDict}
                challengeWord={challengeWord}
                score={score}
                streak={streak}
                successTrigger={successTrigger}
                onSkip={() => getRandomChallenge()}
              />
            ) : (
              <>
                {/* Custom Gesture cheat-sheet */}
                {mode === 'custom' && (
              <div className="card animate-in gesture-legend" style={{ animationDelay: '0.10s' }}>
                <div className="card-header">
                  <span className="card-title"><Hand size={14} className="card-icon" />Gesture Map</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{GESTURE_LIST.length - 2} phrases · 2 actions</span>
                </div>
                <div className="gesture-list">
                  {/* Utility header */}
                  <div className="gesture-section-label">⚙️ Actions (silent)</div>
                  {GESTURE_LIST.filter(id => GESTURE_MAP[id].isUtility && id !== 'UNKNOWN').map(id => {
                    const g = GESTURE_MAP[id];
                    return (
                      <div key={id} className={`gesture-row utility-row${activeGesture === id ? ' gesture-row-active' : ''}`}>
                        <span className="gesture-fingers">{g.emoji}</span>
                        <div className="gesture-info">
                          <span className="gesture-name">{g.label}</span>
                          <span className="gesture-desc">{g.description}</span>
                        </div>
                        <span className="gesture-action-badge">
                          {id === 'FIST' ? '⌫ Del' : '🗑 Clear'}
                        </span>
                      </div>
                    );
                  })}

                  {/* Phrase gestures */}
                  <div className="gesture-section-label">💬 Phrases (spoken)</div>
                  {GESTURE_LIST.filter(id => !GESTURE_MAP[id].isUtility).map(id => {
                    const g = GESTURE_MAP[id];
                    return (
                      <div key={id} className={`gesture-row${activeGesture === id ? ' gesture-row-active' : ''}`}>
                        <span className="gesture-fingers">{g.emoji}</span>
                        <div className="gesture-info">
                          <span className="gesture-name">{g.label}</span>
                          <span className="gesture-desc">{g.description}</span>
                        </div>
                        <span className="gesture-sentence">"{(outputMode === 'sentence' && g.sentence) ? g.sentence : (g.phrase || g.label)}"</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ISL cheat-sheet */}
            {mode === 'isl' && (
              <div className="card animate-in gesture-legend" style={{ animationDelay: '0.10s' }}>
                <div className="card-header">
                  <span className="card-title"><Hand size={14} className="card-icon" />ISL Dictionary</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{Object.keys(ISL_MAP).length - 1} Words Supported</span>
                </div>
                <div className="gesture-list">
                  <div className="gesture-section-label">📚 Core Dictionary</div>
                  {Object.values(ISL_MAP).filter(def => !def.isUtility).map(def => {
                    return (
                      <div key={def.id} className={`gesture-row${activeGesture === def.id ? ' gesture-row-active' : ''}`}>
                        <span className="gesture-fingers">{def.emoji}</span>
                        <div className="gesture-info">
                          <span className="gesture-name">{def.label}</span>
                          <span className="gesture-desc" style={{ color: 'var(--accent)' }}>{def.description}</span>
                        </div>
                        <span className="gesture-sentence">"{(outputMode === 'sentence' && def.sentence) ? def.sentence : (def.phrase || def.label)}"</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sentence builder */}
            <div className="card animate-in" style={{ animationDelay: '0.14s' }}>
              <div className="card-header">
                <span className="card-title"><Type size={14} className="card-icon" />Live Translation</span>
                <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="mode-toggle" style={{ transform: 'scale(0.85)', margin: 0, padding: '2px' }}>
                    <button 
                      className={`mode-btn${voicePref === 'female' ? ' active' : ''}`} 
                      onClick={() => setVoicePref('female')}
                      style={{ padding: '4px 10px' }}
                    >Female</button>
                    <button 
                      className={`mode-btn${voicePref === 'male' ? ' active' : ''}`} 
                      onClick={() => setVoicePref('male')}
                      style={{ padding: '4px 10px' }}
                    >Male</button>
                  </div>
                  {copied ? (
                    <span className="copy-toast"><CheckCheck size={13} /> Copied!</span>
                  ) : (
                    <button className="icon-btn success" onClick={handleCopy} title="Copy" disabled={!sentence}>
                      <Clipboard size={14} />
                    </button>
                  )}
                  <button className="icon-btn" onClick={handleReVoice} title="Re-read" disabled={!sentence}>
                    <Volume2 size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={handleClear} title="Clear" disabled={!sentence}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="sentence-output" style={{ borderLeft: sentiment ? `4px solid ${sentiment.color}` : 'none', transition: 'border 0.3s ease' }}>
                {sentiment && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: sentiment.color }}>
                    <Heart size={12} /> Emotion: {sentiment.icon} {sentiment.label}
                  </div>
                )}
                
                {sentence
                  ? <p className="sentence-text">{getTranslatedText()}</p>
                  : <p className="sentence-text empty">Your translation will appear here as a natural sentence…</p>
                }
                
                {predictions.length > 0 && !isPolished && (
                  <div className="predictive-bubbles" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {predictions.map((p, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => applyPrediction(p)}
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border-bright)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                      >
                        +{p}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="sentence-meta" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Globe size={14} color="var(--text-muted)" />
                    
                    {/* CUSTOM DROPDOWN UI */}
                    <div className="custom-select-wrapper" onMouseLeave={() => setIsLangOpen(false)}>
                      <div className="custom-select-trigger" onClick={() => setIsLangOpen(!isLangOpen)}>
                        <span>
                          {targetLang === 'en' ? 'English (Native)' : 
                           targetLang === 'hi' ? 'Hindi (हिन्दी)' : 'Spanish (Español)'}
                        </span>
                        <ChevronDown size={14} />
                      </div>
                      
                      {isLangOpen && (
                        <div className="custom-select-menu">
                          <div className={`custom-select-item ${targetLang === 'en' ? 'active' : ''}`} onClick={() => { setTargetLang('en'); setIsLangOpen(false); }}>
                            English (Native)
                          </div>
                          <div className={`custom-select-item ${targetLang === 'hi' ? 'active' : ''}`} onClick={() => { setTargetLang('hi'); setIsLangOpen(false); }}>
                            Hindi (हिन्दी)
                          </div>
                          <div className={`custom-select-item ${targetLang === 'es' ? 'active' : ''}`} onClick={() => { setTargetLang('es'); setIsLangOpen(false); }}>
                            Spanish (Español)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!isPolished && sentence && (
                      <button onClick={handlePolish} style={{ background: 'var(--grad-accent)', color: 'white', border: 'none', borderRadius: '12px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Sparkles size={12} /> Polish Grammar
                      </button>
                    )}
                    <span className="word-count"><span>{wordCount}</span> word{wordCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="sentence-actions">
                <button className="action-btn action-btn-primary" onClick={handleReVoice} disabled={!sentence}>
                  <Volume2 size={15} /> Speak Sentence
                </button>
                <button className="action-btn action-btn-secondary" onClick={handleCopy} disabled={!sentence}>
                  <Clipboard size={15} /> Copy
                </button>
                <button className="action-btn action-btn-danger" onClick={handleClear} disabled={!sentence}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Word chips */}
            {words.length > 0 && (
              <div className="card animate-in" style={{ animationDelay: '0.18s' }}>
                <div className="card-header">
                  <span className="card-title"><Zap size={14} className="card-icon" />History ({wordCount})</span>
                </div>
                <div className="words-chips">
                  {words.map((word, idx) => (
                    <span key={idx} className="word-chip">
                      {word}
                      <button className="chip-remove" onClick={() => handleRemove(idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="card animate-in" style={{ animationDelay: '0.22s' }}>
              <div className="card-header">
                <span className="card-title"><BarChart2 size={14} className="card-icon" />Session Stats</span>
              </div>
              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="stat-cell">
                  <span className="stat-value">{wordCount}</span>
                  <span className="stat-label">Phrases</span>
                </div>
                <div className="stat-cell" style={{ borderRight: '1px solid var(--border)' }}>
                  <span className="stat-value" style={{ color: 'var(--accent)' }}>
                    {currentGPM > 0 ? currentGPM : '—'}
                  </span>
                  <span className="stat-label"><Activity size={10} style={{display:'inline', marginRight:'2px'}}/> GPM Speed</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-value" style={{ color: 'var(--amber)' }}>
                    {mode === 'asl'
                      ? (confidence > 0 ? `${confidence}%` : '—')
                      : (activeGesture !== 'UNKNOWN' ? activeDef.emoji : '—')}
                  </span>
                  <span className="stat-label">{mode === 'asl' ? 'Confidence' : 'Last Pose'}</span>
                </div>
              </div>
            </div>

            </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
