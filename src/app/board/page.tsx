'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, LogIn, UserPlus, Menu, X, Lock, MessageSquare, PenLine } from 'lucide-react'

interface AuthUser { id: number; email: string; username?: string; role: string }
interface Post {
  id: number; title: string; createdAt: string; userId: number
  user: { username?: string; email: string }
  _count: { replies: number }
}

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/analyze', label: '스윙 분석' },
  { href: '/dashboard', label: '분석 내역' },
  { href: '/board', label: '소통게시판' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })

export default function BoardPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (!u?.id) { router.push('/login'); return }
      setAuthUser(u)
      fetch('/api/board').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setPosts(data)
      }).finally(() => setLoading(false))
    }).catch(() => router.push('/login'))
  }, [router])

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
                style={item.href === '/board'
                  ? { padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 700, color: 'var(--green-700)', background: 'var(--green-50)', textDecoration: 'none' }
                  : { padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (item.href !== '/board') { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.background = 'var(--ivory-100)' } }}
                onMouseLeave={e => { if (item.href !== '/board') { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.background = 'transparent' } }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {authUser ? (
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
            ) : (
              <>
                <Link href="/login" style={{ padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={13} />로그인</span>
                </Link>
                <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none' }}>
                  <UserPlus size={13} /> 무료 시작
                </Link>
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
            <div style={{ borderTop: '1px solid var(--green-100)', marginTop: 8, paddingTop: 12 }}>
              {authUser
                ? <button onClick={handleLogout} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, textAlign: 'left', color: 'var(--fg-muted)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>로그아웃</button>
                : <Link href="/login" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, textAlign: 'center', color: 'var(--ink-700)', border: '1px solid var(--line)', textDecoration: 'none' }}>로그인</Link>
              }
            </div>
          </div>
        )}
      </nav>

      {/* 본문 */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', margin: 0 }}>소통게시판</h1>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '4px 0 0' }}>기능 개선 요청 및 문의를 남겨주세요. 관리자가 직접 답변드립니다.</p>
          </div>
          <Link href="/board/write"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none' }}>
            <PenLine size={14} /> 글쓰기
          </Link>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-muted)', fontSize: 14 }}>불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-muted)', fontSize: 14 }}>
            <MessageSquare size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--green-300)' }} />
            아직 게시글이 없습니다. 첫 번째 글을 남겨보세요!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: '#fff' }}>
            {posts.map((post, i) => {
              const isOwn = authUser?.id === post.userId
              const isAdmin = authUser?.role === 'ADMIN'
              const canRead = isOwn || isAdmin
              return (
                <div key={post.id} style={{ borderBottom: i < posts.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <Link href={canRead ? `/board/${post.id}` : '#'}
                    onClick={e => { if (!canRead) e.preventDefault() }}
                    style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', textDecoration: 'none', gap: 12, cursor: canRead ? 'pointer' : 'default' }}>
                    <Lock size={14} style={{ color: 'var(--green-500)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: canRead ? 'var(--ink-900)' : 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.title}
                        </span>
                        {post._count.replies > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-700)', background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>
                            답변완료
                          </span>
                        )}
                        {!canRead && (
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0 }}>비밀글</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>
                        {post.user.username || post.user.email} · {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
