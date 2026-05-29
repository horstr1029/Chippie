'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createTest } from '@/app/actions/tests'
type Subject = { id: string; name: string; color: string; iconEmoji: string; gradeLevel: number; language: string }
type Material = { id: string; type: string; filename: string | null; extractedText: string | null }
import type { Difficulty } from '@/lib/ai'

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; emoji: string }[] = [
  { value: 'easy',   label: 'Easy',   desc: 'Recall & definitions',        emoji: '🟢' },
  { value: 'medium', label: 'Medium', desc: 'Mix of recall & application', emoji: '🟡' },
  { value: 'hard',   label: 'Hard',   desc: 'Analysis & longer answers',   emoji: '🔴' },
]

const QUESTION_COUNTS = [5, 10, 15, 20]

export default function TestConfigForm({
  subject,
  materials,
}: {
  subject: Subject
  materials: Material[]
}) {
  const [isPending, startTransition] = useTransition()
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [count, setCount] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>(materials.map(m => m.id))
  const [error, setError] = useState('')

  function toggleMaterial(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSubmit() {
    if (!selectedIds.length) { setError('Select at least one material.'); return }
    setError('')
    startTransition(async () => {
      try {
        await createTest({
          subjectId: subject.id,
          materialIds: selectedIds,
          difficulty,
          questionCount: count,
        })
      } catch (e: any) {
        setError(e?.message ?? 'Failed to generate test. Try again.')
      }
    })
  }

  if (!materials.length) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-sm space-y-4">
          <span className="text-5xl">📄</span>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
            No materials with text
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Upload a PDF first — Chippie needs something to read to generate questions.
          </p>
          <Link href={`/subjects/${subject.id}/upload`}
            className="inline-block rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            Upload material
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href={`/subjects/${subject.id}`} className="text-sm mb-6 block" style={{ color: 'var(--text-muted)' }}>
          ← Back
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">{subject.iconEmoji}</span>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
              New test
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subject.name}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Difficulty */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map(d => (
                <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                  className="rounded-2xl border-2 p-4 text-left transition-all"
                  style={{
                    borderColor: difficulty === d.value ? subject.color : 'var(--border)',
                    background: difficulty === d.value ? `${subject.color}11` : 'var(--surface)',
                  }}>
                  <div className="text-xl mb-1">{d.emoji}</div>
                  <div className="font-semibold text-sm" style={{ color: difficulty === d.value ? subject.color : 'var(--text)' }}>
                    {d.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Number of questions
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {QUESTION_COUNTS.map(n => (
                <button key={n} type="button" onClick={() => setCount(n)}
                  className="rounded-2xl py-3 font-bold text-lg border-2 transition-all"
                  style={{
                    borderColor: count === n ? subject.color : 'var(--border)',
                    background: count === n ? `${subject.color}11` : 'var(--surface)',
                    color: count === n ? subject.color : 'var(--text)',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Material selection */}
          {materials.length > 1 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Source materials
              </h2>
              <div className="space-y-2">
                {materials.map(m => (
                  <label key={m.id}
                    className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors"
                    style={{
                      borderColor: selectedIds.includes(m.id) ? subject.color : 'var(--border)',
                      background: selectedIds.includes(m.id) ? `${subject.color}0D` : 'var(--surface)',
                    }}>
                    <input type="checkbox" className="sr-only"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleMaterial(m.id)} />
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors"
                      style={{
                        borderColor: selectedIds.includes(m.id) ? subject.color : 'var(--border)',
                        background: selectedIds.includes(m.id) ? subject.color : 'transparent',
                      }}>
                      {selectedIds.includes(m.id) && <span className="text-xs font-bold" style={{ color: '#0F1F1A' }}>✓</span>}
                    </div>
                    <span className="text-sm truncate flex-1" style={{ color: 'var(--text)' }}>
                      {m.type === 'PDF' ? '📄' : '🖼️'} {m.filename ?? 'Document'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ~{Math.round((m.extractedText?.length ?? 0) / 5)} words
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm rounded-xl px-4 py-2" style={{ background: '#FF5C5C22', color: 'var(--highlight)' }}>
              {error}
            </p>
          )}

          {/* Generating state */}
          {isPending && (
            <div className="rounded-2xl border p-6 text-center space-y-3"
              style={{ borderColor: subject.color, background: `${subject.color}0D` }}>
              <div className="text-4xl animate-bounce">🤖</div>
              <p className="font-semibold" style={{ color: subject.color }}>
                Chippie is generating your test…
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Reading your material and writing {count} SA exam-style questions.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !selectedIds.length}
            className="w-full rounded-2xl py-4 font-bold text-lg transition-opacity disabled:opacity-50"
            style={{ background: subject.color, color: '#0F1F1A' }}>
            {isPending ? 'Generating…' : `Generate ${count} questions →`}
          </button>
        </div>
      </div>
    </div>
  )
}
