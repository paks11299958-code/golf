'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, X, ArrowLeft, Send } from 'lucide-react'

interface AuthUser { id: number; email: string; username?: string; role: string }

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/analyze', label: '스윙 분석' },
  { href: '/dashboard', label: '분석 내역' },
  { href: '/board', label: '소통게시판' },
]

export default function BoardWritePage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (!u?.id) router.push('/login')
      else setAuthUser(u)
    }).catch(() => router.push('/login'))
  }, [router])

  const handleSubmit = async () => {
    setError('')
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 모두 입력해주세요.'); return }
    setSubmitting(true)
    const res = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    setSubmitting(false)
    try {
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/board'), 1500)
      } else {
        setError(data.error || '등록 실패')
      }
    } catch {
      setError('서버 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ivory-50)', color: 'var(--ink-900)' }}>
      {/* GNB */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--green-600)' }}>Vertex AI</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: '#5F6368' }}>Golf Coach</span>
            </span>
          </Link>

          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                style={{ padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.background = 'var(--ivory-100)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.background = 'transparent' }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {authUser && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 'var(--r-xl)', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                    {(authUser.username || authUser.email).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-800)' }}>{authUser.username || authUser.email}</span>
                </div>
                <button onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--r-xl)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12, cursor: 'pointer' }}>
                  <LogOut size={11} /> 로그아웃
                </button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(v => !v)}
            style={{ padding: 8, borderRadius: 'var(--r-md)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-700)', cursor: 'pointer' }}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid var(--line)', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--ivory-50)' }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, color: 'var(--ink-700)', textDecoration: 'none' }}>{item.label}</Link>
            ))}
          </div>
        )}
      </nav>

      {/* 본문 */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <Link href="/board" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={14} /> 목록으로
        </Link>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: '28px 28px 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 4px' }}>글쓰기</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '0 0 24px' }}>기능 개선 요청이나 문의 사항을 남겨주세요. 비밀글로 저장되며 관리자만 확인합니다.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'block', marginBottom: 6 }}>제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', fontSize: 14, color: 'var(--ink-900)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'block', marginBottom: 6 }}>내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="문의 내용을 자세히 작성해주세요..."
              rows={10}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', fontSize: 14, color: 'var(--ink-900)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.7 }}
            />
          </div>

          {success && (
            <div style={{ padding: '12px 16px', borderRadius: 'var(--r-lg)', background: 'var(--green-50)', border: '1px solid var(--green-200)', color: 'var(--green-700)', fontSize: 14, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
              ✅ 글이 등록되었습니다. 잠시 후 목록으로 이동합니다...
            </div>
          )}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-lg)', background: 'rgba(192,69,58,0.07)', border: '1px solid rgba(192,69,58,0.2)', color: 'var(--signal-red)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, background: submitting ? 'var(--green-400)' : 'var(--green-700)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              <Send size={14} /> {submitting ? '등록 중...' : '글 등록하기'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
