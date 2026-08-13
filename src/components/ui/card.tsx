import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  'data-testid'?: string
}

export function Card({
  children,
  className,
  'data-testid': testId,
}: CardProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded bg-[var(--color-border)]',
        className,
      )}
    />
  )
}
