import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: '/_/backend',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = useAuthStore.getState().refreshToken
      if (refresh) {
        try {
          const { data } = await axios.post('http://localhost:8000/auth/refresh', { refresh_token: refresh })
          useAuthStore.getState().setToken(data.access_token)
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return api(error.config)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (d: any) => api.post('/auth/register', d),
  login: (d: any) => api.post('/auth/login', d),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (d: any) => api.post('/auth/reset-password', d),
  me: () => api.get('/auth/me'),
  changePassword: (d: any) => api.post('/auth/change-password', d),
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAttendanceTrend: () => api.get('/dashboard/attendance-trend'),
}

// Employees
export const employeeApi = {
  list: (params?: any) => api.get('/employees', { params }),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (d: any) => api.post('/employees', d),
  update: (id: string, d: any) => api.put(`/employees/${id}`, d),
  delete: (id: string) => api.delete(`/employees/${id}`),
  uploadAvatar: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/employees/${id}/avatar`, fd)
  },
}

// Departments
export const departmentApi = {
  list: () => api.get('/departments'),
  create: (d: any) => api.post('/departments', d),
  update: (id: string, d: any) => api.put(`/departments/${id}`, d),
  delete: (id: string) => api.delete(`/departments/${id}`),
}

// Attendance
export const attendanceApi = {
  clockIn: (d?: any) => api.post('/attendance/clock-in', d || {}),
  clockOut: (d?: any) => api.post('/attendance/clock-out', d || {}),
  breakStart: () => api.post('/attendance/break-start'),
  breakEnd: () => api.post('/attendance/break-end'),
  today: () => api.get('/attendance/today'),
  myHistory: (params?: any) => api.get('/attendance/my-history', { params }),
  companyReport: (params?: any) => api.get('/attendance/company-report', { params }),
}

// Leaves
export const leaveApi = {
  apply: (d: any) => api.post('/leaves', d),
  myLeaves: () => api.get('/leaves/my-leaves'),
  pending: () => api.get('/leaves/pending'),
  all: () => api.get('/leaves'),
  tlAction: (id: string, d: any) => api.put(`/leaves/${id}/tl-action`, d),
  hrAction: (id: string, d: any) => api.put(`/leaves/${id}/hr-action`, d),
}

// Payroll
export const payrollApi = {
  list: (params?: any) => api.get('/payroll', { params }),
  create: (d: any) => api.post('/payroll', d),
  myPayslips: () => api.get('/payroll/my-payslips'),
  markPaid: (id: string) => api.put(`/payroll/${id}/mark-paid`),
}

// Recruitment
export const recruitmentApi = {
  listJobs: () => api.get('/recruitment/jobs'),
  createJob: (d: any) => api.post('/recruitment/jobs', d),
  updateJob: (id: string, d: any) => api.put(`/recruitment/jobs/${id}`, d),
  deleteJob: (id: string) => api.delete(`/recruitment/jobs/${id}`),
  listCandidates: (jobId?: string) => api.get('/recruitment/candidates', { params: jobId ? { job_id: jobId } : undefined }),
  addCandidate: (d: any) => api.post('/recruitment/candidates', d),
  updateCandidateStatus: (id: string, d: any) => api.put(`/recruitment/candidates/${id}/status`, d),
  listInterviews: () => api.get('/recruitment/interviews'),
  scheduleInterview: (d: any) => api.post('/recruitment/interviews', d),
}

// Performance
export const performanceApi = {
  listReviews: () => api.get('/performance/reviews'),
  createReview: (d: any) => api.post('/performance/reviews', d),
  myReviews: () => api.get('/performance/my-reviews'),
  getGoals: () => api.get('/performance/goals'),
  createGoal: (d: any) => api.post('/performance/goals', d),
  updateGoal: (id: string, d: any) => api.put(`/performance/goals/${id}`, d),
}

// Notifications
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  unreadCount: () => api.get('/notifications/unread-count'),
}

// Documents
export const documentApi = {
  upload: (fd: FormData) => api.post('/documents', fd),
  list: (employeeId: string) => api.get(`/documents/${employeeId}`),
  delete: (id: string) => api.delete(`/documents/${id}`),
}

export default api
