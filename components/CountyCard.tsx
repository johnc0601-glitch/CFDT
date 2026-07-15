import Link from 'next/link'

type Props = {
  name: string
  href?: string
  description: string
  enabled?: boolean
}

export function CountyCard({name, href = '#', description, enabled}: Props) {
  const content = (
    <div className="h-full rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">County</p>
      <h3 className="mt-3 text-2xl font-semibold">{name}</h3>
      <p className="mt-3 text-slate-600">{description}</p>
      <p className="mt-6 font-semibold text-[#244f73]">
        {enabled ? 'View county →' : 'Coming soon'}
      </p>
    </div>
  )

  if (!enabled) return content
  return <Link href={href}>{content}</Link>
}
