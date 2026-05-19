'use client';

import { Cookie } from 'lucide-react';

export default function PreferenceBanner({ copy, language, setLanguage, theme, setTheme, savePreference }) {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-4xl rounded-md border border-[#2f8f83]/30 bg-[#171717] px-3 py-3 text-white shadow-2xl sm:bottom-4 sm:left-4 sm:right-4 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Cookie className="shrink-0 text-[#8bd9ca]" size={22} />
          <div className="min-w-0">
            <h3 className="text-sm font-black">{copy.prefs.title}</h3>
            <p className="text-xs leading-5 text-white/60">{copy.prefs.body}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center">
          <button type="button" onClick={() => setLanguage('id')} className={`rounded-md px-3 py-2 text-xs font-black ${language === 'id' ? 'bg-[#8bd9ca] text-[#171717]' : 'bg-white/10'}`}>ID</button>
          <button type="button" onClick={() => setLanguage('en')} className={`rounded-md px-3 py-2 text-xs font-black ${language === 'en' ? 'bg-[#8bd9ca] text-[#171717]' : 'bg-white/10'}`}>ENG</button>
          <button type="button" onClick={() => setTheme('light')} className={`rounded-md px-3 py-2 text-xs font-black ${theme === 'light' ? 'bg-[#8bd9ca] text-[#171717]' : 'bg-white/10'}`}>{copy.prefs.light}</button>
          <button type="button" onClick={() => setTheme('dark')} className={`rounded-md px-3 py-2 text-xs font-black ${theme === 'dark' ? 'bg-[#8bd9ca] text-[#171717]' : 'bg-white/10'}`}>{copy.prefs.dark}</button>
          <button type="button" onClick={savePreference} className="col-span-2 rounded-md bg-white px-3 py-2 text-xs font-black text-[#171717] min-[420px]:col-span-1">
            {copy.prefs.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
