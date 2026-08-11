import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  FileText, Moon, Sun, LogOut, ChevronRight, Save, KeyRound, Settings2, X, Compass,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, progressAPI } from '@/services/api'
import { useAuthStore, useUIStore } from '@/store'
import {
  SUBJECTS, LANGUAGES, LEVELS, LEVEL_BARS, LANGUAGE_GLYPH,
  computeGameStats, C, EASE,
} from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import CountUp from '@/components/ui/CountUp'
import type { ProgressOverview } from '@/types'

interface ProfileForm {
  full_name: string
  preferred_language: string
  preferred_subject: string
  explanation_level: string
}
interface PwdForm { current_password: string; new_password: string }

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const [sheet, setSheet] = useState<'none' | 'settings' | 'password'>('none')

  const { data: overview } = useQuery<ProgressOverview>({
    queryKey: ['progress-overview'],
    queryFn: async () => (await progressAPI.overview()).data,
  })

  const { register, handleSubmit, watch } = useForm<ProfileForm>({
    defaultValues: {
      full_name: user?.full_name || '',
      preferred_language: user?.preferred_language || 'English',
      preferred_subject: user?.preferred_subject || '',
      explanation_level: user?.explanation_level || 'Intermediate',
    },
  })
  const pwdForm = useForm<PwdForm>()

  const watchedLanguage = watch('preferred_language')
  const watchedLevel = watch('explanation_level')

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => authAPI.updateProfile(data),
    onSuccess: (res) => { updateUser(res.data); toast.success('Saved!'); setSheet('none') },
    onError: () => toast.error("Couldn't save your changes"),
  })

  const pwdMutation = useMutation({
    mutationFn: (data: PwdForm) => authAPI.changePassword(data),
    onSuccess: () => { toast.success('Password updated'); pwdForm.reset(); setSheet('none') },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Couldn't update your password")
    },
  })

  const game = computeGameStats(overview)
  const name = user?.full_name || user?.username || 'Student'

  const STATS = [
    { label: 'Total XP', value: game.totalXP,                        colour: C.brand },
    { label: 'Chats',    value: overview?.total_sessions ?? 0,       colour: C.sky },
    { label: 'Quizzes',  value: overview?.quizzes_completed ?? 0,    colour: C.sun },
    { label: 'Streak',   value: overview?.streak_days ?? 0,          colour: C.coral },
  ]

  return (
    <div className="page scroll-y">
      <div className="page-inner">
        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="card p-6 text-center mb-4"
        >
          <Mascot size={104} mood="happy" className="mx-auto" />
          <h1 className="t-title mt-2">{name}</h1>
          <p className="t-small mt-0.5">{user?.email}</p>
          <span className="chip mt-3">Level {game.level} · {game.title}</span>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05, ease: EASE }}
              className="card p-3 text-center"
            >
              {/* Colour lives in the underline, not the numeral — the accents
                  are too light to carry text on white. */}
              <p className="t-num" style={{ fontSize: '1.35rem', lineHeight: 1 }}>
                <CountUp value={s.value} />
              </p>
              <span className="block mx-auto mt-1.5 mb-1" style={{ width: 20, height: 3, borderRadius: 2, background: s.colour }} />
              <p className="t-cap" style={{ fontSize: '0.6rem' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-2.5">
          <button onClick={() => setSheet('settings')} className="card card-tap w-full flex items-center gap-3 p-4 text-left">
            <span className="shrink-0 grid place-items-center" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--brand-soft)' }}>
              <Settings2 size={19} style={{ color: C.brand }} strokeWidth={2.4} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>Learning settings</span>
              <span className="t-small">Language, subject and level</span>
            </span>
            <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
          </button>

          <button onClick={() => navigate('/resources')} className="card card-tap w-full flex items-center gap-3 p-4 text-left">
            <span className="shrink-0 grid place-items-center" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--coral-soft)' }}>
              <Compass size={19} style={{ color: C.coral }} strokeWidth={2.4} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>Videos &amp; links</span>
              <span className="t-small">Free courses and reference sites</span>
            </span>
            <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
          </button>

          <button onClick={() => navigate('/documents')} className="card card-tap w-full flex items-center gap-3 p-4 text-left">
            <span className="shrink-0 grid place-items-center" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--sky-soft)' }}>
              <FileText size={19} style={{ color: C.sky }} strokeWidth={2.4} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>My notes</span>
              <span className="t-small">Upload PDFs to study from</span>
            </span>
            <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
          </button>

          <button onClick={toggleDarkMode} className="card card-tap w-full flex items-center gap-3 p-4 text-left">
            <span className="shrink-0 grid place-items-center" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--sun-soft)' }}>
              {isDarkMode
                ? <Sun size={19} style={{ color: C.sun }} strokeWidth={2.4} />
                : <Moon size={19} style={{ color: C.sun }} strokeWidth={2.4} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>
                {isDarkMode ? 'Light mode' : 'Dark mode'}
              </span>
              <span className="t-small">{isDarkMode ? 'Back to bright' : 'Easier on late-night eyes'}</span>
            </span>
          </button>

          <button onClick={() => setSheet('password')} className="card card-tap w-full flex items-center gap-3 p-4 text-left">
            <span className="shrink-0 grid place-items-center" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--mint-soft)' }}>
              <KeyRound size={19} style={{ color: C.mint }} strokeWidth={2.4} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>Password</span>
              <span className="t-small">Change your password</span>
            </span>
            <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
          </button>

          <button
            onClick={() => { logout(); navigate('/login'); toast.success('See you soon!') }}
            className="card card-tap w-full flex items-center gap-3 p-4 text-left"
          >
            <span className="shrink-0 grid place-items-center" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--coral-soft)' }}>
              <LogOut size={19} style={{ color: C.coral }} strokeWidth={2.4} />
            </span>
            <span className="flex-1 font-display font-semibold" style={{ color: 'var(--ink)' }}>Sign out</span>
          </button>
        </div>
      </div>

      {/* ── Sheets ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sheet !== 'none' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheet('none')}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(34,31,56,0.45)' }}
            />
            <motion.div
              role="dialog" aria-modal="true"
              aria-label={sheet === 'settings' ? 'Learning settings' : 'Change password'}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 scroll-y"
              style={{
                background: 'var(--card)',
                borderTop: '2px solid var(--line)',
                borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
                maxHeight: '86vh',
              }}
            >
              <div className="max-w-[46rem] mx-auto px-[var(--gutter)] py-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="t-head">
                    {sheet === 'settings' ? 'Learning settings' : 'Change password'}
                  </h2>
                  <button onClick={() => setSheet('none')} className="icon-btn" aria-label="Close">
                    <X size={20} />
                  </button>
                </div>

                {sheet === 'settings' ? (
                  <form onSubmit={handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4 pb-4">
                    <label className="block">
                      <span className="t-cap block mb-1.5">Your name</span>
                      <input id="p-name" {...register('full_name')} placeholder="Your name" className="field" />
                    </label>

                    <div>
                      <span className="t-cap block mb-1.5">Language</span>
                      <div className="grid grid-cols-4 gap-2">
                        {LANGUAGES.map((l) => {
                          const active = watchedLanguage === l
                          return (
                            <label
                              key={l}
                              className="cursor-pointer flex flex-col items-center gap-1 py-2.5 rounded-[var(--r-md)]"
                              style={{
                                background: active ? 'var(--brand-soft)' : 'var(--card-soft)',
                                border: `2px solid ${active ? 'var(--brand)' : 'var(--line)'}`,
                              }}
                            >
                              <input type="radio" value={l} {...register('preferred_language')} className="sr-only" />
                              <span className="font-display font-semibold text-sm" style={{ color: active ? C.brand : 'var(--ink-soft)' }}>
                                {LANGUAGE_GLYPH[l]}
                              </span>
                              <span className="t-cap" style={{ fontSize: '0.58rem' }}>{l}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <label className="block">
                      <span className="t-cap block mb-1.5">Default subject</span>
                      <select id="p-subject" {...register('preferred_subject')} className="field field-select">
                        <option value="">No default</option>
                        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>

                    <div>
                      <span className="t-cap block mb-1.5">How detailed?</span>
                      <div className="grid grid-cols-3 gap-2">
                        {LEVELS.map((l) => {
                          const active = watchedLevel === l
                          return (
                            <label
                              key={l}
                              className="cursor-pointer flex flex-col items-center gap-2 py-3 rounded-[var(--r-md)]"
                              style={{
                                background: active ? 'var(--brand-soft)' : 'var(--card-soft)',
                                border: `2px solid ${active ? 'var(--brand)' : 'var(--line)'}`,
                              }}
                            >
                              <input type="radio" value={l} {...register('explanation_level')} className="sr-only" />
                              <span className="flex items-end gap-[3px] h-4">
                                {[1, 2, 3].map((bar) => (
                                  <span
                                    key={bar}
                                    style={{
                                      width: 4, borderRadius: 2,
                                      height: 5 + bar * 3.5,
                                      background: bar <= LEVEL_BARS[l]
                                        ? (active ? C.brand : 'var(--ink-faint)')
                                        : 'var(--line)',
                                    }}
                                  />
                                ))}
                              </span>
                              <span className="t-small" style={{ color: active ? 'var(--ink)' : 'var(--ink-soft)' }}>{l}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <button type="submit" disabled={profileMutation.isPending} className="btn btn-primary w-full">
                      {profileMutation.isPending ? 'Saving…' : <><Save size={18} /> Save</>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={pwdForm.handleSubmit((d) => pwdMutation.mutate(d))} className="space-y-4 pb-4">
                    <label className="block">
                      <span className="t-cap block mb-1.5">Current password</span>
                      <input
                        id="cur-pwd" {...pwdForm.register('current_password', { required: true })}
                        type="password" autoComplete="current-password" placeholder="••••••••" className="field"
                      />
                    </label>
                    <label className="block">
                      <span className="t-cap block mb-1.5">New password</span>
                      <input
                        id="new-pwd" {...pwdForm.register('new_password', { required: true, minLength: 8 })}
                        type="password" autoComplete="new-password" placeholder="At least 8 characters" className="field"
                      />
                    </label>
                    <button type="submit" disabled={pwdMutation.isPending} className="btn btn-primary w-full">
                      {pwdMutation.isPending ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
