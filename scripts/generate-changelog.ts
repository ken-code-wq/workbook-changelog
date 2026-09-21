#!/usr/bin/env node

/**
 * Workbook Automated JSON Changelog Generator
 * 
 * Monitors the Workbook ERP repository for commits, translates them into
 * public-friendly updates grouped by commit date (YYYY-MM-DD), and updates `data/changelog.json`.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ERP_REPO_PATH = process.env.ERP_REPO_PATH || "/Users/kenneth/workspace/everything_tech/next js/workbook/workbook";
// Default to full year lookback if FULL_LOOKBACK=true, or if specified by flag
const FULL_LOOKBACK = process.env.FULL_LOOKBACK === "true";
const HOURS_LOOKBACK = parseInt(process.env.HOURS_LOOKBACK || "5", 10);
const DATA_FILE = path.resolve(process.cwd(), "data/changelog.json");

interface CommitInfo {
  hash: string;
  author: string;
  date: string; // YYYY-MM-DD
  message: string;
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
    if (FULL_LOOKBACK) {
      sinceFlag = `--since="2026-01-01T00:00:00Z"`;
    } else {
      const sinceTime = new Date(Date.now() - HOURS_LOOKBACK * 60 * 60 * 1000).toISOString();
      sinceFlag = `--since="${sinceTime}"`;
    }

    const logOutput = execSync(
      `git log ${sinceFlag} --pretty=format:"%H|%an|%ad|%s" --date=short`,
      { cwd: repoPath, encoding: "utf8" }
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

      commits.push({ hash, author, date, message });
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
  return text;
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

  return {
    id: `rel-${dateStr}`,
    title: `Workbook ERP Release — ${dateStr}`,
    description: `Updates, performance enhancements, and bug fixes deployed on ${dateStr}.`,
    date: dateStr,
    tags: tags.length ? tags : ["Update"],
    highlights: [...features, ...improvements, ...fixes].slice(0, 3),
    sections,
  };
}

function run() {
  console.log(`[Changelog Bot] Monitoring ERP repo at: ${ERP_REPO_PATH}`);
  if (FULL_LOOKBACK) {
    console.log(`[Changelog Bot] Performing FULL lookback since beginning of 2026...`);
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

  if (FULL_LOOKBACK) {
    // Rebuild the complete history
    const allEntries: ChangelogEntry[] = [];
    for (const [dateStr, dateCommits] of Object.entries(groupedByDate)) {
      allEntries.push(buildEntryForDate(dateStr, dateCommits));
    }
    allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(allEntries, null, 2), "utf8");
    console.log(`[Changelog Bot] Successfully generated ${allEntries.length} individual release dates in: ${DATA_FILE}`);
  } else {
    // Incremental merge mode: preserve existing dates in file, only update/insert the dates found in this run
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
