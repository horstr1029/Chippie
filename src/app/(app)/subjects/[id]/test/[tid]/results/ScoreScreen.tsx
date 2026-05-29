'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
type Subject = { id: string; name: string; color: string; iconEmoji: string; gradeLevel: number; language: string }
type PracticeTest = { id: string; questionsJson: unknown; difficulty: string; totalMarks: number }
type TestAttempt = { id: string; score: number; totalMarks: number; personalBest: boolean; completedAt: Date; timeTakenSeconds: number | null; answersJson: unknown }
import type { Question } from '@/lib/ai'

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const steps = 40
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setValue(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

function getChippieReaction(pct: number) {
  if (pct >= 80) return { emoji: '🎉', msg: 'Outstanding! Chippie is so proud!', color: '#A8FF3E' }
  if (pct >= 60) return { emoji: '😊', msg: 'Good work! Keep it up!', color: '#FFB830' }
  if (pct >= 40) return { emoji: '💪', msg: 'You\'re getting there. Practice makes perfect.', color: '#FFB830' }
  return { emoji: '🤗', msg: 'Every attempt makes you stronger. Try again!', color: '#FF5C5C' }
}

function AnswerReview({
  question,
  answer,
  index,
  color,
}: {
  question: Question
  answer: string
  index: number
  color: string
}) {
  const [showExplanation, setShowExplanation] = useState(false)
  const isObjective = ['multiple_choice', 'true_false'].includes(question.type)
  const isCorrect = isObjective
    ? answer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()
      || answer?.toLowerCase().trim().startsWith(question.correctAnswer?.toLowerCase().trim().charAt(0))
    : null

  const borderColor = isCorrect === true ? '#A8FF3E' : isCorrect === false ? '#FF5C5C' : 'var(--border)'
  const bgColor = isCorrect === true ? '#A8FF3E11' : isCorrect === false ? '#FF5C5C11' : 'var(--surface)'

  return (
    <div className="rounded-2xl border p-5 space-y-3"
      style={{ borderColor, background: bgColor }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${color}22`, color }}>
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{question.question}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isCorrect === true && <span className="text-base">✅</span>}
          {isCorrect === false && <span className="text-base">❌</span>}
          {isCorrect === null && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>Self-mark</span>}
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            ({question.marks}m)
          </span>
        </div>
      </div>

      {answer && (
        <div className="rounded-xl px-3 py-2 text-sm"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
          <span className="font-medium">Your answer: </span>{answer}
        </div>
      )}
      {!answer && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Not answered</p>
      )}

      {(isCorrect === false || !answer) && (
        <div className="rounded-xl px-3 py-2 text-sm"
          style={{ background: '#A8FF3E11', color: '#A8FF3E' }}>
          <span className="font-medium">Correct: </span>{question.correctAnswer}
        </div>
      )}

      <button onClick={() => setShowExplanation(v => !v)}
        className="text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}>
        {showExplanation ? '▲ Hide explanation' : '▼ Show explanation'}
      </button>
      {showExplanation && (
        <div className="rounded-xl px-3 py-2 text-sm leading-relaxed"
          style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>
          {question.modelAnswer}
        </div>
      )}
    </div>
  )
}

export default function ScoreScreen({
  subject,
  test,
  attempt,
  xpEarned,
  newBadges,
}: {
  subject: Subject
  test: PracticeTest
  attempt: TestAttempt
  xpEarned: number
  newBadges: string[]
}) {
  const pct = test.totalMarks > 0 ? Math.round((attempt.score / test.totalMarks) * 100) : 0
  const displayScore = useCountUp(attempt.score)
  const displayPct = useCountUp(pct)
  const reaction = getChippieReaction(pct)

  const questions = (test.questionsJson as unknown as Question[]) ?? []
  const answers = (attempt.answersJson as Record<string, string>) ?? {}

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      {/* ── Score hero ── */}
      <div className="border-b py-10 px-4 text-center"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="text-6xl mb-3">{reaction.emoji}</div>
        <p className="text-lg mb-4" style={{ fontFamily: 'var(--font-caveat)', color: 'var(--text)' }}>
          {reaction.msg}
        </p>

        {/* Score circle */}
        <div className="inline-flex flex-col items-center justify-center rounded-full border-4 w-32 h-32 mx-auto mb-4"
          style={{ borderColor: reaction.color }}>
          <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-mono)', color: reaction.color }}>
            {displayPct}%
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {displayScore}/{test.totalMarks}
          </span>
        </div>

        {attempt.personalBest && (
          <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold mb-3"
            style={{ background: '#FFB83022', color: 'var(--secondary)' }}>
            ⭐ Personal best!
          </div>
        )}

        {/* XP + badges reward */}
        {(xpEarned > 0 || newBadges.length > 0) && (
          <div className="flex flex-col items-center gap-2 mt-3">
            {xpEarned > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold"
                style={{ background: '#A8FF3E22', color: '#A8FF3E' }}>
                +{xpEarned} XP earned
              </div>
            )}
            {newBadges.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {newBadges.map((emoji, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{ background: '#FFB83022', color: '#FFB830' }}>
                    {emoji} New badge!
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {subject.iconEmoji} {subject.name}
          </span>
          {attempt.timeTakenSeconds && (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              · ⏱ {Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s
            </span>
          )}
        </div>
      </div>

      {/* ── Answer review ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-32">
        <h2 className="font-semibold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
          Answer review
        </h2>
        {questions.map((q, i) => (
          <AnswerReview
            key={q.id}
            question={q}
            answer={answers[q.id] ?? ''}
            index={i}
            color={subject.color}
          />
        ))}
      </div>

      {/* ── Actions bar ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t px-4 py-4 flex gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <Link href={`/subjects/${subject.id}`}
          className="flex-1 rounded-2xl py-3 text-center font-semibold border"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
          Back to subject
        </Link>
        <Link href={`/subjects/${subject.id}/test/new`}
          className="flex-1 rounded-2xl py-3 text-center font-bold"
          style={{ background: subject.color, color: '#0F1F1A' }}>
          Try again →
        </Link>
      </div>
    </div>
  )
}
