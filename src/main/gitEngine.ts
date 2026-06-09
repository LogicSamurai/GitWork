import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'

export interface RepoInfo {
  path: string
  name: string
  remoteUrl?: string
  currentBranch?: string
  detectedAuthor?: { name: string; email: string }
}

export interface CommitFile {
  filename: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  additions: number
  deletions: number
}

export interface CommitInfo {
  hash: string
  date: string
  message: string
  author: string
  email: string
  files: CommitFile[]
  additions: number
  deletions: number
}

export interface LocalChange {
  filename: string
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed'
}

export interface RepoReport {
  repoPath: string
  repoName: string
  branch: string       // current HEAD branch (for reference)
  branches: string[]   // branches that were actually queried
  commits: CommitInfo[]
  localChanges: LocalChange[]
  totalAdditions: number
  totalDeletions: number
  totalFiles: Set<string>
}

// Find all git repos in a folder (up to 3 levels deep)
export async function findGitRepos(folderPath: string): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = []

  async function scan(dir: string, depth: number): Promise<void> {
    if (depth > 3) return
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const fullPath = path.join(dir, entry.name)
        if (entry.name === '.git') {
          // parent is a git repo
          const repoPath = dir
          try {
            const git = simpleGit(repoPath)
            const config = await git.listConfig()
            const remoteUrl = config.all['remote.origin.url'] as string | undefined
            const branch = await git.revparse(['--abbrev-ref', 'HEAD']).catch(() => 'unknown')
            const authorName = config.all['user.name'] as string | undefined
            const authorEmail = config.all['user.email'] as string | undefined
            const globalName = authorName
            const globalEmail = authorEmail
            repos.push({
              path: repoPath,
              name: path.basename(repoPath),
              remoteUrl,
              currentBranch: branch,
              detectedAuthor: {
                name: (authorName || globalName || '') as string,
                email: (authorEmail || globalEmail || '') as string,
              },
            })
          } catch {
            repos.push({ path: dir, name: path.basename(dir) })
          }
          return // don't scan inside .git
        }
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          await scan(fullPath, depth + 1)
        }
      }
    } catch { /* ignore permission errors */ }
  }

  // Check if the folder itself is a git repo
  const gitDir = path.join(folderPath, '.git')
  if (fs.existsSync(gitDir)) {
    await scan(folderPath, 0)
    return repos
  }

  await scan(folderPath, 0)
  return repos
}

export async function detectGlobalAuthor(): Promise<{ name: string; email: string }> {
  try {
    const git = simpleGit()
    const config = await git.listConfig()
    // config.all has all merged key-value pairs from all scopes
    return {
      name: (config.all['user.name'] as string) || '',
      email: (config.all['user.email'] as string) || '',
    }
  } catch {
    return { name: '', email: '' }
  }
}

export interface BranchInfo {
  name: string
  current: boolean
  remote: boolean
}

export async function getAllBranches(repoPath: string): Promise<BranchInfo[]> {
  try {
    const git = simpleGit(repoPath)
    const result = await git.branch(['-a'])
    // result.current is the BranchSummary-level current branch name — reliable
    const currentBranch = result.current
    const branches: BranchInfo[] = []
    const seenLocalNames = new Set<string>()

    for (const [key] of Object.entries(result.branches)) {
      if (key.includes('HEAD') || key.includes('->')) continue
      const isRemote = key.startsWith('remotes/')
      const cleanName = isRemote ? key.slice('remotes/'.length) : key

      if (isRemote) {
        // Skip remote if a local branch with same name already exists
        const baseName = cleanName.replace(/^[^/]+\//, '')
        if (seenLocalNames.has(baseName)) continue
      } else {
        seenLocalNames.add(cleanName)
        // Remove any previously-added remote duplicate
        const dupIdx = branches.findIndex(b => b.remote && b.name.replace(/^[^/]+\//, '') === cleanName)
        if (dupIdx !== -1) branches.splice(dupIdx, 1)
      }

      branches.push({
        name: cleanName,
        current: cleanName === currentBranch,
        remote: isRemote,
      })
    }

    branches.sort((a, b) => {
      if (a.current) return -1
      if (b.current) return 1
      if (!a.remote && b.remote) return -1
      if (a.remote && !b.remote) return 1
      return a.name.localeCompare(b.name)
    })
    return branches
  } catch {
    return []
  }
}

export async function getRepoCommits(
  repoPath: string,
  authorEmail: string,
  since: string,
  until: string,
  includeLocal: boolean,
  branches?: string[]
): Promise<RepoReport> {
  const git: SimpleGit = simpleGit(repoPath)
  const repoName = path.basename(repoPath)

  let currentBranch = 'unknown'
  try {
    currentBranch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim()
  } catch { /* ignore */ }

  const commitMap = new Map<string, CommitInfo>()
  const totalFiles = new Set<string>()
  const localChanges: LocalChange[] = []

  try {
    const untilInclusive = until + ' 23:59:59'

    // Helper: parse raw git log output (pretty=COMMIT_START|... + numstat) into CommitInfo[]
    // Regex to detect merge commits by message — catches what --no-merges misses in some edge cases
    const MERGE_COMMIT_RE = /^merge\s+(branch\b|pull\s+request\b|remote[- ]tracking\s+branch\b|remote\s+branch\b|tag\b|.*\binto\b)/i

    function isMergeCommit(message: string): boolean {
      return MERGE_COMMIT_RE.test(message.trim())
    }

    function parseRawLog(rawLog: string): CommitInfo[] {
      const result: CommitInfo[] = []
      if (!rawLog.trim()) return result
      const blocks = rawLog.split('COMMIT_START|').filter(b => b.trim())
      for (const block of blocks) {
        const lines = block.trim().split('\n')
        const header = lines[0].replace(/\r$/, '')
        const parts = header.split('|')
        if (parts.length < 5) continue
        const [hash, date, message, authorName, email] = parts
        const trimmedMsg = message.trim()

        // Skip merge commits (belt-and-suspenders alongside --no-merges)
        if (isMergeCommit(trimmedMsg)) continue

        const files: CommitFile[] = []
        let commitAdditions = 0
        let commitDeletions = 0
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].replace(/\r$/, '').trim()
          if (!line) continue
          const fileParts = line.split('\t')
          if (fileParts.length >= 3) {
            const add = parseInt(fileParts[0]) || 0
            const del = parseInt(fileParts[1]) || 0
            const filename = fileParts[2]
            let status: CommitFile['status'] = 'modified'
            if (add > 0 && del === 0) status = 'added'
            else if (add === 0 && del > 0) status = 'deleted'
            else if (filename.includes('=>')) status = 'renamed'
            files.push({ filename, status, additions: add, deletions: del })
            commitAdditions += add
            commitDeletions += del
          }
        }
        result.push({
          hash: hash.trim().substring(0, 7),
          date: date.substring(0, 10),
          message: trimmedMsg,
          author: authorName.trim(),
          email: email.trim(),
          files,
          additions: commitAdditions,
          deletions: commitDeletions,
        })
      }
      return result
    }

    // Determine which branches to query
    // Run git log per-branch and deduplicate by full hash — this is the most reliable approach
    const branchesToQuery: string[] = (branches && branches.length > 0)
      ? branches
      : [currentBranch]

    const useAll = branchesToQuery.includes('--all')

    if (useAll) {
      const logArgs = [
        '--author', authorEmail,
        '--since', since, '--until', untilInclusive,
        '--pretty=format:COMMIT_START|%H|%ai|%s|%an|%ae',
        '--numstat', '--no-merges', '--all',
      ]
      const rawLog = await git.raw(['log', ...logArgs]).catch(() => '')
      for (const c of parseRawLog(rawLog)) {
        if (!commitMap.has(c.hash)) commitMap.set(c.hash, c)
      }
    } else {
      // Run per-branch to avoid issues with multi-ref git log on Windows
      for (const branchName of branchesToQuery) {
        // For remote branches (origin/xxx), git log accepts them as-is
        // For local branches, pass as-is
        const logArgs = [
          '--author', authorEmail,
          '--since', since, '--until', untilInclusive,
          '--pretty=format:COMMIT_START|%H|%ai|%s|%an|%ae',
          '--numstat', '--no-merges',
          branchName,
        ]
        const rawLog = await git.raw(['log', ...logArgs]).catch(() => '')
        for (const c of parseRawLog(rawLog)) {
          if (!commitMap.has(c.hash)) commitMap.set(c.hash, c)
        }
      }
    }

    // Accumulate totals across all deduplicated commits
    for (const c of commitMap.values()) {
      for (const f of c.files) totalFiles.add(f.filename)
    }

    // Local/uncommitted changes
    if (includeLocal) {
      try {
        const status = await git.status()
        for (const f of status.modified) localChanges.push({ filename: f, status: 'modified' })
        for (const f of status.created) localChanges.push({ filename: f, status: 'added' })
        for (const f of status.deleted) localChanges.push({ filename: f, status: 'deleted' })
        for (const f of status.not_added) localChanges.push({ filename: f, status: 'untracked' })
        for (const f of status.renamed) localChanges.push({ filename: typeof f === 'string' ? f : (f as any).to || f, status: 'renamed' })
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  // Sort commits newest first
  const commits = Array.from(commitMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalAdditions = commits.reduce((s, c) => s + c.additions, 0)
  const totalDeletions = commits.reduce((s, c) => s + c.deletions, 0)

  return {
    repoPath,
    repoName,
    branch: currentBranch,
    branches: (branches && branches.length > 0) ? branches : [currentBranch],
    commits,
    localChanges,
    totalAdditions,
    totalDeletions,
    totalFiles,
  }
}
