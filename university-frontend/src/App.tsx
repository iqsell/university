// src/App.tsx — ЗАМЕНИ ВЕСЬ ФАЙЛ НА ЭТОТ!
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { StudentsPage } from './pages/StudentsPage'
import { TeachersPage } from './pages/TeachersPage'
import { CoursesPage } from './pages/CoursesPage'
import { EnrollmentsPage } from './pages/EnrollmentsPage'
import { SchedulePage } from './pages/SchedulePage'
import { ExamsPage } from './pages/ExamsPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { LoginPage } from './pages/LoginPage'
import { ReportsPage } from './pages/ReportsPage'
import { useAuth } from './hooks/useAuth'
import type { JSX } from 'react'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function App() {
  const { token, logout } = useAuth()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* ШАПКА */}
        <nav className="bg-indigo-800 text-white p-6 shadow-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-6 text-lg">
              <Link to="/" className="text-3xl font-bold hover:text-yellow-300 transition">Университет</Link>
              {token && (
                <>
                  <Link to="/students" className="hover:text-yellow-300 transition">Студенты</Link>
                  <Link to="/teachers" className="hover:text-yellow-300 transition">Преподаватели</Link>
                  <Link to="/courses" className="hover:text-yellow-300 transition">Курсы</Link>
                  <Link to="/enrollments" className="hover:text-yellow-300 transition">Записи</Link>
                  <Link to="/schedule" className="hover:text-yellow-300 transition">Расписание</Link>
                  <Link to="/exams" className="hover:text-yellow-300 transition">Экзамены</Link>
                  <Link to="/payments" className="hover:text-yellow-300 transition">Платежи</Link>
                  <Link to="/reports" className="hover:text-yellow-300 transition font-bold">📊 Аналитика</Link>
                </>
              )}
            </div>
            {token ? (
              <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg font-medium transition">
                Выйти
              </button>
            ) : (
              <Link to="/login" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-lg font-medium transition">
                Войти
              </Link>
            )}
          </div>
        </nav>

        {/* КОНТЕНТ */}
        <main className="max-w-7xl mx-auto p-8">
          <Routes>
            <Route path="/" element={<div className="text-center mt-20"><h1 className="text-6xl font-bold text-indigo-800">Система управления университетом</h1><p className="text-2xl mt-8 text-gray-600">Добро пожаловать!</p></div>} />
            <Route path="/login" element={<LoginPage />} />

            {/* Все защищённые маршруты */}
            <Route path="/students/*" element={<PrivateRoute><StudentsPage /></PrivateRoute>} />
            <Route path="/teachers/*" element={<PrivateRoute><TeachersPage /></PrivateRoute>} />
            <Route path="/courses/*" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
            <Route path="/enrollments/*" element={<PrivateRoute><EnrollmentsPage /></PrivateRoute>} />
            <Route path="/schedule/*" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
            <Route path="/exams/*" element={<PrivateRoute><ExamsPage /></PrivateRoute>} />
            <Route path="/payments/*" element={<PrivateRoute><PaymentsPage /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App