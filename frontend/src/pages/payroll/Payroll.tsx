import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { Plus, DollarSign, Download, CheckCircle, TrendingUp } from 'lucide-react'
import { payrollApi, employeeApi } from '../../services/api'
import { Payroll, Employee } from '../../types'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { formatCurrency, getStatusBadgeClass, getMonthName } from '../../utils'
import { useAuthStore } from '../../store/auth'

export default function PayrollPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<'all' | 'my'>('all')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const canManage = ['COMPANY_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user?.role || '')

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payroll', month, year, tab],
    queryFn: () => tab === 'my'
      ? payrollApi.myPayslips().then(r => r.data)
      : payrollApi.list({ month, year }).then(r => r.data),
  })

  const markPaid = useMutation({
    mutationFn: (id: string) => payrollApi.markPaid(id),
    onSuccess: () => { toast.success('Marked as paid'); qc.invalidateQueries({ queryKey: ['payroll'] }) },
    onError: () => toast.error('Error'),
  })

  const { data: emps } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list().then(r => r.data.data as Employee[]),
    enabled: canManage,
  })

  const empMap = (emps || []).reduce((acc: any, e: Employee) => ({ ...acc, [e.id]: e.full_name }), {})

  const totalNet = (payrolls || []).reduce((s: number, p: Payroll) => s + p.net_salary, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {canManage && (
            <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              All Payrolls
            </button>
          )}
          <button onClick={() => setTab('my')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'my' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            My Payslips
          </button>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'all' && (
            <>
              <select className="input h-9 text-sm w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>)}
              </select>
              <select className="input h-9 text-sm w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          {canManage && (
            <button onClick={() => setShowModal(true)} className="btn-primary h-9">
              <Plus size={16} /> Run Payroll
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {tab === 'all' && payrolls?.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-gray-800">{payrolls.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Payroll Records</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-green-700">{formatCurrency(totalNet)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Net Payout</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-blue-700">{payrolls.filter((p: Payroll) => p.status === 'PAID').length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Paid</p>
          </div>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : !payrolls?.length ? (
        <EmptyState icon={DollarSign} title="No payroll records" description={tab === 'my' ? "Your payslips will appear here" : "Run payroll to get started"} action={canManage && tab === 'all' ? { label: 'Run Payroll', onClick: () => setShowModal(true) } : undefined} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {canManage && tab === 'all' && <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Basic</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gross</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Deductions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Net Pay</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {canManage && tab === 'all' && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(payrolls || []).map((p: Payroll) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    {canManage && tab === 'all' && <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{empMap[p.employee_id] || '—'}</td>}
                    <td className="px-5 py-3.5 text-sm text-gray-700">{getMonthName(p.month)} {p.year}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{formatCurrency(p.basic_salary)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{formatCurrency(p.gross_salary)}</td>
                    <td className="px-4 py-3.5 text-sm text-red-500">-{formatCurrency(p.total_deductions)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-green-700">{formatCurrency(p.net_salary)}</td>
                    <td className="px-4 py-3.5"><span className={getStatusBadgeClass(p.status)}>{p.status}</span></td>
                    {canManage && tab === 'all' && (
                      <td className="px-4 py-3.5 text-right">
                        {p.status !== 'PAID' && (
                          <button onClick={() => markPaid.mutate(p.id)} disabled={markPaid.isPending} className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors">
                            <CheckCircle size={13} /> Mark Paid
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && canManage && <PayrollModal onClose={() => setShowModal(false)} employees={emps || []} />}
    </div>
  )
}

function PayrollModal({ onClose, employees }: { onClose: () => void; employees: Employee[] }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch } = useForm<Record<string, any>>({
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      housing_allowance: 0, transport_allowance: 0, medical_allowance: 0,
      other_allowances: 0, bonus: 0, income_tax: 0, social_security: 0, other_deductions: 0,
      working_days: 26, present_days: 26,
    }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const emp = employees.find(e => e.id === data.employee_id)
      await payrollApi.create({ ...data, basic_salary: emp?.salary || 0, month: Number(data.month), year: Number(data.year), working_days: Number(data.working_days), present_days: Number(data.present_days) })
      toast.success('Payroll created')
      qc.invalidateQueries({ queryKey: ['payroll'] })
      onClose()
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Run Payroll" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 md:col-span-1">
            <label className="label">Employee *</label>
            <select className="input" {...register('employee_id', { required: true })}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} (PKR {e.salary?.toLocaleString()})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month *</label>
            <select className="input" {...register('month', { required: true })}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year *</label>
            <select className="input" {...register('year')}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Allowances</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'housing_allowance', label: 'Housing' },
              { name: 'transport_allowance', label: 'Transport' },
              { name: 'medical_allowance', label: 'Medical' },
              { name: 'other_allowances', label: 'Other' },
              { name: 'bonus', label: 'Bonus' },
            ].map(f => (
              <div key={f.name}>
                <label className="label">{f.label}</label>
                <input type="number" className="input" min="0" {...register(f.name as any, { valueAsNumber: true })} />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Deductions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'income_tax', label: 'Income Tax' },
              { name: 'social_security', label: 'Social Security' },
              { name: 'other_deductions', label: 'Other' },
            ].map(f => (
              <div key={f.name}>
                <label className="label">{f.label}</label>
                <input type="number" className="input" min="0" {...register(f.name as any, { valueAsNumber: true })} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <label className="label">Working Days</label>
            <input type="number" className="input" {...register('working_days', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="label">Present Days</label>
            <input type="number" className="input" {...register('present_days', { valueAsNumber: true })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Create Payroll'}</button>
        </div>
      </form>
    </Modal>
  )
}
