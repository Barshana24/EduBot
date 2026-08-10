import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, LayoutDashboard, Brain, Layers,
  TrendingUp, FileText, User, LogOut, Moon, Sun,
  Plus, Search, PanelLeftClose,
} from 'lucide-react'
import { useAuthStore, useUIStore, useChatStore } from '@/store'
import { chatAPI } from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectMeta, tint, EASE } from '@/lib/design'
import type { ChatSession } from '@/types'

const NAV_ITEMS = [
  { to: '/chat',       icon: MessageSquare,   label: 'Chat' },
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/quiz',       icon: Brain,           label: 'Quiz' },
  { to: '/flashcards', icon: Layers,          label: 'Flashcards' },
  { to: '/progress',   icon: TrendingUp,      label: 'Progress' },
  { to: '/documents',  icon: FileText,        label: 'Documents' },
  { to: '/profile',    icon: User,            label: 'Profile' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleDarkMode, toggleSidebar } = useUIStore()
  const { activeSessionId, setActiveSession } = useChatStore()
  const [search, setSearch] = useState('')

  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await chatAPI.listSessions({ limit: 30 })
      return res.data
    },
    refetchInterval: 15000,
  })

  const filtered = sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))

  const handleNewChat = () => {
    navigate('/chat')
    setActiveSession(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('See you soon!')
  }

  const initial = user?.username?.[0]?.toUpperCase() || 'E'

  return (
    <aside className="w-[264px] h-full flex flex-col overflow-hidden" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4 flex-shrink-0">
        <div
          className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl relative"
          style={{ background: 'linear-gradient(160deg, #9C6B3B, #7A4A22)' }}
        >
          <div className="w-7 h-7 rounded-full bg-[#FBF6EA] flex items-center justify-center flex-shrink-0">
            <span style={{ fontSize: 14 }}>📖</span>
          </div>
          <span className="font-display text-base font-semibold" style={{ color: '#FBF6EA' }}>EduBot</span>
        </div>
        <button onClick={toggleSidebar} className="icon-btn" style={{ color: 'var(--sidebar-text-mid)' }} aria-label="Collapse sidebar">
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Primary action */}
      <div className="px-4 pb-3 flex-shrink-0">
        <motion.button onClick={handleNewChat} whileTap={{ scale: 0.97 }} className="btn-primary w-full py-2.5 text-[13px]">
          <Plus size={15} strokeWidth={3} />
          New chat
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1 flex-shrink-0">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          return (
            <button key={item.to} onClick={() => navigate(item.to)} className={`sidebar-item ${active ? 'active' : ''}`}>
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: '#FBF6EA' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon size={16} strokeWidth={2.25} className="relative z-10" />
              <span className="relative z-10 flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* History */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col mt-4 px-4">
        <div className="relative mb-2.5 flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--sidebar-text-mid)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#FBF6EA' }}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-1 pb-2 -mr-1 pr-1">
          {filtered.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs font-bold" style={{ color: 'var(--sidebar-text-mid)' }}>
                {search ? 'Nothing matches that search.' : 'No conversations yet.'}
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {filtered.map((session, i) => {
              const meta = subjectMeta(session.subject)
              const Icon = meta.icon
              const isActive = activeSessionId === session.id
              return (
                <motion.button
                  key={session.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2), ease: EASE }}
                  onClick={() => { setActiveSession(session.id); navigate(`/chat/${session.id}`) }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5"
                  style={{ background: isActive ? '#FBF6EA' : 'transparent' }}
                >
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tint(meta.accent, isActive ? 0.5 : 0.28) }}>
                    <Icon size={12} color={isActive ? '#3A3226' : '#FBF6EA'} strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-xs font-bold truncate" style={{ color: isActive ? '#3A3226' : '#FBF6EA' }}>{session.title}</span>
                  </span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Account */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0" style={{ background: '#E0A85C', color: '#3A3226' }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold truncate" style={{ color: '#FBF6EA' }}>{user?.full_name || user?.username}</p>
          </div>
          <button onClick={toggleDarkMode} className="icon-btn !p-1.5" style={{ color: 'var(--sidebar-text-mid)' }} aria-label={isDarkMode ? 'Day mode' : 'Dusk mode'}>
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={handleLogout} className="icon-btn !p-1.5" style={{ color: 'var(--sidebar-text-mid)' }} aria-label="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
