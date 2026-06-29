'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TTSManager } from '@/utils/tts';

interface ASLDetectorProps {
  onWordDetected: (word: string) => void;
  onSignUpdate?: (sign: string, confidence: number, progress: number) => void;
}

// ── Tuning constants ───────────────────────────────────────────────────────
const FRAME_WINDOW    = 30;   // frames in the sliding buffer
const INFER_EVERY     = 8;    // run inference every N frames (~4x/sec at 30fps)
const CONF_MIN        = 0.50; // low threshold — commit gate (CONFIRM_COUNT) prevents spam
const CONFIRM_COUNT   = 2;    // consecutive same-sign windows to commit (~0.5s hold)
const GLOBAL_COOLDOWN = 3000; // ms global lockout after any commit
// ──────────────────────────────────────────────────────────────────────────

export default function ASLDetector({ onWordDetected, onSignUpdate }: ASLDetectorProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [statusMsg, setStatusMsg]         = useState('Starting camera…');

  const frameBufferRef      = useRef<number[][][]>([]);
  const frameCounterRef     = useRef(0);
  const tfliteModelRef      = useRef<any>(null);
  const ttsRef              = useRef<TTSManager | null>(null);
  const signsDictRef        = useRef<Record<string, string>>({});
  const onWordDetectedRef   = useRef(onWordDetected);
  const onSignUpdateRef     = useRef(onSignUpdate);

  // Commit-gate state
  const candidateSignRef    = useRef('');
  const candidateCountRef   = useRef(0);
  const lastCommitTimeRef   = useRef(0);
  const inferRunningRef     = useRef(false);

  useEffect(() => { onWordDetectedRef.current = onWordDetected; }, [onWordDetected]);
  useEffect(() => { onSignUpdateRef.current   = onSignUpdate;   }, [onSignUpdate]);

  useEffect(() => {
    let camera: any  = null;
    let holistic: any = null;
    let alive = true;

    async function init() {
      ttsRef.current = new TTSManager();

      try {
        const r = await fetch('/signs.json');
        signsDictRef.current = await r.json();
        console.log('[GestureAI] signs dict loaded:', Object.keys(signsDictRef.current).length, 'signs');
      } catch (e) {
        console.error('[GestureAI] signs.json load failed', e);
      }

      setStatusMsg('Loading AI scripts…');
      const checkScripts = setInterval(async () => {
        const w = window as any;
        if (!alive) { clearInterval(checkScripts); return; }
        if (w.Holistic && w.Camera && w.tf && w.tflite) {
          clearInterval(checkScripts);
          setStatusMsg('Loading TFLite model…');

          try {
            w.tflite.setWasmPath('/tflite/');  // local — works offline in APK
            await w.tf.ready();
            const model = await w.tflite.loadTFLiteModel('/model.tflite');
            tfliteModelRef.current = model;
            console.log('[GestureAI] Model ready. Input:', model.inputs?.[0]?.shape);
            setIsModelLoaded(true);
            setStatusMsg('');
          } catch (e) {
            console.error('[GestureAI] TFLite load failed', e);
            setStatusMsg('Model failed to load');
          }

          if (!alive) return;
          setupMediaPipe(w);
        }
      }, 300);

      function setupMediaPipe(w: any) {
        setStatusMsg('Loading MediaPipe…');
        holistic = new w.Holistic({
          locateFile: (file: string) => `/mediapipe/holistic/${file}`,  // local
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
            width: window.innerHeight > window.innerWidth ? 480 : 640,
            height: window.innerHeight > window.innerWidth ? 640 : 480,
          });
          camera.start().then(() => {
            if (alive) setStatusMsg(tfliteModelRef.current ? '' : 'Loading TFLite model…');
          });
        }
      }
    }

    init();
    return () => {
      alive = false;
      try { camera?.stop(); } catch {}
      try { holistic?.close(); } catch {}
    };
  }, []);

  function extractKeypoints(results: any): number[][] {
    /**
     * CRITICAL: MediaPipe Holistic CDN returns 478 face landmarks
     * (468 face mesh + 10 iris) — the strict === 468 check would fail every frame,
     * silently replacing face data with zeros and tanking model accuracy.
     * Fix: slice to exactly n from the front, use NaN fill to match Python training.
     */
    const nanFill = (n: number): number[][] => Array.from({ length: n }, () => [0, 0, 0]);

    const take = (lms: any, n: number): number[][] => {
      if (!lms || lms.length === 0) return nanFill(n);
      // Slice to exactly n landmarks (handles 468 or 478 face lms gracefully)
      const count = Math.min(lms.length, n);
      const result: number[][] = [];
      for (let i = 0; i < count; i++) result.push([lms[i].x, lms[i].y, lms[i].z]);
      // Zero-pad if fewer than expected (rare edge case)
      for (let i = count; i < n; i++) result.push([0, 0, 0]);
      return result;
    };

    return [
      ...take(results.faceLandmarks, 468),        // 0–467
      ...take(results.leftHandLandmarks, 21),     // 468–488
      ...take(results.poseLandmarks, 33),         // 489–521
      ...take(results.rightHandLandmarks, 21),    // 522–542
    ];
  }


  function runInference() {
    const w = window as any;
    if (!tfliteModelRef.current || !w.tf) return;
    if (inferRunningRef.current) return;
    if (frameBufferRef.current.length < FRAME_WINDOW) return;

    inferRunningRef.current = true;
    try {
      w.tf.tidy(() => {
        const frames = frameBufferRef.current.slice(-FRAME_WINDOW);
        const input  = w.tf.tensor3d(frames, [FRAME_WINDOW, 543, 3], 'float32');
        const pred   = tfliteModelRef.current.predict(input);
        const probs  = pred.dataSync() as Float32Array;

        let maxProb = 0, maxIdx = 0;
        for (let i = 0; i < probs.length; i++) {
          if (probs[i] > maxProb) { maxProb = probs[i]; maxIdx = i; }
        }

        const now  = Date.now();
        const sign = maxProb >= CONF_MIN ? (signsDictRef.current[maxIdx.toString()] || '') : '';
        const conf = Math.round(maxProb * 100);
        const inCooldown = now - lastCommitTimeRef.current < GLOBAL_COOLDOWN;

        if (sign && !inCooldown) {
          if (sign === candidateSignRef.current) {
            // Same sign seen again — increment commit counter
            candidateCountRef.current++;
          } else {
            // New sign — start fresh candidate
            candidateSignRef.current  = sign;
            candidateCountRef.current = 1;
          }

          // Broadcast live preview with progress bar (0–1)
          const progress = Math.min(candidateCountRef.current / CONFIRM_COUNT, 1);
          onSignUpdateRef.current?.(sign, conf, progress);

          if (candidateCountRef.current >= CONFIRM_COUNT) {
            // ── COMMIT ─────────────────────────────────────────
            console.log(`[GestureAI] Committed: ${sign} (${conf}%)`);
            lastCommitTimeRef.current = now;
            candidateSignRef.current  = '';
            candidateCountRef.current = 0;
            // Clear buffer so transition frames don't contaminate next sign
            frameBufferRef.current = [];
            onWordDetectedRef.current(sign);
            ttsRef.current?.speak(sign);
          }
        } else {
          // Low confidence or in cooldown — reset candidate
          if (sign !== candidateSignRef.current) {
            candidateSignRef.current  = '';
            candidateCountRef.current = 0;
          }
          if (inCooldown) {
            // Show cooldown state — sign display stays until cooldown ends
            onSignUpdateRef.current?.(candidateSignRef.current || '', conf, 0);
          } else {
            onSignUpdateRef.current?.('', conf, 0);
          }
        }
      });
    } catch (e) {
      console.error('[GestureAI] Inference error', e);
    } finally {
      inferRunningRef.current = false;
    }
  }

  function onResults(results: any) {
    const w = window as any;

    // ── Draw (errors never block keypoint accumulation) ───────────────────
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        try {
          ctx.save();
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.translate(canvasRef.current.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (w.drawConnectors) {
            if (results.faceLandmarks && w.FACEMESH_CONTOURS) {
              w.drawConnectors(ctx, results.faceLandmarks, w.FACEMESH_CONTOURS,
                { color: 'rgba(129,140,248,0.45)', lineWidth: 1 });
            }
            if (results.poseLandmarks && w.POSE_CONNECTIONS) {
              w.drawConnectors(ctx, results.poseLandmarks, w.POSE_CONNECTIONS,
                { color: 'rgba(248,250,252,0.5)', lineWidth: 2 });
            }
            const drawHand = (lms: any) => {
              if (!lms || !w.HAND_CONNECTIONS) return;
              w.drawConnectors(ctx, lms, w.HAND_CONNECTIONS, { color: '#A78BFA', lineWidth: 3 });
              if (w.drawLandmarks) {
                w.drawLandmarks(ctx, lms, { color: '#7C6EF8', lineWidth: 1, radius: 3 });
              }
            };
            drawHand(results.leftHandLandmarks);
            drawHand(results.rightHandLandmarks);
          }
          ctx.restore();
        } catch {
          try { ctx.restore(); } catch {}
        }
      }
    }

    // ── Accumulate keypoints ──────────────────────────────────────────────
    frameBufferRef.current.push(extractKeypoints(results));
    if (frameBufferRef.current.length > FRAME_WINDOW) {
      frameBufferRef.current.shift();
    }

    frameCounterRef.current++;
    if (
      frameCounterRef.current % INFER_EVERY === 0 &&
      frameBufferRef.current.length >= FRAME_WINDOW
    ) {
      runInference();
    }
  }

  return (
    <>
      {(!isModelLoaded || statusMsg) && (
        <div className="detector-overlay">
          <div className="spinner animate-spin" />
          <p className="overlay-text animate-pulse">{statusMsg || 'Loading…'}</p>
        </div>
      )}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} width={1280} height={720} className="detector-canvas" />
    </>
  );
}
