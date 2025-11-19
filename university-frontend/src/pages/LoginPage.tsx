import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('token/', { username, password })
      login(res.data.access)
      navigate('/students')
    } catch (err) {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-32 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center">Вход в систему</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          placeholder="Логин (например, admin)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          required
        />
        {error && <p className="text-red-500 text-center font-medium">{error}</p>}
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
          Войти
        </button>
      </form>
    </div>
  )
}