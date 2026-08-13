import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { useSignUpMutation } from '@/hooks/api/auth'
import type { ApiError } from '@/types'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function passwordStrength(password: string): {
  score: number
  label: string
} {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

function validate(values: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): FormErrors {
  const errors: FormErrors = {}
  if (!values.name.trim()) errors.name = 'Name is required.'
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

export function SignUp() {
  const signUpMutation = useSignUpMutation()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const strength = passwordStrength(values.password)

  const setField = (key: keyof typeof values) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleBlur = (key: keyof typeof values) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    setErrors(validate(values))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validate(values)
    setErrors(nextErrors)
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    })
    if (Object.keys(nextErrors).length > 0) return

    signUpMutation.mutate(
      { name: values.name, email: values.email, password: values.password },
      {
        onSuccess: () => setSucceeded(true),
        onError: (error) => {
          const apiError = error as unknown as ApiError
          setFormError(apiError.message)
          if (apiError.fieldErrors) setErrors(apiError.fieldErrors)
        },
      },
    )
  }

  if (succeeded) {
    return (
      <div
        className="flex w-full max-w-sm flex-col gap-4"
        data-testid="sign-up-success"
      >
        <h1 className="text-2xl font-semibold">Account created</h1>
        <Alert tone="success">
          Your account for {values.email} is ready. You can now sign in.
        </Alert>
        <Link to="/sign-in" data-testid="sign-up-to-sign-in-link">
          <Button className="w-full">Go to sign in</Button>
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="sign-up-form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-[var(--color-muted)]">
          An email containing “fail” forces a server error.
        </p>
      </header>

      {formError && (
        <Alert tone="error" data-testid="sign-up-error">
          {formError}
        </Alert>
      )}

      <Field
        id="sign-up-name"
        label="Full name"
        required
        error={touched.name ? errors.name : undefined}
      >
        <TextInput
          id="sign-up-name"
          data-testid="sign-up-name-input"
          value={values.name}
          invalid={Boolean(touched.name && errors.name)}
          onChange={(e) => setField('name')(e.target.value)}
          onBlur={() => handleBlur('name')}
        />
      </Field>

      <Field
        id="sign-up-email"
        label="Email"
        required
        error={touched.email ? errors.email : undefined}
      >
        <TextInput
          id="sign-up-email"
          type="email"
          data-testid="sign-up-email-input"
          value={values.email}
          invalid={Boolean(touched.email && errors.email)}
          onChange={(e) => setField('email')(e.target.value)}
          onBlur={() => handleBlur('email')}
        />
      </Field>

      <Field
        id="sign-up-password"
        label="Password"
        required
        error={touched.password ? errors.password : undefined}
      >
        <TextInput
          id="sign-up-password"
          type="password"
          data-testid="sign-up-password-input"
          value={values.password}
          invalid={Boolean(touched.password && errors.password)}
          onChange={(e) => setField('password')(e.target.value)}
          onBlur={() => handleBlur('password')}
        />
      </Field>

      {values.password && (
        <div className="flex flex-col gap-1" data-testid="sign-up-strength">
          <div
            role="progressbar"
            aria-label="Password strength"
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={4}
            className="h-1.5 w-full overflow-hidden rounded bg-[var(--color-border)]"
          >
            <div
              className="h-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>
          <p
            className="text-xs text-[var(--color-muted)]"
            data-testid="sign-up-strength-label"
          >
            {strength.label}
          </p>
        </div>
      )}

      <Field
        id="sign-up-confirm"
        label="Confirm password"
        required
        error={touched.confirmPassword ? errors.confirmPassword : undefined}
      >
        <TextInput
          id="sign-up-confirm"
          type="password"
          data-testid="sign-up-confirm-input"
          value={values.confirmPassword}
          invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
          onChange={(e) => setField('confirmPassword')(e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
        />
      </Field>

      <Button
        type="submit"
        loading={signUpMutation.isPending}
        data-testid="sign-up-submit-button"
      >
        Create account
      </Button>

      <p className="text-center text-sm text-[var(--color-muted)]">
        Already registered?{' '}
        <Link
          to="/sign-in"
          data-testid="sign-up-sign-in-link"
          className="text-[var(--color-primary)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
