'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TTSManager } from '@/utils/tts';
import { GESTURE_MAP, IDE_MAP, type GestureId } from '@/utils/fingerGestures';
import { ISL_MAP, type ISLWordId } from '@/utils/islGestures';

// ── Shared Tuning ─────────────────────────────────────────────────────────
const FRAME_WINDOW    = 30;
const INFER_EVERY     = 6;
const ASL_CONF_MIN    = 0.45;
const ASL_CONFIRM     = 2;
const ASL_COOLDOWN    = 1500;

const HEURISTIC_CONFIRM = 18; 
const HEURISTIC_COOLDOWN = 1800;
const HISTORY_SIZE       = 7;
const UNKNOWN_RESET      = 15;

// ── Geometry Helpers ───────────────────────────────────────────────────────
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

interface FingerState {
  thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean;
  thumbPointsUp: boolean; thumbPointsDown: boolean; thumbPointsSide: boolean;
  pointsUp: boolean; pointsDown: boolean; pointsSide: boolean;
  wristY: number; wristX: number;
}

const EMPTY_STATE: FingerState = { 
  thumb: false, index: false, middle: false, ring: false, pinky: false, 
  thumbPointsUp: false, thumbPointsDown: false, thumbPointsSide: false,
  pointsUp: false, pointsDown: false, pointsSide: false,
  wristY: 0, wristX: 0
};

function isFingerUp(tip: any, dip: any, pip: any, mcp: any): boolean {
  const pipAngle = angleAt(mcp, pip, tip);
  const dipAngle = angleAt(pip, dip, tip);
  const distTipMcp = dist(tip, mcp);
  const distPipMcp = dist(pip, mcp);
  return ((pipAngle > 150 && dipAngle > 140) || distTipMcp > distPipMcp * 1.3);
}

function isThumbUp(lm: any[]): { extended: boolean; up: boolean; down: boolean; side: boolean } {
  const thumbMcp = lm[2], thumbIp = lm[3], thumbTip = lm[4];
  const ipAngle = angleAt(thumbMcp, thumbIp, thumbTip);
  const handSize = dist(lm[0], lm[9]) || 0.01; 
  const tipToPalm = dist(thumbTip, lm[9]);
  
  const extended = (ipAngle > 140) && (tipToPalm > handSize * 0.85);
  const up = thumbTip.y < thumbMcp.y - 0.05;
  const down = thumbTip.y > thumbMcp.y + 0.05;
  const side = !up && !down;
  
  return { extended, up, down, side };
}

function detectFingers(lm: any[]): FingerState {
  if (!lm || lm.length < 21) return EMPTY_STATE;
  const thumbState = isThumbUp(lm);
  
  // Calculate hand orientation (is hand pointing up or down?)
  const wristY = lm[0].y;
  const wristX = lm[0].x;
  const mcpAvgY = (lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 4;
  const mcpAvgX = (lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 4;
  
  const pointsUp = mcpAvgY < wristY - 0.05;
  const pointsDown = mcpAvgY > wristY + 0.05;
  const pointsSide = !pointsUp && !pointsDown;

  return {
    thumb: thumbState.extended,
    thumbPointsUp: thumbState.up,
    thumbPointsDown: thumbState.down,
    thumbPointsSide: thumbState.side,
    pointsUp, pointsDown, pointsSide,
    wristY, wristX,
    index:  isFingerUp(lm[8],  lm[7],  lm[6],  lm[5]),
    middle: isFingerUp(lm[12], lm[11], lm[10], lm[9]),
    ring:   isFingerUp(lm[16], lm[15], lm[14], lm[13]),
    pinky:  isFingerUp(lm[20], lm[19], lm[18], lm[17]),
  };
}

// ── Custom Gesture Classifier ──────────────────────────────────────────────
function classifyCustom(fs: FingerState): GestureId {
  const { thumb, index, middle, ring, pinky, pointsUp, pointsDown, pointsSide, thumbPointsUp, thumbPointsDown, thumbPointsSide } = fs;
  
  if (!thumb && !index && !middle && !ring && !pinky) return pointsDown ? 'FIST_DOWN' : 'FIST';
  if (thumb && index && middle && ring && pinky) return pointsDown ? 'OPEN_PALM_DOWN' : 'OPEN_PALM';
  
  if (!thumb && index && !middle && !ring && !pinky) {
    if (pointsDown) return 'INDEX_DOWN';
    if (pointsSide) return 'INDEX_SIDE';
    return 'INDEX';
  }
  
  if (thumb && !index && !middle && !ring && !pinky) {
    if (thumbPointsUp) return 'THUMB_UP';
    if (thumbPointsDown) return 'THUMB_DOWN';
    if (thumbPointsSide) return 'THUMB_SIDE';
  }
  
  if (!thumb && index && middle && !ring && !pinky) return pointsDown ? 'PEACE_DOWN' : 'PEACE';
  if (!thumb && index && middle && ring && !pinky) return pointsDown ? 'THREE_DOWN' : 'THREE';
  if (!thumb && index && !middle && !ring && pinky) return pointsDown ? 'ROCK_DOWN' : 'ROCK';
  if (thumb && index && !middle && !ring && !pinky) {
    if (pointsDown) return 'L_SHAPE_DOWN';
    const cShape = dist({x: fs.wristX, y: fs.wristY}, {x: fs.wristX, y: fs.wristY}) < 0.1; // Placeholder for C/O shape logic using actual landmarks if needed, fallback to L_SHAPE
    return 'L_SHAPE';
  }
  
  if (thumb && index && !middle && !ring && pinky) return 'ILY';
  if (thumb && !index && !middle && !ring && pinky) return 'SHAKA';
  
  if (thumb && index && middle && !ring && !pinky) return 'THREE_THUMB';
  if (thumb && index && middle && ring && !pinky) return 'FOUR_THUMB';
  
  if (!thumb && index && middle && ring && pinky) return 'FOUR';
  if (!thumb && !index && !middle && !ring && pinky) return 'PINKY';

  return 'UNKNOWN';
}

function classifyTwoHandCustom(rightLm: any[], leftLm: any[]): GestureId | null {
  const rId = classifyCustom(detectFingers(rightLm));
  const lId = classifyCustom(detectFingers(leftLm));
  if (rId === 'FIST' && lId === 'FIST') return 'BOTH_FISTS';
  if (rId === 'OPEN_PALM' && lId === 'OPEN_PALM') return 'BOTH_OPEN';
  if (rId === 'PEACE' && lId === 'PEACE') return 'BOTH_PEACE';
  if (rId === 'THUMB_UP' && lId === 'THUMB_UP') return 'BOTH_THUMB_UP';
  if (rId === 'THUMB_DOWN' && lId === 'THUMB_DOWN') return 'BOTH_THUMB_DOWN';
  if (rId === 'INDEX' && lId === 'INDEX') return 'BOTH_INDEX';
  if (rId === 'ROCK' && lId === 'ROCK') return 'BOTH_ROCK';
  return null;
}

// ── ISL Classifier ─────────────────────────────────────────────────────────
function classifyISL(rightLm: any[], leftLm: any[]): ISLWordId {
  const hasR = !!rightLm, hasL = !!leftLm;
  if (!hasR && !hasL) return 'UNKNOWN';
  
  const rPose = hasR ? classifyCustom(detectFingers(rightLm)) : 'UNKNOWN';
  const lPose = hasL ? classifyCustom(detectFingers(leftLm)) : 'UNKNOWN';

  // Two Hands Matching
  if (rPose === 'OPEN_PALM' && lPose === 'OPEN_PALM') return 'STOP';
  if (rPose === 'OPEN_PALM_DOWN' && lPose === 'OPEN_PALM_DOWN') return 'SAD';
  if (rPose === 'FIST' && lPose === 'FIST') return 'DONE';
  if (rPose === 'INDEX' && lPose === 'INDEX') return 'FRIEND';
  if (rPose === 'INDEX_SIDE' && lPose === 'INDEX_SIDE') return 'WHERE';
  if (rPose === 'PINKY' && lPose === 'PINKY') return 'HOUSE';
  if (rPose === 'ROCK' && lPose === 'ROCK') return 'CAR';
  if (rPose === 'THREE_THUMB' && lPose === 'THREE_THUMB') return 'MORE';
  if (rPose === 'FOUR' && lPose === 'FOUR') return 'THANK_YOU';

  // Two Hands Mixed
  if (rPose === 'OPEN_PALM' && lPose === 'FIST') return 'PLEASE';
  if (rPose === 'FIST' && lPose === 'OPEN_PALM') return 'SORRY';
  if (rPose === 'THUMB_UP' && lPose === 'OPEN_PALM') return 'HELP';
  if (rPose === 'THREE_THUMB' && lPose === 'OPEN_PALM') return 'MONEY';
  if (rPose === 'INDEX' && lPose === 'FIST') return 'TIME';
  if (rPose === 'INDEX_DOWN' && lPose === 'OPEN_PALM_DOWN') return 'WHEN';

  // One Hand (Right)
  if (!hasL) {
    if (rPose === 'OPEN_PALM') return 'HELLO';
    if (rPose === 'THUMB_UP') return 'GOOD';
    if (rPose === 'THUMB_DOWN') return 'BAD';
    if (rPose === 'FIST') return 'YES';
    if (rPose === 'PEACE') return 'NO';
    if (rPose === 'ILY') return 'I_LOVE_YOU';
    if (rPose === 'THREE_THUMB') return 'EAT';
    if (rPose === 'FOUR_THUMB') return 'DRINK';
    if (rPose === 'THREE') return 'WATER';
    if (rPose === 'ROCK') return 'TOILET';
    if (rPose === 'L_SHAPE') return 'LATE';
    if (rPose === 'SHAKA') return 'PERFECT';
    if (rPose === 'INDEX_SIDE') return 'YOU';
    if (rPose === 'INDEX_DOWN') return 'ME';
  }

  // One Hand (Left)
  if (!hasR) {
    if (lPose === 'OPEN_PALM') return 'WAIT';
  }

  return 'UNKNOWN';
}

function modeVote<T extends string>(history: T[]): T {
  if (!history.length) return 'UNKNOWN' as T;
  const counts: Record<string, number> = {};
  for (const g of history) counts[g] = (counts[g] || 0) + 1;
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]![0] as T;
}

// ── Main Unified Component ─────────────────────────────────────────────────

interface DetectorEngineProps {
  mode: 'asl' | 'isl' | 'custom' | 'ide';
  outputMode: 'word' | 'sentence';
  voicePref: 'female' | 'male';
  onWordDetected: (word: string) => void;
  onSignUpdate: (sign: string, confidence: number, progress: number) => void;
  onSentenceDetected: (phrase: string, gestureId: GestureId) => void;
  onGestureUpdate: (gestureId: GestureId, progress: number) => void;
  isPaused: boolean;
  onModeSwitch: (m: 'asl' | 'isl' | 'custom' | 'ide') => void;
  onUniversalAction: (action: 'speak' | 'polish') => void;
}

export default function DetectorEngine({
  mode,
  outputMode,
  voicePref,
  onWordDetected,
  onSignUpdate,
  onSentenceDetected,
  onGestureUpdate,
  isPaused,
  onModeSwitch,
  onUniversalAction,
}: DetectorEngineProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preprocessorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [statusMsg, setStatusMsg]         = useState('Starting camera…');

  const ttsRef             = useRef<TTSManager | null>(null);
  const aslModelRef        = useRef<any>(null);
  const islModelRef        = useRef<any>(null);
  const aslSignsRef        = useRef<Record<string, string>>({});
  const islSignsRef        = useRef<Record<string, string>>({});
  const modeRef            = useRef(mode);
  const outputModeRef      = useRef(outputMode);
  const voicePrefRef       = useRef(voicePref);
  const isPausedRef        = useRef(isPaused);
  const callbacksRef       = useRef({ onWordDetected, onSignUpdate, onSentenceDetected, onGestureUpdate, onUniversalAction, onModeSwitch });

  // Buffer state
  const frameBufferRef     = useRef<number[][][]>([]);
  const frameCounterRef    = useRef(0);
  const inferRunningRef    = useRef(false);

  // ASL state
  const candidateSignRef   = useRef('');
  const candidateCountRef  = useRef(0);
  const lastCommitTimeRef  = useRef(0);

  // Heuristic state (Custom/ISL)
  const historyRef       = useRef<string[]>([]);    
  const heurCandidateRef = useRef<string>('UNKNOWN');
  const heurConfirmRef   = useRef(0);
  const unknownStreakRef = useRef(0);
  const heurLastCommit   = useRef(0);

  // Keep latest callbacks/mode
  useEffect(() => { 
    modeRef.current = mode; 
    outputModeRef.current = outputMode;
    voicePrefRef.current = voicePref;
    isPausedRef.current = isPaused;
    callbacksRef.current = { onWordDetected, onSignUpdate, onSentenceDetected, onGestureUpdate, onUniversalAction, onModeSwitch };
  }, [mode, outputMode, voicePref, isPaused, onWordDetected, onSignUpdate, onSentenceDetected, onGestureUpdate, onUniversalAction, onModeSwitch]);

  useEffect(() => {
    let camera: any  = null;
    let holistic: any = null;
    let alive = true;

    async function init() {
      ttsRef.current = new TTSManager();

      try {
        const [aslRes, islRes] = await Promise.all([
          fetch('/signs.json'),
          fetch('/isl_signs.json')
        ]);
        aslSignsRef.current = await aslRes.json();
        islSignsRef.current = await islRes.json();
      } catch (e) {
        console.error('[GestureAI] Signs load failed', e);
      }

      setStatusMsg('Loading AI Engine…');
      const checkScripts = setInterval(async () => {
        const w = window as any;
        if (!alive) { clearInterval(checkScripts); return; }
        if (w.Holistic && w.Camera && w.tf && w.tflite) {
          clearInterval(checkScripts);
          setStatusMsg('Loading TFLite models…');

          try {
            w.tflite.setWasmPath('/tflite/'); 
            await w.tf.ready();
            
            const [aslModel, islModel] = await Promise.all([
              w.tflite.loadTFLiteModel('/model.tflite'),
              w.tflite.loadTFLiteModel('/isl_model.tflite')
            ]);
            
            aslModelRef.current = aslModel;
            islModelRef.current = islModel;
            setIsModelLoaded(true);
            setStatusMsg('');
          } catch (e) {
            console.error('[GestureAI] TFLite load failed', e);
          }

          if (!alive) return;
          setupMediaPipe(w);
        }
      }, 300);

      function setupMediaPipe(w: any) {
        setStatusMsg('Loading MediaPipe…');
        holistic = new w.Holistic({
          locateFile: (file: string) => `/mediapipe/holistic/${file}`, 
        });
        holistic.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        holistic.onResults(onResults);

        if (videoRef.current) {
          // Initialize invisible preprocessing canvas for GOD LEVEL low light
          const preCanvas = document.createElement('canvas');
          preCanvas.width = 320;
          preCanvas.height = 240;
          preprocessorCanvasRef.current = preCanvas;
          const preCtx = preCanvas.getContext('2d', { willReadFrequently: true });

          camera = new w.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && preprocessorCanvasRef.current && preCtx && holistic && alive) {
                // Apply Brightness/Contrast Filter before sending to MediaPipe
                preCtx.filter = 'brightness(1.5) contrast(1.2)';
                preCtx.drawImage(videoRef.current, 0, 0, preCanvas.width, preCanvas.height);
                // Send the processed canvas instead of raw video for instant inference
                await holistic.send({ image: preprocessorCanvasRef.current });
              }
            },
            width: 320,
            height: 240,
          });
          camera.start().then(() => {
            if (alive) setStatusMsg((aslModelRef.current && islModelRef.current) ? '' : 'Starting up…');
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

  // ── Processing ───────────────────────────────────────────────────────────
  function extractKeypoints(results: any): number[][] {
    const nanFill = (n: number) => Array.from({ length: n }, () => [0, 0, 0]);
    const take = (lms: any, n: number) => {
      if (!lms || lms.length === 0) return nanFill(n);
      const count = Math.min(lms.length, n);
      const res: number[][] = [];
      for (let i = 0; i < count; i++) res.push([lms[i].x, lms[i].y, lms[i].z]);
      for (let i = count; i < n; i++) res.push([0, 0, 0]);
      return res;
    };
    return [
      ...take(results.faceLandmarks, 468), 
      ...take(results.leftHandLandmarks, 21), 
      ...take(results.poseLandmarks, 33), 
      ...take(results.rightHandLandmarks, 21), 
    ];
  }

  function runInference(currentMode: 'asl' | 'isl') {
    const w = window as any;
    const activeModel = currentMode === 'asl' ? aslModelRef.current : islModelRef.current;
    const activeSigns = currentMode === 'asl' ? aslSignsRef.current : islSignsRef.current;

    if (!activeModel || !w.tf) return;
    if (inferRunningRef.current) return;
    if (frameBufferRef.current.length < FRAME_WINDOW) return;

    inferRunningRef.current = true;
    try {
      w.tf.tidy(() => {
        const frames = frameBufferRef.current.slice(-FRAME_WINDOW);
        const input = currentMode === 'isl' 
          ? w.tf.tensor4d([frames], [1, FRAME_WINDOW, 543, 3], 'float32')
          : w.tf.tensor3d(frames, [FRAME_WINDOW, 543, 3], 'float32');
        const pred   = activeModel.predict(input);
        const probs  = pred.dataSync() as Float32Array;

        let maxProb = 0, maxIdx = 0;
        for (let i = 0; i < probs.length; i++) {
          if (probs[i] > maxProb) { maxProb = probs[i]; maxIdx = i; }
        }

        const now  = Date.now();
        const CONF_THRESH = currentMode === 'isl' ? 0.35 : ASL_CONF_MIN;
        const sign = maxProb >= CONF_THRESH ? (activeSigns[maxIdx.toString()] || '') : '';
        const conf = Math.round(maxProb * 100);
        const inCooldown = now - lastCommitTimeRef.current < ASL_COOLDOWN;
        
        if (currentMode === 'isl' && frameCounterRef.current % 30 === 0) {
          console.log(`[ISL DEBUG] Top prediction: ${activeSigns[maxIdx.toString()]} (${conf}%)`);
        }

        if (sign && !inCooldown) {
          if (sign === candidateSignRef.current) {
            candidateCountRef.current++;
          } else {
            candidateSignRef.current  = sign;
            candidateCountRef.current = 1;
          }

          const REQUIRED_CONFIRM = currentMode === 'isl' ? 1 : ASL_CONFIRM;
          const progress = Math.min(candidateCountRef.current / REQUIRED_CONFIRM, 1);
          callbacksRef.current.onSignUpdate(sign, conf, progress);

          if (candidateCountRef.current >= REQUIRED_CONFIRM) {
            lastCommitTimeRef.current = now;
            candidateSignRef.current  = '';
            candidateCountRef.current = 0;
            frameBufferRef.current = [];
            callbacksRef.current.onWordDetected(sign);
            ttsRef.current?.speak(sign);
          }
        } else {
          if (sign !== candidateSignRef.current) {
            candidateSignRef.current  = '';
            candidateCountRef.current = 0;
          }
          if (inCooldown) callbacksRef.current.onSignUpdate(candidateSignRef.current || '', conf, 0);
          else callbacksRef.current.onSignUpdate('', conf, 0);
        }
      });
    } catch (e) {
      console.error('[GestureAI] Inference error', e);
    } finally {
      inferRunningRef.current = false;
    }
  }

  function processHeuristics(results: any) {
    const now = Date.now();
    const inCooldown = now - heurLastCommit.current < HEURISTIC_COOLDOWN;
    const currentMode = modeRef.current;

    let rawVal = 'UNKNOWN';
    const hasR = !!results.rightHandLandmarks, hasL = !!results.leftHandLandmarks;
    
    if (currentMode === 'isl') {
      rawVal = classifyISL(results.rightHandLandmarks, results.leftHandLandmarks);
    } else {
      if (hasR && hasL) rawVal = classifyTwoHandCustom(results.rightHandLandmarks, results.leftHandLandmarks) ?? 'UNKNOWN';
      else if (hasR || hasL) rawVal = classifyCustom(detectFingers(results.rightHandLandmarks ?? results.leftHandLandmarks));
    }

    const hist = historyRef.current;
    hist.push(rawVal);
    if (hist.length > HISTORY_SIZE) hist.shift();
    const gesture = modeVote(hist);  

    if (inCooldown) {
      callbacksRef.current.onGestureUpdate('UNKNOWN' as any, 0);
      return;
    }

    if (gesture === 'UNKNOWN') {
      unknownStreakRef.current++;
      if (unknownStreakRef.current >= UNKNOWN_RESET) {
        heurCandidateRef.current = 'UNKNOWN';
        heurConfirmRef.current = 0;
      }
      callbacksRef.current.onGestureUpdate('UNKNOWN' as any, 0);
      return;
    }

    unknownStreakRef.current = 0;

    if (gesture === heurCandidateRef.current) {
      heurConfirmRef.current++;
    } else {
      heurCandidateRef.current = gesture;
      heurConfirmRef.current = 2; // headstart
    }

    const progress = Math.min(heurConfirmRef.current / HEURISTIC_CONFIRM, 1);
    callbacksRef.current.onGestureUpdate(gesture as any, progress);

    if (heurConfirmRef.current >= HEURISTIC_CONFIRM) {
      heurLastCommit.current = now;
      heurCandidateRef.current = 'UNKNOWN';
      heurConfirmRef.current = 0;
      historyRef.current = [];  
      
      if (gesture === 'FOUR') { callbacksRef.current.onModeSwitch('cycle' as any); return; }
      
      // IDE Mode Support
      if (currentMode === 'ide') {
        const ideDef = IDE_MAP[gesture as GestureId];
        if (!ideDef) return;
        
        // Treat INDEX as RUN code, FIST as DEL, BOTH_FISTS as CLEAR
        if (gesture === 'INDEX' || gesture === 'PINKY' || gesture === 'FIST' || gesture === 'BOTH_FISTS') {
           callbacksRef.current.onSentenceDetected(ideDef.code, gesture as any);
           return;
        }
        callbacksRef.current.onSentenceDetected(ideDef.code, gesture as any);
        return;
      }

      // Universal Action Gestures
      if (gesture === 'INDEX') { callbacksRef.current.onUniversalAction('speak'); return; }
      if (gesture === 'PINKY') { callbacksRef.current.onUniversalAction('polish'); return; }

      const def = currentMode === 'isl' ? ISL_MAP[gesture as ISLWordId] : GESTURE_MAP[gesture as GestureId];
      if (!def) return;

      if (def.isUtility) {
        callbacksRef.current.onSentenceDetected('', gesture as any);
      } else {
        const textToSpeak = (outputModeRef.current === 'sentence' && def.sentence) ? def.sentence : (def.phrase || def.label);
        if (textToSpeak) {
          // Send to onSentenceDetected which updates the UI text
          ttsRef.current?.speak(textToSpeak, voicePrefRef.current);
          callbacksRef.current.onSentenceDetected(textToSpeak, gesture as any);
        }
      }
    }
  }

  function processUniversalHeuristics(results: any) {
    const hasR = !!results.rightHandLandmarks, hasL = !!results.leftHandLandmarks;
    if (!hasR && !hasL) return;
    
    // Only looking at right hand (or left if right is missing) for global commands to save CPU
    const rawVal = classifyCustom(detectFingers(results.rightHandLandmarks ?? results.leftHandLandmarks));
    
    // Quick and dirty confirmation for global commands when ASL engine is running
    const hist = historyRef.current;
    hist.push(rawVal);
    if (hist.length > HISTORY_SIZE) hist.shift();
    const gesture = modeVote(hist);
    
    const now = Date.now();
    if (now - heurLastCommit.current < HEURISTIC_COOLDOWN) return;
    
    if (gesture === 'UNKNOWN') {
       heurCandidateRef.current = 'UNKNOWN';
       heurConfirmRef.current = 0;
       return;
    }
    
    if (gesture === heurCandidateRef.current) heurConfirmRef.current++;
    else { heurCandidateRef.current = gesture; heurConfirmRef.current = 2; }
    
    if (heurConfirmRef.current >= HEURISTIC_CONFIRM) {
      if (gesture === 'FOUR') { heurLastCommit.current = now; callbacksRef.current.onModeSwitch('cycle' as any); return; }
      if (gesture === 'INDEX') { heurLastCommit.current = now; callbacksRef.current.onUniversalAction('speak'); return; }
      if (gesture === 'PINKY') { heurLastCommit.current = now; callbacksRef.current.onUniversalAction('polish'); return; }
    }
  }

  function onResults(results: any) {
    if (isPausedRef.current) return;
    
    const w = window as any;
    const currentMode = modeRef.current;

    // ── Render Frame ───────────────────────────────────────────────────────
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        try {
          ctx.save();
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.translate(canvasRef.current.width, 0);
          ctx.scale(-1, 1);
          // Draw the raw camera feed to the user so the brightness filter is hidden in the background
          if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          } else {
            ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (w.drawConnectors) {
            if (currentMode === 'asl') {
              if (results.faceLandmarks && w.FACEMESH_CONTOURS) {
                w.drawConnectors(ctx, results.faceLandmarks, w.FACEMESH_CONTOURS, { color: 'rgba(129,140,248,0.45)', lineWidth: 1 });
              }
              if (results.poseLandmarks && w.POSE_CONNECTIONS) {
                w.drawConnectors(ctx, results.poseLandmarks, w.POSE_CONNECTIONS, { color: 'rgba(248,250,252,0.5)', lineWidth: 2 });
              }
            }
            const drawHand = (lms: any, color: string) => {
              if (!lms || !w.HAND_CONNECTIONS) return;
              w.drawConnectors(ctx, lms, w.HAND_CONNECTIONS, { color, lineWidth: 3 });
              if (w.drawLandmarks) w.drawLandmarks(ctx, lms, { color: '#ffffff', lineWidth: 1, radius: 3 });
            };
            if (currentMode === 'isl') {
              drawHand(results.leftHandLandmarks, '#ff9900');
              drawHand(results.rightHandLandmarks, '#00ccff');
            } else {
              drawHand(results.leftHandLandmarks, '#A78BFA');
              drawHand(results.rightHandLandmarks, '#A78BFA');
            }
          }
          ctx.restore();
        } catch {
          try { ctx.restore(); } catch {}
        }
      }
    }

    // ── Dispatch logic based on mode ────────────────────────────────────────
    if (currentMode === 'asl') {
      processUniversalHeuristics(results); // Run lightweight pose check for global commands
      
      frameBufferRef.current.push(extractKeypoints(results));
      if (frameBufferRef.current.length > FRAME_WINDOW) frameBufferRef.current.shift();
      frameCounterRef.current++;
      if (frameCounterRef.current % INFER_EVERY === 0 && frameBufferRef.current.length >= FRAME_WINDOW) {
        runInference(currentMode);
      }
    } else {
      processHeuristics(results);
    }
  }

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
