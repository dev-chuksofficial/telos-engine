export default function Loading() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <div className="h-20 border-b border-navy-800 bg-navy-900" />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="font-serif text-3xl text-navy-900/70">
          Loading your project...
        </p>
        <p className="mt-3 text-sm text-navy-900/50">
          If this takes more than a minute, look at the terminal running the
          server for a red error.
        </p>
      </main>
    </div>
  );
}
