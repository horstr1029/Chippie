'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError('Incorrect email or password.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--primary)' }}>
          Chippie 🐒
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Smarter with Chippie
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          Welcome back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: '#FF5C5C22', color: 'var(--highlight)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)', color: '#0F1F1A' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link href="/register" className="font-medium" style={{ color: 'var(--primary)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
