import type { Architecture } from "@/lib/ai/schemas";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-sm border border-ivory-200 bg-ivory-50 p-8">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-navy-900/80">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ArchitectureView({ data }: { data: Architecture }) {
  return (
    <>
      <Section title="Architecture overview">
        <p className="leading-relaxed text-navy-900/80">{data.overview}</p>
        <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          Data flow
        </h3>
        <p className="mt-2 leading-relaxed text-navy-900/80">{data.dataFlow}</p>
      </Section>

      <Section title="Recommended stack">
        <div className="grid gap-4 md:grid-cols-2">
          {data.stack.map((s) => (
            <div key={s.layer} className="border-t-2 border-gold-500 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-navy-900/50">
                {s.layer}
              </p>
              <p className="mt-1 font-semibold">{s.choice}</p>
              <p className="mt-1 text-sm text-navy-900/70">{s.reason}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Files the MVP build will generate">
        <div className="space-y-3">
          {data.files.map((f) => (
            <div key={f.path} className="flex flex-col gap-1 md:flex-row md:gap-6">
              <code className="shrink-0 rounded-sm bg-ivory-200 px-2 py-1 text-sm md:w-64">
                {f.path}
              </code>
              <p className="text-sm text-navy-900/70">{f.purpose}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Build plan">
        <ol className="list-decimal space-y-2 pl-5 text-navy-900/80">
          {data.buildPlan.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Risks">
        <List items={data.risks} />
      </Section>

      <Section title="Future upgrades">
        <List items={data.futureUpgrades} />
      </Section>
    </>
  );
}