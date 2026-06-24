import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string | null, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), fmt) } catch { return dateStr }
}

export function formatCurrency(amount?: number | null, currency = 'PKR') {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(amount)
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getStatusBadgeClass(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-green', PRESENT: 'badge-green', APPROVED: 'badge-green', PAID: 'badge-green',
    HIRED: 'badge-green', OPEN: 'badge-green', COMPLETED: 'badge-green',
    INACTIVE: 'badge-gray', ABSENT: 'badge-red', REJECTED: 'badge-red', TERMINATED: 'badge-red',
    CLOSED: 'badge-gray', CANCELLED: 'badge-gray',
    LATE: 'badge-yellow', PENDING: 'badge-yellow', DRAFT: 'badge-yellow', ON_HOLD: 'badge-yellow',
    ON_LEAVE: 'badge-blue', APPROVED_BY_TL: 'badge-blue', PROCESSING: 'badge-blue',
    SCREENING: 'badge-purple', INTERVIEW: 'badge-purple', TECHNICAL: 'badge-purple', OFFER: 'badge-purple',
  }
  return map[status] || 'badge-gray'
}

export function getMonthName(month: number) {
  return new Date(2024, month - 1).toLocaleString('default', { month: 'long' })
}

export function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
