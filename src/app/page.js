'use client';

import React, { useEffect, useRef, useState } from 'react';
import CameraVision from '../components/CameraVision';
import { predictFromApi } from '../lib/modelApi';

const LIP_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
];

const LIP_START_THRESHOLD = 0.045;
const LIP_KEEP_THRESHOLD = 0.035;
const ACTIVITY_THRESHOLD = 0.008;
const EMA_ALPHA = 0.15;
const START_DELAY_FRAMES = 6;
const SILENCE_TIMEOUT = 25;
const MIN_FRAMES = 15;
const MAX_FRAMES = 90;

export default function LipReadingPage() {
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('CAMERA OFF');
  const [progress, setProgress] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const stateRef = useRef({
    isRecording: false,
    buffer: [],
    historyDist: [],
    smoothedDist: 0,
    activeFrames: 0,
    silenceCounter: 0,
    cooldownUntil: 0,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lip_history');
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore localStorage failures
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lip_history', JSON.stringify(history));
    } catch {
      // ignore localStorage failures
    }
  }, [history]);

  const normalizeLandmarks = (points) => {
    const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const centered = points.map((point) => ({ x: point.x - meanX, y: point.y - meanY }));
    const maxDist = Math.max(...centered.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)]));
    return maxDist > 0
      ? centered.flatMap((point) => [point.x / maxDist, point.y / maxDist])
      : centered.flatMap((point) => [point.x, point.y]);
  };

  const calculateLipDistance = (landmarks) => {
    const p13 = landmarks[13];
    const p14 = landmarks[14];
    const p10 = landmarks[10];
    const p152 = landmarks[152];
    const faceHeight = Math.sqrt((p10.x - p152.x) ** 2 + (p10.y - p152.y) ** 2);
    const dist = Math.sqrt((p13.x - p14.x) ** 2 + (p13.y - p14.y) ** 2);
    return faceHeight > 0 ? dist / faceHeight : 0;
  };

  const getRecentActivity = () => {
    const hist = stateRef.current.historyDist;
    if (hist.length < 10) return 0;
    const mean = hist.reduce((sum, value) => sum + value, 0) / hist.length;
    const variance = hist.reduce((sum, value) => sum + (value - mean) ** 2, 0) / hist.length;
    return Math.sqrt(variance);
  };

  const collectFrame = (landmarks) => {
    const lipPoints = LIP_INDICES.map((idx) => ({ x: landmarks[idx].x, y: landmarks[idx].y }));
    stateRef.current.buffer.push(normalizeLandmarks(lipPoints));
    setProgress((stateRef.current.buffer.length / MAX_FRAMES) * 100);
  };

  const startCapturing = () => {
    stateRef.current.isRecording = true;
    stateRef.current.buffer = [];
    stateRef.current.silenceCounter = 0;
    setStatus('recording');
    setStatusMsg('LISTENING...');
  };

  const finishCapturing = async () => {
    const state = stateRef.current;
    state.isRecording = false;

    const totalActivity = state.historyDist.reduce((sum, value) => sum + value, 0) / Math.max(1, state.historyDist.length);
    const hasEnoughMovement = totalActivity > LIP_KEEP_THRESHOLD * 0.8;

    if (state.buffer.length < MIN_FRAMES || !hasEnoughMovement) {
      setStatus('ready');
      setStatusMsg(hasEnoughMovement ? 'TOO SHORT, TRY AGAIN' : 'NO SIGNIFICANT MOVEMENT');
      state.buffer = [];
      setProgress(0);
      return;
    }

    setStatus('processing');
    setStatusMsg('ANALYZING...');

    let finalBuffer = [...state.buffer];
    if (finalBuffer.length < MAX_FRAMES) {
      const lastFrame = finalBuffer[finalBuffer.length - 1];
      while (finalBuffer.length < MAX_FRAMES) finalBuffer.push(lastFrame);
    } else {
      finalBuffer = finalBuffer.slice(0, MAX_FRAMES);
    }

    try {
      const data = await predictFromApi(finalBuffer.flat());
      setPrediction(data);
      setHistory((prev) => [data, ...prev].slice(0, 5));
      setStatus('success');
      setStatusMsg('RECOGNIZED!');
      state.cooldownUntil = Date.now() + 1500;
    } catch (err) {
      setError(err.message || 'Prediction failed');
      setStatus('error');
      setStatusMsg('API ERROR');
    } finally {
      state.buffer = [];
      setProgress(0);
    }
  };

  const handleLandmarks = (landmarks) => {
    const state = stateRef.current;
    const rawDist = calculateLipDistance(landmarks);
    state.smoothedDist = (EMA_ALPHA * rawDist) + ((1 - EMA_ALPHA) * state.smoothedDist);
    state.historyDist.push(state.smoothedDist);
    if (state.historyDist.length > 20) state.historyDist.shift();

    const now = Date.now();
    const activity = getRecentActivity();

    if (now < state.cooldownUntil) {
      setStatus('cooldown');
      setStatusMsg('COOLDOWN...');
      state.activeFrames = 0;
      return;
    }

    if (!state.isRecording) {
      const isMoving = state.smoothedDist > LIP_START_THRESHOLD || activity > ACTIVITY_THRESHOLD;
      if (isMoving) {
        state.activeFrames += 1;
        if (state.activeFrames >= START_DELAY_FRAMES) {
          startCapturing();
          collectFrame(landmarks);
        } else {
          setStatus('ready');
          setStatusMsg('VALIDATING...');
        }
      } else {
        state.activeFrames = 0;
        setStatus('ready');
        setStatusMsg('READY (START SPEAKING)');
      }
      return;
    }

    collectFrame(landmarks);
    const threshold = state.isRecording ? LIP_KEEP_THRESHOLD : LIP_START_THRESHOLD;
    const isMoving = state.smoothedDist > threshold || activity > ACTIVITY_THRESHOLD;

    if (isMoving) {
      state.silenceCounter = 0;
      setStatusMsg('LISTENING...');
    } else {
      state.silenceCounter += 1;
      setStatusMsg('WAITING FOR PAUSE...');
      if (state.silenceCounter > SILENCE_TIMEOUT || state.buffer.length >= MAX_FRAMES) {
        finishCapturing();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 flex flex-col gap-8 relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[150px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-500/5 blur-[150px] -z-10 rounded-full" />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-500">
              LIPREADING<span className="text-indigo-500">.AI</span>
            </h1>
            <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Single-user lipreading demo</p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
            <div className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black tracking-widest text-zinc-400">{statusMsg}</span>
            <button
              onClick={() => {
                setCameraOn((value) => !value);
                setStatus('ready');
                setStatusMsg(cameraOn ? 'CAMERA OFF' : 'CAMERA ON');
                if (cameraOn) {
                  stateRef.current.isRecording = false;
                  stateRef.current.buffer = [];
                  setProgress(0);
                }
              }}
              className="ml-3 text-xs font-bold px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
            >
              {cameraOn ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="glass-card relative aspect-video overflow-hidden group border-indigo-500/10">
              {cameraOn ? (
                <CameraVision enabled={cameraOn} onLandmarks={handleLandmarks} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/60">
                  <p className="text-sm text-zinc-400">Camera is off</p>
                </div>
              )}

              {status === 'initializing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-[10px] font-black tracking-[0.3em] text-indigo-400">LOADING VISION ENGINE</p>
                </div>
              )}

              <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-widest">CAPTURE PROGRESS</span>
                  <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-75" style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                </div>
                {status === 'recording' && (
                  <span className="text-[10px] font-black text-red-500">{stateRef.current.buffer.length} / {MAX_FRAMES}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'ENGINE', val: 'V5 ANTI-JITTER' },
                { label: 'THRESHOLD', val: LIP_START_THRESHOLD },
                { label: 'LATENCY', val: 'API' },
                { label: 'STATUS', val: status.toUpperCase() },
              ].map((item) => (
                <div key={item.label} className="glass-card p-4 border-white/5">
                  <p className="text-[9px] font-black text-zinc-600 tracking-[0.2em] mb-1">{item.label}</p>
                  <p className="text-xs font-bold text-zinc-300">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-card p-8 flex flex-col gap-8 flex-1 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-12 -mt-12 rounded-full blur-2xl" />

              <div className={`glass-card p-6 min-h-40 flex flex-col items-center justify-center text-center transition-all duration-700 ${status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : 'bg-black/20'}`}>
                {status === 'processing' ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-black tracking-widest text-indigo-400">ANALYZING SPEECH</p>
                  </div>
                ) : status === 'success' && prediction ? (
                  <div>
                    <span className="text-[10px] font-black text-emerald-500 tracking-[0.3em] mb-4 uppercase block">RESULT IDENTIFIED</span>
                    <h3 className="text-5xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-zinc-500">{prediction.word}</h3>
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000" style={{ width: `${Math.round((prediction.confidence || 0) * 100)}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 tracking-widest">{Math.round((prediction.confidence || 0) * 100)}% CONFIDENCE</span>
                    </div>
                  </div>
                ) : (
                  <div className="opacity-10 flex flex-col items-center gap-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </svg>
                    <p className="text-[10px] font-bold tracking-widest">AWAITING SPEECH</p>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="mt-auto border-t border-white/5 pt-6">
                <h4 className="text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-4">Recent History</h4>
                <div className="flex flex-col gap-3">
                  {history.length > 0 ? history.map((item, index) => (
                    <div key={`${item.word}-${index}`} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-zinc-300 uppercase">{item.word}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{Math.round((item.confidence || 0) * 100)}%</span>
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
