import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { submitShowcaseForm } from '@/lib/api/services/forms'
import type { ApiError } from '@/types'

const COUNTRIES = [
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
  { value: 'lk', label: 'Sri Lanka' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'us', label: 'United States' },
]

const INTERESTS = ['Automation', 'Accessibility', 'Performance', 'Security']

interface FormValues {
  fullName: string
  email: string
  quantity: string
  bio: string
  plan: string
  country: string | null
  interests: string[]
  contactMethod: string
  notifications: boolean
  startDate: string
  endDate: string
  satisfaction: number
  files: File[]
}

const INITIAL: FormValues = {
  fullName: '',
  email: '',
  quantity: '1',
  bio: '',
  plan: '',
  country: null,
  interests: [],
  contactMethod: 'email',
  notifications: true,
  startDate: '',
  endDate: '',
  satisfaction: 5,
  files: [],
}

type FormErrors = Partial<Record<keyof FormValues, string>>

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  const quantity = Number(values.quantity)
  if (!values.quantity) {
    errors.quantity = 'Quantity is required.'
  } else if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    errors.quantity = 'Enter a whole number between 1 and 99.'
  }

  if (!values.plan) errors.plan = 'Select a plan.'
  if (!values.country) errors.country = 'Select a country.'
  if (values.interests.length === 0) {
    errors.interests = 'Choose at least one interest.'
  }

  if (!values.startDate) errors.startDate = 'Start date is required.'
  if (!values.endDate) {
    errors.endDate = 'End date is required.'
  } else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'End date must be on or after the start date.'
  }

  return errors
}

export function FormsShowcase() {
  const [values, setValues] = useState<FormValues>(INITIAL)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(
    null,
  )
  const [pending, setPending] = useState(false)
  const [slowMode, setSlowMode] = useState(false)

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const blur = (key: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    setErrors(validate(values))
  }

  const errorFor = (key: keyof FormValues) =>
    touched[key] ? errors[key] : undefined

  const toggleInterest = (interest: string) => {
    setValues((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleReset = () => {
    setValues(INITIAL)
    setErrors({})
    setTouched({})
    setFormError(null)
    setSubmitted(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSubmitted(null)

    const nextErrors = validate(values)
    setErrors(nextErrors)
    setTouched(
      Object.fromEntries(Object.keys(values).map((key) => [key, true])),
    )
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    const payload = {
      ...values,
      quantity: Number(values.quantity),
      files: values.files.map((file) => file.name),
    }

    setPending(true)
    try {
      if (slowMode) await new Promise((resolve) => setTimeout(resolve, 2500))
      const result = await submitShowcaseForm(payload)
      setSubmitted(result.received)
      toast.success('Form submitted successfully')
    } catch (error) {
      setFormError((error as ApiError).message)
      toast.error('Submission failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6" data-testid="forms-page">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Forms showcase</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Every common input type. An email containing “fail” forces a server
            error.
          </p>
        </div>
        <Link to="/forms/wizard" data-testid="forms-wizard-link">
          <Button variant="secondary">Open multi-step wizard</Button>
        </Link>
      </header>

      {formError && (
        <Alert tone="error" data-testid="forms-error">
          {formError}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        data-testid="showcase-form"
        className="grid gap-6 lg:grid-cols-2"
      >
        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Text inputs</h2>

          <Field
            id="forms-fullname"
            label="Full name"
            required
            error={errorFor('fullName')}
          >
            <TextInput
              id="forms-fullname"
              data-testid="forms-fullname-input"
              value={values.fullName}
              invalid={Boolean(errorFor('fullName'))}
              onChange={(e) => setField('fullName', e.target.value)}
              onBlur={() => blur('fullName')}
            />
          </Field>

          <Field
            id="forms-email"
            label="Email"
            required
            error={errorFor('email')}
          >
            <TextInput
              id="forms-email"
              type="email"
              data-testid="forms-email-input"
              value={values.email}
              invalid={Boolean(errorFor('email'))}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={() => blur('email')}
            />
          </Field>

          <Field
            id="forms-quantity"
            label="Quantity"
            required
            hint="Between 1 and 99."
            error={errorFor('quantity')}
          >
            <TextInput
              id="forms-quantity"
              type="number"
              min={1}
              max={99}
              hasHint
              data-testid="forms-quantity-input"
              value={values.quantity}
              invalid={Boolean(errorFor('quantity'))}
              onChange={(e) => setField('quantity', e.target.value)}
              onBlur={() => blur('quantity')}
            />
          </Field>

          <Field id="forms-bio" label="Bio">
            <textarea
              id="forms-bio"
              rows={3}
              data-testid="forms-bio-textarea"
              value={values.bio}
              onChange={(e) => setField('bio', e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            />
          </Field>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Selection</h2>

          <Field
            id="forms-plan"
            label="Plan"
            required
            error={errorFor('plan')}
          >
            <SelectInput
              id="forms-plan"
              data-testid="forms-plan-select"
              value={values.plan}
              invalid={Boolean(errorFor('plan'))}
              onChange={(e) => setField('plan', e.target.value)}
              onBlur={() => blur('plan')}
            >
              <option value="">Choose a plan…</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </SelectInput>
          </Field>

          <Field
            id="forms-country"
            label="Country"
            required
            error={errorFor('country')}
          >
            <Combobox
              id="forms-country"
              options={COUNTRIES}
              value={values.country}
              invalid={Boolean(errorFor('country'))}
              onChange={(value) => {
                setField('country', value)
                setTouched((prev) => ({ ...prev, country: true }))
              }}
            />
          </Field>

          <fieldset
            className="flex flex-col gap-2"
            data-testid="forms-interests-group"
          >
            <legend className="text-sm font-medium">
              Interests
              <span className="ml-0.5 text-[var(--color-danger)]">*</span>
            </legend>
            {INTERESTS.map((interest) => (
              <label key={interest} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  data-testid={`forms-interest-${interest.toLowerCase()}`}
                  checked={values.interests.includes(interest)}
                  onChange={() => {
                    toggleInterest(interest)
                    setTouched((prev) => ({ ...prev, interests: true }))
                  }}
                />
                {interest}
              </label>
            ))}
            {errorFor('interests') && (
              <p
                role="alert"
                data-testid="forms-interests-error"
                className="text-xs text-[var(--color-danger)]"
              >
                {errorFor('interests')}
              </p>
            )}
          </fieldset>

          <fieldset
            className="flex flex-col gap-2"
            data-testid="forms-contact-group"
          >
            <legend className="text-sm font-medium">
              Preferred contact method
            </legend>
            {['email', 'phone', 'sms'].map((method) => (
              <label key={method} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="contactMethod"
                  value={method}
                  className="size-4"
                  data-testid={`forms-contact-${method}`}
                  checked={values.contactMethod === method}
                  onChange={(e) => setField('contactMethod', e.target.value)}
                />
                <span className="capitalize">{method}</span>
              </label>
            ))}
          </fieldset>

          <label className="flex items-center justify-between text-sm">
            <span className="font-medium">Email notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={values.notifications}
              aria-label="Email notifications"
              data-testid="forms-notifications-switch"
              onClick={() => setField('notifications', !values.notifications)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                values.notifications
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                  values.notifications ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Dates, range, and files</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="forms-start-date"
              label="Start date"
              required
              error={errorFor('startDate')}
            >
              <TextInput
                id="forms-start-date"
                type="date"
                data-testid="forms-start-date-input"
                value={values.startDate}
                invalid={Boolean(errorFor('startDate'))}
                onChange={(e) => setField('startDate', e.target.value)}
                onBlur={() => blur('startDate')}
              />
            </Field>

            <Field
              id="forms-end-date"
              label="End date"
              required
              error={errorFor('endDate')}
            >
              <TextInput
                id="forms-end-date"
                type="date"
                data-testid="forms-end-date-input"
                value={values.endDate}
                invalid={Boolean(errorFor('endDate'))}
                onChange={(e) => setField('endDate', e.target.value)}
                onBlur={() => blur('endDate')}
              />
            </Field>
          </div>

          <Field
            id="forms-satisfaction"
            label={`Satisfaction: ${values.satisfaction}`}
          >
            <input
              id="forms-satisfaction"
              type="range"
              min={0}
              max={10}
              step={1}
              data-testid="forms-satisfaction-slider"
              value={values.satisfaction}
              onChange={(e) => setField('satisfaction', Number(e.target.value))}
              className="w-full"
            />
          </Field>

          <Field
            id="forms-files"
            label="Attachments"
            hint="Images and PDFs, multiple allowed."
          >
            <input
              id="forms-files"
              type="file"
              multiple
              accept="image/*,.pdf"
              aria-describedby="forms-files-hint"
              data-testid="forms-files-input"
              onChange={(e) =>
                setField('files', Array.from(e.target.files ?? []))
              }
              className="w-full text-sm"
            />
          </Field>

          {values.files.length > 0 && (
            <ul data-testid="forms-file-list" className="flex flex-col gap-1">
              {values.files.map((file) => (
                <li
                  key={file.name}
                  data-testid={`forms-file-${file.name}`}
                  className="text-xs text-[var(--color-muted)]"
                >
                  {file.name} ({file.size} bytes)
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Submit</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              data-testid="forms-slow-mode-checkbox"
              checked={slowMode}
              onChange={(e) => setSlowMode(e.target.checked)}
            />
            Slow submit (adds a 2.5s delay)
          </label>

          <div className="flex gap-2">
            <Button
              type="submit"
              loading={pending}
              data-testid="forms-submit-button"
            >
              {pending ? 'Submitting…' : 'Submit form'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              data-testid="forms-reset-button"
            >
              Reset
            </Button>
          </div>

          {submitted && (
            <div className="flex flex-col gap-2" data-testid="forms-success">
              <Alert tone="success">Form submitted successfully.</Alert>
              <pre
                data-testid="forms-submitted-json"
                className="max-h-64 overflow-auto rounded-md bg-[var(--color-bg)] p-3 text-xs"
              >
                {JSON.stringify(submitted, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </form>
    </div>
  )
}
