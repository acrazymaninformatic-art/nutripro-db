import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[104px] w-full resize-y rounded-2xl border border-[#1C2B4A] bg-[#0F1A30] px-3.5 py-3 text-sm leading-relaxed text-[#E6EEFF] shadow-[0_2px_8px_-6px_rgba(0,0,0,.55)] transition-[border-color,background-color,opacity] duration-200 placeholder:text-[#647A9F] hover:border-blue-400/45 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-[#13213B] focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0A1120]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
