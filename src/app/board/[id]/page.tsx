'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { LogOut, Menu, X, ArrowLeft, Trash2, Send, Pencil } from 'lucide-react'

interface AuthUser { id: number; email: string; username?: string; role: string }
interface Reply {
  id: number; content: string; createdAt: string; isAdminReply: boolean
  user: { username?: string; email: string }
}
interface Post {
  id: number; title: string; content: string; createdAt: string; userId: number
  user: { username?: string; email: string }
  replies: Reply[]
}

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/analyze', label: '스윙 분석' },
  { href: '/dashboard', label: '분석 내역' },
  { href: '/board', label: '소통게시판' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function BoardDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (!u?.id) { router.push('/login'); return }
      setAuthUser(u)
      fetch(`/api/board/${id}`).then(r => r.json()).then(data => {
        if (data.error) setError(data.error)
        else setPost(data)
      }).catch(() => setError('불러오기 실패')).finally(() => setLoading(false))
    }).catch(() => router.push('/login'))
  }, [id, router])

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/board/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/board')
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/board/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent }),
    })
    if (res.ok) {
      const data = await fetch(`/api/board/${id}`).then(r => r.json())
      setPost(data)
      setReplyContent('')
    }
    setSubmitting(false)
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-muted)', fontSize: 14 }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>{error}</p>
            <Link href="/board" style={{ fontSize: 13, color: 'var(--green-700)', textDecoration: 'none' }}>목록으로 돌아가기</Link>
          </div>
        ) : post ? (
          <div>
            {/* 게시글 */}
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: '28px 28px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-900)', margin: 0, lineHeight: 1.4 }}>{post.title}</h1>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {authUser?.id === post.userId && (
                    <Link href={`/board/${post.id}/edit`}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12, textDecoration: 'none' }}>
                      <Pencil size={12} /> 수정
                    </Link>
                  )}
                  {(authUser?.id === post.userId || authUser?.role === 'ADMIN') && (
                    <button onClick={handleDelete}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--r-lg)', border: '1px solid rgba(192,69,58,0.3)', background: 'rgba(192,69,58,0.05)', color: 'var(--signal-red)', fontSize: 12, cursor: 'pointer' }}>
                      <Trash2 size={12} /> 삭제
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 20 }}>
                {post.user.username || post.user.email} · {formatDate(post.createdAt)}
              </div>
              <div style={{ fontSize: 15, color: 'var(--ink-800)', lineHeight: 1.8, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                {post.content}
              </div>
            </div>

            {/* 댓글 목록 */}
            {post.replies.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {post.replies.map(reply => (
                  <div key={reply.id} style={{
                    background: reply.isAdminReply ? 'var(--green-50)' : 'var(--ivory-100)',
                    border: `1px solid ${reply.isAdminReply ? 'var(--green-200)' : 'var(--line)'}`,
                    borderRadius: 'var(--r-xl)', padding: '20px 24px', marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      {reply.isAdminReply
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--green-700)', padding: '2px 8px', borderRadius: 20 }}>관리자</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-600)', background: 'var(--ivory-200)', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: 20 }}>작성자</span>
                      }
                      <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{formatDate(reply.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--ink-800)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {reply.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 작성 — 작성자 또는 관리자 */}
            {(authUser?.role === 'ADMIN' || authUser?.id === post.userId) && (
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 12 }}>
                  {authUser?.role === 'ADMIN' ? '관리자 답글 작성' : '추가 댓글 작성'}
                </div>
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="내용을 입력하세요..."
                  rows={4}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', fontSize: 14, color: 'var(--ink-900)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={handleReply} disabled={submitting || !replyContent.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, background: submitting ? 'var(--green-400)' : 'var(--green-700)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    <Send size={13} /> {submitting ? '등록 중...' : '댓글 등록'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
