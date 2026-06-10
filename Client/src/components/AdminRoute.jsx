import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute
