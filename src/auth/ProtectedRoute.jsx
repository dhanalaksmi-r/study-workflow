import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { role, isLoggedIn } = useAuth()

  // Not logged in at all → go to login
  if (!isLoggedIn) {
    return <Navigate to="/" replace />
  }

  // Wrong role → go to their correct page
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={`/${role}`} replace />
  }

  // All good → show the page
  return children
}