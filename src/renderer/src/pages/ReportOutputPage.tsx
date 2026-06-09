import React, { useState, useMemo } from 'react'
import {
  ArrowLeft, GitCommit, Plus, Minus, FolderGit2,
  Copy, Check, ExternalLink, ChevronDown, ChevronUp, Sparkles,
  FilePlus, FileX, RefreshCw, AlertTriangle, FileText, Loader2, Wand2
} from 'lucide-react'
import { RepoReport, AIProvider, CommitInfo } from '../types'
import { cn, getCommitCategory, formatDate } from '../lib/utils'
import { buildPrompt, providerInfo } from '../lib/aiPrompts'
import { AppState } from '../App'

interface ReportOutputPageProps {
  repos: RepoReport[]
  meta: NonNullable<AppState['reportMeta']>
  onBack: () => void
}

const categoryColors = {
  feature: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  fix: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  refactor: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  other: { bg: 'bg-border', text: 'text-text-muted', dot: 'bg-text-subtle' },
}

function CommitCard({ commit }: { commit: CommitInfo }): React.ReactElement {
  const [expanded, setExpanded] = useState(false)
  const cat = getCommitCategory(commit.message)
  const colors = categoryColors[cat]
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-colors text-left"
      >
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colors.dot)} />
        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0', colors.bg, colors.text)}>
          {cat}
        </span>
        <span className="font-mono text-xs text-text-subtle flex-shrink-0">[{commit.hash}]</span>
        <span className="text-sm text-text flex-1 truncate">{commit.message}</span>
        <span className="text-xs text-text-subtle flex-shrink-0">{commit.date}</span>
        {commit.files.length > 0 && (
          <span className="text-xs text-text-subtle flex-shrink-0">{commit.files.length} files</span>
        )}
        {expanded ? <ChevronUp size={13} className="text-text-subtle flex-shrink-0" /> : <ChevronDown size={13} className="text-text-subtle flex-shrink-0" />}
      </button>
      {expanded && commit.files.length > 0 && (
        <div className="border-t border-border bg-bg-card px-4 py-3 space-y-1.5">
          {commit.files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {f.status === 'added' && <FilePlus size={11} className="text-success flex-shrink-0" />}
              {f.status === 'modified' && <RefreshCw size={11} className="text-warning flex-shrink-0" />}
              {f.status === 'deleted' && <FileX size={11} className="text-danger flex-shrink-0" />}
              {f.status === 'renamed' && <FileText size={11} className="text-primary flex-shrink-0" />}
              <span className="text-text-muted flex-1 truncate font-mono">{f.filename}</span>
              <span className="text-success flex-shrink-0">+{f.additions}</span>
              <span className="text-danger flex-shrink-0">-{f.deletions}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RepoCard({ repo }: { repo: RepoReport }): React.ReactElement {
  const [expanded, setExpanded] = useState(true)
  const hasData = repo.commits.length > 0 || repo.localChanges.length > 0
  return (
    <div className={cn(
      'rounded-xl border transition-colors',
      hasData ? 'border-border bg-bg-card' : 'border-border/50 bg-bg-card/50 opacity-60'
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <FolderGit2 size={18} className="text-primary flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-text">{repo.repoName}</div>
          <div className="text-xs text-text-subtle mt-0.5">{repo.repoPath}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 flex-wrap justify-end max-w-xs">
            {repo.branches.map(b => (
              <span key={b} className="text-xs text-text-subtle bg-border px-2 py-1 rounded-lg whitespace-nowrap">
                {b}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-text-muted">
              <GitCommit size={11} /> {repo.commits.length}
            </span>
            <span className="flex items-center gap-1 text-success">
              <Plus size={11} /> {repo.totalAdditions}
            </span>
            <span className="flex items-center gap-1 text-danger">
              <Minus size={11} /> {repo.totalDeletions}
            </span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-text-subtle" /> : <ChevronDown size={14} className="text-text-subtle" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {!hasData && (
            <div className="flex items-center gap-2 text-sm text-text-subtle py-2">
              <AlertTriangle size={14} />
              No commits found for this author in the selected date range
            </div>
          )}
          {repo.commits.map(c => <CommitCard key={c.hash} commit={c} />)}
          {repo.localChanges.length > 0 && (
            <div className="border border-warning/20 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-warning/5 border-b border-warning/20">
                <AlertTriangle size={13} className="text-warning" />
                <span className="text-xs font-medium text-warning">Uncommitted Local Changes ({repo.localChanges.length})</span>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {repo.localChanges.map((lc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-mono',
                      lc.status === 'added' || lc.status === 'untracked' ? 'bg-success/10 text-success' :
                      lc.status === 'deleted' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                    )}>{lc.status[0].toUpperCase()}</span>
                    <span className="text-text-muted font-mono flex-1 truncate">{lc.filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AIExportPanel({ repos, meta }: { repos: RepoReport[]; meta: NonNullable<AppState['reportMeta']> }): React.ReactElement {
  const [activeProvider, setActiveProvider] = useState<AIProvider>('chatgpt')
  const [copied, setCopied] = useState(false)

  const prompt = useMemo(() =>
    buildPrompt(activeProvider, repos, meta.authorName, meta.authorEmail, meta.since, meta.until, meta.includeLocal),
    [activeProvider, repos, meta]
  )

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const providers: AIProvider[] = ['chatgpt', 'claude', 'gemini', 'openai-api']

  return (
    <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-elevated">
        <Sparkles size={16} className="text-primary" />
        <h3 className="font-semibold text-text">AI Export</h3>
        <span className="text-xs text-text-subtle">Copy optimized prompt for your AI provider</span>
      </div>

      {/* Provider tabs */}
      <div className="flex gap-1 p-2 bg-bg-surface border-b border-border">
        {providers.map(p => {
          const info = providerInfo[p]
          return (
            <button
              key={p}
              onClick={() => setActiveProvider(p)}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                activeProvider === p
                  ? 'bg-bg-card text-text shadow-sm border border-border'
                  : 'text-text-subtle hover:text-text hover:bg-bg-card/50'
              )}
              style={activeProvider === p ? { borderColor: info.color + '40' } : {}}
            >
              <span>{info.name}</span>
            </button>
          )
        })}
      </div>

      {/* Steps */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-4">
          {providerInfo[activeProvider].steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-text-subtle">
              <span className="w-4 h-4 rounded-full bg-border flex items-center justify-center text-[10px] font-bold text-text-subtle flex-shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt preview */}
      <div className="relative">
        <pre className="px-5 py-4 text-xs text-text-muted font-mono overflow-auto max-h-52 whitespace-pre-wrap leading-relaxed bg-bg-base">
          {prompt}
        </pre>
        <div className="absolute top-3 right-3 flex gap-2">
          <a
            href={providerInfo[activeProvider].url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-xs text-text-subtle hover:text-text transition-colors"
          >
            <ExternalLink size={11} />
            Open {providerInfo[activeProvider].name}
          </a>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              copied
                ? 'bg-success/15 border border-success/30 text-success'
                : 'bg-primary/15 border border-primary/30 text-primary hover:bg-primary/20'
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DirectAISummary({ repos, meta }: { repos: RepoReport[]; meta: NonNullable<AppState['reportMeta']> }): React.ReactElement | null {
  const [settings, setSettings] = React.useState<any>(null)
  const [generating, setGenerating] = React.useState(false)
  const [result, setResult] = React.useState<{ content: string; provider: string; model: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    window.api.getSettings().then(s => setSettings(s)).catch(() => {})
  }, [])

  if (!settings?.directAiEnabled || !settings?.activeDirectProvider) return null

  const activeProvider = settings.activeDirectProvider
  const providerName = activeProvider === 'local-llm' ? `Local LLM (${settings.localLlm?.model})` :
    activeProvider === 'zai' ? 'Z.AI GLM' :
    activeProvider === 'mistral' ? 'Mistral AI' : 'Groq'

  const handleGenerate = async (): Promise<void> => {
    setGenerating(true)
    setError(null)
    try {
      const prompt = buildPrompt('chatgpt', repos, meta.authorName, meta.authorEmail, meta.since, meta.until, meta.includeLocal)
      const res = await window.api.callAI(prompt)
      if (res.success && res.content) {
        setResult({ content: res.content, provider: res.provider || '', model: res.model || '' })
      } else {
        setError(res.error || 'Unknown error')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (): Promise<void> => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-elevated">
        <Wand2 size={16} className="text-accent" />
        <h3 className="font-semibold text-text">AI Summary</h3>
        <span className="text-xs text-text-subtle">Direct generation via {providerName}</span>
        <div className="ml-auto">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200',
              generating
                ? 'bg-bg-elevated border border-border text-text-subtle cursor-not-allowed'
                : 'bg-accent/15 border border-accent/30 text-accent hover:bg-accent/20'
            )}
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            {generating ? 'Generating...' : result ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-5 py-3 bg-danger/5 border-b border-danger/20 text-danger text-xs">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {result && (
        <div className="relative">
          <div className="px-5 py-4 text-sm text-text leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
            {result.content}
          </div>
          <div className="absolute top-3 right-3">
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                copied ? 'bg-success/15 border border-success/30 text-success' : 'bg-bg-card border border-border text-text-subtle hover:text-text'
              )}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="px-5 py-2 border-t border-border text-xs text-text-subtle">
            Generated by {result.provider} · {result.model}
          </div>
        </div>
      )}

      {!result && !generating && !error && (
        <div className="px-5 py-8 text-center text-text-subtle text-sm">
          Click "Generate Summary" to get an AI-written work report
        </div>
      )}
    </div>
  )
}

export function ReportOutputPage({ repos, meta, onBack }: ReportOutputPageProps): React.ReactElement {
  const totalCommits = repos.reduce((s, r) => s + r.commits.length, 0)
  const totalAdditions = repos.reduce((s, r) => s + r.totalAdditions, 0)
  const totalDeletions = repos.reduce((s, r) => s + r.totalDeletions, 0)
  const activeRepos = repos.filter(r => r.commits.length > 0 || r.localChanges.length > 0)

  return (
    <div className="h-full overflow-y-auto bg-bg-base">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 animate-fade-in">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-subtle hover:text-text transition-colors mt-1">
            <ArrowLeft size={14} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text">Work Report</h1>
            <p className="text-text-muted text-sm mt-0.5">
              {formatDate(meta.since)} â€” {formatDate(meta.until)} Â· {meta.authorName || meta.authorEmail}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 animate-slide-up">
          {[
            { label: 'Projects', value: activeRepos.length, sub: `of ${repos.length} scanned`, color: 'text-primary' },
            { label: 'Commits', value: totalCommits, sub: 'total commits', color: 'text-accent' },
            { label: 'Lines Added', value: `+${totalAdditions.toLocaleString()}`, sub: 'lines of code', color: 'text-success' },
            { label: 'Lines Removed', value: `-${totalDeletions.toLocaleString()}`, sub: 'lines of code', color: 'text-danger' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-bg-card border border-border px-4 py-4">
              <div className={cn('text-xl font-bold', stat.color)}>{stat.value}</div>
              <div className="text-xs font-medium text-text mt-0.5">{stat.label}</div>
              <div className="text-xs text-text-subtle">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Repo cards */}
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Projects</h2>
          {repos.length === 0 ? (
            <div className="text-center py-12 text-text-subtle">No repositories found</div>
          ) : (
            repos.map(r => <RepoCard key={r.repoPath} repo={r} />)
          )}
        </div>

        {/* Direct AI Summary */}
        <div className="animate-slide-up">
          <DirectAISummary repos={repos} meta={meta} />
        </div>

        {/* AI Export */}
        <div className="animate-slide-up">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Export to AI</h2>
          <AIExportPanel repos={repos} meta={meta} />
        </div>
      </div>
    </div>
  )
}

