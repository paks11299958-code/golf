import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  ...(credJson && {
    googleAuthOptions: {
      credentials: JSON.parse(credJson),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    }
  }),
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || '20')

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 }); return true }
  if (entry.count >= MAX_REQUESTS_PER_HOUR) return false
  entry.count++
  return true
}

const RESULT_SCHEMA = `{
  "summary": {
    "overallScore": 숫자(0-100),
    "swingType": "스윙 특성 (짧게)",
    "mainIssue": "주요 개선점 (한줄)",
    "improvementLevel": "높음|중간|낮음"
  },
  "phaseScores": {
    "어드레스": 숫자(0-100),
    "백스윙": 숫자(0-100),
    "탑": 숫자(0-100),
    "다운스윙": 숫자(0-100),
    "임팩트": 숫자(0-100),
    "폴로스루": 숫자(0-100)
  },
  "issues": [
    {
      "part": "어드레스|백스윙|다운스윙|임팩트|폴로스루|피니시",
      "issue": "문제점 이름 (짧게)",
      "description": "왜 문제인지 + 어떤 미스샷으로 이어지는지 (40자 이내)",
      "severity": "높음|중간|낮음",
      "drill": "즉시 실행 가능한 감각적 드릴 (한줄)"
    }
  ],
  "strengths": ["구체적 강점1", "구체적 강점2"],
  "aiSummary": "긍정적 요소 먼저 언급 후 핵심 개선점. 따뜻하고 격려하는 2문장.",
  "recommendation": "우선순위 1~3번 순서로 구체적 연습법과 기대 효과 포함. 3문장.",
  "disclaimer": "본 분석은 AI 기반 참고 자료입니다. 정확한 레슨은 전문 코치와 상담하세요."
}`

const SYSTEM_PROMPT = `당신은 20년 경력의 PGA 공인 골프 레슨 코치이자 AI 분석 전문가입니다.
따뜻하고 격려하는 말투로 구체적이고 실용적인 코칭을 제공합니다.

코칭 품질 기준:
- 관찰된 긍정적 요소를 반드시 먼저 언급하고 동기부여 표현 사용
- 문제점은 왜 문제인지 + 어떤 미스샷(슬라이스/훅/비거리 손실 등)으로 이어지는지 구체적으로
- 드릴은 "~느낌으로", "~까지만", "3초간 버티기" 등 즉시 실행 가능하게
- strengths는 실제 관찰된 장점을 구체적으로
- overallScore는 일반 아마추어 기준 50~70점대가 현실적
- 반드시 순수 JSON만 출력. 백틱/마크다운 절대 금지.`

interface GolferInfo {
  title?: string; gender?: string; age?: string; job?: string
  health?: string; purpose?: string; budget?: string
}

function formatGolferInfo(u?: GolferInfo): string {
  if (!u) return ''
  const parts: string[] = []
  if (u.gender) parts.push(`성별: ${u.gender}`)
  if (u.age) parts.push(`실력: ${u.age}`)
  if (u.job) parts.push(`개선목표: ${u.job}`)
  if (u.health) parts.push(`신체상태: ${u.health}`)
  if (u.purpose) parts.push(`주요문제: ${u.purpose}`)
  if (u.budget) parts.push(`사용클럽: ${u.budget}`)
  if (parts.length === 0) return ''
  return `\n\n[골퍼 정보 — 반드시 분석에 반영]\n${parts.join('\n')}`
}

function parseJSON(raw: string) {
  let clean = raw.replace(/```json\n?|```\n?/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1)
  try {
    return JSON.parse(clean)
  } catch {
    const opens = Array.from(clean).reduce((acc: string[], c: string) => {
      if (c === '{') acc.push('}')
      if (c === '[') acc.push(']')
      if (c === '}' || c === ']') acc.pop()
      return acc
    }, [])
    try { return JSON.parse(clean + opens.reverse().join('')) }
    catch { throw new Error('JSON 파싱 실패') }
  }
}

async function analyzeWithImages(
  images: { data: string; mediaType: string }[],
  fileNames: string[],
  golferInfo?: GolferInfo
) {
  const imageParts = images.slice(0, 8).map(img => ({
    inlineData: { data: img.data, mimeType: img.mediaType }
  }))

  const prompt = `${SYSTEM_PROMPT}

위 골프 스윙 이미지(${fileNames.join(', ')})를 전문 코치의 시각으로 분석하고 아래 JSON 형식으로만 응답하세요.
각 스윙 페이즈(어드레스, 백스윙, 탑스윙, 다운스윙, 임팩트, 폴로스루, 피니시)를 세밀히 관찰하고
구체적인 교정 포인트와 즉시 실행 가능한 드릴을 제공하세요.

${RESULT_SCHEMA}
${formatGolferInfo(golferInfo)}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [...imageParts, { text: prompt }] }],
  })

  return parseJSON(response.text ?? '')
}

async function analyzeWithText(text: string, fileNames: string[], golferInfo?: GolferInfo) {
  const prompt = `${SYSTEM_PROMPT}

골프 스윙 분석 요청 (파일: ${fileNames.join(', ')})
${text.slice(0, 8000)}

위 정보를 바탕으로 아래 JSON 형식으로만 응답하세요.
${RESULT_SCHEMA}
${formatGolferInfo(golferInfo)}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  return parseJSON(response.text ?? '')
}

function errJson(message: string, status: number) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(ip))
      return errJson('요청 한도 초과. 1시간 후 재시도하세요.', 429)
    if (!process.env.GOOGLE_CLOUD_PROJECT)
      return errJson('서버 설정 오류: Google Cloud 프로젝트 없음', 500)

    let body: {
      text?: string
      fileNames: string[]
      images?: { data: string; mediaType: string }[]
      userInfo?: GolferInfo
    }
    try {
      body = await req.json()
    } catch {
      return errJson('잘못된 요청 형식', 400)
    }

    if (!body.fileNames) return errJson('fileNames 필드가 없습니다.', 400)

    let result
    if (body.images && body.images.length > 0) {
      result = await analyzeWithImages(body.images, body.fileNames, body.userInfo)
    } else if (body.text && body.text.trim()) {
      result = await analyzeWithText(body.text, body.fileNames, body.userInfo)
    } else {
      return errJson('분석할 파일이 없습니다.', 400)
    }

    return NextResponse.json(result)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[analyze] 오류:', msg)

    if (msg.includes('timeout') || msg.includes('ETIMEDOUT'))
      return errJson('분석 시간 초과. 다시 시도해 주세요.', 504)
    if (msg.includes('429') || msg.includes('quota'))
      return errJson('API 요청 한도 초과. 잠시 후 다시 시도하세요.', 429)
    if (msg.includes('403') || msg.includes('permission'))
      return errJson('Vertex AI 권한 오류. Google Cloud 설정을 확인하세요.', 403)

    return errJson(`분석 오류: ${msg}`, 500)
  }
}
