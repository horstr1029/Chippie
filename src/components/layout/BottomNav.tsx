'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/subjects/new', icon: '➕', label: 'New' },
  { href: '/profile', icon: '👤', label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t flex lg:hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {NAV.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 min-h-[56px] transition-colors"
            style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
