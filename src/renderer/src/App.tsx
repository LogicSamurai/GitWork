import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'
import { GeneratorPage } from './pages/GeneratorPage'
import { HistoryPage } from './pages/HistoryPage'
import { ReportOutputPage } from './pages/ReportOutputPage'
import { SettingsPage } from './pages/SettingsPage'
import { RepoReport } from './types'

export type Page = 'generator' | 'history' | 'report' | 'settings'

export interface AppState {
  currentReport: RepoReport[] | null
  reportMeta: {
    authorName: string
    authorEmail: string
    since: string
    until: string
    includeLocal: boolean
  } | null
}

export default function App(): React.ReactElement {
  const [page, setPage] = useState<Page>('generator')
  const [appState, setAppState] = useState<AppState>({
    currentReport: null,
    reportMeta: null,
  })

  const handleReportReady = (report: RepoReport[], meta: AppState['reportMeta']): void => {
    setAppState({ currentReport: report, reportMeta: meta })
    setPage('report')
  }

  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={page} onNavigate={setPage} />
        <main className="flex-1 overflow-hidden">
          {page === 'generator' && (
            <GeneratorPage onReportReady={handleReportReady} />
          )}
          {page === 'report' && appState.currentReport && appState.reportMeta && (
            <ReportOutputPage
              repos={appState.currentReport}
              meta={appState.reportMeta}
              onBack={() => setPage('generator')}
            />
          )}
          {page === 'history' && (
            <HistoryPage
              onViewReport={(report, meta) => {
                setAppState({ currentReport: report, reportMeta: meta })
                setPage('report')
              }}
            />
          )}
          {page === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  )
}

