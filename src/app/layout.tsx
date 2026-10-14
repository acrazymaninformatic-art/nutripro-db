import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EVSoftware · Eva Vidal Nutrición',
  robots: { index: false, follow: false, noarchive: true },
  description:
    'EVSoftware - Plataforma clínica de nutrición y dietética · Consulta Nutricional Eva Vidal',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
