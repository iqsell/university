import {BrowserRouter, Routes, Route, Link, Navigate} from 'react-router-dom'
import {StudentsPage} from './pages/StudentsPage'
import {CoursesPage} from './pages/CoursesPage'
import {LoginPage} from './pages/LoginPage'
import {useAuth} from './hooks/useAuth'
import type {JSX} from 'react'
import { EnrollmentsPage } from './pages/EnrollmentsPage'
import { TeachersPage } from './pages/TeachersPage'
import { SchedulePage } from './pages/SchedulePage'
import { ExamsPage } from './pages/ExamsPage'
import { PaymentsPage } from './pages/PaymentsPage'

function PrivateRoute({children}: { children: JSX.Element }) {
    const {token} = useAuth()
    return token ? children : <Navigate to="/login"/>
}

function App() {
    const {token, logout} = useAuth()


    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-indigo-700 text-white p-4 shadow-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-6 flex-wrap">
                            <Link to="/" className="text-2xl font-bold">Университет</Link>
                            {token && (
                                <>
                                    <Link to="/students" className="hover:underline">Студенты</Link>
                                    <Link to="/teachers" className="hover:underline">Преподаватели</Link>
                                    <Link to="/courses" className="hover:underline">Курсы</Link>
                                    <Link to="/enrollments" className="hover:underline">Записи</Link>
                                    <Link to="/schedule" className="hover:underline">Расписание</Link>
                                    <Link to="/exams" className="hover:underline">Экзамены</Link>
                                    <Link to="/payments" className="hover:underline">Платежи</Link>
                                </>
                            )}
                        </div>
                        {token ? (
                            <button onClick={logout}
                                    className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg transition">
                                Выйти
                            </button>
                        ) : (
                            <Link to="/login"
                                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg transition">
                                Войти
                            </Link>
                        )}
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto p-6">
                    <Routes>
                        <Route path="/"
                               element={<h1 className="text-5xl font-bold text-center mt-20 text-indigo-700">Система
                                   управления университетом</h1>}/>
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/students/*" element={<PrivateRoute><StudentsPage/></PrivateRoute>}/>
                        <Route path="/teachers/*" element={<PrivateRoute><TeachersPage/></PrivateRoute>}/>
                        <Route path="/courses/*" element={<PrivateRoute><CoursesPage/></PrivateRoute>}/>
                        <Route path="/enrollments/*" element={<PrivateRoute><EnrollmentsPage/></PrivateRoute>}/>
                        <Route path="/schedule/*" element={<PrivateRoute><SchedulePage/></PrivateRoute>}/>
                        <Route path="/exams/*" element={<PrivateRoute><ExamsPage/></PrivateRoute>}/>
                        <Route path="/payments/*" element={<PrivateRoute><PaymentsPage/></PrivateRoute>}/>
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}

export default App