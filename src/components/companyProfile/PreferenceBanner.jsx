'use client';

import { Cookie, X } from 'lucide-react';

function PreferenceControls({ copy, language, setLanguage, theme, setTheme, savePreference, layout = 'banner' }) {
  const isModal = layout === 'modal';

  return (
    <div className={isModal ? 'grid gap-3' : 'grid grid-cols-3 gap-2 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center'}>
      <label className={isModal ? 'grid gap-1 text-xs font-black uppercase text-white/60' : 'sr-only'} htmlFor={`${layout}-language`}>
        {copy.prefs.language}
      </label>
      <select
        id={`${layout}-language`}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className={`rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white outline-none ${isModal ? 'w-full' : ''}`}
      >
        <option value="id" className="text-[#171717]">Indonesia</option>
        <option value="en" className="text-[#171717]">English</option>
      </select>

      <label className={isModal ? 'grid gap-1 text-xs font-black uppercase text-white/60' : 'sr-only'} htmlFor={`${layout}-theme`}>
        {copy.prefs.theme}
      </label>
      <select
        id={`${layout}-theme`}
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className={`rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white outline-none ${isModal ? 'w-full' : ''}`}
      >
        <option value="light" className="text-[#171717]">{copy.prefs.light}</option>
        <option value="dark" className="text-[#171717]">{copy.prefs.dark}</option>
      </select>

      <button type="button" onClick={savePreference} className="col-span-1 rounded-md bg-white px-3 py-2 text-xs font-black text-[#171717]">
        {copy.prefs.accept}
      </button>
    </div>
  );
}

export default function PreferenceBanner({ copy, language, setLanguage, theme, setTheme, savePreference, mode = 'banner', onClose }) {
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
        <div className="w-full max-w-sm rounded-md border border-[#2f8f83]/30 bg-[#171717] p-4 text-white shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Cookie className="shrink-0 text-[#8bd9ca]" size={22} />
              <div>
                <h3 className="text-sm font-black">{copy.prefs.title}</h3>
                <p className="text-xs leading-5 text-white/60">{copy.prefs.body}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-md bg-white/10 p-2 text-white" title={copy.prefs.close}>
              <X size={16} />
            </button>
          </div>
          <PreferenceControls copy={copy} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} savePreference={savePreference} layout="modal" />
        </div>
      </div>
    );
  }

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
        <PreferenceControls copy={copy} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} savePreference={savePreference} />
      </div>
    </div>
  );
}
