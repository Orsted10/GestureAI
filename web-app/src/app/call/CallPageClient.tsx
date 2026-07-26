'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, MessageSquare, ArrowLeft } from 'lucide-react';
import { TTSManager } from '@/utils/tts';
import DetectorEngine from '@/components/DetectorEngine';
import { GestureId } from '@/utils/fingerGestures';

export default function CallPage() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ttsRef = useRef<TTSManager | null>(null);

  // Load PeerJS and Initialize
  useEffect(() => {
    ttsRef.current = new TTSManager();

    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', (id) => {
        setPeerId(id);
      });

      // Incoming Call
      peer.on('call', (call) => {
        setIncomingCall(call);
      });

      // Incoming Data Connection
      peer.on('connection', (conn) => {
        setupDataConnection(conn);
      });
    });

    return () => {
      peerRef.current?.destroy();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const setupDataConnection = (conn: any) => {
    connRef.current = conn;
    conn.on('data', (data: any) => {
      setMessages(prev => [...prev, { sender: 'Remote', text: data }]);
      ttsRef.current?.speak(data, 'female');
    });
    conn.on('open', () => {
      setIsConnected(true);
    });
    conn.on('close', () => {
      setIsConnected(false);
    });
  };

  const handleCall = async () => {
    if (!remotePeerId || !peerRef.current) return;
    
    setIsCalling(true);
    if (!streamRef.current) {
      alert("Camera not ready yet. Please wait.");
      setIsCalling(false);
      return;
    }

    const call = peerRef.current.call(remotePeerId, streamRef.current);
    const conn = peerRef.current.connect(remotePeerId);
    
    setupDataConnection(conn);
    
    call.on('stream', (remoteStream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setIsConnected(true);
      setIsCalling(false);
    });

    callRef.current = call;
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    
    if (streamRef.current) {
      incomingCall.answer(streamRef.current);
      incomingCall.on('stream', (remoteStream: MediaStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setIsConnected(true);
      });
      callRef.current = incomingCall;
      setIncomingCall(null);
    } else {
      alert("Camera not ready yet.");
    }
  };

  const endCall = () => {
    callRef.current?.close();
    connRef.current?.close();
    
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setIsConnected(false);
    setIncomingCall(null);
  };

  const sendMessage = (text: string = chatInput) => {
    if (!text.trim() || !connRef.current) return;
    
    connRef.current.send(text);
    setMessages(prev => [...prev, { sender: 'You', text: text }]);
    setChatInput('');
  };

  // Web Speech API Voice-to-Text
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && isConnected && micEnabled) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (connRef.current) {
          connRef.current.send(`(Voice) ${transcript}`);
          setMessages(prev => [...prev, { sender: 'You', text: `(Voice) ${transcript}` }]);
        }
      };

      recognition.start();
      return () => recognition.stop();
    }
  }, [isConnected, micEnabled]);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Gesture Engine Callbacks
  const handleSentenceDetected = (phrase: string, gestureId?: string) => {
    if (isConnected) {
      sendMessage(`(Gesture) ${phrase}`);
    }
  };

  return (
    <div className="call-container" style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="icon-btn"><ArrowLeft size={16} /></Link>
          <div className="brand-logo">GestureAI <span style={{ color: 'var(--accent)' }}>Call</span></div>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          My ID: <strong style={{ color: 'var(--text-primary)', userSelect: 'all' }}>{peerId || 'Loading...'}</strong>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Videos Area */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
            
            {/* Remote Video */}
            <div style={{ flex: 2, background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {!isConnected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Waiting for connection...
                </div>
              )}
            </div>
            
            {/* Local Video (Replaced by DetectorEngine) */}
            <div style={{ flex: 1, background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
              <div style={{ position: 'absolute', inset: 0, transform: 'scaleX(-1)' }}>
                <DetectorEngine 
                  mode="asl"
                  outputMode="sentence"
                  voicePref="female"
                  isPaused={false}
                  onWordDetected={() => {}}
                  onSentenceDetected={handleSentenceDetected}
                  onSignUpdate={() => {}}
                  onGestureUpdate={() => {}}
                  onModeSwitch={() => {}}
                  onUniversalAction={() => {}}
                  onStreamReady={(stream) => streamRef.current = stream}
                  hideUI={true}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <button className="icon-btn" onClick={toggleMic} style={{ background: micEnabled ? 'var(--bg-base)' : 'var(--danger-soft)', color: micEnabled ? 'var(--text-primary)' : '#ef4444' }}>
              {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button className="icon-btn" onClick={toggleVideo} style={{ background: videoEnabled ? 'var(--bg-base)' : 'var(--danger-soft)', color: videoEnabled ? 'var(--text-primary)' : '#ef4444' }}>
              {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            
            {isConnected ? (
              <button className="icon-btn danger" onClick={endCall} style={{ background: '#ef4444', color: 'white' }}>
                <PhoneOff size={20} />
              </button>
            ) : (
              <button className="icon-btn success" onClick={handleCall} disabled={!remotePeerId || isCalling} style={{ background: 'var(--emerald)', color: 'white', opacity: (!remotePeerId || isCalling) ? 0.5 : 1 }}>
                <Phone size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Dialer */}
          {!isConnected && (
            <div className="card">
              <div className="card-header"><span className="card-title">Dial</span></div>
              <input 
                type="text" 
                placeholder="Enter Peer ID" 
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', marginBottom: '1rem' }}
              />
              {incomingCall && (
                <div style={{ background: 'var(--accent-soft)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-bright)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Incoming call...</span>
                  <button onClick={answerCall} style={{ background: 'var(--emerald)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Answer</button>
                </div>
              )}
            </div>
          )}

          {/* Chat / Transcript */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header"><span className="card-title"><MessageSquare size={14} className="card-icon" /> Transcript</span></div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.sender === 'You' ? 'flex-end' : 'flex-start', background: m.sender === 'You' ? 'var(--accent-soft)' : 'var(--bg-base)', color: m.sender === 'You' ? 'var(--accent)' : 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '12px', maxWidth: '80%', fontSize: '0.9rem', border: '1px solid', borderColor: m.sender === 'You' ? 'var(--border-bright)' : 'var(--border)' }}>
                  {m.text}
                </div>
              ))}
            </div>
            {isConnected && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(chatInput)}
                  placeholder="Type or gesture..."
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                />
                <button onClick={() => sendMessage(chatInput)} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Send</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
