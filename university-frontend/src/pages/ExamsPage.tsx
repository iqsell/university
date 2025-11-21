// src/pages/ExamsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Exam, Course } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchExams = async () => (await api.get('exams/')).data
const fetchCourses = async () => (await api.get('courses/')).data

export function ExamsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: rawData = {}, isLoading } = useQuery({ queryKey: ['exams'], queryFn: fetchExams })
  const exams: Exam[] = Array.isArray(rawData) ? rawData : (rawData.results || [])

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`exams/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка экзаменов...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Экзамены</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium shadow-lg">
          + Назначить экзамен
        </Link>
      </div>

      {exams.length === 0 ? (
        <p className="text-center text-2xl text-gray-600 mt-20">Экзаменов пока нет</p>
      ) : (
        <div className="grid gap-8">
          {exams.map(e => (
            <div key={e.id} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border border-gray-100">
              <h3 className="text-3xl font-bold text-indigo-700">{e.course_name}</h3>
              <p className="text-2xl mt-4 text-gray-700">
                📅 {new Date(e.date).toLocaleString('ru-RU', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
              <button onClick={() => deleteMut.mutate(e.id)} className="mt-6 bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-medium">
                Отменить экзамен
              </button>
            </div>
          ))}
        </div>
      )}

      <Routes>
        <Route path="create" element={<ExamForm onClose={() => navigate('/exams')} />} />
      </Routes>
    </>
  )
}

interface ExamFormProps { onClose: () => void }

function ExamForm({ onClose }: ExamFormProps) {
  const queryClient = useQueryClient()
  const { data: coursesRaw = {} } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const courses: Course[] = Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw.results || [])

  const [courseId, setCourseId] = useState('')
  const [dateTime, setDateTime] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('exams/', {
      course: Number(courseId),
      date: new Date(dateTime).toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-10">Назначить экзамен</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <select required value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          <option value="">Выберите курс</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="datetime-local"
          required
          value={dateTime}
          onChange={e => setDateTime(e.target.value)}
          className="w-full px-6 py-4 border-2 rounded-xl text-lg"
        />
        <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-5 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-70">
          {mutation.isPending ? 'Назначение...' : 'Назначить экзамен'}
        </button>
      </form>
    </div>
  )
}