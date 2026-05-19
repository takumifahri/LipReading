'use client';

import { Camera, History } from 'lucide-react';
import CameraVision from '../CameraVision';
import { MAX_FRAMES } from '../../lib/lipReadingModel';

export default function DemoSection({ copy, shell, cameraOn, toggleCamera, handleLandmarks, progress, frameCount, status, prediction, history, error }) {
  return (
    <section id="demo" className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[1.4fr_0.8fr] lg:gap-8">
      <div className="overflow-hidden rounded-md border border-[#2e3431] bg-[#101010]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8bd9ca]">{copy.demo.eyebrow}</p>
            <h2 className="mt-1 text-xl font-black">{copy.demo.title}</h2>
          </div>
          <button
            type="button"
            onClick={toggleCamera}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-white px-4 text-sm font-black text-[#171717] transition hover:bg-[#8bd9ca]"
          >
            <Camera size={16} />
            {cameraOn ? 'Stop' : 'Start'}
          </button>
        </div>

        <div className="relative aspect-[4/3] sm:aspect-video">
          {cameraOn ? (
            <CameraVision enabled={cameraOn} onLandmarks={handleLandmarks} />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#141414] text-white/50">
              <div className="text-center">
                <Camera className="mx-auto mb-3 text-white/30" size={42} />
                <p className="text-sm font-bold">{copy.demo.cameraOff}</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 rounded-md border border-white/10 bg-black/55 p-3 text-white backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50 sm:text-xs sm:tracking-[0.2em]">{copy.demo.capture}</p>
                <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-white/10 sm:w-44">
                  <div className="h-full rounded-full bg-[#8bd9ca]" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
              <p className="text-sm font-black">{frameCount} / {MAX_FRAMES}</p>
            </div>
          </div>
        </div>
      </div>

      <aside className={`rounded-md border p-4 sm:p-6 ${shell.panel}`}>
        <p className="mb-4 rounded-md border border-[#2f8f83]/30 bg-[#2f8f83]/10 px-4 py-3 text-sm font-bold text-[#2f8f83]">
          {copy.hero.note}
        </p>
        <div className={`rounded-md border p-5 ${status === 'success' ? 'border-[#2f8f83] bg-[#2f8f83]/10' : shell.card}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${shell.muted}`}>{copy.demo.prediction}</p>
          {status === 'processing' ? (
            <div className="mt-6 flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2f8f83]/20 border-t-[#2f8f83]" />
              <p className="font-black text-[#2f8f83]">{copy.demo.analyzing}</p>
            </div>
          ) : prediction ? (
            <div className="mt-5">
              <h3 className={`break-words text-4xl font-black tracking-tight sm:text-5xl ${shell.ink}`}>{prediction.word}</h3>
              <p className={`mt-2 text-sm font-bold ${shell.muted}`}>{Math.round((prediction.confidence || 0) * 100)}% {copy.console.confidence}</p>
            </div>
          ) : (
            <p className={`mt-5 leading-7 ${shell.muted}`}>{copy.demo.empty}</p>
          )}
        </div>

        {error && <p className="mt-4 rounded-md border border-[#efb8a9] bg-[#fff3ef] p-3 text-sm font-bold text-[#a33a24]">{error}</p>}

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <History size={18} className="text-[#2f8f83]" />
            <h3 className={`text-sm font-black uppercase tracking-[0.18em] ${shell.muted}`}>{copy.demo.history}</h3>
          </div>
          <div className="space-y-3">
            {history.length > 0 ? history.map((item, index) => (
              <div key={`${item.word}-${index}`} className={`flex items-center justify-between rounded-md border p-3 ${shell.card}`}>
                <span className={`break-words text-sm font-black uppercase ${shell.ink}`}>{item.word}</span>
                <span className={`text-xs font-mono ${shell.muted}`}>{Math.round((item.confidence || 0) * 100)}%</span>
              </div>
            )) : (
              <p className={`text-sm italic ${shell.muted}`}>{copy.demo.noHistory}</p>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
