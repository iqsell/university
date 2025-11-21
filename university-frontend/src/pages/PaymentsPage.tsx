// src/pages/PaymentsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Payment, Student } from '../types'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchPayments = async () => (await api.get('payments/')).data
const fetchStudents = async () => (await api.get('students/')).data

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800'
}

const statusText: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачено',
  overdue: 'Просрочено',
  canceled: 'Отменено'
}

export function PaymentsPage() {
  const navigate = useNavigate()
  const { data: rawData = {}, isLoading } = useQuery({ queryKey: ['payments'], queryFn: fetchPayments })
  const payments: Payment[] = Array.isArray(rawData) ? rawData : (rawData.results || [])

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка платежей...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Платежи</h1>
        <button onClick={() => navigate('create')} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium shadow-lg">
          + Создать платёж
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="text-center text-2xl text-gray-600 mt-20">Платежей пока нет</p>
      ) : (
        <div className="grid gap-8">
          {payments.map(p => (
            <div key={p.id} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{p.student_name}</p>
                  <p className="text-4xl font-bold text-indigo-600 mt-2">{p.amount} ₽</p>
                  <p className="text-gray-600 mt-2">Создан: {new Date(p.date_created).toLocaleDateString('ru-RU')}</p>
                  {p.date_paid && <p className="text-green-600 font-medium">Оплачен: {new Date(p.date_paid).toLocaleDateString('ru-RU')}</p>}
                </div>
                <span className={`px-6 py-3 rounded-full text-lg font-medium ${statusColors[p.status] || 'bg-gray-100'}`}>
                  {statusText[p.status] || p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Routes>
        <Route path="create" element={<PaymentForm onClose={() => navigate('/payments')} />} />
      </Routes>
    </>
  )
}

interface PaymentFormProps { onClose: () => void }

function PaymentForm({ onClose }: PaymentFormProps) {
  const queryClient = useQueryClient()
  const { data: studentsRaw = {} } = useQuery({ queryKey: ['students'], queryFn: fetchStudents })
  const students: Student[] = Array.isArray(studentsRaw) ? studentsRaw : (studentsRaw.results || [])

  const [studentId, setStudentId] = useState('')
  const [amount, setAmount] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('payments/', {
      student: Number(studentId),
      amount: Number(amount),
      status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-2xl shadow-2xl">
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-10">Новый платёж</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <select required value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-6 py-4 border-2 rounded-xl text-lg">
          <option value="">Выберите студента</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Сумма в рублях"
          required
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-6 py-4 border-2 rounded-xl text-lg"
        />
        <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-5 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-70">
          {mutation.isPending ? 'Создание...' : 'Создать платёж'}
        </button>
      </form>
    </div>
  )
}