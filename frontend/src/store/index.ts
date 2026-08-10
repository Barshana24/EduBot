import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, ChatSession, Message, ChatMode, Language, Subject, ExplanationLevel } from '@/types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

interface UIStore {
  isDarkMode: boolean
  isSidebarOpen: boolean
  isSettingsOpen: boolean
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
}

interface ChatStore {
  activeSessionId: number | null
  sessions: ChatSession[]
  messages: Record<number, Message[]>
  streamingContent: string
  isStreaming: boolean
  selectedSubject: Subject | null
  selectedLanguage: Language
  selectedLevel: ExplanationLevel
  selectedMode: ChatMode
  useDocuments: boolean
  setActiveSession: (id: number | null) => void
  setSessions: (sessions: ChatSession[]) => void
  addSession: (session: ChatSession) => void
  removeSession: (id: number) => void
  setMessages: (sessionId: number, messages: Message[]) => void
  addMessage: (sessionId: number, message: Message) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setIsStreaming: (streaming: boolean) => void
  setSubject: (subject: Subject | null) => void
  setLanguage: (language: Language) => void
  setLevel: (level: ExplanationLevel) => void
  setMode: (mode: ChatMode) => void
  setUseDocuments: (use: boolean) => void
  clearStreaming: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'edubot-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDarkMode: true,
      isSidebarOpen: true,
      isSettingsOpen: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
    }),
    {
      name: 'edubot-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isDarkMode: state.isDarkMode, isSidebarOpen: state.isSidebarOpen }),
    }
  )
)

export const useChatStore = create<ChatStore>()((set) => ({
  activeSessionId: null,
  sessions: [],
  messages: {},
  streamingContent: '',
  isStreaming: false,
  selectedSubject: null,
  selectedLanguage: 'English',
  selectedLevel: 'Intermediate',
  selectedMode: 'chat',
  useDocuments: false,
  setActiveSession: (id) => set({ activeSessionId: id }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),
  setMessages: (sessionId, messages) =>
    set((state) => ({ messages: { ...state.messages, [sessionId]: messages } })),
  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    })),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setSubject: (subject) => set({ selectedSubject: subject }),
  setLanguage: (language) => set({ selectedLanguage: language }),
  setLevel: (level) => set({ selectedLevel: level }),
  setMode: (mode) => set({ selectedMode: mode }),
  setUseDocuments: (use) => set({ useDocuments: use }),
  clearStreaming: () => set({ streamingContent: '', isStreaming: false }),
}))
