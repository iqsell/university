// src/api/client.ts — ЗАМЕНИ ВЕСЬ ФАЙЛ НА ЭТОТ!
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ВАЖНО: перехватываем ВСЕ запросы и добавляем токен
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

// Дополнительно: если токен протух — можно добавить рефреш, но пока не нужно

export default api