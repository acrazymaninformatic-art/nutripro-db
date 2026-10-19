'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-white transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.97] hover:-translate-y-px',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-blue-600 to-sky-700 text-white shadow-[0_8px_18px_-10px_rgba(2,132,199,.75)] hover:from-blue-500 hover:to-sky-700 hover:shadow-[0_12px_24px_-12px_rgba(2,132,199,.8)] active:from-blue-700 active:to-sky-800',
        destructive: 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-[0_8px_18px_-10px_rgba(225,29,72,.55)] hover:from-red-500 hover:to-rose-700 active:from-red-700 active:to-rose-800',
        outline: 'border border-slate-200/90 bg-white/90 text-slate-700 shadow-[0_2px_8px_-6px_rgba(15,23,42,.35)] hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-800 active:bg-blue-100/70',
        secondary: 'bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200 active:bg-slate-300',
        ghost: 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950 active:bg-slate-200/80',
        link: 'text-blue-600 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        teal: 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-[0_8px_18px_-10px_rgba(13,148,136,.75)] hover:from-teal-500 hover:to-emerald-700 active:from-teal-700 active:to-emerald-800',
        glass: 'bg-white/75 backdrop-blur-md border border-white/80 text-slate-800 shadow-[0_4px_16px_-10px_rgba(15,23,42,.35)] hover:bg-white hover:border-blue-100 active:bg-slate-50',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-xl px-3 text-xs',
        lg: 'h-11 rounded-2xl px-6 text-base',
        xl: 'h-12 rounded-2xl px-8 text-base font-bold',
        icon: 'h-10 w-10 p-0 rounded-2xl',
        iconSm: 'h-8 w-8 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        data-gsap-hover
        data-gsap-interactive
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
