import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})

export const metadata: Metadata = {
  title: {
    default: 'EVSoftware · Eva Vidal Nutrición',
    template: '%s | EVSoftware · Eva Vidal Nutrición',
  },
  robots: { index: false, follow: false, noarchive: true },
  description:
    'EVSoftware · Plataforma clínica de nutrición y dietética · Eva Vidal Nutrición',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.variable} ${sora.variable} theme-dark min-h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
