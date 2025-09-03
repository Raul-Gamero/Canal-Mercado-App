'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!user) {
        router.push(redirectTo)
        return
      }

      // If roles are specified, check if user has access
      if (allowedRoles.length > 0 && userRole) {
        if (!allowedRoles.includes(userRole.role)) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [user, userRole, loading, allowedRoles, redirectTo, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!user) {
    return null
  }

  // If roles are specified and user doesn't have access, don't render children
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole.role)) {
    return null
  }

  return <>{children}</>
}
