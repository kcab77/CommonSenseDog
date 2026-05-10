import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Common Sense Dog AI',
  description: 'Holistic, nutrition-first pet health advisor powered by AI',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='32' font-size='32'>🐾</text></svg>" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
