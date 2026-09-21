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

export function TimelineScrubber({ items }: TimelineScrubberProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const trackRef = React.useRef<HTMLDivElement>(null)

  // Track active item based on scroll position
  React.useEffect(() => {
    const handleScroll = () => {
      if (isDragging) return
      const scrollPosition = window.scrollY + 180

      for (let i = 0; i < items.length; i++) {
        const el = document.getElementById(items[i].id)
        if (el) {
          const top = el.offsetTop
          const bottom = top + el.offsetHeight
          if (scrollPosition >= top && scrollPosition < bottom) {
            setActiveIndex(i)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [items, isDragging])

  // Navigate to an entry
  const scrollToItem = (index: number) => {
    if (index < 0 || index >= items.length) return
    setActiveIndex(index)
    const target = document.getElementById(items[index].id)
    if (target) {
      const topOffset = target.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: topOffset, behavior: "smooth" })
    }
  }

  // Calculate index from mouse/touch Y position
  const getIndexFromPointer = (clientY: number) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const clampedY = Math.max(0, Math.min(clientY - rect.top, rect.height))
    const ratio = clampedY / rect.height
    const index = Math.min(
      items.length - 1,
      Math.max(0, Math.round(ratio * (items.length - 1)))
    )
    return index
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    const index = getIndexFromPointer(e.clientY)
    scrollToItem(index)
  }

  React.useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const index = getIndexFromPointer(e.clientY)
      scrollToItem(index)
    }

    const handlePointerUp = () => {
      if (isDragging) setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [isDragging, items])

  const previewIndex = hoveredIndex ?? activeIndex
  const previewItem = items[previewIndex]

  // Sampling for ticks (show ~28 ticks max to fit nicely in sidebar)
  const tickCount = Math.min(32, items.length)
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const mappedIndex = Math.round((i / (tickCount - 1)) * (items.length - 1))
    return {
      index: mappedIndex,
      isMajor: i % 4 === 0,
    }
  })

  // Calculate current slider indicator percentage position
  const activePercent = items.length > 1 ? (activeIndex / (items.length - 1)) * 100 : 0
  const previewPercent = items.length > 1 ? (previewIndex / (items.length - 1)) * 100 : 0

  return (
    <aside
      aria-label="Timeline navigation"
      className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 select-none items-center"
    >
      {/* Ticks rail */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => setHoveredIndex(null)}
        className="relative py-4 px-3 flex flex-col justify-between h-[360px] cursor-ns-resize group"
      >
        {/* Rail background hover bar */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-1.5 rounded-full bg-border/40 group-hover:bg-border/70 transition-colors" />

        {/* Ticks */}
        {ticks.map((tick, i) => {
          const isSelected = Math.abs(tick.index - activeIndex) <= Math.max(1, Math.floor(items.length / tickCount / 2))
          return (
            <button
              type="button"
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                scrollToItem(tick.index)
              }}
              onMouseEnter={() => setHoveredIndex(tick.index)}
              className="relative z-10 flex items-center justify-center p-0.5 focus:outline-none"
              aria-label={`Scroll to ${items[tick.index]?.date}`}
            >
              <div
                className={`transition-all rounded-full ${
                  tick.isMajor
                    ? isSelected
                      ? "w-4 h-0.5 bg-foreground"
                      : "w-3 h-0.5 bg-muted-foreground/60 group-hover:bg-muted-foreground"
                    : isSelected
                    ? "w-2.5 h-0.5 bg-foreground/80"
                    : "w-1.5 h-0.5 bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                }`}
              />
            </button>
          )
        })}

        {/* Active position indicator bar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-1 bg-primary rounded-full pointer-events-none transition-all duration-75 shadow-sm"
          style={{ top: `calc(${activePercent}% + 8px)` }}
        />
      </div>

      {/* Floating Preview Card (matching screenshot) */}
      {previewItem && (
        <div
          className="ml-3 transition-all duration-100 ease-out"
          style={{
            transform: `translateY(calc(${previewPercent - 50}% * 0.7))`,
          }}
        >
          <div
            onClick={() => scrollToItem(previewIndex)}
            className="w-[300px] cursor-pointer rounded-2xl border border-border/70 bg-popover/95 p-4 shadow-xl backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-2xl"
          >
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {previewItem.date}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDate(new Date(previewItem.date))}
              </span>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wide text-foreground line-clamp-2 leading-snug">
              {previewItem.title.replace(/^Workbook ERP Release — \d{4}-\d{2}-\d{2}$/, previewItem.highlights?.[0] || previewItem.title)}
            </h4>

            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
              {previewItem.description || previewItem.highlights?.join(". ") || "Product enhancements and bug fixes."}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
