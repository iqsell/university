// src/types/index.ts
export interface Student {
  id: number
  full_name: string
  email: string
  status: 'active' | 'academic_leave' | 'expelled' | 'graduated'
  gpa: string
}

export interface Department {
  id: number
  name: string
}

export interface Teacher {
  id: number
  full_name: string
  email: string | null
  department: number | null
  department_name: string | null
  position: string
}

export interface Course {
  id: number
  name: string
  description: string
  credits: number
  teacher: number | null
  teacher_name: string | null
}

export interface Enrollment {
  id: number
  student: number
  course: number
  student_name: string
  course_name: string
  enrollment_date: string
  grade: number | null
  passed: boolean
}

export interface Schedule {
  id: number
  course: number
  teacher: number
  course_name: string
  teacher_name: string
  room: string
  day_of_week: string
  start_time: string
  end_time: string
}

export interface Exam {
  id: number
  course: number
  course_name: string
  date: string
}

export interface Payment {
  id: number
  student: number
  student_name: string
  amount: string
  status: 'pending' | 'paid' | 'overdue' | 'canceled'
  date_created: string
  date_paid: string | null
}