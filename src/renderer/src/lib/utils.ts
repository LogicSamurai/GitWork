import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? 's' : ''}`
}

export function getCommitCategory(message: string): 'feature' | 'fix' | 'refactor' | 'other' {
  const lower = message.toLowerCase()
  if (/^(feat|feature|add|implement|create|new|build)\b/.test(lower)) return 'feature'
  if (/^(fix|bug|hotfix|patch|resolve|repair)\b/.test(lower)) return 'fix'
  if (/^(refactor|clean|improve|optimize|update|upgrade|migrate|move|rename)\b/.test(lower)) return 'refactor'
  return 'other'
}
