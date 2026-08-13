import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  testId: string
}

/** Modal with Escape-to-close, backdrop click, and a Tab focus trap. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  testId,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid={`${testId}-backdrop`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={description ? `${testId}-description` : undefined}
        data-testid={testId}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`${testId}-title`} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p
                id={`${testId}-description`}
                className="mt-1 text-sm text-[var(--color-muted)]"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            data-testid={`${testId}-close-button`}
            onClick={onClose}
            className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div>{children}</div>

        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
