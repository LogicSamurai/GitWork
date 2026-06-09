/// <reference types="vite/client" />

interface Window {
  api: {
    selectFolder: () => Promise<string[]>
    scanRepos: (folderPath: string) => Promise<import('./types').RepoInfo[]>
    detectAuthor: () => Promise<{ name: string; email: string }>
    getBranches: (repoPath: string) => Promise<import('./types').BranchInfo[]>
    generateReport: (params: {
      repoPaths: string[]
      authorEmail: string
      since: string
      until: string
      includeLocal: boolean
      branchesPerRepo?: Record<string, string[]>
    }) => Promise<import('./types').RepoReport[]>
    saveReport: (data: any) => Promise<number>
    getReports: () => Promise<import('./types').SavedReport[]>
    getReport: (id: number) => Promise<import('./types').SavedReport | undefined>
    deleteReport: (id: number) => Promise<void>
    getSettings: () => Promise<import('./types').AppSettings>
    saveSettings: (settings: import('./types').AppSettings) => Promise<boolean>
    callAI: (prompt: string) => Promise<{ success: boolean; content?: string; error?: string; provider?: string; model?: string }>
    windowMinimize: () => void
    windowMaximize: () => void
    windowClose: () => void
  }
}

