import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Lock, Shield } from 'lucide-react'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { getInitials } from '../../utils'

export default function Profile() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'security'>('profile')

  const { register: rPass, handleSubmit: hPass, reset: resetPass, watch, formState: { errors: errPass } } = useForm<{current_password: string; new_password: string; confirm: string}>()

  const changePwd = useMutation({
    mutationFn: (d: any) => authApi.changePassword(d),
    onSuccess: () => { toast.success('Password changed!'); resetPass() },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const onChangePassword = async (data: any) => {
    if (data.new_password !== data.confirm) { toast.error('Passwords do not match'); return }
    changePwd.mutate({ current_password: data.current_password, new_password: data.new_password })
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
              {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : getInitials(user?.name || 'U')}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className="badge badge-purple mt-1">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['profile', 'security'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t === 'profile' ? 'Profile Info' : 'Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User size={15} /> Account Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input bg-gray-50" value={user?.name || ''} readOnly />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-gray-50" value={user?.email || ''} readOnly />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input bg-gray-50" value={user?.role?.replace('_', ' ') || ''} readOnly />
            </div>
            <div>
              <label className="label">Member Since</label>
              <input className="input bg-gray-50" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} readOnly />
            </div>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-700 flex items-start gap-2">
            <Shield size={15} className="mt-0.5 flex-shrink-0" />
            <span>Contact your HR administrator to update your profile information.</span>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4"><Lock size={15} /> Change Password</h3>
          <form onSubmit={hPass(onChangePassword)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" {...rPass('current_password', { required: 'Required' })} />
              {errPass.current_password && <p className="text-xs text-red-500 mt-1">{errPass.current_password.message}</p>}
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" {...rPass('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              {errPass.new_password && <p className="text-xs text-red-500 mt-1">{errPass.new_password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" {...rPass('confirm', { validate: v => v === watch('new_password') || 'Passwords do not match' })} />
              {errPass.confirm && <p className="text-xs text-red-500 mt-1">{errPass.confirm.message}</p>}
            </div>
            <button type="submit" className="btn-primary" disabled={changePwd.isPending}>
              {changePwd.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
