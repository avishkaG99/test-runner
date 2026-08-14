import { Language } from '@/enums'
import type { UserProfile, UserProfileInput } from '@/types'

/** Mirrors the server rule in the profile handler. */
export const BIO_MAX_LENGTH = 280
export const DISPLAY_NAME_MAX_LENGTH = 40
export const JOB_TITLE_MAX_LENGTH = 60

export interface ProfileFormValues {
  displayName: string
  jobTitle: string
  bio: string
  timezone: string
  language: string
  marketingEmails: boolean
}

export function toFormValues(profile?: UserProfile): ProfileFormValues {
  return {
    displayName: profile?.displayName ?? '',
    jobTitle: profile?.jobTitle ?? '',
    bio: profile?.bio ?? '',
    timezone: profile?.timezone ?? 'UTC',
    language: profile?.language ?? Language.English,
    marketingEmails: profile?.marketingEmails ?? false,
  }
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>

export function validateProfile(values: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {}

  const displayName = values.displayName.trim()
  if (!displayName) {
    errors.displayName = 'Display name is required.'
  } else if (displayName.length < 2) {
    errors.displayName = 'Display name must be at least 2 characters.'
  } else if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    errors.displayName = `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`
  }

  if (values.jobTitle.trim().length > JOB_TITLE_MAX_LENGTH) {
    errors.jobTitle = `Job title must be ${JOB_TITLE_MAX_LENGTH} characters or fewer.`
  }

  if (values.bio.trim().length > BIO_MAX_LENGTH) {
    errors.bio = `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`
  }

  return errors
}

export function toProfileInput(values: ProfileFormValues): UserProfileInput {
  return {
    displayName: values.displayName.trim(),
    jobTitle: values.jobTitle.trim(),
    bio: values.bio.trim(),
    timezone: values.timezone,
    language: values.language as UserProfileInput['language'],
    marketingEmails: values.marketingEmails,
  }
}

/**
 * True when the form differs from the loaded profile. Drives the Save button's
 * disabled state and the unsaved-changes warning, and is compared on trimmed
 * values so trailing whitespace alone never counts as a change.
 */
export function isDirty(
  values: ProfileFormValues,
  profile?: UserProfile,
): boolean {
  const original = toFormValues(profile)
  return (
    values.displayName.trim() !== original.displayName.trim() ||
    values.jobTitle.trim() !== original.jobTitle.trim() ||
    values.bio.trim() !== original.bio.trim() ||
    values.timezone !== original.timezone ||
    values.language !== original.language ||
    values.marketingEmails !== original.marketingEmails
  )
}

export interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export type PasswordFormErrors = Partial<
  Record<keyof PasswordFormValues, string>
>

export function validatePassword(
  values: PasswordFormValues,
): PasswordFormErrors {
  const errors: PasswordFormErrors = {}

  if (!values.currentPassword) {
    errors.currentPassword = 'Current password is required.'
  }

  if (!values.newPassword) {
    errors.newPassword = 'New password is required.'
  } else if (values.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters.'
  } else if (values.newPassword === values.currentPassword) {
    errors.newPassword = 'New password must be different from the current one.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm the new password.'
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

/** Initials for the avatar, from the display name. Falls back to '?'. */
export function initialsFrom(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
