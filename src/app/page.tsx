'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, LogOut, LogIn, UserPlus, LayoutDashboard, CheckCircle2, Menu, X } from 'lucide-react'

interface AuthUser { id: number; email: string; username?: string }

const STATS = [
  { value: '3,800+', label: '누적 분석 건수' },
  { value: '+12점', label: '평균 스코어 향상' },
  { value: '4.1개', label: '평균 교정 포인트' },
  { value: '98%', label: '사용자 만족도' },
]

const FEATURES = [
  { icon: '🎬', title: '영상·사진 즉시 분석', desc: '스윙 영상이나 사진을 올리면 Vertex AI가 어드레스부터 피니시까지 각 페이즈를 자동으로 분석합니다' },
  { icon: '🎯', title: 'Vertex AI 자세 교정', desc: '그립, 스탠스, 백스윙, 임팩트, 폴로스루의 문제점을 정밀하게 파악해 우선순위별로 알려드립니다' },
  { icon: '📋', title: '맞춤 교정 드릴', desc: '내 실력 레벨과 개선 목표에 맞는 구체적인 연습 드릴과 체크포인트를 즉시 제공합니다' },
  { icon: '🔒', title: '안전한 데이터', desc: '업로드된 스윙 영상과 사진은 분석 후 즉시 삭제됩니다. 개인정보는 저장되지 않습니다' },
]

const STEPS = [
  { n: '01', title: '영상·사진 업로드', desc: '스윙 영상(MP4·MOV)이나 사진(JPG·PNG)을 업로드하세요. 여러 장도 한 번에 가능합니다.', href: '/analyze', cta: '분석 시작하기' },
  { n: '02', title: 'Vertex AI 스윙 분석', desc: 'Vertex AI가 각 스윙 페이즈를 읽고 교정 포인트와 개선 드릴을 자동으로 생성합니다.' },
  { n: '03', title: '리포트 확인', desc: '맞춤 분석 리포트를 확인하고 연습 시 체크리스트로 활용하세요.', href: '/dashboard', cta: '내역 확인하기' },
]

export default function LandingPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/auth/me').then(r => r.json()).then(u => { if (u?.id) setAuthUser(u) }).catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthUser(null)
    setMenuOpen(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ivory-50)', color: 'var(--ink-900)', overflowX: 'hidden' }}>

      {/* ── GNB ── */}
      <header className="glass-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--green-600)' }}>Vertex AI</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: '#5F6368' }}>Golf Coach</span>
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
            {[{ href: '/', label: '홈' }, { href: '/analyze', label: '스윙 분석' }, { href: '/dashboard', label: '분석 내역' }].map(item => (
              <Link key={item.href} href={item.href}
                style={{ padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.background = 'var(--green-50)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.background = 'transparent' }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="hidden md:flex">
            {authUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--r-xl)', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                    {(authUser.username || authUser.email).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-800)' }}>{authUser.username || authUser.email}</span>
                </div>
                <button onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--r-xl)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.borderColor = 'var(--ink-300)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.borderColor = 'var(--line)' }}>
                  <LogOut size={11} /> 로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-900)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)'}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={13} />로그인</span>
                </Link>
                <Link href="/register"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(40,90,39,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-800)'; el.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-700)'; el.style.transform = 'translateY(0)' }}>
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
          <div className="md:hidden fade-in-up" style={{ borderTop: '1px solid var(--line)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--ivory-50)' }}>
            {[{ href: '/', label: '홈' }, { href: '/analyze', label: '스윙 분석' }, { href: '/dashboard', label: '분석 내역' }].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, color: 'var(--ink-700)', textDecoration: 'none' }}>
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--green-100)', marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {authUser ? (
                <button onClick={handleLogout} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, textAlign: 'left', color: 'var(--fg-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>로그아웃</button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, textAlign: 'center', color: 'var(--ink-700)', border: '1px solid var(--line)', textDecoration: 'none' }}>로그인</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#fff', background: 'var(--green-700)', textDecoration: 'none' }}>무료로 시작하기</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 64, background: 'var(--ivory-50)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48, paddingTop: 80, paddingBottom: 80 }}>

            <div className={mounted ? 'fade-in-up-1' : ''} style={{ opacity: mounted ? undefined : 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--r-full)', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-600)', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-700)', letterSpacing: '0.06em' }}>Vertex AI 기반 골프 스윙 분석 서비스</span>
              </div>

              <h1 style={{ fontSize: 'clamp(2.2rem,5.5vw,3.6rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.04em', color: 'var(--ink-900)', margin: 0, maxWidth: 700 }}>
                스윙 영상 하나로 끝내는<br />
                <span style={{ color: 'var(--green-700)' }}>Vertex AI 기술 기반 골프 정밀 코칭</span>
              </h1>

              <p style={{ fontSize: 'clamp(0.9rem,1.8vw,1.05rem)', color: 'var(--fg-muted)', lineHeight: 1.75, maxWidth: 480, margin: 0 }}>
                스윙 영상이나 사진을 올리면 Vertex AI가 자세를 분석하고<br />
                교정 포인트와 맞춤 드릴을 즉시 알려드립니다
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                {['영상·사진·모든 형식 지원 (MP4·MOV·JPG·PNG)', 'Vertex AI가 어드레스~피니시 전 구간 분석', '실력 레벨 맞춤 교정 드릴 즉시 제공'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ink-700)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <Link href="/analyze"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 'var(--r-full)', fontWeight: 700, fontSize: 15, background: 'var(--green-700)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 20px rgba(40,90,39,0.35)', letterSpacing: '-0.2px', transition: 'all 0.3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-800)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 32px rgba(40,90,39,0.4)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-700)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 20px rgba(40,90,39,0.35)' }}>
                  내 스윙 무료 분석하기
                  <ArrowRight size={16} />
                </Link>
                <Link href="/dashboard"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 24px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', border: '1px solid var(--line)', background: '#fff', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--green-300)'; el.style.color = 'var(--green-700)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--line)'; el.style.color = 'var(--ink-700)' }}>
                  <LayoutDashboard size={14} /> 분석 내역 보기
                </Link>
              </div>
            </div>

            {/* Hero intro animation */}
            <div className={mounted ? 'fade-in-up-2' : ''} style={{ opacity: mounted ? undefined : 0, width: '100%', maxWidth: 680 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -24, borderRadius: 32, background: 'linear-gradient(135deg, var(--green-100), var(--ivory-200))', opacity: 0.6, filter: 'blur(24px)' }} />
                <div style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-lg)' }}>
                  <iframe src="/intro.html" style={{ width: '100%', height: 460, display: 'block', border: 'none' }} title="SwingLab 서비스 소개" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', borderColor: 'var(--line)' }} className="md:grid-cols-4 divide-x divide-y md:divide-y-0">
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 800, color: 'var(--green-700)', letterSpacing: '-0.03em', margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: 12 }}>서비스 특징</p>
            <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.03em', margin: 0 }}>왜 Vertex AI 기술 기반 골프 코칭인가요?</h2>
            <p style={{ marginTop: 12, fontSize: 14, color: 'var(--fg-muted)', maxWidth: 360, margin: '12px auto 0' }}>복잡한 스윙 메커니즘을 Vertex AI가 정밀하게 분석해 드립니다</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i}
                style={{ borderRadius: 'var(--r-xl)', padding: 24, border: '1px solid var(--line)', background: '#fff', cursor: 'default', transition: 'all 0.3s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = 'var(--shadow-lg)'; el.style.borderColor = 'var(--green-200)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = 'var(--line)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '96px 0', background: 'var(--ivory-50)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: 12 }}>이용 방법</p>
            <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.03em', margin: 0 }}>3단계로 끝나는 스윙 코칭</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i}
                style={{ borderRadius: 'var(--r-xl)', padding: 28, background: '#fff', border: '1px solid var(--line)', transition: 'all 0.3s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-md)'; el.style.borderColor = 'var(--green-200)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.borderColor = 'var(--line)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'var(--green-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: '#fff', letterSpacing: '0.05em' }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65, margin: '0 0 20px' }}>{s.desc}</p>
                {s.href && (
                  <Link href={s.href}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--green-700)', textDecoration: 'none', transition: 'gap 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.gap = '10px'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.gap = '6px'}>
                    {s.cta} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '96px 0', background: 'var(--green-800)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(199,222,195,0.7)', marginBottom: 16 }}>지금 바로 시작하세요</p>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.15 }}>
            내 스윙의 문제점을 알고 계신가요?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.8, fontSize: 14 }}>
            골퍼의 73%가 잘못된 습관을 교정하지 않고 연습합니다.<br />
            Vertex AI 분석으로 지금 당장 정확한 교정 포인트를 확인하세요.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/analyze"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 40px', borderRadius: 'var(--r-full)', fontWeight: 700, fontSize: 15, background: '#fff', color: 'var(--green-800)', textDecoration: 'none', boxShadow: '0 4px 24px rgba(255,255,255,0.15)', transition: 'all 0.3s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 40px rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 24px rgba(255,255,255,0.15)' }}>
              무료로 내 스윙 분석하기
              <ArrowRight size={16} />
            </Link>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>회원가입 없이도 이용 가능 · 완전 무료</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--ivory-100)', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--ink-700)' }}>
                  <span style={{ color: 'var(--green-600)' }}>Vertex AI</span> 골프 코칭
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', maxWidth: 360, lineHeight: 1.7, margin: 0 }}>
                Vertex AI 기술 기반 골프 스윙 분석 서비스입니다.<br />
                본 서비스는 참고용이며, 정확한 레슨은 전문 코치와 상담하세요.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {[{ href: '/', label: '홈' }, { href: '/analyze', label: '스윙 분석' }, { href: '/dashboard', label: '분석 내역' }, { href: '/login', label: '로그인' }].map(item => (
                  <Link key={item.href} href={item.href}
                    style={{ fontSize: 12, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--green-700)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)'}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>© 2025 Vertex AI 골프 코칭 · golf.dbzone.kr</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 24, paddingTop: 16 }}>
            <p style={{ fontSize: 10, color: 'var(--ink-300)', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
              Google Cloud, Vertex AI 및 관련 로고는 Google LLC의 상표입니다. 본 서비스는 Google Cloud의 Vertex AI 기술을 활용하여 독립적으로 개발되었습니다.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
