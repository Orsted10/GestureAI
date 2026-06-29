'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useRef } from 'react';
import { Camera, Clipboard, Volume2, Trash2, ExternalLink, CheckCheck, Type, Zap, X, BarChart2 } from 'lucide-react';

const ASLDetector = dynamic(() => import('@/components/ASLDetector'), {
  ssr: false,
  loading: () => (
    <div className="detector-overlay">
      <div className="spinner animate-spin" />
      <p className="overlay-text animate-pulse">Initialising…</p>
    </div>
  ),
});

function speakText(text: string) {
  if (!text || typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(v => /samantha|karen|daniel|google uk|zira|premium|enhanced/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;
  utter.rate = 0.92;
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
}

export default function Home() {
  const [words, setWords]             = useState<string[]>([]);
  const [currentSign, setCurrentSign]  = useState('');
  const [confidence, setConfidence]    = useState(0);
  const [commitProgress, setCommitProgress] = useState(0);
  const [copied, setCopied]            = useState(false);

  /** Called by ASLDetector for EVERY confirmed detection */
  const handleWordDetected = useCallback((word: string) => {
    setCurrentSign(word);
    setCommitProgress(0);
    setWords(prev => [...prev, word]);
  }, []);

  /** Live sign preview + commit progress (0=not started, 1=committed) */
  const handleSignUpdate = useCallback((sign: string, conf: number, progress: number) => {
    setCurrentSign(sign);
    setConfidence(conf);
    setCommitProgress(progress);
  }, []);

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

        {/* ── MAIN GRID ── */}
        <div className="main-grid animate-in" style={{ animationDelay: '0.08s' }}>

          {/* ── LEFT: Camera ── */}
          <div className="camera-panel">
            <div className="camera-header">
              <span className="camera-label"><span className="live-dot" />Live Camera</span>
              <span className="loading-status"><Camera size={13} />MediaPipe Holistic</span>
            </div>

            <div className="camera-body">
              <ASLDetector
                onWordDetected={handleWordDetected}
                onSignUpdate={handleSignUpdate}
              />
            </div>

            <div className="camera-footer">
              <div className="current-sign-strip">
                <span className="current-sign-label">Detected</span>
                {currentSign ? (
                  <>
                    <span className="current-sign-word">{currentSign.toUpperCase()}</span>
                    <div className="confidence-bar-wrap">
                      <div className="confidence-bar">
                        {/* Commit progress bar — fills up as consecutive detections accumulate */}
                        <div
                          className="confidence-fill"
                          style={{
                            width: `${commitProgress * 100}%`,
                            background: commitProgress >= 1
                              ? 'var(--emerald)'
                              : 'var(--grad-accent)',
                            boxShadow: commitProgress >= 1
                              ? '0 0 10px var(--success-glow)'
                              : '0 0 8px var(--accent-glow)',
                            transition: 'width 0.15s ease, background 0.2s ease',
                          }}
                        />
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
              {words.length > 0 && (
                <button className="icon-btn danger" onClick={handleRemoveLast} title="Undo last word">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT: Sentence Builder ── */}
          <div className="right-panel">

            {/* Sentence Output */}
            <div className="card animate-in" style={{ animationDelay: '0.14s' }}>
              <div className="card-header">
                <span className="card-title"><Type size={14} className="card-icon" />Sentence Builder</span>
                <div className="card-actions">
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
                  <span className="card-title"><Zap size={14} className="card-icon" />Words ({wordCount})</span>
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
                  <span className="stat-label">Words Built</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-value" style={{ color: 'var(--accent)' }}>
                    {confidence > 0 ? `${confidence}%` : '—'}
                  </span>
                  <span className="stat-label">Confidence</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
