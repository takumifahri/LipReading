export default function TechnologySection({ copy, shell, theme }) {
  const isDark = theme === 'dark';

  return (
    <section id="technology" className={`border-y ${isDark ? 'border-[#2e3431] bg-[#111413]' : 'border-[#ded8cd] bg-white'}`}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2f8f83]">{copy.capabilitiesEyebrow}</p>
          <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${shell.ink}`}>{copy.capabilitiesTitle}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {copy.capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={`rounded-md border p-6 ${shell.card}`}>
                <Icon className="text-[#2f8f83]" size={26} />
                <h3 className={`mt-5 text-xl font-black tracking-tight ${shell.ink}`}>{item.title}</h3>
                <p className={`mt-3 leading-7 ${shell.muted}`}>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
