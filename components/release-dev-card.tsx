"use client"

import * as React from "react"
import { useDevMode } from "./dev-mode-context"
import { GitCommit, GitPullRequest, FileCode, Plus, Minus, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

interface DevStatsProps {
  date: string
  devStats?: {
    commitCount: number
    prCount: number
    filesChanged: number
    additions: number
    deletions: number
    authors: string[];
    topCommits: {
      shortHash: string
      hash: string
      message: string
      author: string
      prNumber?: number
      filesChanged: number
      additions: number
      deletions: number
      commitUrl: string
    }[]
  }
}

export function ReleaseDevCard({ date, devStats }: DevStatsProps) {
  const { isDevMode } = useDevMode()
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (!isDevMode || !devStats) return null

  return (
    <div className="mt-5 rounded-xl border border-primary/25 bg-muted/20 p-4 font-mono text-xs transition-all">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground font-semibold">
            <GitCommit className="size-3.5 text-emerald-500" />
            <span>{devStats.commitCount} commits</span>
          </span>

          {devStats.prCount > 0 && (
            <span className="flex items-center gap-1 text-purple-400">
              <GitPullRequest className="size-3.5" />
              <span>{devStats.prCount} PR{devStats.prCount > 1 ? "s" : ""}</span>
            </span>
          )}

          {devStats.filesChanged > 0 && (
            <span className="flex items-center gap-1">
              <FileCode className="size-3.5 text-blue-400" />
              <span>{devStats.filesChanged} files</span>
            </span>
          )}

          {(devStats.additions > 0 || devStats.deletions > 0) && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-emerald-500 font-bold flex items-center">
                <Plus className="size-3 inline" />
                {devStats.additions.toLocaleString()}
              </span>
              <span className="text-rose-500 font-bold flex items-center">
                <Minus className="size-3 inline" />
                {devStats.deletions.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
        >
          <span>{isExpanded ? "Hide git log" : "Inspect git log"}</span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {/* Authors list */}
      {devStats.authors && devStats.authors.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
          <span className="text-muted-foreground/70">Engineers:</span>
          <span className="text-foreground truncate">{devStats.authors.join(", ")}</span>
        </div>
      )}

      {/* Expanded Commit Details (GitKraken-style log) */}
      {isExpanded && devStats.topCommits && (
        <div className="mt-3.5 pt-3 border-t border-border/50 space-y-2 max-h-72 overflow-y-auto pr-1">
          {devStats.topCommits.map((c) => (
            <div
              key={c.hash}
              className="p-2 rounded-lg bg-background/60 border border-border/60 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 truncate">
                <a
                  href={c.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-cyan-400 hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <span>{c.shortHash}</span>
                  <ExternalLink className="size-2.5" />
                </a>

                {c.prNumber && (
                  <a
                    href={`https://github.com/everythingtechnologies/workbook-dashboard/pull/${c.prNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold hover:underline flex-shrink-0"
                  >
                    #{c.prNumber}
                  </a>
                )}

                <span className="text-foreground/90 font-sans text-xs truncate" title={c.message}>
                  {c.message}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-shrink-0 font-mono">
                {(c.additions > 0 || c.deletions > 0) && (
                  <span className="text-[10px]">
                    <span className="text-emerald-500">+{c.additions}</span>{" "}
                    <span className="text-rose-500">-{c.deletions}</span>
                  </span>
                )}
                <span className="text-muted-foreground/80 truncate max-w-[100px]">{c.author}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
