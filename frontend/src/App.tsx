import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUIStore, useAuthStore } from '@/store'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ChatPage from '@/pages/ChatPage'
import Mascot from '@/components/ui/Mascot'

// Everything past chat loads on demand, which keeps the first paint small.
const DashboardPage  = lazy(() => import('@/pages/DashboardPage'))
const QuizPage       = lazy(() => import('@/pages/QuizPage'))
const FlashcardsPage = lazy(() => import('@/pages/FlashcardsPage'))
const ProgressPage   = lazy(() => import('@/pages/ProgressPage'))
const DocumentsPage  = lazy(() => import('@/pages/DocumentsPage'))
const ProfilePage    = lazy(() => import('@/pages/ProfilePage'))
const ResourcesPage  = lazy(() => import('@/pages/ResourcesPage'))

function PageLoading() {
  return (
    <div className="h-full grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Mascot size={72} mood="thinking" />
        <p className="t-small">One sec…</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/chat" replace />
  return <>{children}</>
}

export default function App() {
  const isDarkMode = useUIStore((s) => s.isDarkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:sessionId" element={<ChatPage />} />
          <Route path="dashboard"  element={<Suspense fallback={<PageLoading />}><DashboardPage /></Suspense>} />
          <Route path="quiz"       element={<Suspense fallback={<PageLoading />}><QuizPage /></Suspense>} />
          <Route path="flashcards" element={<Suspense fallback={<PageLoading />}><FlashcardsPage /></Suspense>} />
          <Route path="progress"   element={<Suspense fallback={<PageLoading />}><ProgressPage /></Suspense>} />
          <Route path="documents"  element={<Suspense fallback={<PageLoading />}><DocumentsPage /></Suspense>} />
          <Route path="profile"    element={<Suspense fallback={<PageLoading />}><ProfilePage /></Suspense>} />
          <Route path="resources"  element={<Suspense fallback={<PageLoading />}><ResourcesPage /></Suspense>} />
        </Route>

        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
