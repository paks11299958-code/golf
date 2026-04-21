'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setStatus('loading')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setStatus('idle'); return }
      setStatus('done')
    } catch {
      setError('오류가 발생했습니다.')
      setStatus('idle')
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
              <h1 className="text-2xl font-black mb-0.5" style={{ color: 'var(--ink-900)', letterSpacing: '-0.04em' }}>비밀번호 찾기</h1>
              <p className="text-sm" style={{ color: 'var(--ink-400)' }}>가입한 이메일로 재설정 링크를 보내드립니다</p>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl p-7"
          style={{ background: '#ffffff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}>

          {status === 'done' ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'var(--green-50)' }}>📬</div>
              <div>
                <p className="font-bold mb-1" style={{ color: 'var(--ink-900)' }}>이메일이 발송되었습니다</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-400)' }}>
                  <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{email}</span> 로<br />
                  비밀번호 재설정 링크를 보내드렸습니다.<br />
                  링크는 30분간 유효합니다.
                </p>
              </div>
              <Link href="/login"
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: 'var(--ink-500)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--green-700)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-500)'}>
                <ArrowLeft size={14} /> 로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>이메일</label>
                <input
                  type="email"
                  placeholder="가입한 이메일 입력"
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

              {error && (
                <p className="text-xs rounded-xl px-3 py-2.5"
                  style={{ color: 'var(--signal-red)', background: 'rgba(192,69,58,0.06)', border: '1px solid rgba(192,69,58,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 font-extrabold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--green-700)', color: 'white', borderRadius: 'var(--r-full)', boxShadow: '0 4px 16px rgba(40,90,39,0.25)' }}
                onMouseEnter={e => { if (status !== 'loading') (e.currentTarget as HTMLElement).style.background = 'var(--green-800)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--green-700)' }}>
                {status === 'loading' ? '발송 중...' : '재설정 링크 보내기'}
              </button>

              <Link href="/login"
                className="text-center text-xs transition-colors"
                style={{ color: 'var(--ink-400)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-700)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-400)'}>
                로그인으로 돌아가기
              </Link>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--ink-300)' }}>
          © 2025 Vertex AI 골프 코칭
        </p>
      </div>
    </main>
  )
}
