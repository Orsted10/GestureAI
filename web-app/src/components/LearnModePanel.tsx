import React from 'react';
import { Trophy, Target, Sparkles, RefreshCw, BookOpen } from 'lucide-react';

interface LearnModePanelProps {
  mode: 'asl' | 'isl';
  dictionary: string[];
  challengeWord: string;
  score: number;
  streak: number;
  successTrigger: boolean;
  onSkip: () => void;
}

export default function LearnModePanel({
  mode,
  dictionary,
  challengeWord,
  score,
  streak,
  successTrigger,
  onSkip
}: LearnModePanelProps) {
  const searchQuery = `how to sign ${challengeWord} in ${mode === 'isl' ? 'Indian Sign Language' : 'ASL'}`;
  
  return (
    <div className="learn-mode-panel">
      {/* ── SCOREBOARD ── */}
      <div className="scoreboard card animate-in">
        <div className="card-header">
          <span className="card-title"><Trophy size={14} className="card-icon text-yellow" /> Challenge Mode</span>
          <div className="score-badges">
            <span className="badge badge-primary">Score: {score}</span>
            <span className="badge badge-accent">🔥 Streak: {streak}</span>
          </div>
        </div>

        <div className={`challenge-box ${successTrigger ? 'success-flash' : ''}`}>
          <div className="challenge-label">
            <Target size={16} />
            <span>Sign this word:</span>
          </div>
          <div className="challenge-word">
            {challengeWord ? challengeWord.toUpperCase() : 'LOADING...'}
          </div>
          
          <button className="icon-btn action-btn-secondary skip-btn" onClick={onSkip} title="Skip Word">
            <RefreshCw size={14} /> Skip
          </button>
        </div>

        {/* Tutorial Link */}
        <div style={{ textAlign: 'center', marginTop: '-0.5rem', marginBottom: '1rem', padding: '0 1rem' }}>
          <a 
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
            target="_blank" 
            rel="noreferrer"
            className="action-btn action-btn-secondary"
            style={{ display: 'inline-flex', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
          >
            🔍 Don't know it? Watch Tutorial
          </a>
        </div>

        {successTrigger && (
          <div className="success-overlay animate-in-zoom">
            <Sparkles size={40} className="sparkle-icon" />
            <h3>PERFECT!</h3>
          </div>
        )}
      </div>

      {/* ── DICTIONARY GRID ── */}
      <div className="dictionary-card card animate-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <span className="card-title"><BookOpen size={14} className="card-icon" /> Supported Words ({dictionary.length})</span>
        </div>
        <div className="dictionary-grid">
          {dictionary.map(word => (
            <div 
              key={word} 
              className={`dict-word ${word === challengeWord ? 'active-challenge' : ''}`}
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
