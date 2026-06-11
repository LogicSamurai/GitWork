# GitWork Report — Progress Tracker

> Last updated: 2026-06-11

---

## ✅ v1.0 — Completed & Shipped

### Core App
- [x] Electron + React + TypeScript scaffold (electron-vite)
- [x] Custom frameless window with TitleBar (drag region, min/max/close)
- [x] Dark production UI — custom Tailwind theme (`bg-base: #07070F`, `primary: #6366F1`)
- [x] Sidebar navigation (Generate, History, Settings)
- [x] JSON file-based report history (no native DB — avoids rebuild issues)

### Git Engine
- [x] Multi-folder scanning — auto-detect all git repos up to 3 levels deep
- [x] Author auto-detection from global git config
- [x] Date range filtering (`since` / `until` inclusive)
- [x] Multi-branch support — select specific branches per repo
- [x] Per-branch git log with commit deduplication by hash (fixes Windows multi-ref issue)
- [x] Merge commit exclusion — `--no-merges` flag + regex filter for squash/PR merges
- [x] Local changes toggle (uncommitted files included optionally)
- [x] CRLF stripping for Windows git output

### UI Pages
- [x] **GeneratorPage** — folder picker, repo list with checkboxes, branch chip selector per repo, author/date/options, generate button
- [x] **ReportOutputPage** — summary stats, per-repo commit cards, expandable file changes
- [x] **HistoryPage** — saved report list with delete
- [x] **SettingsPage** — provider config cards with API key, model selector, toggle active provider

### AI Export (Copy-Paste)
- [x] ChatGPT — optimised prompt with steps
- [x] Claude — XML-tagged prompt format
- [x] Gemini — Markdown headers format
- [x] OpenAI API — JSON payload format

### Direct AI Integration (API calls from app)
- [x] Z.AI GLM (`open.bigmodel.cn`)
- [x] Mistral AI
- [x] Groq
- [x] Local LLM — configurable URL, model, API key, temperature, max tokens (Ollama-compatible)

### Distribution
- [x] `electron-builder` config — NSIS installer + portable `.exe`
- [x] App icon (256×256 indigo gradient)
- [x] `dist/GitWork Report Setup 1.0.0.exe` — installer
- [x] `dist/GitWork-Report-Portable.exe` — portable single file
- [x] `.gitignore` — excludes `dist/`, `out/`, `node_modules/`
- [x] `README.md` — setup, usage, AI config docs
- [x] Pushed to GitHub: https://github.com/LogicSamurai/GitWork

### Bug Fixes
- [x] `detectGlobalAuthor()` — fixed wrong config key (`config.all` not `config.values`)
- [x] `--until` date exclusivity — appended ` 23:59:59` to include full end date
- [x] `postcss.config.js` — fixed ES module/CommonJS format mismatch
- [x] Branch selection bug — report was always showing current HEAD branch instead of selected branches
- [x] `getAllBranches()` — use `result.current` (BranchSummary level) not per-branch `.current`
- [x] GeneratorPage repo row — now shows selected branch chips instead of static HEAD branch name

---

## 🔵 v1.1 — Planned (Next)

### 1. Keyword / Ticket Grouping
- [ ] `extractTickets(msg)` — detect `feat:`, `fix:`, `JIRA-123`, `#42`, `chore:`, etc.
- [ ] `groupCommitsByCategory(commits)` — group into labelled sections
- [ ] Update `ReportOutputPage` — grouped commit view with collapsible category headers
- [ ] Update `aiPrompts.ts` — use grouped structure in exported prompt (better AI parsing)

### 2. Markdown Copy
- [ ] `reportFormatter.ts` — new lib file: `formatAsMarkdown(repos, meta): string`
- [ ] "Copy as Markdown" button in `ReportOutputPage` header
- [ ] Format: `# Work Report`, `## ProjectName`, `- feat: ...` bullet list

### 3. File Heatmap (Most Changed Files)
- [ ] Extend `gitEngine.ts` — collect `fileChangeCounts: Map<string, number>` per repo
- [ ] Extend `RepoReport` type — add `fileChangeCounts: Record<string, number>`
- [ ] New `FileHeatmap` component — ranked top-10 list with relative bar indicator
- [ ] Show inside each repo card (collapsible section)

### 4. PDF Export
- [ ] `ipcHandlers.ts` — add `export-pdf` handler using `webContents.printToPDF()`
- [ ] `preload/index.ts` — expose `window.api.exportPdf()`
- [ ] "Export PDF" button in `ReportOutputPage` header
- [ ] Optional: print-friendly CSS class for lighter background in PDF

### 5. Period Comparison (vs Previous Period)
- [ ] `gitEngine.ts` — add `getCommitCountOnly()` lightweight function
- [ ] `ipcHandlers.ts` — fetch prev period stats alongside main report
- [ ] `ReportOutputPage` — delta badges on summary stat cards (`↑ +12 vs prev period`)
- [ ] Only show commit count delta (not lines-changed — misleading)

---

## 🟡 v1.2 — Future (P2)

### GitHub / GitLab Remote Integration
- [ ] Settings — PAT token input for GitHub / GitLab
- [ ] `githubService.ts` — fetch PRs/issues for a repo in date range via REST API
- [ ] Map commit SHAs to PR titles (show ⚠ badge when SHA mismatch on squash/rebase)
- [ ] Annotate commits in report with PR title, issue number, status (open/merged/closed)
- [ ] Support both GitHub (`api.github.com`) and GitLab (`gitlab.com/api/v4`)

### Team Reports (Multi-Author)
- [ ] GeneratorPage — allow adding multiple author emails
- [ ] `gitEngine.ts` — loop over author array, merge results into combined report
- [ ] ReportOutputPage — per-author breakdown within each repo card
- [ ] AI export — team summary prompt format

### Contribution Frequency Chart
- [ ] Commits-per-day bar chart for selected period (using a lightweight lib like `recharts`)
- [ ] Per-repo or aggregate toggle
- [ ] **No lines-changed chart** — intentionally excluded (misleading metric)

---

## 🔲 v1.3 — Backlog (P3)

- [ ] Work patterns heatmap — time-of-day / day-of-week commit frequency (GitHub-style grid) — include disclaimer about batch committers
- [ ] Scheduled / recurring reports — weekly/monthly auto-generate via OS task scheduler
- [ ] Between-tags summary — summarize commits between two git tags (v1.2 → v1.3)
- [ ] Multi-repo timeline view — unified chronological commit stream across all repos
- [ ] Commit convention linter (read-only) — surface commits that don't follow Conventional Commits

---

## 🛠 Tech Stack Reference

| Layer | Tech |
|-------|------|
| Desktop shell | Electron 33 |
| Build tool | electron-vite + Vite 5 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 3 (custom dark theme) |
| Git | simple-git |
| Storage | JSON file (`userData/reports.json`) |
| AI calls | Node.js native `https`/`http` (main process) |
| Packaging | electron-builder (NSIS + portable) |

## 📁 Key Files

```
src/main/
  gitEngine.ts      ← git scanning, branch listing, commit extraction
  ipcHandlers.ts    ← all IPC bridge handlers
  aiService.ts      ← direct AI API calls (Z.AI, Mistral, Groq, Local LLM)
  settings.ts       ← settings persistence (userData/settings.json)
  database.ts       ← report history (userData/reports.json)

src/renderer/src/
  pages/GeneratorPage.tsx     ← folder picker, repo/branch selector, generate
  pages/ReportOutputPage.tsx  ← report display, AI export, direct AI summary
  pages/SettingsPage.tsx      ← provider config UI
  pages/HistoryPage.tsx       ← saved reports list
  lib/aiPrompts.ts            ← per-provider prompt templates
  lib/utils.ts                ← helpers: cn(), formatDate(), getCommitCategory()
  types/index.ts              ← all TypeScript interfaces
```
