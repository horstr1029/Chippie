import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { getDailyQuote, getGradeBand } from '@/lib/quotes'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await requireSession()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { grade: true, xpPoints: true, streakDays: true, name: true },
  })

  const subjects = await prisma.subject.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { practiceTests: true } },
    },
  })

  // Per-subject average score
  const subjectIds = subjects.map((s: { id: string }) => s.id)
  const attempts = await prisma.testAttempt.findMany({
    where: {
      userId: session.user.id,
      practiceTest: { subjectId: { in: subjectIds } },
    },
    select: { score: true, totalMarks: true, practiceTest: { select: { subjectId: true } } },
  })

  const avgBySubject: Record<string, number> = {}
  for (const subjectId of subjectIds) {
    const subAttempts = attempts.filter(a => a.practiceTest.subjectId === subjectId)
    if (subAttempts.length) {
      const totalScore = subAttempts.reduce((s, a) => s + a.score, 0)
      const totalMarks = subAttempts.reduce((s, a) => s + a.totalMarks, 0)
      avgBySubject[subjectId] = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
    }
  }

  // Detect dominant language from subjects
  const afCount = subjects.filter(s => s.language === 'AF').length
  const lang = afCount > subjects.length / 2 ? 'af' : 'en'

  const quote = getDailyQuote(user?.grade ?? null, lang as 'en' | 'af')
  const gradeBand = getGradeBand(user?.grade ?? null)

  return (
    <DashboardClient
      userName={user?.name ?? session.user.name ?? ''}
      grade={user?.grade ?? null}
      gradeBand={gradeBand}
      xp={user?.xpPoints ?? 0}
      streak={user?.streakDays ?? 0}
      quote={quote.text}
      subjects={subjects.map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        iconEmoji: s.iconEmoji,
        gradeLevel: s.gradeLevel,
        language: s.language,
        examDate: s.examDate?.toISOString() ?? null,
        testCount: s._count.practiceTests,
        avgScore: avgBySubject[s.id] ?? null,
      }))}
    />
  )
}
