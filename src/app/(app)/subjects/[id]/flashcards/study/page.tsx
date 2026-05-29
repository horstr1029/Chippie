import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import StudyClient from './StudyClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlashcardStudyPage({ params }: Props) {
  const { id } = await params
  const session = await requireSession()

  const subject = await prisma.subject.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, color: true },
  })
  if (!subject) notFound()

  const now = new Date()
  const cards = await prisma.flashcard.findMany({
    where: {
      subjectId: id,
      OR: [{ nextReviewDate: null }, { nextReviewDate: { lte: now } }],
    },
    select: { id: true, frontText: true, backText: true },
    orderBy: { nextReviewDate: 'asc' },
  })

  return <StudyClient cards={cards} subjectId={subject.id} color={subject.color} />
}
