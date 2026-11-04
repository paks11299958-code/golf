'use client'
import { useEffect, useState } from 'react'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// 설치 창은 메뉴를 열기 전에 올 수 있어 화면이 열릴 때부터 받아 둔다.
let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallEvent })
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach(f => f()) })
}

// 휴대폰 홈 화면 바로가기. 설치 창을 지원하는 브라우저는 바로 띄우고, 나머지는 메뉴 위치를 안내한다.
function manualGuide(userAgent: string) {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return '사파리 아래쪽 공유 단추를 누른 뒤 "홈 화면에 추가"를 고르세요.'
  if (/SamsungBrowser/i.test(userAgent)) return '삼성 인터넷 메뉴(≡)에서 "현재 페이지 추가", "홈 화면"을 고르세요.'
  if (/Android/i.test(userAgent)) return '브라우저 메뉴(⋮)에서 "홈 화면에 추가"를 고르세요.'
  return '브라우저 주소창 오른쪽의 설치 단추나 메뉴에서 바로가기를 추가하세요.'
}

export default function InstallShortcut() {
  const [guide, setGuide] = useState('')
  const [installed, setInstalled] = useState(false)
  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    const done = () => { setInstalled(true); setGuide('') }
    listeners.add(done)
    return () => { listeners.delete(done) }
  }, [])
  if (installed) return null
  const save = async () => {
    const event = deferred
    if (!event) { setGuide(g => g ? '' : manualGuide(navigator.userAgent)); return }
    deferred = null // 설치 창은 이벤트 한 번에 한 번만 띄울 수 있다.
    try { await event.prompt(); await event.userChoice } catch { setGuide(manualGuide(navigator.userAgent)) }
  }
  return <>
    <button type="button" onClick={save} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, textAlign: 'left', color: 'var(--ink-700)', background: 'transparent', border: 'none', cursor: 'pointer' }}>바로가기 저장</button>
    {guide && <p role="status" style={{ margin: '0 16px 4px', padding: '8px 12px', borderRadius: 'var(--r-md)', fontSize: 13, lineHeight: 1.6, background: 'var(--green-100)', color: 'var(--ink-700)' }}>{guide}</p>}
  </>
}
