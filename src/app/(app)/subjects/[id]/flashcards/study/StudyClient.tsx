'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { recordFlashcardStudy } from '@/app/actions/flashcards'

type Card = {
  id: string
  frontText: string
  backText: string
}

export default function StudyClient({ cards, subjectId, color }: {
  cards: Card[]
  subjectId: string
  color: string
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (cards.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4"
        style={{ background: 'var(--bg)' }}>
        <span className="text-5xl">✅</span>
        <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>All cards reviewed!</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No cards are due right now. Check back tomorrow.</p>
        <Link href={`/subjects/${subjectId}`}
          className="rounded-2xl px-6 py-3 font-semibold"
          style={{ background: color, color: '#0F1F1A' }}>
          Back to subject
        </Link>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((results.correct / results.total) * 100)
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-5 px-4 text-center"
        style={{ background: 'var(--bg)' }}>
        <span className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '🤗'}</span>
        <div>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-mono)', color }}>{pct}%</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {results.correct} / {results.total} correct
          </p>
        </div>
        <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
          {pct >= 80 ? 'Outstanding work!' : pct >= 50 ? 'Good session! Keep it up.' : 'Keep practising — you\'ll get there!'}
        </p>
        <div className="flex gap-3">
          <Link href={`/subjects/${subjectId}`}
            className="rounded-2xl px-5 py-3 font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            Done
          </Link>
          <button onClick={() => { setIndex(0); setFlipped(false); setResults({ correct: 0, total: 0 }); setDone(false) }}
            className="rounded-2xl px-5 py-3 font-semibold"
            style={{ background: color, color: '#0F1F1A' }}>
            Study again
          </button>
        </div>
      </div>
    )
  }

  const card = cards[index]
  const progress = index / cards.length

  function handleAnswer(correct: boolean) {
    startTransition(async () => {
      await recordFlashcardStudy({ cardId: card.id, correct, subjectId })
      const newResults = { correct: results.correct + (correct ? 1 : 0), total: results.total + 1 }
      setResults(newResults)
      if (index + 1 >= cards.length) {
        setDone(true)
      } else {
        setIndex(i => i + 1)
        setFlipped(false)
      }
    })
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <Link href={`/subjects/${subjectId}`} style={{ color: 'var(--text-muted)' }}>←</Link>
        <div className="flex-1">
          <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%`, background: color }} />
          </div>
        </div>
        <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
          {index + 1}/{cards.length}
        </span>
      </header>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        {/* Flip card */}
        <div
          onClick={() => !flipped && setFlipped(true)}
          className="w-full max-w-md rounded-3xl border p-8 min-h-52 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:scale-[1.01]"
          style={{
            background: flipped ? `${color}11` : 'var(--surface)',
            borderColor: flipped ? color : 'var(--border)',
          }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: flipped ? color : 'var(--text-muted)' }}>
            {flipped ? 'Answer' : 'Question — tap to reveal'}
          </p>
          <p className="text-lg leading-relaxed"
            style={{ color: 'var(--text)', fontFamily: flipped ? undefined : 'var(--font-fredoka)' }}>
            {flipped ? card.backText : card.frontText}
          </p>
        </div>

        {/* Answer buttons — only after flip */}
        {flipped ? (
          <div className="flex gap-3 w-full max-w-md">
            <button onClick={() => handleAnswer(false)} disabled={isPending}
              className="flex-1 rounded-2xl py-4 font-semibold text-sm"
              style={{ background: '#FF5C5C22', color: '#FF5C5C' }}>
              ✕ Not yet
            </button>
            <button onClick={() => handleAnswer(true)} disabled={isPending}
              className="flex-1 rounded-2xl py-4 font-semibold text-sm"
              style={{ background: '#A8FF3E22', color: '#A8FF3E' }}>
              ✓ Got it
            </button>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tap the card to see the answer
          </p>
        )}
      </div>
    </div>
  )
}
