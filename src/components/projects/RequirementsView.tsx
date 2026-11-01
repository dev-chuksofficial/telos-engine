import type { Requirements } from "@/lib/ai/schemas";

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

export function RequirementsView({ data }: { data: Requirements }) {
  const mvp = data.features.filter((f) => f.priority === "MVP");
  const later = data.features.filter((f) => f.priority === "LATER");

  return (
    <>
      <Section title="Summary">
        <p className="leading-relaxed text-navy-900/80">{data.summary}</p>
        <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          Target users
        </h3>
        <div className="mt-3">
          <List items={data.targetUsers} />
        </div>
      </Section>

      <Section title="User roles">
        <div className="grid gap-4 md:grid-cols-2">
          {data.userRoles.map((r) => (
            <div key={r.name} className="border-t-2 border-gold-500 pt-3">
              <p className="font-semibold">{r.name}</p>
              <p className="mt-1 text-sm text-navy-900/70">{r.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="MVP features">
        <div className="space-y-4">
          {mvp.map((f) => (
            <div key={f.name}>
              <p className="font-semibold">{f.name}</p>
              <p className="text-sm text-navy-900/70">{f.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {later.length > 0 && (
        <Section title="Later versions">
          <div className="space-y-4">
            {later.map((f) => (
              <div key={f.name}>
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-navy-900/70">{f.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Pages">
        <div className="grid gap-4 md:grid-cols-2">
          {data.pages.map((p) => (
            <div key={p.name}>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-navy-900/70">{p.purpose}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Data">
        <div className="grid gap-4 md:grid-cols-2">
          {data.dataEntities.map((e) => (
            <div key={e.name}>
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-navy-900/70">{e.fields.join(", ")}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Assumptions">
        <List items={data.assumptions} />
      </Section>

      {data.outOfScope.length > 0 && (
        <Section title="Out of scope">
          <List items={data.outOfScope} />
        </Section>
      )}
    </>
  );
}