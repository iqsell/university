// src/pages/CoursesPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Course, Teacher } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchCourses = async (): Promise<Course[]> => (await api.get('courses/')).data
const fetchTeachers = async (): Promise<Teacher[]> => (await api.get('teachers/')).data

export function CoursesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`courses/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка курсов...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Курсы</h1>
        <Link
          to="create"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium"
        >
          + Добавить курс
        </Link>
      </div>

      <div className="grid gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
            <h3 className="text-2xl font-bold text-indigo-700">{course.name}</h3>
            <p className="text-gray-700 mt-2">{course.description || 'Без описания'}</p>
            <p className="mt-2">
              Кредиты: <strong>{course.credits}</strong> • Преподаватель:{' '}
              <strong>{course.teacher_name || 'Не назначен'}</strong>
            </p>
            <div className="mt-4 flex gap-4">
              <Link
                to={`edit/${course.id}`}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
              >
                Редактировать
              </Link>
              <button
                onClick={() => deleteMut.mutate(course.id)}
                className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="create" element={<CourseForm onClose={() => navigate('/courses')} />} />
        <Route path="edit/:id" element={<CourseForm onClose={() => navigate('/courses')} />} />
      </Routes>
    </>
  )
}

interface CourseFormProps {
  onClose: () => void
}

// Тип для отправки на сервер (teacher может быть null)
interface CourseCreateUpdate {
  name: string
  description: string
  credits: number
  teacher: number | null
}

function CourseForm({ onClose }: CourseFormProps) {
  const queryClient = useQueryClient()
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })

  const [form, setForm] = useState({
    name: '',
    description: '',
    credits: 3,
    teacher: '' // пустая строка = null
  })

  const mutation = useMutation({
    mutationFn: (data: CourseCreateUpdate) => {
      const isEdit = window.location.pathname.includes('edit')
      const id = isEdit ? window.location.pathname.split('/').pop() : undefined

      return isEdit && id
        ? api.put(`courses/${id}/`, data)
        : api.post('courses/', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const payload: CourseCreateUpdate = {
      ...form,
      credits: Number(form.credits),
      teacher: form.teacher === '' ? null : Number(form.teacher)
    }

    mutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">
        {window.location.pathname.includes('create') ? 'Новый курс' : 'Редактирование курса'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          placeholder="Название курса"
          required
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
        />

        <textarea
          placeholder="Описание (необязательно)"
          rows={4}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
        />

        <input
          type="number"
          min="1"
          max="20"
          required
          value={form.credits}
          onChange={e => setForm({ ...form, credits: Number(e.target.value) || 3 })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
        />

        <select
          value={form.teacher}
          onChange={e => setForm({ ...form, teacher: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
        >
          <option value="">Без преподавателя</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.full_name} ({t.position})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition text-xl font-medium disabled:opacity-70"
        >
          {mutation.isPending ? 'Сохранение...' : 'Сохранить курс'}
        </button>
      </form>
    </div>
  )
}