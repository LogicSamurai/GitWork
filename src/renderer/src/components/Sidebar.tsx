import React from 'react'
import { GitCommit, History, Settings, Zap } from 'lucide-react'
import { Page } from '../App'
import { cn } from '../lib/utils'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems = [
  { id: 'generator' as Page, label: 'Generate', icon: Zap },
  { id: 'history' as Page, label: 'History', icon: History },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps): React.ReactElement {
  return (
    <aside className="w-16 flex flex-col items-center py-4 bg-bg-surface border-r border-border gap-2 flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
        <GitCommit size={16} className="text-white" />
      </div>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          title={label}
          className={cn(
            'w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-200 group relative',
            currentPage === id
              ? 'bg-primary/15 text-primary shadow-glow-sm'
              : 'text-text-subtle hover:text-text hover:bg-border'
          )}
        >
          <Icon size={18} />
          {currentPage === id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
          )}
        </button>
      ))}
    </aside>
  )
}

