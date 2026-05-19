import { Database, Layers3, Server, Sparkles } from 'lucide-react';

const icons = [Server, Layers3, Database, Sparkles];

export default function BackendKnowledgeSection({ copy, shell, theme }) {
  const isDark = theme === 'dark';

  return (
    <section id="project" className={`border-y ${isDark ? 'border-[#2e3431] bg-[#0f1110]' : 'border-[#ded8cd] bg-[#f6f3ee]'}`}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2f8f83]">{copy.backend.eyebrow}</p>
            <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${shell.ink}`}>{copy.backend.title}</h2>
            <p className={`mt-5 leading-8 ${shell.muted}`}>{copy.backend.body}</p>

            <div className="mt-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              {copy.backend.stats.map((item) => (
                <div key={item.label} className={`rounded-md border p-4 ${shell.card}`}>
                  <p className={`text-2xl font-black ${shell.ink}`}>{item.value}</p>
                  <p className={`mt-1 text-xs font-bold uppercase tracking-[0.14em] ${shell.muted}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {copy.backend.cards.map((card, index) => {
              const Icon = icons[index] || Server;
              return (
                <article key={card.label} className={`rounded-md border p-5 ${shell.card}`}>
                  <Icon className="text-[#2f8f83]" size={24} />
                  <p className={`mt-4 text-xs font-black uppercase tracking-[0.18em] ${shell.muted}`}>{card.label}</p>
                  <h3 className={`mt-2 text-xl font-black tracking-tight ${shell.ink}`}>{card.value}</h3>
                  <p className={`mt-3 text-sm leading-6 ${shell.muted}`}>{card.detail}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <KnowledgeList title={copy.backend.pipelineTitle} items={copy.backend.pipeline} shell={shell} />
          <KnowledgeList title={copy.backend.trainingTitle} items={copy.backend.training} shell={shell} />
        </div>
      </div>
    </section>
  );
}

function KnowledgeList({ title, items, shell }) {
  return (
    <div className={`rounded-md border p-6 ${shell.panel}`}>
      <h3 className={`text-xl font-black tracking-tight ${shell.ink}`}>{title}</h3>
      <div className="mt-5 space-y-4">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#2f8f83] text-xs font-black text-white">
              {index + 1}
            </span>
            <p className={`text-sm leading-6 ${shell.muted}`}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
