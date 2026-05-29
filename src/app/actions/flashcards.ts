'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function createFlashcard(params: {
  subjectId: string
  frontText: string
  backText: string
}) {
  const session = await requireSession()

  const subject = await prisma.subject.findFirst({
    where: { id: params.subjectId, userId: session.user.id },
  })
  if (!subject) throw new Error('Subject not found')

  await prisma.flashcard.create({
    data: {
      subjectId: params.subjectId,
      frontText: params.frontText.trim(),
      backText: params.backText.trim(),
    },
  })

  revalidatePath(`/subjects/${params.subjectId}`)
}

export async function deleteFlashcard(cardId: string, subjectId: string) {
  const session = await requireSession()

  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, subject: { userId: session.user.id } },
  })
  if (!card) throw new Error('Flashcard not found')

  await prisma.flashcard.delete({ where: { id: cardId } })
  revalidatePath(`/subjects/${subjectId}`)
}

export async function recordFlashcardStudy(params: {
  cardId: string
  correct: boolean
  subjectId: string
}) {
  const session = await requireSession()

  const card = await prisma.flashcard.findFirst({
    where: { id: params.cardId, subject: { userId: session.user.id } },
  })
  if (!card) throw new Error('Flashcard not found')

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + (params.correct ? 3 : 1))

  await prisma.flashcard.update({
    where: { id: params.cardId },
    data: {
      timesSeen: { increment: 1 },
      timesCorrect: params.correct ? { increment: 1 } : undefined,
      nextReviewDate: nextReview,
    },
  })
}
