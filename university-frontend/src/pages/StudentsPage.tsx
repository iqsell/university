// src/pages/StudentsPage.tsx — РАБОЧАЯ ВЕРСИЯ (БЕЗ ОШИБОК!)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Student } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// DRF возвращает { results: [...] } из-за пагинации
const fetchStudents = async () => {
  const res = await api.get('students/')
  return res.data // ← может быть { results: [...] } или просто массив
}

export function StudentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: rawData = {}, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents
  })

  // Нормализуем данные: если results есть — берём его, иначе весь объект
  const students: Student[] = Array.isArray(rawData)
    ? rawData
    : (rawData.results || [])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`students/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка студентов...</p>
  if (error) return <p className="text-center text-red-600 text-xl">Ошибка загрузки: {(error as Error).message}</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Студенты</h1>
        <Link
          to="create"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium shadow-lg"
        >
          + Добавить студента
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-2xl text-gray-600">Студентов пока нет</p>
          <p className="text-lg mt-4">Нажмите кнопку выше, чтобы добавить первого!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition flex justify-between items-center border border-gray-100"
            >
              <div>
                <h3 className="text-3xl font-bold text-indigo-700">{student.full_name}</h3>
                <p className="text-xl text-gray-600 mt-2">
                  {student.email} • GPA: <strong className="text-indigo-600">{student.gpa}</strong> • {student.status}
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  to={`edit/${student.id}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => deleteMutation.mutate(student.id)}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Routes>
        <Route path="create" element={<StudentForm onSuccess={() => navigate('/students')} />} />
        <Route path="edit/:id" element={<StudentForm onSuccess={() => navigate('/students')} />} />
      </Routes>
    </>
  )
}

// Форма добавления/редактирования
interface StudentFormProps {
  onSuccess: () => void
}

function StudentForm({ onSuccess }: StudentFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    status: 'active' as 'active' | 'academic_leave' | 'expelled' | 'graduated',
    gpa: '0.00'
  })

  const isEdit = window.location.pathname.includes('edit')
  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      if (isEdit) {
        const id = window.location.pathname.split('/').pop()
        return api.put(`students/${id}/`, data)
      }
      return api.post('students/', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      onSuccess()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl border border-gray-200">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-10">
        {isEdit ? 'Редактирование студента' : 'Новый студент'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <input
          type="text"
          placeholder="ФИО студента"
          required
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        />

        <input
          type="number"
          step="0.01"
          min="0"
          max="4"
          placeholder="GPA (0.00 - 4.00)"
          required
          value={form.gpa}
          onChange={e => setForm({ ...form, gpa: e.target.value })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        />

        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value as any })}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        >
          <option value="active">Обучается</option>
          <option value="academic_leave">Академический отпуск</option>
          <option value="expelled">Отчислен</option>
          <option value="graduated">Выпускник</option>
        </select>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-5 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Сохранение...' : 'Сохранить студента'}
        </button>
      </form>
    </div>
  )
}