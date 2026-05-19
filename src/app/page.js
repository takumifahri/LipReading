'use client';

import { useEffect, useRef, useState } from 'react';
import BackendKnowledgeSection from '../components/companyProfile/BackendKnowledgeSection';
import DemoSection from '../components/companyProfile/DemoSection';
import HeroSection from '../components/companyProfile/HeroSection';
import PreferenceBanner from '../components/companyProfile/PreferenceBanner';
import SiteFooter from '../components/companyProfile/SiteFooter';
import SiteHeader from '../components/companyProfile/SiteHeader';
import TechnologySection from '../components/companyProfile/TechnologySection';
import WorkflowSection from '../components/companyProfile/WorkflowSection';
import { COPY, getShell } from '../components/companyProfile/copy';
import {
  ACTIVITY_THRESHOLD,
  EMA_ALPHA,
  FEATURES_PER_FRAME,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  LIP_START_THRESHOLD,
  MAX_FRAMES,
  START_DELAY_FRAMES,
  buildLandmarkPayload,
  calculateLipDistance,
  vectorizeLipFrame,
} from '../lib/lipReadingModel';
import {
  COOKIE_OK,
  LANG_COOKIE,
  THEME_COOKIE,
  readCookie,
  writeCookie,
} from '../lib/lipReadingPreferences';
import { predictFromApi } from '../lib/modelApi';

export default function LipReadingPage() {
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [showCookiePanel, setShowCookiePanel] = useState(false);
  const copy = COPY[language];
  const shell = getShell(theme);

  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState(COPY.en.status.cameraOff);
  const [progress, setProgress] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
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
    isFinishing: false,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLang = readCookie(LANG_COOKIE);
      const savedTheme = readCookie(THEME_COOKIE);
      const accepted = readCookie(COOKIE_OK);

      if (savedLang === 'id' || savedLang === 'en') {
        setLanguage(savedLang);
        setStatusMsg(COPY[savedLang].status.cameraOff);
      }

      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      }

      setShowCookiePanel(accepted !== 'true');

      try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } catch {
        // ignore localStorage failures
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    writeCookie(LANG_COOKIE, language);
    writeCookie(THEME_COOKIE, theme);
  }, [language, theme]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore localStorage failures
    }
  }, [history]);

  const getRecentActivity = () => {
    const hist = stateRef.current.historyDist;
    if (hist.length < 10) return 0;
    const mean = hist.reduce((sum, value) => sum + value, 0) / hist.length;
    const variance = hist.reduce((sum, value) => sum + (value - mean) ** 2, 0) / hist.length;
    return Math.sqrt(variance);
  };

  const collectFrame = (landmarks) => {
    stateRef.current.buffer.push(vectorizeLipFrame(landmarks));
    const nextFrameCount = stateRef.current.buffer.length;
    setFrameCount(nextFrameCount);
    setProgress((nextFrameCount / MAX_FRAMES) * 100);
  };

  const startCapturing = () => {
    stateRef.current.isRecording = true;
    stateRef.current.isFinishing = false;
    stateRef.current.buffer = [];
    stateRef.current.silenceCounter = 0;
    setStatus('recording');
    setStatusMsg(copy.status.recording);
  };

  const finishCapturing = async () => {
    const state = stateRef.current;
    if (state.isFinishing) return;

    state.isFinishing = true;
    state.isRecording = false;

    setStatus('processing');
    setStatusMsg(copy.status.analyzing);

    const landmarks = buildLandmarkPayload(state.buffer);
    if (landmarks.length !== MAX_FRAMES * FEATURES_PER_FRAME) {
      setStatus('error');
      setStatusMsg('VECTOR ERROR');
      setError(`Invalid landmark vector size: ${landmarks.length}`);
      state.buffer = [];
      state.isFinishing = false;
      setFrameCount(0);
      setProgress(0);
      return;
    }

    try {
      const data = await predictFromApi(landmarks);
      const historyItem = {
        ...data,
        timestamp: data.timestamp || Date.now(),
      };
      setPrediction(historyItem);
      setHistory((prev) => [historyItem, ...prev].slice(0, HISTORY_LIMIT));
      setError(null);
      setStatus('success');
      setStatusMsg(copy.status.recognized);
      state.cooldownUntil = Date.now() + 1500;
    } catch (err) {
      setError(err.message || 'Prediction failed');
      setStatus('error');
      setStatusMsg('API ERROR');
    } finally {
      state.buffer = [];
      state.isFinishing = false;
      setFrameCount(0);
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

    if (state.isFinishing) return;

    if (now < state.cooldownUntil) {
      setStatus('cooldown');
      setStatusMsg(copy.status.cooldown);
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
          setStatusMsg(copy.status.validating);
        }
      } else {
        state.activeFrames = 0;
        setStatus('ready');
        setStatusMsg(copy.status.ready);
      }
      return;
    }

    collectFrame(landmarks);
    if (state.buffer.length >= MAX_FRAMES) {
      finishCapturing();
      return;
    }

    setStatusMsg(copy.status.recording);
  };

  const toggleCamera = () => {
    setCameraOn((value) => !value);
    setStatus('ready');
    setStatusMsg(cameraOn ? copy.status.cameraOff : copy.status.cameraOn);

    if (cameraOn) {
      stateRef.current.isRecording = false;
      stateRef.current.isFinishing = false;
      stateRef.current.buffer = [];
      setFrameCount(0);
      setProgress(0);
    }
  };

  const saveCookiePreference = () => {
    writeCookie(COOKIE_OK, 'true');
    setShowCookiePanel(false);
  };

  return (
    <div className={`min-h-screen ${shell.page} selection:bg-[#2f8f83]/20`}>
      <SiteHeader
        copy={copy}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        shell={shell}
        cameraOn={cameraOn}
        toggleCamera={toggleCamera}
      />

      <main id="home">
        <HeroSection copy={copy} shell={shell} theme={theme} status={status} statusMsg={statusMsg} progress={progress} frameCount={frameCount} prediction={prediction} />
        <TechnologySection copy={copy} shell={shell} theme={theme} />
        <BackendKnowledgeSection copy={copy} shell={shell} theme={theme} />
        <DemoSection
          copy={copy}
          shell={shell}
          cameraOn={cameraOn}
          toggleCamera={toggleCamera}
          handleLandmarks={handleLandmarks}
          progress={progress}
          frameCount={frameCount}
          status={status}
          prediction={prediction}
          history={history}
          error={error}
        />
        <WorkflowSection copy={copy} />
      </main>

      <SiteFooter copy={copy} shell={shell} theme={theme} language={language} />

      {showCookiePanel && (
        <PreferenceBanner
          copy={copy}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          savePreference={saveCookiePreference}
        />
      )}
    </div>
  );
}
