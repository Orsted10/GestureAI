'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import {
  Camera, Clipboard, Volume2, Trash2, ExternalLink,
  CheckCheck, Type, Zap, X, BarChart2, Hand, Radio, GraduationCap
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
async function speakText(text: string) {
  if (!text) return;
  try {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    await TextToSpeech.speak({ text, lang: 'en-IN', rate: 0.88, pitch: 0.92, volume: 1.0 }); // changed en-US to en-IN for Indian accent
  } catch {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter  = new SpeechSynthesisUtterance(text);
    utter.lang   = 'en-IN'; // Indian accent fallback
    utter.rate   = 0.88;
    utter.pitch  = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const best   = voices.find(v => /google|indian|en-IN/i.test(v.name) && v.lang.startsWith('en-IN'))
                || voices.find(v => v.lang.startsWith('en'));
    if (best) utter.voice = best;
    window.speechSynthesis.speak(utter);
  }
}

type AppMode = 'asl' | 'isl' | 'custom';

export default function Home() {
  const [mode, setMode]               = useState<AppMode>('asl');
  const [outputMode, setOutputMode]   = useState<'word' | 'sentence'>('sentence');
  const [words, setWords]             = useState<string[]>([]);

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

  // ── ASL mode handlers ─────────────────────────────────────────────────────
  const handleWordDetected = useCallback((word: string) => {
    setCurrentSign(word);
    setCommitProgress(0);
    setWords(prev => [...prev, word]);

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

    // Phrase gesture — add to builder (TTS is handled inside FingerCountDetector)
    if (phrase) {
      setWords(prev => [...prev, phrase]);
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
    navigator.clipboard.writeText(sentence).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleReVoice    = () => speakText(sentence);
  const handleClear      = () => { setWords([]); setCurrentSign(''); setConfidence(0); };
  const handleRemove     = (idx: number) => setWords(prev => prev.filter((_, i) => i !== idx));
  const handleRemoveLast = () => setWords(prev => prev.slice(0, -1));

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
            <a href="https://github.com/Orsted10/GestureAI" target="_blank" rel="noreferrer" className="btn-ghost" title="GitHub">
              <ExternalLink size={16} />
            </a>
          </div>
        </header>

        {/* ── MODE TOGGLE ── */}
        <div className="mode-toggle animate-in" style={{ animationDelay: '0.04s' }}>
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
                <span className="card-title"><Type size={14} className="card-icon" />Sentence Builder</span>
                <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={outputMode} 
                    onChange={e => setOutputMode(e.target.value as 'word' | 'sentence')}
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', outline: 'none' }}
                  >
                    <option value="word">Word Mode</option>
                    <option value="sentence">Sentence Mode</option>
                  </select>
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

              <div className="sentence-output">
                {sentence
                  ? <p className="sentence-text">{sentence}</p>
                  : <p className="sentence-text empty">Your detected signs will appear here as a sentence…</p>
                }
                <div className="sentence-meta">
                  <span className="word-count"><span>{wordCount}</span> word{wordCount !== 1 ? 's' : ''}</span>
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
              <div className="stats-grid">
                <div className="stat-cell">
                  <span className="stat-value">{wordCount}</span>
                  <span className="stat-label">Phrases</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-value" style={{ color: 'var(--accent)' }}>
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
