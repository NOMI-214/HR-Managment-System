import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { Plus, Briefcase, Users, Calendar, MapPin, ChevronRight, X } from 'lucide-react'
import { recruitmentApi, departmentApi } from '../../services/api'
import { JobPost, Candidate } from '../../types'
import Modal from '../../components/shared/Modal'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { formatDate, getStatusBadgeClass, formatCurrency } from '../../utils'

const CANDIDATE_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'TECHNICAL', 'OFFER', 'HIRED', 'REJECTED']
const STAGE_COLORS: Record<string, string> = {
  APPLIED: 'bg-gray-100 text-gray-700', SCREENING: 'bg-blue-50 text-blue-700',
  INTERVIEW: 'bg-purple-50 text-purple-700', TECHNICAL: 'bg-orange-50 text-orange-700',
  OFFER: 'bg-yellow-50 text-yellow-700', HIRED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
}

export default function Recruitment() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'jobs' | 'candidates' | 'interviews'>('jobs')
  const [showJobModal, setShowJobModal] = useState(false)
  const [showCandModal, setShowCandModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => recruitmentApi.listJobs().then(r => r.data as JobPost[]),
  })

  const { data: candidates } = useQuery({
    queryKey: ['candidates', selectedJob],
    queryFn: () => recruitmentApi.listCandidates(selectedJob || undefined).then(r => r.data as Candidate[]),
    enabled: tab === 'candidates',
  })

  const { data: interviews } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => recruitmentApi.listInterviews().then(r => r.data),
    enabled: tab === 'interviews',
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => recruitmentApi.updateCandidateStatus(id, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['candidates'] }) },
    onError: () => toast.error('Error'),
  })

  const closeJob = useMutation({
    mutationFn: (id: string) => recruitmentApi.deleteJob(id),
    onSuccess: () => { toast.success('Job closed'); qc.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: () => toast.error('Error'),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['jobs', 'candidates', 'interviews'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === 'candidates' && <button onClick={() => setShowCandModal(true)} className="btn-secondary h-9"><Plus size={15} /> Add Candidate</button>}
          {tab === 'jobs' && <button onClick={() => setShowJobModal(true)} className="btn-primary h-9"><Plus size={15} /> Post Job</button>}
        </div>
      </div>

      {/* Jobs tab */}
      {tab === 'jobs' && (
        isLoading ? <LoadingSpinner /> : !jobs?.length ? (
          <EmptyState icon={Briefcase} title="No job postings" description="Create your first job post" action={{ label: 'Post a Job', onClick: () => setShowJobModal(true) }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin size={11} />{job.location || 'Remote'}</span>
                      <span>{job.job_type?.replace('_', ' ')}</span>
                      {job.experience_years > 0 && <span>{job.experience_years}+ yrs</span>}
                    </div>
                  </div>
                  <span className={`badge ${job.status === 'OPEN' ? 'badge-green' : 'badge-gray'}`}>{job.status}</span>
                </div>
                {job.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{job.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users size={12} />{job.candidate_count} candidates</span>
                    {job.salary_min && <span>{formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setSelectedJob(job.id); setTab('candidates') }} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5">
                      View <ChevronRight size={12} />
                    </button>
                    <button onClick={() => { if (confirm('Close this job?')) closeJob.mutate(job.id) }} className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors ml-2">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Candidates tab */}
      {tab === 'candidates' && (
        <div className="space-y-4">
          {selectedJob && (
            <div className="flex items-center gap-2">
              <select className="input h-9 text-sm w-auto" value={selectedJob || ''} onChange={e => setSelectedJob(e.target.value || null)}>
                <option value="">All Candidates</option>
                {jobs?.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          )}

          {/* Kanban-style pipeline */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {CANDIDATE_STAGES.filter(s => s !== 'REJECTED').map(stage => {
                const stageCands = (candidates || []).filter(c => c.status === stage)
                return (
                  <div key={stage} className="w-56 flex-shrink-0">
                    <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${STAGE_COLORS[stage]}`}>
                      <span className="text-xs font-semibold">{stage}</span>
                      <span className="text-xs font-bold">{stageCands.length}</span>
                    </div>
                    <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                      {stageCands.map(c => (
                        <div key={c.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                          <p className="text-xs font-semibold text-gray-800 mb-1">{c.name}</p>
                          <p className="text-xs text-gray-400 mb-2">{c.email}</p>
                          {c.ai_score && <div className="flex items-center gap-1 mb-2"><span className="text-xs text-green-600 font-medium">AI: {c.ai_score}%</span></div>}
                          <select
                            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                            value={c.status}
                            onChange={e => updateStatus.mutate({ id: c.id, status: e.target.value })}
                          >
                            {CANDIDATE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interviews tab */}
      {tab === 'interviews' && (
        <div className="space-y-3">
          {!interviews?.length ? (
            <EmptyState icon={Calendar} title="No interviews scheduled" description="Schedule interviews for candidates" />
          ) : (
            interviews.map((i: any) => (
              <div key={i.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Interview Scheduled</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(i.scheduled_at).toLocaleString()}</p>
                  {i.meeting_link && <a href={i.meeting_link} target="_blank" className="text-xs text-primary-600 hover:underline mt-0.5 block">{i.meeting_link}</a>}
                </div>
                <span className={`badge ${i.status === 'SCHEDULED' ? 'badge-blue' : 'badge-green'}`}>{i.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {showJobModal && <JobModal onClose={() => setShowJobModal(false)} />}
      {showCandModal && <CandidateModal onClose={() => setShowCandModal(false)} jobs={jobs || []} />}
    </div>
  )
}

function JobModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then(r => r.data) })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await recruitmentApi.createJob({ ...data, salary_min: Number(data.salary_min) || null, salary_max: Number(data.salary_max) || null, experience_years: Number(data.experience_years) || 0 })
      toast.success('Job posted!')
      qc.invalidateQueries({ queryKey: ['jobs'] })
      onClose()
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Post New Job" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Job Title *</label>
          <input className="input" placeholder="e.g. Senior React Developer" {...register('title', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Department</label>
            <select className="input" {...register('department_id')}>
              <option value="">None</option>
              {(depts || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job Type</label>
            <select className="input" {...register('job_type')}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} {...register('description')} />
        </div>
        <div>
          <label className="label">Requirements</label>
          <textarea className="input resize-none" rows={3} placeholder="Skills, qualifications..." {...register('requirements')} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Karachi" {...register('location')} />
          </div>
          <div>
            <label className="label">Min Salary</label>
            <input type="number" className="input" {...register('salary_min')} />
          </div>
          <div>
            <label className="label">Max Salary</label>
            <input type="number" className="input" {...register('salary_max')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Experience (years)</label>
            <input type="number" className="input" {...register('experience_years')} />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input" {...register('deadline')} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Job'}</button>
        </div>
      </form>
    </Modal>
  )
}

function CandidateModal({ onClose, jobs }: { onClose: () => void; jobs: JobPost[] }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await recruitmentApi.addCandidate({ ...data, experience_years: Number(data.experience_years) || 0 })
      toast.success('Candidate added')
      qc.invalidateQueries({ queryKey: ['candidates'] })
      onClose()
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open title="Add Candidate" onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Job Position *</label>
          <select className="input" {...register('job_post_id', { required: true })}>
            <option value="">Select job</option>
            {jobs.filter(j => j.status === 'OPEN').map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Name *</label><input className="input" {...register('name', { required: true })} /></div>
          <div><label className="label">Email *</label><input type="email" className="input" {...register('email', { required: true })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
          <div><label className="label">Experience (years)</label><input type="number" className="input" {...register('experience_years')} /></div>
        </div>
        <div><label className="label">Expected Salary</label><input type="number" className="input" {...register('expected_salary')} /></div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Candidate'}</button>
        </div>
      </form>
    </Modal>
  )
}
