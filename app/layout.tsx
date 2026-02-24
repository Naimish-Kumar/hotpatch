import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'HotPatch OTA — Instant App Updates Without the App Store',
  description: 'Push updates to your React Native app instantly. No App Store review, no waiting.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F2744" /><stop offset="100%" stopColor="#1A4A7A" />
            </linearGradient>
            <linearGradient id="lac" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#0099CC" />
            </linearGradient>
            <linearGradient id="lar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" /><stop offset="100%" stopColor="#0077AA" />
            </linearGradient>
          </defs>
        </svg>

        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
