'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { generateTest, type Difficulty } from '@/lib/ai'
import { redirect } from 'next/navigation'
type PrismaDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'BOSS'
type Language = 'EN' | 'AF'

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

  const test = await prisma.practiceTest.findFirst({
    where: { id: params.testId, subjectId: params.subjectId },
  })
  if (!test) throw new Error('Test not found')

  const questions = test.questionsJson as any[]
  let score = 0

  for (const q of questions) {
    const answer = params.answers[q.id]
    if (!answer) continue
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const correct = q.correctAnswer?.toLowerCase().trim()
      const given = answer.toLowerCase().trim()
      if (given === correct || given.startsWith(correct.charAt(0))) {
        score += q.marks
      }
    }
    // Open-ended questions are marked 0 by default (self-assessment)
  }

  // Check personal best
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

  redirect(`/subjects/${params.subjectId}/test/${params.testId}/results?attempt=${attempt.id}`)
}
