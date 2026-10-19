import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl skeleton-shimmer bg-[#13213B]',
        className
      )}
      {...props}
    />
  )
}
