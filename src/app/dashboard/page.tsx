'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, LogOut, LogIn, UserPlus, Menu, X, AlertTriangle, FileBarChart2, PlusCircle, ExternalLink, Trash2, Bot, ChevronUp } from 'lucide-react'

interface AuthUser { id: number; email: string; username?: string }
interface Analysis {
  id: number; title: string | null; gender: string | null; age: string | null
  job: string | null; health: string | null; purpose: string | null; budget: string | null
  fileNames: string | null
  result: { summary?: { overallScore: number; swingType: string; mainIssue: string; improvementLevel: string }; issues?: unknown[]; strengths?: string[]; aiSummary?: string; recommendation?: string } | null
  createdAt: string
}
interface Toast { id: number; message: string; deletedItem: Analysis | null }

const levelStyle = (level: string) => {
  if (level === '높음') return { color: 'var(--signal-red)',   bg: 'rgba(192,69,58,0.08)',  border: 'rgba(192,69,58,0.25)',  cardBorder: 'rgba(192,69,58,0.2)' }
  if (level === '중간') return { color: 'var(--signal-amber)', bg: 'rgba(209,155,26,0.08)', border: 'rgba(209,155,26,0.25)', cardBorder: 'rgba(209,155,26,0.2)' }
  return { color: 'var(--green-600)', bg: 'rgba(53,113,50,0.08)', border: 'rgba(53,113,50,0.25)', cardBorder: 'var(--green-200)' }
}
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
const truncateFiles = (names: string) => {
  const list = names.split(',').map(s => s.trim())
  return list.length <= 1 ? names : `${list[0]} 외 ${list.length-1}개`
}

const NAV_ITEMS = [{ href: '/', label: '홈' }, { href: '/analyze', label: '스윙 분석' }, { href: '/dashboard', label: '분석 내역' }, { href: '/board', label: '소통게시판' }]

export default function DashboardPage() {
  const router = useRouter()
  const [authUser, setAuthUser]   = useState<AuthUser | null>(null)
  const [analyses, setAnalyses]   = useState<Analysis[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Analysis | null>(null)
  const [search, setSearch]       = useState('')
  const [openMenu, setOpenMenu]   = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [toast, setToast]         = useState<Toast | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const filtered = analyses.filter(a => (a.title||'').toLowerCase().includes(search.toLowerCase()))
  const lowCount  = analyses.filter(a => a.result?.summary?.improvementLevel === '낮음').length
  const medCount  = analyses.filter(a => a.result?.summary?.improvementLevel === '중간').length
  const highCount = analyses.filter(a => a.result?.summary?.improvementLevel === '높음').length

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(u => {
      if (!u||!u.id) { router.push('/login'); return }
      setAuthUser(u)
      fetch('/api/analyses').then(r=>r.json()).then(data => { setAnalyses(Array.isArray(data)?data:[]); setLoading(false) }).catch(() => setLoading(false))
    })
  }, [router])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  const showToast = useCallback((message: string, deletedItem: Analysis | null = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, deletedItem })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const handleDelete = (id: number) => {
    const target = analyses.find(a => a.id === id)
    if (!target) return
    setConfirmId(null)
    setAnalyses(prev => prev.filter(a => a.id !== id))
    showToast('삭제되었습니다.', target)
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    deleteTimerRef.current = setTimeout(async () => {
      deleteTimerRef.current = null
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' })
      if (!res.ok) { setAnalyses(prev => [target, ...prev].sort((a, b) => b.id - a.id)); showToast('삭제에 실패했습니다.') }
    }, 4000)
  }
  const handleUndo = () => {
    if (!toast?.deletedItem) return
    if (deleteTimerRef.current) { clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null }
    if (toastTimer.current) clearTimeout(toastTimer.current)
    const item = toast.deletedItem
    setToast(null)
    setAnalyses(prev => [item, ...prev].sort((a, b) => b.id - a.id))
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory-50)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--green-200)', borderTopColor: 'var(--green-600)', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 14, color: 'var(--fg-muted)' }}>불러오는 중...</span>
      </div>
    </main>
  )

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
                style={item.href === '/dashboard'
                  ? { padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 700, color: 'var(--green-700)', background: 'var(--green-50)', textDecoration: 'none' }
                  : { padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (item.href !== '/dashboard') { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.background = 'var(--ivory-100)' } }}
                onMouseLeave={e => { if (item.href !== '/dashboard') { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.background = 'transparent' } }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {authUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 'var(--r-xl)', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                    {(authUser.username||authUser.email).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-800)' }}>{authUser.username||authUser.email}</span>
                </div>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--r-xl)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <LogOut size={11}/> 로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ padding: '6px 12px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={13}/>로그인</span>
                </Link>
                <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none' }}>
                  <UserPlus size={13}/> 무료 시작
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(v=>!v)}
            style={{ padding: 8, borderRadius: 'var(--r-md)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-700)', cursor: 'pointer' }}>
            {mobileMenuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid var(--line)', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--ivory-50)' }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, color: 'var(--ink-700)', textDecoration: 'none' }}>{item.label}</Link>
            ))}
            <div style={{ borderTop: '1px solid var(--green-100)', marginTop: 8, paddingTop: 12 }}>
              {authUser
                ? <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} style={{ padding: '12px 16px', fontSize: 14, textAlign: 'left', color: 'var(--fg-muted)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>로그아웃</button>
                : <>
                    <Link href="/login" style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: 'var(--ink-700)', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                    <Link href="/register" style={{ display: 'block', marginTop: 8, padding: '12px 16px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#fff', background: 'var(--green-700)', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>무료 시작</Link>
                  </>
              }
            </div>
          </div>
        )}
      </nav>

      {/* 페이지 헤더 */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>분석 내역</h1>
              <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>총 {analyses.length}개의 분석 결과가 저장되어 있습니다</p>
            </div>
            <Link href="/analyze"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(40,90,39,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-800)'; el.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-700)'; el.style.transform = 'scale(1)' }}>
              <PlusCircle size={13}/> 새 분석
            </Link>
          </div>

          {/* 요약 통계 */}
          {analyses.length > 0 && (
            <div style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--line)', background: 'var(--ivory-50)', marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[
                  { icon: <FileBarChart2 size={13}/>, value: analyses.length, label: '총 분석',       color: 'var(--ink-900)' },
                  { icon: <ShieldCheck size={13}/>,   value: lowCount,        label: '개선 낮음',  color: 'var(--green-600)' },
                  { icon: <AlertTriangle size={13}/>, value: medCount,        label: '개선 중간',  color: 'var(--signal-amber)' },
                  { icon: <AlertTriangle size={13}/>, value: highCount,       label: '개선 높음',  color: 'var(--signal-red)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 3 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 */}
          {analyses.length > 0 && (
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-subtle)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="제목으로 검색"
                style={{ width: '100%', paddingLeft: 40, paddingRight: 36, paddingTop: 10, paddingBottom: 10, fontSize: 14, borderRadius: 'var(--r-xl)', outline: 'none', transition: 'border-color 0.2s', background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-900)' }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'} />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, lineHeight: 1, cursor: 'pointer', color: 'var(--fg-subtle)', background: 'transparent', border: 'none' }}>×</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px 64px' }}>

        {analyses.length === 0 ? (
          <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
              <FileBarChart2 size={36} color="var(--green-400)"/>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--ink-900)' }}>스윙 분석 내역이 없습니다</h2>
            <p style={{ fontSize: 14, margin: '0 0 4px', color: 'var(--fg-muted)' }}>스윙을 분석하면 여기에 저장됩니다</p>
            <p style={{ fontSize: 12, margin: '0 0 32px', color: 'var(--fg-subtle)' }}>영상·사진 파일을 업로드하면 AI가 즉시 분석합니다</p>
            <Link href="/analyze"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 16px rgba(40,90,39,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-800)'; el.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-700)'; el.style.transform = 'scale(1)' }}>
              <PlusCircle size={15}/> 분석 시작하기
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>&ldquo;{search}&rdquo; 검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }} ref={menuRef}>
              {filtered.map(a => {
                const summary = a.result?.summary
                const rs = summary ? levelStyle(summary.improvementLevel) : null
                const isOpen = selected?.id === a.id
                const isMenuOpen = openMenu === a.id

                return (
                  <div key={a.id}
                    style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', background: '#fff', border: `1px solid ${rs ? rs.cardBorder : 'var(--line)'}`, boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-lg)'; el.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-sm)'; el.style.transform = 'translateY(0)' }}>

                    <div style={{ padding: '20px 20px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h2 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-900)', margin: '0 0 4px' }}>{a.title||'제목 없음'}</h2>
                          <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>{[a.gender,a.age,a.job].filter(Boolean).join(' · ')}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {summary && rs && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--r-full)', border: `1px solid ${rs.border}`, fontSize: 11, fontWeight: 600, color: rs.color, background: rs.bg }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: rs.color, display: 'inline-block' }}/>
                              {summary.overallScore}점
                            </span>
                          )}
                          <div style={{ position: 'relative' }}>
                            <button onClick={() => setOpenMenu(isMenuOpen ? null : a.id)}
                              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-md)', fontSize: 16, cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--fg-muted)', transition: 'all 0.15s' }}
                              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-700)'; el.style.background = 'var(--ivory-100)' }}
                              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.background = 'transparent' }}>
                              ⋮
                            </button>
                            {isMenuOpen && (
                              <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 20, width: 160, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: '#fff', border: '1px solid var(--line)' }}>
                                <Link href={`/report/${a.id}`} target="_blank" onClick={() => setOpenMenu(null)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: 'var(--ink-700)', textDecoration: 'none', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-50)'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                  <ExternalLink size={12}/> 결과 보기
                                </Link>
                                <button onClick={() => { setSelected(isOpen?null:a); setOpenMenu(null) }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: 'var(--ink-700)', cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-50)'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                  <Bot size={12}/> AI 요약
                                </button>
                                <div style={{ margin: '4px 12px', height: 1, background: 'var(--line)' }} />
                                <button onClick={() => { setConfirmId(a.id); setOpenMenu(null) }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: 'var(--signal-red)', cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(192,69,58,0.05)'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                  <Trash2 size={12}/> 삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 핵심 지표 */}
                      {summary && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--ivory-200)' }}>
                          {[
                            { value: `${summary.overallScore}점`,      label: '스윙 점수', color: 'var(--green-600)' },
                            { value: (a.result?.issues as unknown[])?.length ?? 0, label: '교정 포인트', color: 'var(--signal-red)' },
                            { value: summary.improvementLevel,         label: '개선 가능성', color: rs?.color ?? 'var(--ink-900)' },
                          ].map((m, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', borderRight: i < 2 ? '1px solid var(--ivory-200)' : 'none', background: 'var(--ivory-50)', textAlign: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: m.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px' }}>{m.value}</span>
                              <span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 4 }}>{m.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 날짜 + 파일 */}
                    <div style={{ padding: '8px 20px', borderTop: '1px solid var(--ivory-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>{formatDate(a.createdAt)}</span>
                      {a.fileNames && <span style={{ fontSize: 11, color: 'var(--ink-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>📎 {truncateFiles(a.fileNames)}</span>}
                    </div>

                    {/* 액션 버튼 */}
                    <div style={{ padding: '10px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Link href={`/report/${a.id}`} target="_blank"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 'var(--r-lg)', fontSize: 12, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none', transition: 'all 0.2s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-800)'; el.style.transform = 'scale(1.02)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-700)'; el.style.transform = 'scale(1)' }}>
                        <ExternalLink size={11}/> 결과 보기
                      </Link>
                      <button onClick={() => setSelected(isOpen?null:a)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 'var(--r-lg)', fontSize: 12, fontWeight: 500, border: '1px solid var(--line)', color: 'var(--ink-700)', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--ivory-100)'; el.style.borderColor = 'var(--green-300)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = 'var(--line)' }}>
                        {isOpen ? <><ChevronUp size={11}/> 접기</> : <><Bot size={11}/> AI 요약</>}
                      </button>
                    </div>

                    {/* AI 요약 펼침 */}
                    {isOpen && a.result && (
                      <div style={{ margin: '0 16px 16px', paddingTop: 16, borderTop: '1px solid var(--ivory-100)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {a.result.aiSummary && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, color: 'var(--fg-subtle)' }}>AI 요약</p>
                            <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--fg-muted)', margin: 0 }}>{a.result.aiSummary}</p>
                          </div>
                        )}
                        {a.result.recommendation && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, color: 'var(--fg-subtle)' }}>추천</p>
                            <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--fg-muted)', margin: 0 }}>{a.result.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, marginTop: 24, color: 'var(--ink-300)' }}>
              {search ? `${filtered.length}개 검색됨 (전체 ${analyses.length}개)` : `총 ${analyses.length}개`}
            </p>
          </>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {confirmId !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px', background: 'rgba(26,31,26,0.5)' }}
          onClick={() => setConfirmId(null)}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: '24px 24px 0 0', padding: 24, boxShadow: 'var(--shadow-lg)', background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: 'rgba(192,69,58,0.08)', border: '1px solid rgba(192,69,58,0.2)' }}>
                <Trash2 size={20} color="var(--signal-red)"/>
              </div>
              <h3 style={{ fontWeight: 700, margin: '0 0 6px', color: 'var(--ink-900)', fontSize: 16 }}>분석 내역을 삭제할까요?</h3>
              <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0 }}>삭제된 데이터는 복구되지 않습니다.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => setConfirmId(null)}
                style={{ padding: '13px 0', borderRadius: 'var(--r-full)', fontSize: 14, cursor: 'pointer', background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-700)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-100)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>취소</button>
              <button onClick={() => handleDelete(confirmId)}
                style={{ padding: '13px 0', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'var(--signal-red)', color: '#fff', border: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 'var(--r-xl)', padding: '12px 20px', boxShadow: 'var(--shadow-lg)', background: 'var(--green-800)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 240 }}>
          <span style={{ fontSize: 14, flex: 1, color: '#fff' }}>{toast.message}</span>
          {toast.deletedItem && (
            <button onClick={handleUndo} style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 'none', flexShrink: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}>실행 취소</button>
          )}
        </div>
      )}
    </main>
  )
}
