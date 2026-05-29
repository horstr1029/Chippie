import { requireSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getGradeBand } from '@/lib/quotes'

export default async function ProfilePage() {
  const session = await requireSession()
  const [user, userBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, grade: true, xpPoints: true, streakDays: true, role: true, createdAt: true },
    }),
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
  ])
  if (!user) return null

  const gradeBand = getGradeBand(user.grade)
  const avatarTier = user.xpPoints >= 1500 ? 4 : user.xpPoints >= 600 ? 3 : user.xpPoints >= 200 ? 2 : 1
  const tierNames = ['', 'Baby Chippie', 'Student Chippie', 'Scholar Chippie', 'Professor Chippie 🎓']

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
            Profile
          </h1>
          <ThemeToggle />
        </div>

        {/* Avatar */}
        <div className="rounded-2xl border p-6 text-center space-y-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="text-6xl">🐒</div>
          <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--primary)' }}>
            {tierNames[avatarTier]}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tier {avatarTier} of 4</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'XP Points', value: user.xpPoints.toLocaleString(), emoji: '⭐' },
            { label: 'Day Streak', value: user.streakDays.toString(), emoji: '🔥' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border p-4 text-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-2xl">{s.emoji}</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--text)' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>
            BADGES {userBadges.length > 0 && `· ${userBadges.length} earned`}
          </h2>
          {userBadges.length === 0 ? (
            <div className="rounded-2xl border p-6 text-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-3xl mb-2">🏅</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Complete tests and build streaks to earn badges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userBadges.map(ub => (
                <div key={ub.id} className="rounded-2xl border p-4 flex items-center gap-3"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <span className="text-2xl">{ub.badge.iconEmoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{ub.badge.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{ub.badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="rounded-2xl border divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {[
            { label: 'Name', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Role', value: user.role.charAt(0) + user.role.slice(1).toLowerCase() },
            user.grade ? { label: 'Grade', value: `${user.grade} (${gradeBand})` } : null,
            { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
