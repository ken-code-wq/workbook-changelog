"use client"

import * as React from "react"
import { formatDate } from "@/lib/utils"

export interface ChangelogTimelineItem {
  id: string
  title: string
  date: string
  description?: string
  highlights?: string[]
}

interface TimelineScrubberProps {
  items: ChangelogTimelineItem[]
}

const MAX_TICKS = 44
const TICK_GAP = 8 // px between tick centers

export function TimelineScrubber({ items }: TimelineScrubberProps) {
  const [visibleIds, setVisibleIds] = React.useState<Set<string>>(new Set())
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const railRef = React.useRef<HTMLDivElement>(null)

  const tickCount = Math.min(MAX_TICKS, items.length)
  const railHeight = Math.max(0, (tickCount - 1) * TICK_GAP)

  // Each tick represents a contiguous bucket of entries
  const ticks = React.useMemo(
    () =>
      Array.from({ length: tickCount }, (_, i) => {
        const start = Math.floor((i * items.length) / tickCount)
        const end = Math.floor(((i + 1) * items.length) / tickCount)
        return { start, end }
      }),
    [items.length, tickCount]
  )

  const tickForIndex = (index: number) =>
    Math.min(tickCount - 1, Math.floor((index * tickCount) / items.length))

  // Track which entries are currently on screen
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev)
          for (const entry of entries) {
            if (entry.isIntersecting) next.add(entry.target.id)
            else next.delete(entry.target.id)
          }
          return next
        })
      },
      { rootMargin: "-80px 0px -10% 0px" }
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  const scrollToItem = React.useCallback(
    (index: number) => {
      const item = items[index]
      if (!item) return
      const target = document.getElementById(item.id)
      if (!target) return
      const top = target.getBoundingClientRect().top + window.scrollY - 96
      window.scrollTo({ top, behavior: isDragging ? "auto" : "smooth" })
    },
    [items, isDragging]
  )

  const indexFromPointer = React.useCallback(
    (clientY: number) => {
      const rail = railRef.current
      if (!rail || items.length === 0) return 0
      const rect = rail.getBoundingClientRect()
      const ratio = rect.height > 0 ? (clientY - rect.top) / rect.height : 0
      const clamped = Math.max(0, Math.min(1, ratio))
      return Math.min(items.length - 1, Math.floor(clamped * items.length))
    },
    [items.length]
  )

  // Drag to scrub
  React.useEffect(() => {
    if (!isDragging) return
    const onMove = (e: PointerEvent) => {
      const index = indexFromPointer(e.clientY)
      setHoveredIndex(index)
      scrollToItem(index)
    }
    const onUp = () => {
      setIsDragging(false)
      setHoveredIndex(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [isDragging, indexFromPointer, scrollToItem])

  if (tickCount === 0) return null

  const hoveredTick = hoveredIndex !== null ? tickForIndex(hoveredIndex) : null
  const previewItem = hoveredIndex !== null ? items[hoveredIndex] : null
  const previewTitle = previewItem
    ? previewItem.title.replace(
        /^Workbook ERP Release — \d{4}-\d{2}-\d{2}$/,
        previewItem.highlights?.[0] || previewItem.title
      )
    : ""
  const previewBody = previewItem
    ? previewItem.description ||
      previewItem.highlights?.join(". ") ||
      "Product enhancements and bug fixes."
    : ""

  return (
    <aside
      aria-label="Timeline navigation"
      className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 select-none lg:block"
    >
      {/* Hit area — generous padding so the rail is easy to catch */}
      <div
        className="cursor-pointer px-3 py-3"
        onPointerMove={(e) => {
          if (!isDragging) setHoveredIndex(indexFromPointer(e.clientY))
        }}
        onPointerLeave={() => {
          if (!isDragging) setHoveredIndex(null)
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          const index = indexFromPointer(e.clientY)
          setHoveredIndex(index)
          setIsDragging(true)
          scrollToItem(index)
        }}
      >
        <div ref={railRef} className="relative w-4" style={{ height: railHeight }}>
          {ticks.map((tick, i) => {
            const inView = items
              .slice(tick.start, tick.end)
              .some((item) => visibleIds.has(item.id))
            const isHovered = hoveredTick === i
            return (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                aria-label={`Jump to ${items[tick.start]?.date}`}
                onClick={() => scrollToItem(tick.start)}
                className="absolute left-0 flex h-2 -translate-y-1/2 items-center focus:outline-none"
                style={{ top: i * TICK_GAP }}
              >
                <span
                  className={`block h-[1.5px] rounded-full transition-all duration-150 ease-out ${
                    isHovered
                      ? "w-4 bg-foreground"
                      : inView
                        ? "w-3 bg-foreground/80"
                        : "w-2 bg-muted-foreground/30"
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Hover preview — only exists while hovering / scrubbing */}
      <div
        aria-hidden={!previewItem}
        className={`pointer-events-none absolute left-10 w-[300px] -translate-y-1/2 transition-[opacity,transform,top] duration-150 ease-out ${
          previewItem ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
        }`}
        style={{ top: 12 + (hoveredTick ?? 0) * TICK_GAP }}
      >
        {previewItem && (
          <div className="rounded-2xl border border-border/60 bg-popover/90 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium text-foreground">
                {previewTitle}
              </p>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatDate(new Date(previewItem.date))}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
              {previewBody}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
