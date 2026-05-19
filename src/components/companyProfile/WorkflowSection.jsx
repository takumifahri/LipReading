import { CheckCircle2 } from 'lucide-react';

export default function WorkflowSection({ copy }) {
  return (
    <section id="workflow" className="bg-[#171717] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8bd9ca]">{copy.workflow.eyebrow}</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">{copy.workflow.title}</h2>
          <p className="mt-5 leading-8 text-white/60">{copy.workflow.body}</p>
        </div>
        <div className="grid gap-4">
          {copy.workflow.steps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-md border border-white/10 bg-white/[0.06] p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#8bd9ca] text-sm font-black text-[#171717]">
                {index + 1}
              </span>
              <div>
                <p className="font-bold leading-7">{step}</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white/45">
                  <CheckCircle2 size={16} className="text-[#8bd9ca]" />
                  {copy.workflow.badge}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
