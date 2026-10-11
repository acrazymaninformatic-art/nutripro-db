import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'NutriPro - Software de Nutrición Profesional',
  description:
    'Software profesional de nutrición y dietética para la gestión de pacientes y planificación de dietas',
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
