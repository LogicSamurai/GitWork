import React, { useState, useEffect } from 'react'
import {
  Save, Eye, EyeOff, CheckCircle,
  Zap, Cpu, Globe, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import { AppSettings } from '../types'
import { cn } from '../lib/utils'

function PasswordInput({
  value, onChange, placeholder
}: { value: string; onChange: (v: string) => void; placeholder?: string }): React.ReactElement {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'API Key'}
        className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-bg-card border border-border text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary/50 transition-colors font-mono"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function ProviderCard({
  id: _id, name, color, icon, description, apiUrl, models, config,
  isActive, onToggleActive, onChange
}: {
  id: string; name: string; color: string; icon: React.ReactNode
  description: string; apiUrl: string; models: string[]
  config: { enabled: boolean; apiKey: string; model: string }
  isActive: boolean; onToggleActive: () => void
  onChange: (cfg: { enabled: boolean; apiKey: string; model: string }) => void
}): React.ReactElement {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      config.enabled ? 'border-primary/30 bg-bg-card' : 'border-border bg-bg-card'
    )}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + '20' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-text">{name}</span>
            {isActive && config.enabled && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20 flex items-center gap-1">
                <CheckCircle size={9} /> Active
              </span>
            )}
          </div>
          <div className="text-xs text-text-subtle mt-0.5">{description}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {config.enabled && (
            <button
              onClick={onToggleActive}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                isActive
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-border border-border-strong text-text-subtle hover:text-text hover:border-primary/30'
              )}
            >
              {isActive ? 'Selected' : 'Use this'}
            </button>
          )}
          <button
            onClick={() => onChange({ ...config, enabled: !config.enabled })}
            className={cn(
              'w-9 h-5 rounded-full relative transition-all duration-300 flex-shrink-0',
              config.enabled ? 'bg-primary' : 'bg-border-strong'
            )}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
              style={{ left: config.enabled ? '18px' : '2px' }}
            />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-text-subtle hover:text-text transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
          <div className="text-xs text-text-subtle flex items-center gap-1.5 py-1">
            <Globe size={11} />
            <span className="font-mono">{apiUrl}</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted">API Key</label>
            <PasswordInput
              value={config.apiKey}
              onChange={v => onChange({ ...config, apiKey: v })}
              placeholder="Enter API key..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted">Model</label>
            <div className="flex gap-2">
              <input
                value={config.model}
                onChange={e => onChange({ ...config, model: e.target.value })}
                placeholder="Model name"
                className="flex-1 px-3 py-2 rounded-xl bg-bg-base border border-border text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary/50 transition-colors font-mono"
              />
              <select
                value={config.model}
                onChange={e => onChange({ ...config, model: e.target.value })}
                className="px-3 py-2 rounded-xl bg-bg-base border border-border text-xs text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [localExpanded, setLocalExpanded] = useState(false)

  useEffect(() => {
    window.api.getSettings().then(s => setSettings(s)).catch(() => {})
  }, [])

  if (!settings) {
    return <div className="h-full bg-bg-base flex items-center justify-center text-text-subtle">Loading settings...</div>
  }

  const handleSave = async (): Promise<void> => {
    await window.api.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setProvider = (id: 'zai' | 'mistral' | 'groq', cfg: AppSettings['providers']['zai']): void => {
    setSettings(s => s ? { ...s, providers: { ...s.providers, [id]: cfg } } : s)
  }

  const providers = [
    {
      id: 'zai' as const,
      name: 'Z.AI (Zhipu GLM)',
      color: '#06B6D4',
      icon: '智',
      description: 'Zhipu AI GLM models — powerful Chinese & English LLMs',
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4/',
      models: ['glm-4-flash', 'glm-4', 'glm-4-plus', 'glm-4-air', 'glm-3-turbo'],
    },
    {
      id: 'mistral' as const,
      name: 'Mistral AI',
      color: '#F97316',
      icon: '🌊',
      description: "Mistral's frontier models — fast, accurate, multilingual",
      apiUrl: 'https://api.mistral.ai/v1/',
      models: ['mistral-large-latest', 'mistral-small-latest', 'open-mistral-7b', 'codestral-latest'],
    },
    {
      id: 'groq' as const,
      name: 'Groq',
      color: '#F59E0B',
      icon: '⚡',
      description: 'Groq LPU — ultra-fast inference, open-source models',
      apiUrl: 'https://api.groq.com/openai/v1/',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    },
  ]

  return (
    <div className="h-full overflow-y-auto bg-bg-base">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-text">Settings</h1>
            <p className="text-text-muted mt-1 text-sm">Configure AI providers for direct summary generation</p>
          </div>
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              saved
                ? 'bg-success/15 border border-success/30 text-success'
                : 'bg-gradient-primary text-white hover:opacity-90 shadow-glow-sm'
            )}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

        {/* Direct AI Mode Toggle */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-primary" />
            <h2 className="font-semibold text-text">Direct AI Integration</h2>
          </div>
          <button
            onClick={() => setSettings(s => s ? { ...s, directAiEnabled: !s.directAiEnabled } : s)}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200',
              settings.directAiEnabled ? 'border-primary/40 bg-primary/5' : 'border-border bg-bg-card'
            )}
          >
            <div className={cn(
              'w-10 h-6 rounded-full relative transition-all duration-300 flex-shrink-0',
              settings.directAiEnabled ? 'bg-primary' : 'bg-border-strong'
            )}>
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: settings.directAiEnabled ? '18px' : '2px' }}
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-text">Enable Direct AI Summary</div>
              <div className="text-xs text-text-muted">Show "Generate with AI" button on report page to get instant AI summary</div>
            </div>
          </button>
        </div>

        {/* Cloud Providers */}
        <div className="animate-slide-up space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={15} className="text-accent" />
            <h2 className="font-semibold text-text">Cloud Providers</h2>
            <span className="text-xs text-text-subtle ml-1">Select one as active for direct generation</span>
          </div>
          {providers.map(p => (
            <ProviderCard
              key={p.id}
              {...p}
              config={settings.providers[p.id]}
              isActive={settings.activeDirectProvider === p.id}
              onToggleActive={() => setSettings(s => s ? {
                ...s,
                activeDirectProvider: s.activeDirectProvider === p.id ? null : p.id
              } : s)}
              onChange={cfg => setProvider(p.id, cfg)}
            />
          ))}
        </div>

        {/* Local LLM */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={15} className="text-success" />
            <h2 className="font-semibold text-text">Local LLM</h2>
            <span className="text-xs text-text-subtle ml-1">Ollama, LM Studio, or any OpenAI-compatible endpoint</span>
          </div>
          <div className={cn(
            'rounded-xl border transition-all duration-200',
            settings.localLlm.enabled ? 'border-success/30 bg-bg-card' : 'border-border bg-bg-card'
          )}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <Cpu size={16} className="text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-text">Local LLM Endpoint</span>
                  {settings.activeDirectProvider === 'local-llm' && settings.localLlm.enabled && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20 flex items-center gap-1">
                      <CheckCircle size={9} /> Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-subtle mt-0.5">OpenAI-compatible: Ollama, LM Studio, vLLM, custom endpoint</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {settings.localLlm.enabled && (
                  <button
                    onClick={() => setSettings(s => s ? {
                      ...s,
                      activeDirectProvider: s.activeDirectProvider === 'local-llm' ? null : 'local-llm'
                    } : s)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                      settings.activeDirectProvider === 'local-llm'
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-border border-border-strong text-text-subtle hover:text-text hover:border-primary/30'
                    )}
                  >
                    {settings.activeDirectProvider === 'local-llm' ? 'Selected' : 'Use this'}
                  </button>
                )}
                <button
                  onClick={() => setSettings(s => s ? { ...s, localLlm: { ...s.localLlm, enabled: !s.localLlm.enabled } } : s)}
                  className={cn(
                    'w-9 h-5 rounded-full relative transition-all duration-300',
                    settings.localLlm.enabled ? 'bg-success' : 'bg-border-strong'
                  )}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
                    style={{ left: settings.localLlm.enabled ? '18px' : '2px' }}
                  />
                </button>
                <button
                  onClick={() => setLocalExpanded(!localExpanded)}
                  className="text-text-subtle hover:text-text transition-colors"
                >
                  {localExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {localExpanded && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Endpoint URL</label>
                  <input
                    value={settings.localLlm.url}
                    onChange={e => setSettings(s => s ? { ...s, localLlm: { ...s.localLlm, url: e.target.value } } : s)}
                    placeholder="http://localhost:11434/v1/chat/completions"
                    className="w-full px-3 py-2.5 rounded-xl bg-bg-base border border-border text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Model Name</label>
                    <input
                      value={settings.localLlm.model}
                      onChange={e => setSettings(s => s ? { ...s, localLlm: { ...s.localLlm, model: e.target.value } } : s)}
                      placeholder="e.g. llama3"
                      className="w-full px-3 py-2 rounded-xl bg-bg-base border border-border text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary/50 transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">API Key (optional)</label>
                    <PasswordInput
                      value={settings.localLlm.apiKey}
                      onChange={v => setSettings(s => s ? { ...s, localLlm: { ...s.localLlm, apiKey: v } } : s)}
                      placeholder="Leave empty if not needed"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Temperature <span className="text-text-subtle">({settings.localLlm.temperature})</span></label>
                    <input
                      type="range" min="0" max="2" step="0.1"
                      value={settings.localLlm.temperature}
                      onChange={e => setSettings(s => s ? { ...s, localLlm: { ...s.localLlm, temperature: parseFloat(e.target.value) } } : s)}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Max Tokens</label>
                    <input
                      type="number" min="256" max="8192" step="256"
                      value={settings.localLlm.maxTokens}
                      onChange={e => setSettings(s => s ? { ...s, localLlm: { ...s.localLlm, maxTokens: parseInt(e.target.value) || 2048 } } : s)}
                      className="w-full px-3 py-2 rounded-xl bg-bg-base border border-border text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-bg-elevated border border-border flex items-start gap-2">
                  <Info size={13} className="text-text-subtle mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-text-subtle">
                    <span className="text-text-muted font-medium">Example configs:</span>{' '}
                    Ollama: <code className="text-primary">http://localhost:11434/v1/chat/completions</code> ·{' '}
                    LM Studio: <code className="text-primary">http://localhost:1234/v1/chat/completions</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
