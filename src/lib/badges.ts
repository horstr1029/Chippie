import { prisma } from './prisma'

const BADGE_DEFINITIONS = [
  { name: 'First Steps', description: 'Complete your first practice test', iconEmoji: '🐣', xpReward: 10, conditionType: 'tests_completed', conditionValue: 1 },
  { name: 'Test Taker', description: 'Complete 5 practice tests', iconEmoji: '📝', xpReward: 25, conditionType: 'tests_completed', conditionValue: 5 },
  { name: 'Studious', description: 'Complete 10 practice tests', iconEmoji: '📚', xpReward: 50, conditionType: 'tests_completed', conditionValue: 10 },
  { name: 'Scholar', description: 'Complete 25 practice tests', iconEmoji: '🎓', xpReward: 100, conditionType: 'tests_completed', conditionValue: 25 },
  { name: 'On a Roll', description: 'Study 3 days in a row', iconEmoji: '🔥', xpReward: 20, conditionType: 'streak_days', conditionValue: 3 },
  { name: 'Week Warrior', description: 'Study 7 days in a row', iconEmoji: '⚡', xpReward: 50, conditionType: 'streak_days', conditionValue: 7 },
  { name: 'Unstoppable', description: 'Study 30 days in a row', iconEmoji: '🏆', xpReward: 200, conditionType: 'streak_days', conditionValue: 30 },
  { name: 'XP Earner', description: 'Earn 100 XP', iconEmoji: '⭐', xpReward: 0, conditionType: 'xp_reached', conditionValue: 100 },
  { name: 'XP Hunter', description: 'Earn 500 XP', iconEmoji: '💫', xpReward: 0, conditionType: 'xp_reached', conditionValue: 500 },
  { name: 'XP Legend', description: 'Earn 1000 XP', iconEmoji: '🌟', xpReward: 0, conditionType: 'xp_reached', conditionValue: 1000 },
  { name: 'Perfect!', description: 'Score 100% on a practice test', iconEmoji: '💯', xpReward: 30, conditionType: 'perfect_score', conditionValue: 100 },
  { name: 'Boss Fighter', description: 'Attempt a Boss difficulty test', iconEmoji: '👹', xpReward: 20, conditionType: 'boss_attempted', conditionValue: 1 },
]

export interface AwardedBadge {
  name: string
  iconEmoji: string
  xpReward: number
}

export async function checkAndAwardBadges(
  userId: string,
  context: {
    newXp: number
    newStreak: number
    testsCompleted: number
    perfectScore: boolean
    bossAttempted: boolean
  }
): Promise<AwardedBadge[]> {
  await Promise.all(
    BADGE_DEFINITIONS.map(b =>
      prisma.badge.upsert({ where: { name: b.name }, update: {}, create: b })
    )
  )

  const [allBadges, earned] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ])
  const earnedIds = new Set(earned.map(e => e.badgeId))
  const newBadges: AwardedBadge[] = []

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue

    let conditionMet = false
    switch (badge.conditionType) {
      case 'tests_completed': conditionMet = context.testsCompleted >= badge.conditionValue; break
      case 'streak_days': conditionMet = context.newStreak >= badge.conditionValue; break
      case 'xp_reached': conditionMet = context.newXp >= badge.conditionValue; break
      case 'perfect_score': conditionMet = context.perfectScore; break
      case 'boss_attempted': conditionMet = context.bossAttempted; break
    }

    if (conditionMet) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })
      newBadges.push({ name: badge.name, iconEmoji: badge.iconEmoji, xpReward: badge.xpReward })
    }
  }

  return newBadges
}
