import * as React from 'react'
import { cn } from '@/lib/utils'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full appearance-none rounded-2xl border border-[#1C2B4A] bg-[#0F1A30] px-3.5 py-2.5 pr-10 text-sm text-[#E6EEFF] shadow-[0_2px_8px_-6px_rgba(0,0,0,.55)] transition-[border-color,background-color,opacity] duration-200 hover:border-blue-400/45 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-[#13213B] focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0A1120]',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
