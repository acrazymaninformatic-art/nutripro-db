'use client'

import { MotionConfig, motion } from 'motion/react'
import { usePathname } from 'next/navigation'

export function PageMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
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
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -48px' }}
      transition={{ duration: 0.48, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
