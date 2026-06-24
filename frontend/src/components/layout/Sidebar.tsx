import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { getInitials } from '../../utils'
import {
  LayoutDashboard, Users, Building2, Clock, CalendarDays,
  DollarSign, Briefcase, TrendingUp, FileText, Bell,
  Settings, LogOut, ChevronRight, Zap
} from 'lucide-react'

const allLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','TEAM_LEAD','EMPLOYEE'] },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','TEAM_LEAD'] },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER'] },
  { to: '/attendance', icon: Clock, label: 'Attendance', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','TEAM_LEAD','EMPLOYEE'] },
  { to: '/leaves', icon: CalendarDays, label: 'Leaves', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','TEAM_LEAD','EMPLOYEE'] },
  { to: '/payroll', icon: DollarSign, label: 'Payroll', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','EMPLOYEE'] },
  { to: '/recruitment', icon: Briefcase, label: 'Recruitment', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER'] },
  { to: '/performance', icon: TrendingUp, label: 'Performance', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','TEAM_LEAD','EMPLOYEE'] },
  { to: '/documents', icon: FileText, label: 'Documents', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','EMPLOYEE'] },
  { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['SUPER_ADMIN','COMPANY_ADMIN','HR_MANAGER','TEAM_LEAD','EMPLOYEE'] },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const links = allLinks.filter(l => user && l.roles.includes(user.role))

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">TalentFlow</p>
            <p className="text-xs text-gray-400">HRMS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings size={17} />
          <span>Profile & Settings</span>
        </NavLink>
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" />
              : getInitials(user?.name || 'U')}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
