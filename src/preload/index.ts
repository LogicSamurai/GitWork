import { contextBridge, ipcRenderer } from 'electron'

const api = {
  selectFolder: (): Promise<string[]> => ipcRenderer.invoke('select-folder'),
  scanRepos: (folderPath: string) => ipcRenderer.invoke('scan-repos', folderPath),
  detectAuthor: (): Promise<{ name: string; email: string }> => ipcRenderer.invoke('detect-author'),
  getBranches: (repoPath: string) => ipcRenderer.invoke('get-branches', repoPath),
  generateReport: (params: any) => ipcRenderer.invoke('generate-report', params),
  saveReport: (data: any) => ipcRenderer.invoke('save-report', data),
  getReports: () => ipcRenderer.invoke('get-reports'),
  getReport: (id: number) => ipcRenderer.invoke('get-report', id),
  deleteReport: (id: number) => ipcRenderer.invoke('delete-report', id),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  callAI: (prompt: string) => ipcRenderer.invoke('call-ai', prompt),
  windowMinimize: (): void => { ipcRenderer.send('window-minimize') },
  windowMaximize: (): void => { ipcRenderer.send('window-maximize') },
  windowClose: (): void => { ipcRenderer.send('window-close') },
}

contextBridge.exposeInMainWorld('api', api)
