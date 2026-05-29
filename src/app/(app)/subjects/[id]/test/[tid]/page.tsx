import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import TestScreen from './TestScreen'

interface Props {
  params: Promise<{ id: string; tid: string }>
}

export default async function TestPage({ params }: Props) {
  const { id, tid } = await params
  const session = await requireSession()

  const [subject, test] = await Promise.all([
    prisma.subject.findFirst({ where: { id, userId: session.user.id } }),
    prisma.practiceTest.findFirst({ where: { id: tid, subjectId: id } }),
  ])
  if (!subject || !test) notFound()

  return <TestScreen subject={subject} test={test} />
}
