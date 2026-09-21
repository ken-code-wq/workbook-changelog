#!/usr/bin/env node

/**
 * Workbook Automated JSON Changelog Generator
 * 
 * Monitors the Workbook ERP repository for new commits, translates them into
 * public-friendly updates, and merges them into `data/changelog.json`.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ERP_REPO_PATH = process.env.ERP_REPO_PATH || "/Users/kenneth/workspace/everything_tech/next js/workbook/workbook";
const HOURS_LOOKBACK = parseInt(process.env.HOURS_LOOKBACK || "5", 10);
const DATA_FILE = path.resolve(process.cwd(), "data/changelog.json");

interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
}

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  version?: string;
  tags: string[];
  media?: {
    type: "image" | "video";
    url: string;
    alt?: string;
  };
  highlights: string[];
  sections: {
    heading: string;
    items: string[];
  }[];
}

function getRecentCommits(repoPath: string, hours: number): CommitInfo[] {
  try {
    const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    try {
      execSync("git fetch origin main --quiet", { cwd: repoPath, stdio: "ignore" });
    } catch {
      // Offline / local fallback
    }

    const logOutput = execSync(
      `git log --since="${sinceTime}" --pretty=format:"%H|%an|%ad|%s" --date=iso`,
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

function run() {
  console.log(`[Changelog Bot] Monitoring ERP repo at: ${ERP_REPO_PATH}`);
  console.log(`[Changelog Bot] Checking commits in the last ${HOURS_LOOKBACK} hours...`);

  const commits = getRecentCommits(ERP_REPO_PATH, HOURS_LOOKBACK);

  if (commits.length === 0) {
    console.log(`[Changelog Bot] No new commits found in the last ${HOURS_LOOKBACK} hours.`);
    return;
  }

  const features: string[] = [];
  const improvements: string[] = [];
  const fixes: string[] = [];

  for (const c of commits) {
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

  const dateStr = new Date().toISOString().split("T")[0];
  const tags: string[] = [];
  if (features.length) tags.push("Features");
  if (improvements.length) tags.push("Improvements");
  if (fixes.length) tags.push("Fixes");

  const sections = [];
  if (features.length) sections.push({ heading: "✨ New Features", items: features });
  if (improvements.length) sections.push({ heading: "⚡ Improvements", items: improvements });
  if (fixes.length) sections.push({ heading: "🐛 Bug Fixes", items: fixes });

  const newEntry: ChangelogEntry = {
    id: `rel-${dateStr}`,
    title: `Workbook ERP Update — ${dateStr}`,
    description: `Latest features and system enhancements deployed on ${dateStr}.`,
    date: dateStr,
    tags: tags.length ? tags : ["Update"],
    highlights: [...features, ...improvements, ...fixes].slice(0, 3),
    sections,
  };

  let currentData: ChangelogEntry[] = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
      currentData = [];
    }
  }

  // Update existing date entry or prepend new entry
  const existingIdx = currentData.findIndex((e) => e.date === dateStr);
  if (existingIdx !== -1) {
    currentData[existingIdx] = { ...currentData[existingIdx], ...newEntry };
  } else {
    currentData.unshift(newEntry);
  }

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), "utf8");
  console.log(`[Changelog Bot] Successfully updated JSON data store at: ${DATA_FILE}`);
}

run();
