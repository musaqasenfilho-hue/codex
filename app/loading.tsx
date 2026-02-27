export default function Loading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-36 rounded-2xl border border-slate-200 bg-white/75" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-slate-200 bg-white/75"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <div className="h-[420px] rounded-2xl border border-slate-200 bg-white/75" />
        <div className="space-y-6">
          <div className="h-36 rounded-2xl border border-slate-200 bg-white/75" />
          <div className="h-64 rounded-2xl border border-slate-200 bg-white/75" />
          <div className="h-80 rounded-2xl border border-slate-200 bg-white/75" />
        </div>
      </div>
    </main>
  );
}
