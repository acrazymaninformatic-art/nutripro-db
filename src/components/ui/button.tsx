'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-white transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 hover:shadow-sm',
        destructive: 'bg-red-600 text-white shadow-xs hover:bg-red-700 active:bg-red-800 hover:shadow-sm',
        outline: 'border border-gray-200/90 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 active:bg-gray-100 hover:border-gray-300',
        secondary: 'bg-gray-100 text-gray-900 shadow-2xs hover:bg-gray-200 active:bg-gray-300',
        ghost: 'text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/70',
        link: 'text-blue-600 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        teal: 'bg-teal-600 text-white shadow-xs hover:bg-teal-700 active:bg-teal-800 hover:shadow-sm',
        glass: 'bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-800 hover:bg-white shadow-2xs active:bg-slate-50',
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
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
