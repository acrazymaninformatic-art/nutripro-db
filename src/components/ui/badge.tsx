import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-blue-200/80 bg-blue-50 text-blue-800 hover:bg-blue-100/80',
        secondary:
          'border-slate-200/90 bg-slate-100 text-slate-800 hover:bg-slate-200/80',
        destructive:
          'border-red-200/80 bg-red-50 text-red-800 hover:bg-red-100/80',
        outline:
          'text-slate-800 border-slate-300/80 hover:bg-slate-50',
        success:
          'border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80',
        warning:
          'border-amber-200/80 bg-amber-50 text-amber-900 hover:bg-amber-100/80',
        teal:
          'border-teal-200/80 bg-teal-50 text-teal-900 hover:bg-teal-100/80',
        purple:
          'border-purple-200/80 bg-purple-50 text-purple-900 hover:bg-purple-100/80',
        medical:
          'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
