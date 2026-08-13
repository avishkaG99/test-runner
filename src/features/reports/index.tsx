import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Status = 'idle' | 'running' | 'done' | 'cancelled'

const DURATION_MS = 4000
const TICK_MS = 100

export function Reports() {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => clearTimer, [])

  const start = () => {
    setStatus('running')
    setProgress(0)

    const step = (TICK_MS / DURATION_MS) * 100
    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + step
        if (next >= 100) {
          clearTimer()
          setStatus('done')
          toast.success('Report generated')
          return 100
        }
        return next
      })
    }, TICK_MS)
  }

  const cancel = () => {
    clearTimer()
    setStatus('cancelled')
    toast.info('Report generation cancelled')
  }

  const reset = () => {
    clearTimer()
    setStatus('idle')
    setProgress(0)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6" data-testid="reports-page">
      <header>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--color-muted)]">
          A long-running operation with progress and cancellation.
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Inventory report</h2>
          <span
            className="text-sm text-[var(--color-muted)]"
            data-testid="reports-status"
          >
            {status}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Report generation progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          data-testid="reports-progressbar"
          className="h-2 w-full overflow-hidden rounded bg-[var(--color-border)]"
        >
          <div
            className="h-full bg-[var(--color-primary)] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm" data-testid="reports-progress-value">
          {Math.round(progress)}%
        </p>

        <div className="flex gap-2">
          {status !== 'running' ? (
            <Button onClick={start} data-testid="reports-generate-button">
              Generate report
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={cancel}
              data-testid="reports-cancel-button"
            >
              Cancel
            </Button>
          )}
          {(status === 'done' || status === 'cancelled') && (
            <Button
              variant="secondary"
              onClick={reset}
              data-testid="reports-reset-button"
            >
              Reset
            </Button>
          )}
        </div>

        {status === 'done' && (
          <Alert tone="success" data-testid="reports-success">
            Your inventory report is ready to download.
          </Alert>
        )}
        {status === 'cancelled' && (
          <Alert tone="info" data-testid="reports-cancelled">
            Report generation was cancelled before it finished.
          </Alert>
        )}
      </Card>
    </div>
  )
}
