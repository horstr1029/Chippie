export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}>
      {children}
    </main>
  )
}
