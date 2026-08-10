export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  preferred_language: string
  preferred_subject?: string
  explanation_level: string
  total_sessions: number
  total_messages: number
  quizzes_completed: number
  streak_days: number
  created_at?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export interface ChatSession {
  id: number
  title: string
  subject?: string
  language: string
  mode: string
  message_count: number
  created_at?: string
  updated_at?: string
}

export interface Message {
  id: number
  session_id: number
  role: 'user' | 'assistant'
  content: string
  language?: string
  subject?: string
  mode?: string
  created_at?: string
}

export interface QuizQuestion {
  id: number
  question_text: string
  options: Record<string, string>
  correct_answer?: string
  user_answer?: string
  is_correct?: boolean
  explanation?: string
  order_num: number
}

export interface Quiz {
  quiz_id: number
  title: string
  subject: string
  difficulty: string
  language: string
  total_questions: number
  score?: number
  completed?: boolean
  questions: QuizQuestion[]
}

export interface FlashCard {
  id: number
  front: string
  back: string
  subject: string
  confidence_level: number
  times_reviewed: number
}

export interface ProgressOverview {
  total_sessions: number
  total_messages: number
  quizzes_completed: number
  avg_quiz_score: number
  streak_days: number
  subject_stats: SubjectStat[]
  recent_activity: RecentActivity[]
  preferred_language: string
  explanation_level: string
}

export interface SubjectStat {
  subject: string
  sessions: number
  avg_quiz_score?: number
  quizzes_taken: number
}

export interface RecentActivity {
  date: string
  subject?: string
  title: string
}

export interface UploadedDocument {
  doc_id: string
  filename: string
  subject?: string
  uploaded_at?: string
}

export type Subject =
  | 'Electronics & Communication'
  | 'Computer Science'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Artificial Intelligence'
  | 'Machine Learning'
  | 'Data Structures'
  | 'Algorithms'
  | 'DBMS'
  | 'Operating Systems'
  | 'OOP'
  | 'Computer Networks'

export type Language =
  | 'English'
  | 'Hindi'
  | 'Bengali'
  | 'Tamil'
  | 'Telugu'
  | 'Marathi'
  | 'French'
  | 'Spanish'

export type ExplanationLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type ChatMode = 'chat' | 'quiz' | 'interview' | 'flashcard' | 'formula' | 'summary'

export interface StreamChunk {
  content?: string
  done?: boolean
  session_id?: number
  message_id?: number
}
