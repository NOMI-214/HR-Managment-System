import { LucideIcon } from 'lucide-react'
import { cn } from '../../utils'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
}

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  indigo: 'bg-indigo-50 text-indigo-600',
}

export default function StatCard({ label, value, icon: Icon, trend, color = 'indigo' }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
