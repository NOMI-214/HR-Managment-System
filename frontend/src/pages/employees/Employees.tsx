import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, Eye, UserPlus } from 'lucide-react'
import { employeeApi, departmentApi } from '../../services/api'
import { Employee, Department } from '../../types'
import { getInitials, getStatusBadgeClass, formatDate } from '../../utils'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { useAuthStore } from '../../store/auth'

export default function Employees() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

  const canManage = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, deptFilter],
    queryFn: () => employeeApi.list({ search: search || undefined, department_id: deptFilter || undefined }).then(r => r.data),
  })

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => { toast.success('Employee deactivated'); qc.invalidateQueries({ queryKey: ['employees'] }) },
    onError: () => toast.error('Failed to deactivate'),
  })

  const deptMap = (depts as Department[] || []).reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {} as Record<string, string>)

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 h-9 text-sm"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input h-9 text-sm w-auto"
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {(depts as Department[] || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {canManage && (
          <button onClick={() => { setEditEmployee(null); setShowModal(true) }} className="btn-primary h-9">
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-semibold text-gray-800">{data?.total || 0}</span> employees found
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner /> : !data?.data?.length ? (
        <EmptyState icon={UserPlus} title="No employees yet" description="Add your first employee to get started" action={canManage ? { label: 'Add Employee', onClick: () => setShowModal(true) } : undefined} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Designation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {emp.avatar_url ? <img src={emp.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : getInitials(emp.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{emp.full_name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{deptMap[emp.department_id || ''] || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{emp.designation || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(emp.joining_date)}</td>
                    <td className="px-4 py-3.5">
                      <span className={getStatusBadgeClass(emp.status)}>{emp.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        {canManage && (
                          <>
                            <button onClick={() => { setEditEmployee(emp); setShowModal(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => { if (confirm('Deactivate this employee?')) deleteMut.mutate(emp.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Deactivate">
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          onClose={() => setShowModal(false)}
          employee={editEmployee}
          departments={depts as Department[] || []}
          employees={data?.data || []}
        />
      )}
    </div>
  )
}

function EmployeeModal({ onClose, employee, departments, employees }: { onClose: () => void; employee: Employee | null; departments: Department[]; employees: Employee[] }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: employee ? { ...employee, salary: employee.salary?.toString() } : {} })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (employee) {
        await employeeApi.update(employee.id, { ...data, salary: parseFloat(data.salary) || 0 })
        toast.success('Employee updated')
      } else {
        await employeeApi.create({ ...data, salary: parseFloat(data.salary) || 0 })
        toast.success('Employee added')
      }
      qc.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving employee')
    } finally { setLoading(false) }
  }

  return (
    <Modal open title={employee ? 'Edit Employee' : 'Add Employee'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input className="input" {...register('first_name', { required: true })} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" {...register('last_name', { required: true })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Department</label>
            <select className="input" {...register('department_id')}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Manager</label>
            <select className="input" {...register('manager_id')}>
              <option value="">No manager</option>
              {employees.filter(e => e.id !== employee?.id).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Designation</label>
            <input className="input" placeholder="e.g. Senior Developer" {...register('designation')} />
          </div>
          <div>
            <label className="label">Salary (PKR)</label>
            <input type="number" className="input" {...register('salary')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Joining Date</label>
            <input type="date" className="input" {...register('joining_date')} />
          </div>
          <div>
            <label className="label">Employment Type</label>
            <select className="input" {...register('employment_type')}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Gender</label>
            <select className="input" {...register('gender')}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" {...register('city')} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
