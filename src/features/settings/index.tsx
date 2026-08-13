import { useState } from 'react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, TextInput } from '@/components/ui/field'
import { useResetAppDataMutation } from '@/hooks/api/dashboard'
import { useTheme } from '@/hooks/use-theme'
import {
  getLatency,
  isFlakyMode,
  setFlakyMode,
  setLatency,
} from '@/mocks/db'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const resetMutation = useResetAppDataMutation()

  const [latency, setLatencyState] = useState(() => String(getLatency()))
  const [flaky, setFlakyState] = useState(() => isFlakyMode())
  const [errorTriggered, setErrorTriggered] = useState(false)

  // Rendering during an error state lets the router error boundary catch it.
  if (errorTriggered) {
    throw new Error('Deliberate error triggered from the settings page.')
  }

  const handleLatencyChange = (value: string) => {
    setLatencyState(value)
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) setLatency(parsed)
  }

  const handleFlakyChange = (enabled: boolean) => {
    setFlakyState(enabled)
    setFlakyMode(enabled)
    toast.info(enabled ? 'Flaky mode enabled' : 'Flaky mode disabled')
  }

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => toast.success('App data restored to seed state'),
      onError: () => toast.error('Reset failed'),
    })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6" data-testid="settings-page">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Preferences and test-harness controls.
        </p>
      </header>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Appearance</h2>
        <fieldset className="flex gap-4" data-testid="settings-theme-group">
          <legend className="sr-only">Theme</legend>
          {(['light', 'dark'] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="theme"
                value={option}
                className="size-4"
                data-testid={`settings-theme-${option}`}
                checked={theme === option}
                onChange={() => setTheme(option)}
              />
              <span className="capitalize">{option}</span>
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-[var(--color-muted)]">
          Persisted to localStorage under <code>tta.theme</code>.
        </p>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-medium">Network simulation</h2>

        <Field
          id="settings-latency"
          label="Simulated API latency (ms)"
          hint="Applied to every mock API response."
        >
          <TextInput
            id="settings-latency"
            type="number"
            min={0}
            max={5000}
            hasHint
            data-testid="settings-latency-input"
            value={latency}
            onChange={(e) => handleLatencyChange(e.target.value)}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            data-testid="settings-flaky-checkbox"
            checked={flaky}
            onChange={(e) => handleFlakyChange(e.target.checked)}
          />
          Flaky mode — fail roughly 30% of reads with HTTP 503
        </label>

        <Alert tone="info">
          These settings persist in localStorage and affect the mock API on the
          next request.
        </Alert>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Test data</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Restores the product catalogue to its exact seed state. Appending{' '}
          <code>?reset=true</code> to any URL does the same before the app
          boots.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            loading={resetMutation.isPending}
            data-testid="settings-reset-button"
            onClick={handleReset}
          >
            Reset app data
          </Button>
          <Button
            variant="danger"
            data-testid="settings-trigger-error-button"
            onClick={() => setErrorTriggered(true)}
          >
            Trigger render error
          </Button>
        </div>
      </Card>
    </div>
  )
}
