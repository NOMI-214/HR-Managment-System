export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'HR_MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  company_id: string
  avatar_url?: string
  is_verified: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  logo_url?: string
  is_active: boolean
  created_at: string
}

export interface Employee {
  id: string
  company_id: string
  department_id?: string
  manager_id?: string
  employee_id?: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone?: string
  designation?: string
  employment_type: string
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'
  joining_date?: string
  salary: number
  avatar_url?: string
  gender?: string
  city?: string
  country?: string
  date_of_birth?: string
  address?: string
  cnic?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  bank_account?: string
  bank_name?: string
  created_at: string
}

export interface Department {
  id: string
  company_id: string
  name: string
  description?: string
  manager_id?: string
  employee_count: number
  created_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  break_start?: string
  break_end?: string
  work_hours: number
  overtime_hours: number
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY'
  notes?: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  company_id: string
  leave_type: 'ANNUAL' | 'SICK' | 'CASUAL' | 'UNPAID'
  start_date: string
  end_date: string
  days_requested: number
  reason?: string
  status: 'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  rejection_reason?: string
  created_at: string
}

export interface Payroll {
  id: string
  employee_id: string
  month: number
  year: number
  basic_salary: number
  housing_allowance: number
  transport_allowance: number
  medical_allowance: number
  other_allowances: number
  bonus: number
  gross_salary: number
  income_tax: number
  social_security: number
  other_deductions: number
  total_deductions: number
  net_salary: number
  working_days: number
  present_days: number
  absent_days: number
  status: 'DRAFT' | 'PROCESSING' | 'PAID' | 'CANCELLED'
  paid_at?: string
  created_at: string
}

export interface JobPost {
  id: string
  title: string
  description?: string
  requirements?: string
  job_type: string
  status: 'OPEN' | 'CLOSED' | 'ON_HOLD'
  location?: string
  salary_min?: number
  salary_max?: number
  experience_years: number
  deadline?: string
  candidate_count: number
  created_at: string
}

export interface Candidate {
  id: string
  job_post_id: string
  name: string
  email: string
  phone?: string
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'TECHNICAL' | 'OFFER' | 'HIRED' | 'REJECTED'
  experience_years: number
  expected_salary?: number
  ai_score?: number
  notes?: string
  applied_at: string
  resume_url?: string
}

export interface Interview {
  id: string
  candidate_id: string
  job_post_id: string
  scheduled_at: string
  status: string
  meeting_link?: string
}

export interface PerformanceReview {
  id: string
  employee_id: string
  reviewer_id: string
  review_period: string
  year: number
  productivity_score: number
  communication_score: number
  teamwork_score: number
  attendance_score: number
  task_completion_score: number
  overall_score: number
  strengths?: string
  improvements?: string
  status: string
  created_at: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  progress: number
  status: string
  target_date?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link?: string
  created_at: string
}

export interface DashboardStats {
  total_employees: number
  new_hires_this_month: number
  attendance_rate: number
  today_present: number
  on_leave_today: number
  pending_leaves: number
  open_positions: number
  monthly_payroll_cost: number
  month: number
  year: number
}
