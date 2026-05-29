'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`rounded-xl p-2 transition-colors ${className ?? ''}`}
      style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
