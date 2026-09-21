#!/usr/bin/env node

/**
 * Workbook Automated JSON Changelog Generator
 * 
 * Monitors the Workbook ERP repository for commits, translates them into
 * natural-language customer-friendly updates, and updates `data/changelog.json`.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ERP_REPO_PATH = process.env.ERP_REPO_PATH || "/Users/kenneth/workspace/everything_tech/next js/workbook/workbook";
const ALL_HISTORY = process.env.ALL_HISTORY === "true";
const FULL_LOOKBACK = process.env.FULL_LOOKBACK === "true" || ALL_HISTORY;
const HOURS_LOOKBACK = parseInt(process.env.HOURS_LOOKBACK || "5", 10);
const DATA_FILE = path.resolve(process.cwd(), "data/changelog.json");

interface CommitInfo {
  hash: string;
  author: string;
  date: string; // YYYY-MM-DD
  message: string;
  scope?: string;
}

interface ChangelogEntry {
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
}

function getCommits(repoPath: string): CommitInfo[] {
  try {
    try {
      execSync("git fetch origin main --quiet", { cwd: repoPath, stdio: "ignore" });
    } catch {
      // Offline / local fallback
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
      `git log ${sinceFlag} --pretty=format:"%H|%an|%ad|%s" --date=short`,
      { cwd: repoPath, encoding: "utf8", maxBuffer: 15 * 1024 * 1024 }
    ).trim();

    if (!logOutput) return [];

    const lines = logOutput.split("\n");
    const commits: CommitInfo[] = [];

    for (const line of lines) {
      const [hash, author, date, message] = line.split("|");
      if (!hash) continue;

      if (
        message.toLowerCase().startsWith("merge") ||
        message.toLowerCase().startsWith("chore:") ||
        message.toLowerCase().startsWith("ci:") ||
        message.toLowerCase().startsWith("test:")
      ) {
        continue;
      }

      // Extract scope if present: feat(scope): message
      const scopeMatch = message.match(/^[a-z]+\(([^)]+)\):/i);
      const scope = scopeMatch ? scopeMatch[1].trim() : undefined;

      commits.push({ hash, author, date, message, scope });
    }

    return commits;
  } catch (err: any) {
    console.error(`[Error] Failed to read git history from ${repoPath}:`, err.message);
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
  // Clean up any double spaces
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
};

/**
 * Synthesizes a natural language title for a release date.
 */
function synthesizeTitle(dateStr: string, commits: CommitInfo[]): string {
  // 1. Check if there is a primary feature commit
  const featureCommit = commits.find((c) => {
    const l = c.message.toLowerCase();
    return l.startsWith("feat") || l.startsWith("add ") || l.includes("enhance") || l.includes("introduce");
  });

  if (featureCommit) {
    let raw = sanitizeMessage(featureCommit.message);
    // Remove trailing periods and clean up
    raw = raw.replace(/\.+$/, "");

    // Truncate overly long commit run-on sentences
    if (raw.includes(";")) {
      raw = raw.split(";")[0].trim();
    }
    if (raw.length > 60) {
      const words = raw.split(" ");
      if (words.length > 7) {
        raw = words.slice(0, 7).join(" ") + "...";
      }
    }
    return raw;
  }

  // 2. Derive title from commit scopes or dominant topic
  const scopes = commits.map((c) => c.scope?.toLowerCase()).filter(Boolean) as string[];
  if (scopes.length > 0) {
    const freq: Record<string, number> = {};
    for (const s of scopes) freq[s] = (freq[s] || 0) + 1;
    const topScope = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const moduleName = MODULE_DISPLAY_NAMES[topScope] || topScope.charAt(0).toUpperCase() + topScope.slice(1);
    return `${moduleName} Updates & Improvements`;
  }

  // 3. Check for fixes or improvements
  const fixCommit = commits.find((c) => c.message.toLowerCase().startsWith("fix"));
  if (fixCommit) {
    let raw = sanitizeMessage(fixCommit.message).replace(/\.+$/, "");
    if (raw.length > 60) raw = raw.slice(0, 57) + "...";
    return raw;
  }

  // Fallback to formatted readable date
  const dateObj = new Date(dateStr);
  const formatted = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `Product Updates — ${formatted}`;
}

/**
 * Synthesizes a natural language description for the release.
 */
function synthesizeDescription(title: string, dateCommits: CommitInfo[]): string {
  const count = dateCommits.length;
  const scopes = Array.from(new Set(dateCommits.map((c) => c.scope?.toLowerCase()).filter(Boolean) as string[]));
  
  if (scopes.length > 0) {
    const namedScopes = scopes.slice(0, 3).map((s) => MODULE_DISPLAY_NAMES[s] || s);
    const scopeList = namedScopes.join(", ");
    return `Shipped ${count} update${count > 1 ? "s" : ""} across ${scopeList}, with stability and workflow enhancements.`;
  }

  return `Performance optimizations, workflow refinements, and bug fixes across Workbook ERP.`;
}

function buildEntryForDate(dateStr: string, dateCommits: CommitInfo[]): ChangelogEntry {
  const features: string[] = [];
  const improvements: string[] = [];
  const fixes: string[] = [];

  for (const c of dateCommits) {
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

  return {
    id: `rel-${dateStr}`,
    title,
    description,
    date: dateStr,
    tags: tags.length ? tags : ["Update"],
    highlights: [...features, ...improvements, ...fixes].slice(0, 3),
    sections,
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

  const commits = getCommits(ERP_REPO_PATH);

  if (commits.length === 0) {
    console.log(`[Changelog Bot] No commits found for the specified period.`);
    return;
  }

  // Group commits by commit date (YYYY-MM-DD)
  const groupedByDate: Record<string, CommitInfo[]> = {};
  for (const c of commits) {
    if (!groupedByDate[c.date]) {
      groupedByDate[c.date] = [];
    }
    groupedByDate[c.date].push(c);
  }

  if (FULL_LOOKBACK || ALL_HISTORY) {
    const allEntries: ChangelogEntry[] = [];
    for (const [dateStr, dateCommits] of Object.entries(groupedByDate)) {
      allEntries.push(buildEntryForDate(dateStr, dateCommits));
    }
    allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(allEntries, null, 2), "utf8");
    console.log(`[Changelog Bot] Successfully generated ${allEntries.length} individual release dates with natural language titles in: ${DATA_FILE}`);
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
    console.log(`[Changelog Bot] Successfully updated ${Object.keys(groupedByDate).length} date(s). Total releases now: ${existingData.length}`);
  }
}

run();
