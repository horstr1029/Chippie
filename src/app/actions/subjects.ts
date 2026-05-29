'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
type Language = 'EN' | 'AF'

export interface CreateSubjectInput {
  name: string
  color: string
  iconEmoji: string
  gradeLevel: number
  language: 'EN' | 'AF'
  examDate?: string | null
}

export async function createSubject(input: CreateSubjectInput) {
  const session = await requireSession()

  const subject = await prisma.subject.create({
    data: {
      userId: session.user.id,
      name: input.name.trim(),
      color: input.color,
      iconEmoji: input.iconEmoji,
      gradeLevel: input.gradeLevel,
      language: input.language as Language,
      examDate: input.examDate ? new Date(input.examDate) : null,
    },
  })

  return { id: subject.id }
}
