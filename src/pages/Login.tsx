import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, Loader2 } from 'lucide-react'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/store/auth'

type Mode = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const token = useAuthStore((s) => s.accessToken)

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false
    if (mode === 'register' && !nickname.trim()) return false
    return true
  }, [email, password, nickname, mode])

  useEffect(() => {
    if (token) navigate('/', { replace: true })
  }, [token, navigate])

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        await apiFetch('/auth/register', {
          method: 'POST',
          auth: false,
          json: { email: email.trim(), password, nickname: nickname.trim() },
        })
      }

      const login = await apiFetch<{
        session: {
          access_token: string
          user: { id: string; email: string | null }
        }
      }>('/auth/login', {
        method: 'POST',
        auth: false,
        json: { email: email.trim(), password },
      })

      setSession({ accessToken: login.session.access_token, email: login.session.user.email })
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-zinc-900">F1 Pole Position Prediction</div>
              <div className="text-sm text-zinc-600">F1 赛季预测积分榜</div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-lg bg-zinc-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={
                mode === 'login'
                  ? 'rounded-md bg-white px-3 py-2 font-medium text-zinc-900 shadow-sm'
                  : 'rounded-md px-3 py-2 text-zinc-700 hover:bg-white/60'
              }
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={
                mode === 'register'
                  ? 'rounded-md bg-white px-3 py-2 font-medium text-zinc-900 shadow-sm'
                  : 'rounded-md px-3 py-2 text-zinc-700 hover:bg-white/60'
              }
            >
              注册
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">邮箱</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400"
                placeholder="you@example.com"
              />
            </label>

            {mode === 'register' ? (
              <label className="block">
                <div className="mb-1 text-xs font-medium text-zinc-600">昵称</div>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  autoComplete="nickname"
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400"
                  placeholder="例如：小明"
                />
              </label>
            ) : null}

            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">密码</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                type="password"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400"
                placeholder="至少 6 位"
              />
            </label>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'register' ? '注册并登录' : '登录'}
            </button>
          </div>

          <div className="mt-6 text-xs text-zinc-500">
            Open Source Project by Cepheus Duan.
          </div>
        </div>
      </div>
    </div>
  )
}
