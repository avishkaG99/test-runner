import { createFileRoute } from '@tanstack/react-router'
import { UiPlayground } from '@/features/ui-playground'

export const Route = createFileRoute('/_authenticated/ui-playground/')({
  component: UiPlayground,
})
