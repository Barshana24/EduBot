import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Save, KeyRound, Globe, BookOpen, Gauge,
  MessageSquare, Brain, Flame, Check,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import PageHeader from '@/components/ui/PageHeader'
import CountUp from '@/components/ui/CountUp'
import { SUBJECTS, LANGUAGES, LEVELS, LEVEL_BARS, LANGUAGE_GLYPH, ACCENTS, SPRING } from '@/lib/design'

interface ProfileForm {
  full_name: string
  preferred_language: string
  preferred_subject: string
  explanation_level: string
}

interface PwdForm { current_password: string; new_password: string }

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'password'>('profile')

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
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile saved') },
    onError: () => toast.error("Couldn't save your changes"),
  })

  const pwdMutation = useMutation({
    mutationFn: (data: PwdForm) => authAPI.changePassword(data),
    onSuccess: () => { toast.success('Password updated'); pwdForm.reset() },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Couldn't update your password")
    },
  })

  const initials = (user?.full_name || user?.username || 'U').slice(0, 2).toUpperCase()

  const STATS = [
    { icon: MessageSquare, label: 'Sessions', value: user?.total_sessions || 0,    accent: ACCENTS.violet },
    { icon: Brain,         label: 'Quizzes',  value: user?.quizzes_completed || 0, accent: ACCENTS.amber  },
    { icon: Flame,         label: 'Streak',   value: user?.streak_days || 0,       accent: ACCENTS.rose, suffix: 'd' },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-10">
        <PageHeader eyebrow="Account" title="Your setup" subtitle="Defaults for language, subject, and how deep answers should go." icon={User} accent={ACCENTS.violet} />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 flex items-center gap-5 mb-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E0A85C, #D98F72)', color: '#3A3226' }}>
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold truncate" style={{ color: 'var(--text-hi)' }}>{user?.full_name || user?.username}</h2>
            <p className="text-sm truncate font-semibold" style={{ color: 'var(--text-mid)' }}>{user?.email}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }} className="card card-interactive p-4 text-center">
              <span className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: s.accent }}>
                <s.icon size={14} color="#3A3226" strokeWidth={2.5} />
              </span>
              <p className="font-display text-xl font-extrabold" style={{ color: 'var(--text-hi)' }}><CountUp value={s.value} suffix={s.suffix} /></p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-lo)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="inline-flex items-center gap-0.5 p-1 rounded-full mb-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
          {([
            { id: 'profile', label: 'Preferences', icon: Gauge },
            { id: 'password', label: 'Password', icon: KeyRound },
          ] as const).map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="relative px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2" style={{ color: active ? '#3A3226' : 'var(--text-mid)' }}>
                {active && <motion.span layoutId="profile-tab" className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(120deg, #E0A85C, #D98F72)' }} transition={SPRING} />}
                <t.icon size={13} className="relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'profile' ? (
            <motion.form key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleSubmit((d) => profileMutation.mutate(d))} className="card p-6 space-y-6">
              <div>
                <label className="label-eyebrow" htmlFor="p-name"><span className="inline-flex items-center gap-1.5"><User size={11} /> Full name</span></label>
                <input id="p-name" {...register('full_name')} placeholder="Your name" className="input-field" />
              </div>

              <div>
                <span className="label-eyebrow"><span className="inline-flex items-center gap-1.5"><Globe size={11} /> Preferred language</span></span>
                <div className="grid grid-cols-4 gap-2">
                  {LANGUAGES.map((l) => {
                    const active = watchedLanguage === l
                    return (
                      <label key={l} className="cursor-pointer flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all" style={{ background: active ? ACCENTS.violet : 'var(--surface-2)', border: `1px solid ${active ? ACCENTS.violet : 'var(--border-soft)'}` }}>
                        <input type="radio" value={l} {...register('preferred_language')} className="sr-only" />
                        <span className="text-sm font-extrabold" style={{ color: active ? '#3A3226' : 'var(--text-mid)' }}>{LANGUAGE_GLYPH[l]}</span>
                        <span className="text-[10px] font-bold" style={{ color: active ? 'rgba(58,50,38,0.75)' : 'var(--text-lo)' }}>{l}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label-eyebrow" htmlFor="p-subject"><span className="inline-flex items-center gap-1.5"><BookOpen size={11} /> Default subject</span></label>
                <select id="p-subject" {...register('preferred_subject')} className="select-field">
                  <option value="">No default</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <span className="label-eyebrow"><span className="inline-flex items-center gap-1.5"><Gauge size={11} /> Explanation depth</span></span>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => {
                    const active = watchedLevel === l
                    return (
                      <label key={l} className="cursor-pointer flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all" style={{ background: active ? ACCENTS.amber : 'var(--surface-2)', border: `1px solid ${active ? ACCENTS.amber : 'var(--border-soft)'}` }}>
                        <input type="radio" value={l} {...register('explanation_level')} className="sr-only" />
                        <span className="flex items-end gap-[3px] h-4">
                          {[1, 2, 3].map((bar) => (
                            <span key={bar} className="w-1 rounded-full" style={{ height: `${5 + bar * 3.5}px`, background: bar <= LEVEL_BARS[l] ? (active ? '#3A3226' : 'var(--text-mid)') : 'var(--border-bold)' }} />
                          ))}
                        </span>
                        <span className="text-[11px] font-extrabold" style={{ color: active ? '#3A3226' : 'var(--text-lo)' }}>{l}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <button type="submit" disabled={profileMutation.isPending} className="btn-primary w-full">
                {profileMutation.isPending ? <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} /> : <><Save size={15} /> Save changes</>}
              </button>
            </motion.form>
          ) : (
            <motion.form key="password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={pwdForm.handleSubmit((d) => pwdMutation.mutate(d))} className="card p-6 space-y-5">
              <div>
                <label className="label-eyebrow" htmlFor="cur-pwd">Current password</label>
                <input id="cur-pwd" {...pwdForm.register('current_password', { required: true })} type="password" autoComplete="current-password" placeholder="••••••••" className="input-field" />
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="new-pwd">New password</label>
                <input id="new-pwd" {...pwdForm.register('new_password', { required: true, minLength: 8 })} type="password" autoComplete="new-password" placeholder="At least 8 characters" className="input-field" />
              </div>
              <button type="submit" disabled={pwdMutation.isPending} className="btn-primary w-full">
                {pwdMutation.isPending ? <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} /> : <><Check size={15} /> Update password</>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
