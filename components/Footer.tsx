import {siteConfig} from '@/site.config'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p className="font-semibold text-[#142033]">{siteConfig.name}</p>
        <p>{siteConfig.tagline}</p>
      </div>
    </footer>
  )
}
