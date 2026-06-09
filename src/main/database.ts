import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface SavedReport {
  id: number
  title: string
  created_at: string
  date_from: string
  date_to: string
  author_name: string
  author_email: string
  repos: string
  report_data: string
}

const dbFilePath = path.join(app.getPath('userData'), 'reports.json')

function readDb(): SavedReport[] {
  try {
    if (!fs.existsSync(dbFilePath)) return []
    const raw = fs.readFileSync(dbFilePath, 'utf-8')
    return JSON.parse(raw) as SavedReport[]
  } catch {
    return []
  }
}

function writeDb(reports: SavedReport[]): void {
  const dir = path.dirname(dbFilePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(dbFilePath, JSON.stringify(reports, null, 2), 'utf-8')
}

export function saveReport(report: Omit<SavedReport, 'id'>): number {
  const reports = readDb()
  const maxId = reports.reduce((m, r) => Math.max(m, r.id), 0)
  const newReport: SavedReport = { ...report, id: maxId + 1 }
  reports.unshift(newReport)
  writeDb(reports)
  return newReport.id
}

export function getReports(): SavedReport[] {
  return readDb()
}

export function getReport(id: number): SavedReport | undefined {
  return readDb().find(r => r.id === id)
}

export function deleteReport(id: number): void {
  const reports = readDb().filter(r => r.id !== id)
  writeDb(reports)
}
