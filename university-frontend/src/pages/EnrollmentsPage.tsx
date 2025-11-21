// src/pages/EnrollmentsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Enrollment, Student, Course } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchEnrollments = async () => (await api.get('enrollments/')).data
const fetchStudents = async () => (await api.get('students/')).data
const fetchCourses = async () => (await api.get('courses/')).data

export function EnrollmentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: rawData = {}, isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: fetchEnrollments })
  const enrollments: Enrollment[] = Array.isArray(rawData) ? rawData : (rawData.results || [])

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`enrollments/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка записей...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Записи на курсы</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium shadow-lg">
          + Записать студента
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <p className="text-center text-2xl text-gray-600 mt-20">Записей пока нет</p>
      ) : (
        <div className="grid gap-8">
          {enrollments.map(e => (
            <div key={e.id} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-700">
                    {e.student_name} → {e.course_name}
                  </p>
                  <p className="text-lg text-gray-600 mt-2">
                    Записан: {new Date(e.enrollment_date).toLocaleDateString('ru-RU')}
                  </p>
                  <p className="text-xl mt-3">
                    Оценка: <strong className={e.passed ? 'text-green-600' : 'text-red-600'}>
                      {e.grade ?? '—'} {e.passed ? '✓ Зачтено' : '✗ Не зачтено'}
                    </strong>
                  </p>
                </div>
                <button onClick={() => deleteMut.mutate(e.id)} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium">
                  Отчислить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Routes>
        <Route path="create" element={<EnrollmentForm onClose={() => navigate('/enrollments')} />} />
      </Routes>
    </>
  )
}

interface EnrollmentFormProps { onClose: () => void }

function EnrollmentForm({ onClose }: EnrollmentFormProps) {
  const queryClient = useQueryClient()
  const { data: studentsRaw = {} } = useQuery({ queryKey: ['students'], queryFn: fetchStudents })
  const { data: coursesRaw = {} } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })

  const students: Student[] = Array.isArray(studentsRaw) ? studentsRaw : (studentsRaw.results || [])
  const courses: Course[] = Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw.results || [])

  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('enrollments/', {
      student: Number(studentId),
      course: Number(courseId)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-10">Запись на курс</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <select required value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          <option value="">Выберите студента</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <select required value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          <option value="">Выберите курс</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-5 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-70">
          {mutation.isPending ? 'Запись...' : 'Записать на курс'}
        </button>
      </form>
    </div>
  )
}