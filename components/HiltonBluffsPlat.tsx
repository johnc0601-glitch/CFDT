'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

const PREVIEW = '/plats/hilton-bluffs/hilton-bluffs-c-2-0-preview.jpg'
const ORIGINAL = '/plats/hilton-bluffs/hilton-bluffs-c-2-0.png'

type Point = {x: number; y: number}

export function HiltonBluffsPlat() {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState<Point>({x: 0, y: 0})
  const [loaded, setLoaded] = useState(false)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{
    pointerId: number
    start: Point
    origin: Point
  } | null>(null)

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current
    const image = imageRef.current
    if (!viewport || !image || !image.naturalWidth || !image.naturalHeight) return

    const padding = 32
    const fit = Math.min(
      (viewport.clientWidth - padding) / image.naturalWidth,
      (viewport.clientHeight - padding) / image.naturalHeight,
    )

    const nextScale = Math.max(0.05, Math.min(fit, 1))
    const renderedWidth = image.naturalWidth * nextScale
    const renderedHeight = image.naturalHeight * nextScale

    setScale(nextScale)
    setPosition({
      x: (viewport.clientWidth - renderedWidth) / 2,
      y: (viewport.clientHeight - renderedHeight) / 2,
    })
  }, [])

  useEffect(() => {
    if (!open) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === '+' || event.key === '=') zoomAtCenter(1.25)
      if (event.key === '-') zoomAtCenter(0.8)
      if (event.key === '0') fitToScreen()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, fitToScreen])

  useEffect(() => {
    if (!open || !loaded || !viewportRef.current) return
    fitToScreen()

    const observer = new ResizeObserver(fitToScreen)
    observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [open, loaded, fitToScreen])

  function zoomAtCenter(multiplier: number) {
    const viewport = viewportRef.current
    if (!viewport) return

    zoomAt(
      viewport.clientWidth / 2,
      viewport.clientHeight / 2,
      multiplier,
    )
  }

  function zoomAt(clientX: number, clientY: number, multiplier: number) {
    const viewport = viewportRef.current
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const nextScale = Math.max(0.05, Math.min(scale * multiplier, 5))
    const ratio = nextScale / scale

    setPosition({
      x: x - (x - position.x) * ratio,
      y: y - (y - position.y) * ratio,
    })
    setScale(nextScale)
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.18 : 0.85)
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: {x: event.clientX, y: event.clientY},
      origin: position,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    setPosition({
      x: drag.origin.x + event.clientX - drag.start.x,
      y: drag.origin.y + event.clientY - drag.start.y,
    })
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
            Original engineering sheet
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Hilton Bluffs Overall Preliminary Plan
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Unaltered Sheet C-2.0 from the February 23, 2026 TRC signature set.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-[#244f73] px-5 py-3 font-bold text-white hover:bg-[#1d4261]"
        >
          Open zoomable plan
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full bg-slate-100 text-left"
      >
        <img
          src={PREVIEW}
          alt="Hilton Bluffs overall preliminary plan, Sheet C-2.0"
          className="max-h-[720px] w-full object-contain"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-black/75 px-4 py-2 text-sm font-bold text-white shadow">
          Click to zoom and scan
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-[#111827]"
          role="dialog"
          aria-modal="true"
          aria-label="Hilton Bluffs zoomable preliminary plan"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-black/35 px-4 py-3 text-white">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/55">
                Original Sheet C-2.0
              </p>
              <h2 className="font-semibold">Hilton Bluffs Preliminary Plan</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => zoomAtCenter(0.8)}
                className="rounded-lg bg-white/10 px-4 py-2 font-bold hover:bg-white/20"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="min-w-16 text-center text-sm font-semibold">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomAtCenter(1.25)}
                className="rounded-lg bg-white/10 px-4 py-2 font-bold hover:bg-white/20"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={fitToScreen}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
              >
                Fit
              </button>
              <a
                href={ORIGINAL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
              >
                Open original
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900"
              >
                Close
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onDoubleClick={(event) => zoomAt(event.clientX, event.clientY, 1.6)}
            className="relative min-h-0 flex-1 cursor-grab overflow-hidden touch-none active:cursor-grabbing"
          >
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-white/70">
                Loading full-resolution plan…
              </div>
            )}

            <img
              ref={imageRef}
              src={ORIGINAL}
              alt="Hilton Bluffs overall preliminary plan, Sheet C-2.0"
              draggable={false}
              onLoad={() => setLoaded(true)}
              className="pointer-events-none absolute left-0 top-0 max-w-none select-none bg-white shadow-2xl"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                transformOrigin: '0 0',
                willChange: 'transform',
              }}
            />
          </div>

          <div className="border-t border-white/15 bg-black/35 px-4 py-2 text-center text-xs text-white/65">
            Scroll or pinch to zoom · Drag to scan · Double-click to zoom · Press Esc to close
          </div>
        </div>
      )}
    </section>
  )
}
