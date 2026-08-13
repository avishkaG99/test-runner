import { createFileRoute } from '@tanstack/react-router'
import { SavedViews } from '@/features/saved-views'

export const Route = createFileRoute('/_authenticated/saved-views/')({
  component: SavedViews,
})
