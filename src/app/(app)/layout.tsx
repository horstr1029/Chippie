import { requireSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xpPoints: true, name: true },
  })

  return (
    <div className="flex min-h-dvh">
      <Sidebar name={user?.name ?? session.user.name ?? ''} xp={user?.xpPoints ?? 0} />
      <div className="flex-1 min-w-0 pb-16 lg:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
