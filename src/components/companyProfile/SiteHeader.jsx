'use client';

import { Camera, Languages, Moon, Play, Settings, Sun } from 'lucide-react';
import SiReactIcon from './SiReactIcon';

export default function SiteHeader({ copy, language, setLanguage, theme, setTheme, shell, cameraOn, toggleCamera, openPreferences }) {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-30 border-b ${shell.header} backdrop-blur-xl`}>
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <a href="#home" className="flex items-center gap-3" aria-label="LipReading.AI home">
          <span className={`flex h-9 w-9 items-center justify-center rounded-md sm:h-10 sm:w-10 ${isDark ? 'bg-[#f4f1ea] text-[#171717]' : 'bg-[#171717] text-white'}`}>
            <SiReactIcon size={21} />
          </span>
          <span className="text-sm font-black tracking-tight sm:text-base">LipReading.AI</span>
        </a>

        <div className={`order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap pb-1 text-xs font-semibold ${shell.muted} md:order-none md:w-auto md:gap-8 md:overflow-visible md:pb-0 md:text-sm`}>
          <a href="#technology" className={shell.ink}>{copy.nav.technology}</a>
          <a href="#project" className={shell.ink}>{copy.nav.project}</a>
          <a href="#trained-words" className={shell.ink}>{copy.nav.words}</a>
          <a href="#demo" className={shell.ink}>{copy.nav.demo}</a>
          <a href="#workflow" className={shell.ink}>{copy.nav.workflow}</a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-2 text-xs font-black sm:h-10 sm:px-3 sm:text-sm ${shell.soft}`}
            title="Language"
          >
            <Languages size={16} />
            {language === 'en' ? 'ENG' : 'ID'}
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`inline-flex h-9 items-center justify-center rounded-md border px-2 sm:h-10 sm:px-3 ${shell.soft}`}
            title="Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={openPreferences}
            className={`inline-flex h-9 items-center justify-center rounded-md border px-2 sm:h-10 sm:px-3 ${shell.soft}`}
            title={copy.prefs.title}
          >
            <Settings size={17} />
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#171717] px-3 text-xs font-bold text-white transition hover:bg-[#2f8f83] sm:h-10 sm:px-4 sm:text-sm"
          >
            {cameraOn ? <Camera size={16} /> : <Play size={16} />}
            <span className="hidden sm:inline">{cameraOn ? copy.nav.stop : copy.nav.start}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
