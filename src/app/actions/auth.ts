'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

interface RegisterResult {
  error?: string
  success?: boolean
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const role = (formData.get('role') as string) ?? 'LEARNER'
  const grade = formData.get('grade') ? Number(formData.get('grade')) : null

  if (!name || !email || !password) return { error: 'All fields are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (!['LEARNER', 'PARENT', 'TEACHER'].includes(role)) return { error: 'Invalid role.' }
  if (role === 'LEARNER' && (!grade || grade < 1 || grade > 12)) {
    return { error: 'Learners must select a grade (1–12).' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'An account with this email already exists.' }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as Role,
      grade,
    },
  })

  return { success: true }
}
