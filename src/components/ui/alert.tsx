import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'error' | 'success' | 'info'

const TONES: Record<Tone, { className: string; Icon: typeof Info }> = {
  error: {
    className:
      'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    Icon: AlertCircle,
  },
  success: {
    className:
      'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]',
    Icon: CheckCircle2,
  },
  info: {
    className:
      'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]',
    Icon: Info,
  },
}

interface AlertProps {
  tone?: Tone
  children: ReactNode
  className?: string
  'data-testid'?: string
}

export function Alert({
  tone = 'info',
  children,
  className,
  'data-testid': testId,
}: AlertProps) {
  const { className: toneClass, Icon } = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      data-testid={testId}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
        toneClass,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
