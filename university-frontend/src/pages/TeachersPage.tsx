// src/pages/TeachersPage.tsx — 100% РАБОЧАЯ ВЕРСИЯ
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Teacher, Department } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// DRF возвращает { results: [...] } при пагинации
const fetchTeachers = async () => {
  const res = await api.get('teachers/')
  return res.data
}

const fetchDepartments = async (): Promise<Department[]> => {
  const res = await api.get('departments/')
  return res.data.results || res.data
}

export function TeachersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: rawTeachers = {}, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachers
  })

  const teachers: Teacher[] = Array.isArray(rawTeachers)
    ? rawTeachers
    : (rawTeachers.results || [])

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`teachers/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] })
  })

  if (loadingTeachers) return <p className="text-center text-2xl mt-20">Загрузка преподавателей...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Преподаватели</h1>
        <Link
          to="create"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium shadow-lg"
        >
          + Добавить преподавателя
        </Link>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-2xl text-gray-600">Преподавателей пока нет</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-indigo-700 mb-3">{teacher.full_name}</h3>
              <div className="space-y-2 text-gray-700">
                <p>Должность: <strong className="text-indigo-600">{teacher.position}</strong></p>
                <p>Кафедра: <strong>{teacher.department_name || 'Не указана'}</strong></p>
                {teacher.email && <p>Email: <span className="text-blue-600">{teacher.email}</span></p>}
              </div>
              <div className="mt-6 flex gap-4">
                <Link
                  to={`edit/${teacher.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => deleteMut.mutate(teacher.id)}
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
        <Route path="create" element={<TeacherForm onClose={() => navigate('/teachers')} />} />
        <Route path="edit/:id" element={<TeacherForm onClose={() => navigate('/teachers')} />} />
      </Routes>
    </>
  )
}

// Типы для формы
interface TeacherCreateData {
  full_name: string
  email: string
  position: 'assistant' | 'lecturer' | 'associate_professor' | 'professor'
  department: number | null
}

interface TeacherFormProps {
  onClose: () => void
}

function TeacherForm({ onClose }: TeacherFormProps) {
  const queryClient = useQueryClient()
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments
  })

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    position: 'lecturer' as const,
    department: ''
  })

  const isEdit = window.location.pathname.includes('edit')

  const mutation = useMutation({
    mutationFn: (data: TeacherCreateData) => {
      const payload = {
        ...data,
        department: data.department === null ? null : Number(data.department)
      }
      if (isEdit) {
        const id = window.location.pathname.split('/').pop()
        return api.put(`teachers/${id}/`, payload)
      }
      return api.post('teachers/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: TeacherCreateData = {
      ...form,
      department: form.department === '' ? null : Number(form.department)
    }
    mutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl border border-gray-200">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-10">
        {isEdit ? 'Редактирование преподавателя' : 'Новый преподаватель'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <input
          type="text"
          placeholder="ФИО преподавателя"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        />

        <input
          type="email"
          placeholder="Email (необязательно)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        />

        <select
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value as never })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        >
          <option value="assistant">Ассистент</option>
          <option value="lecturer">Старший преподаватель</option>
          <option value="associate_professor">Доцент</option>
          <option value="professor">Профессор</option>
        </select>

        <select
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        >
          <option value="">Без кафедры</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-5 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-70"
        >
          {mutation.isPending ? 'Сохранение...' : 'Сохранить преподавателя'}
        </button>
      </form>
    </div>
  )
}