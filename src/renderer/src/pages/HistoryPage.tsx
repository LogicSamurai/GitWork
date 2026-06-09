import React, { useState, useEffect } from 'react'
import { Clock, Trash2, ChevronRight, GitBranch, User } from 'lucide-react'
import { SavedReport, RepoReport } from '../types'
import { formatDate } from '../lib/utils'
import { AppState } from '../App'

interface HistoryPageProps {
  onViewReport: (repos: RepoReport[], meta: NonNullable<AppState['reportMeta']>) => void
}

export function HistoryPage({ onViewReport }: HistoryPageProps): React.ReactElement {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getReports().then((r: SavedReport[]) => {
      setReports(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    await window.api.deleteReport(id)
    setReports(prev => prev.filter(r => r.id !== id))
  }

  const handleView = (report: SavedReport): void => {
    const data = JSON.parse(report.report_data)
    onViewReport(data.repos, data.meta)
  }

  return (
    <div className="h-full overflow-y-auto bg-bg-base">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-text">Report History</h1>
          <p className="text-text-muted mt-1 text-sm">Previously generated work reports</p>
        </div>

        {loading && (
          <div className="text-center py-12 text-text-subtle">Loading history...</div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-16">
            <Clock size={32} className="text-text-subtle mx-auto mb-3 opacity-30" />
            <p className="text-text-subtle">No reports yet</p>
            <p className="text-xs text-text-subtle mt-1">Generate your first report to see it here</p>
          </div>
        )}

        <div className="space-y-3 animate-slide-up">
          {reports.map(report => (
            <button
              key={report.id}
              onClick={() => handleView(report)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-bg-card hover:border-primary/30 hover:bg-bg-elevated transition-all duration-200 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GitBranch size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text">{report.title}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-subtle flex items-center gap-1">
                    <User size={10} /> {report.author_name || report.author_email}
                  </span>
                  <span className="text-xs text-text-subtle">
                    {formatDate(report.date_from)} â€” {formatDate(report.date_to)}
                  </span>
                  {report.repos && (
                    <span className="text-xs text-text-subtle truncate hidden sm:block">
                      {report.repos}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-text-subtle">{formatDate(report.created_at)}</span>
                <button
                  onClick={(e) => handleDelete(report.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger text-text-subtle transition-all"
                >
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={14} className="text-text-subtle" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

