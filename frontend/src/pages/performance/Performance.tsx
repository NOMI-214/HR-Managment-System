import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { Plus, TrendingUp, Target, Star, CheckCircle } from 'lucide-react'
import { performanceApi, employeeApi } from '../../services/api'
import { PerformanceReview, Goal, Employee } from '../../types'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { formatDate, getStatusBadgeClass } from '../../utils'
import { useAuthStore } from '../../store/auth'

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-700">{value}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function Performance() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'reviews' | 'goals'>('reviews')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const canManage = ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'SUPER_ADMIN'].includes(user?.role || '')

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => (canManage ? performanceApi.listReviews() : performanceApi.myReviews()).then(r => r.data as PerformanceReview[]),
  })

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => performanceApi.getGoals().then(r => r.data as Goal[]),
    enabled: tab === 'goals',
  })

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: any) => performanceApi.updateGoal(id, data),
    onSuccess: () => { toast.success('Goal updated'); qc.invalidateQueries({ queryKey: ['goals'] }) },
  })

  const { data: emps } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list().then(r => r.data.data as Employee[]),
    enabled: canManage,
  })

  const empMap = (emps || []).reduce((acc: any, e: Employee) => ({ ...acc, [e.id]: e.full_name }), {})

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('reviews')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'reviews' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Performance Reviews
          </button>
          <button onClick={() => setTab('goals')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'goals' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Goals & KPIs
          </button>
        </div>
        <div className="flex gap-2">
          {tab === 'reviews' && canManage && <button onClick={() => setShowReviewModal(true)} className="btn-primary h-9"><Plus size={15} /> New Review</button>}
          {tab === 'goals' && <button onClick={() => setShowGoalModal(true)} className="btn-primary h-9"><Plus size={15} /> Add Goal</button>}
        </div>
      </div>

      {tab === 'reviews' && (
        isLoading ? <LoadingSpinner /> : !reviews?.length ? (
          <EmptyState icon={TrendingUp} title="No reviews yet" description="Create performance reviews for your team" action={canManage ? { label: 'New Review', onClick: () => setShowReviewModal(true) } : undefined} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{empMap[r.employee_id] || 'Employee'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.review_period} {r.year}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                      <Star size={12} />
                      <span className="text-xs font-bold">{r.overall_score}/100</span>
                    </div>
                    <span className={getStatusBadgeClass(r.status)}>{r.status}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <ScoreBar label="Productivity" value={r.productivity_score} />
                  <ScoreBar label="Communication" value={r.communication_score} />
                  <ScoreBar label="Teamwork" value={r.teamwork_score} />
                  <ScoreBar label="Attendance" value={r.attendance_score} />
                  <ScoreBar label="Task Completion" value={r.task_completion_score} />
                </div>
                {r.strengths && (
                  <div className="mt-4 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Strengths</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{r.strengths}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'goals' && (
        <div className="space-y-3">
          {!goals?.length ? (
            <EmptyState icon={Target} title="No goals set" description="Set goals to track your progress" action={{ label: 'Add Goal', onClick: () => setShowGoalModal(true) }} />
          ) : (
            goals.map(g => (
              <div key={g.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{g.title}</p>
                    {g.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{g.description}</p>}
                    {g.target_date && <p className="text-xs text-gray-400 mt-0.5">Due: {formatDate(g.target_date)}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`badge ${g.status === 'COMPLETED' ? 'badge-green' : g.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-gray'}`}>{g.status}</span>
                    {g.status !== 'COMPLETED' && (
                      <button onClick={() => updateGoal.mutate({ id: g.id, data: { status: 'COMPLETED', progress: 100 } })} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors" title="Mark complete">
                        <CheckCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-semibold text-gray-600">{g.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${g.progress >= 100 ? 'bg-green-500' : g.progress >= 50 ? 'bg-blue-500' : 'bg-primary-500'}`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <input
                    type="range" min="0" max="100" value={g.progress}
                    onChange={e => updateGoal.mutate({ id: g.id, data: { progress: Number(e.target.value) } })}
                    className="w-full mt-1 accent-primary-600"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showReviewModal && canManage && <ReviewModal onClose={() => setShowReviewModal(false)} employees={emps || []} />}
      {showGoalModal && <GoalModal onClose={() => setShowGoalModal(false)} />}
    </div>
  )
}

function ReviewModal({ onClose, employees }: { onClose: () => void; employees: Employee[] }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: { year: new Date().getFullYear(), productivity_score: 70, communication_score: 70, teamwork_score: 70, attendance_score: 70, task_completion_score: 70 }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await performanceApi.createReview({ ...data, year: Number(data.year), productivity_score: Number(data.productivity_score), communication_score: Number(data.communication_score), teamwork_score: Number(data.teamwork_score), attendance_score: Number(data.attendance_score), task_completion_score: Number(data.task_completion_score) })
      toast.success('Review created')
      qc.invalidateQueries({ queryKey: ['reviews'] })
      onClose()
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Create Performance Review" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Employee *</label>
            <select className="input" {...register('employee_id', { required: true })}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Review Period</label>
            <select className="input" {...register('review_period')}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Year</label>
            <input type="number" className="input" {...register('year')} />
          </div>
          <div>
            <label className="label">Month (if monthly)</label>
            <select className="input" {...register('month')}>
              <option value="">N/A</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Scores (0–100)</p>
          {[
            { name: 'productivity_score', label: 'Productivity' },
            { name: 'communication_score', label: 'Communication' },
            { name: 'teamwork_score', label: 'Teamwork' },
            { name: 'attendance_score', label: 'Attendance' },
            { name: 'task_completion_score', label: 'Task Completion' },
          ].map(f => (
            <div key={f.name} className="grid grid-cols-4 gap-3 items-center">
              <label className="label col-span-1 mb-0">{f.label}</label>
              <input type="range" min="0" max="100" className="col-span-2 accent-primary-600" {...register(f.name as any, { valueAsNumber: true })} />
              <input type="number" min="0" max="100" className="input col-span-1" {...register(f.name as any, { valueAsNumber: true })} />
            </div>
          ))}
        </div>
        <div>
          <label className="label">Strengths</label>
          <textarea className="input resize-none" rows={2} {...register('strengths')} />
        </div>
        <div>
          <label className="label">Areas for Improvement</label>
          <textarea className="input resize-none" rows={2} {...register('improvements')} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Review'}</button>
        </div>
      </form>
    </Modal>
  )
}

function GoalModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await performanceApi.createGoal(data)
      toast.success('Goal added')
      qc.invalidateQueries({ queryKey: ['goals'] })
      onClose()
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Add Goal" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="label">Title *</label><input className="input" placeholder="e.g. Complete React certification" {...register('title', { required: true })} /></div>
        <div><label className="label">Description</label><textarea className="input resize-none" rows={3} {...register('description')} /></div>
        <div><label className="label">Target Date</label><input type="datetime-local" className="input" {...register('target_date')} /></div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Goal'}</button>
        </div>
      </form>
    </Modal>
  )
}
