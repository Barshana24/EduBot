import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import { stashDaily } from '@/lib/dailyReward'
import AuthShell from '@/components/layout/AuthShell'

interface RegisterForm { email: string; username: string; password: string; full_name: string }

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>()

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const res = await authAPI.register(data)
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      stashDaily(res.data.daily)
      toast.success(`You're in, ${res.data.user.username}!`)
      navigate('/chat')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Couldn't create that account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell greeting="Hi, I'm Bo!" sub="Let's set you up. It takes a minute.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <label className="block">
          <span className="t-cap block mb-1.5">Your name</span>
          <input id="full_name" {...register('full_name')} autoComplete="name" placeholder="Ada Lovelace" className="field" />
        </label>

        <label className="block">
          <span className="t-cap block mb-1.5">Username</span>
          <input
            id="username"
            {...register('username', {
              required: 'Pick a username',
              pattern: { value: /^[a-zA-Z0-9_]{3,30}$/, message: '3–30 letters, numbers or underscore' },
            })}
            autoComplete="username" placeholder="ada_l" className="field"
          />
          {errors.username && <span className="t-small block mt-1" style={{ color: 'var(--coral-text)' }}>{errors.username.message}</span>}
        </label>

        <label className="block">
          <span className="t-cap block mb-1.5">Email</span>
          <input
            id="reg-email" {...register('email', { required: 'Enter your email' })}
            type="email" autoComplete="email" placeholder="you@example.com" className="field"
          />
          {errors.email && <span className="t-small block mt-1" style={{ color: 'var(--coral-text)' }}>{errors.email.message}</span>}
        </label>

        <label className="block">
          <span className="t-cap block mb-1.5">Password</span>
          <span className="relative block">
            <input
              id="reg-password"
              {...register('password', {
                required: 'Choose a password',
                minLength: { value: 8, message: 'Use at least 8 characters' },
              })}
              type={showPwd ? 'text' : 'password'} autoComplete="new-password"
              placeholder="At least 8 characters" className="field pr-14"
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
          {loading ? 'Creating…' : <>Start learning <ArrowRight size={18} strokeWidth={2.6} /></>}
        </button>
      </form>

      <p className="t-small text-center mt-5">
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--brand-text)', fontWeight: 800 }}>Sign in</Link>
      </p>
    </AuthShell>
  )
}
