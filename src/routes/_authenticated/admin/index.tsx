import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserRole } from '@/enums'
import { Admin } from '@/features/admin'

export const Route = createFileRoute('/_authenticated/admin/')({
  // Role check on top of the sign-in guard inherited from /_authenticated.
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== UserRole.Admin) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Admin,
})
