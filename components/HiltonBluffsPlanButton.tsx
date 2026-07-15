'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

type Point = {x: number; y: number}

const IMAGE_URL = '/plats/hilton-bluffs/hilton-bluffs-c-2-0.png'
const MIN_SCALE = 0.05
const MAX_SCALE = 8

export function HiltonBluffsPlanButton() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState<Point>({x: 0, y: 0})

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{pointerId: number; start: Point; origin: Point} | null>(null)

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current
    const image = imageRef.current
    if (!viewport || !image || !image.naturalWidth || !image.naturalHeight) return

    const padding = 32
    const nextScale = Math.max(
      MIN_SCALE,
      Math.min(
        (viewport.clientWidth - padding) / image.naturalWidth,
        (viewport.clientHeight - padding) / image.naturalHeight,
        1,
      ),
    )

    setScale(nextScale)
    setPosition({
      x: (viewport.clientWidth - image.naturalWidth * nextScale) / 2,
      y: (viewport.clientHeight - image.naturalHeight * nextScale) / 2,
    })
  }, [])

  const zoomAt = useCallback(
    (clientX: number, clientY: number, multiplier: number) => {
      const viewport = viewportRef.current
      if (!viewport) return

      const rect = viewport.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const nextScale = Math.max(MIN_SCALE, Math.min(scale * multiplier, MAX_SCALE))
      const ratio = nextScale / scale

      setPosition({
        x: x - (x - position.x) * ratio,
        y: y - (y - position.y) * ratio,
      })
      setScale(nextScale)
    },
    [position, scale],
  )

  const zoomAtCenter = useCallback(
    (multiplier: number) => {
      const viewport = viewportRef.current
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()

      zoomAt(
        rect.left + viewport.clientWidth / 2,
        rect.top + viewport.clientHeight / 2,
        multiplier,
      )
    },
    [zoomAt],
  )

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
  }, [fitToScreen, open, zoomAtCenter])

  useEffect(() => {
    if (!open || !loaded || !viewportRef.current) return

    fitToScreen()
    const observer = new ResizeObserver(fitToScreen)
    observer.observe(viewportRef.current)

    return () => observer.disconnect()
  }, [fitToScreen, loaded, open])

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

  function releasePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-3 rounded-2xl bg-[#244f73] px-5 py-4 text-left font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1d4261] hover:shadow-md"
      >
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl"
        >
          ⤢
        </span>
        <span>
          <span className="block text-xs uppercase tracking-widest text-white/65">
            Original plan
          </span>
          <span className="block">View Site Plan</span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-[#111827] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Hilton Bluffs overall preliminary site plan"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-black/30 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">
                Original Sheet C-2.0
              </p>
              <h2 className="font-semibold md:text-lg">
                Hilton Bluffs Overall Preliminary Plan
              </h2>
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
                href={IMAGE_URL}
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
          </header>

          <div
            ref={viewportRef}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={releasePointer}
            onPointerCancel={releasePointer}
            onDoubleClick={(event) => zoomAt(event.clientX, event.clientY, 1.6)}
            className="relative min-h-0 flex-1 cursor-grab overflow-hidden touch-none active:cursor-grabbing"
          >
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-white/65">
                Loading full-resolution plan…
              </div>
            )}

            <img
              ref={imageRef}
              src={IMAGE_URL}
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

          <footer className="border-t border-white/15 bg-black/30 px-4 py-2 text-center text-xs text-white/55">
            Scroll to zoom · Drag to scan · Double-click to zoom · Esc closes
          </footer>
        </div>
      )}
    </>
  )
}
