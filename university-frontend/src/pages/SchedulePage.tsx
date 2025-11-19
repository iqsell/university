// src/pages/SchedulePage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Schedule, Course, Teacher } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchSchedule = async (): Promise<Schedule[]> => (await api.get('schedules/')).data
const fetchCourses = async (): Promise<Course[]> => (await api.get('courses/')).data
const fetchTeachers = async (): Promise<Teacher[]> => (await api.get('teachers/')).data

const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const dayNames: Record<string, string> = {
  monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда',
  thursday: 'Четверг', friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье'
}

export function SchedulePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: schedule = [], isLoading } = useQuery({ queryKey: ['schedule'], queryFn: fetchSchedule })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`schedules/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка расписания...</p>

  const sorted = [...schedule].sort((a, b) => {
    const dayDiff = daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
    if (dayDiff !== 0) return dayDiff
    return a.start_time.localeCompare(b.start_time)
  })

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Расписание занятий</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium">
          + Добавить пару
        </Link>
      </div>

      <div className="space-y-8">
        {daysOrder.map(day => {
          const lessons = sorted.filter(s => s.day_of_week === day)
          if (lessons.length === 0) return null
          return (
            <div key={day} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">{dayNames[day]}</h2>
              <div className="grid gap-4">
                {lessons.map(s => (
                  <div key={s.id} className="border-l-4 border-indigo-600 pl-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-xl font-semibold">{s.course_name}</p>
                      <p className="text-gray-700">{s.start_time.slice(0,5)} – {s.end_time.slice(0,5)} • Аудитория: <strong>{s.room}</strong></p>
                      <p className="text-gray-600">Преподаватель: {s.teacher_name}</p>
                    </div>
                    <button onClick={() => deleteMut.mutate(s.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Routes>
        <Route path="create" element={<ScheduleForm onClose={() => navigate('/schedule')} />} />
        <Route path="edit/:id" element={<ScheduleForm onClose={() => navigate('/schedule')} />} />
      </Routes>
    </>
  )
}

interface ScheduleFormProps { onClose: () => void }

function ScheduleForm({ onClose }: ScheduleFormProps) {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  const [form, setForm] = useState({ course: '', teacher: '', room: '', day_of_week: 'monday', start_time: '09:00', end_time: '10:30' })

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const isEdit = window.location.pathname.includes('edit')
      const id = isEdit ? window.location.pathname.split('/').pop() : undefined
      return isEdit && id ? api.put(`schedules/${id}/`, data) : api.post('schedules/', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      onClose()
    }
  })

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">Занятие в расписании</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-6">
        <select required value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Выберите курс</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select required value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Выберите преподавателя</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
        <input placeholder="Аудитория" required value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
        <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
          {daysOrder.map(d => <option key={d} value={d}>{dayNames[d]}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input type="time" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          <input type="time" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 text-xl font-medium">
          Сохранить в расписание
        </button>
      </form>
    </div>
  )
}