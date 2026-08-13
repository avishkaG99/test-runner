import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { useForgotPasswordMutation } from '@/hooks/api/auth'
import type { ApiError } from '@/types'

export function ForgotPassword() {
  const mutation = useForgotPasswordMutation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setError(undefined)

    mutation.mutate(email, {
      onSuccess: () => setSent(true),
      onError: (err) => setFormError((err as unknown as ApiError).message),
    })
  }

  if (sent) {
    return (
      <div
        className="flex w-full max-w-sm flex-col gap-4"
        data-testid="forgot-password-success"
      >
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <Alert tone="success">
          If an account exists for {email}, a reset link is on its way.
        </Alert>
        <Link to="/sign-in" data-testid="forgot-password-back-link">
          <Button variant="secondary" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="forgot-password-form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-[var(--color-muted)]">
          We’ll send a reset link to your email.
        </p>
      </header>

      {formError && (
        <Alert tone="error" data-testid="forgot-password-error">
          {formError}
        </Alert>
      )}

      <Field id="forgot-email" label="Email" required error={error}>
        <TextInput
          id="forgot-email"
          type="email"
          data-testid="forgot-password-email-input"
          value={email}
          invalid={Boolean(error)}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Button
        type="submit"
        loading={mutation.isPending}
        data-testid="forgot-password-submit-button"
      >
        Send reset link
      </Button>

      <Link
        to="/sign-in"
        data-testid="forgot-password-sign-in-link"
        className="text-center text-sm text-[var(--color-primary)] hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  )
}
