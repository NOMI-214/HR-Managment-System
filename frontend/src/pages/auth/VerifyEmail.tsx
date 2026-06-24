import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Zap } from 'lucide-react'
import { authApi } from '../../services/api'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('Invalid verification link'); return }
    authApi.verifyEmail(token)
      .then(() => { setStatus('success'); setMessage('Email verified! You can now log in.') })
      .catch(e => { setStatus('error'); setMessage(e.response?.data?.detail || 'Verification failed') })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="inline-flex w-12 h-12 bg-primary-600 rounded-2xl items-center justify-center mb-6">
          <Zap className="text-white" size={24} />
        </div>
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link to="/login" className="btn-primary justify-center w-full">Sign in now</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mx-auto mb-3" size={40} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link to="/login" className="btn-secondary justify-center w-full">Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}
