// src/pages/ExamsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Exam, Course } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchExams = async (): Promise<Exam[]> => (await api.get('exams/')).data
const fetchCourses = async (): Promise<Course[]> => (await api.get('courses/')).data

export function ExamsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: exams = [], isLoading } = useQuery({ queryKey: ['exams'], queryFn: fetchExams })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`exams/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка экзаменов...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Экзамены</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium">
          + Назначить экзамен
        </Link>
      </div>

      <div className="grid gap-6">
        {exams.map(e => (
          <div key={e.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
            <h3 className="text-2xl font-bold text-indigo-700">{e.course_name}</h3>
            <p className="text-xl mt-2">{new Date(e.date).toLocaleString('ru-RU')}</p>
            <div className="mt-4 flex gap-4">
              <button onClick={() => deleteMut.mutate(e.id)} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition">
                Отменить экзамен
              </button>
            </div>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="create" element={<ExamForm onClose={() => navigate('/exams')} />} />
      </Routes>
    </>
  )
}

interface ExamFormProps { onClose: () => void }

function ExamForm({ onClose }: ExamFormProps) {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const [course, setCourse] = useState('')
  const [date, setDate] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('exams/', { course: Number(course), date: date + ':00Z' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      onClose()
    }
  })

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">Назначить экзамен</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-6">
        <select required value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Выберите курс</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 text-xl font-medium">
          Назначить экзамен
        </button>
      </form>
    </div>
  )
}