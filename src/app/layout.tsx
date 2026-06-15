import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NEON BLACKJACK ⚡ PVP',
  description: 'Real-time PVP Blackjack with neon aesthetics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-grid min-h-screen">
        {children}
      </body>
    </html>
  )
}
