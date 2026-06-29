'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TTSManager } from '@/utils/tts';
import { GESTURE_MAP, type GestureId } from '@/utils/fingerGestures';

// ── Tuning ────────────────────────────────────────────────────────────────────
const CONFIRM_FRAMES = 14;   // frames of agreement before committing (~0.5s at 30fps)
const COOLDOWN_MS    = 2200; // lockout after any commit
const UNKNOWN_RESET  = 20;   // frames of UNKNOWN before resetting candidate

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  thumbPointsUp: boolean;   // thumb tip above wrist
}

/** Derive per-finger extension from MediaPipe landmarks */
function detectFingers(lm: any[]): FingerState {
  if (!lm || lm.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false, thumbPointsUp: false };
  }

  // Non-thumb fingers: tip y < pip y  (y=0 is top)
  const index  = lm[8].y  < lm[6].y;
  const middle = lm[12].y < lm[10].y;
  const ring   = lm[16].y < lm[14].y;
  const pinky  = lm[20].y < lm[18].y;

  // Thumb: measure lateral spread vs hand width
  const thumbTip  = lm[4];
  const thumbIp   = lm[3];   // inter-phalangeal joint
  const indexMcp  = lm[5];
  const handW     = Math.abs(lm[0].x - lm[9].x) || 0.01;
  const thumbDist = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y);
  const ipDist    = Math.hypot(thumbIp.x  - indexMcp.x, thumbIp.y  - indexMcp.y);
  const thumb     = thumbDist > ipDist * 1.15 && thumbDist > handW * 0.3;

  // Thumb direction
  const thumbPointsUp = thumbTip.y < lm[2].y;  // tip above MCP base

  return { thumb, index, middle, ring, pinky, thumbPointsUp };
}

/** Classify finger state into a named GestureId */
function classify(fs: FingerState, lm: any[]): GestureId {
  const { thumb, index, middle, ring, pinky, thumbPointsUp } = fs;

  // ── Special: OK sign — thumb tip close to index tip ─────────────────────
  if (lm) {
    const thumbTip   = lm[4];
    const indexTip   = lm[8];
    const handSize   = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 0.1;
    const okDist     = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    // OK: thumb and index touching, middle/ring/pinky up or any state
    if (okDist < handSize * 0.35 && !index && !middle && !ring && !pinky && thumb) {
      // Thumb is "extended" but curled toward index — special case
      return 'L_SHAPE'; // won't hit this anyway since thumb detection already separates
    }
  }

  // ── No fingers at all ────────────────────────────────────────────────────
  if (!thumb && !index && !middle && !ring && !pinky) return 'FIST';

  // ── All 5 ────────────────────────────────────────────────────────────────
  if (thumb && index && middle && ring && pinky) return 'OPEN_PALM';

  // ── Thumb only ───────────────────────────────────────────────────────────
  if (thumb && !index && !middle && !ring && !pinky) {
    return thumbPointsUp ? 'THUMB_UP' : 'THUMB_DOWN';
  }

  // ── 4 fingers (no thumb) ─────────────────────────────────────────────────
  if (!thumb && index && middle && ring && pinky) return 'FOUR';

  // ── 3 fingers (index+middle+ring, no thumb) ──────────────────────────────
  if (!thumb && index && middle && ring && !pinky) return 'THREE';

  // ── Peace (index+middle, no thumb) ───────────────────────────────────────
  if (!thumb && index && middle && !ring && !pinky) return 'PEACE';

  // ── Index only ───────────────────────────────────────────────────────────
  if (!thumb && index && !middle && !ring && !pinky) return 'INDEX';

  // ── Middle only ──────────────────────────────────────────────────────────
  if (!thumb && !index && middle && !ring && !pinky) return 'MIDDLE_ONLY';

  // ── Ring only ────────────────────────────────────────────────────────────
  if (!thumb && !index && !middle && ring && !pinky) return 'RING_ONLY';

  // ── Pinky only ───────────────────────────────────────────────────────────
  if (!thumb && !index && !middle && !ring && pinky) return 'PINKY';

  // ── Rock sign: index + pinky ──────────────────────────────────────────────
  if (!thumb && index && !middle && !ring && pinky) return 'ROCK';

  // ── Middle + Ring ─────────────────────────────────────────────────────────
  if (!thumb && !index && middle && ring && !pinky) return 'MIDDLE_RING';

  // ── Ring + Pinky ─────────────────────────────────────────────────────────
  if (!thumb && !index && !middle && ring && pinky) return 'RING_PINKY';

  // ── ILY: thumb + index + pinky ───────────────────────────────────────────
  if (thumb && index && !middle && !ring && pinky) return 'ILY';

  // ── Shaka: thumb + pinky ─────────────────────────────────────────────────
  if (thumb && !index && !middle && !ring && pinky) return 'SHAKA';

  // ── L-shape: thumb + index ───────────────────────────────────────────────
  if (thumb && index && !middle && !ring && !pinky) return 'L_SHAPE';

  // ── Thumb + middle ───────────────────────────────────────────────────────
  if (thumb && !index && middle && !ring && !pinky) return 'THUMB_MIDDLE';

  // ── Three + thumb: thumb + index + middle ────────────────────────────────
  if (thumb && index && middle && !ring && !pinky) return 'THREE_THUMB';

  // ── Four + thumb: thumb + index + middle + ring ──────────────────────────
  if (thumb && index && middle && ring && !pinky) return 'FOUR_THUMB';

  return 'UNKNOWN';
}

// ─────────────────────────────────────────────────────────────────────────────

interface FingerCountDetectorProps {
  onSentenceDetected: (sentence: string, gestureId: GestureId) => void;
  onGestureUpdate?: (gestureId: GestureId, progress: number) => void;
}

export default function FingerCountDetector({
  onSentenceDetected,
  onGestureUpdate,
}: FingerCountDetectorProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusMsg, setStatusMsg] = useState('Starting camera…');

  const ttsRef           = useRef<TTSManager | null>(null);
  const onSentenceRef    = useRef(onSentenceDetected);
  const onGestureUpdateRef = useRef(onGestureUpdate);

  const candidateRef     = useRef<GestureId>('UNKNOWN');
  const confirmCountRef  = useRef(0);
  const unknownCountRef  = useRef(0);
  const lastCommitRef    = useRef(0);

  useEffect(() => { onSentenceRef.current      = onSentenceDetected; }, [onSentenceDetected]);
  useEffect(() => { onGestureUpdateRef.current = onGestureUpdate;    }, [onGestureUpdate]);

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
        camera.start().then(() => { if (alive) setStatusMsg(''); });
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
          } catch (_) {}
        }
      }

      // ── Gesture detection ──────────────────────────────────────────────────
      // Use dominant hand (right preferred, fall back to left)
      const hand = results.rightHandLandmarks || results.leftHandLandmarks;

      // Two-hand detection: both hands present
      const twoHands = !!(results.rightHandLandmarks && results.leftHandLandmarks);

      const now      = Date.now();
      const inCooldown = now - lastCommitRef.current < COOLDOWN_MS;

      if (!hand) {
        candidateRef.current  = 'UNKNOWN';
        confirmCountRef.current = 0;
        onGestureUpdateRef.current?.('UNKNOWN', 0);
        return;
      }

      const fs = detectFingers(hand);
      let gesture: GestureId = twoHands ? 'TWO_HANDS' : classify(fs, hand);

      if (inCooldown) {
        onGestureUpdateRef.current?.(gesture, 0);
        return;
      }

      if (gesture === 'UNKNOWN') {
        unknownCountRef.current++;
        if (unknownCountRef.current >= UNKNOWN_RESET) {
          candidateRef.current   = 'UNKNOWN';
          confirmCountRef.current = 0;
        }
        onGestureUpdateRef.current?.('UNKNOWN', 0);
        return;
      }

      unknownCountRef.current = 0;

      if (gesture === candidateRef.current) {
        confirmCountRef.current++;
      } else {
        candidateRef.current    = gesture;
        confirmCountRef.current = 1;
      }

      const progress = Math.min(confirmCountRef.current / CONFIRM_FRAMES, 1);
      onGestureUpdateRef.current?.(gesture, progress);

      if (confirmCountRef.current >= CONFIRM_FRAMES) {
        const def = GESTURE_MAP[gesture];
        console.log(`[GestureAI] Committed: ${gesture}`);
        lastCommitRef.current   = now;
        candidateRef.current    = 'UNKNOWN';
        confirmCountRef.current = 0;

        if (def.isUtility) {
          // Utility gestures: fire event without speaking
          onSentenceRef.current('', gesture);
        } else if (def.phrase) {
          ttsRef.current?.speak(def.phrase);
          onSentenceRef.current(def.phrase, gesture);
        }
      }
    }

    return () => {
      alive = false;
      clearInterval(checkScripts);
      try { camera?.stop(); }  catch (_) {}
      try { holistic?.close(); } catch (_) {}
    };
  }, []);

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} className="detector-canvas" width={640} height={480} />
      {statusMsg && (
        <div className="detector-overlay">
          <div className="spinner animate-spin" />
          <p className="overlay-text animate-pulse">{statusMsg}</p>
        </div>
      )}
    </>
  );
}
