'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const inputStyle = {
    width: '100%', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
    padding: '12px 16px', color: 'var(--ink-900)', fontSize: 14,
    outline: 'none', background: '#ffffff', transition: 'border-color 0.2s',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      // 자동 로그인
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      setSuccess(true)
    } catch {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    router.push('/')
    router.refresh()
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
              <h1 className="text-2xl font-black mb-0.5" style={{ color: 'var(--ink-900)', letterSpacing: '-0.04em' }}>회원가입</h1>
              <p className="text-sm" style={{ color: 'var(--ink-400)' }}>Vertex AI 기술 기반 골프 분석 서비스</p>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl p-7 flex flex-col gap-5"
          style={{ background: '#ffffff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>아이디</label>
              <input type="text" style={inputStyle} placeholder="사용할 아이디 입력"
                value={username} onChange={e => setUsername(e.target.value)}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>이메일</label>
              <input type="email" style={inputStyle} placeholder="example@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>
                비밀번호 <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>(6자 이상)</span>
              </label>
              <input type="password" style={inputStyle} placeholder="비밀번호 입력"
                value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'} />
            </div>

            {error && (
              <p className="text-xs rounded-xl px-3 py-2.5"
                style={{ color: 'var(--signal-red)', background: 'rgba(192,69,58,0.06)', border: '1px solid rgba(192,69,58,0.2)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 font-extrabold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--green-700)', color: 'white', borderRadius: 'var(--r-full)', boxShadow: '0 4px 16px rgba(40,90,39,0.25)' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--green-800)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--green-700)' }}>
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: 'var(--ink-400)' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-semibold"
              style={{ color: 'var(--green-700)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}>
              로그인
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--ink-300)' }}>
          © 2025 Vertex AI 골프 코칭
        </p>
      </div>

      {/* 회원가입 성공 모달 */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(26,31,26,0.5)' }}>
          <div className="w-full max-w-xs rounded-2xl p-7 text-center"
            style={{ background: '#ffffff', border: '1px solid var(--line)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="var(--green-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--ink-900)' }}>가입 완료!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-500)', lineHeight: 1.6 }}>
              정상적으로 회원 가입이 되었습니다.
            </p>
            <button onClick={handleConfirm}
              className="w-full py-3 font-bold text-sm cursor-pointer transition-all"
              style={{ background: 'var(--green-700)', color: 'white', borderRadius: 'var(--r-full)', border: 'none', boxShadow: '0 4px 16px rgba(40,90,39,0.25)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-800)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-700)'}>
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
