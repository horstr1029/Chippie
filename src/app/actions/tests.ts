'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { generateTest, type Difficulty, type Question } from '@/lib/ai'
import { checkAndAwardBadges } from '@/lib/badges'
import { redirect } from 'next/navigation'

type PrismaDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'BOSS'
type Language = 'EN' | 'AF'

const XP_BY_DIFFICULTY: Record<PrismaDifficulty, number> = { EASY: 15, MEDIUM: 25, HARD: 40, BOSS: 60 }

export async function createTest(params: {
  subjectId: string
  materialIds: string[]
  difficulty: Difficulty
  questionCount: number
}) {
  const session = await requireSession()

  const subject = await prisma.subject.findFirst({
    where: { id: params.subjectId, userId: session.user.id },
  })
  if (!subject) throw new Error('Subject not found')

  const materials = await prisma.material.findMany({
    where: { id: { in: params.materialIds }, subjectId: params.subjectId, isActive: true },
  })
  if (!materials.length) throw new Error('No materials selected')

  const combinedText = materials
    .filter(m => m.extractedText)
    .map(m => m.extractedText!)
    .join('\n\n---\n\n')

  if (!combinedText.trim()) {
    throw new Error('Selected materials have no extractable text. Please upload a PDF.')
  }

  const generated = await generateTest({
    subjectName: subject.name,
    gradeLevel: subject.gradeLevel,
    language: subject.language === 'AF' ? 'af' : 'en',
    difficulty: params.difficulty,
    questionCount: params.questionCount,
    extractedText: combinedText,
  })

  const test = await prisma.practiceTest.create({
    data: {
      subjectId: params.subjectId,
      materialIds: params.materialIds,
      questionsJson: generated.questions as any,
      language: subject.language as Language,
      difficulty: params.difficulty.toUpperCase() as PrismaDifficulty,
      totalMarks: generated.totalMarks,
      isBossTest: false,
    },
  })

  redirect(`/subjects/${params.subjectId}/test/${test.id}`)
}

export async function submitTest(params: {
  testId: string
  subjectId: string
  answers: Record<string, string>
  timeTakenSeconds: number
}) {
  const session = await requireSession()

  const [test, user] = await Promise.all([
    prisma.practiceTest.findFirst({ where: { id: params.testId, subjectId: params.subjectId } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xpPoints: true, streakDays: true, lastActive: true },
    }),
  ])
  if (!test) throw new Error('Test not found')
  if (!user) throw new Error('User not found')

  const questions = test.questionsJson as unknown as Question[]
  let score = 0
  const wrongTopics: string[] = []

  for (const q of questions) {
    const answer = params.answers[q.id]
    const isObjective = q.type === 'multiple_choice' || q.type === 'true_false'

    if (isObjective) {
      const correct = q.correctAnswer?.toLowerCase().trim()
      const given = answer?.toLowerCase().trim() ?? ''
      if (given && (given === correct || given.startsWith(correct.charAt(0)))) {
        score += q.marks
      } else {
        if (q.topic) wrongTopics.push(q.topic)
      }
    }
  }

  const prevBest = await prisma.testAttempt.findFirst({
    where: { userId: session.user.id, practiceTest: { subjectId: params.subjectId } },
    orderBy: { score: 'desc' },
  })
  const isPersonalBest = !prevBest || score > prevBest.score

  const attempt = await prisma.testAttempt.create({
    data: {
      practiceTestId: params.testId,
      userId: session.user.id,
      answersJson: params.answers,
      score,
      totalMarks: test.totalMarks,
      timeTakenSeconds: params.timeTakenSeconds,
      personalBest: isPersonalBest,
    },
  })

  // ── XP ────────────────────────────────────────────────────────────────────
  const pct = test.totalMarks > 0 ? score / test.totalMarks : 0
  const base = XP_BY_DIFFICULTY[test.difficulty as PrismaDifficulty] ?? 20
  let xpEarned = Math.max(5, Math.round(base * pct))
  if (isPersonalBest) xpEarned += 10

  // ── Streak ────────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10)
  const lastStr = user.lastActive?.toISOString().slice(0, 10)
  const yestStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

  let newStreak = user.streakDays
  if (lastStr !== todayStr) {
    newStreak = lastStr === yestStr ? user.streakDays + 1 : 1
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  const testsCompleted = await prisma.testAttempt.count({ where: { userId: session.user.id } })
  const isPerfect = test.totalMarks > 0 && score === test.totalMarks
  const newBadges = await checkAndAwardBadges(session.user.id, {
    newXp: user.xpPoints + xpEarned,
    newStreak,
    testsCompleted,
    perfectScore: isPerfect,
    bossAttempted: test.difficulty === 'BOSS',
  })

  const badgeXp = newBadges.reduce((sum, b) => sum + b.xpReward, 0)
  const totalXpEarned = xpEarned + badgeXp

  // ── Persist ───────────────────────────────────────────────────────────────
  await prisma.user.update({
    where: { id: session.user.id },
    data: { xpPoints: { increment: totalXpEarned }, streakDays: newStreak, lastActive: new Date() },
  })

  const uniqueTopics = [...new Set(wrongTopics)]
  for (const topic of uniqueTopics) {
    await prisma.weakSpot.upsert({
      where: { userId_subjectId_topic: { userId: session.user.id, subjectId: params.subjectId, topic } },
      update: { timesWrong: { increment: 1 }, lastFlaggedAt: new Date() },
      create: { userId: session.user.id, subjectId: params.subjectId, topic },
    })
  }

  const sp = new URLSearchParams({ attempt: attempt.id, xp: String(totalXpEarned) })
  const badgeEmojis = newBadges.map(b => b.iconEmoji).join(',')
  if (badgeEmojis) sp.set('badges', badgeEmojis)

  redirect(`/subjects/${params.subjectId}/test/${params.testId}/results?${sp}`)
}
