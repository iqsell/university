// src/pages/ReportsPage.tsx — 100% ЧИСТЫЙ КОД БЕЗ ANY!
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

interface TopStudent {
  id: number
  full_name: string
  email: string
  gpa: string
  rank_position?: number
}

interface Debtor {
  id: number
  full_name: string
  email: string
  debt: number
}

interface AboveAverageStudent {
  id: number
  full_name: string
  email: string
  gpa: string
  course_avg_grade: number
}

export function ReportsPage() {
  const top5 = useQuery<TopStudent[]>({
    queryKey: ['top5'],
    queryFn: () => api.get('reports/top-5-students/').then(r => r.data.top_5 || [])
  })

  const debtors = useQuery<Debtor[]>({
    queryKey: ['debtors'],
    queryFn: () => api.get('reports/debtors/').then(r => r.data.debtors || [])
  })

  const aboveAvg = useQuery<AboveAverageStudent[]>({
    queryKey: ['aboveAvg'],
    queryFn: () => api.get('reports/students-above-average/').then(r => r.data.results || [])
  })

  return (
    <div className="space-y-16 py-12">
      <h1 className="text-6xl font-bold text-center text-indigo-700 mb-16">Аналитика университета</h1>

      {/* ТОП-5 студентов */}
      <section className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
        <h2 className="text-4xl font-bold text-indigo-600 mb-10 flex items-center gap-4">
          <span className="text-5xl">🏆</span> Топ-5 студентов по GPA
        </h2>
        {top5.isLoading ? (
          <p className="text-center text-xl text-gray-500">Загрузка топа...</p>
        ) : top5.data!.length === 0 ? (
          <p className="text-center text-2xl text-gray-500">Нет данных</p>
        ) : (
          <div className="grid gap-8">
            {top5.data!.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl shadow-lg border border-indigo-100"
              >
                <div className="flex items-center gap-8">
                  <div className="text-6xl font-bold text-indigo-600 w-20 text-center">#{index + 1}</div>
                  <div>
                    <p className="text-3xl font-bold text-indigo-800">{student.full_name}</p>
                    <p className="text-xl text-gray-600">{student.email}</p>
                  </div>
                </div>
                <div className="text-6xl font-bold text-indigo-700">{student.gpa}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Студенты выше среднего */}
      <section className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
        <h2 className="text-4xl font-bold text-green-600 mb-10">
          <span className="text-5xl mr-4">🌟</span> GPA выше среднего по курсам
        </h2>
        {aboveAvg.isLoading ? (
          <p className="text-center text-xl text-gray-500">Загрузка лидеров...</p>
        ) : aboveAvg.data!.length === 0 ? (
          <p className="text-center text-2xl text-gray-500">Пока нет студентов выше среднего</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {aboveAvg.data!.map(student => (
              <div key={student.id} className="bg-green-50 p-8 rounded-2xl border-4 border-green-200 shadow-lg">
                <p className="text-2xl font-bold text-green-800">{student.full_name}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-xl">Общий GPA: <strong className="text-green-700">{student.gpa}</strong></p>
                  <p className="text-xl">Средний по курсам: <strong className="text-green-600">{student.course_avg_grade.toFixed(2)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Должники */}
      <section className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
        <h2 className="text-4xl font-bold text-red-600 mb-10">
          <span className="text-5xl mr-4">💸</span> Задолженности по оплате
        </h2>
        {debtors.isLoading ? (
          <p className="text-center text-xl text-gray-500">Загрузка должников...</p>
        ) : debtors.data!.length === 0 ? (
          <p className="text-center text-4xl text-green-600 font-bold mt-10">
            Долгов нет! Университет процветает! 🎉
          </p>
        ) : (
          <div className="grid gap-8">
            {debtors.data!.map(debtor => (
              <div
                key={debtor.id}
                className="bg-red-50 p-10 rounded-2xl border-4 border-red-300 shadow-xl flex justify-between items-center"
              >
                <div>
                  <p className="text-3xl font-bold text-red-800">{debtor.full_name}</p>
                  <p className="text-xl text-gray-700">{debtor.email}</p>
                </div>
                <p className="text-6xl font-bold text-red-600">
                  {debtor.debt.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}