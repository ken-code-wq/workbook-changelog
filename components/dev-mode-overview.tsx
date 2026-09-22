"use client"

import * as React from "react"
import { useDevMode } from "./dev-mode-context"
import { Terminal, GitPullRequest, GitBranch, GitCommit, ExternalLink, Users } from "lucide-react"
import devTelemetry from "@/data/developer-telemetry.json"

export function DevModeOverview() {
  const { isDevMode, selectedTab, setSelectedTab } = useDevMode()

  if (!isDevMode) return null

  return (
    <section className="mb-12 rounded-2xl border border-primary/30 bg-card/60 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Decorative GitKraken-inspired accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-cyan-500" />
      <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
            <Terminal className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Developer Cockpit
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 uppercase tracking-widest font-semibold">
                  LIVE TELEMETRY
                </span>
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Workbook ERP Repository Deep Inspection &bull; {devTelemetry.totalCommits.toLocaleString()} commits &bull; {devTelemetry.totalPRs} PRs
            </p>
          </div>
        </div>

        <a
          href={devTelemetry.githubRepoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium px-3.5 py-1.5 rounded-lg border border-border bg-background/80 hover:bg-muted/60 transition-colors self-start md:self-auto text-foreground"
        >
          <span>github.com/everythingtechnologies/workbook-dashboard</span>
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-1">
            <GitCommit className="size-3.5 text-emerald-500" />
            <span>COMMITS</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">
            {devTelemetry.totalCommits.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground">across entire codebase</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-1">
            <GitPullRequest className="size-3.5 text-purple-500" />
            <span>PULL REQUESTS</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">
            {devTelemetry.totalPRs}
          </div>
          <span className="text-[10px] text-muted-foreground">merged feature PRs</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-1">
            <GitBranch className="size-3.5 text-cyan-500" />
            <span>BRANCHES</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">
            {devTelemetry.totalBranches}
          </div>
          <span className="text-[10px] text-muted-foreground">active feature branches</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-1">
            <Users className="size-3.5 text-amber-500" />
            <span>ENGINEERS</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">
            {devTelemetry.authorStats.length}
          </div>
          <span className="text-[10px] text-muted-foreground">core contributors</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-5 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setSelectedTab("all")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedTab === "all"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setSelectedTab("prs")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            selectedTab === "prs"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <GitPullRequest className="size-3.5" />
          <span>PRs ({devTelemetry.totalPRs})</span>
        </button>
        <button
          onClick={() => setSelectedTab("branches")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            selectedTab === "branches"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <GitBranch className="size-3.5" />
          <span>Branches ({devTelemetry.totalBranches})</span>
        </button>
        <button
          onClick={() => setSelectedTab("commits")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            selectedTab === "commits"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <GitCommit className="size-3.5" />
          <span>Commits View</span>
        </button>
      </div>

      {/* Tab: PRs Inspector */}
      {selectedTab === "prs" && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Recent Merged Pull Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {devTelemetry.recentPRs.map((pr) => (
              <a
                key={pr.number}
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between p-3 rounded-xl border border-border/70 bg-background/60 hover:border-primary/50 hover:bg-muted/30 transition-all text-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                    <span className="font-bold text-purple-400 group-hover:underline flex items-center gap-1">
                      <GitPullRequest className="size-3" />
                      #{pr.number}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{pr.mergedAt}</span>
                  </div>
                  <p className="font-sans font-medium text-foreground line-clamp-2 leading-relaxed">
                    {pr.title}
                  </p>
                </div>
                {pr.branch && (
                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span className="truncate max-w-[200px] text-cyan-400/90">&larr; {pr.branch}</span>
                    <span className="truncate max-w-[100px]">{pr.author}</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Branches Explorer */}
      {selectedTab === "branches" && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Remote Feature & Development Branches ({devTelemetry.totalBranches})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 font-mono text-xs">
            {devTelemetry.branches.map((b) => (
              <a
                key={b.name}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="group p-3 rounded-xl border border-border/70 bg-background/60 hover:border-cyan-500/50 hover:bg-muted/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1 truncate">
                    <GitBranch className="size-3 flex-shrink-0" />
                    <span className="truncate group-hover:underline">{b.cleanName}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans line-clamp-2">
                    {b.lastMessage || "Latest commit updates"}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{b.lastCommitDate}</span>
                  <span className="truncate max-w-[120px]">{b.author}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tab: All / Contributors */}
      {(selectedTab === "all" || selectedTab === "commits") && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-muted-foreground">
            <span>CORE REPO CONTRIBUTORS</span>
            <span>COMMITS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
            {devTelemetry.authorStats.slice(0, 6).map((author) => (
              <div
                key={author.author}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background/40"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                    {author.author.charAt(0)}
                  </div>
                  <span className="truncate text-foreground font-medium">{author.author}</span>
                </div>
                <span className="text-muted-foreground font-bold">{author.commitsCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
