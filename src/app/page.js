'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Indeks bibir MediaPipe (Tetap sama sesuai backend)
const LIP_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308
];

// Konstanta Trigger dari V5
const LIP_START_THRESHOLD = 0.045; // Increased from 0.038
const LIP_KEEP_THRESHOLD = 0.035;  // Increased from 0.028
const ACTIVITY_THRESHOLD = 0.008;  // Increased from 0.0035
const EMA_ALPHA = 0.15;           // Decreased from 0.3 for more smoothing
const START_DELAY_FRAMES = 6;     // Increased from 3 (requires longer movement)
const SILENCE_TIMEOUT = 25;       // Increased from 20 for more natural pause
const MIN_FRAMES = 15;            // Increased from 12
const MAX_FRAMES = 90;
const BACKEND_URL = 'http://localhost:8000/predict';

export default function LipReadingPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('initializing'); // initializing, ready, recording, processing, success, error, cooldown
  const [statusMsg, setStatusMsg] = useState('LOADING ENGINE...');
  const [progress, setProgress] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({
    faceMesh: false,
    camera: false,
    drawing: false
  });

  // Mutable refs for tracking state without re-renders
  const stateRef = useRef({
    isRecording: false,
    buffer: [],
    historyDist: [],
    smoothedDist: 0,
    activeFrames: 0,
    silenceCounter: 0,
    cooldownUntil: 0,
    isManualMode: false,
    smoothedLandmarks: null
  });

  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  const calculateLipDistance = (landmarks) => {
    const p13 = landmarks[13];
    const p14 = landmarks[14];
    const p10 = landmarks[10];
    const p152 = landmarks[152];

    const faceHeight = Math.sqrt(Math.pow(p10.x - p152.x, 2) + Math.pow(p10.y - p152.y, 2));
    const dist = Math.sqrt(Math.pow(p13.x - p14.x, 2) + Math.pow(p13.y - p14.y, 2));

    return faceHeight > 0 ? dist / faceHeight : 0;
  };

  const getRecentActivity = () => {
    const hist = stateRef.current.historyDist;
    if (hist.length < 10) return 0;
    const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
    const std = Math.sqrt(hist.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / hist.length);
    return std;
  };

  const onResults = (results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Sync canvas dimensions with video resolution to ensure landmarks align
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const canvasCtx = canvas.getContext('2d');
    const { width, height } = canvas;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);

    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0];
      const state = stateRef.current;

      // Smoothing landmarks for visual stability
      if (!state.smoothedLandmarks) {
        state.smoothedLandmarks = landmarks.map(p => ({ ...p }));
      } else {
        state.smoothedLandmarks.forEach((p, i) => {
          p.x = (EMA_ALPHA * landmarks[i].x) + ((1 - EMA_ALPHA) * p.x);
          p.y = (EMA_ALPHA * landmarks[i].y) + ((1 - EMA_ALPHA) * p.y);
          p.z = (EMA_ALPHA * landmarks[i].z) + ((1 - EMA_ALPHA) * p.z);
        });
      }

      // Draw using smoothed landmarks for premium feel
      drawLipVisuals(canvasCtx, state.smoothedLandmarks, width, height, state.isRecording);

      // Trigger Logic
      const rawDist = calculateLipDistance(landmarks);
      state.smoothedDist = (EMA_ALPHA * rawDist) + ((1 - EMA_ALPHA) * state.smoothedDist);
      state.historyDist.push(state.smoothedDist);
      if (state.historyDist.length > 20) state.historyDist.shift();

      const now = Date.now();
      const activity = getRecentActivity();

      if (now < state.cooldownUntil) {
        if (status !== 'cooldown') {
          setStatus('cooldown');
          setStatusMsg('COOLDOWN...');
        }
        state.activeFrames = 0;
      } else if (!state.isManualMode) {
        // AUTO TRIGGER LOGIC
        const threshold = state.isRecording ? LIP_KEEP_THRESHOLD : LIP_START_THRESHOLD;
        const isMoving = state.smoothedDist > threshold || activity > ACTIVITY_THRESHOLD;

        if (isMoving) {
          state.activeFrames++;
          if (state.activeFrames >= START_DELAY_FRAMES) {
            if (!state.isRecording) {
              startCapturing();
            }
            state.silenceCounter = 0;
            collectFrame(landmarks);
          } else {
            setStatusMsg('VALIDATING...');
          }
        } else {
          state.activeFrames = 0;
          if (state.isRecording) {
            state.silenceCounter++;
            collectFrame(landmarks);

            if (state.silenceCounter > SILENCE_TIMEOUT) {
              finishCapturing();
            } else {
              setStatusMsg('WAITING FOR PAUSE...');
            }
          } else {
            if (status !== 'ready') {
              setStatus('ready');
              setStatusMsg('READY (START SPEAKING)');
            }
          }
        }
      } else if (state.isRecording) {
        collectFrame(landmarks);
        if (state.buffer.length >= MAX_FRAMES) {
          finishCapturing();
        }
      }
    } else {
      setStatusMsg('SEARCHING FACE...');
    }
    canvasCtx.restore();
  };

  const drawLipVisuals = (ctx, landmarks, w, h, isRecording) => {
    // Subtle face mesh
    ctx.strokeStyle = isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 0.5;

    // Draw connections (simplified for lips)
    const drawIndices = (indices, color, width, closed = true) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowBlur = isRecording ? 10 : 0;
      ctx.shadowColor = color;

      indices.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
        else ctx.lineTo(pt.x * w, pt.y * h);
      });
      if (closed) ctx.closePath();
      ctx.stroke();
    };

    const outerLip = LIP_INDICES.slice(0, 21);
    const innerLip = LIP_INDICES.slice(21);

    drawIndices(outerLip, isRecording ? '#ef4444' : '#6366f1', 2);
    drawIndices(innerLip, isRecording ? '#f87171' : '#818cf8', 1);

    // Points
    ctx.fillStyle = isRecording ? '#ef4444' : '#6366f1';
    LIP_INDICES.forEach(idx => {
      const pt = landmarks[idx];
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const collectFrame = (landmarks) => {
    const lipPoints = LIP_INDICES.map(idx => ({ x: landmarks[idx].x, y: landmarks[idx].y }));
    const normalized = normalizeLandmarks(lipPoints);
    stateRef.current.buffer.push(normalized);
    setProgress((stateRef.current.buffer.length / MAX_FRAMES) * 100);
  };

  const normalizeLandmarks = (points) => {
    const meanX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
    const centered = points.map(p => ({ x: p.x - meanX, y: p.y - meanY }));
    const maxDist = Math.max(...centered.flatMap(p => [Math.abs(p.x), Math.abs(p.y)]));
    return maxDist > 0 ? centered.flatMap(p => [p.x / maxDist, p.y / maxDist]) : centered.flatMap(p => [p.x, p.y]);
  };

  const startCapturing = () => {
    stateRef.current.isRecording = true;
    stateRef.current.buffer = [];
    stateRef.current.silenceCounter = 0;
    setStatus('recording');
    setStatusMsg('LISTENING...');
  };

  const finishCapturing = () => {
    const state = stateRef.current;
    state.isRecording = false;

    // Calculate if there was significant movement in the buffer to avoid sending "noise"
    const totalActivity = state.historyDist.reduce((a, b) => a + b, 0) / state.historyDist.length;
    const hasEnoughMovement = totalActivity > LIP_KEEP_THRESHOLD * 0.8;

    if (state.buffer.length >= MIN_FRAMES && hasEnoughMovement) {
      setStatus('processing');
      setStatusMsg('ANALYZING...');

      // Padding
      let finalBuffer = [...state.buffer];
      if (finalBuffer.length < MAX_FRAMES) {
        const lastFrame = finalBuffer[finalBuffer.length - 1];
        while (finalBuffer.length < MAX_FRAMES) finalBuffer.push(lastFrame);
      } else {
        finalBuffer = finalBuffer.slice(0, MAX_FRAMES);
      }

      sendToBackend(finalBuffer.flat());
    } else {
      setStatus('ready');
      setStatusMsg(hasEnoughMovement ? 'TOO SHORT, TRY AGAIN' : 'NO SIGNIFICANT MOVEMENT');
      state.buffer = [];
    }
  };

  const sendToBackend = async (landmarks) => {
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks })
      });
      const data = await response.json();
      if (data.success) {
        setPrediction(data);
        setHistory(prev => [data, ...prev].slice(0, 5));
        setStatus('success');
        setStatusMsg('RECOGNIZED!');
        stateRef.current.cooldownUntil = Date.now() + 1500;
      } else throw new Error('Failed');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    const allLoaded = scriptsLoaded.faceMesh && scriptsLoaded.camera && scriptsLoaded.drawing;
    if (typeof window !== 'undefined' && allLoaded && !faceMeshRef.current) {
      const init = async () => {
        try {
          const vision = await window.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
          
          const faceLandmarker = await window.FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: "GPU"
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
            runningMode: "VIDEO",
            numFaces: 1
          });

          faceMeshRef.current = faceLandmarker;

          if (videoRef.current) {
            let lastFrameTime = 0;
            const FPS = 24; 
            const interval = 1000 / FPS;

            const camera = new window.Camera(videoRef.current, {
              onFrame: async () => {
                if (!faceMeshRef.current) return;
                const now = Date.now();
                if (now - lastFrameTime >= interval) {
                  lastFrameTime = now;
                  const results = faceMeshRef.current.detectForVideo(videoRef.current, now);
                  onResults(results);
                }
              },
              width: 640,
              height: 480
            });
            camera.start();
            cameraRef.current = camera;
          }
        } catch (err) {
          console.error("Failed to initialize FaceLandmarker:", err);
          setError("Failed to load MediaPipe Tasks engine");
        }
      };
      init();
    }
    return () => cameraRef.current?.stop();
  }, [scriptsLoaded]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-indigo-500/30">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js" onLoad={() => setScriptsLoaded(p => ({ ...p, faceMesh: true }))} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" onLoad={() => setScriptsLoaded(p => ({ ...p, camera: true }))} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" onLoad={() => setScriptsLoaded(p => ({ ...p, drawing: true }))} />

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 flex flex-col gap-8 relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[150px] -z-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-500/5 blur-[150px] -z-10 rounded-full"></div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">LIPREADING<span className="text-indigo-500">.AI</span></h1>
              <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Intelligent Neural Recognition V5</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
            <div className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-black tracking-widest text-zinc-400">{statusMsg}</span>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="glass-card relative aspect-video overflow-hidden group border-indigo-500/10">
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
              />

              {status === 'recording' && <div className="scanner-line"></div>}
              {status === 'initializing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[10px] font-black tracking-[0.3em] text-indigo-400">LOADING VISION ENGINE</p>
                </div>
              )}

              <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-widest">SMOOTHED DISTANCE</span>
                  <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-75" style={{ width: `${Math.min(100, stateRef.current.smoothedDist * 1000)}%` }}></div>
                  </div>
                </div>
                {status === 'recording' && (
                  <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                    <div className="progress-container scale-75">
                      <svg className="progress-ring" width="44" height="44">
                        <circle className="text-white/10" strokeWidth="4" stroke="currentColor" fill="transparent" r="18" cx="22" cy="22" />
                        <circle className="progress-ring__circle" strokeWidth="4" strokeDasharray="113.1" strokeDashoffset={113.1 - (progress / 100) * 113.1} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="22" cy="22" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black text-red-500">{stateRef.current.buffer.length} / 90</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'ENGINE', val: 'V5 ANTI-JITTER' },
                { label: 'THRESHOLD', val: LIP_START_THRESHOLD },
                { label: 'LATENCY', val: '12ms' },
                { label: 'STATUS', val: status.toUpperCase() }
              ].map((item, i) => (
                <div key={i} className="glass-card p-4 border-white/5">
                  <p className="text-[9px] font-black text-zinc-600 tracking-[0.2em] mb-1">{item.label}</p>
                  <p className="text-xs font-bold text-zinc-300">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-card p-8 flex flex-col gap-8 flex-1 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Inference</h2>
                  <button
                    onClick={() => {
                      stateRef.current.isManualMode = !stateRef.current.isManualMode;
                      stateRef.current.isRecording = false;
                      setStatus('ready');
                      setStatusMsg(stateRef.current.isManualMode ? 'MANUAL MODE' : 'AUTO MODE');
                    }}
                    className={`text-[9px] font-black px-2 py-1 rounded-md border transition-all ${stateRef.current.isManualMode ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}
                  >
                    {stateRef.current.isManualMode ? 'MANUAL' : 'AUTO'}
                  </button>
                </div>

                {stateRef.current.isManualMode && (
                  <button
                    onClick={() => stateRef.current.isRecording ? finishCapturing() : startCapturing()}
                    className={`glow-btn py-4 ${stateRef.current.isRecording ? 'record-btn' : ''}`}
                  >
                    {stateRef.current.isRecording ? 'Stop Recording' : 'Record Sequence'}
                  </button>
                )}

                <div className={`glass-card p-6 min-h-[160px] flex flex-col items-center justify-center text-center transition-all duration-700 ${status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : 'bg-black/20'}`}>
                  {status === 'processing' ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black tracking-widest text-indigo-400">ANALYZING SPEECH</p>
                    </div>
                  ) : status === 'success' && prediction ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <span className="text-[10px] font-black text-emerald-500 tracking-[0.3em] mb-4 uppercase">RESULT IDENTIFIED</span>
                      <h3 className="text-5xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">{prediction.word}</h3>
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000" style={{ width: `${prediction.confidence * 100}%` }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 tracking-widest">{Math.round(prediction.confidence * 100)}% CONFIDENCE</span>
                      </div>
                    </div>
                  ) : (
                    <div className="opacity-10 flex flex-col items-center gap-3">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
                      <p className="text-[10px] font-bold tracking-widest">AWAITING SPEECH</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto border-t border-white/5 pt-6">
                <h4 className="text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-4">Recent History</h4>
                <div className="flex flex-col gap-3">
                  {history.length > 0 ? history.map((h, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-zinc-300 uppercase">{h.word}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{Math.round(h.confidence * 100)}%</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-zinc-700 italic">No history yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
