'use client';

import { ArrowRight, BarChart3 } from 'lucide-react';
import { FEATURES_PER_FRAME, MAX_FRAMES } from '../../lib/lipReadingModel';

export default function HeroSection({ copy, shell, theme, status, statusMsg, progress, frameCount, prediction }) {
  const isDark = theme === 'dark';

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-5 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
      <div>
        <p className={`mb-5 inline-flex rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#2f8f83] sm:text-xs sm:tracking-[0.2em] ${shell.soft}`}>
          {copy.hero.eyebrow}
        </p>
        <h1 className={`max-w-4xl text-4xl font-black leading-[1] tracking-tight sm:text-5xl md:text-7xl ${shell.ink}`}>
          {copy.hero.title}
        </h1>
        <p className={`mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${shell.muted}`}>{copy.hero.body}</p>
        <p className="mt-5 max-w-2xl rounded-md border border-[#2f8f83]/30 bg-[#2f8f83]/10 px-4 py-3 text-sm font-bold text-[#2f8f83]">
          {copy.hero.note}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#demo" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2f8f83] px-5 text-sm font-black text-white transition hover:bg-[#256f66]">
            {copy.hero.primary} <ArrowRight size={17} />
          </a>
          <a href="#technology" className={`inline-flex h-12 items-center justify-center rounded-md border px-5 text-sm font-black transition ${shell.soft}`}>
            {copy.hero.secondary}
          </a>
        </div>

        <div className={`mt-10 grid max-w-2xl grid-cols-1 gap-3 border-y py-6 min-[420px]:grid-cols-3 sm:gap-4 ${isDark ? 'border-[#2e3431]' : 'border-[#ded8cd]'}`}>
          {copy.metrics.map((metric) => (
            <div key={metric.label}>
              <p className={`text-2xl font-black ${shell.ink}`}>{metric.value}</p>
              <p className={`mt-1 text-xs font-bold uppercase tracking-[0.16em] ${shell.muted}`}>{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-[430px] overflow-hidden rounded-md border border-[#2e3431] bg-[#171717] text-white shadow-2xl shadow-[#171717]/20 sm:min-h-[520px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(47,143,131,0.25),transparent_45%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.13),transparent_26%)]" />
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8bd9ca]">{copy.console.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{copy.console.title}</h2>
            </div>
            <span className={`w-fit rounded-md px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] sm:text-xs ${status === 'recording' ? 'bg-[#ee5c45] text-white' : 'bg-white/10 text-[#d8fff8]'}`}>
              {statusMsg}
            </span>
          </div>

          <div className="my-7 rounded-md border border-white/10 bg-white/[0.06] p-4 sm:my-10 sm:p-5">
            <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-white/50">
              <span>{copy.console.vector}</span>
              <span>{frameCount} / {MAX_FRAMES}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#8bd9ca] transition-all duration-75" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm min-[420px]:grid-cols-2">
              <div className="rounded-md bg-black/20 p-3">
                <p className="font-black text-white">{FEATURES_PER_FRAME}</p>
                <p className="mt-1 text-xs text-white/45">{copy.console.features}</p>
              </div>
              <div className="rounded-md bg-black/20 p-3">
                <p className="font-black text-white">{MAX_FRAMES * FEATURES_PER_FRAME}</p>
                <p className="mt-1 text-xs text-white/45">{copy.console.payload}</p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-white p-4 text-[#171717] sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2f8f83]">{copy.console.latest}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <h3 className="break-words text-3xl font-black tracking-tight sm:text-4xl">{prediction?.word || copy.console.awaiting}</h3>
                <p className="mt-2 text-sm text-[#6d665c]">
                  {prediction ? `${Math.round((prediction.confidence || 0) * 100)}% ${copy.console.confidence}` : copy.console.prompt}
                </p>
              </div>
              <BarChart3 className="text-[#2f8f83]" size={34} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
