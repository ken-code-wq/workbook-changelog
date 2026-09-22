#!/usr/bin/env node

/**
 * Workbook Automated JSON Changelog & Developer Telemetry Generator
 * 
 * Monitors the Workbook ERP repository for commits, translates them into:
 * 1. Customer-friendly public updates grouped by date in `data/changelog.json`.
 * 2. Deep GitKraken-style developer metadata in `data/developer-telemetry.json` (commits, branches, PRs, diff stats, authors).
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ERP_REPO_PATH = process.env.ERP_REPO_PATH || "/Users/kenneth/workspace/everything_tech/next js/workbook/workbook";
const ALL_HISTORY = process.env.ALL_HISTORY === "true";
const FULL_LOOKBACK = process.env.FULL_LOOKBACK === "true" || ALL_HISTORY;
const HOURS_LOOKBACK = parseInt(process.env.HOURS_LOOKBACK || "5", 10);
const DATA_FILE = path.resolve(process.cwd(), "data/changelog.json");
const DEV_DATA_FILE = path.resolve(process.cwd(), "data/developer-telemetry.json");

const GITHUB_REPO_URL = "https://github.com/everythingtechnologies/workbook-dashboard";

export interface RawCommit {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  message: string;
  parents: string[];
  isMerge: boolean;
  prNumber?: number;
  prTitle?: string;
  branchName?: string;
  scope?: string;
  type?: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  commitUrl: string;
  prUrl?: string;
}

export interface BranchInfo {
  name: string;
  cleanName: string;
  lastCommitDate: string;
  author: string;
  lastMessage: string;
  url?: string;
  isMain: boolean;
}

export interface PRInfo {
  number: number;
  title: string;
  mergeCommitHash: string;
  mergedAt: string;
  author: string;
  branch?: string;
  url: string;
}

export interface DeveloperTelemetry {
  generatedAt: string;
  githubRepoUrl: string;
  totalCommits: number;
  totalPRs: number;
  totalBranches: number;
  branches: BranchInfo[];
  recentPRs: PRInfo[];
  commits: RawCommit[];
  authorStats: { author: string; commitsCount: number }[];
  dateCommitMap: Record<string, RawCommit[]>;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  version?: string;
  tags: string[];
  highlights: string[];
  sections: {
    heading: string;
    items: string[];
  }[];
  // Developer stats for the date
  devStats?: {
    commitCount: number;
    prCount: number;
    filesChanged: number;
    additions: number;
    deletions: number;
    authors: string[];
    topCommits: {
      shortHash: string;
      hash: string;
      message: string;
      author: string;
      prNumber?: number;
      filesChanged: number;
      additions: number;
      deletions: number;
      commitUrl: string;
    }[];
  };
}

function fetchRepoCommits(repoPath: string): RawCommit[] {
  try {
    try {
      execSync("git fetch origin main --quiet", { cwd: repoPath, stdio: "ignore" });
    } catch {
      // Offline fallback
    }

    let sinceFlag = "";
    if (ALL_HISTORY) {
      sinceFlag = "";
    } else if (FULL_LOOKBACK) {
      sinceFlag = `--since="2026-01-01T00:00:00Z"`;
    } else {
      const sinceTime = new Date(Date.now() - HOURS_LOOKBACK * 60 * 60 * 1000).toISOString();
      sinceFlag = `--since="${sinceTime}"`;
    }

    const logOutput = execSync(
      `git log ${sinceFlag} --numstat --pretty=format:"COMMIT:%H|%h|%an|%ae|%ad|%s|%P" --date=short`,
      { cwd: repoPath, encoding: "utf8", maxBuffer: 40 * 1024 * 1024 }
    ).trim();

    if (!logOutput) return [];

    const blocks = logOutput.split(/^COMMIT:/m).filter(Boolean);
    const commits: RawCommit[] = [];

    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const headerLine = lines[0];
      const statLines = lines.slice(1);

      const [hash, shortHash, author, authorEmail, date, message, parentsStr] = headerLine.split("|");
      if (!hash || !message) continue;

      let filesChanged = 0;
      let additions = 0;
      let deletions = 0;

      for (const s of statLines) {
        const parts = s.trim().split("\t");
        if (parts.length >= 3) {
          filesChanged++;
          const add = parseInt(parts[0], 10);
          const del = parseInt(parts[1], 10);
          if (!isNaN(add)) additions += add;
          if (!isNaN(del)) deletions += del;
        }
      }

      const parents = parentsStr ? parentsStr.trim().split(" ").filter(Boolean) : [];
      const isMerge = parents.length > 1 || message.startsWith("Merge ");

      // Extract PR number if present: "Merge pull request #303 from everythingtechnologies/..."
      const prMatch = message.match(/Merge pull request #(\d+) from ([^\s\n]+)/i);
      const prNumber = prMatch ? parseInt(prMatch[1], 10) : undefined;
      const branchName = prMatch ? prMatch[2].replace(/^everythingtechnologies\//, "") : undefined;

      // Extract scope: feat(scope): message
      const scopeMatch = message.match(/^[a-z]+\(([^)]+)\):/i);
      const scope = scopeMatch ? scopeMatch[1].trim() : undefined;

      // Extract commit type (feat, fix, refactor, chore, etc.)
      const typeMatch = message.match(/^([a-z]+)(\([^)]+\))?:/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : isMerge ? "merge" : "other";

      const commitUrl = `${GITHUB_REPO_URL}/commit/${hash}`;
      const prUrl = prNumber ? `${GITHUB_REPO_URL}/pull/${prNumber}` : undefined;

      commits.push({
        hash,
        shortHash: shortHash || hash.slice(0, 8),
        author: author || "Team",
        authorEmail,
        date: date || new Date().toISOString().split("T")[0],
        message: message.trim(),
        parents,
        isMerge,
        prNumber,
        branchName,
        scope,
        type,
        filesChanged,
        additions,
        deletions,
        commitUrl,
        prUrl,
      });
    }

    return commits;
  } catch (err: any) {
    console.error(`[Error] Failed to read git history from ${repoPath}:`, err.message);
    return [];
  }
}

function fetchBranches(repoPath: string): BranchInfo[] {
  try {
    const raw = execSync(
      `git branch -r --format="%(refname:short)|%(committerdate:short)|%(authorname)|%(subject)"`,
      { cwd: repoPath, encoding: "utf8" }
    ).trim();

    if (!raw) return [];

    const lines = raw.split("\n");
    const branches: BranchInfo[] = [];

    for (const l of lines) {
      const [name, date, author, subject] = l.split("|");
      if (!name || name.includes("HEAD")) continue;

      const cleanName = name.replace(/^(origin\/|orchids-sync\/)/, "");
      const isMain = cleanName === "main" || cleanName === "master";

      branches.push({
        name,
        cleanName,
        lastCommitDate: date || "",
        author: author || "Team",
        lastMessage: subject || "",
        url: `${GITHUB_REPO_URL}/tree/${cleanName}`,
        isMain,
      });
    }

    // Sort by commit date descending
    branches.sort((a, b) => new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime());
    return branches;
  } catch (err: any) {
    console.warn(`[Warning] Could not fetch branches:`, err.message);
    return [];
  }
}

function sanitizeMessage(msg: string): string {
  let text = msg.trim();
  const prefixMatch = text.match(/^(feat|fix|perf|refactor|docs|style)\s*(\([^)]+\))?:\s*/i);
  if (prefixMatch) {
    text = text.replace(prefixMatch[0], "");
  }
  text = text.charAt(0).toUpperCase() + text.slice(1);
  text = text.replace(/`?[a-zA-Z0-9_\-\/]+\.(ts|tsx|js|jsx|py|go|java|sql)`?/g, "system component");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

const MODULE_DISPLAY_NAMES: Record<string, string> = {
  insights: "Sales Insights",
  sales: "Sales Management",
  analytics: "Analytics & Reporting",
  cfo: "Executive & CFO Dashboard",
  "cash-sales": "Cash Sales",
  settings: "Settings & Configuration",
  estimates: "Estimates & Quotes",
  invoices: "Invoice Management",
  receipts: "Receipts & Transactions",
  "purchase-requests": "Purchase Requests",
  inventory: "Inventory Management",
  shipment: "Shipment Tracking",
  reconciliation: "Bank Reconciliation",
  branches: "Branch Operations",
  "chart-of-accounts": "Chart of Accounts",
  accounting: "Financial Accounting",
  ui: "Workspace UI",
  auth: "Security & Authentication",
  contacts: "Contacts & Debtors",
  pdf: "PDF Reporting",
  prepayments: "Prepayments",
};

function synthesizeTitle(dateStr: string, commits: RawCommit[]): string {
  const nonMerge = commits.filter((c) => !c.isMerge);
  const pool = nonMerge.length > 0 ? nonMerge : commits;

  const featureCommit = pool.find((c) => {
    const l = c.message.toLowerCase();
    return l.startsWith("feat") || l.startsWith("add ") || l.includes("enhance") || l.includes("introduce");
  });

  if (featureCommit) {
    let raw = sanitizeMessage(featureCommit.message).replace(/\.+$/, "");
    if (raw.includes(";")) raw = raw.split(";")[0].trim();
    if (raw.length > 60) {
      const words = raw.split(" ");
      if (words.length > 7) raw = words.slice(0, 7).join(" ") + "...";
    }
    return raw;
  }

  const scopes = pool.map((c) => c.scope?.toLowerCase()).filter(Boolean) as string[];
  if (scopes.length > 0) {
    const freq: Record<string, number> = {};
    for (const s of scopes) freq[s] = (freq[s] || 0) + 1;
    const topScope = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const moduleName = MODULE_DISPLAY_NAMES[topScope] || topScope.charAt(0).toUpperCase() + topScope.slice(1);
    return `${moduleName} Updates & Improvements`;
  }

  const fixCommit = pool.find((c) => c.message.toLowerCase().startsWith("fix"));
  if (fixCommit) {
    let raw = sanitizeMessage(fixCommit.message).replace(/\.+$/, "");
    if (raw.length > 60) raw = raw.slice(0, 57) + "...";
    return raw;
  }

  const dateObj = new Date(dateStr);
  const formatted = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `Product Updates — ${formatted}`;
}

function synthesizeDescription(title: string, dateCommits: RawCommit[]): string {
  const count = dateCommits.length;
  const scopes = Array.from(new Set(dateCommits.map((c) => c.scope?.toLowerCase()).filter(Boolean) as string[]));

  if (scopes.length > 0) {
    const namedScopes = scopes.slice(0, 3).map((s) => MODULE_DISPLAY_NAMES[s] || s);
    const scopeList = namedScopes.join(", ");
    return `Shipped ${count} update${count > 1 ? "s" : ""} across ${scopeList}, with stability and workflow enhancements.`;
  }

  return `Performance optimizations, workflow refinements, and bug fixes across Workbook ERP.`;
}

function buildEntryForDate(dateStr: string, dateCommits: RawCommit[]): ChangelogEntry {
  const features: string[] = [];
  const improvements: string[] = [];
  const fixes: string[] = [];

  for (const c of dateCommits) {
    if (
      c.message.toLowerCase().startsWith("merge") ||
      c.message.toLowerCase().startsWith("chore:") ||
      c.message.toLowerCase().startsWith("ci:") ||
      c.message.toLowerCase().startsWith("test:")
    ) {
      continue;
    }

    const cleanMsg = sanitizeMessage(c.message);
    const lower = c.message.toLowerCase();

    if (lower.startsWith("feat") || lower.includes("add")) {
      features.push(cleanMsg);
    } else if (lower.startsWith("fix") || lower.includes("bug")) {
      fixes.push(cleanMsg);
    } else {
      improvements.push(cleanMsg);
    }
  }

  const tags: string[] = [];
  if (features.length) tags.push("Features");
  if (improvements.length) tags.push("Improvements");
  if (fixes.length) tags.push("Fixes");

  const sections = [];
  if (features.length) sections.push({ heading: "✨ New Features", items: features });
  if (improvements.length) sections.push({ heading: "⚡ Improvements", items: improvements });
  if (fixes.length) sections.push({ heading: "🐛 Bug Fixes", items: fixes });

  const title = synthesizeTitle(dateStr, dateCommits);
  const description = synthesizeDescription(title, dateCommits);

  // Compute developer telemetry for this release
  const authorsSet = new Set(dateCommits.map((c) => c.author));
  const prsInDate = dateCommits.filter((c) => c.prNumber);
  const totalFiles = dateCommits.reduce((acc, c) => acc + c.filesChanged, 0);
  const totalAdd = dateCommits.reduce((acc, c) => acc + c.additions, 0);
  const totalDel = dateCommits.reduce((acc, c) => acc + c.deletions, 0);

  const topCommits = dateCommits.slice(0, 15).map((c) => ({
    shortHash: c.shortHash,
    hash: c.hash,
    message: c.message,
    author: c.author,
    prNumber: c.prNumber,
    filesChanged: c.filesChanged,
    additions: c.additions,
    deletions: c.deletions,
    commitUrl: c.commitUrl,
  }));

  return {
    id: `rel-${dateStr}`,
    title,
    description,
    date: dateStr,
    tags: tags.length ? tags : ["Update"],
    highlights: [...features, ...improvements, ...fixes].slice(0, 3),
    sections,
    devStats: {
      commitCount: dateCommits.length,
      prCount: prsInDate.length,
      filesChanged: totalFiles,
      additions: totalAdd,
      deletions: totalDel,
      authors: Array.from(authorsSet),
      topCommits,
    },
  };
}

function run() {
  console.log(`[Changelog Bot] Monitoring ERP repo at: ${ERP_REPO_PATH}`);
  if (ALL_HISTORY) {
    console.log(`[Changelog Bot] Performing COMPLETE history lookback from the first commit...`);
  } else if (FULL_LOOKBACK) {
    console.log(`[Changelog Bot] Performing lookback since beginning of 2026...`);
  } else {
    console.log(`[Changelog Bot] Checking commits in the last ${HOURS_LOOKBACK} hours...`);
  }

  const allCommits = fetchRepoCommits(ERP_REPO_PATH);

  if (allCommits.length === 0) {
    console.log(`[Changelog Bot] No commits found for the specified period.`);
    return;
  }

  console.log(`[Changelog Bot] Extracted ${allCommits.length} commits with stats.`);

  // Group commits by commit date (YYYY-MM-DD)
  const groupedByDate: Record<string, RawCommit[]> = {};
  for (const c of allCommits) {
    if (!groupedByDate[c.date]) {
      groupedByDate[c.date] = [];
    }
    groupedByDate[c.date].push(c);
  }

  // Build developer telemetry store (GitKraken-style)
  const branches = fetchBranches(ERP_REPO_PATH);

  const prs: PRInfo[] = [];
  const seenPRs = new Set<number>();
  for (const c of allCommits) {
    if (c.prNumber && !seenPRs.has(c.prNumber)) {
      seenPRs.add(c.prNumber);
      prs.push({
        number: c.prNumber,
        title: c.message.replace(/Merge pull request #\d+ from [^\n]+/i, "").trim() || c.message,
        mergeCommitHash: c.hash,
        mergedAt: c.date,
        author: c.author,
        branch: c.branchName,
        url: `${GITHUB_REPO_URL}/pull/${c.prNumber}`,
      });
    }
  }

  // Calculate author stats
  const authorMap: Record<string, number> = {};
  for (const c of allCommits) {
    authorMap[c.author] = (authorMap[c.author] || 0) + 1;
  }
  const authorStats = Object.entries(authorMap)
    .map(([author, commitsCount]) => ({ author, commitsCount }))
    .sort((a, b) => b.commitsCount - a.commitsCount);

  const devTelemetry: DeveloperTelemetry = {
    generatedAt: new Date().toISOString(),
    githubRepoUrl: GITHUB_REPO_URL,
    totalCommits: allCommits.length,
    totalPRs: prs.length,
    totalBranches: branches.length,
    branches,
    recentPRs: prs.slice(0, 50),
    commits: allCommits.slice(0, 200), // Top 200 recent commits for the live graph
    authorStats,
    dateCommitMap: groupedByDate,
  };

  fs.mkdirSync(path.dirname(DEV_DATA_FILE), { recursive: true });
  fs.writeFileSync(DEV_DATA_FILE, JSON.stringify(devTelemetry, null, 2), "utf8");
  console.log(`[Changelog Bot] Saved developer telemetry to: ${DEV_DATA_FILE}`);

  // Build public changelog JSON with embedded dev stats per card
  if (FULL_LOOKBACK || ALL_HISTORY) {
    const allEntries: ChangelogEntry[] = [];
    for (const [dateStr, dateCommits] of Object.entries(groupedByDate)) {
      allEntries.push(buildEntryForDate(dateStr, dateCommits));
    }
    allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(allEntries, null, 2), "utf8");
    console.log(`[Changelog Bot] Successfully generated ${allEntries.length} releases in: ${DATA_FILE}`);
  } else {
    let existingData: ChangelogEntry[] = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        existingData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      } catch {
        existingData = [];
      }
    }

    for (const [dateStr, dateCommits] of Object.entries(groupedByDate)) {
      const entry = buildEntryForDate(dateStr, dateCommits);
      const idx = existingData.findIndex((e) => e.date === dateStr);
      if (idx !== -1) {
        existingData[idx] = entry;
      } else {
        existingData.push(entry);
      }
    }

    existingData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2), "utf8");
    console.log(`[Changelog Bot] Updated ${Object.keys(groupedByDate).length} date(s). Total releases: ${existingData.length}`);
  }
}

run();
