'use client';

import { Camera, Languages, Moon, Play, Sun } from 'lucide-react';
import SiReactIcon from './SiReactIcon';

export default function SiteHeader({ copy, language, setLanguage, theme, setTheme, shell, cameraOn, toggleCamera }) {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-30 border-b ${shell.header} backdrop-blur-xl`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <a href="#home" className="flex items-center gap-3" aria-label="LipReading.AI home">
          <span className={`flex h-10 w-10 items-center justify-center rounded-md ${isDark ? 'bg-[#f4f1ea] text-[#171717]' : 'bg-[#171717] text-white'}`}>
            <SiReactIcon size={21} />
          </span>
          <span className="font-black tracking-tight">LipReading.AI</span>
        </a>

        <div className={`hidden items-center gap-8 text-sm font-semibold ${shell.muted} md:flex`}>
          <a href="#technology" className={shell.ink}>{copy.nav.technology}</a>
          <a href="#project" className={shell.ink}>{copy.nav.project}</a>
          <a href="#demo" className={shell.ink}>{copy.nav.demo}</a>
          <a href="#workflow" className={shell.ink}>{copy.nav.workflow}</a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-black ${shell.soft}`}
            title="Language"
          >
            <Languages size={16} />
            {language === 'en' ? 'ENG' : 'ID'}
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`inline-flex h-10 items-center justify-center rounded-md border px-3 ${shell.soft}`}
            title="Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            className="hidden h-10 items-center gap-2 rounded-md bg-[#171717] px-4 text-sm font-bold text-white transition hover:bg-[#2f8f83] sm:inline-flex"
          >
            {cameraOn ? <Camera size={16} /> : <Play size={16} />}
            {cameraOn ? copy.nav.stop : copy.nav.start}
          </button>
        </div>
      </nav>
    </header>
  );
}
