import { useAuth } from '../../contexts/AuthContext'
import AdminDashboardPage from './AdminDashboardPage'
import MedicoDashboardPage from './MedicoDashboardPage'

export default function DashboardPage() {
  const { user } = useAuth()
  return user?.rol === 'admin' ? <AdminDashboardPage /> : <MedicoDashboardPage />
}
