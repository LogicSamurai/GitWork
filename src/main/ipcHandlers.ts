import { BrowserWindow, ipcMain, dialog } from 'electron'
import { findGitRepos, getRepoCommits, detectGlobalAuthor, getAllBranches } from './gitEngine'
import { saveReport, getReports, getReport, deleteReport } from './database'
import { loadSettings, saveSettings } from './settings'
import { callAIProvider } from './aiService'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Window controls
  ipcMain.on('window-minimize', () => mainWindow.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window-close', () => mainWindow.close())

  // Folder picker
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'multiSelections'],
      title: 'Select Project Folders',
    })
    return result.filePaths
  })

  // Scan repos in folder
  ipcMain.handle('scan-repos', async (_, folderPath: string) => {
    return await findGitRepos(folderPath)
  })

  // Detect global git author
  ipcMain.handle('detect-author', async () => {
    return await detectGlobalAuthor()
  })

  // Generate report
  ipcMain.handle('generate-report', async (_, params: {
    repoPaths: string[]
    authorEmail: string
    since: string
    until: string
    includeLocal: boolean
    branchesPerRepo?: Record<string, string[]>
  }) => {
    const results = await Promise.all(
      params.repoPaths.map(rp =>
        getRepoCommits(
          rp,
          params.authorEmail,
          params.since,
          params.until,
          params.includeLocal,
          params.branchesPerRepo?.[rp]
        )
      )
    )
    // Convert Sets to arrays for serialization
    return results.map(r => ({ ...r, totalFiles: Array.from(r.totalFiles) }))
  })

  // Save report
  ipcMain.handle('save-report', async (_, data) => {
    return saveReport(data)
  })

  // Get all reports
  ipcMain.handle('get-reports', async () => {
    return getReports()
  })

  // Get single report
  ipcMain.handle('get-report', async (_, id: number) => {
    return getReport(id)
  })

  // Delete report
  ipcMain.handle('delete-report', async (_, id: number) => {
    return deleteReport(id)
  })

  // Get branches for a repo
  ipcMain.handle('get-branches', async (_, repoPath: string) => {
    return await getAllBranches(repoPath)
  })

  // Settings
  ipcMain.handle('get-settings', async () => {
    return loadSettings()
  })

  ipcMain.handle('save-settings', async (_, settings) => {
    saveSettings(settings)
    return true
  })

  // Direct AI call
  ipcMain.handle('call-ai', async (_, prompt: string) => {
    const settings = loadSettings()
    return await callAIProvider(settings, prompt)
  })
}
