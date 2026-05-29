import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import SubjectDetail from './SubjectDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { id } = await params
  const session = await requireSession()

  const subject = await prisma.subject.findFirst({
    where: { id, userId: session.user.id },
    include: {
      materials: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      practiceTests: { orderBy: { createdAt: 'desc' }, take: 20 },
      flashcards: { orderBy: { createdAt: 'desc' } },
      weakSpots: { where: { userId: session.user.id }, orderBy: { timesWrong: 'desc' } },
    },
  })
  if (!subject) notFound()

  return <SubjectDetail subject={subject} />
}
