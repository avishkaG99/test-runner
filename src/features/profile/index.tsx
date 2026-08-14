import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LANGUAGE_LABELS, Language, TIMEZONES } from '@/enums'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import {
  useChangePasswordMutation,
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/hooks/api/profile'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/types'
import {
  BIO_MAX_LENGTH,
  EMPTY_PASSWORD_FORM,
  initialsFrom,
  isDirty,
  toFormValues,
  toProfileInput,
  validatePassword,
  validateProfile,
} from './profile-form'
import type {
  PasswordFormErrors,
  PasswordFormValues,
  ProfileFormErrors,
  ProfileFormValues,
} from './profile-form'

const CONTROL_CLASS =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] disabled:opacity-50 aria-[invalid=true]:border-[var(--color-danger)]'

export function Profile() {
  const { data: profile, isPending, isError, error, refetch } = useProfileQuery()
  const updateProfile = useUpdateProfileMutation()
  const changePassword = useChangePasswordMutation()
  const { updateUser } = useAuth()

  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues())
  const [errors, setErrors] = useState<ProfileFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Seed the form once the profile arrives, and again after a save so the
  // baseline for `isDirty` follows the persisted record.
  useEffect(() => {
    if (profile) setValues(toFormValues(profile))
  }, [profile])

  const dirty = isDirty(values, profile)

  // Warns on tab close only — in-app navigation is a router concern and is
  // deliberately left unguarded so tests can leave with changes pending.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set =
    <K extends keyof ProfileFormValues>(key: K) =>
    (value: ProfileFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const nextErrors = validateProfile(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    updateProfile.mutate(toProfileInput(values), {
      onSuccess: (updated) => {
        setSavedAt(updated.updatedAt)
        // Keeps the header's current-user label in step with the new name.
        updateUser({ name: updated.displayName })
        toast.success('Profile updated')
      },
      onError: (err) => {
        const apiError = err as ApiError
        if (apiError.fieldErrors) setErrors(apiError.fieldErrors)
        else setServerError(apiError.message)
      },
    })
  }

  const handleReset = () => {
    setValues(toFormValues(profile))
    setErrors({})
    setServerError(null)
  }

  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-6" data-testid="profile-page">
        <header>
          <h1 className="text-2xl font-semibold">Profile</h1>
        </header>
        <Card data-testid="profile-loading">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex max-w-3xl flex-col gap-6" data-testid="profile-page">
        <header>
          <h1 className="text-2xl font-semibold">Profile</h1>
        </header>
        <Alert tone="error" data-testid="profile-error">
          {(error as ApiError).message}
        </Alert>
        <div>
          <Button
            variant="secondary"
            onClick={() => void refetch()}
            data-testid="profile-retry-button"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const bioLength = values.bio.trim().length
  const bioOver = bioLength > BIO_MAX_LENGTH

  return (
    <div className="flex max-w-3xl flex-col gap-6" data-testid="profile-page">
      <header>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Your account details and preferences.
        </p>
      </header>

      <Card className="flex items-center gap-4" data-testid="profile-summary">
        <div
          aria-hidden="true"
          data-testid="profile-avatar"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-semibold text-[var(--color-primary-fg)]"
        >
          {initialsFrom(values.displayName || profile.name)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium" data-testid="profile-name">
            {profile.name}
          </span>
          <span
            className="text-sm text-[var(--color-muted)]"
            data-testid="profile-email"
          >
            {profile.email}
          </span>
          <span
            className="text-xs text-[var(--color-muted)]"
            data-testid="profile-role"
          >
            Role: {profile.role}
          </span>
        </div>
      </Card>

      <Card>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
          data-testid="profile-form"
        >
          <h2 className="font-medium">Details</h2>

          {serverError && (
            <Alert tone="error" data-testid="profile-form-error">
              {serverError}
            </Alert>
          )}
          {savedAt && !dirty && (
            <Alert tone="success" data-testid="profile-saved">
              Saved. Last updated {new Date(savedAt).toLocaleString()}.
            </Alert>
          )}

          <Field
            id="profile-display-name"
            label="Display name"
            required
            error={errors.displayName}
          >
            <TextInput
              id="profile-display-name"
              data-testid="profile-display-name-input"
              value={values.displayName}
              invalid={Boolean(errors.displayName)}
              maxLength={80}
              onChange={(e) => set('displayName')(e.target.value)}
            />
          </Field>

          <Field
            id="profile-job-title"
            label="Job title"
            error={errors.jobTitle}
          >
            <TextInput
              id="profile-job-title"
              data-testid="profile-job-title-input"
              value={values.jobTitle}
              invalid={Boolean(errors.jobTitle)}
              placeholder="Optional"
              onChange={(e) => set('jobTitle')(e.target.value)}
            />
          </Field>

          <Field id="profile-bio" label="Bio" error={errors.bio}>
            <textarea
              id="profile-bio"
              data-testid="profile-bio-input"
              rows={4}
              value={values.bio}
              aria-invalid={Boolean(errors.bio) || undefined}
              aria-describedby={errors.bio ? 'profile-bio-error' : undefined}
              className={cn(CONTROL_CLASS, 'resize-y')}
              onChange={(e) => set('bio')(e.target.value)}
            />
          </Field>
          <p
            className={cn(
              'text-xs',
              bioOver
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--color-muted)]',
            )}
            data-testid="profile-bio-counter"
          >
            {bioLength} / {BIO_MAX_LENGTH}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-timezone" label="Timezone">
              <SelectInput
                id="profile-timezone"
                data-testid="profile-timezone-select"
                value={values.timezone}
                onChange={(e) => set('timezone')(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field id="profile-language" label="Language">
              <SelectInput
                id="profile-language"
                data-testid="profile-language-select"
                value={values.language}
                onChange={(e) => set('language')(e.target.value)}
              >
                {Object.values(Language).map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABELS[code]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="profile-marketing-checkbox"
              checked={values.marketingEmails}
              onChange={(e) => set('marketingEmails')(e.target.checked)}
              className="size-4 rounded border-[var(--color-border)]"
            />
            Send me product update emails
          </label>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              loading={updateProfile.isPending}
              disabled={!dirty}
              data-testid="profile-save-button"
            >
              Save changes
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={!dirty || updateProfile.isPending}
              data-testid="profile-reset-button"
            >
              Discard
            </Button>
            <span
              className="text-xs text-[var(--color-muted)]"
              data-testid="profile-dirty-state"
            >
              {dirty ? 'Unsaved changes' : 'No changes'}
            </span>
          </div>
        </form>
      </Card>

      <PasswordSection
        pending={changePassword.isPending}
        onSubmit={(input, callbacks) =>
          changePassword.mutate(input, callbacks)
        }
      />
    </div>
  )
}

interface PasswordSectionProps {
  pending: boolean
  onSubmit: (
    input: { currentPassword: string; newPassword: string },
    callbacks: {
      onSuccess: () => void
      onError: (error: unknown) => void
    },
  ) => void
}

function PasswordSection({ pending, onSubmit }: PasswordSectionProps) {
  const [values, setValues] = useState<PasswordFormValues>(EMPTY_PASSWORD_FORM)
  const [errors, setErrors] = useState<PasswordFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)

  const set = (key: keyof PasswordFormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setChanged(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setChanged(false)

    const nextErrors = validatePassword(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          setValues(EMPTY_PASSWORD_FORM)
          setChanged(true)
          toast.success('Password changed')
        },
        onError: (err) => {
          const apiError = err as ApiError
          if (apiError.fieldErrors) setErrors(apiError.fieldErrors)
          else setServerError(apiError.message)
        },
      },
    )
  }

  return (
    <Card>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
        noValidate
        data-testid="password-form"
      >
        <div>
          <h2 className="font-medium">Change password</h2>
          <p className="text-xs text-[var(--color-muted)]">
            Validated but never persisted — the seeded accounts keep their
            original passwords.
          </p>
        </div>

        {serverError && (
          <Alert tone="error" data-testid="password-form-error">
            {serverError}
          </Alert>
        )}
        {changed && (
          <Alert tone="success" data-testid="password-changed">
            Your password has been changed.
          </Alert>
        )}

        <Field
          id="password-current"
          label="Current password"
          required
          error={errors.currentPassword}
        >
          <TextInput
            id="password-current"
            type="password"
            autoComplete="current-password"
            data-testid="password-current-input"
            value={values.currentPassword}
            invalid={Boolean(errors.currentPassword)}
            onChange={(e) => set('currentPassword')(e.target.value)}
          />
        </Field>

        <Field
          id="password-new"
          label="New password"
          required
          hint="At least 8 characters."
          error={errors.newPassword}
        >
          <TextInput
            id="password-new"
            type="password"
            autoComplete="new-password"
            hasHint
            data-testid="password-new-input"
            value={values.newPassword}
            invalid={Boolean(errors.newPassword)}
            onChange={(e) => set('newPassword')(e.target.value)}
          />
        </Field>

        <Field
          id="password-confirm"
          label="Confirm new password"
          required
          error={errors.confirmPassword}
        >
          <TextInput
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            data-testid="password-confirm-input"
            value={values.confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(e) => set('confirmPassword')(e.target.value)}
          />
        </Field>

        <div>
          <Button
            type="submit"
            loading={pending}
            data-testid="password-submit-button"
          >
            Change password
          </Button>
        </div>
      </form>
    </Card>
  )
}
