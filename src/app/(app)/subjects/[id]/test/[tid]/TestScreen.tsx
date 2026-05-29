'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import type { Subject, PracticeTest } from '@prisma/client'
import type { Question } from '@/lib/ai'
import { submitTest } from '@/app/actions/tests'

// ── Pre-test pep talk screen ─────────────────────────────────────────────────

const PEP_TALKS = [
  'Breathe. You studied this. Chippie saw you. 🐒',
  'This is just practice. No pressure. Just your best.',
  'Read every question carefully. Take your time. You\'ve got this.',
  'Mistakes are just lessons in disguise. Let\'s collect some wisdom.',
  'The exam doesn\'t define you — but this practice makes you ready.',
]

function PepTalkScreen({ subject, onStart }: { subject: Subject; onStart: () => void }) {
  const quote = PEP_TALKS[Math.floor(Math.random() * PEP_TALKS.length)]
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 text-center gap-8"
      style={{ background: 'var(--bg)' }}>
      <div className="text-8xl animate-bounce">🐒</div>
      <p className="text-2xl max-w-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-caveat)', color: 'var(--text)' }}>
        "{quote}"
      </p>
      <button onClick={onStart}
        className="rounded-full px-10 py-4 text-lg font-bold transition-transform hover:scale-105"
        style={{ background: subject.color, color: '#0F1F1A' }}>
        Let's go! 🚀
      </button>
      <button onClick={onStart} className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Skip
      </button>
    </div>
  )
}

// ── Exit confirmation modal ───────────────────────────────────────────────────

function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: '#00000080' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm text-center space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Leave this test?</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Your answers won't be saved.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            Stay
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 font-semibold"
            style={{ background: 'var(--highlight)', color: '#fff' }}>
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question component ────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  answer,
  onChange,
  color,
}: {
  question: Question
  index: number
  answer: string
  onChange: (v: string) => void
  color: string
}) {
  const isTextAnswer = !['multiple_choice', 'true_false'].includes(question.type)

  return (
    <div className="rounded-2xl border p-5 space-y-4"
      style={{ background: 'var(--surface)', borderColor: answer ? `${color}66` : 'var(--border)' }}>
      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${color}22`, color }}>
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {question.question}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full flex-shrink-0 font-mono"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
          ({question.marks} {question.marks === 1 ? 'mark' : 'marks'})
        </span>
      </div>

      {/* MCQ options */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map(opt => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className="w-full text-left rounded-xl border px-4 py-3 text-sm transition-all"
              style={{
                borderColor: answer === opt ? color : 'var(--border)',
                background: answer === opt ? `${color}11` : 'var(--surface-raised)',
                color: answer === opt ? color : 'var(--text)',
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* True / False */}
      {question.type === 'true_false' && (
        <div className="grid grid-cols-2 gap-3">
          {['True', 'False'].map(opt => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className="rounded-xl border-2 py-3 font-semibold transition-all"
              style={{
                borderColor: answer === opt ? color : 'var(--border)',
                background: answer === opt ? `${color}11` : 'var(--surface-raised)',
                color: answer === opt ? color : 'var(--text)',
              }}>
              {opt === 'True' ? '✅ True' : '❌ False'}
            </button>
          ))}
        </div>
      )}

      {/* Text answer (define, explain, etc.) */}
      {isTextAnswer && (
        <textarea
          value={answer}
          onChange={e => onChange(e.target.value)}
          rows={3}
          placeholder="Write your answer here…"
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: 'var(--surface-raised)',
            borderColor: answer ? `${color}66` : 'var(--border)',
            color: 'var(--text)',
          }}
        />
      )}
    </div>
  )
}

// ── Main test screen ──────────────────────────────────────────────────────────

export default function TestScreen({ subject, test }: { subject: Subject; test: PracticeTest }) {
  const [phase, setPhase] = useState<'pep' | 'test'>('pep')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showExit, setShowExit] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number>(0)

  const questions = (test.questionsJson as unknown as Question[]) ?? []
  const answered = Object.keys(answers).filter(k => answers[k]?.trim()).length

  // Timer
  useEffect(() => {
    if (phase !== 'test') return
    startRef.current = Date.now()
    if (!timerEnabled) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, timerEnabled])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function handleSubmit() {
    const timeTaken = Math.floor((Date.now() - startRef.current) / 1000)
    setError('')
    startTransition(async () => {
      try {
        await submitTest({
          testId: test.id,
          subjectId: subject.id,
          answers,
          timeTakenSeconds: timeTaken,
        })
      } catch (e: any) {
        setError(e?.message ?? 'Failed to submit. Try again.')
      }
    })
  }

  if (phase === 'pep') {
    return <PepTalkScreen subject={subject} onStart={() => setPhase('test')} />
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ── HUD ── */}
      <header className="sticky top-0 z-20 border-b px-4 py-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Progress bar */}
          <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%`, background: subject.color }} />
          </div>
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {answered}/{questions.length}
          </span>
          {/* Timer toggle */}
          <button onClick={() => setTimerEnabled(t => !t)}
            className="text-xs px-2 py-1 rounded-lg flex-shrink-0 font-mono transition-colors"
            style={{
              background: timerEnabled ? `${subject.color}22` : 'var(--surface-raised)',
              color: timerEnabled ? subject.color : 'var(--text-muted)',
            }}>
            {timerEnabled ? formatTime(elapsed) : '⏱'}
          </button>
          {/* Exit */}
          <button onClick={() => setShowExit(true)}
            className="text-lg flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)' }}>
            ✕
          </button>
        </div>
      </header>

      {/* ── Test header ── */}
      <div className="max-w-2xl mx-auto w-full px-4 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{subject.iconEmoji}</span>
            <span className="font-semibold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
              {subject.name}
            </span>
          </div>
          <span className="text-sm font-mono font-bold px-3 py-1 rounded-full"
            style={{ background: `${subject.color}22`, color: subject.color }}>
            Total: {test.totalMarks} marks
          </span>
        </div>
      </div>

      {/* ── Questions ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4 pb-32">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            answer={answers[q.id] ?? ''}
            onChange={v => setAnswer(q.id, v)}
            color={subject.color}
          />
        ))}
      </main>

      {/* ── Submit bar ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t px-4 py-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto space-y-2">
          {answered < questions.length && (
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {questions.length - answered} question{questions.length - answered !== 1 ? 's' : ''} unanswered — you can still submit
            </p>
          )}
          {error && (
            <p className="text-xs text-center" style={{ color: 'var(--highlight)' }}>{error}</p>
          )}
          <button onClick={handleSubmit} disabled={isPending}
            className="w-full rounded-2xl py-4 font-bold text-lg transition-opacity disabled:opacity-60"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            {isPending ? 'Submitting…' : 'Submit test →'}
          </button>
        </div>
      </div>

      {showExit && (
        <ExitModal
          onConfirm={() => window.history.back()}
          onCancel={() => setShowExit(false)}
        />
      )}
    </div>
  )
}
