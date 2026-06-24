import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { employeeApi, departmentApi } from '../../services/api'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatDate, formatCurrency, getInitials, getStatusBadgeClass } from '../../utils'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Building2, User, Award } from 'lucide-react'

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: emp, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.get(id!).then(r => r.data),
  })

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner />
  if (!emp) return <div className="text-center py-10 text-gray-500">Employee not found</div>

  const deptName = (depts || []).find((d: any) => d.id === emp.department_id)?.name

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={16} /> Back to Employees
      </button>

      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {emp.avatar_url ? <img src={emp.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : getInitials(emp.full_name)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{emp.full_name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{emp.designation || 'No designation'}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {emp.employee_id || '—'}</p>
              </div>
              <span className={getStatusBadgeClass(emp.status)}>{emp.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Contact Information</h3>
          {[
            { icon: Mail, label: 'Email', value: emp.email },
            { icon: Phone, label: 'Phone', value: emp.phone || '—' },
            { icon: MapPin, label: 'Address', value: [emp.address, emp.city, emp.country].filter(Boolean).join(', ') || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-700 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Employment Details</h3>
          {[
            { icon: Building2, label: 'Department', value: deptName || '—' },
            { icon: User, label: 'Employment Type', value: emp.employment_type?.replace('_', ' ') || '—' },
            { icon: Calendar, label: 'Joining Date', value: formatDate(emp.joining_date) },
            { icon: DollarSign, label: 'Salary', value: formatCurrency(emp.salary) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-700 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {(emp.emergency_contact_name || emp.bank_account) && (
          <div className="card p-5 space-y-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {emp.emergency_contact_name && (
                <div>
                  <p className="text-xs text-gray-400">Emergency Contact</p>
                  <p className="text-sm font-medium text-gray-700">{emp.emergency_contact_name}</p>
                  <p className="text-xs text-gray-500">{emp.emergency_contact_phone}</p>
                </div>
              )}
              {emp.bank_account && (
                <div>
                  <p className="text-xs text-gray-400">Bank Account</p>
                  <p className="text-sm font-medium text-gray-700">{emp.bank_name}</p>
                  <p className="text-xs text-gray-500">{emp.bank_account}</p>
                </div>
              )}
              {emp.cnic && (
                <div>
                  <p className="text-xs text-gray-400">CNIC</p>
                  <p className="text-sm font-medium text-gray-700">{emp.cnic}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
