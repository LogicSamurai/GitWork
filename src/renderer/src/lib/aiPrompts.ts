import { RepoReport, AIProvider } from '../types'

function formatRepoData(repos: RepoReport[], authorName: string, authorEmail: string, since: string, until: string, includeLocal: boolean): string {
  const lines: string[] = []
  lines.push(`DEVELOPER WORK REPORT`)
  lines.push(`=====================`)
  lines.push(`Author: ${authorName} <${authorEmail}>`)
  lines.push(`Period: ${since} to ${until}`)
  lines.push(`Projects: ${repos.length}`)
  lines.push(``)

  for (const repo of repos) {
    if (repo.commits.length === 0 && repo.localChanges.length === 0) continue
    lines.push(`--- PROJECT: ${repo.repoName} ---`)
    lines.push(`Path: ${repo.repoPath}`)
    lines.push(`Branch: ${repo.branches.join(', ')}`)
    lines.push(`Commits: ${repo.commits.length} | Files touched: ${repo.totalFiles.length} | +${repo.totalAdditions} / -${repo.totalDeletions} lines`)
    lines.push(``)

    if (repo.commits.length > 0) {
      lines.push(`COMMITS (newest first):`)
      for (const c of repo.commits) {
        lines.push(`  [${c.date}] ${c.hash} - ${c.message}`)
        if (c.files.length > 0) {
          const topFiles = c.files.slice(0, 5)
          for (const f of topFiles) {
            lines.push(`    ${f.status.toUpperCase()}: ${f.filename} (+${f.additions}/-${f.deletions})`)
          }
          if (c.files.length > 5) lines.push(`    ...and ${c.files.length - 5} more files`)
        }
      }
    }

    if (includeLocal && repo.localChanges.length > 0) {
      lines.push(``)
      lines.push(`UNCOMMITTED LOCAL CHANGES:`)
      for (const lc of repo.localChanges) {
        lines.push(`  [${lc.status.toUpperCase()}] ${lc.filename}`)
      }
    }

    lines.push(``)
  }

  return lines.join('\n')
}

export function buildPrompt(provider: AIProvider, repos: RepoReport[], authorName: string, authorEmail: string, since: string, until: string, includeLocal: boolean): string {
  const data = formatRepoData(repos, authorName, authorEmail, since, until, includeLocal)

  switch (provider) {
    case 'chatgpt':
      return `You are a technical work summarizer. I will give you raw git commit data for a developer's work over a specific period. Your task is to produce a clean, professional work report.

FORMAT REQUIREMENTS:
- Group by project name
- Use bullet points for each project's accomplishments
- Lead each bullet with a strong action verb (Implemented, Fixed, Refactored, Added, Updated, etc.)
- Keep each bullet concise (1 sentence max)
- Add a brief 2-line "Overview" section at the top
- Ignore trivial commits (typos, whitespace, merge commits)
- Highlight any new features vs bug fixes

---RAW GIT DATA---
${data}
---END DATA---

Generate the work report now:`

    case 'claude':
      return `<task>
You are a senior engineering manager. Summarize the following developer work report into a clean, professional summary suitable for a status update or sprint review.
</task>

<instructions>
- Group accomplishments by project
- Use bullet points with strong action verbs (Implemented, Delivered, Resolved, Refactored, Added, Optimized)
- Include an "Overview" paragraph at the top (2-3 sentences)
- Separate "Features/Implementations" from "Bug Fixes" and "Refactoring" if applicable
- Ignore trivial commits (typo fixes, whitespace, merge commits)
- Keep each bullet to 1 concise sentence
- Mention approximate scale where relevant (e.g., "across 12 files", "3 new endpoints")
</instructions>

<work_data>
${data}
</work_data>

Please generate the professional work summary now.`

    case 'gemini':
      return `## Task: Developer Work Report Summary

You're given raw git commit history for a developer. Create a professional, structured work summary.

### Instructions:
- Start with a 2-sentence **Overview** of the work period
- For each project, list bullet points of key accomplishments
- Use action verbs: Implemented, Built, Fixed, Refactored, Added, Optimized, Delivered
- Group related work together (features vs fixes vs improvements)
- Skip trivial commits (formatting, typos, whitespace)
- Be specific about what was built or changed

### Raw Work Data:
\`\`\`
${data}
\`\`\`

### Generate the work summary below:`

    case 'openai-api':
      return JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a technical work summarizer. When given raw git commit data, you produce clean, professional work reports grouped by project with bullet points using strong action verbs. You ignore trivial commits and highlight key implementations, fixes, and improvements.',
          },
          {
            role: 'user',
            content: `Please summarize this developer work report into a professional summary grouped by project with bullet points:\n\n${data}\n\nRequirements:\n- Group by project\n- Use action verbs (Implemented, Fixed, Refactored, Added, etc.)\n- Include overview at top\n- Keep bullets concise\n- Ignore trivial commits`,
          },
        ],
        temperature: 0.3,
      }, null, 2)
  }
}

export const providerInfo = {
  chatgpt: {
    name: 'ChatGPT',
    icon: '🤖',
    color: '#10A37F',
    steps: [
      'Copy the prompt below',
      'Open chat.openai.com',
      'Start a new chat and paste',
      'Press Enter to generate your report',
    ],
    url: 'https://chat.openai.com',
  },
  claude: {
    name: 'Claude',
    icon: '✦',
    color: '#CC785C',
    steps: [
      'Copy the prompt below',
      'Open claude.ai',
      'Start a new conversation and paste',
      'Press Enter to generate your report',
    ],
    url: 'https://claude.ai',
  },
  gemini: {
    name: 'Gemini',
    icon: '✦',
    color: '#4285F4',
    steps: [
      'Copy the prompt below',
      'Open gemini.google.com',
      'Start a new chat and paste',
      'Press Enter to generate your report',
    ],
    url: 'https://gemini.google.com',
  },
  'openai-api': {
    name: 'OpenAI API',
    icon: '⚡',
    color: '#6366F1',
    steps: [
      'Copy the JSON payload below',
      'Use in your API client (Postman, curl, etc.)',
      'POST to https://api.openai.com/v1/chat/completions',
      'Include your Authorization: Bearer <API_KEY> header',
    ],
    url: 'https://platform.openai.com',
  },
}
