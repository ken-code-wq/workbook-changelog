"use client"

import * as React from "react"
import {
  GitCommit,
  GitPullRequest,
  GitBranch,
  Terminal,
  ExternalLink,
  Search,
  Users,
  Calendar,
  ChevronRight,
  Copy,
  Check,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react"
import devTelemetryRaw from "@/data/developer-telemetry.json"
import Link from "next/link"

interface RawCommit {
  hash: string
  shortHash: string
  author: string
  authorEmail?: string
  date: string
  message: string
  parents: string[]
  isMerge: boolean
  prNumber?: number
  branchName?: string
  scope?: string
  type?: string
  filesChanged: number
  additions: number
  deletions: number
  commitUrl: string
  prUrl?: string
}

interface BranchInfo {
  name: string
  cleanName: string
  lastCommitDate: string
  author: string
  lastMessage: string
  url?: string
  isMain: boolean
}

interface PRInfo {
  number: number
  title: string
  mergeCommitHash: string
  mergedAt: string
  author: string
  branch?: string
  url: string
}

const telemetry = devTelemetryRaw as {
  generatedAt: string
  githubRepoUrl: string
  totalCommits: number
  totalPRs: number
  totalBranches: number
  branches: BranchInfo[]
  recentPRs: PRInfo[]
  commits: RawCommit[]
  authorStats: { author: string; commitsCount: number }[]
  dateCommitMap: Record<string, RawCommit[]>
}

export function DevStudioClient() {
  const [activeTab, setActiveTab] = React.useState<"graph" | "prs" | "branches" | "contributors">("graph")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all")
  const [selectedAuthor, setSelectedAuthor] = React.useState<string>("all")
  const [selectedCommit, setSelectedCommit] = React.useState<RawCommit | null>(telemetry.commits[0] || null)
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 1800)
  }

  // Filter commits
  const filteredCommits = React.useMemo(() => {
    return telemetry.commits.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.shortHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.prNumber && String(c.prNumber).includes(searchQuery))

      const matchAuthor = selectedAuthor === "all" || c.author === selectedAuthor

      return matchSearch && matchAuthor
    })
  }, [searchQuery, selectedAuthor])

  // Filter PRs
  const filteredPRs = React.useMemo(() => {
    return telemetry.recentPRs.filter((pr) => {
      return (
        !searchQuery ||
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(pr.number).includes(searchQuery) ||
        pr.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pr.branch && pr.branch.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })
  }, [searchQuery])

  // Filter branches
  const filteredBranches = React.useMemo(() => {
    return telemetry.branches.filter((b) => {
      return (
        !searchQuery ||
        b.cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [searchQuery])

  // Helper colors for commit lanes
  const getBranchColor = (index: number) => {
    const colors = [
      "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      "text-purple-400 bg-purple-500/10 border-purple-500/30",
      "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      "text-amber-400 bg-amber-500/10 border-amber-500/30",
      "text-pink-400 bg-pink-500/10 border-pink-500/30",
      "text-blue-400 bg-blue-500/10 border-blue-500/30",
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="min-h-screen bg-[#090D14] text-[#E2E8F0] selection:bg-emerald-500/20 font-sans">
      {/* GitKraken Top Bar */}
      <div className="border-b border-[#1E293B] bg-[#0B111E]/90 backdrop-blur-md sticky top-14 z-30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Repository breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="size-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="size-3.5" />
          </div>
          <span className="text-muted-foreground">everythingtechnologies</span>
          <span className="text-slate-600">/</span>
          <span className="font-bold text-white tracking-wide">workbook-dashboard</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
            main
          </span>
        </div>

        {/* Global stats pills */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131D2E] border border-[#1E293B]">
            <GitCommit className="size-3.5 text-emerald-400" />
            <span className="text-slate-400">Commits:</span>
            <span className="font-bold text-white">{telemetry.totalCommits.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131D2E] border border-[#1E293B]">
            <GitPullRequest className="size-3.5 text-purple-400" />
            <span className="text-slate-400">PRs:</span>
            <span className="font-bold text-white">{telemetry.totalPRs}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131D2E] border border-[#1E293B]">
            <GitBranch className="size-3.5 text-cyan-400" />
            <span className="text-slate-400">Branches:</span>
            <span className="font-bold text-white">{telemetry.totalBranches}</span>
          </div>

          <a
            href={telemetry.githubRepoUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="size-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Studio Sidebar (Branches, Authors, Navigation) */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Studio Navigation Pills */}
          <div className="bg-[#0E1526] rounded-xl border border-[#1E293B] p-2 space-y-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab("graph")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                activeTab === "graph"
                  ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="size-4" />
                <span>Commit Graph & Tree</span>
              </div>
              <span className="text-[10px] text-slate-500">{filteredCommits.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("prs")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                activeTab === "prs"
                  ? "bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <GitPullRequest className="size-4" />
                <span>Pull Requests</span>
              </div>
              <span className="text-[10px] text-slate-500">{telemetry.totalPRs}</span>
            </button>

            <button
              onClick={() => setActiveTab("branches")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                activeTab === "branches"
                  ? "bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="size-4" />
                <span>Branches Explorer</span>
              </div>
              <span className="text-[10px] text-slate-500">{telemetry.totalBranches}</span>
            </button>

            <button
              onClick={() => setActiveTab("contributors")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                activeTab === "contributors"
                  ? "bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>Core Contributors</span>
              </div>
              <span className="text-[10px] text-slate-500">{telemetry.authorStats.length}</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="bg-[#0E1526] rounded-xl border border-[#1E293B] p-3 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Filter By Engineer</span>
              {selectedAuthor !== "all" && (
                <button
                  onClick={() => setSelectedAuthor("all")}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
              <button
                onClick={() => setSelectedAuthor("all")}
                className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center justify-between ${
                  selectedAuthor === "all" ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>All Contributors</span>
                <span className="text-[10px] text-slate-500">{telemetry.commits.length}</span>
              </button>

              {telemetry.authorStats.map((a) => (
                <button
                  key={a.author}
                  onClick={() => setSelectedAuthor(a.author)}
                  className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center justify-between ${
                    selectedAuthor === a.author ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="truncate max-w-[140px]">{a.author}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{a.commitsCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Commit Inspector Panel (GitKraken bottom/side panel) */}
          {selectedCommit && (
            <div className="bg-[#0E1526] rounded-xl border border-[#1E293B] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Selected Node</span>
                <a
                  href={selectedCommit.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline text-[11px]"
                >
                  <span>View Diff</span>
                  <ExternalLink className="size-2.5" />
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">{selectedCommit.shortHash}</span>
                  <button
                    onClick={() => handleCopy(selectedCommit.hash)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    title="Copy Full SHA"
                  >
                    {copiedHash === selectedCommit.hash ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                  {selectedCommit.prNumber && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                      PR #{selectedCommit.prNumber}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 font-sans leading-relaxed text-xs">
                  {selectedCommit.message}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1E293B] grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">AUTHOR</span>
                  <span className="text-slate-300 truncate block">{selectedCommit.author}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DATE</span>
                  <span className="text-slate-300 block">{selectedCommit.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FILES CHANGED</span>
                  <span className="text-slate-300 block">{selectedCommit.filesChanged}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DIFF METRICS</span>
                  <span className="block font-bold">
                    <span className="text-emerald-400">+{selectedCommit.additions}</span>{" "}
                    <span className="text-rose-400">-{selectedCommit.deletions}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center Main Work Area */}
        <main className="lg:col-span-9 space-y-4">
          {/* Search and view filter bar */}
          <div className="bg-[#0E1526] rounded-xl border border-[#1E293B] p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search commit messages, hashes, PRs (#303), branches or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080D18] border border-[#1E293B] rounded-lg pl-9 pr-4 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Showing:</span>
              <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-white">
                {activeTab === "graph"
                  ? `${filteredCommits.length} Commits`
                  : activeTab === "prs"
                  ? `${filteredPRs.length} PRs`
                  : activeTab === "branches"
                  ? `${filteredBranches.length} Branches`
                  : `${telemetry.authorStats.length} Engineers`}
              </span>
            </div>
          </div>

          {/* VIEW 1: GitKraken Commit Graph & Interactive Table */}
          {activeTab === "graph" && (
            <div className="bg-[#0E1526] rounded-xl border border-[#1E293B] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#080D18] border-b border-[#1E293B] grid grid-cols-12 gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <div className="col-span-2 sm:col-span-1">Graph</div>
                <div className="col-span-2 sm:col-span-2">SHA / PR</div>
                <div className="col-span-6 sm:col-span-6">Commit Message</div>
                <div className="hidden sm:block sm:col-span-2">Author</div>
                <div className="col-span-2 sm:col-span-1 text-right">Date</div>
              </div>

              <div className="max-h-[680px] overflow-y-auto divide-y divide-[#172236] font-mono text-xs">
                {filteredCommits.slice(0, 150).map((c, idx) => {
                  const isSelected = selectedCommit?.hash === c.hash
                  const laneColor = getBranchColor(idx)

                  return (
                    <div
                      key={c.hash}
                      onClick={() => setSelectedCommit(c)}
                      className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-500/10 border-l-2 border-emerald-400"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Visual Graph Line Node */}
                      <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                        <div className="relative flex items-center justify-center">
                          {/* Vertical branch line connector */}
                          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-700 pointer-events-none" />
                          {/* Commit node dot */}
                          <div
                            className={`size-2.5 rounded-full z-10 ${
                              c.isMerge
                                ? "bg-purple-400 ring-2 ring-purple-500/30"
                                : c.scope
                                ? "bg-emerald-400 ring-2 ring-emerald-500/30"
                                : "bg-cyan-400"
                            }`}
                          />
                        </div>
                        {c.isMerge && (
                          <span className="hidden md:inline text-[9px] px-1 rounded bg-purple-500/20 text-purple-300">
                            M
                          </span>
                        )}
                      </div>

                      {/* SHA & PR badge */}
                      <div className="col-span-2 sm:col-span-2 flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-300">{c.shortHash}</span>
                        {c.prNumber && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                            #{c.prNumber}
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <div className="col-span-6 sm:col-span-6 flex items-center gap-2 truncate">
                        {c.scope && (
                          <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {c.scope}
                          </span>
                        )}
                        <span className="text-slate-200 font-sans text-xs truncate" title={c.message}>
                          {c.message}
                        </span>
                      </div>

                      {/* Author */}
                      <div className="hidden sm:block sm:col-span-2 text-slate-400 text-[11px] truncate">
                        {c.author}
                      </div>

                      {/* Date */}
                      <div className="col-span-2 sm:col-span-1 text-right text-slate-500 text-[11px]">
                        {c.date.slice(5)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Pull Requests Grid */}
          {activeTab === "prs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPRs.map((pr) => (
                <div
                  key={pr.number}
                  className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] hover:border-purple-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 font-mono text-xs">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-purple-400 hover:underline flex items-center gap-1.5"
                      >
                        <GitPullRequest className="size-3.5" />
                        <span>Pull Request #{pr.number}</span>
                        <ExternalLink className="size-2.5 text-slate-500" />
                      </a>
                      <span className="text-slate-500">{pr.mergedAt}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {pr.title}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-cyan-400 truncate max-w-[200px]">
                      &larr; {pr.branch || "feature-branch"}
                    </span>
                    <span className="text-slate-500 truncate max-w-[120px]">{pr.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 3: Branches Explorer */}
          {activeTab === "branches" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredBranches.map((b) => (
                <div
                  key={b.name}
                  className="p-3.5 rounded-xl bg-[#0E1526] border border-[#1E293B] hover:border-cyan-500/40 transition-all flex flex-col justify-between font-mono text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-cyan-400 hover:underline truncate flex items-center gap-1.5"
                      >
                        <GitBranch className="size-3.5 flex-shrink-0" />
                        <span className="truncate">{b.cleanName}</span>
                      </a>
                      {b.isMain && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          default
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 font-sans text-xs line-clamp-2 mt-1">
                      {b.lastMessage || "Latest commits"}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-slate-500">
                    <span>{b.lastCommitDate}</span>
                    <span className="truncate max-w-[100px]">{b.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 4: Contributors */}
          {activeTab === "contributors" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {telemetry.authorStats.map((author, index) => (
                <div
                  key={author.author}
                  className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] flex items-center gap-3.5 font-mono"
                >
                  <div className="size-11 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-md flex-shrink-0">
                    {author.author.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate">{author.author}</h4>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {author.commitsCount} commits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
