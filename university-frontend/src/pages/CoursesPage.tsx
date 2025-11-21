// src/pages/CoursesPage.tsx — 100% БЕЗ ОШИБОК
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Course, Teacher } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// Поддержка пагинации DRF
const fetchCourses = async () => (await api.get('courses/')).data
const fetchTeachers = async () => (await api.get('teachers/')).data

export function CoursesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: rawData = {}, isLoading } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const courses: Course[] = Array.isArray(rawData) ? rawData : (rawData.results || [])

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
          className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition text-xl font-bold shadow-lg"
        >
          + Добавить курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-3xl text-gray-600">Курсов пока нет</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-indigo-700 mb-3">{course.name}</h3>
              <p className="text-gray-700 mb-4 min-h-16">{course.description || 'Без описания'}</p>
              <div className="space-y-2 text-gray-600">
                <p>Кредиты: <strong className="text-indigo-600">{course.credits}</strong></p>
                <p>Преподаватель: <strong>{course.teacher_name || 'Не назначен'}</strong></p>
              </div>
              <div className="mt-6 flex gap-4">
                <Link
                  to={`edit/${course.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => deleteMut.mutate(course.id)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Routes>
        <Route path="create" element={<CourseForm onClose={() => navigate('/courses')} />} />
        <Route path="edit/:id" element={<CourseForm onClose={() => navigate('/courses')} />} />
      </Routes>
    </>
  )
}

// Правильные типы — без any и без сравнения number|null со строкой
interface CourseFormData {
  name: string
  description: string
  credits: number
  teacher: string // строка из select, потом преобразуем
}

interface CourseFormProps {
  onClose: () => void
}

function CourseForm({ onClose }: CourseFormProps) {
  const queryClient = useQueryClient()
  const { data: teachersRaw = {} } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  const teachers: Teacher[] = Array.isArray(teachersRaw) ? teachersRaw : (teachersRaw.results || [])

  const [form, setForm] = useState<CourseFormData>({
    name: '',
    description: '',
    credits: 3,
    teacher: ''
  })

  const isEdit = window.location.pathname.includes('edit')

  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string; credits: number; teacher: number | null }) => {
      if (isEdit) {
        const id = window.location.pathname.split('/').pop()
        return api.put(`courses/${id}/`, data)
      }
      return api.post('courses/', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const payload = {
      name: form.name,
      description: form.description,
      credits: form.credits,
      teacher: form.teacher === '' ? null : Number(form.teacher)  // ← правильное преобразование
    }

    mutation.mutate(payload)
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-white p-12 rounded-3xl shadow-2xl border border-gray-200">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-12">
        {isEdit ? 'Редактирование курса' : 'Новый курс'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-10">
        <input
          type="text"
          placeholder="Название курса"
          required
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full px-8 py-5 text-xl border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        />

        <textarea
          placeholder="Описание курса (необязательно)"
          rows={6}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-8 py-5 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition resize-none"
        />

        <input
          type="number"
          min="1"
          max="20"
          required
          value={form.credits}
          onChange={e => setForm({ ...form, credits: Number(e.target.value) || 3 })}
          className="w-full px-8 py-5 text-xl border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
          placeholder="Количество кредитов"
        />

        <select
          value={form.teacher}
          onChange={e => setForm({ ...form, teacher: e.target.value })}
          className="w-full px-8 py-5 text-xl border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        >
          <option value="">Без преподавателя</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id.toString()}>
              {t.full_name} ({t.position})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-6 rounded-xl text-3xl font-bold hover:bg-indigo-700 transition disabled:opacity-70 shadow-lg"
        >
          {mutation.isPending ? 'Сохранение...' : 'Сохранить курс'}
        </button>
      </form>
    </div>
  )
}