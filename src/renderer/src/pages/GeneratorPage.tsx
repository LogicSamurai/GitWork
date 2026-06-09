import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderOpen, Search, User, Calendar,
  Plus, X, GitBranch, Loader2, ChevronRight, AlertCircle
} from 'lucide-react'
import { RepoInfo, RepoReport, BranchInfo } from '../types'
import { cn } from '../lib/utils'
import { AppState } from '../App'

interface GeneratorPageProps {
  onReportReady: (report: RepoReport[], meta: AppState['reportMeta']) => void
}

export function GeneratorPage({ onReportReady }: GeneratorPageProps): React.ReactElement {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [scannedRepos, setScannedRepos] = useState<RepoInfo[]>([])
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [since, setSince] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [until, setUntil] = useState(() => new Date().toISOString().slice(0, 10))
  const [includeLocal, setIncludeLocal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchesPerRepo, setBranchesPerRepo] = useState<Record<string, { list: BranchInfo[]; selected: string[] }>>({})
  const [loadingBranches, setLoadingBranches] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.api.detectAuthor().then((author: { name: string; email: string }) => {
      if (author.name) setAuthorName(author.name)
      if (author.email) setAuthorEmail(author.email)
    }).catch(() => {})
  }, [])

  const loadBranchesForRepo = useCallback(async (repoPath: string) => {
    if (branchesPerRepo[repoPath]) return
    setLoadingBranches(prev => new Set(prev).add(repoPath))
    try {
      const branches = await window.api.getBranches(repoPath)
      setBranchesPerRepo(prev => ({
        ...prev,
        [repoPath]: {
          list: branches,
          selected: branches.filter(b => b.current).map(b => b.name),
        }
      }))
    } catch {}
    setLoadingBranches(prev => { const s = new Set(prev); s.delete(repoPath); return s })
  }, [branchesPerRepo])

  const handleAddFolders = useCallback(async () => {
    const paths = await window.api.selectFolder()
    if (!paths?.length) return
    setScanning(true)
    setError(null)
    const newFolders = paths.filter((p: string) => !selectedFolders.includes(p))
    const allFolders = [...selectedFolders, ...newFolders]
    setSelectedFolders(allFolders)
    try {
      const allRepos: RepoInfo[] = []
      for (const folder of newFolders) {
        const repos = await window.api.scanRepos(folder)
        allRepos.push(...repos)
      }
      const combined = [...scannedRepos, ...allRepos]
      const unique = combined.filter((r, i, arr) => arr.findIndex(x => x.path === r.path) === i)
      setScannedRepos(unique)
      // Auto-select all new repos
      const newSet = new Set(selectedRepos)
      allRepos.forEach(r => newSet.add(r.path))
      setSelectedRepos(newSet)
      // Load branches for all new repos
      for (const repo of allRepos) {
        loadBranchesForRepo(repo.path)
      }
      // Auto-detect author from first repo if not set
      if (!authorEmail && allRepos[0]?.detectedAuthor?.email) {
        setAuthorEmail(allRepos[0].detectedAuthor.email)
        setAuthorName(allRepos[0].detectedAuthor.name || authorName)
      }
    } catch (e: any) {
      setError('Failed to scan repositories: ' + e.message)
    } finally {
      setScanning(false)
    }
  }, [selectedFolders, scannedRepos, selectedRepos, authorEmail, authorName])

  const toggleRepo = (path: string): void => {
    const newSet = new Set(selectedRepos)
    if (newSet.has(path)) {
      newSet.delete(path)
    } else {
      newSet.add(path)
      loadBranchesForRepo(path)
    }
    setSelectedRepos(newSet)
  }

  const toggleBranch = (repoPath: string, branchName: string): void => {
    setBranchesPerRepo(prev => {
      const repo = prev[repoPath]
      if (!repo) return prev
      const isSelected = repo.selected.includes(branchName)
      const newSelected = isSelected
        ? repo.selected.filter(b => b !== branchName)
        : [...repo.selected, branchName]
      if (newSelected.length === 0) return prev
      return { ...prev, [repoPath]: { ...repo, selected: newSelected } }
    })
  }

  const selectAllBranches = (repoPath: string): void => {
    setBranchesPerRepo(prev => {
      const repo = prev[repoPath]
      if (!repo) return prev
      return { ...prev, [repoPath]: { ...repo, selected: repo.list.map(b => b.name) } }
    })
  }

  const removeFolder = (folder: string): void => {
    const remaining = selectedFolders.filter(f => f !== folder)
    const remainingRepos = scannedRepos.filter(r => !r.path.startsWith(folder))
    setSelectedFolders(remaining)
    setScannedRepos(remainingRepos)
    const newSet = new Set(selectedRepos)
    scannedRepos.filter(r => r.path.startsWith(folder)).forEach(r => newSet.delete(r.path))
    setSelectedRepos(newSet)
  }

  const handleGenerate = async (): Promise<void> => {
    if (selectedRepos.size === 0 || !authorEmail) return
    setGenerating(true)
    setError(null)
    try {
      const repos = await window.api.generateReport({
        repoPaths: Array.from(selectedRepos),
        authorEmail,
        since,
        until,
        includeLocal,
        branchesPerRepo: Object.fromEntries(
          Object.entries(branchesPerRepo).map(([path, data]) => [path, data.selected])
        ),
      })
      const meta = { authorName, authorEmail, since, until, includeLocal }
      // Save to history
      const repoNames = repos.map((r: RepoReport) => r.repoName).join(', ')
      await window.api.saveReport({
        title: `Report ${since} to ${until}`,
        created_at: new Date().toISOString(),
        date_from: since,
        date_to: until,
        author_name: authorName,
        author_email: authorEmail,
        repos: repoNames,
        report_data: JSON.stringify({ repos, meta }),
      }).catch(() => {})
      onReportReady(repos, meta)
    } catch (e: any) {
      setError('Failed to generate report: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = selectedRepos.size > 0 && authorEmail && since && until

  return (
    <div className="h-full overflow-y-auto bg-bg-base">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-text">Generate Work Report</h1>
          <p className="text-text-muted mt-1 text-sm">Select repositories, set date range and author to generate your report</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Section 1: Repositories */}
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="font-semibold text-text">Select Repositories</h2>
            {scannedRepos.length > 0 && (
              <span className="ml-auto text-xs text-text-subtle bg-border px-2 py-0.5 rounded-full">
                {selectedRepos.size}/{scannedRepos.length} selected
              </span>
            )}
          </div>

          {/* Folder list */}
          {selectedFolders.length > 0 && (
            <div className="space-y-1.5">
              {selectedFolders.map(folder => (
                <div key={folder} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-card border border-border group">
                  <FolderOpen size={14} className="text-warning flex-shrink-0" />
                  <span className="text-xs text-text-muted flex-1 truncate">{folder}</span>
                  <button onClick={() => removeFolder(folder)} className="opacity-0 group-hover:opacity-100 text-text-subtle hover:text-danger transition-all">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddFolders}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-text-subtle hover:text-primary transition-all duration-200 text-sm font-medium disabled:opacity-50"
          >
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {scanning ? 'Scanning for repositories...' : 'Add Folder'}
          </button>

          {/* Repo grid */}
          {scannedRepos.length > 0 && (
            <div className="grid grid-cols-1 gap-1">
              {scannedRepos.map(repo => {
                const isSelected = selectedRepos.has(repo.path)
                return (
                  <div key={repo.path}>
                    <button
                      onClick={() => toggleRepo(repo.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200',
                        isSelected
                          ? 'border-primary/40 bg-primary/8 shadow-glow-sm'
                          : 'border-border bg-bg-card hover:border-border-strong hover:bg-bg-elevated'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                        isSelected ? 'bg-primary border-primary' : 'border-border-strong'
                      )}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <GitBranch size={14} className={isSelected ? 'text-primary' : 'text-text-subtle'} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text truncate">{repo.name}</div>
                        <div className="text-xs text-text-subtle truncate">{repo.path}</div>
                      </div>
                      {repo.currentBranch && (
                        <span className="text-xs bg-border px-2 py-0.5 rounded-full text-text-subtle flex-shrink-0">
                          {repo.currentBranch}
                        </span>
                      )}
                    </button>
                    {/* Branch selector — shown below the repo card when selected */}
                    {isSelected && branchesPerRepo[repo.path] && (
                      <div className="ml-7 mt-1 mb-1 px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-text-subtle">Branches</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); selectAllBranches(repo.path) }}
                            className="text-xs text-primary hover:text-primary-light transition-colors"
                          >
                            Select all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {loadingBranches.has(repo.path) ? (
                            <span className="text-xs text-text-subtle">Loading branches...</span>
                          ) : (
                            branchesPerRepo[repo.path].list.map(branch => {
                              const isBranchSelected = branchesPerRepo[repo.path].selected.includes(branch.name)
                              return (
                                <button
                                  key={branch.name}
                                  onClick={(e) => { e.stopPropagation(); toggleBranch(repo.path, branch.name) }}
                                  className={cn(
                                    'text-xs px-2 py-1 rounded-lg border transition-colors flex items-center gap-1',
                                    isBranchSelected
                                      ? 'bg-primary/15 border-primary/30 text-primary'
                                      : 'bg-bg-card border-border text-text-subtle hover:border-border-strong hover:text-text'
                                  )}
                                >
                                  {branch.current && <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />}
                                  {branch.remote && <span className="text-text-subtle mr-0.5">↑</span>}
                                  <span className="font-mono">{branch.name}</span>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 2: Author */}
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="font-semibold text-text">Author</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-bg-card border border-border text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">Email <span className="text-danger">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle text-xs">@</span>
                <input
                  value={authorEmail}
                  onChange={e => setAuthorEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-bg-card border border-border text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Date Range */}
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">3</span>
            <h2 className="font-semibold text-text">Date Range</h2>
            <div className="ml-auto flex items-center gap-2">
              {['7d','14d','30d','90d'].map(preset => {
                const days = parseInt(preset)
                return (
                  <button
                    key={preset}
                    onClick={() => {
                      const to = new Date()
                      const from = new Date(); from.setDate(from.getDate() - days)
                      setSince(from.toISOString().slice(0,10))
                      setUntil(to.toISOString().slice(0,10))
                    }}
                    className="text-xs px-2 py-1 rounded-lg bg-border hover:bg-border-strong text-text-subtle hover:text-text transition-colors"
                  >
                    {preset}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">From</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                <input
                  type="date"
                  value={since}
                  onChange={e => setSince(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-bg-card border border-border text-sm text-text focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">To</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                <input
                  type="date"
                  value={until}
                  onChange={e => setUntil(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-bg-card border border-border text-sm text-text focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Options */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">4</span>
            <h2 className="font-semibold text-text">Options</h2>
          </div>
          <button
            onClick={() => setIncludeLocal(!includeLocal)}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200',
              includeLocal ? 'border-primary/40 bg-primary/5' : 'border-border bg-bg-card hover:border-border-strong'
            )}
          >
            <div className={cn(
              'w-10 h-6 rounded-full relative transition-all duration-300 flex-shrink-0',
              includeLocal ? 'bg-primary' : 'bg-border-strong'
            )}>
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: includeLocal ? '18px' : '2px' }}
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-text">Include Local Changes</div>
              <div className="text-xs text-text-muted">Include uncommitted &amp; staged files in the report</div>
            </div>
          </button>
        </div>

        {/* Generate Button */}
        <div className="pb-4">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className={cn(
              'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-200',
              canGenerate && !generating
                ? 'bg-gradient-primary text-white hover:opacity-90 shadow-glow'
                : 'bg-bg-card border border-border text-text-subtle cursor-not-allowed'
            )}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing repositories...
              </>
            ) : (
              <>
                <Search size={16} />
                Generate Work Report
                <ChevronRight size={16} />
              </>
            )}
          </button>
          {!canGenerate && !generating && (
            <p className="text-center text-xs text-text-subtle mt-2">
              {!authorEmail ? 'Enter your git email to continue' : 'Select at least one repository to continue'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

