import type { Metadata } from 'next'
import { Fredoka, DM_Sans, Caveat, DM_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono' })

export const metadata: Metadata = {
  title: 'Chippie — Smarter with Chippie',
  description: 'Study smarter with AI-powered practice tests for South African learners.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${dmSans.variable} ${caveat.variable} ${dmMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
