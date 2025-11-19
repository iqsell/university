// src/pages/EnrollmentsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Enrollment, Student, Course } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchEnrollments = async (): Promise<Enrollment[]> => (await api.get('enrollments/')).data
const fetchStudents = async (): Promise<Student[]> => (await api.get('students/')).data
const fetchCourses = async (): Promise<Course[]> => (await api.get('courses/')).data

export function EnrollmentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: enrollments = [], isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: fetchEnrollments })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`enrollments/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка записей...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Записи на курсы</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium">
          + Записать студента
        </Link>
      </div>

      <div className="grid gap-6">
        {enrollments.map(e => (
          <div key={e.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
            <p className="text-xl"><strong>{e.student_name}</strong> → <strong>{e.course_name}</strong></p>
            <p className="text-gray-600">Дата записи: {new Date(e.enrollment_date).toLocaleDateString()}</p>
            <p>Оценка: <strong>{e.grade ?? '—'}</strong> • Зачтено: <strong>{e.passed ? 'Да' : 'Нет'}</strong></p>
            <button onClick={() => deleteMut.mutate(e.id)} className="mt-4 bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition">
              Отчислить с курса
            </button>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="create" element={<EnrollmentForm onClose={() => navigate('/enrollments')} />} />
      </Routes>
    </>
  )
}

interface EnrollmentFormProps { onClose: () => void }

function EnrollmentForm({ onClose }: EnrollmentFormProps) {
  const queryClient = useQueryClient()
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: fetchStudents })
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const [student, setStudent] = useState('')
  const [course, setCourse] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('enrollments/', { student: Number(student), course: Number(course) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      onClose()
    }
  })

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">Запись на курс</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-6">
        <select required value={student} onChange={e => setStudent(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Выберите студента</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <select required value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Выберите курс</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 text-xl font-medium">
          Записать
        </button>
      </form>
    </div>
  )
}