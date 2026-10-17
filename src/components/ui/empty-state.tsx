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
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200/90 bg-white/60 backdrop-blur-xs',
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
          <Icon className="w-6 h-6 text-slate-500" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
