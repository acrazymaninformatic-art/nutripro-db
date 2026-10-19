import * as React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#1C2B4A] bg-[#0F1A30]/70 p-8 text-center backdrop-blur-xs sm:p-12',
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-500/10 text-blue-300 shadow-2xs">
          <Icon className="h-6 w-6 text-blue-300" />
        </div>
      )}
      <h3 className="text-base font-bold tracking-tight text-[#E6EEFF]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#8FA3C7] sm:text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
