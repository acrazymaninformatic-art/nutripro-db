'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

export interface DialogProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ onClick, children, asChild, ...props }, ref) => {
    const { setOpen } = useDialogContext()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented) {
        setOpen(true)
      }
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        onClick: (e: React.MouseEvent) => {
          const childProps = (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props
          childProps.onClick?.(e)
          if (!e.defaultPrevented) {
            setOpen(true)
          }
        },
      })
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = 'DialogTrigger'

export interface DialogPortalProps {
  children: React.ReactNode
}

const emptySubscribe = () => () => {}

function DialogPortal({ children }: DialogPortalProps) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(children, document.body)
}

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-slate-950/60 transition-opacity duration-200 animate-overlay-in',
        className
      )}
      data-gsap-overlay
      {...props}
    />
  )
})
DialogOverlay.displayName = 'DialogOverlay'

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => {
    const { open, setOpen } = useDialogContext()

    React.useEffect(() => {
      if (!open) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false)
          onClose?.()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = originalOverflow
      }
    }, [open, setOpen, onClose])

    if (!open) {
      return null
    }

    const handleClose = () => {
      setOpen(false)
      onClose?.()
    }

    return (
      <DialogPortal>
        {/*
         * El panel vive dentro del overlay (que hace de contenedor flex) y se
         * centra con márgenes automáticos, NO con `-translate-x-1/2`.
         * Motivo: GSAP 3.13+ escribe la propiedad CSS `translate` al animar
         * `x`/`y`, y eso pisaba el `-50%` de Tailwind v4, dejando el modal
         * descuadrado durante la entrada (salía cortado y luego se colocaba
         * bien). Con el centrado por márgenes no hay conflicto.
         */}
        <DialogOverlay
          onClick={handleClose}
          className="flex items-start justify-center overflow-y-auto overscroll-contain p-4"
        >
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              // `flex flex-col` (en lugar de `grid`) evita que una columna
              // `auto` crezca con el contenido y desborde el panel, y
              // `max-h` + scroll interno evitan que los modales largos
              // (revisión de cuestionarios) queden cortados fuera del viewport.
              'relative z-10 my-auto flex w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100vh-2rem)] flex-col overflow-y-auto overscroll-contain gap-4 border border-slate-200/90 bg-white p-6 shadow-2xl sm:rounded-3xl',
              className
            )}
            data-gsap-modal
            {...props}
          >
            {children}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 opacity-80 transition-[background-color,color,opacity] hover:bg-slate-100 hover:text-slate-700 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>
        </DialogOverlay>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = 'DialogContent'

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDialogContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      setOpen(false)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    />
  )
})
DialogClose.displayName = 'DialogClose'

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-900',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
