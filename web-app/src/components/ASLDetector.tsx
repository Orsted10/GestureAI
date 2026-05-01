"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RandomForestClassifier, RandomForestModel } from "@/lib/randomForest";
import { Loader2, MonitorStop, Play, RefreshCw, Type, Volume2, Copy, Check, HandMetal, Download, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LABELS: Record<string, string> = {
  "a": "a", "b": "b", "c": "c", "d": "d", "e": "e", "f": "f", "g": "g", "h": "h", "i": "i", 
  "j": "j", "k": "k", "l": "l", "m": "m", "n": "n", "o": "o", "p": "p", "q": "q", "r": "r", 
  "s": "s", "t": "t", "u": "u", "v": "v", "w": "w", "x": "x", "y": "y", "z": "z",
  "1": "Back Space", "2": "Clear", "3": "Space", "4": ""
};

export default function ASLDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<RandomForestClassifier | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [predictedChar, setPredictedChar] = useState<string>("");
  const [sentence, setSentence] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const sameCharCountRef = useRef(0);
  const lastCharRef = useRef("");
  const sentenceRef = useRef("");
  const cameraRef = useRef<unknown>(null);

  // Load the model
  useEffect(() => {
    fetch("/model.json")
      .then((res) => res.json())
      .then((data: RandomForestModel) => {
        setModel(new RandomForestClassifier(data));
        setIsModelLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load model:", err);
        setIsModelLoading(false);
      });
  }, []);

  const onResults = useCallback(
    (results: { image: HTMLCanvasElement; multiHandLandmarks?: { x: number; y: number }[][] }) => {
      if (!canvasRef.current || !videoRef.current || !model) return;

      const { drawConnectors, drawLandmarks } = window as unknown as { drawConnectors: (...args: unknown[]) => void, drawLandmarks: (...args: unknown[]) => void };
      const { HAND_CONNECTIONS } = window as unknown as { HAND_CONNECTIONS: unknown };

      const canvasCtx = canvasRef.current.getContext("2d");
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Mirror the canvas to match mirrored video
      canvasCtx.translate(canvasRef.current.width, 0);
      canvasCtx.scale(-1, 1);
      
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 3,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: "#FF0000",
            lineWidth: 2,
            radius: 4
          });

          // Normalize landmarks
          const xCoords = landmarks.map((l: { x: number }) => l.x);
          const yCoords = landmarks.map((l: { y: number }) => l.y);
          const minX = Math.min(...xCoords);
          const minY = Math.min(...yCoords);

          const features: number[] = [];
          for (const l of landmarks) {
            features.push(l.x - minX, l.y - minY);
          }

          // Predict
          const char = model.predict(features);
          setPredictedChar(LABELS[char] || "");

          if (char !== "4") {
            if (char === lastCharRef.current) {
              sameCharCountRef.current += 1;
            } else {
              sameCharCountRef.current = 0;
              lastCharRef.current = char;
            }

            // If same character detected for 30 frames
            if (sameCharCountRef.current === 30) {
              let currentSentence = sentenceRef.current;
              
              if (char === "1") {
                // Back Space
                currentSentence = currentSentence.slice(0, -1);
              } else if (char === "2") {
                // Clear
                currentSentence = "";
              } else if (char === "3") {
                // Space
                currentSentence += " ";
              } else {
                // Normal character
                currentSentence += LABELS[char] || "";
              }

              sentenceRef.current = currentSentence;
              setSentence(currentSentence);
              sameCharCountRef.current = 0;
            }
          }
        }
      } else {
        setPredictedChar("");
      }
      canvasCtx.restore();
    },
    [model]
  );

  const startCamera = useCallback(() => {
    if (!videoRef.current || isCameraStarting || isCameraActive) return;
    
    setIsCameraStarting(true);
    const { Hands, Camera } = window as unknown as { Hands: new (options: unknown) => unknown, Camera: new (video: HTMLVideoElement, options: unknown) => unknown };

    if (!Hands || !Camera) {
      console.error("MediaPipe not loaded yet");
      setIsCameraStarting(false);
      return;
    }

    try {
      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      }) as { setOptions: (opts: unknown) => void, onResults: (cb: unknown) => void, send: (opts: unknown) => Promise<void> };
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.9,
        minTrackingConfidence: 0.9,
      });
      
      hands.onResults(onResults);

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      }) as { start: () => Promise<void> };
      
      camera.start().then(() => {
        setIsCameraActive(true);
        setIsCameraStarting(false);
      }).catch((err: unknown) => {
        console.error("Failed to start camera:", err);
        setIsCameraStarting(false);
      });
      cameraRef.current = camera;
    } catch (err) {
      console.error("Error initializing MediaPipe:", err);
      setIsCameraStarting(false);
    }
  }, [onResults, isCameraStarting, isCameraActive]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      (cameraRef.current as { stop: () => void }).stop();
      setIsCameraActive(false);
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  const clearText = () => {
    sentenceRef.current = "";
    setSentence("");
  };

  const speakText = () => {
    if (!sentence) return;
    const utterance = new SpeechSynthesisUtterance(sentence);
    window.speechSynthesis.speak(utterance);
  };

  const copyText = () => {
    if (!sentence) return;
    navigator.clipboard.writeText(sentence);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadText = () => {
    if (!sentence) return;
    const element = document.createElement("a");
    const file = new Blob([sentence], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "GestureAI_Translation.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareText = async () => {
    if (!sentence) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GestureAI Translation',
          text: sentence,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyText();
    }
  };

  // Word & Character count calculations
  const charCount = sentence.length;
  const wordCount = sentence.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Video Section */}
      <div className="flex-[1.2] flex flex-col gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden bg-black/40 aspect-[4/3] shadow-2xl border border-white/10 flex items-center justify-center backdrop-blur-md"
        >
          {isModelLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-white">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
              <p className="font-medium text-gray-300">Initializing AI Core...</p>
            </div>
          )}
          
          {!isCameraActive && !isModelLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white">
              <div className="p-4 bg-white/5 rounded-full mb-4 border border-white/10">
                <Type className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-400">Camera is offline</p>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover hidden"
            playsInline
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] rounded-3xl"
          />
          
          {/* Real-time prediction overlay */}
          <AnimatePresence>
            {predictedChar && isCameraActive && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-6 left-6 z-20 bg-black/50 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center min-w-[100px]"
              >
                <span className="text-xs font-medium uppercase tracking-widest text-indigo-300 mb-1">Detected</span>
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">{predictedChar}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center mt-2"
        >
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              disabled={isModelLoading || isCameraStarting}
              className="flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:bg-white/10 disabled:text-white rounded-full font-semibold transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              {isCameraStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {isCameraStarting ? "Connecting to Camera..." : "Start Camera"}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full font-semibold transition-all"
            >
              <MonitorStop className="w-5 h-5" />
              Stop Camera
            </button>
          )}
        </motion.div>
      </div>

      {/* Translation Result Section */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col gap-4"
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl h-full min-h-[350px] flex flex-col relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-indigo-400" />
              Live Translation
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={speakText}
                disabled={!sentence}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Speak text"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                onClick={copyText}
                disabled={!sentence}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Copy text"
              >
                {isCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={downloadText}
                disabled={!sentence}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent hidden sm:block"
                title="Download as TXT"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={shareText}
                disabled={!sentence}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={clearText}
                className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-colors"
                title="Clear text"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-black/50 rounded-2xl p-8 border border-white/5 relative z-10 flex flex-col justify-between">
            {sentence ? (
              <p className="text-4xl text-white font-medium leading-relaxed tracking-tight overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {sentence}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                <HandMetal className="w-12 h-12 opacity-20" />
                <p className="text-lg font-medium">Waiting for gestures...</p>
              </div>
            )}
            
            {/* Real-time stats footer */}
            <div className="flex justify-between items-center text-xs text-gray-500 mt-6 border-t border-white/5 pt-4">
              <div className="flex gap-4">
                <span>{charCount} characters</span>
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center gap-2">
                {isCameraActive && (
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span>Live Feed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
