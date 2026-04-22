'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { LogOut, LogIn, UserPlus, Menu, X, UploadCloud, FileText, Download, Printer, Bot } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface SwingIssue {
  part: string; issue: string; description: string; severity: string; drill: string
}
interface PhaseScores { 어드레스?: number; 백스윙?: number; 탑?: number; 다운스윙?: number; 임팩트?: number; 폴로스루?: number }
interface AnalysisResult {
  summary: { overallScore: number; swingType: string; mainIssue: string; improvementLevel: string }
  phaseScores?: PhaseScores
  issues: SwingIssue[]; strengths: string[]; aiSummary: string; recommendation: string; disclaimer: string
}
interface UploadedFile { file: File; name: string; size: number }
interface GolferInfo { title: string; gender: string; age: string; job: string; health: string; purpose: string; budget: string }
interface AuthUser { id: number; email: string; username?: string }

const STEPS = ['파일 변환 중...', 'Vertex AI가 스윙을 읽는 중...', '자세 분석 중...', '교정 포인트 추출 중...', '리포트 작성 중...']
const fmtSize = (b: number) => b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'
const isImage = (n: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(n)
const isVideo = (n: string) => /\.(mp4|mov|webm|avi|mkv)$/i.test(n)
const isPDF   = (n: string) => /\.pdf$/i.test(n)
const getMediaType = (n: string) => /\.png$/i.test(n) ? 'image/png' : /\.gif$/i.test(n) ? 'image/gif' : /\.webp$/i.test(n) ? 'image/webp' : 'image/jpeg'

function fileIcon(n: string) {
  if (isVideo(n)) return '🎬'
  if (isImage(n)) return '🖼️'
  if (isPDF(n)) return '📕'
  return '📄'
}
function fileTag(n: string) {
  if (isVideo(n)) return { label: 'VID', color: 'var(--tech-500)', bg: 'rgba(10,143,175,0.08)', border: 'rgba(10,143,175,0.25)' }
  if (isImage(n)) return { label: 'IMG', color: 'var(--signal-amber)', bg: 'rgba(209,155,26,0.08)', border: 'rgba(209,155,26,0.25)' }
  if (isPDF(n)) return { label: 'PDF', color: 'var(--signal-red)', bg: 'rgba(192,69,58,0.08)', border: 'rgba(192,69,58,0.25)' }
  return { label: 'TXT', color: 'var(--ink-700)', bg: 'var(--ivory-100)', border: 'var(--line)' }
}

async function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(((e.target?.result as string) || '').split(',')[1] || '')
    r.onerror = () => rej(new Error('파일 읽기 실패'))
    r.readAsDataURL(file)
  })
}
async function toText(file: File): Promise<string> {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = e => res((e.target?.result as string) || '')
    r.onerror = () => res('')
    r.readAsText(file, 'utf-8')
  })
}

async function extractVideoFrames(file: File, count = 6): Promise<{ data: string; mediaType: string }[]> {
  return new Promise(res => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      const duration = video.duration
      const times = Array.from({ length: count }, (_, i) => (duration / (count + 1)) * (i + 1))
      const frames: { data: string; mediaType: string }[] = []
      let idx = 0
      const capture = () => {
        if (idx >= times.length) { res(frames); return }
        video.currentTime = times[idx]
      }
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 640
          canvas.height = Math.round(640 * video.videoHeight / video.videoWidth)
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const b64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
          if (b64) frames.push({ data: b64, mediaType: 'image/jpeg' })
        } catch { /* noop */ }
        idx++
        capture()
      }
      video.onerror = () => res(frames)
      capture()
    }
    video.onerror = () => res([])
  })
}

const SKILL_LEVELS = ['초급', '중급', '고급', '프로']
const NAV_ITEMS = [{ href: '/', label: '홈' }, { href: '/analyze', label: '스윙 분석' }, { href: '/dashboard', label: '분석 내역' }]

const SV = {
  높음: { color: 'var(--signal-red)',   bg: 'rgba(192,69,58,0.08)',   border: 'rgba(192,69,58,0.25)' },
  중간: { color: 'var(--signal-amber)', bg: 'rgba(209,155,26,0.08)',  border: 'rgba(209,155,26,0.25)' },
  낮음: { color: 'var(--green-600)',    bg: 'rgba(53,113,50,0.08)',   border: 'rgba(53,113,50,0.25)' },
}
const levelColor = (s: string) => s === '높음' ? 'var(--signal-red)' : s === '중간' ? 'var(--signal-amber)' : 'var(--green-600)'

export default function AnalyzePage() {
  const [files, setFiles]             = useState<UploadedFile[]>([])
  const [dragging, setDragging]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [stepMsg, setStepMsg]         = useState(STEPS[0])
  const [stepIdx, setStepIdx]         = useState(0)
  const [error, setError]             = useState('')
  const [result, setResult]           = useState<AnalysisResult | null>(null)
  const [golferInfo, setGolferInfo]   = useState<GolferInfo>({ title: '', gender: '', age: '', job: '', health: '', purpose: '', budget: '' })
  const [authUser, setAuthUser]       = useState<AuthUser | null>(null)
  const [emptyFields, setEmptyFields] = useState<string[]>([])
  const [showEmptyWarning, setShowEmptyWarning] = useState(false)
  const [showLoginModal, setShowLoginModal]     = useState(false)
  const [restoredInfo, setRestoredInfo]         = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false)
  const [showAdditional, setShowAdditional]     = useState(false)
  const [autoTitle, setAutoTitle]     = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const ivRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const titleRef     = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      setAuthUser(u)
      if (u?.id) {
        const saved = sessionStorage.getItem('pendingUserInfo')
        if (saved) {
          try { const p = JSON.parse(saved); setGolferInfo(p); setRestoredInfo(true); sessionStorage.removeItem('pendingUserInfo') } catch { /* noop */ }
        }
      }
    }).catch(() => {})
  }, [])

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setAuthUser(null) }

  const MAX_FILES = 5
  const addFiles = useCallback((list: FileList | File[]) => {
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      const next = Array.from(list).filter(f => !names.has(f.name)).map(f => ({ file: f, name: f.name, size: f.size }))
      const merged = [...prev, ...next].slice(0, MAX_FILES)
      const vid = merged.filter(f => isVideo(f.name)).at(-1)
      setVideoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return vid ? URL.createObjectURL(vid.file) : null })
      return merged
    })
  }, [])

  const removeFile = (i: number) => {
    setFiles(prev => {
      const next = prev.filter((_, j) => j !== i)
      const vid = next.filter(f => isVideo(f.name)).at(-1)
      setVideoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return vid ? URL.createObjectURL(vid.file) : null })
      return next
    })
  }

  const handleAnalyzeClick = () => {
    if (!authUser) { setShowLoginModal(true); return }
    const required: (keyof GolferInfo)[] = ['title', 'gender', 'age']
    const empty = required.filter(k => !golferInfo[k].trim())
    if (empty.length > 0) { setEmptyFields(empty); setShowEmptyWarning(true); return }
    analyze()
  }
  const handleWarningProceed = () => {
    setShowEmptyWarning(false)
    if (!golferInfo.title.trim()) setGolferInfo(p => ({ ...p, title: '내 스윙 분석' }))
    analyze()
  }
  const handleWarningCancel = () => {
    setShowEmptyWarning(false)
    setTimeout(() => titleRef.current?.focus(), 50)
  }
  const handleLoginModalGo = (path: '/login' | '/register') => {
    sessionStorage.setItem('pendingUserInfo', JSON.stringify(golferInfo))
    window.location.href = `${path}?returnTo=/analyze`
  }

  const analyze = async () => {
    setError(''); setResult(null); setLoading(true); setStepIdx(0); setStepMsg(STEPS[0])
    let si = 0
    ivRef.current = setInterval(() => { si = (si + 1) % STEPS.length; setStepIdx(si); setStepMsg(STEPS[si]) }, 2000)
    try {
      const imgFiles = files.filter(f => isImage(f.name))
      const vidFiles = files.filter(f => isVideo(f.name))
      const txtFiles = files.filter(f => !isImage(f.name) && !isVideo(f.name) && !isPDF(f.name))
      const fileNames = files.map(f => f.name)
      let body: Record<string, unknown>

      if (imgFiles.length > 0) {
        setStepMsg('이미지에서 스윙 자세 분석 중...')
        const images = await Promise.all(imgFiles.map(async f => ({ data: await toBase64(f.file), mediaType: getMediaType(f.name) })))
        let extraText = ''
        for (const f of txtFiles) extraText += `\n\n=== ${f.name} ===\n${(await toText(f.file)).slice(0, 3000)}`
        body = { images, fileNames, text: extraText, userInfo: golferInfo }
      } else if (vidFiles.length > 0) {
        setStepMsg('영상에서 스윙 장면 추출 중...')
        const allFrames: { data: string; mediaType: string }[] = []
        for (const vf of vidFiles) {
          const frames = await extractVideoFrames(vf.file, 6)
          allFrames.push(...frames)
        }
        if (allFrames.length > 0) {
          setStepMsg('추출된 프레임으로 스윙 분석 중...')
          body = { images: allFrames, fileNames, userInfo: golferInfo }
        } else {
          // 프레임 추출 실패 시 텍스트 폴백
          body = { text: `[골프 스윙 영상: ${vidFiles.map(f => f.name).join(', ')}]`, fileNames, userInfo: golferInfo }
        }
      } else {
        let combined = ''
        for (const f of txtFiles) combined += `\n\n=== ${f.name} ===\n${(await toText(f.file)).slice(0, 4000)}`
        body = { text: combined, fileNames, userInfo: golferInfo }
      }

      setStepMsg('Vertex AI 스윙 분석 중...')
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `오류 ${res.status}`)
      setResult(data)
      if (authUser) {
        fetch('/api/analyses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userInfo: golferInfo, fileNames, result: data }) }).catch(() => {})
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      if (ivRef.current) clearInterval(ivRef.current)
      setLoading(false)
    }
  }

  const exportTxt = () => {
    if (!result) return
    const issueRows = result.issues.map(d => `${d.part}\t${d.issue}\t${d.severity}\t${d.drill}`).join('\n')
    const txt = [
      'Vertex AI 골프 스윙 분석 보고서', '='.repeat(44),
      `분석 일시: ${new Date().toLocaleString('ko-KR')}`, `파일: ${files.map(f => f.name).join(', ')}`, '',
      '[요약]',
      `• 종합 점수: ${result.summary.overallScore}점`,
      `• 스윙 특성: ${result.summary.swingType}`,
      `• 주요 개선점: ${result.summary.mainIssue}`,
      `• 개선 레벨: ${result.summary.improvementLevel}`, '',
      '[강점]', result.strengths.map(s => `• ${s}`).join('\n'), '',
      '[AI 요약]', result.aiSummary, '',
      '[교정 포인트]', '구간\t문제점\t심각도\t드릴', issueRows, '',
      '[권고사항]', result.recommendation, '',
      '[안내]', result.disclaimer,
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }))
    a.download = `골프스윙분석_${new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g, '-').replace(/-$/, '')}.txt`
    a.click()
  }

  const exportPdf = () => {
    if (!result) return
    const date = new Date().toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const sevClass = (s: string) => s === '높음' ? 'badge-high' : s === '중간' ? 'badge-mid' : 'badge-low'
    const issueRows = result.issues.length === 0
      ? `<tr><td colspan="5" style="text-align:center;color:#888;padding:8mm 0">교정이 필요한 항목이 발견되지 않았습니다</td></tr>`
      : result.issues.map(d => `<tr><td>${d.part}</td><td><strong>${d.issue}</strong><br/><span style="color:#888;font-size:8pt">${d.description}</span></td><td><span class="badge ${sevClass(d.severity)}">${d.severity}</span></td><td>${d.drill}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>AI 골프 스윙 분석 보고서</title><link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Pretendard',sans-serif;background:#fff;color:#1a1f1a;padding:18mm 20mm;font-size:10.5pt;line-height:1.6}.title-row{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #285a27;padding-bottom:3mm;margin-bottom:5mm}.title-row h1{font-size:17pt;font-weight:700;color:#285a27}.title-row .meta{font-size:8.5pt;color:#888;text-align:right;line-height:1.8}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:6mm}.card{border:1px solid #d8dcd5;border-radius:10px;padding:3.5mm 4mm;text-align:center}.card .val{font-size:16pt;font-weight:700;color:#285a27}.card .lbl{font-size:8pt;color:#8d9589;margin-top:1mm}.section-title{font-size:9pt;font-weight:600;color:#3d443d;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2.5mm;margin-top:5mm}.ai-box{background:#f2f7f1;border:1px solid #c7dec3;border-left:3px solid #285a27;border-radius:10px;padding:4mm 5mm;font-size:9.5pt;line-height:1.8;color:#3d443d;margin-bottom:5mm}table{width:100%;border-collapse:collapse;margin-bottom:5mm;font-size:8.5pt}th{background:#f2f7f1;border:1px solid #d8dcd5;padding:2mm 3mm;text-align:left;font-weight:600;color:#6c7569;white-space:nowrap}td{border:1px solid #d8dcd5;padding:2.5mm 3mm;vertical-align:top;color:#3d443d}tr:nth-child(even) td{background:#fbfaf5}.badge{display:inline-block;padding:0.5mm 2.5mm;border-radius:6px;font-size:8pt;font-weight:500}.badge-high{background:#fde8e8;color:#c0453a}.badge-mid{background:#fef3c7;color:#d19b1a}.badge-low{background:#e4efe2;color:#285a27}.rec-box{background:#f2f7f1;border:1px solid #c7dec3;border-left:3px solid #285a27;border-radius:10px;padding:4mm 5mm;font-size:9.5pt;line-height:1.9;color:#3d443d;margin-bottom:4mm}.disc{font-size:8pt;color:#8d9589;border:1px solid #d8dcd5;border-radius:8px;padding:3mm 4mm}@media print{body{padding:12mm 14mm}@page{margin:10mm}}</style></head><body><div class="title-row"><h1>AI 골프 스윙 분석 보고서</h1><div class="meta">분석 일시: ${date}<br/>파일: ${files.map(f => f.name).join(', ')}</div></div><div class="cards"><div class="card"><div class="val">${result.summary.overallScore}점</div><div class="lbl">종합 점수</div></div><div class="card"><div class="val">${result.issues.length}개</div><div class="lbl">교정 포인트</div></div><div class="card"><div class="val">${result.strengths.length}개</div><div class="lbl">강점</div></div><div class="card"><div class="val">${result.summary.improvementLevel}</div><div class="lbl">개선 가능성</div></div></div><div class="section-title">AI 스윙 요약</div><div class="ai-box">${result.aiSummary}</div><div class="section-title">교정 포인트</div><table><thead><tr><th>구간</th><th>문제점</th><th>심각도</th><th>교정 드릴</th></tr></thead><tbody>${issueRows}</tbody></table><div class="section-title">AI 권고사항</div><div class="rec-box">${result.recommendation}</div><div class="disc">${result.disclaimer}</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500))</script></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ivory-50)', color: 'var(--ink-900)' }}>

      {/* GNB */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--green-600)' }}>Vertex AI</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: '#5F6368' }}>Golf Coach</span>
            </span>
          </Link>

          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                style={item.href === '/analyze'
                  ? { padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 700, color: 'var(--green-700)', background: 'var(--green-50)', textDecoration: 'none' }
                  : { padding: '8px 16px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (item.href !== '/analyze') { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--ink-900)'; el.style.background = 'var(--ivory-100)' } }}
                onMouseLeave={e => { if (item.href !== '/analyze') { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--fg-muted)'; el.style.background = 'transparent' } }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--r-xl)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <LogOut size={11} /> 로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ padding: '6px 12px', borderRadius: 'var(--r-xl)', fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', textDecoration: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={13} />로그인</span>
                </Link>
                <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, background: 'var(--green-700)', color: '#fff', textDecoration: 'none' }}>
                  <UserPlus size={13} /> 무료 시작
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(v => !v)}
            style={{ padding: 8, borderRadius: 'var(--r-md)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-700)', cursor: 'pointer' }}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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
                    <Link href="/login" style={{ display: 'block', padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, color: 'var(--ink-700)', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                    <Link href="/register" style={{ display: 'block', marginTop: 8, padding: '12px 16px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#fff', background: 'var(--green-700)', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>무료 시작</Link>
                  </>
              }
            </div>
          </div>
        )}
      </nav>

      {/* 본문 */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* 페이지 헤더 */}
        <header style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 'var(--r-full)', background: 'var(--green-50)', border: '1px solid var(--green-200)', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-600)', display: 'inline-block', animation: 'pulse 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-700)', letterSpacing: '0.06em' }}>Vertex AI 기술 기반 골프 분석 서비스</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.03em', color: 'var(--ink-900)', margin: '0 0 12px' }}>
            내 골프 스윙을<br />AI 코치가 분석합니다
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--fg-muted)', margin: '0 0 16px' }}>
            스윙 영상이나 사진을 업로드하면 AI가 자세를 분석하고<br className="hidden sm:block" />교정 포인트와 맞춤 드릴을 제공합니다
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: '🎬 영상', color: 'var(--tech-500)', bg: 'rgba(10,143,175,0.06)', border: 'rgba(10,143,175,0.2)' },
              { label: '🖼️ 사진', color: 'var(--signal-amber)', bg: 'rgba(209,155,26,0.06)', border: 'rgba(209,155,26,0.2)' },
              { label: '📕 PDF', color: 'var(--signal-red)', bg: 'rgba(192,69,58,0.06)', border: 'rgba(192,69,58,0.2)' },
              { label: '📄 TXT', color: 'var(--ink-700)', bg: 'var(--ivory-100)', border: 'var(--line)' },
            ].map((t, i) => (
              <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 'var(--r-full)', border: `1px solid ${t.border}`, color: t.color, background: t.bg }}>{t.label}</span>
            ))}
          </div>
        </header>

        {/* [1] 제목 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>분석 제목 <span style={{ color: 'var(--signal-red)' }}>*</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoTitle}
                onChange={e => { setAutoTitle(e.target.checked); setGolferInfo(p => ({ ...p, title: e.target.checked ? '내 스윙 분석' : '' })) }}
                style={{ width: 12, height: 12, accentColor: 'var(--green-600)', cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>자동입력</span>
            </label>
          </div>
          <input
            ref={titleRef}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white"
            style={{ border: emptyFields.includes('title') ? '1.5px solid var(--signal-red)' : '1px solid var(--line)', color: 'var(--ink-900)' }}
            value={golferInfo.title}
            onChange={e => { setAutoTitle(false); setGolferInfo(p => ({ ...p, title: e.target.value })); setEmptyFields(p => p.filter(f => f !== 'title')) }}
            placeholder="예: 드라이버 스윙 분석"
          />
        </div>

        {/* [2] 골퍼 정보 */}
        <div style={{ marginBottom: 16, borderRadius: 'var(--r-xl)', overflow: 'hidden', background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--green-600)', display: 'inline-block' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>골퍼 정보</span>
              <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>정보를 입력할수록 더 맞춤화된 분석이 제공됩니다</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>성별 <span style={{ color: 'var(--signal-red)' }}>*</span></label>
                <div style={{ display: 'flex', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: emptyFields.includes('gender') ? '1.5px solid var(--signal-red)' : '1px solid var(--line)' }}>
                  {['남성', '여성'].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => { setGolferInfo(p => ({ ...p, gender: opt })); setEmptyFields(p => p.filter(x => x !== 'gender')) }}
                      style={{ flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', ...(golferInfo.gender === opt ? { background: 'var(--green-700)', color: '#fff' } : { background: '#fff', color: 'var(--fg-muted)' }) }}>
                      {opt === '남성' ? '♂ 남성' : '♀ 여성'}
                    </button>
                  ))}
                </div>
                {emptyFields.includes('gender') && <p style={{ fontSize: 11, color: 'var(--signal-red)', marginTop: 4 }}>성별을 선택해 주세요</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>실력 레벨 <span style={{ color: 'var(--signal-red)' }}>*</span></label>
                <div style={{ display: 'flex', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: emptyFields.includes('age') ? '1.5px solid var(--signal-red)' : '1px solid var(--line)' }}>
                  {SKILL_LEVELS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => { setGolferInfo(p => ({ ...p, age: opt })); setEmptyFields(p => p.filter(x => x !== 'age')) }}
                      style={{ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', ...(golferInfo.age === opt ? { background: 'var(--green-700)', color: '#fff' } : { background: '#fff', color: 'var(--fg-muted)' }) }}>
                      {opt}
                    </button>
                  ))}
                </div>
                {emptyFields.includes('age') && <p style={{ fontSize: 11, color: 'var(--signal-red)', marginTop: 4 }}>실력 레벨을 선택해 주세요</p>}
              </div>
            </div>

            {/* 추가 정보 토글 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', width: 'fit-content' }}>
              <div style={{ width: 36, height: 20, borderRadius: 'var(--r-full)', position: 'relative', transition: 'background 0.2s', background: showAdditional ? 'var(--green-600)' : 'var(--ink-200)', cursor: 'pointer' }}
                onClick={() => setShowAdditional(v => !v)}>
                <div style={{ position: 'absolute', top: 2, left: showAdditional ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>추가 정보 입력 (더 정확한 분석)</span>
            </label>

            <div style={{ overflow: 'hidden', transition: 'all 0.3s', maxHeight: showAdditional ? 400 : 0, opacity: showAdditional ? 1 : 0, marginTop: showAdditional ? 16 : 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: '개선 목표', key: 'job', placeholder: '예: 드라이버 거리 향상' },
                  { label: '신체 상태', key: 'health', placeholder: '예: 허리 약함' },
                  { label: '주요 문제', key: 'purpose', placeholder: '예: 슬라이스, 생크' },
                  { label: '사용 클럽', key: 'budget', placeholder: '예: 드라이버, 7번 아이언' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>{f.label}</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white"
                      style={{ border: '1px solid var(--line)', color: 'var(--ink-900)' }}
                      value={golferInfo[f.key as keyof GolferInfo]}
                      onChange={e => setGolferInfo(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* [3] 업로드 */}
        <div style={{ marginBottom: 16, borderRadius: 'var(--r-xl)', overflow: 'hidden', background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--green-600)', display: 'inline-block' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>스윙 영상·사진 업로드</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8, fontSize: 12, padding: '7px 14px', borderRadius: 'var(--r-full)', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
              <span>🛡️</span>
              <span style={{ fontWeight: 600, color: 'var(--green-700)' }}>Vertex AI 분석이라 구글의 모델 학습에 절대 사용되지 않습니다.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: 'var(--fg-subtle)' }}>
              <span>🔒</span><span>업로드된 파일은 Vertex AI 분석에만 사용되며 저장되지 않습니다.</span>
            </div>

            {/* Video preview */}
            {videoPreview && (
              <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--tech-100)', marginBottom: 14, position: 'relative', background: '#000' }}>
                <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 2 }}>
                  <span className="chip tech dot" style={{ fontSize: 10 }}>스윙 영상 미리보기</span>
                </div>
                <video src={videoPreview} controls muted style={{ width: '100%', maxHeight: 220, display: 'block', objectFit: 'contain' }} />
              </div>
            )}

            {/* Dropzone */}
            <div
              style={{ borderRadius: 'var(--r-xl)', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', border: `2px dashed ${dragging ? 'var(--green-500)' : 'var(--ink-200)'}`, background: dragging ? 'var(--green-50)' : 'var(--ivory-50)' }}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={e => { if (!dragging) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--green-400)'; el.style.background = 'var(--green-50)' } }}
              onMouseLeave={e => { if (!dragging) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--ink-200)'; el.style.background = 'var(--ivory-50)' } }}>
              <input ref={fileInputRef} type="file" multiple
                accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.avi,.mkv"
                style={{ display: 'none' }}
                onChange={e => e.target.files && addFiles(e.target.files)} />
              <div style={{ width: 52, height: 52, borderRadius: 'var(--r-xl)', background: dragging ? 'var(--green-100)' : 'var(--ivory-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <UploadCloud size={24} color={dragging ? 'var(--green-600)' : 'var(--ink-400)'} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink-700)' }}>드래그하거나 클릭하여 업로드</p>
              <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>🎬 MP4 · MOV · JPG · PNG · GIF · WEBP · 최대 5개</p>
            </div>

            {/* 파일 목록 */}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {files.map((f, i) => {
                  const tag = fileTag(f.name)
                  return (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-lg)', background: 'var(--ivory-50)', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 18 }}>{fileIcon(f.name)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-700)' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{fmtSize(f.size)}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 'var(--r-md)', border: `1px solid ${tag.border}`, color: tag.color, background: tag.bg, fontWeight: 600, flexShrink: 0 }}>
                        {tag.label}
                      </span>
                      <button style={{ padding: 4, borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--fg-subtle)', border: 'none', background: 'transparent', transition: 'color 0.15s' }}
                        onClick={() => removeFile(i)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--signal-red)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--fg-subtle)'}>
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 복원 알림 */}
        {restoredInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--r-xl)', padding: '12px 16px', fontSize: 12, marginBottom: 16, background: 'var(--green-50)', border: '1px solid var(--green-200)', color: 'var(--green-700)' }}>
            <span>✅</span><span>이전 입력 정보를 복원했습니다. 파일을 다시 업로드해 주세요.</span>
            <button style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--fg-subtle)', background: 'transparent', border: 'none' }} onClick={() => setRestoredInfo(false)}>✕</button>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div style={{ borderRadius: 'var(--r-xl)', padding: '12px 16px', fontSize: 14, marginBottom: 16, background: 'rgba(192,69,58,0.06)', border: '1px solid rgba(192,69,58,0.2)', color: 'var(--signal-red)' }}>{error}</div>
        )}

        {/* 분석 버튼 */}
        <div className="no-print" style={{ marginBottom: 24 }}>
          <button
            disabled={files.length === 0 || loading}
            onClick={handleAnalyzeClick}
            style={{ width: '100%', padding: '16px 0', borderRadius: 'var(--r-full)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: files.length === 0 || loading ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.3s', ...(files.length === 0 || loading ? { background: 'var(--ivory-200)', color: 'var(--ink-300)' } : { background: 'var(--green-700)', color: '#fff', boxShadow: '0 4px 20px rgba(40,90,39,0.3)' }) }}
            onMouseEnter={e => { if (files.length === 0 || loading) return; const el = e.currentTarget as HTMLElement; el.style.background = 'var(--green-800)'; el.style.transform = 'scale(1.01)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = files.length === 0 || loading ? 'var(--ivory-200)' : 'var(--green-700)'; el.style.transform = 'scale(1)' }}>
            <span style={{ fontSize: 18 }}>{loading ? '⏳' : '⛳'}</span>
            {loading ? 'Vertex AI 분석 중...' : 'Vertex AI 스윙 분석 시작'}
          </button>
          {!authUser && files.length > 0 && (
            <p style={{ textAlign: 'center', fontSize: 12, marginTop: 8, color: 'var(--fg-subtle)' }}>
              🔐 로그인 후 분석 결과를 저장하고 언제든 다시 확인할 수 있습니다
            </p>
          )}
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 'var(--r-xl)', background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: 4, borderRadius: 2, background: i === stepIdx ? 'var(--green-600)' : 'var(--ivory-200)', height: 28, animation: `stepBounce .8s ease-in-out ${i * .12}s infinite` }} />
              ))}
            </div>
            <style>{`@keyframes stepBounce { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.6)} }`}</style>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--ink-900)' }}>Vertex AI가 스윙을 분석하고 있습니다</p>
            <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '0 0 16px' }}>{stepMsg}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {STEPS.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', transition: 'background 0.2s', background: i === stepIdx ? 'var(--green-600)' : 'var(--ivory-200)' }} />
              ))}
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div id="result-section" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 4px' }}>스윙 분석 완료</h2>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {new Date().toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · 파일 {files.length}개
                </div>
              </div>
              <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[{ label: 'TXT', icon: <Download size={11} />, fn: exportTxt }, { label: 'PDF', icon: <FileText size={11} />, fn: exportPdf }, { label: '인쇄', icon: <Printer size={11} />, fn: () => window.print() }].map((b, i) => (
                  <button key={i} onClick={b.fn}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--r-lg)', fontSize: 12, border: '1px solid var(--line)', color: 'var(--ink-700)', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--ivory-100)'; el.style.borderColor = 'var(--green-300)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = 'var(--line)' }}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 요약 지표 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }} className="sm:grid-cols-4">
              {[
                { value: `${result.summary.overallScore}점`, label: '종합 점수', color: 'var(--green-600)' },
                { value: result.issues.length, label: '교정 포인트', color: 'var(--signal-red)' },
                { value: result.strengths.length, label: '강점', color: 'var(--tech-500)' },
                { value: result.summary.improvementLevel, label: '개선 가능성', color: levelColor(result.summary.improvementLevel) },
              ].map((m, i) => (
                <div key={i} style={{ borderRadius: 'var(--r-xl)', padding: '16px 12px', textAlign: 'center', background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: m.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* 스윙 레이더 차트 */}
            {result.phaseScores && (
              <div style={{ marginBottom: 20, borderRadius: 'var(--r-xl)', padding: '20px 16px', background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 12, textAlign: 'center' }}>스윙 페이즈 분석</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={Object.entries(result.phaseScores).map(([k, v]) => ({ phase: k, score: v }))}>
                    <PolarGrid stroke="var(--line)" />
                    <PolarAngleAxis dataKey="phase" tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--ink-700)' }} />
                    <Radar dataKey="score" stroke="var(--green-600)" fill="var(--green-600)" fillOpacity={0.2} dot={{ r: 4, fill: 'var(--green-600)' }} label={{ fontSize: 11, fontWeight: 700, fill: 'var(--green-700)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 스윙 특성 */}
            <div style={{ marginBottom: 16, borderRadius: 'var(--r-xl)', padding: '14px 20px', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: 6 }}>스윙 특성</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{result.summary.swingType}</span>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>· 주요 개선점: {result.summary.mainIssue}</span>
              </div>
            </div>

            {/* AI 요약 */}
            <div style={{ marginBottom: 20, borderRadius: 'var(--r-xl)', padding: 20, background: '#fff', border: '1px solid var(--line)', borderLeft: '3px solid var(--green-600)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Bot size={14} color="var(--ink-700)" />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-700)' }}>AI 스윙 요약</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.85, whiteSpace: 'pre-wrap', color: 'var(--fg-muted)', margin: 0 }}>{result.aiSummary}</p>
            </div>

            {/* 강점 */}
            {result.strengths.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, color: 'var(--fg-subtle)' }}>강점</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.strengths.map((s, i) => (
                    <span key={i} style={{ padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 13, background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-200)', fontWeight: 500 }}>
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 교정 포인트 테이블 */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, color: 'var(--fg-subtle)' }}>교정 포인트</div>
            <div style={{ overflowX: 'auto', marginBottom: 20, borderRadius: 'var(--r-xl)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: 'var(--ivory-100)' }}>
                    {['구간', '문제점', '설명', '심각도', '교정 드릴'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', color: 'var(--fg-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.issues.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-subtle)' }}>교정이 필요한 항목이 발견되지 않았습니다 🎉</td></tr>
                    : result.issues.map((d, i) => {
                        const sv = SV[d.severity as keyof typeof SV] || SV['낮음']
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--ivory-100)', transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-50)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                            <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{d.part}</td>
                            <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                              <strong style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{d.issue}</strong>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 12, verticalAlign: 'top', color: 'var(--fg-muted)' }}>{d.description}</td>
                            <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600, border: `1px solid ${sv.border}`, color: sv.color, background: sv.bg }}>{d.severity}</span>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 12, verticalAlign: 'top', color: 'var(--ink-700)' }}>{d.drill}</td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>

            {/* AI 권고사항 */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, color: 'var(--fg-subtle)' }}>AI 코치 권고사항</div>
            <div style={{ borderRadius: 'var(--r-xl)', padding: '16px 20px', fontSize: 14, lineHeight: 1.85, marginBottom: 12, background: 'var(--green-50)', border: '1px solid var(--green-200)', borderLeft: '3px solid var(--green-600)', color: 'var(--ink-700)' }}>
              {result.recommendation}
            </div>
            <div style={{ fontSize: 12, borderRadius: 'var(--r-xl)', padding: '12px 16px', marginBottom: 32, color: 'var(--fg-muted)', background: 'var(--ivory-100)', border: '1px solid var(--line)' }}>
              {result.disclaimer}
            </div>
          </div>
        )}

        {/* 푸터 */}
        <footer style={{ textAlign: 'center', marginTop: 32, fontSize: 12, lineHeight: 1.8, color: 'var(--ink-300)', borderTop: '1px solid var(--ivory-200)', paddingTop: 24 }}>
          <p style={{ margin: 0 }}>golf.dbzone.kr · Vertex AI 기술 기반 골프 스윙 분석 서비스</p>
          <p style={{ margin: 0 }}>본 서비스는 참고용이며, 정확한 레슨은 전문 코치와 상담하세요.</p>
        </footer>
      </div>

      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px', background: 'rgba(26,31,26,0.5)' }}
          onClick={() => setShowLoginModal(false)}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: '24px 24px 0 0', padding: 24, boxShadow: 'var(--shadow-lg)', background: '#fff', border: '1px solid var(--line)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--r-xl)', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>⛳</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--ink-900)' }}>로그인이 필요한 서비스입니다</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-muted)', margin: 0 }}>분석 결과를 저장하고<br />언제든 다시 확인할 수 있습니다.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleLoginModalGo('/login')}
                style={{ width: '100%', padding: '14px 0', borderRadius: 'var(--r-full)', fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'var(--green-700)', color: '#fff', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-800)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-700)'}>로그인하기</button>
              <button onClick={() => handleLoginModalGo('/register')}
                style={{ width: '100%', padding: '14px 0', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-700)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-100)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>회원가입하기</button>
              <button onClick={() => setShowLoginModal(false)}
                style={{ width: '100%', padding: '10px 0', fontSize: 14, cursor: 'pointer', color: 'var(--fg-muted)', background: 'transparent', border: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink-700)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)'}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 경고 모달 */}
      {showEmptyWarning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px', background: 'rgba(26,31,26,0.5)' }}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: '24px 24px 0 0', padding: 24, boxShadow: 'var(--shadow-lg)', background: '#fff' }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--ink-900)', fontSize: 15 }}>⚠️ 입력되지 않은 항목</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                {emptyFields.map(f => {
                  const labels: Record<string, string> = { title: '분석 제목', gender: '성별', age: '실력 레벨' }
                  return <li key={f} style={{ color: 'var(--signal-amber)' }}>· {labels[f] || f}</li>
                })}
              </ul>
              <p style={{ color: 'var(--fg-muted)', margin: 0 }}>정보 없이 계속 진행하시겠습니까?</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={handleWarningCancel}
                style={{ padding: '13px 0', borderRadius: 'var(--r-full)', fontSize: 14, cursor: 'pointer', background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-700)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ivory-100)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>입력하러 가기</button>
              <button onClick={handleWarningProceed}
                style={{ padding: '13px 0', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'var(--green-700)', color: '#fff', border: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-800)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--green-700)'}>계속 진행</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
