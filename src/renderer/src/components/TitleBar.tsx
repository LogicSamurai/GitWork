import React from 'react'
import { GitBranch, Minus, Square, X } from 'lucide-react'

export function TitleBar(): React.ReactElement {
  return (
    <div className="flex items-center justify-between h-10 bg-bg-surface border-b border-border px-4 drag-region flex-shrink-0">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
          <GitBranch size={13} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-text">GitWork Report</span>
        <span className="text-xs text-text-subtle">v1.0</span>
      </div>
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.api.windowMinimize()}
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-border text-text-subtle hover:text-text transition-colors"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => window.api.windowMaximize()}
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-border text-text-subtle hover:text-text transition-colors"
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => window.api.windowClose()}
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-danger text-text-subtle hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

