'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import type {ProjectMedia} from '@/types/projectMedia'

type Point = {x: number; y: number}

const MIN_SCALE = 0.05
const MAX_SCALE = 8

export function GraphicViewer({
  items,
  startIndex,
  onClose,
}: {
  items: ProjectMedia[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState<Point>({x: 0, y: 0})
  const [loaded, setLoaded] = useState(false)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const dragRef = useRef<{start: Point; origin: Point} | null>(null)
  const pinchRef = useRef<{distance: number; scale: number; center: Point} | null>(null)

  const item = items[index]

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

  const changeImage = useCallback(
    (nextIndex: number) => {
      setLoaded(false)
      setIndex(nextIndex)
    },
    [],
  )

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') changeImage((index + 1) % items.length)
      if (event.key === 'ArrowLeft') changeImage((index - 1 + items.length) % items.length)
      if (event.key === '+' || event.key === '=') zoomAtCenter(1.25)
      if (event.key === '-') zoomAtCenter(0.8)
      if (event.key === '0') fitToScreen()
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [changeImage, fitToScreen, index, items.length, onClose, zoomAtCenter])

  useEffect(() => {
    if (!loaded || !viewportRef.current) return

    fitToScreen()
    const observer = new ResizeObserver(fitToScreen)
    observer.observe(viewportRef.current)

    return () => observer.disconnect()
  }, [fitToScreen, loaded, index])

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.18 : 0.85)
  }

  function pointerCenter(points: Point[]) {
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    }
  }

  function pointerDistance(a: Point, b: Point) {
    return Math.hypot(b.x - a.x, b.y - a.y)
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, {x: event.clientX, y: event.clientY})

    const points = [...pointersRef.current.values()]

    if (points.length === 1) {
      dragRef.current = {
        start: points[0],
        origin: position,
      }
      pinchRef.current = null
    }

    if (points.length === 2) {
      dragRef.current = null
      pinchRef.current = {
        distance: pointerDistance(points[0], points[1]),
        scale,
        center: pointerCenter(points),
      }
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return

    pointersRef.current.set(event.pointerId, {x: event.clientX, y: event.clientY})
    const points = [...pointersRef.current.values()]

    if (points.length === 1 && dragRef.current) {
      setPosition({
        x: dragRef.current.origin.x + points[0].x - dragRef.current.start.x,
        y: dragRef.current.origin.y + points[0].y - dragRef.current.start.y,
      })
    }

    if (points.length === 2 && pinchRef.current) {
      const viewport = viewportRef.current
      if (!viewport) return

      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(
          pinchRef.current.scale *
            (pointerDistance(points[0], points[1]) / pinchRef.current.distance),
          MAX_SCALE,
        ),
      )

      const rect = viewport.getBoundingClientRect()
      const center = pointerCenter(points)
      const x = center.x - rect.left
      const y = center.y - rect.top
      const ratio = nextScale / scale

      setPosition({
        x: x - (x - position.x) * ratio,
        y: y - (y - position.y) * ratio,
      })
      setScale(nextScale)
    }
  }

  function releasePointer(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)

    const points = [...pointersRef.current.values()]
    if (points.length === 1) {
      dragRef.current = {
        start: points[0],
        origin: position,
      }
    } else {
      dragRef.current = null
    }

    if (points.length < 2) pinchRef.current = null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#111827] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-black/30 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">
            {index + 1} of {items.length}
          </p>
          <h2 className="font-semibold md:text-lg">{item.title}</h2>
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

          {item.imageUrl && (
            <a
              href={item.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
            >
              Open original
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
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
            Loading full-resolution image…
          </div>
        )}

        {item.imageUrl && (
          <img
            ref={imageRef}
            src={item.imageUrl}
            alt={item.imageAlt || item.title}
            draggable={false}
            onLoad={() => setLoaded(true)}
            className="pointer-events-none absolute left-0 top-0 max-w-none select-none bg-white shadow-2xl"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          />
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 bg-black/30 px-4 py-3">
        <button
          type="button"
          onClick={() => changeImage((index - 1 + items.length) % items.length)}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
          ← Previous
        </button>

        <p className="hidden text-xs text-white/55 md:block">
          Scroll or pinch to zoom · Drag to scan · Double-click to zoom · Esc closes
        </p>

        <button
          type="button"
          onClick={() => changeImage((index + 1) % items.length)}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
          Next →
        </button>
      </footer>
    </div>
  )
}
