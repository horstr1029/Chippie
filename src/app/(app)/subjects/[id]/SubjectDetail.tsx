'use client'

import { useState } from 'react'
import Link from 'next/link'
type Material = {
  id: string
  type: string
  filename: string | null
  videoUrl: string | null
  extractedText: string | null
  createdAt: Date
}

type PracticeTest = {
  id: string
  difficulty: string
  totalMarks: number
  createdAt: Date
}

type SubjectWithRelations = {
  id: string
  name: string
  color: string
  iconEmoji: string
  language: string
  gradeLevel: number
  examDate: Date | null
  materials: Material[]
  practiceTests: PracticeTest[]
}

const TABS = ['Materials', 'Tests'] as const
type Tab = (typeof TABS)[number]

function formatDate(d: Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function examCountdown(examDate: Date | null) {
  if (!examDate) return null
  const days = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return null
  return days
}

function difficultyLabel(d: string) {
  return { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard', BOSS: 'Boss' }[d] ?? d
}

function MaterialTypeIcon({ type }: { type: string }) {
  return <span>{type === 'PDF' ? '📄' : type === 'IMAGE' ? '🖼️' : '🎥'}</span>
}

export default function SubjectDetail({ subject }: { subject: SubjectWithRelations }) {
  const [tab, setTab] = useState<Tab>('Materials')
  const countdown = examCountdown(subject.examDate)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          {/* Back + title row */}
          <div className="flex items-start gap-3 mb-4">
            <Link href="/dashboard"
              className="mt-1 rounded-lg p-1.5 transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              ←
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{subject.iconEmoji}</span>
                <h1 className="text-xl font-bold truncate"
                  style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
                  {subject.name}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${subject.color}22`, color: subject.color }}>
                  Grade {subject.gradeLevel}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {subject.language === 'AF' ? 'Afrikaans' : 'English'}
                </span>
                {countdown !== null && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: countdown <= 7 ? '#FF5C5C22' : '#FFB83022', color: countdown <= 7 ? 'var(--highlight)' : 'var(--secondary)' }}>
                    ⏰ {countdown}d to exam
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors relative"
                style={{
                  color: tab === t ? subject.color : 'var(--text-muted)',
                  background: tab === t ? `${subject.color}11` : 'transparent',
                }}>
                {t}
                {tab === t && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: subject.color }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {tab === 'Materials' && (
          <MaterialsTab subject={subject} />
        )}
        {tab === 'Tests' && (
          <TestsTab subject={subject} />
        )}
      </main>

      {/* ── Floating action button ── */}
      <div className="fixed bottom-6 right-6 z-30">
        {tab === 'Materials' ? (
          <Link href={`/subjects/${subject.id}/upload`}
            className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            + Upload
          </Link>
        ) : (
          <Link href={`/subjects/${subject.id}/test/new`}
            className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            + New test
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Materials tab ────────────────────────────────────────────────────────────

function MaterialsTab({ subject }: { subject: SubjectWithRelations }) {
  if (!subject.materials.length) {
    return (
      <EmptyState
        emoji="📂"
        title="No materials yet"
        body="Upload a PDF, image, or video link and Chippie will generate tests from it."
        cta="Upload material"
        href={`/subjects/${subject.id}/upload`}
        color={subject.color}
      />
    )
  }

  return (
    <div className="space-y-3">
      {subject.materials.map(m => (
        <div key={m.id} className="flex items-center gap-3 rounded-2xl border p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <span className="text-2xl"><MaterialTypeIcon type={m.type} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
              {m.filename ?? m.videoUrl ?? 'Video'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {formatDate(m.createdAt)}
              {m.extractedText && ` · ${Math.round(m.extractedText.length / 5)} words`}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
            {m.type}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Tests tab ────────────────────────────────────────────────────────────────

function TestsTab({ subject }: { subject: SubjectWithRelations }) {
  if (!subject.practiceTests.length) {
    const hasMaterials = subject.materials.some(m => m.extractedText)
    return (
      <EmptyState
        emoji="📝"
        title="No tests yet"
        body={hasMaterials
          ? 'Generate your first AI-powered practice test from your uploaded materials.'
          : 'Upload a PDF first, then come back to generate a test.'}
        cta={hasMaterials ? 'Generate test' : 'Upload material'}
        href={hasMaterials ? `/subjects/${subject.id}/test/new` : `/subjects/${subject.id}/upload`}
        color={subject.color}
      />
    )
  }

  return (
    <div className="space-y-3">
      {subject.practiceTests.map(t => (
        <Link key={t.id} href={`/subjects/${subject.id}/test/${t.id}`}
          className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-current"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${subject.color}22` }}>
            📝
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium" style={{ color: 'var(--text)' }}>
              {difficultyLabel(t.difficulty)} · {t.totalMarks} marks
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {formatDate(t.createdAt)}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: `${subject.color}22`, color: subject.color }}>
            {difficultyLabel(t.difficulty)}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ── Shared empty state ────────────────────────────────────────────────────────

function EmptyState({ emoji, title, body, cta, href, color }: {
  emoji: string; title: string; body: string; cta: string; href: string; color: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
      <span className="text-5xl">{emoji}</span>
      <div>
        <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>{body}</p>
      </div>
      <Link href={href}
        className="rounded-full px-5 py-2.5 text-sm font-semibold"
        style={{ background: color, color: '#0F1F1A' }}>
        {cta}
      </Link>
    </div>
  )
}
