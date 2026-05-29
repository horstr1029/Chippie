import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import ScoreScreen from './ScoreScreen'

interface Props {
  params: Promise<{ id: string; tid: string }>
  searchParams: Promise<{ attempt?: string; xp?: string; badges?: string }>
}

export default async function ResultsPage({ params, searchParams }: Props) {
  const { id, tid } = await params
  const { attempt: attemptId, xp, badges } = await searchParams
  const session = await requireSession()

  if (!attemptId) notFound()

  const [subject, test, attempt] = await Promise.all([
    prisma.subject.findFirst({ where: { id, userId: session.user.id } }),
    prisma.practiceTest.findFirst({ where: { id: tid, subjectId: id } }),
    prisma.testAttempt.findFirst({ where: { id: attemptId, userId: session.user.id } }),
  ])
  if (!subject || !test || !attempt) notFound()

  return (
    <ScoreScreen
      subject={subject}
      test={test}
      attempt={attempt}
      xpEarned={xp ? parseInt(xp, 10) : 0}
      newBadges={badges ? badges.split(',').filter(Boolean) : []}
    />
  )
}
