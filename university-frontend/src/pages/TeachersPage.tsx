// src/pages/TeachersPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Teacher, Department } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchTeachers = async (): Promise<Teacher[]> => (await api.get('teachers/')).data
const fetchDepartments = async (): Promise<Department[]> => (await api.get('departments/')).data

export function TeachersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: teachers = [], isLoading } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`teachers/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка преподавателей...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Преподаватели</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium">
          + Добавить
        </Link>
      </div>

      <div className="grid gap-6">
        {teachers.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
            <h3 className="text-2xl font-bold text-indigo-700">{t.full_name}</h3>
            <p className="text-gray-700">Должность: <strong>{t.position}</strong></p>
            <p>Кафедра: <strong>{t.department_name || 'Не указана'}</strong></p>
            {t.email && <p>Email: {t.email}</p>}
            <div className="mt-4 flex gap-4">
              <Link to={`edit/${t.id}`} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition">
                Редактировать
              </Link>
              <button onClick={() => deleteMut.mutate(t.id)} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition">
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="create" element={<TeacherForm onClose={() => navigate('/teachers')} />} />
        <Route path="edit/:id" element={<TeacherForm onClose={() => navigate('/teachers')} />} />
      </Routes>
    </>
  )
}

interface TeacherFormProps {
  onClose: () => void
}

function TeacherForm({ onClose }: TeacherFormProps) {
  const queryClient = useQueryClient()
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments })
  const [form, setForm] = useState({ full_name: '', email: '', position: 'lecturer', department: '' })

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const isEdit = window.location.pathname.includes('edit')
      const id = isEdit ? window.location.pathname.split('/').pop() : undefined
      const payload = { ...data, department: data.department === '' ? null : Number(data.department) }
      return isEdit && id ? api.put(`teachers/${id}/`, payload) : api.post('teachers/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      onClose()
    }
  })

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">Преподаватель</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-6">
        <input placeholder="ФИО" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        <input placeholder="Email (необязательно)" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-4 py-3 border rounded-lg">
          <option value="assistant">Ассистент</option>
          <option value="lecturer">Старший преподаватель</option>
          <option value="associate_professor">Доцент</option>
          <option value="professor">Профессор</option>
        </select>
        <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Без кафедры</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 text-xl font-medium">
          Сохранить
        </button>
      </form>
    </div>
  )
}