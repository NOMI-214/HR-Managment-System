import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

// App pages
import Dashboard from './pages/dashboard/Dashboard'
import Employees from './pages/employees/Employees'
import EmployeeDetail from './pages/employees/EmployeeDetail'
import Departments from './pages/departments/Departments'
import AttendancePage from './pages/attendance/Attendance'
import Leaves from './pages/leaves/Leaves'
import PayrollPage from './pages/payroll/Payroll'
import Recruitment from './pages/recruitment/Recruitment'
import Performance from './pages/performance/Performance'
import Documents from './pages/documents/Documents'
import Notifications from './pages/notifications/Notifications'
import Profile from './pages/profile/Profile'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Private */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="departments" element={<Departments />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="performance" element={<Performance />} />
          <Route path="documents" element={<Documents />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
