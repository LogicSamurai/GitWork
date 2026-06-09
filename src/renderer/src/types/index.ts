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
  branch: string       // current HEAD branch
  branches: string[]   // branches actually queried
  commits: CommitInfo[]
  localChanges: LocalChange[]
  totalAdditions: number
  totalDeletions: number
  totalFiles: string[]
}

export interface GenerateParams {
  repoPaths: string[]
  authorEmail: string
  authorName: string
  since: string
  until: string
  includeLocal: boolean
}

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

export type AIProvider = 'chatgpt' | 'claude' | 'gemini' | 'openai-api'

export interface BranchInfo {
  name: string
  current: boolean
  remote: boolean
}

export type DirectAIProvider = 'zai' | 'mistral' | 'groq' | 'local-llm'

export interface ProviderConfig {
  enabled: boolean
  apiKey: string
  model: string
}

export interface LocalLLMConfig {
  enabled: boolean
  url: string
  model: string
  apiKey: string
  temperature: number
  maxTokens: number
}

export interface AppSettings {
  activeDirectProvider: DirectAIProvider | null
  directAiEnabled: boolean
  providers: {
    zai: ProviderConfig
    mistral: ProviderConfig
    groq: ProviderConfig
  }
  localLlm: LocalLLMConfig
}

export const DEFAULT_SETTINGS: AppSettings = {
  activeDirectProvider: null,
  directAiEnabled: false,
  providers: {
    zai: { enabled: false, apiKey: '', model: 'glm-4-flash' },
    mistral: { enabled: false, apiKey: '', model: 'mistral-large-latest' },
    groq: { enabled: false, apiKey: '', model: 'llama-3.3-70b-versatile' },
  },
  localLlm: {
    enabled: false,
    url: 'http://localhost:11434/v1/chat/completions',
    model: 'llama3',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2048,
  },
}
