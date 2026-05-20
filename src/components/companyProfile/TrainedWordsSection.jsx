import { BookOpenCheck } from 'lucide-react';
import { TRAINED_WORDS } from '../../lib/trainedWords';

export default function TrainedWordsSection({ copy, shell, theme }) {
  const isDark = theme === 'dark';

  return (
    <section id="trained-words" className={`border-y ${isDark ? 'border-[#2e3431] bg-[#101312]' : 'border-[#ded8cd] bg-[#fbfaf7]'}`}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2f8f83]">{copy.trainedWords.eyebrow}</p>
            <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${shell.ink}`}>{copy.trainedWords.title}</h2>
            <p className={`mt-4 max-w-2xl leading-7 ${shell.muted}`}>{copy.trainedWords.body}</p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-md border px-4 py-3 text-sm font-black ${shell.card}`}>
            <BookOpenCheck size={18} className="text-[#2f8f83]" />
            <span>{TRAINED_WORDS.length} {copy.trainedWords.countLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {TRAINED_WORDS.map((word) => (
            <div key={word} className={`min-h-14 rounded-md border px-3 py-4 text-center ${shell.card}`}>
              <span className={`break-words text-sm font-black uppercase ${shell.ink}`}>{word}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
