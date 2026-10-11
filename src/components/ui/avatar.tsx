'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarContextValue {
  imageLoaded: boolean
  setImageLoaded: (loaded: boolean) => void
  hasError: boolean
  setHasError: (error: boolean) => void
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  return (
    <AvatarContext.Provider
      value={{ imageLoaded, setImageLoaded, hasError, setHasError }}
    >
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  )
})
Avatar.displayName = 'Avatar'

export type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = '', onLoad, onError, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (!src || context?.hasError) {
      return null
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn('aspect-square h-full w-full object-cover', className)}
        onLoad={(e) => {
          context?.setImageLoaded(true)
          context?.setHasError(false)
          onLoad?.(e)
        }}
        onError={(e) => {
          context?.setHasError(true)
          context?.setImageLoaded(false)
          onError?.(e)
        }}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AvatarContext)

  if (context?.imageLoaded && !context?.hasError) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700 select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
