import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Zap, CheckCircle, ArrowLeft } from 'lucide-react'
import { authApi } from '../../services/api'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>()

  const onSubmit = async (data: { email: string }) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-2xl mb-4">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
          <p className="text-gray-500 mt-1 text-sm">We'll send you a reset link</p>
        </div>
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <p className="text-gray-700 font-medium">Check your email</p>
              <p className="text-sm text-gray-500 mt-1">If that email exists, we sent a reset link.</p>
              <Link to="/login" className="btn-primary mt-5 justify-center w-full">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" placeholder="you@company.com" {...register('email', { required: 'Email required' })} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-2">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
