import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/app/components/layout/Navbar'
import { Providers } from '@/lib/providers'
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MemeForge - Generate, Remix, and Store Memes On-Chain',
  description: 'Create AI-powered memes with permanent on-chain storage using OG Inference and OG Storage.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}