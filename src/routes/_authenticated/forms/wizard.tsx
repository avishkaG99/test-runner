import { createFileRoute } from '@tanstack/react-router'
import { FormsWizard } from '@/features/forms/wizard'

export const Route = createFileRoute('/_authenticated/forms/wizard')({
  component: FormsWizard,
})
