"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Unable to load the expense tracker
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          An unexpected error occurred while rendering the page. Try again, and
          if the issue persists, refresh your browser.
        </p>
        <button
          type="button"
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
