import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import { stashDaily } from '@/lib/dailyReward'
import AuthShell from '@/components/layout/AuthShell'

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
      stashDaily(res.data.daily)
      toast.success(`Welcome back, ${res.data.user.username}!`)
      navigate('/chat')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "That email and password didn't match")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell greeting="Welcome back!" sub="Your streak is waiting.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <label className="block">
          <span className="t-cap block mb-1.5">Email</span>
          <input
            id="email"
            {...register('email', { required: 'Enter your email' })}
            type="email" autoComplete="email" placeholder="you@example.com" className="field"
          />
          {errors.email && <span className="t-small block mt-1" style={{ color: 'var(--coral-text)' }}>{errors.email.message}</span>}
        </label>

        <label className="block">
          <span className="t-cap block mb-1.5">Password</span>
          <span className="relative block">
            <input
              id="password"
              {...register('password', { required: 'Enter your password' })}
              type={showPwd ? 'text' : 'password'} autoComplete="current-password"
              placeholder="••••••••" className="field pr-14"
            />
            <button
              type="button" onClick={() => setShowPwd(!showPwd)}
              className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2"
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errors.password && <span className="t-small block mt-1" style={{ color: 'var(--coral-text)' }}>{errors.password.message}</span>}
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary w-full !mt-5">
          {loading ? 'Signing in…' : <>Let's go <ArrowRight size={18} strokeWidth={2.6} /></>}
        </button>
      </form>

      <p className="t-small text-center mt-5">
        New here?{' '}
        <Link to="/register" style={{ color: 'var(--brand-text)', fontWeight: 800 }}>Create an account</Link>
      </p>
    </AuthShell>
  )
}
