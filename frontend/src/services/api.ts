import axios from 'axios'
import { useAuthStore } from '@/store'
import type {
  User, ChatSession, Message, Quiz, FlashCard,
  ProgressOverview, UploadedDocument
} from '@/types'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/api/auth/refresh`, { refresh_token: refreshToken })
          const { access_token } = res.data
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            refreshToken,
          )
          original.headers.Authorization = `Bearer ${access_token}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/auth/change-password', data),
}

export const chatAPI = {
  createSession: (data: { title?: string; subject?: string; language?: string }) =>
    api.post<ChatSession>('/chat/sessions', data),
  listSessions: (params?: { search?: string; subject?: string; skip?: number; limit?: number }) =>
    api.get<ChatSession[]>('/chat/sessions', { params }),
  getSessionMessages: (sessionId: number) =>
    api.get<{ session: ChatSession; messages: Message[] }>(`/chat/sessions/${sessionId}/messages`),
  deleteSession: (sessionId: number) => api.delete(`/chat/sessions/${sessionId}`),
  updateTitle: (sessionId: number, title: string) =>
    api.put(`/chat/sessions/${sessionId}/title`, null, { params: { title } }),
  healthCheck: () => api.get('/chat/health'),
}

export const quizAPI = {
  generate: (data: {
    subject: string
    topic?: string
    difficulty?: string
    language?: string
    num_questions?: number
  }) => api.post<Quiz>('/quiz/generate', data, { timeout: 120000 }),
  submit: (
    quizId: number,
    data: { answers: { question_id: number; answer: string }[]; time_taken_seconds?: number }
  ) => api.post(`/quiz/${quizId}/submit`, data),
  history: () => api.get('/quiz/history'),
  downloadPDF: (quizId: number) =>
    api.get(`/quiz/${quizId}/pdf`, { responseType: 'blob' }),
  generateFlashcards: (data: {
    subject: string
    topic?: string
    language?: string
    num_cards?: number
  }) => api.post('/quiz/flashcards/generate', data, { timeout: 120000 }),
  listFlashcards: (subject?: string) =>
    api.get<FlashCard[]>('/quiz/flashcards', { params: { subject } }),
  reviewFlashcard: (cardId: number, confidence: number) =>
    api.put(`/quiz/flashcards/${cardId}/review`, null, { params: { confidence } }),
}

export const notesAPI = {
  generateSummary: (sessionId: number, language?: string) =>
    api.post('/notes/summary', { session_id: sessionId, language }),
  generateStudyNotes: (data: { topic: string; subject: string; language?: string; level?: string }) =>
    api.post('/notes/generate', data),
  downloadSessionPDF: (sessionId: number) =>
    api.get(`/notes/session/${sessionId}/pdf`, { responseType: 'blob' }),
}

export const uploadAPI = {
  uploadDocument: (file: File, subject?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (subject) form.append('subject', subject)
    return api.post<UploadedDocument>('/upload/document', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listDocuments: () => api.get<{ documents: UploadedDocument[]; count: number }>('/upload/documents'),
  deleteDocument: (docId: string) => api.delete(`/upload/document/${docId}`),
}

export const progressAPI = {
  overview: () => api.get<ProgressOverview>('/progress/overview'),
  subjects: () => api.get('/progress/subjects'),
}

export default api
