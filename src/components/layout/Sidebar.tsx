'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { signOut } from 'next-auth/react'

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/subjects/new', icon: '➕', label: 'New Subject' },
  { href: '/profile', icon: '👤', label: 'Profile' },
]

export function Sidebar({ name, xp }: { name: string; xp: number }) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r sticky top-0 h-dvh flex-shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="px-5 py-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--primary)' }}>
          Chippie 🐒
        </h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: active ? 'var(--surface-raised)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
              }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: XP bar + theme + user */}
      <div className="px-4 py-4 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="space-y-1">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>⭐ {xp.toLocaleString()} XP</span>
          </div>
          <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min((xp % 200) / 200 * 100, 100)}%`, background: 'var(--primary)' }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{name}</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => signOut({ callbackUrl: 'https://chippie.unisite.co.za/login' })}
              className="rounded-xl p-2 text-sm transition-colors"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              title="Sign out">
              ↩
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
