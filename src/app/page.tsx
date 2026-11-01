import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";

const steps = [
  { n: "I", title: "Describe", text: "Tell Telos Engine what you want to build, in plain language." },
  { n: "II", title: "Analyze", text: "The AI turns your idea into clear, structured requirements." },
  { n: "III", title: "Architect", text: "Receive a recommended architecture before any code is written." },
  { n: "IV", title: "Build", text: "Your project is generated file by file, ready to inspect." },
  { n: "V", title: "Preview and Edit", text: "See it live, refine it by hand or with the AI assistant." },
  { n: "VI", title: "Deploy", text: "Publish to your own Telos subdomain with one action." },
];

const features = [
  { title: "AI Coding Assistant", text: "Ask for changes in plain language and watch the code update." },
  { title: "Code Editor and Files", text: "A full workspace with a file explorer and editor." },
  { title: "Live Preview", text: "Every change is visible instantly, before you publish." },
  { title: "Project Memory", text: "The AI remembers your decisions across the whole project." },
  { title: "Versioning", text: "Every milestone is saved, so you can always go back." },
  { title: "Source Export", text: "Your code is yours. Export it whenever you choose." },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-navy-900 text-ivory-50">
          <div className="mx-auto max-w-6xl px-6 py-28 text-center md:py-36">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
              Idea to live website
            </p>
            <h1 className="mx-auto max-w-4xl font-serif text-5xl font-semibold leading-tight md:text-7xl">
              Describe it. Build it. <span className="text-gold-400">Launch it.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ivory-200/80">
              Telos Engine analyzes your idea, designs the architecture, writes the
              code, and deploys your project, all in one workspace.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ButtonLink href="/register">Start building</ButtonLink>
                          <ButtonLink href="#process" variant="outline-light">
                See how it works
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="process" className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-serif text-4xl font-semibold md:text-5xl">
            From idea to live website
          </h2>
          <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-ivory-200 bg-ivory-200 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="bg-ivory-50 p-8">
                <p className="font-serif text-3xl text-gold-500">{s.n}</p>
                <h3 className="mt-4 font-serif text-2xl font-semibold">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-navy-900/75">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="bg-ivory-200/60">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="text-center font-serif text-4xl font-semibold md:text-5xl">
              Everything in one workspace
            </h2>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="border-t-2 border-gold-500 pt-6">
                  <h3 className="font-serif text-2xl font-semibold">{f.title}</h3>
                  <p className="mt-3 leading-relaxed text-navy-900/75">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-navy-950 text-ivory-50">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <h2 className="font-serif text-4xl font-semibold md:text-5xl">
              Your next project starts with a sentence.
            </h2>
            <div className="mt-10">
              <ButtonLink href="/register">Create your account</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}