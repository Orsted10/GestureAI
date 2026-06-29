'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TTSManager } from '@/utils/tts';
import { FINGER_SENTENCES } from '@/utils/fingerGestures';

// ── Tuning ────────────────────────────────────────────────────────────────────
const CONFIRM_FRAMES  = 12; // how many consecutive frames must agree before commit
const COOLDOWN_MS     = 2500; // ms between commits

interface FingerCountDetectorProps {
  onSentenceDetected: (sentence: string, fingerCount: number) => void;
  onFingerUpdate?: (count: number, progress: number) => void;
}

// Count extended fingers using MediaPipe hand landmarks
function countExtendedFingers(landmarks: any[]): number {
  if (!landmarks || landmarks.length < 21) return 0;

  // Finger tip and pip (proximal interphalangeal) indices
  // Index=8/6, Middle=12/10, Ring=16/14, Pinky=20/18
  const fingerTips = [8, 12, 16, 20];
  const fingerPips = [6, 10, 14, 18];

  let count = 0;

  // For index-pinky: finger is up if tip.y < pip.y (y is inverted in MediaPipe)
  for (let i = 0; i < 4; i++) {
    if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
      count++;
    }
  }

  // Thumb: compare tip.x vs mcp.x (landmark 4 vs 2) — flipped for left/right hand
  // Use a simple heuristic: thumb tip is extended if far from index finger base
  const thumbTip  = landmarks[4];
  const thumbMcp  = landmarks[2];
  const indexMcp  = landmarks[5];
  const thumbDist = Math.abs(thumbTip.x - indexMcp.x);
  const handWidth = Math.abs(landmarks[0].x - landmarks[9].x) || 0.01;
  if (thumbDist > handWidth * 0.5) {
    count++;
  }

  return count;
}

export default function FingerCountDetector({
  onSentenceDetected,
  onFingerUpdate,
}: FingerCountDetectorProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusMsg, setStatusMsg] = useState('Starting camera…');

  const ttsRef           = useRef<TTSManager | null>(null);
  const onSentenceRef    = useRef(onSentenceDetected);
  const onFingerUpdateRef= useRef(onFingerUpdate);
  const candidateRef     = useRef(0);   // current candidate finger count
  const confirmCountRef  = useRef(0);   // consecutive frame agreement count
  const lastCommitRef    = useRef(0);   // timestamp of last commit

  useEffect(() => { onSentenceRef.current    = onSentenceDetected; }, [onSentenceDetected]);
  useEffect(() => { onFingerUpdateRef.current = onFingerUpdate;     }, [onFingerUpdate]);

  useEffect(() => {
    let camera: any  = null;
    let holistic: any = null;
    let alive = true;

    ttsRef.current = new TTSManager();

    setStatusMsg('Loading MediaPipe…');

    const checkScripts = setInterval(() => {
      const w = window as any;
      if (!alive) { clearInterval(checkScripts); return; }
      if (w.Holistic && w.Camera) {
        clearInterval(checkScripts);
        setup(w);
      }
    }, 300);

    function setup(w: any) {
      holistic = new w.Holistic({
        locateFile: (file: string) => `/mediapipe/holistic/${file}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      holistic.onResults(onResults);

      if (videoRef.current) {
        camera = new w.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && holistic && alive) {
              await holistic.send({ image: videoRef.current });
            }
          },
          width:  window.innerHeight > window.innerWidth ? 480 : 640,
          height: window.innerHeight > window.innerWidth ? 640 : 480,
        });
        camera.start().then(() => {
          if (alive) setStatusMsg('');
        });
      }
    }

    function onResults(results: any) {
      const w = window as any;

      // ── Draw ───────────────────────────────────────────────────────────────
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          try {
            ctx.save();
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.translate(canvasRef.current.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            const drawHand = (lms: any) => {
              if (!lms || !w.HAND_CONNECTIONS) return;
              w.drawConnectors(ctx, lms, w.HAND_CONNECTIONS, { color: '#A78BFA', lineWidth: 3 });
              if (w.drawLandmarks) w.drawLandmarks(ctx, lms, { color: '#7C6EF8', lineWidth: 1, radius: 4 });
            };
            drawHand(results.leftHandLandmarks);
            drawHand(results.rightHandLandmarks);
            ctx.restore();
          } catch (_) { /* never crash drawing */ }
        }
      }

      // ── Finger count logic ─────────────────────────────────────────────────
      const hand = results.rightHandLandmarks || results.leftHandLandmarks;
      if (!hand) {
        // No hand visible — reset
        candidateRef.current  = 0;
        confirmCountRef.current = 0;
        onFingerUpdateRef.current?.(0, 0);
        return;
      }

      const count = countExtendedFingers(hand);
      const now   = Date.now();
      const inCooldown = now - lastCommitRef.current < COOLDOWN_MS;

      if (inCooldown) {
        onFingerUpdateRef.current?.(count, 0);
        return;
      }

      if (count === candidateRef.current && count > 0) {
        confirmCountRef.current++;
      } else {
        candidateRef.current  = count;
        confirmCountRef.current = count > 0 ? 1 : 0;
      }

      const progress = Math.min(confirmCountRef.current / CONFIRM_FRAMES, 1);
      onFingerUpdateRef.current?.(count, progress);

      if (confirmCountRef.current >= CONFIRM_FRAMES && count >= 1 && count <= 5) {
        const sentence = FINGER_SENTENCES[count];
        if (sentence) {
          console.log(`[FingerCount] Committed ${count} fingers → "${sentence}"`);
          lastCommitRef.current   = now;
          candidateRef.current    = 0;
          confirmCountRef.current = 0;
          ttsRef.current?.speak(sentence);
          onSentenceRef.current(sentence, count);
        }
      }
    }

    return () => {
      alive = false;
      clearInterval(checkScripts);
      try { camera?.stop(); } catch (_) {}
      try { holistic?.close(); } catch (_) {}
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="detector-canvas"
        width={640}
        height={480}
      />
      {statusMsg && (
        <div className="detector-overlay">
          <div className="spinner animate-spin" />
          <p className="overlay-text animate-pulse">{statusMsg}</p>
        </div>
      )}
    </>
  );
}
