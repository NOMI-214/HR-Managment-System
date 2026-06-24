import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Info, CheckCircle, AlertCircle, DollarSign, Briefcase } from 'lucide-react'
import { notificationApi } from '../../services/api'
import { Notification } from '../../types'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { formatDate } from '../../utils'
import toast from 'react-hot-toast'

const TYPE_ICONS: Record<string, any> = {
  LEAVE: CheckCircle, PAYROLL: DollarSign, RECRUITMENT: Briefcase, WARNING: AlertCircle, INFO: Info,
}
const TYPE_COLORS: Record<string, string> = {
  LEAVE: 'bg-green-50 text-green-600', PAYROLL: 'bg-blue-50 text-blue-600',
  RECRUITMENT: 'bg-purple-50 text-purple-600', WARNING: 'bg-orange-50 text-orange-600', INFO: 'bg-gray-50 text-gray-500',
}

export default function Notifications() {
  const qc = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data as Notification[]),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }) },
  })

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }) },
  })

  const unread = (notifications || []).filter(n => !n.is_read).length

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{notifications?.length || 0}</span> notifications
            {unread > 0 && <span className="ml-2 badge badge-red">{unread} unread</span>}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {!notifications?.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] || Info
            const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.INFO
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) markRead.mutate(n.id) }}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-sm ${!n.is_read ? 'border-l-4 border-l-primary-400 bg-primary-50/20' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
