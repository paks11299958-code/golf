import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const registerRateMap = new Map<string, { count: number; resetAt: number }>()
function checkRegisterRate(ip: string): boolean {
  const now = Date.now()
  const entry = registerRateMap.get(ip)
  if (!entry || now > entry.resetAt) { registerRateMap.set(ip, { count: 1, resetAt: now + 3600_000 }); return true }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRegisterRate(ip))
    return NextResponse.json({ error: '회원가입 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 })

  try {
    const { email, password, username } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })

    if (password.length < 6)
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists)
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed, username: username || null },
    })

    return NextResponse.json({ id: user.id, email: user.email, username: user.username }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: '회원가입 오류가 발생했습니다.' }, { status: 500 })
  }
}
