import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'
import { authApi } from '../../services/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ new_password: string; confirm: string }>()

  const onSubmit = async (data: { new_password: string }) => {
    const token = params.get('token')
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, new_password: data.new_password })
      toast.success('Password reset! Please log in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-primary-600 rounded-2xl items-center justify-center mb-4">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input type="password" className="input" placeholder="Min 8 characters" {...register('new_password', { required: true, minLength: 8 })} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" className="input" {...register('confirm', { validate: v => v === watch('new_password') || 'Passwords do not match' })} />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
