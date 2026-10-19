import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-2xl border border-[#1C2B4A] bg-[#0F1A30] px-3.5 py-2.5 text-sm text-[#E6EEFF] shadow-[0_2px_8px_-6px_rgba(0,0,0,.55)] transition-[border-color,background-color,opacity,transform] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-[#647A9F] hover:border-blue-400/45 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-[#13213B] focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0A1120]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
