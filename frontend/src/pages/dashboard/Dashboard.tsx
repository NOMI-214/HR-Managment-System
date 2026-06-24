import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../services/api'
import StatCard from '../../components/shared/StatCard'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { Users, UserCheck, Calendar, DollarSign, Briefcase, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCurrency, getMonthName } from '../../utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuthStore } from '../../store/auth'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: trend } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: () => dashboardApi.getAttendanceTrend().then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Payroll period</p>
          <p className="text-sm font-semibold text-gray-700">{getMonthName(stats?.month || new Date().getMonth() + 1)} {stats?.year}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats?.total_employees || 0} icon={Users} color="indigo" trend={{ value: stats?.new_hires_this_month || 0, label: 'new this month' }} />
        <StatCard label="Present Today" value={stats?.today_present || 0} icon={UserCheck} color="green" />
        <StatCard label="Attendance Rate" value={`${stats?.attendance_rate || 0}%`} icon={TrendingUp} color="blue" />
        <StatCard label="On Leave Today" value={stats?.on_leave_today || 0} icon={Calendar} color="orange" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Leaves" value={stats?.pending_leaves || 0} icon={AlertCircle} color="red" />
        <StatCard label="Open Positions" value={stats?.open_positions || 0} icon={Briefcase} color="purple" />
        <StatCard label="Monthly Payroll" value={formatCurrency(stats?.monthly_payroll_cost)} icon={DollarSign} color="green" />
        <StatCard label="New Hires" value={stats?.new_hires_this_month || 0} icon={Clock} color="indigo" />
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-5">Weekly Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trend || []} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="total" name="Total" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Employee', href: '/employees', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Approve Leaves', href: '/leaves', icon: Calendar, color: 'text-green-600 bg-green-50' },
            { label: 'Run Payroll', href: '/payroll', icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
            { label: 'Post Job', href: '/recruitment', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, href, icon: Icon, color }) => (
            <a key={href} href={href} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-primary-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
