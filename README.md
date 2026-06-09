# GitWork Report

A local desktop app that scans your Git repositories and generates structured work reports — perfect for sharing with AI tools to produce formatted summaries of what you've built.

![Electron](https://img.shields.io/badge/Electron-33-blue) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-blue)

---

## Features

- 📁 **Multi-folder scanning** — select multiple project folders, auto-detects all git repos
- 🌿 **Multi-branch support** — pick specific branches per repo to include in the report
- 👤 **Author filtering** — auto-detects your git identity, filter commits by email
- 📅 **Date range** — set start and end dates for the report period
- 🔀 **Merge commit exclusion** — skips merge/pull commits automatically
- 💾 **Local changes toggle** — optionally include uncommitted file changes
- 🤖 **AI Export** — copy-optimised prompts for ChatGPT, Claude, Gemini, and OpenAI API
- ⚡ **Direct AI integration** — generate summaries directly via Z.AI GLM, Mistral, Groq, or a Local LLM
- 🗂️ **Report history** — save and revisit past reports
- ⚙️ **Settings** — configure API keys, models, temperature, and active provider

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Git](https://git-scm.com/) installed and on your PATH

### Development

```bash
# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev
```

### Build distributable

```bash
# Build NSIS installer + portable .exe (Windows)
npm run build:win

# Output files in dist/
#   GitWork Report Setup 1.0.0.exe   ← installer
#   GitWork-Report-Portable.exe      ← portable, no install needed
```

---

## Usage

1. **Add folders** — click "Add Folder" and select directories containing your projects
2. **Scan** — the app finds all git repos inside those folders
3. **Select branches** — expand each repo to pick which branches to include
4. **Set author & dates** — your git identity is auto-detected; adjust the date range
5. **Generate** — click "Generate Report" to see the work summary
6. **Export to AI** — pick a provider (ChatGPT, Claude, Gemini…), copy the prompt, paste it

---

## Direct AI Integration (Settings)

Configure any of the following providers in **Settings** to generate summaries without leaving the app:

| Provider | Where to get API key |
|----------|---------------------|
| Z.AI GLM | [open.bigmodel.cn](https://open.bigmodel.cn) |
| Mistral | [console.mistral.ai](https://console.mistral.ai) |
| Groq | [console.groq.com](https://console.groq.com) |
| Local LLM | Set your Ollama/OpenAI-compatible URL |

Local LLM config example:
```
URL:   http://localhost:11434/v1/chat/completions
Model: llama3
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Electron 33 |
| Build tool | electron-vite + Vite 5 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 3 (custom dark theme) |
| Git | simple-git |
| Storage | JSON file (no native DB) |
| Packaging | electron-builder (NSIS + portable) |

---

## Project Structure

```
src/
├── main/
│   ├── index.ts          # Electron main process
│   ├── gitEngine.ts      # Git scanning & commit extraction
│   ├── ipcHandlers.ts    # IPC bridge
│   ├── database.ts       # Report history (JSON)
│   ├── settings.ts       # Settings persistence
│   └── aiService.ts      # Direct AI API calls
├── preload/
│   └── index.ts          # contextBridge API
└── renderer/src/
    ├── pages/            # GeneratorPage, ReportOutputPage, HistoryPage, SettingsPage
    ├── components/       # TitleBar, Sidebar
    ├── lib/              # aiPrompts, utils
    └── types/            # TypeScript interfaces
resources/
    icon.ico / icon.png   # App icons
```

---

## License

MIT
