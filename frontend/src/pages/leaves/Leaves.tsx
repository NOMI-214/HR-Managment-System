import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { Plus, CalendarDays, CheckCircle, XCircle, Clock, Info } from 'lucide-react'
import { leaveApi } from '../../services/api'
import { LeaveRequest } from '../../types'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { formatDate, getStatusBadgeClass } from '../../utils'
import { useAuthStore } from '../../store/auth'

export default function Leaves() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showApply, setShowApply] = useState(false)
  const [tab, setTab] = useState<'my' | 'pending' | 'all'>('my')
  const [rejectModal, setRejectModal] = useState<{ id: string; type: 'tl' | 'hr' } | null>(null)

  const canApproveTL = ['TEAM_LEAD', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')
  const canApproveHR = ['HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')

  const { data: myLeaves, isLoading: loadingMy } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => leaveApi.myLeaves().then(r => r.data as LeaveRequest[]),
    enabled: tab === 'my',
  })

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => leaveApi.pending().then(r => r.data as LeaveRequest[]),
    enabled: tab === 'pending' && canApproveTL,
  })

  const { data: all, isLoading: loadingAll } = useQuery({
    queryKey: ['all-leaves'],
    queryFn: () => leaveApi.all().then(r => r.data as LeaveRequest[]),
    enabled: tab === 'all' && canApproveHR,
  })

  const tlAction = useMutation({
    mutationFn: ({ id, action, reason }: any) => leaveApi.tlAction(id, { action, rejection_reason: reason }),
    onSuccess: () => { toast.success('Action taken'); qc.invalidateQueries({ queryKey: ['pending-leaves'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const hrAction = useMutation({
    mutationFn: ({ id, action, reason }: any) => leaveApi.hrAction(id, { action, rejection_reason: reason }),
    onSuccess: () => { toast.success('Action taken'); qc.invalidateQueries({ queryKey: ['all-leaves', 'pending-leaves'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const leaves = tab === 'my' ? myLeaves : tab === 'pending' ? pending : all
  const isLoading = tab === 'my' ? loadingMy : tab === 'pending' ? loadingPending : loadingAll

  const leaveTypeColors: Record<string, string> = {
    ANNUAL: 'badge-blue', SICK: 'badge-red', CASUAL: 'badge-green', UNPAID: 'badge-gray'
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('my')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'my' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            My Leaves
          </button>
          {canApproveTL && (
            <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'pending' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              Pending {pending?.length ? `(${pending.length})` : ''}
            </button>
          )}
          {canApproveHR && (
            <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              All Leaves
            </button>
          )}
        </div>
        <button onClick={() => setShowApply(true)} className="btn-primary">
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : !leaves?.length ? (
        <EmptyState icon={CalendarDays} title="No leave requests" description={tab === 'my' ? 'Apply for leave to see it here' : 'No pending requests'} action={tab === 'my' ? { label: 'Apply Now', onClick: () => setShowApply(true) } : undefined} />
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={leaveTypeColors[leave.leave_type] || 'badge-gray'}>{leave.leave_type} LEAVE</span>
                    <span className={getStatusBadgeClass(leave.status)}>{leave.status.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">{leave.days_requested} day{leave.days_requested !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <CalendarDays size={14} className="text-gray-400" />
                      {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                    </div>
                  </div>
                  {leave.reason && <p className="text-sm text-gray-500 mt-1.5 line-clamp-1">{leave.reason}</p>}
                  {leave.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Info size={12} />{leave.rejection_reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Applied {formatDate(leave.created_at)}</p>
                </div>

                {/* Actions */}
                {tab === 'pending' && canApproveTL && leave.status === 'PENDING' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => tlAction.mutate({ id: leave.id, action: 'approve' })} disabled={tlAction.isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => setRejectModal({ id: leave.id, type: 'tl' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
                {tab === 'all' && canApproveHR && leave.status === 'APPROVED_BY_TL' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => hrAction.mutate({ id: leave.id, action: 'approve' })} disabled={hrAction.isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors">
                      <CheckCircle size={14} /> Final Approve
                    </button>
                    <button onClick={() => setRejectModal({ id: leave.id, type: 'hr' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showApply && <ApplyLeaveModal onClose={() => setShowApply(false)} />}
      {rejectModal && (
        <RejectModal
          onClose={() => setRejectModal(null)}
          onConfirm={(reason) => {
            if (rejectModal.type === 'tl') tlAction.mutate({ id: rejectModal.id, action: 'reject', reason })
            else hrAction.mutate({ id: rejectModal.id, action: 'reject', reason })
            setRejectModal(null)
          }}
        />
      )}
    </div>
  )
}

function ApplyLeaveModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch } = useForm<{ leave_type: string; start_date: string; end_date: string; reason: string }>()

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await leaveApi.apply(data)
      toast.success('Leave request submitted!')
      qc.invalidateQueries({ queryKey: ['my-leaves'] })
      onClose()
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Apply for Leave" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Leave Type *</label>
          <select className="input" {...register('leave_type', { required: true })}>
            <option value="">Select type</option>
            <option value="ANNUAL">Annual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input" {...register('start_date', { required: true })} />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input" {...register('end_date', { required: true })} />
          </div>
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea className="input resize-none" rows={3} placeholder="Optional reason..." {...register('reason')} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
        </div>
      </form>
    </Modal>
  )
}

function RejectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  return (
    <Modal open title="Reject Leave" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Reason for rejection</label>
          <textarea className="input resize-none" rows={3} placeholder="Explain why..." value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onConfirm(reason)} className="btn-danger">Reject Leave</button>
        </div>
      </div>
    </Modal>
  )
}
