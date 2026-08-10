import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import Aurora from '@/components/ui/Aurora'
import AuthAside from '@/components/layout/AuthAside'
import Logo from '@/components/ui/Logo'
import { EASE } from '@/lib/design'

interface LoginForm { email: string; password: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await authAPI.login(data)
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      toast.success(`Welcome back, ${res.data.user.username}`)
      navigate('/chat')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "That email and password didn't match")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Aurora />
      <AuthAside />

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Logo size={36} />
            <span className="font-display text-xl font-extrabold" style={{ color: 'var(--text-hi)' }}>EduBot</span>
          </div>

          <p className="text-[11px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.18em', color: 'var(--text-lo)' }}>Sign in</p>
          <h1 className="font-display text-4xl font-extrabold mb-2.5" style={{ color: 'var(--text-hi)' }}>
            Pick up where<br />you <span className="text-gradient">left off</span>
          </h1>
          <p className="text-sm mb-8 font-semibold" style={{ color: 'var(--text-mid)' }}>
            Your streak, XP, and decks are waiting.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label-eyebrow" htmlFor="email">Email</label>
              <input id="email" {...register('email', { required: 'Enter your email' })} type="email" autoComplete="email" placeholder="you@example.com" className="input-field" />
              {errors.email && <p className="text-xs font-bold mt-1.5" style={{ color: '#B5654A' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="label-eyebrow" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" {...register('password', { required: 'Enter your password' })} type={showPwd ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" className="input-field pr-11" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn !p-1.5" aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-bold mt-1.5" style={{ color: '#B5654A' }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(58,50,38,0.35)', borderTopColor: '#3A3226' }} />
                : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-sm mt-7 font-semibold" style={{ color: 'var(--text-mid)' }}>
            New here? <Link to="/register" className="font-extrabold" style={{ color: '#8B5A2B' }}>Create an account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
