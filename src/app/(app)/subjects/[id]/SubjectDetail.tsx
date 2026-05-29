'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createFlashcard, deleteFlashcard } from '@/app/actions/flashcards'

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

type Flashcard = {
  id: string
  frontText: string
  backText: string
  timesSeen: number
  timesCorrect: number
  nextReviewDate: Date | null
}

type WeakSpot = {
  id: string
  topic: string
  timesWrong: number
  lastFlaggedAt: Date
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
  flashcards: Flashcard[]
  weakSpots: WeakSpot[]
}

const TABS = ['Materials', 'Tests', 'Flashcards', 'Weak Spots'] as const
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
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors relative whitespace-nowrap"
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
        {tab === 'Materials' && <MaterialsTab subject={subject} />}
        {tab === 'Tests' && <TestsTab subject={subject} />}
        {tab === 'Flashcards' && <FlashcardsTab subject={subject} />}
        {tab === 'Weak Spots' && <WeakSpotsTab subject={subject} />}
      </main>

      {/* ── FAB ── */}
      <div className="fixed bottom-6 right-6 z-30">
        {tab === 'Materials' && (
          <Link href={`/subjects/${subject.id}/upload`}
            className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            + Upload
          </Link>
        )}
        {tab === 'Tests' && (
          <Link href={`/subjects/${subject.id}/test/new`}
            className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            + New test
          </Link>
        )}
        {tab === 'Flashcards' && subject.flashcards.length > 0 && (
          <Link href={`/subjects/${subject.id}/flashcards/study`}
            className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            ▶ Study now
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Materials tab ─────────────────────────────────────────────────────────────

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

// ── Tests tab ─────────────────────────────────────────────────────────────────

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

// ── Flashcards tab ────────────────────────────────────────────────────────────

function FlashcardsTab({ subject }: { subject: SubjectWithRelations }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!front.trim() || !back.trim()) { setError('Both fields required'); return }
    setError('')
    startTransition(async () => {
      await createFlashcard({ subjectId: subject.id, frontText: front, backText: back })
      setFront('')
      setBack('')
      setShowForm(false)
      router.refresh()
    })
  }

  function handleDelete(cardId: string) {
    startTransition(async () => {
      await deleteFlashcard(cardId, subject.id)
      router.refresh()
    })
  }

  const dueCount = subject.flashcards.filter(c =>
    !c.nextReviewDate || new Date(c.nextReviewDate) <= new Date()
  ).length

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {subject.flashcards.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{subject.flashcards.length} cards</span>
          {dueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full font-semibold text-xs"
              style={{ background: `${subject.color}22`, color: subject.color }}>
              {dueCount} due for review
            </span>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="rounded-2xl border p-4 space-y-3"
          style={{ background: 'var(--surface)', borderColor: subject.color }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>New flashcard</p>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Front (question / term)</label>
            <textarea
              value={front}
              onChange={e => setFront(e.target.value)}
              rows={2}
              placeholder="What is photosynthesis?"
              className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
              style={{ background: 'var(--surface-raised)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Back (answer)</label>
            <textarea
              value={back}
              onChange={e => setBack(e.target.value)}
              rows={3}
              placeholder="The process by which plants use sunlight..."
              className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
              style={{ background: 'var(--surface-raised)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--highlight)' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={isPending}
              className="flex-1 rounded-xl py-2 text-sm font-semibold"
              style={{ background: subject.color, color: '#0F1F1A', opacity: isPending ? 0.6 : 1 }}>
              {isPending ? 'Saving…' : 'Add card'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="px-4 rounded-xl py-2 text-sm"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border-2 border-dashed py-4 text-sm font-medium transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          + Add flashcard
        </button>
      )}

      {/* Card list */}
      {subject.flashcards.length === 0 && !showForm ? (
        <div className="text-center py-12 space-y-2">
          <span className="text-4xl">🃏</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No flashcards yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subject.flashcards.map(card => {
            const isDue = !card.nextReviewDate || new Date(card.nextReviewDate) <= new Date()
            const accuracy = card.timesSeen > 0 ? Math.round((card.timesCorrect / card.timesSeen) * 100) : null
            return (
              <div key={card.id} className="rounded-2xl border p-4 space-y-2"
                style={{ background: 'var(--surface)', borderColor: isDue ? subject.color : 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{card.frontText}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.backText}</p>
                  </div>
                  <button onClick={() => handleDelete(card.id)} disabled={isPending}
                    className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)' }}>
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {accuracy !== null && <span>Accuracy: {accuracy}%</span>}
                  {isDue && <span className="font-semibold" style={{ color: subject.color }}>Due</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Weak spots tab ────────────────────────────────────────────────────────────

function WeakSpotsTab({ subject }: { subject: SubjectWithRelations }) {
  if (!subject.weakSpots.length) {
    return (
      <div className="text-center py-12 space-y-2">
        <span className="text-4xl">💪</span>
        <p className="font-semibold" style={{ color: 'var(--text)' }}>No weak spots yet!</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Complete practice tests and Chippie will track topics you find tricky.
        </p>
      </div>
    )
  }

  const sorted = [...subject.weakSpots].sort((a, b) => b.timesWrong - a.timesWrong)

  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Topics to focus on — ordered by how often you got them wrong.
      </p>
      {sorted.map(ws => (
        <div key={ws.id} className="rounded-2xl border p-4 flex items-center gap-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
            style={{
              background: ws.timesWrong >= 5 ? '#FF5C5C22' : ws.timesWrong >= 3 ? '#FFB83022' : '#A8FF3E22',
              color: ws.timesWrong >= 5 ? '#FF5C5C' : ws.timesWrong >= 3 ? '#FFB830' : '#A8FF3E',
              fontFamily: 'var(--font-dm-mono)',
            }}>
            {ws.timesWrong}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium capitalize truncate" style={{ color: 'var(--text)' }}>{ws.topic}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Wrong {ws.timesWrong}× · Last flagged {formatDate(ws.lastFlaggedAt)}
            </p>
          </div>
        </div>
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
