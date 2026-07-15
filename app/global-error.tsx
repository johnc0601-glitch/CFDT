'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & {digest?: string}
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-[#f3f5f2] px-6 text-[#142033]">
        <main className="max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">CFDT</p>
          <h1 className="mt-4 text-4xl font-semibold">Something went wrong</h1>
          <p className="mt-4 text-slate-600">
            The page could not be loaded. Try again before refreshing or closing the site.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-7 rounded-xl bg-[#244f73] px-5 py-3 font-bold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
