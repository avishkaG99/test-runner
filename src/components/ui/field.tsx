import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const CONTROL_CLASS =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] disabled:opacity-50 aria-[invalid=true]:border-[var(--color-danger)]'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

/** Wraps a control with its label and error, wiring aria-describedby for a11y. */
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          data-testid={`${id}-error`}
          className="text-xs text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  invalid?: boolean
  hasHint?: boolean
}

export function TextInput({
  id,
  invalid,
  hasHint,
  className,
  ...props
}: TextInputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={
        invalid ? `${id}-error` : hasHint ? `${id}-hint` : undefined
      }
      className={cn(CONTROL_CLASS, className)}
      {...props}
    />
  )
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  invalid?: boolean
}

export function SelectInput({
  id,
  invalid,
  className,
  children,
  ...props
}: SelectInputProps) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      className={cn(CONTROL_CLASS, className)}
      {...props}
    >
      {children}
    </select>
  )
}
