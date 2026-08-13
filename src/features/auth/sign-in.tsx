import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { useLoginMutation } from '@/hooks/api/auth'
import { useAuth } from '@/hooks/use-auth'
import type { ApiError } from '@/types'

interface FormErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  return errors
}

export function SignIn() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/sign-in' })
  const { signIn } = useAuth()
  const loginMutation = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const handleBlur = (fieldName: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
    setErrors(validate(email, password))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validate(email, password)
    setErrors(nextErrors)
    setTouched({ email: true, password: true })
    if (Object.keys(nextErrors).length > 0) return

    loginMutation.mutate(
      { email, password, rememberMe },
      {
        onSuccess: (data) => {
          signIn(data)
          navigate({ to: search.redirect || '/dashboard' })
        },
        onError: (error) => {
          const apiError = error as unknown as ApiError
          setFormError(apiError.message)
          if (apiError.fieldErrors) setErrors(apiError.fieldErrors)
        },
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="sign-in-form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Use a seeded test account to continue.
        </p>
      </header>

      {formError && (
        <Alert tone="error" data-testid="sign-in-error">
          {formError}
        </Alert>
      )}

      <Field
        id="sign-in-email"
        label="Email"
        required
        error={touched.email ? errors.email : undefined}
      >
        <TextInput
          id="sign-in-email"
          type="email"
          autoComplete="email"
          placeholder="you@test.com"
          data-testid="sign-in-email-input"
          value={email}
          invalid={Boolean(touched.email && errors.email)}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
        />
      </Field>

      <Field
        id="sign-in-password"
        label="Password"
        required
        error={touched.password ? errors.password : undefined}
      >
        <TextInput
          id="sign-in-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          data-testid="sign-in-password-input"
          value={password}
          invalid={Boolean(touched.password && errors.password)}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur('password')}
        />
      </Field>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            data-testid="sign-in-remember-checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4"
          />
          Remember me
        </label>
        <Link
          to="/forgot-password"
          data-testid="sign-in-forgot-link"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        loading={loginMutation.isPending}
        data-testid="sign-in-submit-button"
      >
        {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted)]">
        No account?{' '}
        <Link
          to="/sign-up"
          data-testid="sign-in-signup-link"
          className="text-[var(--color-primary)] hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  )
}
