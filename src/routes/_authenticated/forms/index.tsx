import { createFileRoute } from '@tanstack/react-router'
import { FormsShowcase } from '@/features/forms'

export const Route = createFileRoute('/_authenticated/forms/')({
  component: FormsShowcase,
})
