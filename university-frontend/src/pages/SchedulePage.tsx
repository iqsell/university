// src/pages/SchedulePage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Schedule, Course, Teacher } from '../types'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchSchedule = async () => (await api.get('schedules/')).data
const fetchCourses = async () => (await api.get('courses/')).data
const fetchTeachers = async () => (await api.get('teachers/')).data

const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const dayNames: Record<typeof daysOrder[number], string> = {
  monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда',
  thursday: 'Четверг', friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье'
}

export function SchedulePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: rawData = {}, isLoading } = useQuery({ queryKey: ['schedule'], queryFn: fetchSchedule })

  const schedule: Schedule[] = Array.isArray(rawData) ? rawData : (rawData.results || [])

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`schedules/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule'] })
  })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка расписания...</p>

  const sorted = [...schedule].sort((a, b) => {
    const dayDiff = daysOrder.indexOf(a.day_of_week as any) - daysOrder.indexOf(b.day_of_week as any)
    if (dayDiff !== 0) return dayDiff
    return a.start_time.localeCompare(b.start_time)
  })

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Расписание занятий</h1>
        <Link to="create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium shadow-lg">
          + Добавить пару
        </Link>
      </div>

      <div className="space-y-10">
        {daysOrder.map(day => {
          const lessons = sorted.filter(s => s.day_of_week === day)
          if (lessons.length === 0) return null
          return (
            <div key={day} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-3xl font-bold text-indigo-600 mb-6">{dayNames[day]}</h2>
              <div className="space-y-4">
                {lessons.map(s => (
                  <div key={s.id} className="border-l-4 border-indigo-600 pl-6 py-4 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white rounded-r-lg">
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">{s.course_name}</p>
                      <p className="text-lg text-gray-700">
                        {s.start_time.slice(0,5)} – {s.end_time.slice(0,5)} • Аудитория <strong>{s.room}</strong>
                      </p>
                      <p className="text-gray-600">Преподаватель: {s.teacher_name}</p>
                    </div>
                    <button onClick={() => deleteMut.mutate(s.id)} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium">
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

interface ScheduleFormData {
  course: number
  teacher: number
  room: string
  day_of_week: typeof daysOrder[number]
  start_time: string
  end_time: string
}

interface ScheduleFormProps { onClose: () => void }

function ScheduleForm({ onClose }: ScheduleFormProps) {
  const queryClient = useQueryClient()
  const { data: coursesRaw = {} } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const { data: teachersRaw = {} } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })

  const courses: Course[] = Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw.results || [])
  const teachers: Teacher[] = Array.isArray(teachersRaw) ? teachersRaw : (teachersRaw.results || [])

  const [form, setForm] = useState<ScheduleFormData>({
    course: 0,
    teacher: 0,
    room: '',
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '10:30'
  })

  const isEdit = window.location.pathname.includes('edit')

  const mutation = useMutation({
    mutationFn: (data: ScheduleFormData) => {
      const payload = { ...data, course: Number(data.course), teacher: Number(data.teacher) }
      if (isEdit) {
        const id = window.location.pathname.split('/').pop()
        return api.put(`schedules/${id}/`, payload)
      }
      return api.post('schedules/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.course && form.teacher && form.room) {
      mutation.mutate(form)
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-10">
        {isEdit ? 'Редактирование занятия' : 'Новое занятие'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <select required value={form.course} onChange={e => setForm({ ...form, course: Number(e.target.value) })} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          <option value="">Выберите курс</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select required value={form.teacher} onChange={e => setForm({ ...form, teacher: Number(e.target.value) })} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          <option value="">Выберите преподавателя</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
        <input placeholder="Аудитория (например, 301)" required value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-6 py-4 border-2 rounded-xl text-lg" />
        <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value as any })} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          {daysOrder.map(d => <option key={d} value={d}>{dayNames[d]}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-6">
          <input type="time" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-6 py-4 border-2 rounded-xl text-lg" />
          <input type="time" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-6 py-4 border-2 rounded-xl text-lg" />
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-5 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-70">
          {mutation.isPending ? 'Сохранение...' : 'Добавить в расписание'}
        </button>
      </form>
    </div>
  )
}