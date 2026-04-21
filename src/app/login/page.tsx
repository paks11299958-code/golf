'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(returnTo)
      router.refresh()
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ivory-50)' }}>

      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="text-center">
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--ink-900)', marginBottom: 6 }}>
                <span style={{ color: 'var(--green-600)' }}>Vertex AI</span> 골프 코칭
              </div>
              <h1 className="text-2xl font-black mb-0.5" style={{ color: 'var(--ink-900)', letterSpacing: '-0.04em' }}>로그인</h1>
              <p className="text-sm" style={{ color: 'var(--ink-400)' }}>Vertex AI 기술 기반 골프 분석 서비스</p>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl p-7 flex flex-col gap-5"
          style={{ background: '#ffffff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>이메일</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
                  padding: '12px 16px', color: 'var(--ink-900)', fontSize: 14,
                  outline: 'none', background: '#ffffff', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
                  padding: '12px 16px', color: 'var(--ink-900)', fontSize: 14,
                  outline: 'none', background: '#ffffff', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'}
              />
            </div>

            {error && (
              <p className="text-xs rounded-xl px-3 py-2.5"
                style={{ color: 'var(--signal-red)', background: 'rgba(192,69,58,0.06)', border: '1px solid rgba(192,69,58,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--green-700)', color: 'white', borderRadius: 'var(--r-full)', boxShadow: '0 4px 16px rgba(40,90,39,0.25)' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--green-800)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--green-700)' }}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="flex flex-col gap-2 items-center pt-1">
            <Link href="/forgot-password" className="text-xs transition-colors"
              style={{ color: 'var(--ink-400)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-700)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-400)'}>
              비밀번호를 잊으셨나요?
            </Link>
            <p className="text-xs" style={{ color: 'var(--ink-400)' }}>
              계정이 없으신가요?{' '}
              <Link href="/register" className="font-semibold transition-colors"
                style={{ color: 'var(--green-700)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}>
                회원가입
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--ink-300)' }}>
          © 2025 Vertex AI 골프 코칭
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory-50)' }}>
        <span className="text-sm" style={{ color: 'var(--ink-400)' }}>불러오는 중...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
