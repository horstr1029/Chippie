'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { signOut } from 'next-auth/react'

interface SubjectCard {
  id: string
  name: string
  color: string
  iconEmoji: string
  gradeLevel: number
  language: string
  examDate: string | null
  testCount: number
  avgScore: number | null
}

interface Props {
  userName: string
  grade: number | null
  gradeBand: 'junior' | 'middle' | 'senior'
  xp: number
  streak: number
  quote: string
  subjects: SubjectCard[]
}

function examCountdown(iso: string | null) {
  if (!iso) return null
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  return days >= 0 ? days : null
}

function scoreColor(pct: number) {
  if (pct >= 80) return '#A8FF3E'
  if (pct >= 60) return '#FFB830'
  return '#FF5C5C'
}

// ── Quote card ────────────────────────────────────────────────────────────────

function QuoteCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border px-6 py-5 col-span-full"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🐒</span>
        <p className="text-lg leading-snug italic"
          style={{ fontFamily: 'var(--font-caveat)', color: 'var(--text)' }}>
          "{text}"
        </p>
      </div>
    </div>
  )
}

// ── Subject card ──────────────────────────────────────────────────────────────

function SubjectCard({ subject, tall }: { subject: SubjectCard; tall?: boolean }) {
  const countdown = examCountdown(subject.examDate)
  const pct = subject.avgScore

  return (
    <Link href={`/subjects/${subject.id}`}
      className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] ${tall ? 'row-span-2' : ''}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', minHeight: tall ? 180 : 'auto' }}>
      {/* Icon + name */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-3xl">{subject.iconEmoji}</span>
          <h3 className="font-bold mt-1 text-base leading-tight"
            style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
            {subject.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Grade {subject.gradeLevel} · {subject.language === 'AF' ? 'Afrikaans' : 'English'}
          </p>
        </div>
        {/* Colour dot */}
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: subject.color }} />
      </div>

      <div className="flex-1" />

      {/* Avg score */}
      {pct !== null ? (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Avg score</span>
            <span className="font-bold font-mono" style={{ color: scoreColor(pct) }}>{pct}%</span>
          </div>
          <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: scoreColor(pct) }} />
          </div>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {subject.testCount === 0 ? 'No tests yet' : `${subject.testCount} test${subject.testCount !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Exam countdown badge */}
      {countdown !== null && (
        <div className="rounded-xl px-2 py-1 text-xs font-semibold self-start"
          style={{
            background: countdown <= 7 ? '#FF5C5C22' : '#FFB83022',
            color: countdown <= 7 ? '#FF5C5C' : '#FFB830',
          }}>
          ⏰ {countdown === 0 ? 'Exam today!' : `${countdown}d to exam`}
        </div>
      )}
    </Link>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-2"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--text)' }}>
          {value}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Add subject card ──────────────────────────────────────────────────────────

function AddSubjectCard() {
  return (
    <Link href="/subjects/new"
      className="rounded-2xl border-2 border-dashed p-5 flex flex-col items-center justify-center gap-2 transition-colors hover:border-[color:var(--primary)]"
      style={{ borderColor: 'var(--border)', minHeight: 120 }}>
      <span className="text-3xl">➕</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Add subject</span>
    </Link>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DashboardClient({ userName, grade, gradeBand, xp, streak, quote, subjects }: Props) {
  const firstName = userName.split(' ')[0]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      {/* ── Mobile header ── */}
      <header className="flex items-center justify-between px-4 py-4 border-b lg:hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--primary)' }}>
          Chippie 🐒
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-xl p-2 text-sm"
            style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
            ↩
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
            Hey {firstName} 👋
          </h2>
          {grade && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Grade {grade} · {gradeBand === 'junior' ? '🌱' : gradeBand === 'middle' ? '📚' : '🎓'} {gradeBand.charAt(0).toUpperCase() + gradeBand.slice(1)}
            </p>
          )}
        </div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* Quote — full width */}
          <QuoteCard text={quote} />

          {/* Subjects */}
          {subjects.length === 0 ? (
            <>
              <div className="col-span-full text-center py-8 space-y-3">
                <span className="text-5xl">🐒</span>
                <p style={{ fontFamily: 'var(--font-caveat)', color: 'var(--text)', fontSize: '1.2rem' }}>
                  Let's set up your first subject!
                </p>
              </div>
              <AddSubjectCard />
            </>
          ) : (
            <>
              {subjects.map((s, i) => (
                <SubjectCard key={s.id} subject={s} tall={i === 0 && subjects.length > 2} />
              ))}
              <AddSubjectCard />
            </>
          )}

          {/* Streak + XP */}
          <StatCard
            emoji="🔥"
            label="Day streak"
            value={streak.toString()}
            sub={streak === 0 ? 'Study today to start a streak!' : streak === 1 ? 'Great start!' : 'Keep it going!'}
          />
          <StatCard
            emoji="⭐"
            label="XP points"
            value={xp.toLocaleString()}
            sub={xp < 200 ? `${200 - xp} XP to Student Chippie` : xp < 600 ? `${600 - xp} XP to Scholar Chippie` : '🎓 Scholar Chippie unlocked!'}
          />
        </div>
      </main>
    </div>
  )
}
