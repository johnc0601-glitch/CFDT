'use client'

import {useEffect, useRef, useState} from 'react'
import OpenSeadragon from 'openseadragon'
import styles from './PlatViewer.module.css'

type PlatViewerProps = {
  title?: string
  tileSource: string
  downloadUrl?: string
  sourceLabel?: string
}

export function PlatViewer({
  title = 'Preliminary Site Plan',
  tileSource,
  downloadUrl,
  sourceLabel = 'Original preliminary plan, Sheet C-2.0',
}: PlatViewerProps) {
  const viewerElement = useRef<HTMLDivElement | null>(null)
  const viewer = useRef<OpenSeadragon.Viewer | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!viewerElement.current || viewer.current) return

    viewer.current = OpenSeadragon({
      element: viewerElement.current,
      tileSources: tileSource,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      showRotationControl: false,
      showFullPageControl: false,
      showHomeControl: true,
      showZoomControl: true,
      animationTime: 0.7,
      blendTime: 0.1,
      constrainDuringPan: true,
      visibilityRatio: 0.65,
      minZoomImageRatio: 0.8,
      maxZoomPixelRatio: 2.5,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true,
        scrollToZoom: true,
      },
      gestureSettingsTouch: {
        pinchToZoom: true,
        flickEnabled: true,
      },
    })

    return () => {
      viewer.current?.destroy()
      viewer.current = null
    }
  }, [tileSource])

  useEffect(() => {
    viewer.current?.viewport.goHome(true)
  }, [fullscreen])

  return (
    <section className={fullscreen ? styles.fullscreen : styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Original engineering sheet</p>
          <h2>{title}</h2>
          <p>{sourceLabel}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => viewer.current?.viewport.zoomBy(1.5)}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => viewer.current?.viewport.zoomBy(1 / 1.5)}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => viewer.current?.viewport.goHome()}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((value) => !value)}
          >
            {fullscreen ? 'Close' : 'Full screen'}
          </button>
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              Open original
            </a>
          )}
        </div>
      </div>

      <div
        ref={viewerElement}
        className={styles.viewer}
        aria-label={`${title} zoomable viewer`}
      />

      <p className={styles.help}>
        Scroll or pinch to zoom. Drag to move across the plan. Double-click to zoom quickly.
      </p>
    </section>
  )
}
