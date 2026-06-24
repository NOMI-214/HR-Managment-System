import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, FileText, Download, Trash2, Plus } from 'lucide-react'
import { documentApi, employeeApi } from '../../services/api'
import { Employee } from '../../types'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { formatDate } from '../../utils'
import { useAuthStore } from '../../store/auth'

const DOC_TYPES = ['CONTRACT', 'CNIC', 'PASSPORT', 'OFFER_LETTER', 'EXPERIENCE_LETTER', 'CERTIFICATE', 'OTHER']

export default function Documents() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [selectedEmp, setSelectedEmp] = useState<string>('')
  const [showModal, setShowModal] = useState(false)

  const { data: emps } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list().then(r => r.data.data as Employee[]),
  })

  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents', selectedEmp],
    queryFn: () => documentApi.list(selectedEmp).then(r => r.data),
    enabled: !!selectedEmp,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => { toast.success('Document deleted'); qc.invalidateQueries({ queryKey: ['documents'] }) },
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select className="input h-9 text-sm w-auto min-w-[200px]" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
          <option value="">Select employee</option>
          {(emps || []).map((e: Employee) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        {selectedEmp && (
          <button onClick={() => setShowModal(true)} className="btn-primary h-9">
            <Plus size={15} /> Upload Document
          </button>
        )}
      </div>

      {!selectedEmp ? (
        <EmptyState icon={FileText} title="Select an employee" description="Choose an employee to view and manage their documents" />
      ) : isLoading ? <LoadingSpinner /> : !docs?.length ? (
        <EmptyState icon={FileText} title="No documents" description="Upload documents for this employee" action={{ label: 'Upload Document', onClick: () => setShowModal(true) }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {docs.map((doc: any) => (
            <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <a href={`http://localhost:8000${doc.file_url}`} target="_blank" download className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
                    <Download size={14} />
                  </a>
                  <button onClick={() => { if (confirm('Delete document?')) deleteMut.mutate(doc.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
              <span className="badge badge-blue mt-1">{doc.document_type}</span>
              <p className="text-xs text-gray-400 mt-2">{formatDate(doc.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedEmp && (
        <UploadModal onClose={() => setShowModal(false)} employeeId={selectedEmp} />
      )}
    </div>
  )
}

function UploadModal({ onClose, employeeId }: { onClose: () => void; employeeId: string }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ name: '', document_type: 'CONTRACT', description: '' })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a file'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('employee_id', employeeId)
      fd.append('name', form.name || file.name)
      fd.append('document_type', form.document_type)
      fd.append('description', form.description)
      fd.append('file', file)
      await documentApi.upload(fd)
      toast.success('Document uploaded')
      qc.invalidateQueries({ queryKey: ['documents'] })
      onClose()
    } catch { toast.error('Upload failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Upload Document" onClose={onClose} size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Document Name</label>
          <input className="input" placeholder="e.g. Employment Contract" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Document Type</label>
          <select className="input" value={form.document_type} onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">File *</label>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            {file ? <p className="text-sm font-medium text-gray-700">{file.name}</p> : <p className="text-sm text-gray-400">Click to select file</p>}
            <input id="file-input" type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </form>
    </Modal>
  )
}
