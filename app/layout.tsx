import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'AI Video Editor',
  description: 'Video Editor with AI Assistant',
  icons: {
    icon: '/logoaivideo.png',
    shortcut: '/logoaivideo.png',
    apple: '/logoaivideo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
