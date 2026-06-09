import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface ProviderConfig {
  enabled: boolean
  apiKey: string
  model: string
}

interface LocalLLMConfig {
  enabled: boolean
  url: string
  model: string
  apiKey: string
  temperature: number
  maxTokens: number
}

export interface AppSettings {
  activeDirectProvider: 'zai' | 'mistral' | 'groq' | 'local-llm' | null
  directAiEnabled: boolean
  providers: {
    zai: ProviderConfig
    mistral: ProviderConfig
    groq: ProviderConfig
  }
  localLlm: LocalLLMConfig
}

const defaultSettings: AppSettings = {
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

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      ...defaultSettings,
      ...parsed,
      providers: { ...defaultSettings.providers, ...parsed.providers },
      localLlm: { ...defaultSettings.localLlm, ...parsed.localLlm },
    }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(settings: AppSettings): void {
  const p = getSettingsPath()
  const dir = path.dirname(p)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(p, JSON.stringify(settings, null, 2), 'utf-8')
}
