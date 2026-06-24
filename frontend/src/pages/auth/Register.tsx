import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Zap, CheckCircle } from 'lucide-react'
import { authApi } from '../../services/api'

interface FormData {
  company_name: string
  name: string
  email: string
  password: string
  confirm_password: string
}

export default function Register() {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.register({ company_name: data.company_name, name: data.name, email: data.email, password: data.password })
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Check your email!</h2>
        <p className="text-gray-500 mt-2 text-sm">We sent a verification link to your email. Click it to activate your account.</p>
        <Link to="/login" className="btn-primary mt-6 justify-center w-full">Go to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-200">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your company</h1>
          <p className="text-gray-500 mt-1 text-sm">Start your 14-day free trial</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Company name</label>
              <input className="input" placeholder="Acme Corp" {...register('company_name', { required: 'Company name is required' })} />
              {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
            </div>
            <div>
              <label className="label">Your full name</label>
              <input className="input" placeholder="Muhammad Ahmed" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Work email</label>
              <input type="email" className="input" placeholder="ahmed@company.com" {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min 8 characters"
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat password"
                {...register('confirm_password', {
                  required: 'Please confirm password',
                  validate: v => v === watch('password') || 'Passwords do not match'
                })}
              />
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
