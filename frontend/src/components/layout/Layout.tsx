import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/departments': 'Departments',
  '/attendance': 'Attendance',
  '/leaves': 'Leave Management',
  '/payroll': 'Payroll',
  '/recruitment': 'Recruitment',
  '/performance': 'Performance',
  '/documents': 'Documents',
  '/notifications': 'Notifications',
  '/profile': 'Profile & Settings',
}

export default function Layout() {
  const location = useLocation()
  const title = Object.entries(titles).find(([k]) => location.pathname.startsWith(k))?.[1] || 'TalentFlow'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Header title={title} />
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
