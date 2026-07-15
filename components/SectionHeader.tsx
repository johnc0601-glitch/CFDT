type Props = {
  eyebrow?: string
  title: string
  description?: string
}

export function SectionHeader({eyebrow, title, description}: Props) {
  return (
    <div>
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-widest text-[#6f8b63]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
    </div>
  )
}
