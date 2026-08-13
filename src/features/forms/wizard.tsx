import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { submitShowcaseForm } from '@/lib/api/services/forms'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/types'

interface WizardValues {
  firstName: string
  lastName: string
  email: string
  company: string
  teamSize: string
  street: string
  city: string
  postcode: string
}

const INITIAL: WizardValues = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  teamSize: '',
  street: '',
  city: '',
  postcode: '',
}

type WizardErrors = Partial<Record<keyof WizardValues, string>>

const STEPS = ['Your details', 'Company', 'Address', 'Review'] as const

function validateStep(step: number, values: WizardValues): WizardErrors {
  const errors: WizardErrors = {}

  if (step === 0) {
    if (!values.firstName.trim()) errors.firstName = 'First name is required.'
    if (!values.lastName.trim()) errors.lastName = 'Last name is required.'
    if (!values.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
  }

  if (step === 1) {
    if (!values.company.trim()) errors.company = 'Company is required.'
    if (!values.teamSize) errors.teamSize = 'Select a team size.'
  }

  if (step === 2) {
    if (!values.street.trim()) errors.street = 'Street is required.'
    if (!values.city.trim()) errors.city = 'City is required.'
    if (!values.postcode.trim()) {
      errors.postcode = 'Postcode is required.'
    } else if (!/^[A-Za-z0-9 -]{3,10}$/.test(values.postcode.trim())) {
      errors.postcode = 'Enter a valid postcode (3-10 characters).'
    }
  }

  return errors
}

export function FormsWizard() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<WizardValues>(INITIAL)
  const [errors, setErrors] = useState<WizardErrors>({})
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const isReview = step === STEPS.length - 1

  const setField = (key: keyof WizardValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    const nextErrors = validateStep(step, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    setFormError(null)
    setPending(true)
    try {
      await submitShowcaseForm({ ...values, source: 'wizard' })
      setCompleted(true)
      toast.success('Registration complete')
    } catch (error) {
      setFormError((error as ApiError).message)
      toast.error('Submission failed')
    } finally {
      setPending(false)
    }
  }

  if (completed) {
    return (
      <div className="flex flex-col gap-4" data-testid="wizard-complete">
        <h1 className="text-2xl font-semibold">Registration complete</h1>
        <Alert tone="success">
          Thanks {values.firstName}, your registration has been received.
        </Alert>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            data-testid="wizard-restart-button"
            onClick={() => {
              setValues(INITIAL)
              setStep(0)
              setCompleted(false)
            }}
          >
            Start over
          </Button>
          <Link to="/forms" data-testid="wizard-back-to-forms-link">
            <Button variant="ghost">Back to forms</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6" data-testid="wizard-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Registration wizard</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Step <span data-testid="wizard-step-number">{step + 1}</span> of{' '}
          {STEPS.length}: {STEPS[step]}
        </p>
      </header>

      <ol className="flex flex-wrap gap-2" data-testid="wizard-steps">
        {STEPS.map((label, index) => (
          <li
            key={label}
            data-testid={`wizard-step-indicator-${index}`}
            aria-current={index === step ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
              index === step
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                : index < step
                  ? 'border-[var(--color-success)] text-[var(--color-success)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)]',
            )}
          >
            {index < step && <Check className="size-3" aria-hidden="true" />}
            {label}
          </li>
        ))}
      </ol>

      {formError && (
        <Alert tone="error" data-testid="wizard-error">
          {formError}
        </Alert>
      )}

      <Card className="flex flex-col gap-4">
        {step === 0 && (
          <div className="flex flex-col gap-4" data-testid="wizard-step-0">
            <Field
              id="wizard-first-name"
              label="First name"
              required
              error={errors.firstName}
            >
              <TextInput
                id="wizard-first-name"
                data-testid="wizard-first-name-input"
                value={values.firstName}
                invalid={Boolean(errors.firstName)}
                onChange={(e) => setField('firstName')(e.target.value)}
              />
            </Field>
            <Field
              id="wizard-last-name"
              label="Last name"
              required
              error={errors.lastName}
            >
              <TextInput
                id="wizard-last-name"
                data-testid="wizard-last-name-input"
                value={values.lastName}
                invalid={Boolean(errors.lastName)}
                onChange={(e) => setField('lastName')(e.target.value)}
              />
            </Field>
            <Field
              id="wizard-email"
              label="Email"
              required
              error={errors.email}
            >
              <TextInput
                id="wizard-email"
                type="email"
                data-testid="wizard-email-input"
                value={values.email}
                invalid={Boolean(errors.email)}
                onChange={(e) => setField('email')(e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4" data-testid="wizard-step-1">
            <Field
              id="wizard-company"
              label="Company"
              required
              error={errors.company}
            >
              <TextInput
                id="wizard-company"
                data-testid="wizard-company-input"
                value={values.company}
                invalid={Boolean(errors.company)}
                onChange={(e) => setField('company')(e.target.value)}
              />
            </Field>
            <Field
              id="wizard-team-size"
              label="Team size"
              required
              error={errors.teamSize}
            >
              <SelectInput
                id="wizard-team-size"
                data-testid="wizard-team-size-select"
                value={values.teamSize}
                invalid={Boolean(errors.teamSize)}
                onChange={(e) => setField('teamSize')(e.target.value)}
              >
                <option value="">Choose…</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="200+">200+</option>
              </SelectInput>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4" data-testid="wizard-step-2">
            <Field
              id="wizard-street"
              label="Street"
              required
              error={errors.street}
            >
              <TextInput
                id="wizard-street"
                data-testid="wizard-street-input"
                value={values.street}
                invalid={Boolean(errors.street)}
                onChange={(e) => setField('street')(e.target.value)}
              />
            </Field>
            <Field id="wizard-city" label="City" required error={errors.city}>
              <TextInput
                id="wizard-city"
                data-testid="wizard-city-input"
                value={values.city}
                invalid={Boolean(errors.city)}
                onChange={(e) => setField('city')(e.target.value)}
              />
            </Field>
            <Field
              id="wizard-postcode"
              label="Postcode"
              required
              error={errors.postcode}
            >
              <TextInput
                id="wizard-postcode"
                data-testid="wizard-postcode-input"
                value={values.postcode}
                invalid={Boolean(errors.postcode)}
                onChange={(e) => setField('postcode')(e.target.value)}
              />
            </Field>
          </div>
        )}

        {isReview && (
          <dl
            className="grid gap-3 sm:grid-cols-2"
            data-testid="wizard-review"
          >
            {(Object.keys(values) as Array<keyof WizardValues>).map((key) => (
              <div key={key}>
                <dt className="text-xs text-[var(--color-muted)] capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </dt>
                <dd
                  className="text-sm font-medium"
                  data-testid={`wizard-review-${key}`}
                >
                  {values[key] || '—'}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={step === 0}
          data-testid="wizard-back-button"
        >
          Back
        </Button>

        {isReview ? (
          <Button
            onClick={handleSubmit}
            loading={pending}
            data-testid="wizard-submit-button"
          >
            Submit registration
          </Button>
        ) : (
          <Button onClick={handleNext} data-testid="wizard-next-button">
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
