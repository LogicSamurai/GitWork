import https from 'https'
import http from 'http'
import { AppSettings } from './settings'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  success: boolean
  content?: string
  error?: string
  provider?: string
  model?: string
}

function httpPost(url: string, body: object, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers,
      },
      rejectUnauthorized: false,
    }
    const req = (isHttps ? https : http).request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Request timeout')) })
    req.write(bodyStr)
    req.end()
  })
}

function parseOpenAIResponse(raw: string): string {
  const json = JSON.parse(raw)
  return json.choices?.[0]?.message?.content || json.choices?.[0]?.text || ''
}

function buildMessages(prompt: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a technical work summarizer. When given raw git commit data, produce a clean professional work report grouped by project with bullet points. Use strong action verbs. Ignore trivial commits.',
    },
    { role: 'user', content: prompt },
  ]
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const headers: Record<string, string> = {}
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  const body = { model, messages, temperature, max_tokens: maxTokens, stream: false }
  const raw = await httpPost(url, body, headers)
  return parseOpenAIResponse(raw)
}

export async function callAIProvider(
  settings: AppSettings,
  prompt: string
): Promise<AIResponse> {
  const provider = settings.activeDirectProvider
  if (!provider) return { success: false, error: 'No active provider selected' }
  const messages = buildMessages(prompt)

  try {
    if (provider === 'zai') {
      const cfg = settings.providers.zai
      if (!cfg.apiKey) return { success: false, error: 'Z.AI API key not configured' }
      const content = await callOpenAICompatible(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        cfg.apiKey, cfg.model, messages, 0.7, 2048
      )
      return { success: true, content, provider: 'Z.AI GLM', model: cfg.model }
    }
    if (provider === 'mistral') {
      const cfg = settings.providers.mistral
      if (!cfg.apiKey) return { success: false, error: 'Mistral API key not configured' }
      const content = await callOpenAICompatible(
        'https://api.mistral.ai/v1/chat/completions',
        cfg.apiKey, cfg.model, messages, 0.7, 2048
      )
      return { success: true, content, provider: 'Mistral', model: cfg.model }
    }
    if (provider === 'groq') {
      const cfg = settings.providers.groq
      if (!cfg.apiKey) return { success: false, error: 'Groq API key not configured' }
      const content = await callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        cfg.apiKey, cfg.model, messages, 0.7, 2048
      )
      return { success: true, content, provider: 'Groq', model: cfg.model }
    }
    if (provider === 'local-llm') {
      const cfg = settings.localLlm
      if (!cfg.url) return { success: false, error: 'Local LLM URL not configured' }
      const content = await callOpenAICompatible(
        cfg.url, cfg.apiKey, cfg.model, messages, cfg.temperature, cfg.maxTokens
      )
      return { success: true, content, provider: 'Local LLM', model: cfg.model }
    }
    return { success: false, error: 'Unknown provider' }
  } catch (e: any) {
    return { success: false, error: e.message || 'Unknown error' }
  }
}
