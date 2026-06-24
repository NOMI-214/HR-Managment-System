import { Bell, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useNavigate } from 'react-router-dom'

interface Props { title: string }

export default function Header({ title }: Props) {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.unreadCount().then(r => r.data.count),
    refetchInterval: 30000,
  })

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-20">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bell size={20} className="text-gray-500" />
          {unread && unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
