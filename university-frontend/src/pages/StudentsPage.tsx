import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Student } from '../types'  // ← type-only import
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchStudents = async (): Promise<Student[]> => {
  const res = await api.get('students/')
  return res.data
}

export function StudentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()  // ← используем!
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`students/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] })
  })

  if (isLoading) return <p className="text-center text-xl mt-10">Загрузка студентов...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Студенты</h1>
        <Link
          to="create"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium"
        >
          + Добавить студента
        </Link>
      </div>

      <div className="grid gap-6">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center hover:shadow-xl transition"
          >
            <div>
              <h3 className="text-2xl font-bold text-indigo-700">{student.full_name}</h3>
              <p className="text-gray-600 mt-1">
                {student.email} • GPA: <strong>{student.gpa}</strong> • {student.status}
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                to={`edit/${student.id}`}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
              >
                Редактировать
              </Link>
              <button
                onClick={() => deleteMutation.mutate(student.id)}
                className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="create" element={<StudentForm onSuccess={() => navigate('/students')} />} />
        <Route path="edit/:id" element={<StudentForm onSuccess={() => navigate('/students')} />} />
      </Routes>
    </>
  )
}

interface StudentFormProps {
  onSuccess: () => void
}

function StudentForm({ onSuccess }: StudentFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    status: 'active' as const,
    gpa: '0.00'
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const path = window.location.pathname
      if (path.includes('create')) {
        return api.post('students/', data)
      } else {
        const id = path.split('/').pop()
        return api.put(`students/${id}/`, data)
      }
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
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">
        {window.location.pathname.includes('create') ? 'Новый студент' : 'Редактирование студента'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          placeholder="ФИО"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          max="4"
          placeholder="GPA (0.00 - 4.00)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          onChange={(e) => setForm({ ...form, gpa: e.target.value })}
        />
        <select
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          onChange={(e) => setForm({ ...form, status: e.target.value as never })}
        >
          <option value="active">Обучается</option>
          <option value="academic_leave">Академический отпуск</option>
          <option value="expelled">Отчислен</option>
          <option value="graduated">Выпускник</option>
        </select>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition text-xl font-medium disabled:opacity-70"
        >
          {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}