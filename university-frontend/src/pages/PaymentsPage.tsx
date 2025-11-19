// src/pages/PaymentsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Payment, Student } from '../types'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fetchPayments = async (): Promise<Payment[]> => (await api.get('payments/')).data
const fetchStudents = async (): Promise<Student[]> => (await api.get('students/')).data

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800'
}

export function PaymentsPage() {
  const navigate = useNavigate()
  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: fetchPayments })

  if (isLoading) return <p className="text-center text-2xl mt-20">Загрузка платежей...</p>

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Платежи</h1>
        <button onClick={() => navigate('create')} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium">
          + Создать платёж
        </button>
      </div>

      <div className="grid gap-6">
        {payments.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold">{p.student_name}</p>
                <p className="text-2xl font-semibold text-indigo-700">{p.amount} ₽</p>
                <p className="text-gray-600">Создан: {new Date(p.date_created).toLocaleDateString()}</p>
                {p.date_paid && <p className="text-green-600">Оплачен: {new Date(p.date_paid).toLocaleDateString()}</p>}
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[p.status] || 'bg-gray-100'}`}>
                {p.status === 'pending' ? 'Ожидает' : p.status === 'paid' ? 'Оплачено' : p.status === 'overdue' ? 'Просрочено' : 'Отменено'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="create" element={<PaymentForm onClose={() => navigate('/payments')} />} />
      </Routes>
    </>
  )
}

interface PaymentFormProps { onClose: () => void }

function PaymentForm({ onClose }: PaymentFormProps) {
  const queryClient = useQueryClient()
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: fetchStudents })
  const [student, setStudent] = useState('')
  const [amount, setAmount] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('payments/', { student: Number(student), amount: Number(amount), status: 'pending' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      onClose()
    }
  })

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">Новый платёж</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-6">
        <select required value={student} onChange={e => setStudent(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
          <option value="">Выберите студента</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <input type="number" placeholder="Сумма в рублях" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 text-xl font-medium">
          Создать платёж
        </button>
      </form>
    </div>
  )
}