import { Languages, Moon, Sun } from 'lucide-react';
import SiReactIcon from './SiReactIcon';

export default function SiteFooter({ copy, shell, theme, language }) {
  const isDark = theme === 'dark';

  return (
    <footer className={`border-t ${isDark ? 'border-[#2e3431]' : 'border-[#ded8cd]'} ${shell.page}`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-5 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-md ${isDark ? 'bg-[#f4f1ea] text-[#171717]' : 'bg-[#171717] text-white'}`}>
              <SiReactIcon size={21} />
            </span>
            <p className={`text-lg font-black ${shell.ink}`}>LipReading.AI</p>
          </div>
          <p className={`mt-4 max-w-md text-sm leading-7 ${shell.muted}`}>{copy.footer}</p>
          <p className="mt-3 max-w-md text-sm font-bold text-[#2f8f83]">{copy.hero.note}</p>
        </div>

        <div>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${shell.muted}`}>Navigation</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold md:flex md:flex-col">
            <a href="#home" className={shell.ink}>Home</a>
            <a href="#technology" className={shell.ink}>{copy.nav.technology}</a>
            <a href="#project" className={shell.ink}>{copy.nav.project}</a>
            <a href="#demo" className={shell.ink}>{copy.nav.demo}</a>
            <a href="#workflow" className={shell.ink}>{copy.nav.workflow}</a>
          </div>
        </div>

        <div>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${shell.muted}`}>Preferences</h3>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold md:flex-col">
            <div className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 ${shell.soft}`}>
              <Languages size={15} />
              {language === 'id' ? 'ID' : 'ENG'}
            </div>
            <div className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 ${shell.soft}`}>
              {isDark ? <Moon size={15} /> : <Sun size={15} />}
              {isDark ? copy.prefs.dark : copy.prefs.light}
            </div>
            <a
              href="https://github.com"
              className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 ${shell.soft}`}
              aria-label="GitHub"
            >
              <SiReactIcon size={15} />
              GitHub
            </a>
          </div>
        </div>
      </div>

      <div className={`border-t ${isDark ? 'border-[#2e3431]' : 'border-[#ded8cd]'}`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs font-bold sm:px-5 md:flex-row md:items-center md:justify-between ${shell.muted}`}>
          <p>© 2026 LipReading.AI</p>
          <p>Landmark-based prototype for Indonesian lip-reading research.</p>
        </div>
      </div>
    </footer>
  );
}
