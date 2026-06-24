import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { Plus, Building2, Users, Edit2, Trash2 } from 'lucide-react'
import { departmentApi, employeeApi } from '../../services/api'
import { Department, Employee } from '../../types'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { useAuthStore } from '../../store/auth'

const DEPT_ICONS = ['Engineering', 'HR', 'Marketing', 'Finance', 'Sales', 'Operations', 'Design', 'Legal']
const COLORS = ['bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700', 'bg-green-50 text-green-700', 'bg-orange-50 text-orange-700', 'bg-pink-50 text-pink-700', 'bg-indigo-50 text-indigo-700']

export default function Departments() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [edit, setEdit] = useState<Department | null>(null)
  const canManage = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')

  const { data: depts, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data as Department[]),
  })

  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list().then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }) },
    onError: () => toast.error('Cannot delete — department has employees'),
  })

  const managers = (empData?.data as Employee[] || []).filter(e => e.status === 'ACTIVE')
  const managerMap = managers.reduce((acc, e) => ({ ...acc, [e.id]: e.full_name }), {} as Record<string, string>)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500"><span className="font-semibold text-gray-800">{depts?.length || 0}</span> departments</p>
        {canManage && (
          <button onClick={() => { setEdit(null); setShowModal(true) }} className="btn-primary">
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {!depts?.length ? (
        <EmptyState icon={Building2} title="No departments yet" description="Create departments to organize your team" action={canManage ? { label: 'Add Department', onClick: () => setShowModal(true) } : undefined} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map((dept, i) => (
            <div key={dept.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${COLORS[i % COLORS.length]}`}>
                  {dept.name.charAt(0)}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEdit(dept); setShowModal(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this department?')) deleteMut.mutate(dept.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{dept.name}</h3>
              {dept.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{dept.description}</p>}
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{dept.employee_count} employees</span>
                </div>
                {dept.manager_id && (
                  <span className="text-xs text-gray-400">{managerMap[dept.manager_id] || 'Manager'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <DeptModal onClose={() => setShowModal(false)} dept={edit} employees={managers} />
      )}
    </div>
  )
}

function DeptModal({ onClose, dept, employees }: { onClose: () => void; dept: Department | null; employees: Employee[] }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm({ defaultValues: dept || {} })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (dept) {
        await departmentApi.update(dept.id, data)
        toast.success('Department updated')
      } else {
        await departmentApi.create(data)
        toast.success('Department created')
      }
      qc.invalidateQueries({ queryKey: ['departments'] })
      onClose()
    } catch { toast.error('Error saving department') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title={dept ? 'Edit Department' : 'Add Department'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Department Name *</label>
          <input className="input" placeholder="e.g. Engineering" {...register('name', { required: true })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="What does this department do?" {...register('description')} />
        </div>
        <div>
          <label className="label">Manager</label>
          <select className="input" {...register('manager_id')}>
            <option value="">No manager</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : dept ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}
