'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { ISL_MAP } from '@/utils/islGestures';
import { GESTURE_MAP } from '@/utils/fingerGestures';

interface HearingModePanelProps {
  mode: 'asl' | 'isl' | 'custom' | 'ide';
}

export default function HearingModePanel({ mode }: HearingModePanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');

  // Web Speech API for Hearing Mode
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && isListening) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        if (finalStr) {
          setTranscript(prev => (prev + ' ' + finalStr).trim());
        }
        setInterimText(interimStr);
      };

      recognition.onend = () => {
         if (isListening) recognition.start();
      };
      
      recognition.start();
      return () => {
         recognition.onend = null;
         recognition.stop();
      };
    }
  }, [isListening]);

  const clearText = () => {
    setTranscript('');
    setInterimText('');
  };

  // Convert text to visuals
  const getVisuals = () => {
    const fullText = (transcript + ' ' + interimText).trim();
    if (!fullText) return [];

    const words = fullText.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    const visuals = [];

    const dictionary = mode === 'isl' ? ISL_MAP : GESTURE_MAP;

    for (const w of words) {
      const match = Object.values(dictionary).find((s: any) => s.phrase?.toLowerCase() === w || s.id.toLowerCase() === w);
      if (match && !(match as any).isUtility) {
        visuals.push({ word: w, emoji: match.emoji, description: match.description });
      } else {
        visuals.push({ word: w, emoji: '🔤', description: `Fingerspell: ${w.toUpperCase()}` });
      }
    }
    return visuals;
  };

  const visuals = getVisuals();

  return (
    <div className="card animate-in" style={{ marginTop: '1rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">
          <Mic size={14} className="card-icon" color={isListening ? 'var(--emerald)' : 'var(--text-muted)'} />
          Hearing Translation (Reverse)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`action-btn ${isListening ? 'action-btn-danger' : 'action-btn-primary'}`} 
            onClick={() => setIsListening(!isListening)}
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            {isListening ? 'Stop Listening' : 'Listen'}
          </button>
          <button className="icon-btn danger" onClick={clearText} title="Clear" disabled={!transcript && !interimText}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="hearing-panel-body" style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: '12px', minHeight: '120px' }}>
        {visuals.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
            {isListening ? 'Listening... Speak to translate into signs.' : 'Click "Listen" to translate speech to signs.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {visuals.map((v, i) => (
              <div key={i} className="visual-bubble" style={{ 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100px',
                position: 'relative'
              }}>
                {/* Visual Placeholder: In the future, this can be an <img> pointing to /signs/hello.png */}
                <div style={{ fontSize: '3rem', lineHeight: 1 }}>{v.emoji}</div>
                <div style={{ fontWeight: 600, marginTop: '0.5rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{v.word}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>{v.description}</div>
              </div>
            ))}
          </div>
        )}
        {(transcript || interimText) && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Transcript:</strong> {transcript} <span style={{ opacity: 0.6 }}>{interimText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
