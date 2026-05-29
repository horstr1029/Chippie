import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import TestConfigForm from './TestConfigForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewTestPage({ params }: Props) {
  const { id } = await params
  const session = await requireSession()

  const subject = await prisma.subject.findFirst({
    where: { id, userId: session.user.id },
    include: {
      materials: {
        where: { isActive: true, type: { in: ['PDF', 'IMAGE'] } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!subject) notFound()

  const materialsWithText = subject.materials.filter(m => m.extractedText)

  return <TestConfigForm subject={subject} materials={materialsWithText} />
}
