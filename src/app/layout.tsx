import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'
import { GsapMotionProvider } from '@/components/ui/gsap-motion-provider'
import { PwaRegister } from '@/components/ui/pwa-register'

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
  manifest: '/manifest.webmanifest',
  applicationName: 'EVSoftware',
  appleWebApp: {
    capable: true,
    title: 'EVSoftware',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
}

/**
 * Se aplica el tema antes del primer pintado para evitar el destello blanco
 * cuando la persona trabaja en modo oscuro.
 */
const THEME_SCRIPT = `(function(){try{var k='ev_theme_preference';var p=localStorage.getItem(k);var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${sora.variable} min-h-full antialiased`}>
        <PwaRegister />
        <GsapMotionProvider>{children}</GsapMotionProvider>
      </body>
    </html>
  )
}
