import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Clock, LogIn, LogOut, Coffee, Play, Users, BarChart3, Calendar } from 'lucide-react'
import { attendanceApi, employeeApi } from '../../services/api'
import { Attendance as AttendanceType } from '../../types'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatDate, getStatusBadgeClass } from '../../utils'
import { useAuthStore } from '../../store/auth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function formatTime(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function AttendancePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'my' | 'team'>('my')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: today, isLoading: loadingToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceApi.today().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['attendance-history', month, year],
    queryFn: () => attendanceApi.myHistory({ month, year }).then(r => r.data),
  })

  const { data: report } = useQuery({
    queryKey: ['attendance-report', month, year],
    queryFn: () => attendanceApi.companyReport({ month, year }).then(r => r.data),
    enabled: ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD'].includes(user?.role || ''),
  })

  const clockIn = useMutation({
    mutationFn: () => attendanceApi.clockIn(),
    onSuccess: () => { toast.success('Clocked in!'); qc.invalidateQueries({ queryKey: ['attendance-today'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const clockOut = useMutation({
    mutationFn: () => attendanceApi.clockOut(),
    onSuccess: (r) => { toast.success(`Clocked out! Worked ${r.data.work_hours}h`); qc.invalidateQueries({ queryKey: ['attendance-today'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const breakStart = useMutation({
    mutationFn: () => attendanceApi.breakStart(),
    onSuccess: () => { toast.success('Break started'); qc.invalidateQueries({ queryKey: ['attendance-today'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const breakEnd = useMutation({
    mutationFn: () => attendanceApi.breakEnd(),
    onSuccess: () => { toast.success('Break ended'); qc.invalidateQueries({ queryKey: ['attendance-today'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const isClockedIn = !!today?.clock_in
  const isClockedOut = !!today?.clock_out
  const isOnBreak = !!today?.break_start && !today?.break_end

  const chartData = (history || []).slice(-14).map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: r.work_hours || 0,
  }))

  return (
    <div className="space-y-5">
      {/* Today's card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-800">Today's Attendance</h3>
            <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          {today && <span className={getStatusBadgeClass(today.status)}>{today.status}</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Clock In', value: formatTime(today?.clock_in), icon: LogIn, color: 'text-green-600' },
            { label: 'Clock Out', value: formatTime(today?.clock_out), icon: LogOut, color: 'text-red-500' },
            { label: 'Work Hours', value: today ? `${today.work_hours}h` : '0h', icon: Clock, color: 'text-blue-600' },
            { label: 'Break', value: (today?.break_start && !today?.break_end) ? 'Active' : today?.break_end ? 'Done' : '—', icon: Coffee, color: 'text-orange-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
              <Icon size={20} className={`mx-auto mb-2 ${color}`} />
              <p className="text-lg font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {!isClockedIn && !isClockedOut && (
            <button onClick={() => clockIn.mutate()} disabled={clockIn.isPending} className="btn-primary">
              <LogIn size={16} /> Clock In
            </button>
          )}
          {isClockedIn && !isClockedOut && (
            <>
              <button onClick={() => clockOut.mutate()} disabled={clockOut.isPending} className="btn-danger">
                <LogOut size={16} /> Clock Out
              </button>
              {!isOnBreak ? (
                <button onClick={() => breakStart.mutate()} disabled={breakStart.isPending} className="btn-secondary">
                  <Coffee size={16} /> Start Break
                </button>
              ) : (
                <button onClick={() => breakEnd.mutate()} disabled={breakEnd.isPending} className="btn-secondary">
                  <Play size={16} /> End Break
                </button>
              )}
            </>
          )}
          {isClockedOut && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <Clock size={16} /> Completed for today
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('my')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'my' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          My History
        </button>
        {['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD'].includes(user?.role || '') && (
          <button onClick={() => setTab('team')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'team' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Team Report
          </button>
        )}
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <select className="input h-9 text-sm w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select className="input h-9 text-sm w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {tab === 'my' ? (
        <div className="space-y-4">
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Work Hours (Last 14 days)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={12}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clock In</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clock Out</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Overtime</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(history || []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm text-gray-700 font-medium">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatTime(r.clock_in)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatTime(r.clock_out)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{r.work_hours}h</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.overtime_hours > 0 ? `${r.overtime_hours}h` : '—'}</td>
                      <td className="px-4 py-3"><span className={getStatusBadgeClass(r.status)}>{r.status}</span></td>
                    </tr>
                  ))}
                  {!history?.length && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">No records for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: report.total_records, color: 'bg-blue-50 text-blue-700' },
              { label: 'Present', value: report.present, color: 'bg-green-50 text-green-700' },
              { label: 'Absent', value: report.absent, color: 'bg-red-50 text-red-700' },
              { label: 'Attendance Rate', value: `${report.attendance_rate}%`, color: 'bg-purple-50 text-purple-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`card p-5 text-center ${color}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm mt-1 opacity-80">{label}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
