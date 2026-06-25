// src/auth/ProtectedRoute.jsx
import { useAuth } from './useAuth'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth()

  console.log('ProtectedRoute check:', { user: user?.email, role, requiredRole, loading })

  // Still loading auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: 16,
      }}>
        Loading...
      </div>
    )
  }

  // No user logged in
  if (!user) {
    console.log('No user, redirecting to login')
    return <Navigate to="/" replace />
  }

  // User logged in but role doesn't match
  if (requiredRole && role !== requiredRole) {
    console.log('Role mismatch. Required:', requiredRole, 'Got:', role)
    // Redirect to the right dashboard
    if (role === 'teacher') {
      return <Navigate to="/teacher" replace />
    } else if (role === 'student') {
      return <Navigate to="/student" replace />
    }
    return <Navigate to="/" replace />
  }

  // All good — render children
  return children
}