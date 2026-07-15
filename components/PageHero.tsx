type Props = {
  eyebrow?: string
  title: string
  description?: string
  children?: React.ReactNode
  titleAction?: React.ReactNode
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  titleAction,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
      {eyebrow && (
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#6f8b63]">
          {eyebrow}
        </p>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-7xl">
          {title}
        </h1>

        {titleAction && (
          <div className="shrink-0 lg:pl-6">
            {titleAction}
          </div>
        )}
      </div>

      {description && (
        <p className="mt-6 max-w-3xl text-lg text-slate-600">{description}</p>
      )}

      {children && <div className="mt-8">{children}</div>}
    </section>
  )
}
