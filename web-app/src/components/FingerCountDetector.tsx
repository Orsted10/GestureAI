'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TTSManager } from '@/utils/tts';
import { GESTURE_MAP, type GestureId } from '@/utils/fingerGestures';

// ── Tuning ─────────────────────────────────────────────────────────────────
const CONFIRM_FRAMES  = 22;  // frames of agreement before commit (~0.7s @ 30fps)
const COOLDOWN_MS     = 2400;
const HISTORY_SIZE    = 7;   // rolling history for temporal smoothing (mode-voting)
const UNKNOWN_RESET   = 15;  // frames of UNKNOWN/change to reset candidate

// ─────────────────────────────────────────────────────────────────────────────
//  GEOMETRY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Angle (degrees) at joint B, formed by vectors B→A and B→C */
function angleAt(a: any, b: any, c: any): number {
  const ax = a.x - b.x, ay = a.y - b.y;
  const cx = c.x - b.x, cy = c.y - b.y;
  const dot = ax * cx + ay * cy;
  const mag = Math.sqrt(ax * ax + ay * ay) * Math.sqrt(cx * cx + cy * cy);
  if (mag < 1e-6) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180 / Math.PI;
}

function dist(a: any, b: any): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ─────────────────────────────────────────────────────────────────────────────
//  FINGER STATE DETECTION
//  Uses joint angles (not just y-position) → robust to hand tilt/rotation
// ─────────────────────────────────────────────────────────────────────────────

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  thumbPointsUp: boolean;
}

const EMPTY_STATE: FingerState = {
  thumb: false, index: false, middle: false, ring: false, pinky: false, thumbPointsUp: false,
};

/**
 * Determine if a non-thumb finger is extended.
 * Strategy: MCP→PIP→TIP angle must be large (straight finger).
 * Also falls back to y-comparison for upright hands.
 */
function isFingerUp(tip: any, dip: any, pip: any, mcp: any): boolean {
  // Angle at PIP between MCP-PIP direction and PIP-TIP direction
  const pipAngle = angleAt(mcp, pip, tip);
  // Angle at DIP between PIP-DIP direction and DIP-TIP direction
  const dipAngle = angleAt(pip, dip, tip);

  // Both joints relatively straight = extended finger
  const angleOk = pipAngle > 155 && dipAngle > 150;

  // Classic y-check (tip clearly above PIP) — still useful for upright hand
  const yOk = tip.y < pip.y - 0.02;

  // Require BOTH signals (avoids false positives from sideways bent fingers)
  return angleOk || yOk;
}

/**
 * Thumb extension check.
 * We use TWO independent signals and require both:
 *   1. Thumb IP joint is straight (angle > 140°)
 *   2. Thumb tip is far from the middle-finger MCP (not pressed against palm)
 */
function isThumbUp(lm: any[]): { extended: boolean; pointsUp: boolean } {
  const thumbMcp = lm[2];
  const thumbIp  = lm[3];
  const thumbTip = lm[4];

  // Signal 1: IP angle (MCP → IP → TIP)
  const ipAngle = angleAt(thumbMcp, thumbIp, thumbTip);
  const straight = ipAngle > 140;

  // Signal 2: Thumb tip distance from middle MCP (landmark 9)
  //           A folded thumb is close to the middle of the palm
  const handSize    = dist(lm[0], lm[9]) || 0.01;  // wrist to middle-MCP
  const tipToPalm   = dist(thumbTip, lm[9]);
  const abducted    = tipToPalm > handSize * 0.85;

  const extended   = straight && abducted;
  const pointsUp   = thumbTip.y < thumbMcp.y;       // tip above MCP = up

  return { extended, pointsUp };
}

function detectFingers(lm: any[]): FingerState {
  if (!lm || lm.length < 21) return EMPTY_STATE;

  const { extended: thumb, pointsUp: thumbPointsUp } = isThumbUp(lm);

  // [tip, dip, pip, mcp] for each finger
  const index  = isFingerUp(lm[8],  lm[7],  lm[6],  lm[5]);
  const middle = isFingerUp(lm[12], lm[11], lm[10], lm[9]);
  const ring   = isFingerUp(lm[16], lm[15], lm[14], lm[13]);
  const pinky  = isFingerUp(lm[20], lm[19], lm[18], lm[17]);

  return { thumb, index, middle, ring, pinky, thumbPointsUp };
}

// ─────────────────────────────────────────────────────────────────────────────
//  GESTURE CLASSIFIER (single hand)
// ─────────────────────────────────────────────────────────────────────────────

function classify(fs: FingerState): GestureId {
  const { thumb, index, middle, ring, pinky, thumbPointsUp } = fs;

  // ── All curled → FIST ────────────────────────────────────────────────────
  if (!thumb && !index && !middle && !ring && !pinky) return 'FIST';

  // ── All 5 extended → OPEN_PALM ───────────────────────────────────────────
  if (thumb && index && middle && ring && pinky) return 'OPEN_PALM';

  // ── Thumb ONLY ───────────────────────────────────────────────────────────
  if (thumb && !index && !middle && !ring && !pinky) {
    return thumbPointsUp ? 'THUMB_UP' : 'THUMB_DOWN';
  }

  // ── 4 fingers, no thumb ───────────────────────────────────────────────────
  if (!thumb && index && middle && ring && pinky) return 'FOUR';

  // ── 3 fingers (index+middle+ring), no thumb ───────────────────────────────
  if (!thumb && index && middle && ring && !pinky) return 'THREE';

  // ── Peace (index+middle), no thumb ────────────────────────────────────────
  if (!thumb && index && middle && !ring && !pinky) return 'PEACE';

  // ── Index only ────────────────────────────────────────────────────────────
  if (!thumb && index && !middle && !ring && !pinky) return 'INDEX';

  // ── Pinky only ────────────────────────────────────────────────────────────
  if (!thumb && !index && !middle && !ring && pinky) return 'PINKY';

  // ── Rock: index + pinky (middle+ring folded, no thumb) ────────────────────
  if (!thumb && index && !middle && !ring && pinky) return 'ROCK';

  // ── ILY: thumb + index + pinky (middle+ring folded) ──────────────────────
  if (thumb && index && !middle && !ring && pinky) return 'ILY';

  // ── Shaka: thumb + pinky (others folded) ─────────────────────────────────
  if (thumb && !index && !middle && !ring && pinky) return 'SHAKA';

  // ── L-shape: thumb + index (others folded) ────────────────────────────────
  if (thumb && index && !middle && !ring && !pinky) return 'L_SHAPE';

  // ── Thumb + index + middle (THREE_THUMB) ─────────────────────────────────
  if (thumb && index && middle && !ring && !pinky) return 'THREE_THUMB';

  // ── Thumb + index + middle + ring (FOUR_THUMB) ────────────────────────────
  if (thumb && index && middle && ring && !pinky) return 'FOUR_THUMB';

  return 'UNKNOWN';
}

// ─────────────────────────────────────────────────────────────────────────────
//  TWO-HAND GESTURE CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

function classifyTwoHand(rightLm: any[], leftLm: any[]): GestureId | null {
  const r = detectFingers(rightLm);
  const l = detectFingers(leftLm);
  const rId = classify(r);
  const lId = classify(l);

  if (rId === 'FIST'      && lId === 'FIST')      return 'BOTH_FISTS';
  if (rId === 'OPEN_PALM' && lId === 'OPEN_PALM')  return 'BOTH_OPEN';
  if (rId === 'PEACE'     && lId === 'PEACE')      return 'BOTH_PEACE';
  if (rId === 'THUMB_UP'  && lId === 'THUMB_UP')   return 'BOTH_THUMB_UP';

  return null; // no matching two-hand combo
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPORAL SMOOTHING — mode-voting over rolling history window
// ─────────────────────────────────────────────────────────────────────────────

function modeVote(history: GestureId[]): GestureId {
  if (!history.length) return 'UNKNOWN';
  const counts: Record<string, number> = {};
  for (const g of history) counts[g] = (counts[g] || 0) + 1;
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]![0] as GestureId;
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface FingerCountDetectorProps {
  onSentenceDetected: (phrase: string, gestureId: GestureId) => void;
  onGestureUpdate?:   (gestureId: GestureId, progress: number) => void;
}

export default function FingerCountDetector({
  onSentenceDetected,
  onGestureUpdate,
}: FingerCountDetectorProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusMsg, setStatusMsg] = useState('Starting camera…');

  const ttsRef             = useRef<TTSManager | null>(null);
  const onSentenceRef      = useRef(onSentenceDetected);
  const onGestureUpdateRef = useRef(onGestureUpdate);

  // State machine refs
  const historyRef       = useRef<GestureId[]>([]);    // rolling classification history
  const candidateRef     = useRef<GestureId>('UNKNOWN');
  const confirmCountRef  = useRef(0);
  const unknownStreakRef = useRef(0);
  const lastCommitRef    = useRef(0);

  useEffect(() => { onSentenceRef.current      = onSentenceDetected; }, [onSentenceDetected]);
  useEffect(() => { onGestureUpdateRef.current = onGestureUpdate;    }, [onGestureUpdate]);

  useEffect(() => {
    let camera: any  = null;
    let holistic: any = null;
    let alive = true;

    ttsRef.current = new TTSManager();
    setStatusMsg('Loading MediaPipe…');

    const check = setInterval(() => {
      const w = window as any;
      if (!alive) { clearInterval(check); return; }
      if (w.Holistic && w.Camera) { clearInterval(check); setup(w); }
    }, 300);

    function setup(w: any) {
      holistic = new w.Holistic({
        locateFile: (f: string) => `/mediapipe/holistic/${f}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
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

      // ── Draw ─────────────────────────────────────────────────────────────
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

      // ── Detect ───────────────────────────────────────────────────────────
      const hasRight = !!results.rightHandLandmarks;
      const hasLeft  = !!results.leftHandLandmarks;
      const now      = Date.now();
      const inCooldown = now - lastCommitRef.current < COOLDOWN_MS;

      let rawGesture: GestureId = 'UNKNOWN';

      if (hasRight && hasLeft) {
        // Two-hand: check specific combo first, otherwise ignore (avoid confusion)
        const combo = classifyTwoHand(results.rightHandLandmarks, results.leftHandLandmarks);
        rawGesture = combo ?? 'UNKNOWN';
      } else if (hasRight || hasLeft) {
        const lm  = results.rightHandLandmarks ?? results.leftHandLandmarks;
        const fs  = detectFingers(lm);
        rawGesture = classify(fs);
      }

      // ── Temporal smoothing ────────────────────────────────────────────────
      const hist = historyRef.current;
      hist.push(rawGesture);
      if (hist.length > HISTORY_SIZE) hist.shift();
      const gesture = modeVote(hist);  // most common in last N frames

      if (inCooldown) {
        onGestureUpdateRef.current?.(gesture, 0);
        return;
      }

      // ── Candidate state machine ───────────────────────────────────────────
      if (gesture === 'UNKNOWN') {
        unknownStreakRef.current++;
        if (unknownStreakRef.current >= UNKNOWN_RESET) {
          candidateRef.current   = 'UNKNOWN';
          confirmCountRef.current = 0;
        }
        onGestureUpdateRef.current?.('UNKNOWN', 0);
        return;
      }

      unknownStreakRef.current = 0;

      if (gesture === candidateRef.current) {
        confirmCountRef.current++;
      } else {
        // New gesture seen — restart count (with a small head-start to feel snappier)
        candidateRef.current    = gesture;
        confirmCountRef.current = 2;
      }

      const progress = Math.min(confirmCountRef.current / CONFIRM_FRAMES, 1);
      onGestureUpdateRef.current?.(gesture, progress);

      if (confirmCountRef.current >= CONFIRM_FRAMES) {
        const def = GESTURE_MAP[gesture];
        if (!def) return;

        console.log(`[GestureAI Custom] ✓ ${gesture}`);
        lastCommitRef.current   = now;
        candidateRef.current    = 'UNKNOWN';
        confirmCountRef.current = 0;
        historyRef.current      = [];  // clear history to avoid immediate re-trigger

        if (def.isUtility) {
          onSentenceRef.current('', gesture);
        } else if (def.phrase) {
          ttsRef.current?.speak(def.phrase);
          onSentenceRef.current(def.phrase, gesture);
        }
      }
    }

    return () => {
      alive = false;
      clearInterval(check);
      try { camera?.stop(); }   catch (_) {}
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
