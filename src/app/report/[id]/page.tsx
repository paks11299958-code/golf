'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LogIn, UserPlus, Menu, X, ArrowLeft, Download, Printer } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const severityStyle = (s: string) => {
  if (s === '높음') return { color: 'var(--signal-red)', bg: 'rgba(192,69,58,0.08)', border: 'rgba(192,69,58,0.25)' }
  if (s === '중간') return { color: 'var(--signal-amber)', bg: 'rgba(209,155,26,0.08)', border: 'rgba(209,155,26,0.25)' }
  return { color: 'var(--green-600)', bg: 'var(--green-50)', border: 'var(--green-200)' }
}
const levelStyle = (level: string) => {
  if (level === '높음') return { color: 'var(--signal-red)', bg: 'rgba(192,69,58,0.08)', border: 'rgba(192,69,58,0.25)' }
  if (level === '중간') return { color: 'var(--signal-amber)', bg: 'rgba(209,155,26,0.08)', border: 'rgba(209,155,26,0.25)' }
  return { color: 'var(--green-600)', bg: 'var(--green-50)', border: 'var(--green-200)' }
}
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

interface SwingIssue {
  part: string; issue: string; description: string; severity: string; drill: string
}
interface PhaseScores { 어드레스?: number; 백스윙?: number; 탑?: number; 다운스윙?: number; 임팩트?: number; 폴로스루?: number }
interface AnalysisResult {
  summary?: { overallScore: number; swingType: string; mainIssue: string; improvementLevel: string }
  phaseScores?: PhaseScores
  issues?: SwingIssue[]; strengths?: string[]; aiSummary?: string; recommendation?: string; disclaimer?: string
}
interface Analysis {
  id: number; title: string | null; gender: string | null; age: string | null
  job: string | null; health: string | null; purpose: string | null; budget: string | null
  fileNames: string | null; result: AnalysisResult | null; createdAt: string
}
interface AuthUser { id: number; email: string; username?: string }

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/analyze', label: '스윙 분석' },
  { href: '/dashboard', label: '분석 내역' },
]

export default function ReportPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalItem, setModalItem] = useState<SwingIssue | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => { if (u?.id) setAuthUser(u) }).catch(() => {})
  }, [])

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setAuthUser(null) }

  useEffect(() => {
    fetch(`/api/report/${id}`)
      .then(r => r.json())
      .then(data => { if (data.error) { setError(data.error); return }; setAnalysis(data) })
      .catch(() => setError('불러오기 실패'))
      .finally(() => setLoading(false))
  }, [id])

  const exportTxt = () => {
    if (!analysis) return
    const result = analysis.result
    const summary = result?.summary
    const issues = result?.issues || []
    const rows = issues.map(d => `${d.part}\t${d.issue}\t${d.severity}\t${d.drill}`).join('\n')
    const txt = [
      'Vertex AI 골프 스윙 분석 보고서', '='.repeat(44),
      `제목: ${analysis.title || ''}`, `분석 일시: ${formatDate(analysis.createdAt)}`, `파일: ${analysis.fileNames || ''}`, '',
      '[골퍼 정보]',
      `• 성별: ${analysis.gender || ''}  실력: ${analysis.age || ''}  목표: ${analysis.job || ''}`,
      `• 신체상태: ${analysis.health || ''}  사용클럽: ${analysis.budget || ''}  주요문제: ${analysis.purpose || ''}`, '',
      '[요약]', `• 종합 점수: ${summary?.overallScore ?? ''}점`, `• 스윙 특성: ${summary?.swingType ?? ''}`,
      `• 주요 개선점: ${summary?.mainIssue ?? ''}`, `• 개선 가능성: ${summary?.improvementLevel ?? ''}`, '',
      '[강점]', (result?.strengths || []).map(s => `• ${s}`).join('\n'), '',
      '[AI 요약]', result?.aiSummary || '', '', '[교정 포인트]', '구간\t문제점\t심각도\t드릴', rows, '',
      '[권고사항]', result?.recommendation || '', '', '[안내]', result?.disclaimer || '',
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }))
    a.download = `${analysis.title || '골프스윙분석'}_${new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g, '-').replace(/-$/, '')}.txt`
    a.click()
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory-50)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--green-200)', borderTopColor: 'var(--green-600)' }} />
        <span className="text-sm" style={{ color: 'var(--ink-400)' }}>불러오는 중...</span>
      </div>
    </main>
  )

  if (error || !analysis) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory-50)' }}>
      <div className="text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--signal-red)' }}>{error || '분석 결과를 찾을 수 없습니다.'}</p>
        <Link href="/dashboard" className="text-xs font-medium" style={{ color: 'var(--ink-700)' }}>← 대시보드로</Link>
      </div>
    </main>
  )

  const result = analysis.result
  const summary = result?.summary
  const issues = result?.issues || []
  const strengths = result?.strengths || []
  const level = summary ? levelStyle(summary.improvementLevel) : null

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory-50)', color: 'var(--ink-900)' }}>

      {/* GNB */}
      <nav className="glass-nav print:hidden sticky top-0 z-50">
        <div className="max-w-[1120px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0" style={{ textDecoration: 'none' }}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--green-600)' }}>Vertex AI</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: '#5F6368' }}>Golf Coach</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                style={{ color: 'var(--ink-500)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.background = 'var(--ivory-100)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-500)'; el.style.background = 'transparent' }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {authUser ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--ivory-100)', border: '1px solid var(--line)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: 'var(--green-700)', color: 'white' }}>
                    {(authUser.username || authUser.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--ink-700)' }}>{authUser.username || authUser.email}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink-400)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-700)'; el.style.borderColor = 'var(--ink-300)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-400)'; el.style.borderColor = 'var(--line)' }}>
                  <LogOut size={11} /> 로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 rounded-xl text-[13px] font-medium transition-all"
                  style={{ color: 'var(--ink-500)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-900)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-500)'}>
                  <span className="flex items-center gap-1.5"><LogIn size={13} />로그인</span>
                </Link>
                <Link href="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all"
                  style={{ background: 'var(--green-700)', color: 'white' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-800)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-700)'}>
                  <UserPlus size={13} /> 무료 시작
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden cursor-pointer p-2 rounded-xl"
            style={{ border: '1px solid var(--line)', color: 'var(--ink-700)' }}
            onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1"
            style={{ background: '#ffffff', borderColor: 'var(--line)' }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className="px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--ink-700)' }}
                onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
            <div className="border-t mt-2 pt-3" style={{ borderColor: 'var(--ivory-100)' }}>
              {authUser
                ? <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="px-4 py-3 rounded-xl text-sm text-left cursor-pointer w-full" style={{ color: 'var(--ink-400)' }}>로그아웃</button>
                : <>
                    <Link href="/login" className="block px-4 py-3 rounded-xl text-sm" style={{ color: 'var(--ink-700)' }} onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                    <Link href="/register" className="block px-4 py-3 rounded-full text-sm font-bold text-center mt-1" style={{ background: 'var(--green-700)', color: 'white' }} onClick={() => setMobileMenuOpen(false)}>무료 시작</Link>
                  </>
              }
            </div>
          </div>
        )}
      </nav>

      {/* 본문 */}
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto">

          {/* 리포트 헤더 */}
          <div className="rounded-2xl p-6 mb-6 text-center"
            style={{ background: '#ffffff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--ink-900)' }}>{analysis.title || 'Vertex AI 골프 스윙 분석 결과'}</h1>
            <p className="text-xs mb-3" style={{ color: 'var(--ink-400)' }}>{formatDate(analysis.createdAt)}</p>
            {level && summary && (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ color: level.color, background: level.bg, borderColor: level.border }}>
                종합 {summary.overallScore}점 · 개선 가능성 {summary.improvementLevel}
              </span>
            )}
            <div className="flex justify-center gap-2 mt-4 print:hidden flex-wrap">
              {[
                { label: 'TXT 저장', icon: <Download size={12} />, fn: exportTxt },
                { label: 'PDF 저장', icon: <Printer size={12} />, fn: () => window.print() },
                { label: '인쇄', icon: <Printer size={12} />, fn: () => window.print() },
              ].map((b, i) => (
                <button key={i} onClick={b.fn}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink-700)', background: '#ffffff' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--ivory-100)'; el.style.borderColor = 'var(--ink-300)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#ffffff'; el.style.borderColor = 'var(--line)' }}>
                  {b.icon} {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* 골퍼 정보 */}
          {[analysis.gender, analysis.age, analysis.job, analysis.health, analysis.budget, analysis.purpose].some(Boolean) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {[
                { label: '성별', value: analysis.gender },
                { label: '실력', value: analysis.age },
                { label: '목표', value: analysis.job },
                { label: '신체상태', value: analysis.health },
                { label: '사용클럽', value: analysis.budget },
                { label: '주요문제', value: analysis.purpose },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="rounded-xl p-3"
                  style={{ background: '#ffffff', border: '1px solid var(--line)' }}>
                  <div className="text-[10px] mb-1" style={{ color: 'var(--ink-400)' }}>{item.label}</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-900)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* 스윙 레이더 차트 */}
          {result?.phaseScores && Object.keys(result.phaseScores).length > 0 && (
            <div className="mb-5 rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="text-sm font-bold mb-3 text-center" style={{ color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>스윙 페이즈 분석</h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={Object.entries(result.phaseScores).map(([k, v]) => ({ phase: k, score: v }))}>
                  <PolarGrid stroke="var(--line)" />
                  <PolarAngleAxis dataKey="phase" tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--ink-700)' }} />
                  <Radar dataKey="score" stroke="var(--green-600)" fill="var(--green-600)" fillOpacity={0.2} dot={{ r: 4, fill: 'var(--green-600)' }} label={{ fontSize: 11, fontWeight: 700, fill: 'var(--green-700)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 스윙 특성 배너 */}
          {summary && (
            <div className="mb-4 rounded-xl p-4" style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: 'var(--green-700)', letterSpacing: '0.08em' }}>스윙 특성</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>{summary.swingType}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--ink-500)' }}>주요 개선점: {summary.mainIssue}</div>
            </div>
          )}

          {/* 요약 수치 */}
          {summary && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { value: `${summary.overallScore}점`, label: '종합 점수', color: 'var(--green-600)' },
                { value: issues.length, label: '교정 포인트', color: 'var(--signal-red)' },
                { value: strengths.length, label: '강점', color: 'var(--tech-500)' },
              ].map((m, i) => (
                <div key={i} className="rounded-2xl p-4 text-center"
                  style={{ background: '#ffffff', border: '1px solid var(--line)' }}>
                  <div className="text-2xl font-black mb-1" style={{ color: m.color, letterSpacing: '-0.02em' }}>{m.value}</div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-400)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* 강점 */}
          {strengths.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--ink-900)' }}>강점</h2>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s, i) => (
                  <span key={i} style={{ padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 13, background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-200)', fontWeight: 500 }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 교정 포인트 */}
          {issues.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--ink-900)' }}>교정 포인트</h2>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--line)', background: '#ffffff' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--ivory-50)', borderBottom: '1px solid var(--line)' }}>
                        {['구간', '문제점', '설명', '심각도', '교정 드릴'].map(h => (
                          <th key={h} className="text-left py-3 px-3 font-semibold whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((d, i) => {
                        const sv = severityStyle(d.severity)
                        return (
                          <tr key={i} className="cursor-pointer transition-colors"
                            style={{ borderBottom: '1px solid var(--ivory-100)' }}
                            onClick={() => setModalItem(d)}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-50)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                            <td className="py-3 px-3 whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{d.part}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{d.issue}</div>
                            </td>
                            <td className="py-3 px-3" style={{ color: 'var(--ink-500)' }}>{d.description}</td>
                            <td className="py-3 px-3">
                              <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                                style={{ color: sv.color, background: sv.bg, borderColor: sv.border }}>
                                {d.severity}
                              </span>
                            </td>
                            <td className="py-3 px-3" style={{ color: 'var(--ink-700)' }}>{d.drill}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* AI 요약 */}
          {result?.aiSummary && (
            <div className="mb-5">
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--ink-900)' }}>Vertex AI 분석 요약</h2>
              <div className="rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: '#ffffff', border: '1px solid var(--line)', color: 'var(--ink-700)' }}>
                {result.aiSummary}
              </div>
            </div>
          )}

          {/* 추천 */}
          {result?.recommendation && (
            <div className="mb-5">
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--ink-900)' }}>맞춤 추천</h2>
              <div className="rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: '#ffffff', border: '1px solid var(--line)', borderLeft: '3px solid var(--green-600)', color: 'var(--ink-700)' }}>
                {result.recommendation}
              </div>
            </div>
          )}

          {analysis.fileNames && (
            <p className="text-[11px] mb-4" style={{ color: 'var(--ink-300)' }}>📎 분석 파일: {analysis.fileNames}</p>
          )}
          {result?.disclaimer && (
            <p className="text-[10px] leading-relaxed mb-4" style={{ color: 'var(--ink-300)' }}>{result.disclaimer}</p>
          )}

          <div className="text-center pt-5" style={{ borderTop: '1px solid var(--line)' }}>
            <Link href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'var(--ink-500)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--green-700)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-500)'}>
              <ArrowLeft size={14} /> 분석 내역으로
            </Link>
          </div>
        </div>
      </div>

      {/* 교정 포인트 상세 모달 */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(26,31,26,0.5)' }}
          onClick={() => setModalItem(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: '#ffffff', border: '1px solid var(--line)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--ink-900)' }}>{modalItem.issue}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--ink-400)' }}>{modalItem.part}</p>
              </div>
              {(() => {
                const sv = severityStyle(modalItem.severity)
                return (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                    style={{ color: sv.color, background: sv.bg, borderColor: sv.border }}>
                    {modalItem.severity}
                  </span>
                )
              })()}
            </div>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--ivory-50)', border: '1px solid var(--line)' }}>
              <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--ink-500)' }}>상세 설명</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--ink-700)' }}>{modalItem.description}</div>
            </div>
            <div className="rounded-xl px-4 py-3 mb-5"
              style={{ background: 'var(--ivory-50)', border: '1px solid var(--line)', borderLeft: '3px solid var(--green-600)' }}>
              <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--ink-700)' }}>교정 드릴</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-500)' }}>{modalItem.drill}</p>
            </div>
            <button onClick={() => setModalItem(null)}
              className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
              style={{ border: '1px solid var(--line)', color: 'var(--ink-700)', background: '#ffffff' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--ivory-50)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#ffffff' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
