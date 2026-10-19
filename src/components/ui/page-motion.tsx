'use client'

import { usePathname } from 'next/navigation'

export function PageMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} data-gsap-page>
      {children}
    </div>
  )
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <div
      className={className}
      data-gsap-reveal
      data-gsap-delay={delay > 0 ? delay : undefined}
    >
      {children}
    </div>
  )
}
